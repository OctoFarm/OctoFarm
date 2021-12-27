const { getPrinterStoreCache } = require("../../../cache/printer-store.cache");
const { OP_WS_MSG_KEYS } = require("../constants/octoprint-websocket.constants");
const { PrinterClean } = require("../../../lib/dataFunctions/printerClean");
const { JobClean } = require("../../../lib/dataFunctions/jobClean");
const TempHistoryDB = require("../../../models/TempHistory");
const { mapStateToCategory } = require("../../printers/utils/printer-state.utils");

const Logger = require("../../../handlers/logger");
const logger = new Logger("OctoFarm-State");

//TODO, could potentially build up if not careful.
const tempTimers = {};

const captureLogData = (id, data) => {
  if (!!data[OP_WS_MSG_KEYS.logs]) {
    const logs = data[OP_WS_MSG_KEYS.logs];
    getPrinterStoreCache().updatePrinterLiveValue(id, {
      key: "terminal",
      data: PrinterClean.sortTerminal(logs, getPrinterStoreCache().getTerminalData(id))
    });
  }
};

const captureTemperatureData = (id, data) => {
  if (!!data[OP_WS_MSG_KEYS.temps] && data[OP_WS_MSG_KEYS.temps].length !== 0) {
    const temps = data[OP_WS_MSG_KEYS.temps];
    //Make sure we have at least a tool!
    getPrinterStoreCache().updatePrinterLiveValue(id, {
      key: "tools",
      data: PrinterClean.sortTemps(temps[0])
    });

    if (!tempTimers[id]) {
      tempTimers[id] = 0;
    }

    if (tempTimers[id] >= 6000) {
      const datebaseTemp = {
        currentTemp: temps[0],
        printer_id: id
      };
      const newTemp = new TempHistoryDB(datebaseTemp);
      newTemp
        .save()
        .then((res) => {
          logger.debug("Successfully saved temp data to database", res);
        })
        .catch((e) => {
          logger.error("Couldn't save temperature data", e);
        });
      tempTimers[id] = 0;
    } else {
      tempTimers[id] = tempTimers[id] + 2000;
    }
  }
};

const captureJobData = (id, data) => {
  if (!!data[OP_WS_MSG_KEYS.job]) {
    const job = data[OP_WS_MSG_KEYS.job];
    //Make sure we have at least a tool!
    getPrinterStoreCache().updatePrinterLiveValue(id, {
      key: "job",
      data: JobClean.generate(
        job,
        getPrinterStoreCache().getSelectedFilament(id),
        getPrinterStoreCache().getFileList(id),
        getPrinterStoreCache().getCurrentZ(id),
        getPrinterStoreCache().getCostSettings(id)
      )
    });
  }
};

const capturePrinterState = (id, data) => {
  if (!!data[OP_WS_MSG_KEYS.current]) {
    const { state } = data[OP_WS_MSG_KEYS.current];
    const { text } = state;

    let returnState = "";
    let returnStateDescription = "";

    if (text === "Offline") {
      returnState = "Disconnected";
      returnStateDescription = "Your printer isn't connected to OctoPrint";
    } else if (text.includes("Error") || text.includes("error")) {
      returnState = "Error!";
      returnStateDescription = text;
    } else if (text.includes("Closed")) {
      returnState = "Disconnected";
      returnStateDescription = "Your printer isn't connected to OctoPrint";
    } else {
      returnState = text;
      returnStateDescription = "Current status from OctoPrint";
    }

    const currentState = {
      state: returnState,
      stateColour: mapStateToCategory(returnState),
      stateDescription: returnStateDescription
    };

    getPrinterStoreCache().updatePrinterState(id, currentState);
  }
};

const captureConnectedData = (id, data) => {
  if (!!data[OP_WS_MSG_KEYS.connected]) {
    const { version } = data[OP_WS_MSG_KEYS.connected];
    const currentVersion = getPrinterStoreCache().getOctoPrintVersion(id);
    if (version !== currentVersion) {
      console.log("VERSION", version);
      console.log("CURRENT", currentVersion);
      getPrinterStoreCache().updatePrinterDatabase(id, { octoPrintVersion: version });
    }
  }
};

module.exports = {
  captureTemperatureData,
  captureJobData,
  captureLogData,
  capturePrinterState,
  captureConnectedData
};
