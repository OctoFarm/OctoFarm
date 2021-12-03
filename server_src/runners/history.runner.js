const _ = require("lodash");
const fetch = require("node-fetch");
const fs = require("fs");
const History = require("../models/History.js");
const ErrorLog = require("../models/ErrorLog.js");
const Logger = require("../handlers/logger.js");
const filamentProfiles = require("../models/Profiles.js");
const { SettingsClean } = require("../lib/dataFunctions/settingsClean");
const Spool = require("../models/Filament.js");
const { FilamentManagerPlugin } = require("./filamentManagerPlugin.js");
const { ScriptRunner } = require("./scriptCheck.js");
const MjpegDecoder = require("mjpeg-decoder");
const { downloadImage, downloadFromOctoPrint } = require("../utils/download.util");
const { getHistoryCache } = require("../cache/history.cache");
const { writePoints } = require("../lib/influxExport.js");
const {
  DEFAULT_SPOOL_DENSITY,
  DEFAULT_SPOOL_RATIO
} = require("../lib/providers/cleaner.constants");

const logger = new Logger("OctoFarm-HistoryCollection");
let counter = 0;
let errorCounter = 0;

const routeBase = "./images/historyCollection";
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

class HistoryCollection {
  static octoPrintService;

  /**
   * Without dependency injection this is what we've got
   * @param service
   * @returns {Promise<void>}
   */
  static async inject(service) {
    this.octoPrintService = service;
  }

  /**
   * Until we have V2 DI we must do it ourselves
   */
  static validateProviders() {
    if (!this.octoPrintService) {
      throw "OctoPrint Client Connector not instantiated. Report please.";
    }
  }

  static async resyncFilament(printer) {
    this.validateProviders();

    const returnSpools = [];
    try {
      for (let i = 0; i < printer.selectedFilament.length; i++) {
        if (printer.selectedFilament[i] !== null) {
          const filamentID = printer.selectedFilament[i].spools.fmID;
          if (!filamentID) {
            throw `Could not query OctoPrint FilamentManager for filament. FilamentID '${filamentID}' not found.`;
          }
          const response = await this.octoPrintService.getPluginFilamentManagerFilament(
            printer,
            filamentID
          );

          logger.info(`${printer.printerURL}: spools fetched. Status: ${response.status}`);
          const sp = await response.json();

          const spoolID = printer.selectedFilament[i]._id;
          const spoolEntity = await Spool.findById(spoolID);
          if (!spoolEntity) {
            throw `Spool database entity by ID '${spoolID}' not found. Cant update filament.`;
          }
          spoolEntity.spools = {
            name: sp.spool.name,
            profile: sp.spool.profile.id,
            price: sp.spool.cost,
            weight: sp.spool.weight,
            used: sp.spool.used,
            tempOffset: sp.spool.temp_offset,
            fmID: sp.spool.id
          };
          logger.info(`${printer.printerURL}: updating... spool status ${spoolEntity.spools}`);
          spoolEntity.markModified("spools");
          await spoolEntity.save();
          returnSpools.push(spoolEntity);
        }
      }
    } catch (e) {
      logger.info(
        e,
        `${printer.printerURL}: Issue contacting filament manager... not updating spool`
      );
    }

    // TODO dynamic circular import to State/Runner
    const reSync = await FilamentManagerPlugin.filamentManagerReSync();
    // Return success
    logger.info(reSync);
    return returnSpools;
  }

  static async grabThumbnail(url, thumbnail, id, printer) {
    const thumbParts = thumbnail.split("/");
    const result = thumbParts[thumbParts.length - 1];
    const splitAgain = result.split("?");
    const filePath = `${PATHS.thumbnails}/${id}-${splitAgain[0]}`;

    ensureBaseFolderExists();
    ensureFolderExists(PATHS.thumbnails);

    await downloadImage(url, filePath, printer.apikey, () => {
      logger.info("Downloaded: ", url);
      logger.info(filePath);
    });

    return filePath;
  }

  static async snapPictureOfPrinter(url, id, fileDisplay) {
    ensureBaseFolderExists();
    ensureFolderExists(PATHS.snapshots);

    const decoder = MjpegDecoder.decoderForSnapshot(url);
    const frame = await decoder.takeSnapshot();
    const filePath = `${PATHS.snapshots}/${id}-${fileDisplay}.jpg`;

    await fs.writeFileSync(filePath, frame);
    logger.info("Downloaded: ", url);
    logger.info("Saved as: ", filePath);
    return filePath;
  }

  /**
   * @param payload
   * @param serverSettings
   * @param files
   * @param id
   * @param event
   * @param printer
   * @returns {Promise<null>}
   */
  static async thumbnailCheck(payload, files, id, printer) {
    try {
      let runCapture = async () => {
        // grab Thumbnail if available.
        const currentFileIndex = _.findIndex(files, function (o) {
          return o.name === payload.name;
        });
        let base64Thumbnail = null;
        if (currentFileIndex > -1) {
          if (
            typeof files[currentFileIndex] !== "undefined" &&
            files[currentFileIndex].thumbnail !== null
          ) {
            base64Thumbnail = await HistoryCollection.grabThumbnail(
              `${printer.printerURL}/${files[currentFileIndex].thumbnail}`,
              files[currentFileIndex].thumbnail,
              id,
              printer
            );
          }
        }
        return base64Thumbnail;
      };

      return await runCapture();
    } catch (e) {
      logger.error("Couldn't capture thumbnail as requested!", e);
    }
  }

  static async snapshotCheck(printer, id, payload) {
    // Use default settings if not present
    try {
      return await HistoryCollection.snapPictureOfPrinter(printer.camURL, id, payload.name);
    } catch (e) {
      logger.error("Couldn't capture webcam snapshot as requested!", e);
    }
  }

  static async timelapseCheck(printer, fileName, printTime, id) {
    const serverSettingsCache = SettingsClean.returnSystemSettings();
    if (printTime >= 10) {
      let interval = false;
      const grabTimelapse = async (printer) => {
        return await fetch(`${printer.printerURL}/api/timelapse?unrendered=true`, {
          method: "GET",
          headers: {
            "Content-Type": "video/mp4",
            "X-Api-Key": printer.apikey
          }
        });
      };
      logger.info("Checking for timelapse...", fileName);
      if (!interval) {
        interval = setInterval(async function () {
          let timelapse = await grabTimelapse(printer);
          if (timelapse.status === 200) {
            const timelapseResponse = await timelapse.json();
            logger.info("Successfully grabbed timelapse list... Checking for:", fileName);
            let unrenderedFileName = null;
            if (timelapseResponse.unrendered.length === 0) {
              let cleanName = fileName;
              if (fileName.includes(".gcode")) {
                cleanName = fileName.replace(".gcode", "");
              }
              let lastTimelapse = null;
              if (unrenderedFileName === null) {
                lastTimelapse = _.findIndex(timelapseResponse.files, function (o) {
                  return o.name.includes(cleanName);
                });
              } else {
                lastTimelapse = _.findIndex(timelapseResponse.files, function (o) {
                  return o.name.includes(unrenderedFileName);
                });
              }

              if (
                lastTimelapse !== -1 &&
                !timelapseResponse.files[lastTimelapse].url.includes(".mpg")
              ) {
                let lapse = await HistoryCollection.grabTimeLapse(
                  timelapseResponse.files[lastTimelapse].name,
                  printer.printerURL + timelapseResponse.files[lastTimelapse].url,
                  id,
                  printer,
                  serverSettingsCache
                );
                //Clearing interval
                clearInterval(interval);
                const saveHistory = await History.findById(id);
                saveHistory.printHistory.timelapse = lapse;
                saveHistory.markModified("printHistory");
                await saveHistory.save();
                await getHistoryCache().initCache();
                logger.info("Successfully grabbed timelapse!");
              } else {
                const updateHistory = await History.findById(id);
                updateHistory.printHistory.timelapse = "";
                updateHistory.markModified("printHistory");
                await updateHistory.save();
                await getHistoryCache().initCache();
                logger.info("Failed to grab a timelapse...");
                clearInterval(interval);
                return null;
              }
            } else {
              if (unrenderedFileName === null) {
                let unRenderedGrab = [...timelapseResponse.unrendered].filter(function (lapse) {
                  let lapseName = lapse.name.replace(/\s/g, "_");
                  let checkName = fileName.replace(/\s/g, "_");
                  if (checkName.includes(".gcode")) {
                    checkName = fileName.replace(".gcode", "");
                  }
                  return lapseName.includes(checkName);
                });
                if (unRenderedGrab.length === 1) {
                  unrenderedFileName = unRenderedGrab[0].name;
                  logger.info(
                    "File is still rendering... awaiting completion:",
                    unrenderedFileName
                  );
                } else {
                  logger.info(
                    "No un-rendered files... must be complete, attempting download.",
                    unRenderedGrab
                  );
                }
              } else {
                logger.info(`Awaiting ${unrenderedFileName} to finish rendering`);
              }
            }
          } else {
            return null;
          }
        }, 5000);
      }
    } else {
      return null;
    }
  }

  /**
   * Grabs the timelapse by downloading it from OctoPrint's API
   * @param fileName
   * @param url
   * @param id
   * @param printer
   * @param serverSettings
   * @returns {Promise<string>}
   */
  static async grabTimeLapse(fileName, url, id, printer, serverSettings) {
    ensureBaseFolderExists();
    ensureFolderExists(PATHS.timelapses);

    const filePath = `${PATHS.timelapses}/${id}-${fileName}`;

    await downloadFromOctoPrint(
      url,
      filePath,
      () => {
        logger.info("Downloaded: ", url);
        logger.info(filePath);
        if (serverSettings?.history?.timelapse?.deleteAfter) {
          HistoryCollection.deleteTimeLapse(printer, fileName);
        }
      },
      printer.apikey
    );

    return filePath;
  }

  static async deleteTimeLapse(printer, fileName) {
    const deleteTimeLapse = async (fileName) => {
      return await fetch(`${printer.printerURL}/api/timelapse/${fileName}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": printer.apikey
        }
      });
    };
    await deleteTimeLapse(fileName);
    logger.info("Successfully deleted " + fileName + " from OctoPrint.");
  }

  static async objectCleanforInflux(obj) {
    for (var propName in obj) {
      if (obj[propName] === null) {
        delete obj[propName];
      }
    }
  }

  static async updateInfluxDB(historyID, measurement, printer) {
    let historyArchive = getHistoryCache().historyClean;
    let currentArchive = _.findIndex(historyArchive, function (o) {
      return JSON.stringify(o._id) === JSON.stringify(historyID);
    });
    if (currentArchive > -1) {
      let workingHistory = historyArchive[currentArchive];
      let startDateSplit = workingHistory.startDate.split(" ");
      let endDateSplit = workingHistory.endDate.split(" ");
      const trueStartDate = Date.parse(
        `${startDateSplit[2]} ${startDateSplit[1]} ${startDateSplit[3]} ${startDateSplit[5]}`
      );
      const trueEndDate = Date.parse(
        `${endDateSplit[2]} ${endDateSplit[1]} ${endDateSplit[3]} ${endDateSplit[5]}`
      );
      let currentState = " ";
      if (workingHistory.state.includes("Success")) {
        currentState = "Success";
      } else if (workingHistory.state.includes("Cancelled")) {
        currentState = "Cancelled";
      } else if (workingHistory.state.includes("Failure")) {
        currentState = "Failure";
      }
      let group = " ";
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
        start_date: trueStartDate,
        end_date: trueEndDate,
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
    }
  }

  static async updateFilamentInfluxDB(selectedFilament, history, previousFilament, printer) {
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

        let used = 0;
        if (typeof previousFilament !== "undefined" && previousFilament !== null) {
          used = Math.abs(selectedFilament[i].spools.used - previousFilament[i].spools.used);
        }

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

  static getPrinterName(printer) {
    if (typeof printer.settingsAppearance !== "undefined") {
      if (printer.settingsAppearance.name === "" || printer.settingsAppearance.name === null) {
        return printer.printerURL;
      } else {
        return printer.settingsAppearance.name;
      }
    } else {
      return printer.printerURL;
    }
  }

  static generateStartEndDates(payload) {
    const today = new Date();
    const printTime = new Date(payload.time * 1000);
    let startDate = today.getTime() - printTime.getTime();
    startDate = new Date(startDate);

    const endDate = new Date();
    return { startDate, endDate };
  }

  static async populateFilamentProfile(selectedFilament) {
    const serverSettingsCache = SettingsClean.returnSystemSettings();
    const profiles = await filamentProfiles.find({});
    if (selectedFilament !== null && Array.isArray(selectedFilament)) {
      let profileId = [];
      selectedFilament.forEach((spool, index) => {
        if (spool !== null) {
          if (serverSettingsCache.filamentManager) {
            profileId = _.findIndex(profiles, function (o) {
              return o.profile.index == selectedFilament[index].spools.profile;
            });
          } else {
            profileId = _.findIndex(profiles, function (o) {
              return o._id == selectedFilament[index].spools.profile;
            });
          }
          selectedFilament[index].spools.profile = profiles[profileId].profile;
        }
      });
    }
    return selectedFilament;
  }
  // repeated... could have imported I suppose...
  static generateWeightOfJobForASpool(length, filament, completionRatio) {
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
    return (completionRatio * volume * density).toFixed(2);
  }
  static async downDateWeight(payload, job, filament, success) {
    let printTime = 0;
    if (job?.lastPrintTime) {
      // Last print time available, use this as it's more accurate
      printTime = job.lastPrintTime;
    } else {
      printTime = job.estimatedPrintTime;
    }

    let printPercentage = 0;

    if (!success) {
      printPercentage = (payload.time / printTime) * 100;
    }

    let completionRatio = success ? 1.0 : printPercentage / 100;

    for (let s = 0; s < filament.length; s++) {
      const currentSpool = filament[s];
      if (job?.filament["tool" + s]?.length) {
        const currentGram = this.generateWeightOfJobForASpool(
          job.filament["tool" + s].length / 1000,
          currentSpool,
          completionRatio
        );
        await Spool.findById(currentSpool._id).then((spool) => {
          const currentUsed = parseFloat(spool.spools.used);
          spool.spools.used = (currentUsed + parseFloat(currentGram)).toFixed(2);
          spool.markModified("spools.used");
          spool.save();
        });
      }
    }
  }

  static async capturePrint(payload, printer, job, files, resends, state) {
    logger.info("Completed Print triggered", printer.printerURL);
    try {
      // Initial Data Preperation...
      const serverSettingsCache = SettingsClean.returnSystemSettings();

      const { startDate, endDate } = this.generateStartEndDates(payload);

      // populate the filament profile
      let currentSelectedFilament = await this.populateFilamentProfile(printer.selectedFilament);

      // Need to actually use this one day... think it got superseded and isn't required anymore
      const previousFilament = _.cloneDeep(currentSelectedFilament);
      let currentFilament = _.cloneDeep(currentSelectedFilament);

      //If we're using the filament manager plugin... we need to grab the latest spool values to be saved from it.
      if (serverSettingsCache.filamentManager && Array.isArray(currentFilament)) {
        currentFilament = await HistoryCollection.resyncFilament(printer);
        logger.info("Grabbed latest filament values", currentFilament);
      }

      //If we're not using filament manager plugin... we need to check if the user has enabled automated spool updating.
      if (
        !serverSettingsCache.filamentManager &&
        (serverSettingsCache.filament.downDateFailed ||
          serverSettingsCache.filament.downDateSuccess)
      ) {
        if (!state && serverSettingsCache.filament.downDateFailed) {
          // No point even trying to down date failed without these...
          if (!job?.estimatedPrintTime && !job?.lastPrintTime) {
            return;
          }
          // Capture failed amount
          await this.downDateWeight(payload, job, currentFilament, state);
        }
        if (state && serverSettingsCache.filament.downDateSuccess) {
          // Capture success amount
          await this.downDateWeight(payload, job, currentFilament, state);
        }
      }

      const printHistory = {
        printerName: this.getPrinterName(printer),
        printerID: printer._id,
        printerGroup: printer.group,
        costSettings: printer.costSettings,
        success: state,
        reason: payload?.reason,
        fileName: payload.name,
        filePath: payload.path,
        startDate,
        endDate,
        printTime: Math.round(payload.time),
        filamentSelection: currentFilament,
        previousFilamentSelection: previousFilament,
        job,
        notes: "",
        snapshot: "",
        timelapse: "",
        thumbnail: "",
        resends: resends
      };
      // Update influx if it's active
      if (serverSettingsCache.influxExport.active) {
        await HistoryCollection.updateFilamentInfluxDB(
          printer.selectedFilament,
          printHistory,
          currentFilament,
          printer
        );
      }
      // Create our history object
      const saveHistory = new History({
        printHistory
      });
      // Capture thumbnails if enabled
      if (serverSettingsCache.history.thumbnails.onComplete && state) {
        saveHistory.printHistory.thumbnail = await HistoryCollection.thumbnailCheck(
          payload,
          files,
          saveHistory._id,
          printer
        );
      }
      if (serverSettingsCache.history.thumbnails.onFailure && !state) {
        saveHistory.printHistory.thumbnail = await HistoryCollection.thumbnailCheck(
          payload,
          files,
          saveHistory._id,
          printer
        );
      }

      if (serverSettingsCache.history.snapshot.onComplete && state) {
        saveHistory.printHistory.snapshot = await HistoryCollection.snapshotCheck(
          printer,
          saveHistory._id,
          payload
        );
      }
      if (serverSettingsCache.history.snapshot.onFailure && !state) {
        saveHistory.printHistory.snapshot = await HistoryCollection.snapshotCheck(
          printer,
          saveHistory._id,
          payload
        );
      }

      if (serverSettingsCache.history.timelapse.onComplete && state) {
        await HistoryCollection.timelapseCheck(
          printer,
          payload.name,
          payload.time,
          saveHistory._id
        );
      }
      if (serverSettingsCache.history.timelapse.onFailure && !state) {
        await HistoryCollection.timelapseCheck(
          printer,
          payload.name,
          payload.time,
          saveHistory._id
        );
      }
      printer.fileName = payload.display;
      printer.filePath = payload.path;
      if (!state) {
        await ScriptRunner.check(printer, "failed", saveHistory._id);
      } else {
        await ScriptRunner.check(printer, "done", saveHistory._id);
      }

      console.log(saveHistory);
      saveHistory.markModified("printHistory");
      await saveHistory.save();
      // Update cache after save
      await getHistoryCache().initCache();
      setTimeout(async function () {
        // Re-D
        await getHistoryCache().initCache();
        if (serverSettingsCache.influxExport.active) {
          await HistoryCollection.updateInfluxDB(saveHistory._id, "history", printer);
        }
      }, 5000);
    } catch (e) {
      logger.error("Unable to save history record!", e);
    }
  }

  static async errorLog(payload, printer, job, files) {
    try {
      let name = null;
      if (typeof printer.settingsAppearance !== "undefined") {
        if (printer.settingsAppearance.name === "" || printer.settingsAppearance.name === null) {
          name = printer.printerURL;
        } else {
          name = printer.settingsAppearance.name;
        }
      } else {
        name = printer.printerURL;
      }
      logger.info("Error Log Collection Triggered", payload + printer.printerURL);
      const today = new Date();
      const errorCollection = await ErrorLog.find({});

      const printTime = new Date(payload.time * 1000);
      let startDate = today.getTime() - printTime.getTime();
      startDate = new Date(startDate);

      const endDate = new Date();

      if (errorCollection.length === 0) {
        errorCounter = 0;
      } else {
        errorCounter = errorCollection[errorCollection.length - 1].errorLog.historyIndex + 1;
      }
      const errorLog = {
        historyIndex: errorCounter,
        printerIndex: printer.index,
        printerID: printer._id,
        costSettings: printer.costSettings,
        printerName: name,
        success: false,
        reason: payload.error,
        startDate,
        endDate,
        printTime: Math.round(payload.time),
        job: job,
        notes: ""
      };
      const saveError = new ErrorLog({
        errorLog
      });
      await saveError.save();
      await getHistoryCache().initCache();
      ScriptRunner.check(printer, "error", saveError._id);
      logger.info("Error captured ", payload + printer.printerURL);
    } catch (e) {
      logger.error(e, `Failed to capture ErrorLog for ${printer.printerURL}`);
    }
  }

  static get(ip, port, apikey, item) {
    const url = `http://${ip}:${port}/api/${item}`;
    return fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apikey
      }
    });
  }
}

module.exports = {
  HistoryCollection
};
