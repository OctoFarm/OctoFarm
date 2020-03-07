const History = require("../models/History.js");
const _ = require("lodash");
const fetch = require("node-fetch");

class HistoryCollection {
  static async complete(payload, printer) {
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

    let jobLength = "";
    let jobVolume = "";
    if (typeof printer.job.filament.tool0.length != "undefined") {
      jobLength = printer.job.filament.tool0.length;
      jobVolume = printer.job.filament.tool0.volume;
    } else {
      jobLength = 0;
      jobVolume = 0;
    }

    let printHistory = {
      historyIndex: historyCollection.length + 1,
      printerIndex: printer.index,
      printerName: printer.settingsApperance.name,
      success: true,
      reason: payload.reason,
      fileName: payload.name,
      filePath: payload.path,
      startDate: startDate,
      endDate: endDate,
      printTime: Math.round(payload.time),
      spoolUsed: "-",
      filamentLength: jobLength,
      filamentVolume: jobVolume,
      notes: ""
    };

    let saveHistory = new History({
      printHistory
    });
    saveHistory.save();
  }
  static async failed(payload, printer) {
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

    let printHistory = {
      historyIndex: historyCollection.length + 1,
      printerIndex: printer.index,
      printerName: printer.settingsApperance.name,
      success: false,
      reason: payload.reason,
      fileName: payload.name,
      filePath: payload.path,
      startDate: startDate,
      endDate: endDate,
      printTime: Math.round(payload.time),
      spoolUsed: "-",
      filamentLength: "-",
      filamentVolume: "-",
      notes: ""
    };
    let saveHistory = new History({
      printHistory
    });
    saveHistory.save();
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
