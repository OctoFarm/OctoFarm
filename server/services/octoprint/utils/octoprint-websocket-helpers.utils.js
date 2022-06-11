const { getPrinterStoreCache } = require("../../../cache/printer-store.cache");
const { OP_WS_MSG_KEYS } = require("../constants/octoprint-websocket.constants");
const { PrinterClean } = require("../../printer-cleaner.service");
const { JobClean } = require("../../job-cleaner.service");
const TempHistoryDB = require("../../../models/TempHistory");
const { mapStateToCategory } = require("../../printers/utils/printer-state.utils");
const { eventListConstants } = require("../../../constants/event.constants");

const Logger = require("../../../handlers/logger");
const { LOGGER_ROUTE_KEYS } = require("../../../constants/logger.constants");
const logger = new Logger(LOGGER_ROUTE_KEYS.OP_UTIL_WEBSOCKET_HELPER);

const tempTimers = {};

const captureLogData = (id, data) => {
  if (!!data) {
    data.forEach((log) => {
      getPrinterStoreCache().pushTerminalData(id, log);
      if (getPrinterStoreCache().getTerminalDataLength(id) >= 200) {
        getPrinterStoreCache().shiftTerminalData(id);
      }
    });
  }
};

const captureTemperatureData = (id, data) => {
  if (!!data && data.length !== 0) {
    const temps = data;
    //Make sure we have at least a tool!
    getPrinterStoreCache().updatePrinterLiveValue(id, {
      tools: PrinterClean.sortTemps(temps)
    });

    if (!tempTimers[id]) {
      tempTimers[id] = 0;
    }

    // 1 hour in miliseconds = 3600 * 1000 = 3,600,000
    // 5 seconds = 5000 miliseconds.
    // 1 hour has 3,600,000 / 5000 = 720 points of 5000 miliseconds. To pull a hour out of database reference 720 points.
    // Temp data comes every 3 seconds or 3000 miliseconds, so we increment 4000 to the timer to capture every 2 times it comes in. Averaging around 6 seconds...

    if (tempTimers[id] >= 5000) {
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
      tempTimers[id] = tempTimers[id] + 4000;
    }

    coolDownEvent(id, temps);
  }
};

const deleteTemperatureData = async (id) => {
  delete tempTimers[id];
  await TempHistoryDB.deleteMany({ printer_id: id });
};

const coolDownEvent = (id, temps) => {
  const { printerState } = getPrinterStoreCache().getPrinterState(id);

  if (printerState.colour.category === "Active") {
    getPrinterStoreCache().addPrinterEvent(id, eventListConstants.COOL_DOWN.id);
  }
  if (printerState.colour.category === "Complete") {
    const { coolDown } = getPrinterStoreCache().getTempTriggers(id);
    if (
      parseFloat(temps[0].tool0.actual) < parseFloat(coolDown) &&
      parseFloat(temps[0].bed.actual) < parseFloat(coolDown)
    ) {
      getPrinterStoreCache().emitPrinterEvent(id, eventListConstants.COOL_DOWN.id);
    }
  }
};

const captureJobData = (id, data) => {
  if (!!data) {
    getPrinterStoreCache().updatePrinterLiveValue(id, {
      job: data
    });
    getPrinterStoreCache().updatePrinterLiveValue(id, {
      currentJob: JobClean.generate(
        data,
        getPrinterStoreCache().getSelectedFilament(id),
        getPrinterStoreCache().getFileList(id),
        getPrinterStoreCache().getCurrentZ(id),
        getPrinterStoreCache().getCostSettings(id),
        getPrinterStoreCache().getPrinterProgress(id)
      )
    });
  }
};

const capturePrinterState = (id, data) => {
  if (!!data) {
    const { text } = data;
    let returnState = "";
    let returnStateDescription = "";

    if (text === "Offline" || text.includes("Closed")) {
      returnState = "Disconnected";
      returnStateDescription = "Your printer isn't connected to OctoPrint";
    } else if (text.includes("Error") || text.includes("error")) {
      returnState = "Error!";
      returnStateDescription = text;
    } else {
      returnState = text;
      returnStateDescription = "Current status from OctoPrint";

      const progress = getPrinterStoreCache().getPrinterProgress(id);
      if (progress?.completion === 100) {
        returnState = "Complete";
        returnStateDescription = "Your current print is Completed!";
      }
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
    parseAndUpdateVersionData(id, version);
    //Overridden straight away
    checkForMultipleUsers(id);
  }
};

const captureResendsData = (id, data) => {
  if (!!data) {
    getPrinterStoreCache().updatePrinterLiveValue(id, {
      resends: data
    });
  }
};

const capturePrinterProgress = (id, data) => {
  // Patch completion, could be print time genius... Need to try without.
  if (data?.printTimeLeftOrigin === "genius") {
    data.completion = (100 * data.printTime) / (data.printTime + data.printTimeLeft);
  }

  if (!!data) {
    getPrinterStoreCache().updatePrinterLiveValue(id, {
      progress: data
    });
  }
};

const captureCurrentZ = (id, data) => {
  if (!!data) {
    getPrinterStoreCache().updatePrinterLiveValue(id, {
      currentZ: data
    });
  }
};

const checkForMultipleUsers = (id) => {
  const userList = getPrinterStoreCache().getOctoPrintUserList(id);
  if (userList.length > 1) {
    const multiUserIssue = getPrinterStoreCache().getMultiUserIssueState(id);
    if (!multiUserIssue) {
      getPrinterStoreCache().updatePrinterLiveValue(id, {
        multiUserIssue: true
      });
      const currentState = {
        state: "Offline",
        stateColour: mapStateToCategory("Offline"),
        stateDescription: "Multiple users detected... couldn't authenticate the websocket!"
      };

      getPrinterStoreCache().updatePrinterState(id, currentState);

      const currentWebsocketState = {
        webSocket: "danger",
        webSocketDescription: "Websocket is Offline!"
      };
      getPrinterStoreCache().updateWebsocketState(id, currentWebsocketState);
    }
  }
};

const parseAndUpdateVersionData = (id, version) => {
  const currentVersion = getPrinterStoreCache().getOctoPrintVersion(id);
  if (version !== currentVersion) {
    getPrinterStoreCache().updatePrinterDatabase(id, { octoPrintVersion: version });
  }
};

const removeMultiUserFlag = (id) => {
  getPrinterStoreCache().updatePrinterLiveValue(id, {
    multiUserIssue: false
  });
};

const setWebsocketAlive = (id) => {
  const currentWebsocketState = {
    webSocket: "success",
    webSocketDescription: "Online and receiving data!"
  };
  getPrinterStoreCache().updateWebsocketState(id, currentWebsocketState);
};

module.exports = {
  captureTemperatureData,
  captureJobData,
  captureLogData,
  capturePrinterState,
  captureConnectedData,
  removeMultiUserFlag,
  setWebsocketAlive,
  captureResendsData,
  capturePrinterProgress,
  captureCurrentZ,
  deleteTemperatureData
};
