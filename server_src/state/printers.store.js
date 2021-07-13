const _ = require("lodash");
const Printers = require("../models/Printer.js");
const { NotImplementedException } = require("../exceptions/runtime.exceptions");
const { getFilterDefaults } = require("./state.constants");
const { PrinterClean } = require("../lib/dataFunctions/printerClean");
const { PrinterTicker } = require("../runners/printerTicker");
const Logger = require("../lib/logger.js");
const { updateSortIndex } = require("../services/printer.service");

const logger = new Logger("OctoFarm-PrintersStore");

let printerStates = [];
let farmPrintersGroups = [];
let serverSettings;

class PrintersStore {
  static inject(settings) {
    serverSettings = settings;
  }

  static validateState() {
    if (!serverSettings) {
      throw new Error(
        "ServerSettings was not injected or was undefined. Cant use PrintersStore in this state."
      );
    }
    if (!printerStates) {
      throw new Error(
        "PrintersStore was not loaded. Cant fire printer loading action. Call 'loadPrintersStore' first."
      );
    }
  }

  static async loadPrintersStore() {
    printerStates = await Printers.find({}, null, {
      sort: { sortIndex: 1 }
    });

    this.generatePrinterGroups();
  }

  static async setLoadingState() {
    this.validateState();

    printerStates.forEach((printer) => {
      PrinterTicker.addIssue(printer, "Initiating Printer...", "Active");
      PrinterClean.generate(printer, serverSettings.filamentManager);
    });
  }

  static generatePrinterGroups() {
    farmPrintersGroups = getFilterDefaults();

    printerStates.forEach((printer) => {
      if (!farmPrintersGroups.includes(`Group: ${printer.group}`)) {
        if (!_.isEmpty(printer.group)) {
          farmPrintersGroups.push(`Group: ${printer.group}`);
        }
      }
    });
  }

  static async generateSortIndices() {
    for (let p = 0; p < printerStates.length; p++) {
      const printer = printerStates[p];
      printer.sortIndex = p;

      this.addLoggedTicker(printer, `Setting sort index ${p} for: ${printer.printerURL}`, "Active");
      await updateSortIndex(printer._id, p);
    }
  }

  static addLoggedTicker(printer, message, state) {
    logger.info(message);
    PrinterTicker.addIssue(printer, message, state);
  }

  static async addPrinter(printer) {
    logger.info("Adding new printer");

    // Only adding a single printer
    const newPrinter = await new Printers(printer);
    await newPrinter.save();
    logger.info(`Saved new Printer: ${newPrinter.printerURL}`);
    printerStates.push(newPrinter);
    // Regenerate sort index on printer add...
    // await this.reGenerateSortIndex();
    // await this.setupWebSocket(newPrinter._id);
    // return newPrinter;
    throw NotImplementedException();
  }

  /**
   * Find and return a frozen copy of the printer
   */
  static findPrinter(id) {
    throw NotImplementedException();
  }

  /**
   * Return a frozen copy of all printers
   */
  static getPrinters() {
    throw NotImplementedException();
  }
}

module.exports = {
  PrintersStore
};
