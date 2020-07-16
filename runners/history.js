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

const { filamentManagerReSync } = require("./filamentManagerPlugin.js");

let counter = 0;
let errorCounter = 0;

class HistoryCollection {
  static async resyncFilament(printer) {
    const returnSpools = [];
    for (let i = 0; i < printer.selectedFilament.length; i++) {
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
    const reSync = await filamentManagerReSync();
    // Return success
    if (reSync === "success") {
      logger.info("Successfully resynced filament manager");
    } else {
      logger.info("Unsuccessfull in resyncing filament manager");
    }
    return returnSpools;
  }

  static async grabThumbnail(url, thumbnail) {
    const download = (url, path, callback) => {
      request.head(url, (err, res, body) => {
        request(url).pipe(fs.createWriteStream(path)).on("close", callback);
      });
    };
    const thumbParts = thumbnail.split("/");
    const result = thumbParts[thumbParts.length - 1];
    const splitAgain = result.split("?");

    const path = `./historyCollection/thumbs/${splitAgain[0]}`;

    await download(url, path, () => {
      logger.info("Downloaded: ", url);
      logger.info("Saved as: ", splitAgain[0]);
    });

    return `./historyCollection/thumbs/${splitAgain[0]}`;
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
      // grab Thumbnail if available.
      const currentFileIndex = _.findIndex(files, function (o) {
        return o.name == payload.name;
      });
      let base64Thumbnail = null;
      if (currentFileIndex > -1) {
        if (
          typeof files[currentFileIndex] !== "undefined" &&
          files[currentFileIndex].thumbnail != null
        ) {
          base64Thumbnail = await HistoryCollection.grabThumbnail(
            `${printer.printerURL}/${files[currentFileIndex].thumbnail}`,
            files[currentFileIndex].thumbnail
          );
        }
      }

      const printHistory = {
        historyIndex: counter,
        printerName: name,
        costSettings: printer.costSettings,
        success: true,
        reason: payload.reason,
        fileName: payload.name,
        fileDisplay: payload.display,
        filePath: payload.path,
        startDate,
        endDate,
        thumbnail: base64Thumbnail,
        printTime: Math.round(payload.time),
        filamentSelection: printer.selectedFilament,
        previousFilamentSelection: previousFilament,
        job,
        notes: "",
      };

      const saveHistory = new History({
        printHistory,
      });
      await saveHistory.save();

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
      // grab Thumbnail if available.
      const currentFileIndex = _.findIndex(files, function (o) {
        return o.name == payload.name;
      });
      let base64Thumbnail = null;
      if (currentFileIndex > -1) {
        if (
          typeof files[currentFileIndex] !== "undefined" &&
          files[currentFileIndex].thumbnail != null
        ) {
          base64Thumbnail = await HistoryCollection.grabThumbnail(
            `${printer.printerURL}/${files[currentFileIndex].thumbnail}`,
            files[currentFileIndex].thumbnail
          );
        }
      }

      const printHistory = {
        historyIndex: counter,
        printerIndex: printer.index,
        costSettings: printer.costSettings,
        printerName: name,
        success: false,
        reason: payload.reason,
        fileName: payload.name,
        filePath: payload.path,
        startDate,
        endDate,
        thumbnail: base64Thumbnail,
        printTime: Math.round(payload.time),
        filamentSelection: printer.selectedFilament,
        previousFilamentSelection: previousFilament,
        job,
        notes: "",
      };
      const saveHistory = new History({
        printHistory,
      });
      saveHistory.save();
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
      // grab Thumbnail if available.
      // grab Thumbnail if available.
      const currentFileIndex = _.findIndex(files, function (o) {
        return o.name == payload.name;
      });
      let base64Thumbnail = null;
      if (currentFileIndex > -1) {
        if (
          typeof files[currentFileIndex] !== "undefined" &&
          files[currentFileIndex].thumbnail != null
        ) {
          base64Thumbnail = await HistoryCollection.grabThumbnail(
            `${printer.printerURL}/${files[currentFileIndex].thumbnail}`,
            files[currentFileIndex].thumbnail
          );
        }
      }
      const errorLog = {
        historyIndex: errorCounter,
        printerIndex: printer.index,
        costSettings: printer.costSettings,
        printerName: name,
        success: false,
        reason: payload.error,
        startDate,
        endDate,
        thumbnail: base64Thumbnail,
        printTime: Math.round(payload.time),
        job,
        notes: "",
      };
      const saveError = new ErrorLog({
        errorLog,
      });
      saveError.save();

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
