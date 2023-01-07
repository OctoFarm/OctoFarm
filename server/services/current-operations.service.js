const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const { returnCurrentOrdering } = require("./current-operations-order.service");
const { getEmptyOperationsObject } = require("../constants/cleaner.constants");
const Logger = require("../handlers/logger");
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");

const logger = new Logger(LOGGER_ROUTE_KEYS.SERVICE_CURRENT_OPERATIONS);
const _ = require("lodash");
const { notifySubscribers } = require("../services/server-side-events.service");
const { MESSAGE_TYPES } = require("../constants/sse.constants");

const currentOperations = getEmptyOperationsObject();

const getCurrentOperations = () => {
  return currentOperations;
};

const sortCurrentOperations = async () => {
  const farmPrinters = getPrinterStoreCache().listPrintersInformation();
  const complete = [];
  const active = [];
  const idle = [];
  const offline = [];
  const disconnected = [];
  const progress = [];
  const operations = [];
  try {
    for (let i = 0; i < farmPrinters.length; i++) {
      const printer = farmPrinters[i];
      if (typeof printer !== "undefined") {
        const name = printer.printerName;

        if (typeof printer.printerState !== "undefined") {
          if (printer.printerState.colour.category === "Idle") {
            idle.push(printer._id);
          }
          if (printer.printerState.colour.category === "Offline") {
            offline.push(printer._id);
          }
          if (printer.printerState.colour.category === "Disconnected") {
            disconnected.push(printer._id);
          }
        }

        if (typeof printer.printerState !== "undefined" && printer.currentJob != null) {
          let id = printer._id;
          id = id.toString();
          if (printer.printerState.colour.category === "Complete") {
            complete.push(printer._id);
            progress.push(printer.currentJob.progress);
            operations.push({
              id: id,
              name,
              progress: printer.currentJob.progress,
              progressColour: "success",
              timeRemaining: printer.currentJob.printTimeRemaining,
              fileName: printer.currentJob.fileDisplay
            });
          }

          if (
            printer.printerState.colour.category === "Active" &&
            typeof printer.currentJob !== "undefined"
          ) {
            active.push(printer._id);
            progress.push(printer.currentJob.progress);
            operations.push({
              id: id,
              name,
              progress: printer.currentJob.progress,
              progressColour: "warning",
              timeRemaining: printer.currentJob.printTimeRemaining,
              fileName: printer.currentJob.fileDisplay
            });
          }
        }
      }
    }

    const actProg = progress.reduce((a, b) => a + b, 0);

    currentOperations.count.farmProgress = Math.floor(actProg / progress.length);

    if (isNaN(currentOperations.count.farmProgress)) {
      currentOperations.count.farmProgress = 0;
    }
    if (currentOperations.count.farmProgress === 100) {
      currentOperations.count.farmProgressColour = "success";
    } else {
      currentOperations.count.farmProgressColour = "warning";
    }

    currentOperations.count.printerCount = farmPrinters.length;
    currentOperations.count.complete = complete.length;
    currentOperations.count.active = active.length;
    currentOperations.count.offline = offline.length;
    currentOperations.count.idle = idle.length;
    currentOperations.count.disconnected = disconnected.length;

    const { currentIterie, currentOrder } = returnCurrentOrdering();
    const iterie = [currentIterie];
    const order = [currentOrder];
    currentOperations.operations = _.orderBy(operations, iterie, order);
    notifySubscribers("currentOperations", MESSAGE_TYPES.CURRENT_OPERATIONS, currentOperations);
  } catch (err) {
    logger.error(`Current Operations issue: ${err}`);
  }
};

module.exports = {
  getCurrentOperations,
  sortCurrentOperations
};
