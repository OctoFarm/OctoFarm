const Logger = require("../handlers/logger.js");

const PrinterService = require("./printer.service");
const PrinterCache = require("../cache/printer.cache");
const { SettingsClean } = require("../lib/dataFunctions/settingsClean");
const { OctoPrintPrinter } = require("../services/printers/create-octoprint.service");

const logger = new Logger("OctoFarm-PrinterManager");

class PrinterManagerService {
  printerList = [];

  static async initialisePrinters() {
    // Grab printers from database
    const pList = await PrinterService.list();
    logger.debug("Initialising " + pList.length + " printers");
    for(let i = 0; i < pList.length; i++){
      const device = new OctoPrintPrinter(pList[i]);
    }


    // Save printer in cache...

    return true;
  }
}

module.exports = {
  PrinterManagerService
};
