const ErrorLog = require("../models/ErrorLog.js");
const Logger = require("../handlers/logger");
const { durationToDates } = require("../utils/time.util");

let errorCounter = 0;

class ErrorLogService {
  #logger = new Logger("ErrorLog-Service");

  async saveErrorLog(payload, printer, job) {
    let printerName = printer.getName();
    const { startDate, endDate } = durationToDates(payload.time);

    // TODO Move such a notice up-wards to caller
    this.#logger.info("Error Log Collection Triggered", payload + printer.printerURL);

    const errorCollection = await ErrorLog.find({});

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
      printerName,
      success: false,
      reason: payload.error,
      startDate,
      endDate,
      printTime: Math.round(payload.time),
      job,
      notes: ""
    };
    const saveError = new ErrorLog({
      errorLog
    });
    await saveError.save();

    // TODO why is this in a derivative service?
    // await getHistoryCache().initCache();

    // TODO use event system instead and move that upwards
    // ScriptRunner.check(printer, "error", saveError._id);

    this.#logger.info("Error captured ", payload + printer.printerURL);
  }
}

module.exports = ErrorLogService;
