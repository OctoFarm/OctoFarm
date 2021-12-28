const { convertHttpUrlToWebsocket } = require("../utils/url.utils");
const Logger = require("../handlers/logger");
const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const { PRINTER_CATEGORIES } = require("./printers/constants/printer-categories.constants");

const logger = new Logger("OctoFarm-State");

const patchPrinterValues = (printer) => {
  patchSortIndex(printer);
  printerURLPatch(printer);
  printerHTTPPatch(printer);
  printerURLTrailingSlashPatch(printer);
  webSocketURLPatch(printer);
  selectedFilamentNotArrayPatch(printer);
  categoryPatch(printer);
  return printer;
};

const categoryPatch = (printer) => {
  if (!printer?.category) {
    printer.category = PRINTER_CATEGORIES.OCTOPRINT;
  }
};

const patchSortIndex = (printer) => {
  const currentPrinterCount = getPrinterStoreCache().getPrinterCount();
  if (currentPrinterCount === 0) {
    printer.sortIndex = 0;
  } else if (currentPrinterCount > 0) {
    printer.sortIndex = currentPrinterCount - 1;
  }
};

const selectedFilamentNotArrayPatch = (printer) => {
  if (!printer?.selectedFilament || !Array.isArray(printer.selectedFilament)) {
    printer.selectedFilament = [];
  }
};

const printerURLTrailingSlashPatch = (printer) => {
  if (
    printer.printerURL[printer.printerURL.length - 1] === "/" ||
    printer.printerURL[printer.printerURL.length - 1] === "\\"
  ) {
    logger.debug(printer.printerURL + ": Has a trailing slash, removing...");
    printer.printerURL = printer.printerURL.replace(/\/?$/, "");
  }
};

const printerHTTPPatch = (printer) => {
  if (!printer.printerURL.includes("http://") && !printer.printerURL.includes("https://")) {
    logger.debug(printer.printerURL + ": Printer URL is missing http/https, setting default http");
    printer.printerURL = "http://" + printer.printerURL;
  }
};

const printerURLPatch = (printer) => {
  if (!printer?.printerURL) {
    if (!!printer?.ip && !!printer?.port) {
      logger.debug(printer.printerURL + ": Printer URL is missing, recreating!");
      printer.printerURL = `http://${printer.ip}:${printer.port}`;
    } else {
      logger.error(
        "Failed to create missing printer URL, as no port or ip exist. Failing back to fake printer url..."
      );
      printer.printerURL = "http://192.168.1.1:5000";
    }
  }
};

const webSocketURLPatch = (printer) => {
  if (!printer?.webSocketURL || !printer.webSocketURL.includes("ws")) {
    logger.debug(printer.printerURL + ": Websocket URL is missing, creating!");
    printer.webSocketURL = convertHttpUrlToWebsocket(printer.printerURL);
  }
};

module.exports = {
  patchPrinterValues
};
