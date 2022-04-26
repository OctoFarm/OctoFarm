const { findIndex } = require("lodash");
const fetch = require("node-fetch");
const fs = require("fs");
const History = require("../models/History.js");
const ErrorLog = require("../models/ErrorLog.js");
const Logger = require("../handlers/logger.js");
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
const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const { sleep } = require("../utils/promise.utils");
const { clonePayloadDataForHistory } = require("../utils/mapping.utils");
const { HistoryCollection } = require("./history-capture.service");

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

class ErrorCaptureService {
  #printerID = null;
  #printerName = null;
  #success = null;
  #reason = null;
  #endDate = null;
  #terminal = null;
  #resendStats = null;

  constructor(eventPayload, capturedPrinterData) {
    const { payloadData, printer, resendStats } = clonePayloadDataForHistory(
      eventPayload,
      capturedPrinterData
    );

    const today = new Date();

    this.#printerID = printer._id;
    this.#printerName = printer.printerName;
    this.#success = false;
    this.#reason = payloadData.error;
    this.#endDate = today;
    this.#resendStats = resendStats;
    this.#terminal = null;
  }

  async createErrorLog() {
    // Give time for the error terminal data to come through
    await sleep(2000);
    const { terminal } = getPrinterStoreCache().getPrinterInformation(this.#printerID);

    this.#terminal = terminal.slice(Math.max(terminal.length - 50, 0));

    const newErrorLog = new ErrorLog({
      errorLog: {
        printerID: this.#printerID,
        printerName: this.#printerName,
        success: this.#success,
        reason: this.#reason,
        endDate: this.#endDate,
        terminal: this.#terminal,
        resendStats: this.#resendStats
      }
    });

    await newErrorLog.save().catch(e => {
      logger.error("Couldn't save error log to database: ", e)
    });

    return {
      newErrorLog
    };
  }
}

module.exports = {
  ErrorCaptureService
};
