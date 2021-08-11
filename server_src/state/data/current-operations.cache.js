const _ = require("lodash");
const Logger = require("../../handlers/logger.js");
const { CATEGORY } = require("../../constants/state.constants");
const { getEmptyOperationsObject } = require("../../constants/cleaner.constants");

class CurrentOperationsCache {
  #wasGenerated = false;
  #currentOperations = getEmptyOperationsObject();

  #logger = new Logger("Cache-CurrentOperations");
  #printersStore;
  #jobsCache;

  constructor({ printersStore, jobsCache }) {
    this.#printersStore = printersStore;
    this.#jobsCache = jobsCache;
  }

  getCurrentOperations() {
    if (!this.#wasGenerated) {
      this.#logger.warning(
        "Current Operations were requested but not actively generated. Analyzing printer jobs now."
      );
      this.generateCurrentOperations();
    }
    return Object.freeze({ ...this.#currentOperations });
  }

  generateCurrentOperations() {
    this.#wasGenerated = true;

    const complete = [];
    const active = [];
    const idle = [];
    const offline = [];
    const disconnected = [];
    const progress = [];
    const operations = [];

    const printers = this.#printersStore.listPrinterStates();
    for (let i = 0; i < printers.length; i++) {
      const printer = printers[i];
      const printerState = printer.getPrinterState();
      const name = printer.getName();
      let pId = printer.id;

      if (!printerState) {
        throw new Error(
          "Current Operations detected a printer without valid 'printerState'. This is a bug."
        );
      }

      const stateCategory = printer.getStateCategory();
      if (stateCategory === CATEGORY.Idle) {
        idle.push(pId);
      } else if (stateCategory === CATEGORY.Offline) {
        offline.push(pId);
      } else if (stateCategory === CATEGORY.Disconnected) {
        disconnected.push(pId);
      } else if (stateCategory === CATEGORY.Complete || stateCategory === CATEGORY.Active) {
        // We ensured the job exists before serializing it
        if (!!this.#jobsCache.jobExists(pId)) {
          const job = this.#jobsCache.getPrinterJobFlat(pId);
          progress.push(job.progress);
          operations.push({
            index: pId,
            name,
            progress: Math.floor(job.progress),
            progressColour: stateCategory === CATEGORY.Complete ? "success" : "warning",
            timeRemaining: job.printTimeRemaining,
            fileName: job.fileDisplay
          });
        } else {
          // Job is not known yet but the Active state is - worth a warning
          this.#logger.warning(
            `Job was not cached but printer state category is '${stateCategory}'`
          );
        }

        if (stateCategory === CATEGORY.Complete) {
          complete.push(pId);
        }
        if (stateCategory === CATEGORY.Active) {
          active.push(pId);
        }
      } else {
        if (stateCategory !== CATEGORY.Error) {
          throw new Error(
            `Printer state ${stateCategory} did not meet state/job criteria or no job was registered.`
          );
        }
      }
    }

    const actProg = progress.reduce((a, b) => a + b, 0);

    this.#currentOperations.count.farmProgress = Math.floor(actProg / progress.length);
    if (isNaN(this.#currentOperations.count.farmProgress)) {
      this.#currentOperations.count.farmProgress = 0;
    }
    if (this.#currentOperations.count.farmProgress === 100) {
      this.#currentOperations.count.farmProgressColour = "success";
    } else {
      this.#currentOperations.count.farmProgressColour = "warning";
    }

    this.#currentOperations.count.printerCount = printers.length;
    this.#currentOperations.count.complete = complete.length;
    this.#currentOperations.count.active = active.length;
    this.#currentOperations.count.offline = offline.length;
    this.#currentOperations.count.idle = idle.length;
    this.#currentOperations.count.disconnected = disconnected.length;

    this.#currentOperations.operations = _.orderBy(operations, ["progress"], ["desc"]);
  }
}

module.exports = CurrentOperationsCache;
