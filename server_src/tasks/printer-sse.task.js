const { stringify } = require("flatted");
const Logger = require("../handlers/logger");
const { AppConstants } = require("../app.constants");
const { byteCount } = require("../utils/benchmark.util");

class PrinterSseTask {
  #printerViewSSEHandler;
  #printersStore;
  #printerTickerStore;

  #aggregateSizeCounter = 0;
  #aggregateWindowLength = 100;
  #aggregateSizes = [];
  #rounding = 2;
  #logger = new Logger("Printer-SSE-task");

  constructor({ printerViewSSEHandler, printerTickerStore, printersStore }) {
    this.#printerViewSSEHandler = printerViewSSEHandler;
    this.#printersStore = printersStore;
    this.#printerTickerStore = printerTickerStore;
  }

  async run() {
    const currentIssueList = this.#printerTickerStore.getIssueList();
    const serializablePrinterStates = this.#printersStore.listPrintersFlat();

    // TODO remove this useless data client-side
    const printerControlList = serializablePrinterStates.map((sp) => ({
      printerName: sp.printerName,
      printerID: sp._id,
      state: sp.printerState?.colour
    }));

    const sseData = {
      printersInformation: serializablePrinterStates,
      printerControlList,
      currentTickerList: currentIssueList
    };

    const serializedData = AppConstants.jsonStringify
      ? JSON.stringify(sseData)
      : stringify(sseData);
    const transportDataSize = byteCount(serializedData);
    this.updateAggregator(transportDataSize);
    this.#printerViewSSEHandler.send(serializedData);
  }

  updateAggregator(transportDataLength) {
    if (this.#aggregateSizeCounter >= this.#aggregateWindowLength) {
      const summedPayloadSize = this.#aggregateSizes.reduce((t, n) => (t += n));
      const averagePayloadSize = summedPayloadSize / 1000 / this.#aggregateWindowLength;
      this.#logger.info(
        `Printer SSE metrics ${averagePayloadSize.toFixed(this.#rounding)} kB [${
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

module.exports = PrinterSseTask;
