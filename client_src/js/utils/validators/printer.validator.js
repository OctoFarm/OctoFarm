import { validatePath } from "./api.validator";

function validatePrinterObject(printer) {
  if (!printer.apikey) throw new Error("Api key not provided");
  if (!printer.printerURL) throw new Error("Printer URL not provided");
}

function validatePowerPluginURL(printer, url) {
  if (url.includes("[PrinterURL]")) {
    url = url.replace("[PrinterURL]", printer.printerURL);
  }
  if (url.includes("[PrinterAPI]")) {
    url = url.replace("[PrinterAPI]", printer.apikey);
  }
  return validatePath(url);
}

export { validatePrinterObject, validatePowerPluginURL };
