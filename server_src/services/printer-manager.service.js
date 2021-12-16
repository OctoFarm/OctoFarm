const Logger = require("../handlers/logger.js");
const logger = new Logger("OctoFarm-PrinterManager");
const PrinterService = require("./printer.service");
const PrinterCache = require("../cache/printer.cache");
const { SettingsClean } = require("../lib/dataFunctions/settingsClean");

class PrinterManagerService {
  printerList = [];

  static async initialisePrinters() {
    // Grab printers from database
    const pList = await PrinterService.list();
    logger.debug("Initialising " + pList.length + " printers");
    console.log(pList);
    console.log(SettingsClean.returnSystemSettings());
    // Setup Defaults
    // Save information in cache
  }
  static async setupPrinterDefaults() {}
}

module.exports = {
  PrinterManagerService
};
