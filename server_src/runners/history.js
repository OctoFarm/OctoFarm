const _ = require("lodash");
const fetch = require("node-fetch");
const fs = require("fs");
const request = require("request");

const History = require("../models/History.js");
const ErrorLog = require("../models/ErrorLog.js");
const Logger = require("../lib/logger.js");

const logger = new Logger("OctoFarm-HistoryCollection");
const filamentProfiles = require("../models/Profiles.js");
const ServerSettings = require("../models/ServerSettings.js");
const Spool = require("../models/Filament.js");

const FilamentManagerReSync = require("./filamentManagerPlugin.js");

const { FilamentManagerPlugin } = FilamentManagerReSync;

const historyClean = require("../lib/dataFunctions/historyClean.js");

const { HistoryClean } = historyClean;

const runner = require("../runners/state.js");
const { Runner } = runner;

const MjpegDecoder = require("mjpeg-decoder");

let counter = 0;
let errorCounter = 0;

class HistoryCollection {
  static async resyncFilament(printer) {
    const returnSpools = [];

    for (let i = 0; i < printer.selectedFilament.length; i++) {
      if (printer.selectedFilament[i] !== null) {
        const spools = await fetch(
          `${printer.printerURL}/plugin/filamentmanager/spools/${printer.selectedFilament[i].spools.fmID}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "X-Api-Key": printer.apikey,
            },
          }
        );
        const spool = await Spool.findById(printer.selectedFilament[i]._id);
        const sp = await spools.json();
        spool.spools = {
          name: sp.spool.name,
          profile: sp.spool.profile.id,
          price: sp.spool.cost,
          weight: sp.spool.weight,
          used: sp.spool.used,
          tempOffset: sp.spool.temp_offset,
          fmID: sp.spool.id,
        };
        spool.markModified("spools");
        await spool.save();
        returnSpools.push(spool);
      }
    }

    const reSync = await FilamentManagerPlugin.filamentManagerReSync();
    // Return success
    if (reSync === "success") {
      logger.info("Successfully resynced filament manager");
    } else {
      logger.info("Unsuccessfull in resyncing filament manager");
    }
    return returnSpools;
  }

  static async grabThumbnail(url, thumbnail, id) {
    const download = (url, path, callback) => {
      request.head(url, (err, res, body) => {
        request(url).pipe(fs.createWriteStream(path)).on("close", callback);
      });
    };
    const thumbParts = thumbnail.split("/");
    const result = thumbParts[thumbParts.length - 1];
    const splitAgain = result.split("?");

    const path = `./images/historyCollection/thumbs/${id}-${splitAgain[0]}`;
    if (!fs.existsSync(`./images/historyCollection`)) {
      fs.mkdirSync(`./images/historyCollection`);
    }
    if (!fs.existsSync(`./images/historyCollection/thumbs`)) {
      fs.mkdirSync(`./images/historyCollection/thumbs`);
    }
    await download(url, path, () => {
      logger.info("Downloaded: ", url);
      logger.info(`images/historyCollection/thumbs/${id}-${splitAgain[0]}`);
    });

    return `images/historyCollection/thumbs/${id}-${splitAgain[0]}`;
  }
  static async snapPictureOfPrinter(url, id, fileDisplay) {
    if (!fs.existsSync(`./images/historyCollection`)) {
      fs.mkdirSync(`./images/historyCollection`);
    }
    if (!fs.existsSync(`./images/historyCollection/snapshots`)) {
      fs.mkdirSync(`./images/historyCollection/snapshots`);
    }
    const decoder = MjpegDecoder.decoderForSnapshot(url);
    const frame = await decoder.takeSnapshot();
    await fs.writeFileSync(
      `./images/historyCollection/snapshots/${id}-${fileDisplay}.jpg`,
      frame
    );
    logger.info("Downloaded: ", url);
    logger.info(
      "Saved as: ",
      `images/historyCollection/snapshots/${id}-${fileDisplay}.jpg`
    );
    return `images/historyCollection/snapshots/${id}-${fileDisplay}.jpg`;
  }

  static async thumbnailCheck(
    payload,
    serverSettings,
    files,
    id,
    event,
    printer
  ) {
    let runCapture = async () => {
      // grab Thumbnail if available.
      const currentFileIndex = _.findIndex(files, function (o) {
        return o.name === payload.name;
      });
      let base64Thumbnail = null;
      if (currentFileIndex > -1) {
        if (
          typeof files[currentFileIndex] !== "undefined" &&
          files[currentFileIndex].thumbnail != null
        ) {
          base64Thumbnail = await HistoryCollection.grabThumbnail(
            `${printer.printerURL}/${files[currentFileIndex].thumbnail}`,
            files[currentFileIndex].thumbnail,
            id
          );
        }
      }
      return base64Thumbnail;
    };

    if (typeof serverSettings.history === "undefined") {
      //Use default settings, so always capture...
      return await runCapture();
    } else {
      if (serverSettings.history.thumbnails[event]) {
        return await runCapture();
      } else {
        return null;
      }
    }
  }
  static async snapshotCheck(
    event,
    serverSettings,
    printer,
    saveHistory,
    payload
  ) {
    if (typeof serverSettings.history === "undefined") {
      //Use default settings, so always capture...
      return await HistoryCollection.snapPictureOfPrinter(
        printer.camURL,
        saveHistory._id,
        payload.name
      );
    } else {
      if (serverSettings.history.snapshot[event]) {
        return await HistoryCollection.snapPictureOfPrinter(
          printer.camURL,
          saveHistory._id,
          payload.name
        );
      } else {
        return null;
      }
    }
  }

  static async complete(payload, printer, job, files) {
    try {
      const serverSettings = await ServerSettings.find({});
      const previousFilament = JSON.parse(
        JSON.stringify(printer.selectedFilament)
      );
      let name = null;
      if (typeof printer.settingsApperance !== "undefined") {
        if (
          printer.settingsApperance.name === "" ||
          printer.settingsApperance.name === null
        ) {
          name = printer.printerURL;
        } else {
          name = printer.settingsApperance.name;
        }
      } else {
        name = printer.printerURL;
      }
      if (
        serverSettings[0].filamentManager &&
        Array.isArray(printer.selectedFilament)
      ) {
        printer.selectedFilament = await HistoryCollection.resyncFilament(
          printer
        );
        logger.info(
          "Grabbed latest filament values",
          printer.filamentSelection
        );
      }
      logger.info("Completed Print triggered", payload + printer.printerURL);
      const today = new Date();
      const historyCollection = await History.find({});

      const printTime = new Date(payload.time * 1000);
      let startDate = today.getTime() - printTime.getTime();
      startDate = new Date(startDate);

      const startDDMM = startDate.toDateString();
      const startTime = startDate.toTimeString();
      const startTimeFormat = startTime.substring(0, 8);
      startDate = `${startDDMM} - ${startTimeFormat}`;

      const endDDMM = today.toDateString();
      const endTime = today.toTimeString();
      const endTimeFormat = endTime.substring(0, 8);
      const endDate = `${endDDMM} - ${endTimeFormat}`;
      const profiles = await filamentProfiles.find({});

      const selectedFilament = null;
      if (
        printer.selectedFilament !== null &&
        Array.isArray(printer.selectedFilament)
      ) {
        let profileId = [];
        printer.selectedFilament.forEach((spool, index) => {
          if (spool !== null) {
            if (serverSettings[0].filamentManager) {
              profileId = _.findIndex(profiles, function (o) {
                return (
                  o.profile.index ==
                  printer.selectedFilament[index].spools.profile
                );
              });
            } else {
              profileId = _.findIndex(profiles, function (o) {
                return o._id == printer.selectedFilament[index].spools.profile;
              });
            }
            printer.selectedFilament[index].spools.profile =
              profiles[profileId].profile;
          }
        });
      }
      if (historyCollection.length === 0) {
        counter = 0;
      } else {
        counter =
          historyCollection[historyCollection.length - 1].printHistory
            .historyIndex + 1;
      }

      const printHistory = {
        historyIndex: counter,
        printerName: name,
        printerID: printer._id,
        costSettings: printer.costSettings,
        success: true,
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
      };

      const saveHistory = new History({
        printHistory,
      });
      await saveHistory.save().then(async (r) => {
        if (printer.camURL !== "") {
          const thumbnail = await HistoryCollection.thumbnailCheck(
            payload,
            serverSettings[0],
            files,
            saveHistory._id,
            "onFailure",
            printer
          );
          const snapshot = await HistoryCollection.snapshotCheck(
            "onFailure",
            serverSettings[0],
            printer,
            saveHistory,
            payload
          );

          saveHistory.printHistory.thumbnail = thumbnail;
          saveHistory.printHistory.snapshot = snapshot;
          saveHistory.markModified("printHistory");
          saveHistory.save();

          HistoryClean.start();
          setTimeout(function () {
            HistoryClean.start();
          }, 5000);
        }
      });

      logger.info(
        "Completed Print Captured for ",
        payload + printer.printerURL
      );
    } catch (e) {
      logger.error(e, `Failed to capture history for ${printer.printerURL}`);
    }
  }

  static async failed(payload, printer, job, files) {
    try {
      const serverSettings = await ServerSettings.find({});
      const previousFilament = JSON.parse(
        JSON.stringify(printer.selectedFilament)
      );
      if (serverSettings[0].filamentManager) {
        printer.selectedFilament = await HistoryCollection.resyncFilament(
          printer
        );
        logger.info(
          "Grabbed latest filament values",
          printer.filamentSelection
        );
      }
      let name = null;
      if (typeof printer.settingsApperance !== "undefined") {
        if (
          printer.settingsApperance.name === "" ||
          printer.settingsApperance.name === null
        ) {
          name = printer.printerURL;
        } else {
          name = printer.settingsApperance.name;
        }
      } else {
        name = printer.printerURL;
      }
      logger.info("Failed Print triggered ", payload + printer.printerURL);
      const today = new Date();
      const historyCollection = await History.find({});

      const printTime = new Date(payload.time * 1000);
      let startDate = today.getTime() - printTime.getTime();
      startDate = new Date(startDate);

      const startDDMM = startDate.toDateString();
      const startTime = startDate.toTimeString();
      const startTimeFormat = startTime.substring(0, 8);
      startDate = `${startDDMM} - ${startTimeFormat}`;

      const endDDMM = today.toDateString();
      const endTime = today.toTimeString();
      const endTimeFormat = endTime.substring(0, 8);
      const endDate = `${endDDMM} - ${endTimeFormat}`;
      const profiles = await filamentProfiles.find({});

      const selectedFilament = null;
      if (
        printer.selectedFilament !== null &&
        Array.isArray(printer.selectedFilament)
      ) {
        let profileId = [];
        printer.selectedFilament.forEach((spool, index) => {
          if (spool !== null) {
            if (serverSettings[0].filamentManager) {
              profileId = _.findIndex(profiles, function (o) {
                return (
                  o.profile.index ==
                  printer.selectedFilament[index].spools.profile
                );
              });
            } else {
              profileId = _.findIndex(profiles, function (o) {
                return o._id == printer.selectedFilament[index].spools.profile;
              });
            }
            printer.selectedFilament[index].spools.profile =
              profiles[profileId].profile;
          }
        });
      }
      if (historyCollection.length === 0) {
        counter = 0;
      } else {
        counter =
          historyCollection[historyCollection.length - 1].printHistory
            .historyIndex + 1;
      }

      const printHistory = {
        historyIndex: counter,
        printerIndex: printer.index,
        costSettings: printer.costSettings,
        printerID: printer._id,
        printerName: name,
        success: false,
        reason: payload.reason,
        fileName: payload.name,
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
      };
      const saveHistory = new History({
        printHistory,
      });
      await saveHistory.save().then(async (r) => {
        if (printer.camURL !== "") {
          const thumbnail = await HistoryCollection.thumbnailCheck(
            payload,
            serverSettings[0],
            files,
            saveHistory._id,
            "onFailure",
            printer
          );
          const snapshot = await HistoryCollection.snapshotCheck(
            "onFailure",
            serverSettings[0],
            printer,
            saveHistory,
            payload
          );

          saveHistory.printHistory.thumbnail = thumbnail;
          saveHistory.printHistory.snapshot = snapshot;
          saveHistory.markModified("printHistory");
          saveHistory.save();

          HistoryClean.start();
          setTimeout(function () {
            HistoryClean.start();
          }, 5000);
        }
      });

      logger.info("Failed Print captured ", payload + printer.printerURL);
    } catch (e) {
      console.log(e);
      logger.error(e, `Failed to capture history for ${printer.printerURL}`);
    }
  }

  static async errorLog(payload, printer, job, files) {
    try {
      let name = null;
      if (typeof printer.settingsApperance !== "undefined") {
        if (
          printer.settingsApperance.name === "" ||
          printer.settingsApperance.name === null
        ) {
          name = printer.printerURL;
        } else {
          name = printer.settingsApperance.name;
        }
      } else {
        name = printer.printerURL;
      }
      logger.info(
        "Error Log Collection Triggered",
        payload + printer.printerURL
      );
      const today = new Date();
      const errorCollection = await ErrorLog.find({});

      const printTime = new Date(payload.time * 1000);
      let startDate = today.getTime() - printTime.getTime();
      startDate = new Date(startDate);

      const startDDMM = startDate.toDateString();
      const startTime = startDate.toTimeString();
      const startTimeFormat = startTime.substring(0, 8);
      startDate = `${startDDMM} - ${startTimeFormat}`;

      const endDDMM = today.toDateString();
      const endTime = today.toTimeString();
      const endTimeFormat = endTime.substring(0, 8);
      const endDate = `${endDDMM} - ${endTimeFormat}`;

      if (errorCollection.length === 0) {
        errorCounter = 0;
      } else {
        errorCounter =
          errorCollection[errorCollection.length - 1].errorLog.historyIndex + 1;
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
        notes: "",
      };
      const saveError = new ErrorLog({
        errorLog,
      });
      await saveError.save();
      HistoryClean.start();
      logger.info("Error captured ", payload + printer.printerURL);
    } catch (e) {
      logger.error(e, `Failed to capture ErrorLog for ${printer.printerURL}`);
    }
  }

  static history() {
    const printHistory = {
      printerIndex: 0,
      printerName: "",
      success: true,
      fileName: "",
      filePath: "",
      startDate: "",
      endDate: "",
      printTime: "",
      spoolUsed: "",
      filamentLength: 0,
      filamentVolume: 0,
      notes: "",
    };
    return printHistory;
  }

  static get(ip, port, apikey, item) {
    const url = `http://${ip}:${port}/api/${item}`;
    return fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apikey,
      },
    });
  }

  static resyncFilamentManager() {}
}

const generateTime = function (seconds) {
  let string = "";
  if (seconds === undefined || isNaN(seconds)) {
    string = "Done";
  } else {
    const days = Math.floor(seconds / (3600 * 24));

    seconds -= days * 3600 * 24;
    const hrs = Math.floor(seconds / 3600);

    seconds -= hrs * 3600;
    const mnts = Math.floor(seconds / 60);

    seconds -= mnts * 60;
    seconds = Math.floor(seconds);

    string = `${days} Days, ${hrs} Hrs, ${mnts} Mins, ${seconds} Seconds`;

    if (string.includes("0 Days")) {
      string = string.replace("0 Days,", "");
    }
    if (string.includes("0 Hrs")) {
      string = string.replace(" 0 Hrs,", "");
    }
    if (string.includes("0 Mins")) {
      string = string.replace(" 0 Mins,", "");
    }
    if (mnts > 0 || hrs > 0 || days > 0 || seconds > 0) {
    } else {
      string = string.replace("0 Seconds", "Done");
    }
  }

  return string;
};
module.exports = {
  HistoryCollection,
};
