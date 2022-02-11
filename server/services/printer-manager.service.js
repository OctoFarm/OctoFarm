const Logger = require("../handlers/logger.js");

const PrinterService = require("./printer.service");
const { OctoPrintPrinter } = require("../services/printers/create-octoprint.service");
const { CATEGORIES } = require("./printers/constants/printer-state.constants");
const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const { patchPrinterValues } = require("../services/version-patches.service");
const { isEmpty } = require("lodash");
const _ = require("lodash");
const Filament = require("../models/Filament");
const Printers = require("../models/Printer");
const { FileClean } = require("./file-cleaner.service");
const { generatePrinterStatistics } = require("../services/printer-statistics.service");

const logger = new Logger("OctoFarm-PrinterControlManagerService");

class PrinterManagerService {
  #printerGroupList = [];
  #printerControlList = [];

  async initialisePrinters() {
    // Grab printers from database
    const pList = await PrinterService.list();
    logger.debug("Initialising " + pList.length + " printers");
    for (let p = 0; p < pList.length; p++) {
      await patchPrinterValues(pList[p]);
    }
    await this.batchCreatePrinters(pList);
    return true;
  }

  killAllConnections() {
    logger.debug("Killing all printer connections...");
    getPrinterStoreCache()
      .listPrinters()
      .forEach((printer) => {
        printer.killAllConnections();
      });
  }

  async addPrinter(printer) {
    await patchPrinterValues(printer);

    await getPrinterStoreCache().addPrinter(new OctoPrintPrinter(printer));
    return {
      printerURL: printer.printerURL
    };
  }

  async batchCreatePrinters(printerList) {
    // Async function to send mail to a list of users.
    const createNewPrinterBatches = async (printer) => {
      const printerLength = printer.length;

      for (let i = 0; i < printerLength; i += 10) {
        const requests = printer.slice(i, i + 10).map((printer) => {
          // The batch size is 100. We are processing in a set of 100 users.
          return this.addPrinter(printer);
        });

        // requests will have 100 or less pending promises.
        // Promise.all will wait till all the promises got resolves and then take the next 100.
        logger.debug(`Running printer batch ${i + 1}`);
        await Promise.all(requests).catch((e) =>
          logger.error(`Error in creating new printer batch: ${i} - ${e}`)
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
      if (!printer.disabled && printer?.printerState?.colour?.category !== "Offline") {
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
          case CATEGORIES.OFFLINE:
            this.updateStateCounterCategory(CATEGORIES.OFFLINE, printer);
            break;
          case CATEGORIES.ERROR:
            this.updateStateCounterCategory(CATEGORIES.OFFLINE, printer);
            //this.updateStateCounterCategory(CATEGORIES.ERROR, printer);
            break;
          case CATEGORIES.DISABLED:
            //this.updateStateCounterCategory(CATEGORIES.DISABLED, printer);
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

  bulkUpdateBasicPrinterInformation(newPrintersInformation) {
    const { updateGroupListing, changesList, socketsNeedTerminating } =
      getPrinterStoreCache().updatePrintersBasicInformation(newPrintersInformation);

    if (updateGroupListing) this.updateGroupList();

    if (socketsNeedTerminating.length > 0) {
      getPrinterStoreCache().resetPrintersSocketConnections(socketsNeedTerminating);
    }

    return changesList;
  }

  async bulkDeletePrinters(deleteList) {
    const removedPrinterList = [];

    for (let d = 0; d < deleteList.length; d++) {
      const id = deleteList[d];
      const printer = getPrinterStoreCache().getPrinterInformation(id);
      await getPrinterStoreCache().deletePrinter(printer._id);
      // FIXME Make sure printers are cleaned up on deletion...
      // Printer Control List, Printer Filament Selects, Printer Temp Trackers...

      removedPrinterList.push({
        printerURL: printer.printerURL,
        printerId: printer._id
      });
    }
    // Regenerate groups list
    this.updateGroupList();

    // Regenerate sort indexs
    await this.updatePrinterSortIndexes();
    return removedPrinterList;
  }

  returnGroupList() {
    return this.#printerGroupList;
  }

  async updatePrinterSortIndexes(idList = undefined) {
    if (!idList) {
      idList = getPrinterStoreCache().listPrintersIDs();
    }

    if (!!idList) {
      for (let i = 0; i < idList.length; i++) {
        const orderedID = idList[i];
        logger.debug("Updating printers sort index", i);
        getPrinterStoreCache().updatePrinterLiveValue(orderedID, {
          order: i,
          sortIndex: i
        });
        // We have to bypass the database object here and go straight to the printer service as the printer might not have this existing.
        await PrinterService.findOneAndUpdate(orderedID, { sortIndex: i });
      }
      return "Regenerated sortIndex for all printers...";
    }
  }

  updateGroupList() {
    this.#printerGroupList = [];
    const defaultGroupList = [
      "All Printers",
      "State: Idle",
      "State: Active",
      "State: Complete",
      "State: Disconnected"
    ];

    defaultGroupList.forEach((group) => {
      this.#printerGroupList.push(group);
    });
    const printerList = getPrinterStoreCache().listPrinters();
    printerList.forEach((printer) => {
      if (!this.#printerGroupList.includes(`Group: ${printer.group}`)) {
        if (!isEmpty(printer.group)) {
          this.#printerGroupList.push(`Group: ${printer.group}`);
        }
      }
    });
  }

  async reSyncWebsockets(id) {
    if (id === null) {
      //No id, full scan requested..
      const printerList = getPrinterStoreCache().listPrinters();
      return await this.batchReSyncWebsockets(printerList, 50);
    } else {
      const printer = getPrinterStoreCache().getPrinter(id);
      return printer.reConnectWebsocket();
    }
  }

  async reScanAPI(id, force) {
    if (id === null) {
      //No id, full scan requested..
      const printerList = getPrinterStoreCache().listPrinters();
      return await this.batchReScanAPI(printerList, 10, force);
    } else {
      const printer = getPrinterStoreCache().getPrinter(id);
      return printer.reScanAPI(force);
    }
  }
  async batchReScanAPI(printerList = [], batchSize = 10, force) {
    const createNewPrinterBatches = async (printer, force) => {
      const printerLength = printer.length;

      for (let i = 0; i < printerLength; i += batchSize) {
        const requests = printer.slice(i, i + batchSize).map((printer) => {
          // The batch size is 100. We are processing in a set of 100 users.
          return printer.reScanAPI(force);
        });

        // requests will have 100 or less pending promises.
        // Promise.all will wait till all the promises got resolves and then take the next 100.
        logger.debug(`Running printer batch ${i + 1}`);
        await Promise.all(requests).catch((e) =>
          logger.error(`Error in batch printers! ${i} - ${e}`)
        ); // Catch the error.
      }
    };

    await createNewPrinterBatches(printerList, force);
  }
  async batchReSyncWebsockets(printerList = [], batchSize = 10) {
    const createNewPrinterBatches = async (printer) => {
      const printerLength = printer.length;

      for (let i = 0; i < printerLength; i += batchSize) {
        const requests = printer.slice(i, i + batchSize).map((printer) => {
          // The batch size is 100. We are processing in a set of 100 users.
          return printer.reConnectWebsocket();
        });

        // requests will have 100 or less pending promises.
        // Promise.all will wait till all the promises got resolves and then take the next 100.
        logger.debug(`Running printer batch ${i + 1}`);
        await Promise.all(requests).catch((e) =>
          logger.error(`Error in batch printers! ${i} - ${e}`)
        ); // Catch the error.
      }
    };

    await createNewPrinterBatches(printerList);
  }

  async updatePrinterFilamentSelections() {
    const pList = getPrinterStoreCache().listPrintersInformation();
    for (let i = 0; i < pList.length; i++) {
      const printer = pList[i];
      if (Array.isArray(printer.selectedFilament)) {
        for (let f = 0; f < printer.selectedFilament.length; f++) {
          if (printer.selectedFilament[f] !== null) {
            const newInfo = await Filament.findById(printer.selectedFilament[f]._id);
            printer.selectedFilament[f] = newInfo;
            const currentFilament = await Runner.compileSelectedFilament(
              farmPrinters[i].selectedFilament,
              i
            );
            FileClean.generate(farmPrinters[i], currentFilament);
          }
        }
      } else if (farmPrinters[i].selectedFilament != null) {
        const newInfo = await Filament.findById(farmPrinters[i].selectedFilament._id);
        const printer = await Printers.findById(farmPrinters[i]._id);
        farmPrinters[i].selectedFilament = newInfo;
        printer.selectedFilament = newInfo;
        printer.save();
        const currentFilament = await Runner.compileSelectedFilament(
          farmPrinters[i].selectedFilament,
          i
        );
        FileClean.generate(farmPrinters[i], currentFilament);
      }
    }
  }

  async checkForOctoPrintUpdates() {
    const printerList = getPrinterStoreCache().listPrinters();
    logger.debug(printerList.length + " checking for any octoprint updates");
    for (let i = 0; i < printerList.length; i++) {
      const printer = printerList[i];
      await printer.acquireOctoPrintUpdatesData(true);
    }
  }

  async generatePrintersControlDropList() {
    const printersInformation = getPrinterStoreCache().listPrintersInformation();
    printersInformation.forEach((sortedPrinter) => {
      const printerIndex = _.findIndex(this.#printerControlList, function (o) {
        return o.printerName === sortedPrinter.printerName;
      });
      if (printerIndex !== -1) {
        this.#printerControlList[printerIndex] = {
          printerName: sortedPrinter.printerName,
          printerID: sortedPrinter._id,
          state: sortedPrinter.printerState.colour
        };
      } else {
        this.#printerControlList.push({
          printerName: sortedPrinter.printerName,
          printerID: sortedPrinter._id,
          state: sortedPrinter.printerState.colour
        });
      }
    });
  }

  getPrinterControlList() {
    return this.#printerControlList;
  }

  async generatePrintersStatisticsCache() {
    const pList = getPrinterStoreCache().listPrinters();
    if (pList?.length > 0) {
      for (let i = 0; i < pList.length; i++) {
        const printer = pList[i];
        const printerStatistics = await generatePrinterStatistics(printer._id);
        getPrinterStoreCache().updatePrinterStatistics(printer._id, printerStatistics);
      }
    }
  }
}

module.exports = PrinterManagerService;
