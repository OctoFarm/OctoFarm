const History = require("../models/History.js");
const ErrorLog = require("../models/ErrorLog.js");
const _ = require("lodash");
const fetch = require("node-fetch");
const Logger = require('../lib/logger.js');
const logger = new Logger('OctoFarm-HistoryCollection')
const filamentProfiles = require("../models/Profiles.js")
const ServerSettings = require("../models/ServerSettings.js")
const Spool = require("../models/Filament.js")
let counter = 0;
let errorCounter = 0;

class HistoryCollection {
  static async resyncFilament(printer){
    let spools = await fetch(`${printer.printerURL}/plugin/filamentmanager/spools/${printer.selectedFilament.spools.fmID}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      }
    });
    let spool = await Spool.findById(printer.selectedFilament._id)
    let sp = await spools.json();
    spool.spools = {
      name: sp.spool.name,
      profile: sp.spool.profile.id,
      price: sp.spool.cost,
      weight: sp.spool.weight,
      used: sp.spool.used,
      tempOffset: sp.spool.temp_offset,
      fmID: sp.spool.id
    };
    spool.markModified("spools")
    await spool.save();
    return spool
  }
  static async complete(payload, printer, job) {
    try{
      let serverSettings = await ServerSettings.find({});
      let previousFilament = JSON.parse(JSON.stringify(printer.selectedFilament));
      if(serverSettings[0].filamentManager){
        printer.selectedFilament = await HistoryCollection.resyncFilament(printer);
        logger.info("Grabbed latest filament values", printer.filamentSelection);
      }
      logger.info("Completed Print triggered", payload + printer.printerURL);
      let today = new Date();
      let historyCollection = await History.find({});

      let printTime = new Date(payload.time * 1000);
      let startDate = today.getTime() - printTime.getTime();
      startDate = new Date(startDate);

      let startDDMM = startDate.toDateString();
      let startTime = startDate.toTimeString();
      let startTimeFormat = startTime.substring(0, 8);
      startDate = startDDMM + " - " + startTimeFormat;

      let endDDMM = today.toDateString();
      let endTime = today.toTimeString();
      let endTimeFormat = endTime.substring(0, 8);
      let endDate = endDDMM + " - " + endTimeFormat;
      let profiles = await filamentProfiles.find({});

      if(printer.selectedFilament !== null){
        let profileId = null;
        if(serverSettings[0].filamentManager){
          profileId = _.findIndex(profiles, function (o) {
            return o.profile.index == printer.selectedFilament.spools.profile;
          });
        }else{
          profileId = _.findIndex(profiles, function (o) {
            return o._id == printer.selectedFilament.spools.profile;
          });
        }
        printer.selectedFilament.spools.profile = profiles[profileId].profile;
      }

      let name = null;
      if (typeof printer.settingsApperance != "undefined") {
        if (printer.settingsApperance.name === "" || printer.settingsApperance.name === null) {
          name = printer.printerURL;
        } else {
          name = printer.settingsApperance.name;
        }
      } else {
        name = printer.printerURL;
      }
        if(historyCollection.length === 0){
          counter = 0
        }else{
          counter = historyCollection[historyCollection.length-1].printHistory.historyIndex + 1
        }

      let printHistory = {
        historyIndex: counter,
        printerName: name,
        costSettings: printer.costSettings,
        success: true,
        reason: payload.reason,
        fileName: payload.name,
        fileDisplay: payload.display,
        filePath: payload.path,
        startDate: startDate,
        endDate: endDate,
        printTime: Math.round(payload.time),
        filamentSelection: printer.selectedFilament,
        previousFilamentSelection: previousFilament,
        job: job,
        notes: ""
      };

      let saveHistory = new History({
        printHistory
      });
      await saveHistory.save();

      logger.info("Completed Print Captured for ", payload + printer.printerURL);
    }catch(e){
      logger.error(e, "Failed to capture history for " + printer.printerURL);
    }

  }
  static async failed(payload, printer, job) {
    try {
      let serverSettings = await ServerSettings.find({});
      let previousFilament = JSON.parse(JSON.stringify(printer.selectedFilament));
      if (serverSettings[0].filamentManager) {
        printer.selectedFilament = await HistoryCollection.resyncFilament(printer);
        logger.info("Grabbed latest filament values", printer.filamentSelection);
      }
      let name = null;
      if (typeof printer.settingsApperance != "undefined") {
        if (printer.settingsApperance.name === "" || printer.settingsApperance.name === null) {
          name = printer.printerURL;
        } else {
          name = printer.settingsApperance.name;
        }
      } else {
        name = printer.printerURL;
      }
      logger.info("Failed Print triggered ", payload + printer.printerURL);
      let today = new Date();
      let historyCollection = await History.find({});

      let printTime = new Date(payload.time * 1000);
      let startDate = today.getTime() - printTime.getTime();
      startDate = new Date(startDate);

      let startDDMM = startDate.toDateString();
      let startTime = startDate.toTimeString();
      let startTimeFormat = startTime.substring(0, 8);
      startDate = startDDMM + " - " + startTimeFormat;

      let endDDMM = today.toDateString();
      let endTime = today.toTimeString();
      let endTimeFormat = endTime.substring(0, 8);
      let endDate = endDDMM + " - " + endTimeFormat;
      let profiles = await filamentProfiles.find({});

      let selectedFilament = null;
      if (printer.selectedFilament !== null) {
        let profileId = null;
        if (serverSettings[0].filamentManager) {
          profileId = _.findIndex(profiles, function (o) {
            return o.profile.index == printer.selectedFilament.spools.profile;
          });
        } else {
          profileId = _.findIndex(profiles, function (o) {
            return o._id == printer.selectedFilament.spools.profile;
          });
        }
        printer.selectedFilament.spools.profile = profiles[profileId].profile;
      }
      if (historyCollection.length === 0) {
        counter = 0
      } else {
        counter = historyCollection[historyCollection.length - 1].printHistory.historyIndex + 1
      }

      let printHistory = {
        historyIndex: counter,
        printerIndex: printer.index,
        costSettings: printer.costSettings,
        printerName: name,
        success: false,
        reason: payload.reason,
        fileName: payload.name,
        filePath: payload.path,
        startDate: startDate,
        endDate: endDate,
        printTime: Math.round(payload.time),
        filamentSelection: printer.selectedFilament,
        previousFilamentSelection: previousFilament,
        job: job,
        notes: ""
      };
      let saveHistory = new History({
        printHistory
      });
      saveHistory.save();

      logger.info("Failed Print captured ", payload + printer.printerURL);
    } catch (e) {
      logger.error(e, "Failed to capture history for " + printer.printerURL);
    }
  }
    static async errorLog(payload, printer, job) {
      try{
        let name = null;
        if (typeof printer.settingsApperance != "undefined") {
          if (printer.settingsApperance.name === "" || printer.settingsApperance.name === null) {
            name = printer.printerURL;
          } else {
            name = printer.settingsApperance.name;
          }
        } else {
          name = printer.printerURL;
        }
        logger.info("Error Log Collection Triggered", payload + printer.printerURL);
        let today = new Date();
        let errorCollection = await ErrorLog.find({});

        let printTime = new Date(payload.time * 1000);
        let startDate = today.getTime() - printTime.getTime();
        startDate = new Date(startDate);

        let startDDMM = startDate.toDateString();
        let startTime = startDate.toTimeString();
        let startTimeFormat = startTime.substring(0, 8);
        startDate = startDDMM + " - " + startTimeFormat;

        let endDDMM = today.toDateString();
        let endTime = today.toTimeString();
        let endTimeFormat = endTime.substring(0, 8);
        let endDate = endDDMM + " - " + endTimeFormat;

        if(errorCollection.length === 0){
          errorCounter = 0
        }else{
          errorCounter = errorCollection[errorCollection.length-1].errorLog.historyIndex + 1
        }

        let errorLog = {
          historyIndex: errorCounter,
          printerIndex: printer.index,
          costSettings: printer.costSettings,
          printerName: name,
          success: false,
          reason: payload.error,
          startDate: startDate,
          endDate: endDate,
          printTime: Math.round(payload.time),
          job: job,
          notes: ""
        };
        let saveError = new ErrorLog({
          errorLog
        });
        saveError.save();

        logger.info("Error captured ", payload + printer.printerURL);
      }catch(e){
        logger.error(e, "Failed to capture ErrorLog for " + printer.printerURL);
      }
  }
  static history() {
    let printHistory = {
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
      notes: ""
    };
    return printHistory;

  }

  static get(ip, port, apikey, item) {
    let url = `http://${ip}:${port}/api/${item}`;
    return fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apikey
      }
    });
  }
}

const generateTime = function(seconds) {
  let string = "";
  if (seconds === undefined || isNaN(seconds)) {
    string = "Done";
  } else {
    let days = Math.floor(seconds / (3600 * 24));

    seconds -= days * 3600 * 24;
    let hrs = Math.floor(seconds / 3600);

    seconds -= hrs * 3600;
    let mnts = Math.floor(seconds / 60);

    seconds -= mnts * 60;
    seconds = Math.floor(seconds);

    string =
      days +
      " Days, " +
      hrs +
      " Hrs, " +
      mnts +
      " Mins, " +
      seconds +
      " Seconds";

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
  HistoryCollection: HistoryCollection
};
