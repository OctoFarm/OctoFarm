const { findIndex, cloneDeep } = require("lodash");
const { EventEmitter } = require("events");
const { ScriptRunner } = require("../runners/scriptCheck");
const { PrinterTicker } = require("../runners/printerTicker");
const { convertHttpUrlToWebsocket } = require("../utils/url.utils");

const Logger = require("../handlers/logger");
const _ = require("lodash");
const { PrinterClean } = require("../lib/dataFunctions/printerClean");

const logger = new Logger("OctoFarm-State");

class PrinterStore {
  #printersList = undefined;

  constructor() {
    this.#printersList = [];
  }

  #findMePrinter = (id) => {
    if (typeof id !== "string") {
      id = id.toString();
    }

    return this.#printersList[
      findIndex(this.#printersList, function (o) {
        return o._id === id;
      })
    ];
  };

  #removeFromStore = (id) => {
    if (typeof id !== "string") {
      id = id.toString();
    }
    const index = findIndex(this.#printersList, function (o) {
      return o._id === id;
    });
    if (index > -1) {
      logger.warning("Found printer index, deleting from database...", index);
      this.#printersList.splice(index, 1);
    }
  };

  getPrinterCount() {
    return this.#printersList.length;
  }

  listPrintersInformation() {
    const returnList = [];

    this.#printersList.forEach((printer) => {
      returnList.push(Object.assign({}, printer));
    });

    return returnList;
  }

  listPrinters() {
    return this.#printersList;
  }

  addPrinter(printer) {
    return this.#printersList.push(printer);
  }

  async updateLatestOctoPrintSettings(id, force = false) {
    const printer = this.#findMePrinter(id);
    if (printer.printerState.state !== "Offline") {
      await printer.acquireOctoPrintLatestSettings(force);
    }
  }

  async deletePrinter(id) {
    const printer = this.#findMePrinter(id);
    //Kill all printer connections
    await printer.killAllConnections();
    //Remove from database
    await printer.deleteFromDataBase();
    //Remove from printer store
    this.#removeFromStore(id);
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

  getPrinterInformation(id) {
    const printer = this.#findMePrinter(id);
    return JSON.parse(JSON.stringify(printer));
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

  updateAllPrintersSocketThrottle(seconds) {
    const printerList = this.listPrinters();
    printerList.forEach((printer) => {
      printer.sendThrottle(seconds);
    });
  }

  updatePrintersBasicInformation(newPrintersInformation = []) {
    // Updating printer's information
    logger.info("Bulk update to printers information requested");
    let updateGroupListing = false;
    const changesList = [];
    const socketsNeedTerminating = [];

    // Cycle through the printers and update their state...
    for (let i = 0; i < newPrintersInformation.length; i++) {
      const oldPrinter = this.#findMePrinter(newPrintersInformation[i]._id);
      const newPrinterInfo = newPrintersInformation[i];

      //Check for a printer name change...
      if (oldPrinter.settingsAppearance.name !== newPrinterInfo.settingsAppearance.name) {
        const loggerMessage = `Changed printer name from ${oldPrinter.settingsAppearance.name} to ${newPrinterInfo.settingsAppearance.name}`;
        logger.warning(loggerMessage);
        PrinterTicker.addIssue(
          new Date(),
          oldPrinter.printerURL,
          loggerMessage,
          "Active",
          oldPrinter._id
        );
        this.updatePrinterDatabase(newPrinterInfo._id, {
          settingsAppearance: {
            name: newPrinterInfo.settingsAppearance.name
          }
        });

        if (
          findIndex(this.#printersList, function (o) {
            return o._id === newPrinterInfo._id;
          }) !== -1
        ) {
          changesList.push({
            _id: newPrinterInfo._id,
            printerURL: newPrinterInfo.printerURL
          });
        }
      }

      //Check for a printer url change...
      if (oldPrinter.printerURL !== newPrinterInfo.printerURL) {
        const loggerMessage = `Changed printer url from ${oldPrinter.printerURL} to ${newPrinterInfo.printerURL}`;
        logger.warning(loggerMessage);
        PrinterTicker.addIssue(
          new Date(),
          oldPrinter.printerURL,
          loggerMessage,
          "Active",
          oldPrinter._id
        );
        if (newPrinterInfo.printerURL[newPrinterInfo.printerURL.length - 1] === "/") {
          newPrinterInfo.printerURL = newPrinterInfo.printerURL.replace(/\/?$/, "");
        }
        if (
          !newPrinterInfo.printerURL.includes("https://") &&
          !newPrinterInfo.printerURL.includes("http://")
        ) {
          newPrinterInfo.printerURL = `http://${newPrinterInfo.printerURL}`;
        }
        this.updatePrinterDatabase(newPrinterInfo._id, {
          printerURL: newPrinterInfo.printerURL,
          webSocketURL: convertHttpUrlToWebsocket(newPrinterInfo.printerURL)
        });

        if (
          findIndex(this.#printersList, function (o) {
            return o._id === newPrinterInfo._id;
          }) !== -1
        ) {
          changesList.push({
            _id: newPrinterInfo._id,
            printerURL: newPrinterInfo.printerURL
          });
        }

        if (!socketsNeedTerminating.includes(oldPrinter._id)) {
          socketsNeedTerminating.push(oldPrinter._id);
        }
      }

      // Check for apikey change...
      if (oldPrinter.apikey !== newPrinterInfo.apikey) {
        const loggerMessage = `Changed apiKey from ${oldPrinter.apikey} to ${newPrinterInfo.apikey}`;
        logger.info(loggerMessage);
        PrinterTicker.addIssue(
          new Date(),
          oldPrinter.printerURL,
          loggerMessage,
          "Active",
          oldPrinter._id
        );
        this.updatePrinterDatabase(newPrinterInfo._id, {
          apikey: newPrinterInfo.apikey
        });

        if (
          findIndex(this.#printersList, function (o) {
            return o._id === newPrinterInfo._id;
          }) !== -1
        ) {
          changesList.push({
            _id: newPrinterInfo._id,
            printerURL: newPrinterInfo.printerURL
          });
        }
        if (!socketsNeedTerminating.includes(oldPrinter._id)) {
          socketsNeedTerminating.push(oldPrinter._id);
        }
      }

      // Check for group change...
      if (oldPrinter.group !== newPrinterInfo.group) {
        const loggerMessage = `Changed group from ${oldPrinter.group} to ${newPrinterInfo.group}`;
        logger.info(loggerMessage);
        PrinterTicker.addIssue(
          new Date(),
          oldPrinter.printerURL,
          loggerMessage,
          "Active",
          oldPrinter._id
        );
        this.updatePrinterDatabase(newPrinterInfo._id, {
          group: newPrinterInfo.group
        });
        if (
          findIndex(this.#printersList, function (o) {
            return o._id === newPrinterInfo._id;
          }) !== -1
        ) {
          changesList.push({
            _id: newPrinterInfo._id,
            printerURL: newPrinterInfo.printerURL
          });
        }
        updateGroupListing = true;
      }
      // Check for camURL change...
      const loggerMessage = `Changed camera url from ${oldPrinter.camURL} to ${newPrinterInfo.camURL}`;
      logger.info(loggerMessage);
      PrinterTicker.addIssue(
        new Date(),
        oldPrinter.printerURL,
        loggerMessage,
        "Active",
        oldPrinter._id
      );
      if (oldPrinter.camURL !== newPrinterInfo.camURL) {
        this.updatePrinterDatabase(newPrinterInfo._id, {
          camURL: newPrinterInfo.camURL
        });

        if (
          findIndex(this.#printersList, function (o) {
            return o._id === newPrinterInfo._id;
          }) !== -1
        ) {
          changesList.push({
            _id: newPrinterInfo._id,
            printerURL: newPrinterInfo.printerURL
          });
        }
      }
    }

    return {
      updateGroupListing,
      changesList,
      socketsNeedTerminating
    };
  }

  resetPrintersSocketConnections(idList) {
    idList.forEach((id) => {
      const printer = this.#findMePrinter(id);
      printer.resetSocketConnection();
    });
  }

  async generatePrinterConnectionLogs(id) {
    const printer = this.#findMePrinter(id);
    return await PrinterClean.generateConnectionLogs(printer);
  }
}

module.exports = PrinterStore;
