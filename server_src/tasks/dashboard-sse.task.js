const { stringify } = require("flatted");
const Logger = require("../handlers/logger");
const { AppConstants } = require("../app.constants");
const { byteCount } = require("../utils/benchmark.util");

class DashboardSseTask {
  #sseHandler;
  #printersStore;
  #settingsStore;
  #printerTickerStore;
  #currentOperationsCache;
  #sortingFilteringCache;

  #aggregateSizeCounter = 0;
  #aggregateWindowLength = 100;
  #aggregateSizes = [];
  #rounding = 2;
  #logger = new Logger("Dashboard-SSE-task");

  constructor({
    dashboardViewSSEHandler,
    sortingFilteringCache,
    printerTickerStore,
    currentOperationsCache,
    settingsStore,
    printersStore
  }) {
    this.#sseHandler = dashboardViewSSEHandler;
    this.#printersStore = printersStore;
    this.#settingsStore = settingsStore;
    this.#printerTickerStore = printerTickerStore;
    this.#currentOperationsCache = currentOperationsCache;
    this.#sortingFilteringCache = sortingFilteringCache;
  }

  async run() {
    let clientsSettingsCache = await this.#settingsStore.getClientSettings();

    const serializablePrinterStates = this.#printersStore.listPrintersFlat();
    const currentOperations = await this.#currentOperationsCache.getCurrentOperations();
    // const dashStatistics = await PrinterClean.returnDashboardStatistics();
    let dashboardSettings = clientsSettingsCache.dashboard;

    const sseData = {
      printersInformation: serializablePrinterStates,
      currentOperations,
      dashStatistics: [],
      dashboardSettings
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
        `Dashboard SSE metrics ${averagePayloadSize.toFixed(this.#rounding)} kB [${
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

module.exports = DashboardSseTask;
