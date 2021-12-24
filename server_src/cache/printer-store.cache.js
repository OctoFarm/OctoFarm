const PrinterStore = require("../store/printers.store");

//TODO change, remove clean up

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
