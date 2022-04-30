const { findIndex } = require("lodash");
const fetch = require("node-fetch");
const fs = require("fs");
const History = require("../models/History.js");
const Logger = require("../handlers/logger.js");
const { SettingsClean } = require("./settings-cleaner.service");
const Spool = require("../models/Filament.js");
const {
  filamentManagerReSync
} = require("../services/octoprint/utils/filament-manager-plugin.utils");
const MjpegDecoder = require("mjpeg-decoder");
const { downloadImage, downloadFromOctoPrint } = require("../utils/download.util");
const { getHistoryCache } = require("../cache/history.cache");
const { writePoints } = require("./influx-export.service.js");
const { DEFAULT_SPOOL_DENSITY, DEFAULT_SPOOL_RATIO } = require("../constants/cleaner.constants");
const { OctoprintApiClientService } = require("./octoprint/octoprint-api-client.service");
const { sleep } = require("../utils/promise.utils");
const { clonePayloadDataForHistory } = require("../utils/mapping.utils");

const logger = new Logger("OctoFarm-HistoryCollection");

const routeBase = "../images/historyCollection";
const PATHS = {
  base: routeBase,
  thumbnails: routeBase + "/thumbs",
  snapshots: routeBase + "/snapshots",
  timelapses: routeBase + "/timelapses"
};

/**
 * Make a specific historyCollection folder if not created yet
 */
function ensureFolderExists(folder) {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
}

/**
 * Make the historyCollection root folder if not created yet
 */
function ensureBaseFolderExists() {
  ensureFolderExists(PATHS.base);
}

class HistoryCaptureService {
  // Record Data
  #printerName = null;
  #printerID = null;
  #activeControlUser = null;
  #printerGroup = null;
  #costSettings = null;
  #success = null;
  #reason = null;
  #fileName = null;
  #filePath = null;
  #startDate = null;
  #endDate = null;
  #printTime = null;
  #filamentSelection = null;
  #job = null;
  #notes = "";
  #snapshot = "";
  #timelapse = "";
  #thumbnail = "";
  #resends = null;

  // Additional fields from constructor, required in filament/snapshot/timelapse/thumbnail calls.
  #historyRecordID = null;
  #printerAPIConnector = null;
  #printerURL = null;
  #apikey = null;
  #timeout = null;
  #selectedFilament = null;
  #payload = null;
  #files = null;
  #camURL = null;

  constructor(eventPayload, capturedPrinterData, state) {
    const { payloadData, printer, job, files, resendStats, activeControlUser } = clonePayloadDataForHistory(
      eventPayload,
      capturedPrinterData
    );

    this.#printerName = printer.printerName;
    this.#printerID = printer._id;
    this.#printerGroup = printer.group;
    this.#costSettings = printer.costSettings;
    this.#success = state;
    this.#reason = eventPayload.reason;
    this.#fileName = eventPayload.name;
    this.#filePath = eventPayload.path;
    this.#activeControlUser = activeControlUser;

    const { startDate, endDate } = this.generateStartEndDates(payloadData);
    this.#startDate = startDate;
    this.#endDate = endDate;
    this.#printTime = Math.round(payloadData.time);
    this.#job = job;
    this.#resends = resendStats;
    this.#printerURL = printer.printerURL;
    this.#apikey = printer.apikey;
    this.#timeout = printer.timeout;
    this.#filamentSelection = printer.selectedFilament;
    this.#payload = payloadData;
    this.#files = files;
    this.#camURL = printer.camURL;
    this.#selectedFilament = printer.selectedFilament;

    this.#printerAPIConnector = new OctoprintApiClientService(
      printer.printerURL,
      printer.apikey,
      printer.timeout
    );
  }

  async createHistoryRecord() {
    // Save the initial history record with constucted values...
    const printHistory = {
      printerName: this.#printerName,
      printerID: this.#printerID,
      printerGroup: this.#printerGroup,
      costSettings: this.#costSettings,
      success: this.#success,
      reason: this.#reason,
      fileName: this.#fileName,
      filePath: this.#filePath,
      startDate: this.#startDate,
      endDate: this.#endDate,
      printTime: this.#printTime,
      filamentSelection: this.#filamentSelection,
      job: this.#job,
      notes: this.#notes,
      snapshot: this.#snapshot,
      timelapse: this.#timelapse,
      thumbnail: this.#thumbnail,
      resends: this.#resends,
      activeControlUser: this.#activeControlUser
    };

    logger.warning(`${this.#success ? "Completed" : "Failed"} Print triggered - ${printHistory}`);

    // Create our history object
    const saveHistory = new History({
      printHistory
    });

    this.#historyRecordID = saveHistory._id.toString();
    // Save the initial value of the record...
    await saveHistory.save().catch((e) => {
      logger.error("Unable to save the history record to database...", e);
    });

    const serverSettingsCache = SettingsClean.returnSystemSettings();
    //If we're using the filament manager plugin... we need to grab the latest spool values to be saved from it.
    if (serverSettingsCache.filamentManager && Array.isArray(this.#selectedFilament)) {
      this.#filamentSelection = await this.resyncFilament();
      await History.findByIdAndUpdate(this.#historyRecordID, {
        $set: { "printHistory.filamentSelection": this.#filamentSelection }
      })
        .then(async () => {
          await getHistoryCache().initCache();
        })
        .catch((e) => {
          logger.error("Unable to update history filament record: ", e.toString());
        });
    }

    // Save initial history
    if (this.#success) {
      await this.checkForAdditionalSuccessProperties();
    }

    if (!this.#success) {
      await this.checkForAdditionalFailureProperties();
    }

    // await this.updateFilamentInfluxDB(
    //   printer.selectedFilament,
    //   printHistory,
    //   printer.selectedFilament,
    //   printer
    // );

    //await this.updateInfluxDB(saveHistory._id, "historyInformation", printer);
    setTimeout(async () => {
      // Re-generate history cache...
      await getHistoryCache().initCache();
    }, 5000);

    return {
      saveHistory
    };
  }

  async resyncFilament() {
    const returnSpools = [];
    for (const element of this.#selectedFilament) {
      if (element !== null) {
        const filamentID = element.spools.fmID;
        if (!filamentID) {
          logger.error(
            `Could not query OctoPrint FilamentManager for filament. FilamentID '${filamentID}' not found.`,
            element.spools
          );
        }
        const response = await this.#printerAPIConnector.getPluginFilamentManagerFilament(
          filamentID
        );

        logger.info(`${this.#printerURL}: spools fetched. Status: ${response.status}`);
        const sp = await response.json();

        const spoolID = element._id;
        const spoolEntity = await Spool.findById(spoolID);
        if (!spoolEntity) {
          logger.error(
            `Spool database entity by ID '${spoolID}' not found. Cant update filament.`,
            element
          );
          const profileID = JSON.stringify(spoolEntity.spools.profile);
          spoolEntity.spools = {
            name: sp.spool.name,
            profile: profileID,
            price: sp.spool.cost,
            weight: sp.spool.weight,
            used: sp.spool.used,
            tempOffset: sp.spool.temp_offset,
            fmID: sp.spool.id
          };
          logger.info(`${this.#printerURL}: updating... spool status ${spoolEntity.spools}`);
          spoolEntity.markModified("spools");
          await spoolEntity.save();
          returnSpools.push(spoolEntity);
        }
        return;
      }
    }

    const reSync = await filamentManagerReSync();
    // Return success
    logger.info(reSync);
    return returnSpools;
  }

  async grabThumbnail(url, thumbnail) {
    if (!url && !thumbnail) {
      logger.error("Unable to download thumbnail! No URL or thumbnail provided", {
        url,
        thumbnail
      });
      return "";
    }
    const thumbParts = thumbnail.split("/");
    const result = thumbParts[thumbParts.length - 1];
    const splitAgain = result.split("?");
    const filePath = `${PATHS.thumbnails}/${this.#historyRecordID}-${splitAgain[0]}`;

    ensureBaseFolderExists();
    ensureFolderExists(PATHS.thumbnails);

    await downloadImage(url, filePath, this.#apikey, () => {
      logger.info("Thumbnail downloaded from: ", { url });
      logger.info("Thumbnail saved as: ", { filePath });
    });

    return filePath;
  }

  async snapPictureOfPrinter() {
    if (!this.#camURL && this.#camURL === "") {
      logger.error("Unable to snap picture from camera, url doesn't exist!", {
        cameraURL: this.#camURL
      });
      return "";
    }
    ensureBaseFolderExists();
    ensureFolderExists(PATHS.snapshots);
    const decoder = MjpegDecoder.decoderForSnapshot(this.#camURL);
    const frame = await decoder.takeSnapshot();
    const filePath = `${PATHS.snapshots}/${this.#historyRecordID}-${this.#fileName}.jpg`;
    await fs.writeFileSync(filePath, frame);
    logger.info("Snapshot downloaded as: ", this.#camURL);
    logger.info("Snapshot saved as: ", filePath);
    return filePath;
  }

  async thumbnailCheck() {
    try {
      let runCapture = async () => {
        // grab Thumbnail if available.
        const currentFileIndex = findIndex(this.#files, (o) => {
          return o.name === this.#payload.name;
        });
        let base64Thumbnail = null;
        if (currentFileIndex > -1) {
          if (
            typeof this.#files[currentFileIndex] !== "undefined" &&
            this.#files[currentFileIndex].thumbnail !== null
          ) {
            base64Thumbnail = await this.grabThumbnail(
              `${this.#printerURL}/${this.#files[currentFileIndex].thumbnail}`,
              this.#files[currentFileIndex].thumbnail
            );
          }
        }
        return base64Thumbnail;
      };

      return runCapture();
    } catch (e) {
      logger.error("Couldn't capture thumbnail as requested!", e);
    }
  }

  async snapshotCheck() {
    // Use default settings if not present
    try {
      return this.snapPictureOfPrinter();
    } catch (e) {
      logger.error("Couldn't capture webcam snapshot as requested!", e);
    }
  }

  async timelapseCheck() {
    if (this.#payload?.time <= 10) {
      logger.warning("Print time too short, skipping timelapse grab...", {
        time: this.#payload?.time
      });
      return "";
    }

    const timeLapseCall = await this.#printerAPIConnector.getTimelapses(true);

    if (!timeLapseCall.ok) {
      logger.error("Time lapse call failed to contact OctoPrint... skipping timelapse grab...", {
        timeLapseCall
      });
      return "";
    }

    logger.info("Checking for timelapse...", this.#fileName);

    const timelapseResponse = await timeLapseCall.json();

    logger.info("Timelapse call: ", timelapseResponse);

    //is it unrendered?
    let cleanFileName = JSON.parse(JSON.stringify(this.#fileName));
    if (this.#fileName.includes(".gcode")) {
      cleanFileName = cleanFileName.replace(".gcode", "");
    }

    const unrenderedTimelapseIndex = timelapseResponse.unrendered.findIndex((o) =>
      o.name.includes(cleanFileName)
    );
    //if unrendered check timelapse again...
    logger.debug("Unrendered Index: ", {
      unrenderedTimelapseIndex,
      unrenderedList: timelapseResponse.unrendered
    });
    if (unrenderedTimelapseIndex > -1) {
      logger.warning("Timelapse not rendered yet... re-checking... in 5000ms", {
        unrenderedTimelapseIndex
      });
      await sleep(10000);
      await this.timelapseCheck();
    }

    await sleep(10000);

    const lastTimelapseIndex = timelapseResponse.files.findIndex((o) =>
      o.name.includes(cleanFileName)
    );
    logger.debug("rendered Index: ", {
      lastTimelapseIndex,
      renderedList: timelapseResponse.files
    });
    if (lastTimelapseIndex > -1) {
      return this.grabTimeLapse(
        timelapseResponse.files[lastTimelapseIndex].name,
        this.#printerURL + timelapseResponse.files[lastTimelapseIndex].url
      );
    }

    logger.error("Unable to determine correct timelapse file to download... skipped! ", {
      timelapseFiles: timelapseResponse.files
    });

    return "";
  }

  async grabTimeLapse(fileName, url) {
    ensureBaseFolderExists();
    ensureFolderExists(PATHS.timelapses);

    const filePath = `${PATHS.timelapses}/${this.#historyRecordID}-${fileName}`;

    await downloadFromOctoPrint(url, filePath, this.#apikey, async () => {
      const serverSettingsCache = SettingsClean.returnSystemSettings();
      if (serverSettingsCache?.history?.timelapse?.deleteAfter) {
        await sleep(30000);
        logger.info("Deleting time lapse from OctoPrint...", { url, filePath });
        await this.deleteTimeLapse(fileName);
        logger.info("Deleted timelapse from OctoPrint", { fileName });
      }
    });

    logger.info("Downloaded timelapse from: ", { url });
    logger.info("Saved timelapse to: ", { filePath });
    await History.findByIdAndUpdate(this.#historyRecordID, {
      $set: { "printHistory.timelapse": filePath }
    })
      .then(async () => {
        await getHistoryCache().initCache();
      })
      .catch((e) => {
        logger.error("Unable to update history timelapse record: ", e.toString());
      });

    return filePath;
  }

  async deleteTimeLapse(fileName) {
    return fetch(`${this.#printerURL}/api/timelapse/${fileName}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": this.#apikey
      }
    });
  }

  async objectCleanforInflux(obj) {
    for (const propName in obj) {
      if (obj[propName] === null) {
        delete obj[propName];
      }
    }
  }

  async updateInfluxDB(historyID, measurement, printer) {
    try {
      let historyArchive = getHistoryCache().historyClean;
      let currentArchive = findIndex(historyArchive, function (o) {
        return JSON.stringify(o._id) === JSON.stringify(historyID);
      });
      if (currentArchive <= -1) {
        return;
      }
      let workingHistory = historyArchive[currentArchive];
      let currentState = " ";
      if (workingHistory.state.includes("Success")) {
        currentState = "Success";
      } else if (workingHistory.state.includes("Cancelled")) {
        currentState = "Cancelled";
      } else if (workingHistory.state.includes("Failure")) {
        currentState = "Failure";
      }
      let group;
      if (printer.group === "") {
        group = " ";
      } else {
        group = printer.group;
      }
      const tags = {
        printer_name: workingHistory.printer,
        group: group,
        url: printer.printerURL,
        history_state: currentState,
        file_name: workingHistory.file.name
      };
      let printerData = {
        id: String(workingHistory._id),
        index: parseInt(workingHistory.index),
        state: currentState,
        printer_name: workingHistory.printer,
        start_date: new Date(workingHistory.startDate),
        end_date: new Date(workingHistory.endDate),
        print_time: parseInt(workingHistory.printTime),
        file_name: workingHistory.file.name,
        file_upload_date: parseFloat(workingHistory.file.uploadDate),
        file_path: workingHistory.file.path,
        file_size: parseInt(workingHistory.file.size),

        notes: workingHistory.notes,
        job_estimated_print_time: parseFloat(workingHistory.job.estimatedPrintTime),
        job_actual_print_time: parseFloat(workingHistory.job.actualPrintTime),

        cost_printer: parseFloat(workingHistory.printerCost),
        cost_spool: parseFloat(workingHistory.spoolCost),
        cost_total: parseFloat(workingHistory.totalCost),
        cost_per_hour: parseFloat(workingHistory.costPerHour),
        total_volume: parseFloat(workingHistory.totalVolume),
        total_length: parseFloat(workingHistory.totalLength),
        total_weight: parseFloat(workingHistory.totalWeight)
      };
      let averagePrintTime = parseFloat(workingHistory.file.averagePrintTime);
      if (!isNaN(averagePrintTime)) {
        printerData["file_average_print_time"] = averagePrintTime;
      }
      let lastPrintTime = parseFloat(workingHistory.file.lastPrintTime);
      if (!isNaN(averagePrintTime)) {
        printerData["file_last_print_time"] = lastPrintTime;
      }
      if (typeof workingHistory.resend !== "undefined") {
        printerData["job_resends"] = `${workingHistory.resend.count} / ${
          workingHistory.resend.transmitted / 1000
        }K (${workingHistory.resend.ratio.toFixed(0)})`;
      }
      writePoints(tags, "HistoryInformation", printerData);
    } catch (e) {
      logger.error(e);
    }
  }

  async updateFilamentInfluxDB(selectedFilament, history, printer) {
    for (let i = 0; i < selectedFilament.length; i++) {
      if (selectedFilament[i] !== null) {
        let currentState = " ";
        let group = " ";
        if (printer.group === "") {
          group = " ";
        } else {
          group = printer.group;
        }
        if (history.success) {
          currentState = "Success";
        } else {
          if (history.reason === "cancelled") {
            currentState = "Cancelled";
          } else {
            currentState = "Failure";
          }
        }

        const tags = {
          name: selectedFilament[i].spools.name,
          printer_name: history.printerName,
          group: group,
          url: printer.printerURL,
          history_state: currentState,
          file_name: history.fileName
        };

        let filamentData = {
          name: selectedFilament[i].spools.name,
          price: parseFloat(selectedFilament[i].spools.price),
          weight: parseFloat(selectedFilament[i].spools.weight),
          used_difference: parseFloat(used),
          used_spool: parseFloat(selectedFilament[i].spools.used),
          temp_offset: parseFloat(selectedFilament[i].spools.tempOffset),
          spool_manufacturer: selectedFilament[i].spools.profile.manufacturer,
          spool_material: selectedFilament[i].spools.profile.material,
          spool_density: parseFloat(selectedFilament[i].spools.profile.density),
          spool_diameter: parseFloat(selectedFilament[i].spools.profile.diameter)
        };

        writePoints(tags, "SpoolInformation", filamentData);
      }
    }
  }

  generateStartEndDates(payload) {
    const today = new Date();
    const printTime = new Date(payload.time * 1000);
    let startDate = today.getTime() - printTime.getTime();
    startDate = new Date(startDate);

    const endDate = new Date();
    return { startDate, endDate };
  }

  // repeated... could have imported I suppose...
  generateWeightOfJobForASpool(length, filament, completionRatio) {

    if (!length) {
      return length === 0 ? 0 : length;
    }

    let density = DEFAULT_SPOOL_DENSITY;
    let radius = DEFAULT_SPOOL_RATIO;
    if (!!filament?.spools?.profile) {
      radius = parseFloat(filament.spools.profile.diameter) / 2;
      density = parseFloat(filament.spools.profile.density);
    }

    const volume = length * Math.PI * radius * radius; // Repeated 4x across server
    return completionRatio * volume * density;
  }

  async downDateWeight() {
    let printTime = 0;
    if (this.#job?.lastPrintTime) {
      // Last print time available, use this as it's more accurate
      printTime = this.#job.lastPrintTime;
    } else {
      printTime = this.#job.estimatedPrintTime;
    }

    let printPercentage = 0;

    if (!this.#success) {
      printPercentage = (this.#payload.time / printTime) * 100;
    }

    let completionRatio = this.#success ? 1.0 : printPercentage / 100;

    for (let s = 0; s < this.#filamentSelection.length; s++) {

      const currentSpool = this.#filamentSelection[s];
      if (!!currentSpool || this.#job?.filament["tool" + s]) {

        const currentGram = this.generateWeightOfJobForASpool(
          this.#job.filament["tool" + s].length / 1000,
          currentSpool,
          completionRatio
        );
        await Spool.findById(currentSpool._id).then((spool) => {
          const currentUsed = parseFloat(spool.spools.used);
          spool.spools.used = currentUsed + parseFloat(currentGram);
          spool.markModified("spools.used");
          spool
            .save()
            .then((res) => {
              logger.info("Successfully downdated spool data!", res);
            })
            .catch((e) => {
              logger.error("Unable to update spool data!", e);
            });
        });
      } else {
        logger.error("Unable to downdate spool weight, non selected...");
      }
    }
  }

  async checkForAdditionalSuccessProperties() {
    const serverSettingsCache = SettingsClean.returnSystemSettings();

    if (serverSettingsCache.filament.downDateSuccess && !serverSettingsCache.filamentManager) {
      // Capture success amount
      await this.downDateWeight();
    }

    if (serverSettingsCache.history.thumbnails.onComplete) {
      this.#thumbnail = await this.thumbnailCheck();
      await History.findByIdAndUpdate(this.#historyRecordID, {
        $set: { "printHistory.thumbnail": this.#thumbnail }
      })
        .then(async () => {
          await getHistoryCache().initCache();
        })
        .catch((e) => {
          logger.error("Unable to update history filament record: ", e.toString());
        });
    }

    if (serverSettingsCache.history.snapshot.onComplete) {
      this.#snapshot = await this.snapshotCheck();
      await History.findByIdAndUpdate(this.#historyRecordID, {
        $set: { "printHistory.snapshot": this.#snapshot }
      })
        .then(async () => {
          await getHistoryCache().initCache();
        })
        .catch((e) => {
          logger.error("Unable to update history filament record: ", e.toString());
        });
    }

    if (serverSettingsCache.history.timelapse.onComplete) {
      await this.timelapseCheck();
    }
  }

  async checkForAdditionalFailureProperties() {
    const serverSettingsCache = SettingsClean.returnSystemSettings();

    if (serverSettingsCache.filament.downDateFailed && !serverSettingsCache.filamentManager) {
      // No point even trying to down date failed without these...
      if (!this.#job?.estimatedPrintTime && !this.#job?.lastPrintTime) {
        logger.error(
            "Unable to downdate failed jobs spool, no estimatedPrintTime or lastPrintTime",
            this.#job
        );
        return;
      }
      // Capture failed amount
      await this.downDateWeight();
    }

    if (serverSettingsCache.history.thumbnails.onFailure) {
      this.#thumbnail = await this.thumbnailCheck();
      await History.findByIdAndUpdate(this.#historyRecordID, {
        $set: { "printHistory.thumbnail": this.#thumbnail }
      })
        .then(async () => {
          await getHistoryCache().initCache();
        })
        .catch((e) => {
          logger.error("Unable to update history filament record: ", e.toString());
        });
    }
    if (serverSettingsCache.history.snapshot.onFailure) {
      this.#snapshot = await this.snapshotCheck();
      await History.findByIdAndUpdate(this.#historyRecordID, {
        $set: { "printHistory.snapshot": this.#snapshot }
      })
        .then(async () => {
          await getHistoryCache().initCache();
        })
        .catch((e) => {
          logger.error("Unable to update history filament record: ", e.toString());
        });
    }

    if (serverSettingsCache.history.timelapse.onFailure) {
      await this.timelapseCheck();
    }
  }
}

module.exports = {
  HistoryCaptureService
};
