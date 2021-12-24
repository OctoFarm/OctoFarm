const { findIndex } = require("lodash");

class PrinterStore {
  #printersList = undefined;
  constructor() {
    this.#printersList = [];
  }

  listPrinters() {
    return this.#printersList;
  }

  addPrinter(printer) {
    return this.#printersList.push(printer);
  }

  deletePrinter(id) {
    console.log(id);
  }

  updatePrinter(id, data) {}
}

module.exports = PrinterStore;
