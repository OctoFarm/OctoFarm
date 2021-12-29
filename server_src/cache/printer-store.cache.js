const PrinterStore = require("../store/printers.store");

let printerStore = undefined;

function getPrinterStoreCache() {
  if (!!printerStore) {
    return printerStore;
  } else {
    printerStore = new PrinterStore();
    return printerStore;
  }
}

module.exports = {
  getPrinterStoreCache
};
