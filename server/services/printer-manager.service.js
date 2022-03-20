const Logger = require("../handlers/logger.js");

const PrinterService = require("./printer.service");
const { OctoPrintPrinter } = require("../services/printers/create-octoprint.service");
const { CATEGORIES, PRINTER_STATES } = require("./printers/constants/printer-state.constants");
const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const { patchPrinterValues } = require("../services/version-patches.service");
const { isEmpty } = require("lodash");
const _ = require("lodash");
const Filament = require("../models/Filament");
const Printers = require("../models/Printer");
const { FileClean } = require("./file-cleaner.service");
const { generatePrinterStatistics } = require("../services/printer-statistics.service");
const { deleteTemperatureData } = require("./octoprint/utils/octoprint-websocket-helpers.utils");
const { SettingsClean } = require("./settings-cleaner.service");

const logger = new Logger("OctoFarm-PrinterControlManagerService");

class PrinterManagerService {
  #enablePrintersQueue = [];
  #printerGroupList = [];
  #printerControlList = [];
  #offlineAPIRetry = null;
  #printerEnableTimeout = null;
  #printerOfflineTimeout;
  #printerEnableTimer = 5000;
  #printerOfflineTimer = 10000;

  loadPrinterTimeoutSettingss() {
    const { timeout } = SettingsClean.returnSystemSettings();
    this.#offlineAPIRetry = timeout.apiRetry;
  }

  async initialisePrinters() {
    this.loadPrinterTimeoutSettingss();
    // Grab printers from database
    const pList = await PrinterService.list();
    logger.info("Initialising " + pList.length + " printers");
    //Parse out enabled printers and disable any disabled printers straight away...
    for (let p of pList) {
      await patchPrinterValues(p);
      const printer = new OctoPrintPrinter(p);
      if (!printer?.disabled) {
        getPrinterStoreCache().addPrinter(printer);
        this.#enablePrintersQueue.push(printer._id);
      } else {
        getPrinterStoreCache().addPrinter(printer);
      }
    }
  }

  async enablePrinters(enableList) {
    for (let id of enableList) {
      this.#enablePrintersQueue.push(id);
    }
  }

  async disablePrinters(disableList) {
    for (let id of disableList) {
      const printer = getPrinterStoreCache().getPrinter(id);
      printer.disablePrinter();
    }
  }

  async addPrinter(printer) {
    await patchPrinterValues(printer);
    getPrinterStoreCache().addPrinter(printer);
    this.#enablePrintersQueue.push(printer);

    return {
      printerURL: printer.printerURL
    };
  }

  killAllConnections() {
    logger.debug("Killing all printer connections...");
    getPrinterStoreCache()
      .listPrinters()
      .forEach((printer) => {
        printer.killAllConnections();
      });
    return "Killed Current Connections";
  }

  clearOfflineTimeout() {
    clearTimeout(this.#printerOfflineTimeout);
    return "Killed Printer Offline Timeout";
  }

  async startOfflineCheckQueue() {
    this.#printerOfflineTimeout = setTimeout(async () => {
      await this.offlineInstanceCheck();
    }, this.#printerOfflineTimer);
  }

  async offlineInstanceCheck(batchSize = 10) {
    const offlinePrinterChecking = async () => {
      const printersList = getPrinterStoreCache().listPrinters();
      const offlinePrinterList = [];

      for (const printer of printersList) {
        const disabled = printer?.disabled;
        const category = printer?.printerState?.colour?.category;
        if (!disabled && category === "Offline") {
          offlinePrinterList.push(printer);
        }
      }

      const queueLength = offlinePrinterList.length;
      for (let i = 0; i < queueLength; i += batchSize) {
        const requests = offlinePrinterList.slice(i, i + batchSize).map((printer) => {
          // The batch size is 100. We are processing in a set of 100 users.
          const reconnectingState = printer.returnReconnectingState();
          if (reconnectingState === false) {
            return printer.reconnectAPI();
          }
        });

        // requests will have 100 or less pending promises.
        // Promise.all will wait till all the promises got resolves and then take the next 100.
        logger.info(`Offline printer check batch ${i + 1}`);
        await Promise.all(requests).catch((e) =>
          logger.error(`Error in batch offline printers! ${i} - ${e}`)
        ); // Catch the error.
      }
    };

    await offlinePrinterChecking();
    await this.startOfflineCheckQueue();
  }

  async enablePrinterFromQueue(id) {
    if (!!id) {
      const printer = getPrinterStoreCache().getPrinter(id);
      return printer.enablePrinter();
    }
  }

  clearPrinterEnableTimeout() {
    clearTimeout(this.#printerEnableTimeout);
    return "Killed Printer Enable Timeout";
  }

  async startPrinterEnableQueue() {
    this.#printerEnableTimeout = setTimeout(async () => {
      await this.handlePrinterEnableQueue();
    }, this.#printerEnableTimer);
  }

  async handlePrinterEnableQueue(batchSize = 10) {
    const enablePrinterQueueBatch = async () => {
      const queueLength = this.#enablePrintersQueue.length;

      for (let i = 0; i < queueLength; i += batchSize) {
        const requests = this.#enablePrintersQueue.slice(i, i + batchSize).map((id) => {
          // The batch size is 100. We are processing in a set of 100 users.
          return this.enablePrinterFromQueue(id);
        });

        // requests will have 100 or less pending promises.
        // Promise.all will wait till all the promises got resolves and then take the next 100.
        logger.info(`Running printer enable batch ${i + 1}`);
        await Promise.all(requests).catch((e) =>
          logger.error(`Error in batch enable printers! ${i} - ${e}`)
        ); // Catch the error.
      }
    };

    await enablePrinterQueueBatch();
    await this.startPrinterEnableQueue();
  }

  updateStateCounters() {
    const printerList = getPrinterStoreCache().listPrinters();
    logger.debug(printerList.length + " printers updating state counters...");
    for (const printer of printerList) {
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
            break;
          case CATEGORIES.DISABLED:
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

    for (let id of deleteList) {
      const printer = getPrinterStoreCache().getPrinterInformation(id);
      await getPrinterStoreCache().deletePrinter(printer._id);
      removedPrinterList.push({
        printerURL: printer.printerURL,
        printerId: printer._id
      });
      await deleteTemperatureData(printer._id);
    }
    // Regenerate groups list
    this.updateGroupList();
    // Regenerate control list
    await this.generatePrintersControlDropList();
    // Regenerate sort indexs
    await this.updatePrinterSortIndexes();
    // Generate statistics cache
    await this.generatePrintersStatisticsCache();

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
      return this.batchReSyncWebsockets(printerList, 50);
    } else {
      const printer = getPrinterStoreCache().getPrinter(id);
      return printer.reConnectWebsocket();
    }
  }

  async reScanAPI(id, force) {
    if (id === null) {
      //No id, full scan requested..
      const printerList = getPrinterStoreCache().listPrinters();
      return this.batchReScanAPI(force, printerList, 10);
    } else {
      const printer = getPrinterStoreCache().getPrinter(id);
      return printer.reScanAPI(force);
    }
  }

  async batchReScanAPI(force, printerList = [], batchSize = 10) {
    const createNewPrinterBatches = async (printer) => {
      const printerLength = printer.length;

      for (let i = 0; i < printerLength; i += batchSize) {
        const requests = printer.slice(i, i + batchSize).map((scanPrinter) => {
          // The batch size is 100. We are processing in a set of 100 users.
          return scanPrinter.reScanAPI(force);
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

  async batchReSyncWebsockets(printerList = [], batchSize = 10) {
    const createNewPrinterBatches = async (printer) => {
      const printerLength = printer.length;

      for (let i = 0; i < printerLength; i += batchSize) {
        const requests = printer.slice(i, i + batchSize).map((syncPrinter) => {
          // The batch size is 100. We are processing in a set of 100 users.
          return syncPrinter.reConnectWebsocket();
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
        const otherPrinter = await Printers.findById(farmPrinters[i]._id);
        farmPrinters[i].selectedFilament = newInfo;
        otherPrinter.selectedFilament = newInfo;
        otherPrinter.save();
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
    for (let printer of printerList) {
      await printer.acquireOctoPrintUpdatesData(true);
      await printer.acquireOctoPrintPluginsListData(true);
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
      for (let printer of pList) {
        const printerStatistics = await generatePrinterStatistics(printer._id);
        getPrinterStoreCache().updatePrinterStatistics(printer._id, printerStatistics);
      }
    }
  }
}

module.exports = PrinterManagerService;
