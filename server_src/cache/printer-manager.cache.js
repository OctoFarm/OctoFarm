const PrinterManagerService = require("../services/printer-manager.service");

let printerManagerState = new PrinterManagerService();

function getPrinterManagerCache() {
  return printerManagerState;
}

module.exports = { getPrinterManagerCache };
