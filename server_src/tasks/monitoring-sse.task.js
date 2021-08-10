const { stringify } = require("flatted");
const Logger = require("../handlers/logger");
const { AppConstants } = require("../app.constants");
const { byteCount } = require("../utils/benchmark.util");

class MonitoringSseTask {
  #sseHandler;
  #printersStore;
  #settingsStore;
  #sortingFilteringCache;
  #currentOperationsCache;

  #aggregateSizeCounter = 0;
  #aggregateWindowLength = 100;
  #aggregateSizes = [];
  #rounding = 2;
  #logger = new Logger("Monitoring-SSE-task");

  constructor({
    monitoringViewSSEHandler,
    sortingFilteringCache,
    currentOperationsCache,
    settingsStore,
    printersStore
  }) {
    this.#sseHandler = monitoringViewSSEHandler;
    this.#printersStore = printersStore;
    this.#settingsStore = settingsStore;
    this.#sortingFilteringCache = sortingFilteringCache;
    this.#currentOperationsCache = currentOperationsCache;
  }

  async run() {
    const clientSettings = this.#settingsStore.getClientSettings();
    const currentOperations = this.#currentOperationsCache.getCurrentOperations();
    const serializablePrinterStates = this.#printersStore.listPrintersFlat();

    // TODO remove this useless data client-side
    const printerControlList = serializablePrinterStates.map((sp) => ({
      printerName: sp.printerName,
      printerID: sp._id,
      state: sp.printerState?.colour
    }));

    const filterLabel = this.#sortingFilteringCache.getFilter();

    const sseData = {
      printersInformation: applyPrinterDisplay(serializablePrinterStates, filterLabel),
      currentOperations,
      printerControlList,
      clientSettings
    };

    const serializedData = AppConstants.jsonStringify
      ? JSON.stringify(sseData)
      : stringify(sseData);
    const transportDataSize = byteCount(serializedData);
    this.updateAggregator(transportDataSize);
    this.#sseHandler.send(serializedData);
  }

  updateAggregator(transportDataLength) {
    if (this.#aggregateSizeCounter >= this.#aggregateWindowLength) {
      const summedPayloadSize = this.#aggregateSizes.reduce((t, n) => (t += n));
      const averagePayloadSize = summedPayloadSize / 1000 / this.#aggregateWindowLength;
      this.#logger.info(
        `Monitoring SSE metrics ${averagePayloadSize.toFixed(this.#rounding)} kB [${
          this.#aggregateWindowLength
        } TX avg].`
      );
      this.#aggregateSizeCounter = 0;
      this.#aggregateSizes = [];
    }

    this.#aggregateSizes.push(transportDataLength);
    ++this.#aggregateSizeCounter;
  }
}

module.exports = MonitoringSseTask;

function applyPrinterDisplay(printers, filterLabel) {
  if (filterLabel === "All Printers") {
    return printers;
  }
  const stateFilterPrefix = "State: ";
  if (filterLabel.includes(stateFilterPrefix)) {
    const filteredState = filterLabel.replace(stateFilterPrefix, "");

    // Active, Idle, Disconnected, Complete
    printers.forEach((p) => {
      p.display = p.printerState.colour.category === filteredState;
    });
  } else {
    //Check groups...
    let currentGroups = [];
    let current = null;
    for (let i = 0; i < currentGroups.length; i++) {
      if (filterLabel === currentGroups[i]) {
        current = currentGroups[i];
      }
    }
    if (current !== null) {
      let i = 0,
        len = printers.length;
      while (i < len) {
        printers[i].display = printers[i].group === current.replace("Group: ", "");
        i++;
      }
      return printers;
    }
  }
  return printers;
}

const sortMe = function (printers) {
  let sortBy = getSorting();
  if (sortBy === "index") {
    return printers;
  } else if (sortBy === "percent") {
    let sortedPrinters = printers.sort(function (a, b) {
      if (!a.currentJob) return 1;
      if (!b.currentJob) return -1;
      return parseFloat(a.currentJob.percent) - parseFloat(b.currentJob.percent);
    });
    let i = 0,
      len = sortedPrinters.length;
    while (i + 1 < len + 1) {
      sortedPrinters[i].order = i;
      i++;
    }
    return sortedPrinters;
  } else if (sortBy === "time") {
    let sortedPrinters = printers.sort(function (a, b) {
      if (typeof a.currentJob === "undefined") return 1;
      if (typeof b.currentJob === "undefined") return -1;
      return (
        parseFloat(a.currentJob.printTimeRemaining) - parseFloat(b.currentJob.printTimeRemaining)
      );
    });
    let i = 0,
      len = sortedPrinters.length;
    while (i + 1 < len + 1) {
      sortedPrinters[i].order = i;
      i++;
    }
    return sortedPrinters;
  } else {
    return printers;
  }
};
