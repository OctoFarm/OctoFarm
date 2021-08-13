const Logger = require("../handlers/logger.js");
const logger = new Logger("OctoFarm-Scripts");
const Alerts = require("../models/Alerts.js");
const { NotFoundException } = require("../exceptions/runtime.exceptions");

class ScriptCheckService {
  #scriptsService;

  constructor({ scriptsService }) {
    this.#scriptsService = scriptsService;
  }

  async get(alertId) {
    const filter = { _id: alertId };
    const alert = await Alerts.findOne(filter);

    if (!alert) {
      throw new NotFoundException(`The alert ID '${alertId}' is not an existing Alert.`);
    }

    return alert;
  }

  async delete(alertId) {
    const alert = await this.get(alertId);

    await Alerts.deleteOne({ _id: alert._id });
  }

  /**
   * Save alert - TODO Trigger, message and location validation lacking
   * @param printer
   * @param trigger
   * @param message
   * @param scriptLocation
   * @returns {Promise<string>}
   */
  async save(printer, trigger, message, scriptLocation) {
    let alert = {
      active: true,
      trigger: trigger,
      message: message,
      scriptLocation: scriptLocation,
      printers: printer
    };
    let newAlert = new Alerts(alert);
    logger.info("Saving: " + trigger + " " + scriptLocation + " " + message);
    await newAlert.save().then((e) => {
      logger.info("Saved: " + trigger + " " + scriptLocation + " " + message);
    });

    return newAlert;
  }

  /**
   * Update relevant alert without touching printers
   * @param alertId
   * @param newAlert
   * @returns {Promise<string|undefined>}
   */
  async update(alertId, newAlert) {
    const alert = this.get(alertId);

    alert.active = newAlert.active;
    alert.trigger = newAlert.trigger;
    alert.scriptLocation = newAlert.scriptLocation;
    alert.message = newAlert.message;
    await alert.save();

    return alert;
  }

  /**
   *
   * @param printer
   * @param trigger
   * @param historyID
   * @returns {Promise<void>}
   */
  async check(printer, trigger, historyID) {
    let currentAlerts = await Alerts.find({});
    for (let i = 0; i < currentAlerts.length; i++) {
      if (currentAlerts[i].printer === printer._id || currentAlerts[i].printer.length === 0) {
        if (currentAlerts[i].trigger === trigger && currentAlerts[i].active) {
          let newMessage = await this.convertMessage(printer, currentAlerts[i].message, historyID);

          this.#scriptsService.fire(currentAlerts[i].scriptLocation, newMessage);
        }
      }
    }
  }

  async test(scriptLocation, message) {
    logger.info("Testing Alerts: " + scriptLocation + " " + message);
    return await this.#scriptsService.fire(scriptLocation, JSON.stringify(message));
  }

  async fire(scriptLocation, message) {
    logger.info("Alert Fire: " + scriptLocation + " " + message);
    return await this.#scriptsService.fire(scriptLocation, message);
  }

  async convertMessage(printer, message, historyID) {
    let job = "";
    if (typeof printer.job != "undefined") {
      job = printer.job;
    } else {
      job = {
        file: {
          name: "No File Selected",
          display: "No File Selected",
          path: "No File Selected"
        },
        estimatedPrintTime: 0,
        lastPrintTime: 0
      };
    }
    let progress = "";

    if (typeof printer.progress != "undefined" && printer.progress.completion != null) {
      progress = printer.progress;
    } else {
      progress = {
        completion: 0,
        filepos: 0,
        printTime: "No Time Left",
        printTimeLeft: "No Time Left"
      };
    }

    if (message.includes("[historyID]")) {
      if (typeof historyID !== "undefined") {
        message = message.replace(/\[historyID\]/g, historyID);
      } else {
        message = message.replace(/\[historyID\]/g, "(undefined history id)");
      }
    }
    if (message.includes("[ETA]")) {
      let dateComplete = "No Active Print";
      if (typeof printer.progress !== "undefined" && printer.progress.printTimeLeft !== null) {
        let currentDate = new Date();
        currentDate = currentDate.getTime();
        let futureDateString = new Date(
          currentDate + printer.progress.printTimeLeft * 1000
        ).toDateString();
        let futureTimeString = new Date(
          currentDate + printer.progress.printTimeLeft * 1000
        ).toTimeString();
        futureTimeString = futureTimeString.substring(0, 8);
        dateComplete = futureDateString + ": " + futureTimeString;
      }
      message = message.replace(/\[ETA\]/g, dateComplete);
    }
    if (message.includes("[PrinterName]")) {
      message = message.replace(/\[PrinterName\]/g, printer.settingsAppearance.name);
    }
    if (message.includes("[PrinterURL]")) {
      message = message.replace(/\[PrinterURL\]/g, printer.printerURL);
    }
    if (message.includes("[PrinterAPIKey]")) {
      message = message.replace(/\[PrinterAPIKey\]/g, printer.apiKey);
    }
    if (message.includes("[TimeRemaining]")) {
      message = message.replace(/\[TimeRemaining\]/g, generateTime(progress.printTimeLeft));
    }
    if (message.includes("[EstimatedTime]")) {
      message = message.replace(/\[EstimatedTime\]/g, generateTime(job.estimatedPrintTime));
    }
    if (message.includes("[CurrentZ]")) {
      let current = "";
      if (typeof printer.currentZ === "undefined" || printer.currentZ === null) {
        current = "No Current Z";
      } else {
        current = printer.currentZ + "mm";
      }
      message = message.replace(/\[CurrentZ\]/g, current);
    }
    if (message.includes("[PercentRemaining]")) {
      if (progress.completion === 0) {
        message = message.replace(/\[PercentRemaining\]/g, progress.completion + "%");
      } else {
        message = message.replace(/\[PercentRemaining\]/g, progress.completion.toFixed(2) + "%");
      }
    }
    if (message.includes("[CurrentTime]")) {
      let dateNow = new Date();
      dateNow = dateNow.toLocaleString();
      message = message.replace(/\[CurrentTime\]/g, dateNow);
    }
    if (message.includes("[CurrentFile]")) {
      message = message.replace(/\[CurrentFile\]/g, printer.fileName);
    }
    if (message.includes("[CurrentFilePath]")) {
      message = message.replace(/\[CurrentFilePath\]/g, printer.filePath);
    }
    if (message.includes("[Tool0Temp]")) {
      if (
        typeof printer.temps != "undefined" &&
        typeof printer.temps[0].tool0 != "undefined" &&
        typeof printer.temps[0].tool0.target != "undefined"
      ) {
        message = message.replace(
          /\[Tool0Temp\]/g,
          "T:" +
            printer.temps[0].tool0.target +
            "°C" +
            " / A:" +
            printer.temps[0].tool0.actual +
            "°C"
        );
      } else {
        message = message.replace(/\[Tool0Temp\]/g, "No tool0 temperature");
      }
    }
    if (message.includes("[BedTemp]")) {
      if (
        typeof printer.temps != "undefined" &&
        typeof printer.temps[0].bed != "undefined" &&
        typeof printer.temps[0].bed.target != "undefined"
      ) {
        message = message.replace(
          /\[BedTemp\]/g,
          "T:" + printer.temps[0].bed.target + "°C" + " / A:" + printer.temps[0].bed.actual + "°C"
        );
      } else {
        message = message.replace(/\[BedTemp\]/g, "No tool0 temperature");
      }
    }
    if (message.includes("[Error!]")) {
      let errMess = "No Error";
      if (typeof printer.state !== "undefined" && printer.state.includes("Error")) {
        errMess = printer.stateDescription;
      }
      message = message.replace(/\[Error!\]/g, errMess);
    }

    return JSON.stringify(message);
  }
}

// TODO replace with luxon formatter
const generateTime = function (seconds) {
  let string = "";
  if (seconds === undefined || isNaN(seconds) || seconds === null) {
    string = "Done";
  } else {
    let days = Math.floor(seconds / (3600 * 24));

    seconds -= days * 3600 * 24;
    let hrs = Math.floor(seconds / 3600);

    seconds -= hrs * 3600;
    let mnts = Math.floor(seconds / 60);

    seconds -= mnts * 60;
    seconds = Math.floor(seconds);

    string = days + " Days, " + hrs + " Hrs, " + mnts + " Mins, " + seconds + " Seconds";
    if (mnts == 0) {
      if (string.includes("0 Mins")) {
        string = string.replace(" 0 Mins,", "");
      }
    }
    if (hrs == 0) {
      if (string.includes("0 Hrs")) {
        string = string.replace(" 0 Hrs,", "");
      }
    }
    if (days == 0) {
      if (string.includes("0 Days")) {
        string = string.replace("0 Days,", "");
      }
    }
    if (mnts == 0 && hrs == 0 && days == 0 && seconds == 0) {
      string = string.replace("0 Seconds", "Done");
    }
  }
  return string;
};

module.exports = ScriptCheckService;
