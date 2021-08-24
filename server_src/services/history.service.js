const _ = require("lodash");
const fs = require("fs");
const MjpegDecoder = require("mjpeg-decoder");
const Logger = require("../handlers/logger.js");
const History = require("../models/History.js");
const Profiles = require("../models/Profiles.js");
const { HISTORY_SETTINGS } = require("../constants/server-settings.constants");
const { durationToDates } = require("../utils/time.util");

const logger = new Logger("OctoFarm-HistoryCollection");
let counter = 0;

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

class HistoryService {
  #octoPrintApiService;
  #filamentManagerPluginService;
  #influxDbHistoryService;
  #settingsStore;

  constructor({
    octoPrintApiService,
    influxDbHistoryService,
    filamentManagerPluginService,
    settingsStore
  }) {
    this.#octoPrintApiService = octoPrintApiService;
    // TODO Better to decouple Influx using EventEmitter2
    this.#influxDbHistoryService = influxDbHistoryService;
    this.#filamentManagerPluginService = filamentManagerPluginService;
    this.#settingsStore = settingsStore;
  }

  async find(limit = 100) {
    return History.find({}).sort({ historyIndex: -1 }).limit(limit);
  }

  async grabThumbnail(printer, thumbnailPath, historyId) {
    const thumbParts = thumbnailPath.split("/");
    const result = thumbParts[thumbParts.length - 1];
    const splitAgain = result.split("?");
    const octoFarmTargetFilePath = `${PATHS.thumbnails}/${historyId}-${splitAgain[0]}`;

    ensureBaseFolderExists();
    ensureFolderExists(PATHS.thumbnails);

    const printerConnectionParams = printer.getLoginDetails();

    await this.#octoPrintApiService.downloadImage(
      printerConnectionParams,
      thumbnailPath,
      octoFarmTargetFilePath,
      () => {
        logger.info(
          `Downloaded image '${thumbnailPath}' from printer '${printerConnectionParams.printerURL}'`,
          octoFarmTargetFilePath
        );
      }
    );

    return octoFarmTargetFilePath;
  }

  // TODO move out of this service => camera or file service
  async snapPictureOfPrinter(url, historyId, fileDisplay) {
    ensureBaseFolderExists();
    ensureFolderExists(PATHS.snapshots);

    const decoder = MjpegDecoder.decoderForSnapshot(url);
    const frame = await decoder.takeSnapshot();
    const filePath = `${PATHS.snapshots}/${historyId}-${fileDisplay}.jpg`;

    await fs.writeFileSync(filePath, frame);
    logger.info("Downloaded: ", url);
    logger.info("Saved as: ", filePath);
    return filePath;
  }

  #getHistorySubSettings(settingKey) {
    const historySubSetting = this.#settingsStore.getHistorySetting();
    return historySubSetting[settingKey];
  }

  async thumbnailCheck(printer, historyId, { payload, files, event }) {
    const thumbnailEventSettings = this.#getHistorySubSettings(HISTORY_SETTINGS.thumbnails);
    if (!thumbnailEventSettings[event]) {
      return null;
    }

    // Grab optional thumbnail
    const currentFileIndex = _.findIndex(files, function (o) {
      return o.name === payload.name;
    });
    let base64Thumbnail = null;
    if (currentFileIndex > -1) {
      const file = files[currentFileIndex];
      if (!!file?.thumbnail) {
        base64Thumbnail = await this.grabThumbnail(printer, file.thumbnail, historyId);
      }
    }
    return base64Thumbnail;
  }

  async snapshotCheck(printer, saveHistory, { event, payload }) {
    const snapshotEventSettings = this.#getHistorySubSettings(HISTORY_SETTINGS.snapshot);
    if (!snapshotEventSettings[event]) {
      return null;
    }

    return await this.snapPictureOfPrinter(printer.camURL, saveHistory._id, payload.name);
  }

  // TODO this function is so vague. Needs a complete redo and move out of history...
  // TODO I broke it completely so we have to start again
  async timelapseCheck(printer, historyId, fileName, printTime) {
    logger.info("Acquiring timelapse", fileName);

    let timelapseResponse = await this.#octoPrintApiService.listUnrenderedTimeLapses(
      printer.getLoginDetails()
    );

    let unrenderedFileName = null;
    if (timelapseResponse.unrendered.length === 0) {
      let cleanName = fileName;
      if (fileName.includes(".gcode")) {
        cleanName = fileName.replace(".gcode", "");
      }
      let lastTimelapse = null;
      if (!unrenderedFileName) {
        lastTimelapse = _.findIndex(timelapseResponse.files, function (o) {
          return o.name.includes(cleanName);
        });
      } else {
        lastTimelapse = _.findIndex(timelapseResponse.files, function (o) {
          return o.name.includes(unrenderedFileName);
        });
      }

      let lapse;
      if (lastTimelapse !== -1 && !timelapseResponse.files[lastTimelapse].url.includes(".mpg")) {
        lapse = await this.downloadTimeLapse(
          printer,
          timelapseResponse.files[lastTimelapse].name,
          historyId
        );
      }

      const saveHistory = await History.findById(historyId);
      saveHistory.printHistory.timelapse = lapse || "";
      saveHistory.markModified("printHistory");
      await saveHistory.save();

      logger.info("Successfully grabbed timelapse!");
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
          logger.info("File is still rendering... awaiting completion:", unrenderedFileName);
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
  }

  /**
   * Grabs the timelapse by downloading it from OctoPrint's API
   * @param fileName
   * @param historyId
   * @param printer
   * @returns {Promise<string>}
   */
  async downloadTimeLapse(printer, fileName, historyId) {
    ensureBaseFolderExists();
    ensureFolderExists(PATHS.timelapses);

    const filePath = `${PATHS.timelapses}/${historyId}-${fileName}`;
    const printerConnectionParams = printer.getLoginDetails();

    await this.#octoPrintApiService.downloadFile(
      printerConnectionParams,
      fileName,
      filePath,
      async () => {
        logger.info(`Downloaded '${fileName}' to  '${filePath}'`);

        const historySetting = this.#settingsStore.getHistorySetting();
        if (historySetting?.timelapse?.deleteAfter) {
          await this.#octoPrintApiService.deleteTimeLapse(printerConnectionParams, fileName);
          logger.info("Purged " + fileName + " timelapse from OctoPrint after it was saved.");
        }
      }
    );

    return filePath;
  }

  async saveJobCompletion(printer, job, status = "success", { payload, resends, files }) {
    let printerName = printer.getName();
    const { startDate, endDate } = durationToDates(payload.time);
    const filamentPluginEnabled = this.#settingsStore.isFilamentEnabled();
    const jobSuccess = status === "success";
    const eventName = jobSuccess ? "onComplete" : "onFailure";

    if (jobSuccess) {
      logger.info(`Completed print event triggered for printer ${printerName}`, payload);
    } else if (status === "failed") {
      logger.info(`Failed print event triggered for printer ${printerName}`, payload);
    }

    // TODO filamentCache instead
    const previousFilament = JSON.parse(JSON.stringify(printer.selectedFilament));

    if (filamentPluginEnabled && Array.isArray(printer?.selectedFilament)) {
      printer.selectedFilament =
        await this.#filamentManagerPluginService.updatePrinterSelectedFilament(printer);
    }

    const historyCollection = await History.find({});
    const profiles = await Profiles.find({});

    if (printer.selectedFilament !== null && Array.isArray(printer.selectedFilament)) {
      let profileId = [];
      printer.selectedFilament.forEach((spool, index) => {
        if (spool !== null) {
          if (filamentPluginEnabled) {
            profileId = _.findIndex(profiles, function (o) {
              return o.profile.index == printer.selectedFilament[index].spools.profile;
            });
          } else {
            profileId = _.findIndex(profiles, function (o) {
              return o._id == printer.selectedFilament[index].spools.profile;
            });
          }
          printer.selectedFilament[index].spools.profile = profiles[profileId].profile;
        }
      });
    }
    if (historyCollection.length === 0) {
      counter = 0;
    } else {
      counter = historyCollection[historyCollection.length - 1].printHistory.historyIndex + 1;
    }

    const printHistory = {
      success: jobSuccess,
      historyIndex: counter,
      printerName: name,
      printerID: printer._id,
      costSettings: printer.costSettings,
      reason: payload.reason,
      fileName: payload.name,
      fileDisplay: payload.display,
      filePath: payload.path,
      startDate,
      endDate,
      thumbnail: "",
      printTime: Math.round(payload.time),
      filamentSelection: printer.selectedFilament,
      previousFilamentSelection: previousFilament,
      job,
      notes: "",
      snapshot: "",
      resends
    };

    const newHistoryDoc = new History({
      printHistory
    });

    // TODO dont save when errors can still be thrown below
    await newHistoryDoc.save();

    const thumbnail = await this.thumbnailCheck(printer, newHistoryDoc._id, {
      payload,
      files,
      event: eventName
    });

    let snapshot = "";
    if (printer.camURL !== "") {
      snapshot = await this.snapshotCheck(printer, newHistoryDoc, {
        payload,
        event: eventName
      });
    }

    newHistoryDoc.printHistory.thumbnail = thumbnail;
    newHistoryDoc.printHistory.snapshot = snapshot;
    newHistoryDoc.markModified("printHistory");
    await newHistoryDoc.save();

    const timelapseEventSettings = this.#getHistorySubSettings(HISTORY_SETTINGS.timelapse);
    if (!!timelapseEventSettings?.onFailure) {
      await this.timelapseCheck(printer, newHistoryDoc._id, payload.name, payload.time);
    }

    // TODO wrong place
    // await this.updateFilamentInfluxDB(
    //   printer.selectedFilament,
    //   printHistory,
    //   previousFilament,
    //   printer
    // );

    // TODO eh this is not proper
    // printer.fileName = payload.display;
    // printer.filePath = payload.path;

    // TODO Eh
    // ScriptRunner.check(printer, jobSuccess ? "done" : "failed", newHistoryDoc._id);
    // await getHistoryCache().initCache();
    // setTimeout(async function () {
    //   await getHistoryCache().initCache();
    //   HistoryCollection.updateInfluxDB(newHistoryDoc._id, "history", printer);
    // }, 5000);
  }
}

module.exports = HistoryService;
