const Logger = require("../handlers/logger.js");
const logger = new Logger("OctoFarm-PrinterManager");
const PrinterDB = require("../models/Printer")
const { Printer } = require("./printer.service");
const PrinterCache = require("../cache/printer.cache");

class PrinterManagerService {
  static printerList = [];

  static async initialisePrinters() {
    // Grab printers from database
    const pList = await PrinterDB.find({});
    logger.debug("Initialising " + pList.length + " printers");

    for(let i=0;i < pList.length; i++){
      const p = pList[i];
      try{
        this.printerList.push(new Printer(p))
      }catch (e){
        logger.error(e.stack)
      }

    }
  }
}

module.exports = {
  PrinterManagerService
};
