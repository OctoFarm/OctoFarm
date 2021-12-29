const { findIndex } = require("lodash");
const { EventEmitter } = require("events");
const { ScriptRunner } = require("../runners/scriptCheck");

const Logger = require("../handlers/logger");

const logger = new Logger("OctoFarm-State");

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

  getPrinterCount() {
    return this.#printersList.length;
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

  updatePrinterState(id, data) {
    const printer = this.#findMePrinter(id);
    printer.setPrinterState(data);
  }

  updateWebsocketState(id, data) {
    const printer = this.#findMePrinter(id);
    printer.setWebsocketState(data);
  }

  updatePrinterLiveValue(id, data) {
    const printer = this.#findMePrinter(id);
    printer.updatePrinterLiveValue(data);
  }

  updatePrinterDatabase(id, data) {
    const printer = this.#findMePrinter(id);
    printer.updatePrinterLiveValue(data);
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

  getCurrentUser(id) {
    const printer = this.#findMePrinter(id);
    return printer.currentUser;
  }

  getCostSettings(id) {
    const printer = this.#findMePrinter(id);
    return printer.costSettings;
  }

  getTerminalData(id) {
    const printer = this.#findMePrinter(id);
    return printer.terminal;
  }

  getOctoPrintVersion(id) {
    const printer = this.#findMePrinter(id);
    return printer.octoPrintVersion;
  }

  getOctoPrintUserList(id) {
    const printer = this.#findMePrinter(id);
    return printer.userList;
  }

  getMultiUserIssueState(id) {
    const printer = this.#findMePrinter(id);
    return printer.multiUserIssue;
  }

  getPrinterProgress(id) {
    const printer = this.#findMePrinter(id);
    return printer.progress;
  }

  getPrinterURL(id) {
    const printer = this.#findMePrinter(id);
    return printer.printerURL;
  }

  getPrinter(id) {
    const printer = this.#findMePrinter(id);
    return Object.assign({}, printer);
  }

  getPrinterEvent(id, event) {
    const printer = this.#findMePrinter(id);
    return printer[event + "Event"];
  }

  firePrinterEvent(id, event) {
    const printer = this.#findMePrinter(id);
    if (!!printer[event + "Event"]) {
      logger.info("Fired printer event", event);
      printer[event + "Event"].emit(event.toLowerCase());
    }
  }

  getPrinterState(id) {
    const printer = this.#findMePrinter(id);
    return {
      printerState: printer.printerState,
      hostState: printer.hostState,
      webSocketState: printer.webSocketState
    };
  }

  getTempTriggers(id) {
    const printer = this.#findMePrinter(id);
    return printer.tempTriggers;
  }

  addPrinterEvent(id, event) {
    const printer = this.#findMePrinter(id);
    if (!printer[event + "Event"]) {
      printer[event + "Event"] = new EventEmitter();
      if (!printer[event + "Event"]._events[event.toLowerCase()]) {
        logger.info("Added new event to printer: ", event);
        printer[event + "Event"].once(event.toLowerCase(), (stream) => {
          ScriptRunner.check(printer, event.toLowerCase(), undefined);
        });
      }
    }
  }
}

module.exports = PrinterStore;
