const { getPrinterStoreCache } = require("../../../cache/printer-store.cache");
const { PrinterTicker } = require("../../printer-connection-log.service");
const PluginLogs = require("../../../models/PluginLogs");
const Logger = require("../../../handlers/logger");
const { LOGGER_ROUTE_KEYS } = require("../../../constants/logger.constants");
const logger = new Logger(LOGGER_ROUTE_KEYS.OP_UTIL_PLUGINS);

const defaultWOLSubnetMask = "255.255.255.0";

const addOctoPrintLogWrapper = (id, message, state, plugin) => {
  const today = new Date();

  const log = {
    id: today.getTime(),
    date: today,
    message: message,
    printerID: id,
    printerURL: getPrinterStoreCache().getPrinterURL(id),
    state: state,
    pluginDisplay: plugin
  };

  const newLog = new PluginLogs(log);

  newLog
    .save()
    .then((res) => {
      logger.debug("Successfully saved plugin log data to database", res);
    })
    .catch((e) => {
      logger.error("Couldn't save plugin log data", e);
    });
};

const addOctoPrintIssueWrapper = (id, message, state) => {
  PrinterTicker.addIssue(new Date(), getPrinterStoreCache().getPrinterURL(id), message, state, id);
};

const testAndCollectCostPlugin = (id, currentSettings, plugins) => {
  if (currentSettings?.default === true) {
    if (!!plugins["costestimation"]) {
      const costSettings = {
        powerConsumption: plugins["costestimation"].powerConsumption,
        electricityCosts: plugins["costestimation"].costOfElectricity,
        purchasePrice: plugins["costestimation"].priceOfPrinter,
        estimateLifespan: plugins["costestimation"].lifespanOfPrinter,
        maintenanceCosts: plugins["costestimation"].maintenanceCosts
      };
      const pluginData = JSON.stringify(costSettings);
      addOctoPrintLogWrapper(
        id,
        "Cost estimation settings found and saved: " + pluginData,
        "Success",
        "Cost Estimation"
      );
      return costSettings;
    } else {
      return {
        powerConsumption: 0.5,
        electricityCosts: 0.15,
        purchasePrice: 500,
        estimateLifespan: 43800,
        maintenanceCosts: 0.25
      };
    }
  } else {
    return currentSettings;
  }
};

const testAndCollectPSUControlPlugin = (id, currentSettings, plugins) => {
  if (currentSettings?.default === true) {
    if (!!plugins["psucontrol"]) {
      addOctoPrintLogWrapper(
        id,
        "PSU Control plugin found and settings applied",
        "Success",
        "PSU Control"
      );
      return {
        powerOnCommand: "{\"command\":\"turnPSUOn\"}",
        powerOnURL: "[PrinterURL]/api/plugin/psucontrol",
        powerOffCommand: "{\"command\":\"turnPSUOff\"}",
        powerOffURL: "[PrinterURL]/api/plugin/psucontrol",
        powerStatusCommand: "{\"command\":\"getPSUState\"}",
        powerStatusURL: "[PrinterURL]/api/plugin/psucontrol",
        wol: {
          enabled: false,
          ip: defaultWOLSubnetMask,
          packets: "3",
          port: "9",
          interval: "100",
          MAC: ""
        }
      };
    } else {
      return {
        powerOnCommand: "",
        powerOnURL: "",
        powerOffCommand: "",
        powerOffURL: "",
        powerToggleCommand: "",
        powerToggleURL: "",
        powerStatusCommand: "",
        powerStatusURL: "",
        wol: {
          enabled: false,
          ip: defaultWOLSubnetMask,
          packets: "3",
          port: "9",
          interval: "100",
          MAC: ""
        }
      };
    }
  } else {
    return currentSettings;
  }
};

const captureKlipperPluginData = (id, data) => {
  //TODO this needs to output to a klipper log, doesn't need to be in connection on Printer Manager
  logger.debug("Klipper data", data);
  const { payload, subtype } = data;

  //Enable klipper ready state monitoring
  const { klipperState } = getPrinterStoreCache().getPrinterInformation(id);
  if (typeof klipperState === "undefined") {
    getPrinterStoreCache().updatePrinterLiveValue(id, {
      klipperState: "danger"
    });
  }

  let state = subtype === "info" ? "Info" : "Offline";

  if (payload.includes("file")) {
    return;
  }

  if (payload.includes("Standby")) {
    getPrinterStoreCache().updatePrinterLiveValue(id, {
      klipperState: "warning"
    });
  }

  if (payload.includes("Disconnect") || payload.includes("Lost")) {
    getPrinterStoreCache().updatePrinterLiveValue(id, {
      klipperState: "danger"
    });
    state = "Offline";
  }

  if (payload.includes("Ready")) {
    getPrinterStoreCache().updatePrinterLiveValue(id, {
      klipperState: "success"
    });
    state = "Complete";
  }

  if (payload.includes("probe")) {
    state = "Active";
  }

  if (subtype === "debug") {
    state = "Warning";
  }

  addOctoPrintLogWrapper(id, payload, state, "OctoKlipper");
};

const capturePluginManagerData = (id, type, data) => {
  logger.debug("Plugin Manager data", data);
  switch (type) {
    case "loglines":
      const { loglines } = data;
      captureLogLines(id, loglines);
      break;
    case "result":
      captureResultsData(id, data);
      break;
  }
};

const captureResultsData = (id, data) => {
  logger.debug("Results data", data);
  const { action, result, needs_restart } = data;
  getPrinterStoreCache().updatePrinterLiveValue(id, {
    restartRequired: false
  });

  if (needs_restart === true) {
    getPrinterStoreCache().updatePrinterLiveValue(id, {
      restartRequired: true
    });
  }

  const message = `Action: ${action} has ${
    result ? "successfully completed" : "failed to complete"
  } | Restart Required: ${needs_restart}`;
  const state = result ? "Complete" : "Offline";
  addOctoPrintIssueWrapper(id, message, state);
  addOctoPrintLogWrapper(id, message, "Active", "Plugin Manager");
};

const captureLogLines = (id, data) => {
  logger.debug("Log lines data", data);
  if (!!data && data.length > 0) {
    data.forEach((line) => {
      if (line.stream === "call" || line.stream === "message") {
        addOctoPrintLogWrapper(id, line.line, "Active", "Plugin Manager");
      }
      if (line.stream === "stdout") {
        addOctoPrintLogWrapper(id, line.line, "Complete", "Plugin Manager");
      }
      if (line.stream === "stderr") {
        addOctoPrintLogWrapper(id, line.line, "Offline", "Plugin Manager");
        addOctoPrintIssueWrapper(id, line.line, "Offline");
      }
      if (line.line.includes("Successfully installed")) {
        addOctoPrintLogWrapper(id, line.line, "Complete", "Plugin Manager");
        addOctoPrintIssueWrapper(id, line.line, "Complete");
      }
      if (line.line.includes("Successfully built")) {
        addOctoPrintLogWrapper(id, line.line, "Active", "Plugin Manager");
        addOctoPrintIssueWrapper(id, line.line, "Active");
      }
      if (line.line.includes("Uninstalling")) {
        addOctoPrintLogWrapper(id, line.line, "Offline", "Plugin Manager");
        addOctoPrintIssueWrapper(id, line.line, "Offline");
      }
      if (line.line.includes("Processing")) {
        addOctoPrintLogWrapper(id, line.line, "Active", "Plugin Manager");
        addOctoPrintIssueWrapper(id, line.line, "Active");
      }
    });
  }
};

const captureThrottlePluginData = (id, data) => {
  logger.debug("OctoPi data", data);
  const {
    state: { current_undervoltage, current_overheat }
  } = data;

  if (current_undervoltage) {
    addOctoPrintLogWrapper(
      id,
      "OctoPrint reporting throttled state! Undervoltage issue!",
      "Offline",
      "Pi Support"
    );
  }

  if (current_overheat) {
    addOctoPrintLogWrapper(
      id,
      "OctoPrint reporting throttled state! Overheating issue!",
      "Offline",
      "Pi Support"
    );
  }
  const printerOctoPiData = getPrinterStoreCache().getOctoPiData(id);

  let octoPi = {};

  if (!!printerOctoPiData) {
    octoPi = JSON.parse(JSON.stringify(printerOctoPiData));
  } else {
    return;
  }

  octoPi.throttled_state.current_overheat = current_overheat;
  octoPi.throttled_state.current_undervoltage = current_undervoltage;

  getPrinterStoreCache().updatePrinterDatabase(id, { octoPi });
};

const captureResourceMonitorData = (id, data) => {
  logger.debug("CPU monitor data", data);
  const {
    cpu: { average, octoprint },
    memory: { percent }
  } = data;
  let octoPrintResourceMonitor = getPrinterStoreCache().getOctoPrintResourceMonitorValues(id);

  if (!octoPrintResourceMonitor) {
    octoPrintResourceMonitor = {
      system_cpu: [],
      system_memory: [],
      octoprint_cpu: []
    };
  }

  if (!!octoprint) {
    octoPrintResourceMonitor.octoprint_cpu.push(octoprint);
  }

  if (!!average) {
    octoPrintResourceMonitor.system_cpu.push(average);
  }
  if (!!percent) {
    octoPrintResourceMonitor.system_memory.push(percent);
  }

  if (octoPrintResourceMonitor.octoprint_cpu.length > 50) {
    octoPrintResourceMonitor.octoprint_cpu.shift();
  }

  if (octoPrintResourceMonitor.system_cpu.length > 50) {
    octoPrintResourceMonitor.system_cpu.shift();
  }

  if (octoPrintResourceMonitor.system_memory.length > 50) {
    octoPrintResourceMonitor.system_memory.shift();
  }

  getPrinterStoreCache().updatePrinterLiveValue(id, {
    octoResourceMonitor: octoPrintResourceMonitor
  });
};

const captureDisplayLayerProgress = (id, data) => {
  logger.debug("DLP data", data);
  getPrinterStoreCache().updatePrinterLiveValue(id, { layerData: data });
};

const captureUpdatingData = (id, data) => {
  logger.info("Updating data", JSON.stringify(data));

  const { data: currentData, type } = data;
  if (type === "updating") {
    addOctoPrintLogWrapper(
      id,
      `OctoPrint Update requested! Version ${currentData?.version}`,
      "Active",
      "Update Manager"
    );
    addOctoPrintIssueWrapper(
      id,
      `OctoPrint Update requested! Version ${currentData?.version}`,
      "Active"
    );
  }

  if (type === "loglines") {
    if (!!currentData?.loglines && currentData.loglines.length > 0) {
      currentData.loglines.forEach((line) => {
        if (line.stream === "call" || line.stream === "message") {
          addOctoPrintLogWrapper(id, line.line, "Active", "Update Manager");
        }
        if (line.stream === "stdout") {
          addOctoPrintLogWrapper(id, line.line, "Complete", "Update Manager");
        }
        if (line.stream === "stderr") {
          addOctoPrintLogWrapper(id, line.line, "Offline", "Update Manager");
          addOctoPrintIssueWrapper(id, line.line, "Offline");
        }
        if (line.line.includes("Successfully installed")) {
          addOctoPrintLogWrapper(id, line.line, "Complete", "Update Manager");
          addOctoPrintIssueWrapper(id, line.line, "Complete");
        }
        if (line.line.includes("Successfully built")) {
          addOctoPrintLogWrapper(id, line.line, "Active", "Update Manager");
          addOctoPrintIssueWrapper(id, line.line, "Active");
        }
        if (line.line.includes("Uninstalling")) {
          addOctoPrintLogWrapper(id, line.line, "Offline", "Update Manager");
          addOctoPrintIssueWrapper(id, line.line, "Offline");
        }
        if (line.line.includes("Processing")) {
          addOctoPrintLogWrapper(id, line.line, "Active", "Update Manager");
          addOctoPrintIssueWrapper(id, line.line, "Active");
        }
      });
    }
  }

  if (type === "update_failed") {
    addOctoPrintLogWrapper(
      id,
      `OctoPrint Update failed! Version ${currentData?.version} Reason: ${currentData?.reason}`,
      "Offline",
      "Update Manager"
    );
    addOctoPrintIssueWrapper(
      id,
      `OctoPrint Update failed! Version ${currentData?.version} Reason: ${currentData?.reason}`,
      "Offline"
    );
  }
};

module.exports = {
  testAndCollectPSUControlPlugin,
  testAndCollectCostPlugin,
  captureKlipperPluginData,
  capturePluginManagerData,
  captureThrottlePluginData,
  captureResourceMonitorData,
  captureDisplayLayerProgress,
  captureUpdatingData
};
