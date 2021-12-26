const { findIndex } = require("lodash");

class PrinterStore {
  #printersList = undefined;
  constructor() {
    this.#printersList = [];
  }

  #findMePrinter = (id) => {
    return this.#printersList[
      findIndex(this.#printersList, function (o) {
        return o._id === id;
      })
    ];
  };

  listPrinters() {
    return this.#printersList;
  }

  addPrinter(printer) {
    return this.#printersList.push(printer);
  }

  deletePrinter(id) {
    console.log(id);
  }

  updatePrinterState(id, data) {
    const printer = this.#findMePrinter(id);
    printer.setPrinterState(data);
  }

  updatePrinterLiveValue(id, data) {
    const printer = this.#findMePrinter(id);
    printer.updatePrinterLiveValue(data);
  }

  updatePrinterDatabase(id, data) {
    const printer = this.#findMePrinter(id);
    printer.updatePrinterData(data);
  }

  getSelectedFilament(id) {
    const printer = this.#findMePrinter(id);
    return printer.selectedFilament;
  }

  getFileList(id) {
    const printer = this.#findMePrinter(id);
    return printer.fileList;
  }

  getCurrentZ(id) {
    const printer = this.#findMePrinter(id);
    return printer.currentZ;
  }

  getCostSettings(id) {
    const printer = this.#findMePrinter(id);
    return printer.costSettings;
  }

  getTerminalData(id) {
    const printer = this.#findMePrinter(id);
    return printer.terminal;
  }
}

module.exports = PrinterStore;
