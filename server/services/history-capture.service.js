const { findIndex, cloneDeep } = require("lodash");
const fetch = require("node-fetch");
const fs = require("fs");
const History = require("../models/History.js");
const ErrorLog = require("../models/ErrorLog.js");
const Logger = require("../handlers/logger.js");
const filamentProfiles = require("../models/Profiles.js");
const { SettingsClean } = require("./settings-cleaner.service");
const Spool = require("../models/Filament.js");
const {
  filamentManagerReSync
} = require("../services/octoprint/utils/filament-manager-plugin.utils");
const { ScriptRunner } = require("./local-scripts.service.js");
const MjpegDecoder = require("mjpeg-decoder");
const { downloadImage, downloadFromOctoPrint } = require("../utils/download.util");
const { getHistoryCache } = require("../cache/history.cache");
const { writePoints } = require("./influx-export.service.js");
const { DEFAULT_SPOOL_DENSITY, DEFAULT_SPOOL_RATIO } = require("../constants/cleaner.constants");
const { OctoprintApiClientService } = require("./octoprint/octoprint-api-client.service");

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

class HistoryCollection {
  static async resyncFilament(printer, octoPrintApiClient) {
    const returnSpools = [];
    for (const element of printer.selectedFilament) {
      if (element !== null) {
        const filamentID = element.spools.fmID;
        if (!filamentID) {
          logger.error(
            `Could not query OctoPrint FilamentManager for filament. FilamentID '${filamentID}' not found.`,
            element.spools
          );
        }
        const response = await octoPrintApiClient.getPluginFilamentManagerFilament(
          printer,
          filamentID
        );

        logger.info(`${printer.printerURL}: spools fetched. Status: ${response.status}`);
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
          logger.info(`${printer.printerURL}: updating... spool status ${spoolEntity.spools}`);
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
        const currentFileIndex = findIndex(files, function (o) {
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

  static async timelapseCheck(printer, fileName, printTime, id, octoPrintApiClient) {
    const serverSettingsCache = SettingsClean.returnSystemSettings();
    if (printTime >= 10) {
      let interval = false;
      const grabTimelapse = async () => {
        return await octoPrintApiClient.getTimelapses(true);
      };
      logger.info("Checking for timelapse...", fileName);
      if (!interval) {
        interval = setInterval(async function () {
          let timelapse = await grabTimelapse();
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
                lastTimelapse = findIndex(timelapseResponse.files, function (o) {
                  return o.name.includes(cleanName);
                });
              } else {
                lastTimelapse = findIndex(timelapseResponse.files, function (o) {
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
                History.findByIdAndUpdate(id, { "printHistory.timelapse": lapse })
                  .then((res) => {
                    logger.debug("Successfully updated history records timelapse with: ", lapse);
                  })
                  .catch((e) => {
                    logger.error("Failed to update history record timelapse!", e);
                  });
                await getHistoryCache().initCache();
                logger.info("Successfully grabbed timelapse!");
              } else {
                History.findByIdAndUpdate(id, { "printHistory.timelapse": "" })
                  .then((res) => {
                    logger.debug("Successfully updated history records timelapse with: ", snapshot);
                  })
                  .catch((e) => {
                    logger.error("Failed to update history record timelapse!", e);
                  });
                await getHistoryCache().initCache();
                logger.error("Failed to grab a timelapse...");
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
      return fetch(`${printer.printerURL}/api/timelapse/${fileName}`, {
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

  static generateStartEndDates(payload) {
    const today = new Date();
    const printTime = new Date(payload.time * 1000);
    let startDate = today.getTime() - printTime.getTime();
    startDate = new Date(startDate);

    const endDate = new Date();
    return { startDate, endDate };
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

  static async checkForAdditionalSuccessProperties(
    payload,
    job,
    currentFilament,
    state,
    printer,
    saveHistory,
    printerAPIConnector,
    files
  ) {
    const serverSettingsCache = SettingsClean.returnSystemSettings();

    if (serverSettingsCache.filament.downDateSuccess && !serverSettingsCache.filamentManager) {
      // Capture success amount
      await this.downDateWeight(payload, job, currentFilament, state);
    }

    if (serverSettingsCache.history.thumbnails.onComplete) {
      saveHistory.printHistory.thumbnail = await HistoryCollection.thumbnailCheck(
        payload,
        files,
        saveHistory._id,
        printer
      );
    }

    if (serverSettingsCache.history.snapshot.onComplete) {
      saveHistory.printHistory.snapshot = await HistoryCollection.snapshotCheck(
        printer,
        saveHistory._id,
        payload
      );
    }
    // This should use the websocket events..
    if (serverSettingsCache.history.timelapse.onComplete) {
      await HistoryCollection.timelapseCheck(
        printer,
        payload.name,
        payload.time,
        saveHistory._id,
        printerAPIConnector
      );
    }
  }

  static async checkForAdditionalFailureProperties(
    payload,
    job,
    currentFilament,
    state,
    printer,
    saveHistory,
    printerAPIConnector,
    files
  ) {
    const serverSettingsCache = SettingsClean.returnSystemSettings();

    if (serverSettingsCache.history.thumbnails.onFailure) {
      saveHistory.printHistory.thumbnail = await HistoryCollection.thumbnailCheck(
        payload,
        files,
        saveHistory._id,
        printer
      );
    }
    if (serverSettingsCache.history.snapshot.onFailure) {
      saveHistory.printHistory.snapshot = await HistoryCollection.snapshotCheck(
        printer,
        saveHistory._id,
        payload
      );
    }
    if (serverSettingsCache.history.timelapse.onFailure) {
      await HistoryCollection.timelapseCheck(
        printer,
        payload.name,
        payload.time,
        saveHistory._id,
        printerAPIConnector
      );
    }
    if (serverSettingsCache.filament.downDateFailed && !serverSettingsCache.filamentManager) {
      // No point even trying to down date failed without these...
      if (!job?.estimatedPrintTime && !job?.lastPrintTime) {
        return;
      }
      // Capture failed amount
      await this.downDateWeight(payload, job, currentFilament, state);
    }
  }

  static async capturePrint(payload, printer, job, files, resends, state) {
    try {
      logger.warning(`${state ? "Completed" : "Failed"} Print triggered - ${printer.printerURL}`);
      const serverSettingsCache = SettingsClean.returnSystemSettings();

      const printerAPIConnector = new OctoprintApiClientService(
        printer.printerURL,
        printer.apikey,
        printer.timeout
      );

      const { startDate, endDate } = this.generateStartEndDates(payload);


      //If we're using the filament manager plugin... we need to grab the latest spool values to be saved from it.
      if (serverSettingsCache.filamentManager && Array.isArray(printer.selectedFilament)) {
        printer.selectedFilament = await HistoryCollection.resyncFilament(
          printer,
          printerAPIConnector
        );
        logger.info("Grabbed latest filament values", printer.selectedFilament);
      }

      //If we're not using filament manager plugin... we need to check if the user has enabled automated spool updating.
      const printHistory = {
        printerName: printer.printerName,
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
        filamentSelection: printer.selectedFilament,
        job,
        notes: "",
        snapshot: "",
        timelapse: "",
        thumbnail: "",
        resends: resends
      };
      // Create our history object
      const saveHistory = new History({
        printHistory
      });

      // Save initial history
      if (state) {
        await this.checkForAdditionalSuccessProperties(
          payload,
          job,
          printer.selectedFilament,
          state,
          printer,
          saveHistory,
          printerAPIConnector,
          files
        );
      }
      if (!state) {
        await this.checkForAdditionalFailureProperties(
          payload,
          job,
          printer.selectedFilament,
          state,
          printer,
          saveHistory,
          printerAPIConnector,
          files
        );
      }

      await this.updateFilamentInfluxDB(
        printer.selectedFilament,
        printHistory,
        printer.selectedFilament,
        printer
      );

      await this.updateInfluxDB(saveHistory._id, "historyInformation", printer);
      await saveHistory
        .save()
        .then((res) => {
          logger.info("Successfully captured print!", res);
        })
        .catch((e) => {
          logger.error("Failed to capture print!", e);
        });

      setTimeout(async () => {
        // Re-generate history cache...
        await getHistoryCache().initCache();
      }, 5000);

      return saveHistory._id;
    } catch (e) {
      return e;
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

      const errorLog = {
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
}

module.exports = {
  HistoryCollection
};
