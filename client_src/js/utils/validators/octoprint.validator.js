function validatePrinterObject(printer) {
  if (!printer.apikey) throw new Error("Api key not provided");
  if (!printer.printerURL) throw new Error("Printer URL not provided");
}

export { validatePrinterObject };
