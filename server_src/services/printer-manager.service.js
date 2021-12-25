const Logger = require("../handlers/logger.js");

const PrinterService = require("./printer.service");
const { OctoPrintPrinter } = require("../services/printers/create-octoprint.service");
const { PRINTER_CATEGORIES } = require("./printers/constants/printer-categories.constants");
const { CATEGORIES } = require("./printers/constants/printer-state.constants");
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
        printer.killAllConnections();
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
    logger.debug(printerList.length + " printers updating state counters...");
    for (let i = 0; i < printerList.length; i++) {
      const printer = printerList[i];
      if (!printer.disabled && !!printer?.printerState?.colour?.category) {
        switch (printer.printerState.colour.category) {
          case CATEGORIES.ACTIVE:
            this.updateStateCounterCategory(CATEGORIES.ACTIVE, printer);
            break;
          case CATEGORIES.IDLE:
            this.updateStateCounterCategory(CATEGORIES.IDLE, printer);
            break;
          case CATEGORIES.DISCONNECTED:
            this.updateStateCounterCategory(CATEGORIES.IDLE, printer);
            break;
          case CATEGORIES.COMPLETE:
            this.updateStateCounterCategory(CATEGORIES.IDLE, printer);
            break;
          case CATEGORIES.DISABLED:
            this.updateStateCounterCategory(CATEGORIES.OFFLINE, printer);
            break;
          case CATEGORIES.OFFLINE:
            this.updateStateCounterCategory(CATEGORIES.OFFLINE, printer);
            break;
          case CATEGORIES.ERROR:
            this.updateStateCounterCategory(CATEGORIES.OFFLINE, printer);
            break;
          default:
            logger.debug("Don't know category", printer.printerState.colour.category);
        }
      }
    }
  }

  updateStateCounterCategory(category, printer) {
    logger.debug("Updating " + category + " counter", {
      before: printer["current" + category],
      after: printer["current" + category] + 30000
    });
    printer["current" + category] = printer["current" + category] + 30000;
    printer.updateStateTrackingCounters(category, printer["current" + category]);
  }
}

module.exports = PrinterManagerService;
