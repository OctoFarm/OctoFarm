const Logger = require("../handlers/logger.js");

const PrinterService = require("./printer.service");
const { OctoPrintPrinter } = require("../services/printers/create-octoprint.service");
const { PRINTER_CATEGORIES } = require("./printers/constants/printer-categories.constants");
const { getPrinterStoreCache } = require("../cache/printer-store.cache");

const logger = new Logger("OctoFarm-PrinterManager");

class PrinterManagerService {
  async initialisePrinters() {
    // Grab printers from database
    const pList = await PrinterService.list();
    logger.debug("Initialising " + pList.length + " printers");
    await this.batchCreatePrinters(pList);
    return true;
  }

  deletePrinter() {}

  createPrinter() {}

  editPrinter() {}

  killAllConnections() {
    logger.debug("Killing all printer connections...");
    getPrinterStoreCache()
      .listPrinters()
      .forEach((printer) => {
        printer.killApiTimeout();
        printer.killWebsocketConnection();
      });
  }

  async batchCreatePrinters(printerList) {
    // Async function to send mail to a list of users.
    const createNewPrinterBatches = async (printer) => {
      const printerLength = printer.length;

      for (let i = 0; i < printerLength; i += 10) {
        const requests = printer.slice(i, i + 10).map((printer) => {
          // The batch size is 100. We are processing in a set of 100 users.
          return getPrinterStoreCache().addPrinter(new OctoPrintPrinter(printer));
        });

        // requests will have 100 or less pending promises.
        // Promise.all will wait till all the promises got resolves and then take the next 100.
        logger.debug("Creating printers batch", requests.length);
        await Promise.all(requests).catch((e) =>
          console.log(`Error in sending email for the batch ${i} - ${e}`)
        ); // Catch the error.
      }
    };

    await createNewPrinterBatches(printerList);
  }

  updateStateCounters() {
    const printerList = getPrinterStoreCache().listPrinters();
    for (let i = 0; i < printerList.length; i++) {
      const printer = printerList[i];
      if (!printer.disabled && !printer?.printerState?.colour?.category) {
        switch (printer.printerState.colour.category) {
          case "Active":
            console.log("Active");
            break;
          case "Idle":
          case "Disconnected":
          case "Complete":
            console.log("Idle");
            break;
        }
      }
    }
  }
}

module.exports = PrinterManagerService;
