const PrinterManagerService = require("../services/printer-manager.service");

let printerManagerState = undefined;

function getPrinterManagerCache() {
  if (!!printerManagerState) {
    return printerManagerState;
  } else {
    printerManagerState = new PrinterManagerService();
    return printerManagerState;
  }
}

module.exports = { getPrinterManagerCache };
