const _ = require("lodash");
const { getFilterDefaults } = require("../constants/state.constants");
const Logger = require("../handlers/logger.js");
const { NotImplementedException } = require("../exceptions/runtime.exceptions");
const { NotFoundException } = require("../exceptions/runtime.exceptions");

class PrintersStore {
  #settingsStore;
  #printerTickerStore;
  #printerService;
  #printerStateFactory;
  #eventEmitter2;

  #printerStates;
  #farmPrintersGroups;
  #logger = new Logger("OctoFarm-PrintersStore");

  constructor({
    settingsStore,
    printerTickerStore,
    printerStateFactory,
    eventEmitter2,
    printerService
  }) {
    this.#settingsStore = settingsStore;
    this.#printerService = printerService;
    this.#printerTickerStore = printerTickerStore;
    this.#printerStateFactory = printerStateFactory;
    this.#eventEmitter2 = eventEmitter2;

    // Store collections
    this.#farmPrintersGroups = [];
  }

  _validateState() {
    if (!this.#printerStates) {
      throw new Error(
        "PrintersStore was not loaded. Cant fire printer loading action. Call 'loadPrintersStore' first."
      );
    }
  }

  validateIdList(identifierList) {
    if (!Array.isArray(identifierList)) {
      throw new Error("Input provided was not a valid array of string IDs.");
    }
    const notFoundIDs = [];
    const duplicateIDs = [];
    const uniqueIDs = [];
    identifierList.forEach((id) => {
      const foundPrinter = this.#printerStates.find((p) => p.id === id.toString());
      if (!foundPrinter) {
        notFoundIDs.push(id.toString());
      }
      if (!uniqueIDs.includes(id)) {
        uniqueIDs.push(id);
      } else {
        duplicateIDs.push(id);
      }
    });

    if (notFoundIDs.length > 0) {
      throw new Error(
        `The following provided IDs did not match the printer IDS ${JSON.stringify(notFoundIDs)}`
      );
    }
    if (duplicateIDs.length > 0) {
      throw new Error(
        `The following provided IDs were provided as duplicates ${JSON.stringify(duplicateIDs)}`
      );
    }
  }

  /**
   * Return a mutable copy of all frozen printers states mapped to flat JSON
   */
  listPrintersFlat() {
    return this.listPrinterStates()
      .filter((s) => s.toFlat)
      .map((s) => s.toFlat());
  }

  /**
   * List the prefetched printer states without mapping
   * We check and throw instead of loading proactively: more predictable and not async
   * @returns {*}
   */
  listPrinterStates() {
    this._validateState();

    return this.#printerStates.filter((p) => p.markForRemoval === false);
  }

  getPrinterCount() {
    return this.listPrinterStates().length;
  }

  getPrinterState(id) {
    this._validateState();

    const printerState = this.#printerStates.find((p) => p.id === id);

    if (!printerState) {
      throw new NotFoundException(`The printer ID '${id}' was not generated. This is a bug.`);
    }

    return printerState;
  }

  getPrinterFlat(id) {
    const state = this.getPrinterState(id);
    return state.toFlat();
  }

  async updatePrinterConnectionSettings(printerId, { printerURL, camURL, webSocketURL, apiKey }) {
    const printerState = this.getPrinterState(printerId);

    const newDoc = await this.#printerService.updateConnectionSettings(printerId, {
      printerURL,
      camURL,
      webSocketURL,
      apiKey
    });

    printerState.updateEntityData(newDoc, true);

    return newDoc;
  }

  /**
   * Fetch printers from database and setup the state models (destructive action!)
   * @returns {Promise<void>}
   */
  async loadPrintersStore() {
    const printerDocs = await this.#printerService.list();

    this.#printerStates = [];
    for (let printerDoc of printerDocs) {
      try {
        const printerState = await this.#printerStateFactory.create(printerDoc);
        this.#printerStates.push(printerState);
      } catch (e) {
        this.#logger.error("PrinterFactory failed to reconstruct existing Printer State.", e.stack);
      }
    }

    this.#logger.info(`Loaded ${this.#printerStates.length} printer states`);
    this.generatePrinterGroups();
  }

  async deletePrinter(printerId) {
    this._validateState();

    // Ensure it exists before continuing
    const printerState = this.getPrinterState(printerId);
    const printerEntity = this.#printerService.get(printerId);

    // Mark for removal, remove caches and close websocket stream
    await printerState.tearDown();

    // Remove state
    _.remove(this.#printerStates, (p) => p.id === printerId);

    // Purge from database
    await this.#printerService.delete(printerId);

    return printerEntity;
  }

  generatePrinterGroups() {
    this._validateState();

    this.#farmPrintersGroups = getFilterDefaults();

    this.#printerStates.forEach((printer) => {
      if (!this.#farmPrintersGroups.includes(`Group: ${printer.group}`)) {
        if (!_.isEmpty(printer.group)) {
          this.#farmPrintersGroups.push(`Group: ${printer.group}`);
        }
      }
    });
  }

  getPrinterGroups() {
    return Object.freeze([...this.#farmPrintersGroups]);
  }

  async updateSortIndex(identifierList) {
    this.validateIdList(identifierList);

    // TODO generate a backup in case of intermediate failures

    for (let [index, id] of identifierList.entries()) {
      const doc = await this.#printerService.updateSortIndex(id, index);
      let printer = this.getPrinterState(id);
      printer.updateEntityData(doc, false);
    }
  }

  /**
   * @deprecated A list used to sort printers. This is obsolete next minor release.
   * @returns {*[]}
   */
  getPrinterSortingList() {
    const sorted = [];
    for (let p = 0; p < this.#printerStates.length; p++) {
      const sort = {
        sortIndex: this.#printerStates[p].sortIndex,
        actualIndex: p
      };
      sorted.push(sort);
    }
    sorted.sort((a, b) => (a.sortIndex > b.sortIndex ? 1 : -1));
    return sorted;
  }

  addLoggedTicker(printer, message, state) {
    this.#logger.info(message);
    this.#printerTickerStore.addIssue(printer, message, state);
  }

  async addPrinter(printer) {
    this._validateState();

    this.#logger.info("Saving new printer to database");
    const newPrinterDoc = await this.#printerService.create(printer);

    this.#logger.info(
      `Saved new Printer: ${newPrinterDoc.printerURL} with ID ${newPrinterDoc._id}`
    );

    const newPrinterState = await this.#printerStateFactory.create(newPrinterDoc);
    this.#printerStates.push(newPrinterState);

    // The next 'round' will involve setting up a websocket for this printer
    return newPrinterState;
  }

  /**
   * Reconnect the OctoPrint Websocket connection
   * @param id
   * @param lazy (Not implemented yet, default: true)
   */
  reconnectOctoPrint(id, lazy = true) {
    if (!lazy) {
      // TODO eager reconnect
      throw new NotImplementedException(
        "Eager (lazy==true) reconnect OctoPrint mode is not implemented yet."
      );
    }
    const printer = this.getPrinterState(id);
    printer.resetConnectionState(true);
  }

  getOctoPrintVersions() {
    return this.#printerStates.map((printer) => printer.getOctoPrintVersion());
  }

  setPrinterStepSize(id, stepSize) {
    // Will be abstracted in future in order to fit different types of printers
    const printer = this.getPrinterState(id);
    printer.updateStepSize(stepSize);
  }

  async setPrinterFeedRate(id, feedRate) {
    const printerState = this.getPrinterState(id);

    const doc = await this.#printerService.updateFeedRate(id, feedRate);

    printerState.updateEntityData(doc, false);
  }

  async setPrinterFlowRate(id, flowRate) {
    const printerState = this.getPrinterState(id);

    const doc = await this.#printerService.updateFlowRate(id, flowRate);

    printerState.updateEntityData(doc, false);
  }

  async resetPrinterPowerSettings(id) {
    const printerState = this.getPrinterState(id);

    const doc = await this.#printerService.resetPowerSettings(id);

    printerState.updateEntityData(doc, false);

    return doc.powerSettings;
  }
}

module.exports = PrintersStore;
