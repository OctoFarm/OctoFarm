const { getPrinterStoreCache } = require("../../../cache/printer-store.cache");
const { PrinterTicker } = require("../../printer-connection-log.service");
const PluginLogs = require("../../../models/PluginLogs");
const Logger = require("../../../handlers/logger");
const logger = new Logger("OctoFarm-Server");

const defaultWOLSubnetMask = "255.255.255.0";

const addOctoPrintLogWrapper = (id, message, state, plugin) => {
  //TODO save to a database, and add more plugins!
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

/**
 * One time function run on first scan to get plugin data.
 * @params currentSettings
 * @params plugins
 * @returns {string}
 */
const testAndCollectCostPlugin = (currentSettings, plugins) => {
  if (currentSettings?.default === true) {
    if (plugins["costestimation"]) {
      return {
        powerConsumption: plugins["costestimation"].powerConsumption,
        electricityCosts: plugins["costestimation"].costOfElectricity,
        purchasePrice: plugins["costestimation"].priceOfPrinter,
        estimateLifespan: plugins["costestimation"].lifespanOfPrinter,
        maintenanceCosts: plugins["costestimation"].maintenanceCosts
      };
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
/**
 * One time function run on first scan to get plugin data.
 * @params currentSettings
 * @params plugins
 * @returns {string}
 */
const testAndCollectPSUControlPlugin = (currentSettings, plugins) => {
    if (plugins["psucontrol"]) {
      return {
        powerOnCommand: JSON.stringify({ command: "turnPSUOn" }),
        powerOnURL: "[PrinterURL]/api/plugin/control",
        powerOffCommand: JSON.stringify({ command: "turnPSUOff" }),
        powerOffURL: "[PrinterURL]/api/plugin/psucontrol",
        powerToggleCommand: JSON.stringify({ command: "togglePSU" }),
        powerToggleURL: "[PrinterURL]/api/plugin/psucontrol",
        powerStatusCommand: JSON.stringify({ command: "getPSUState" }),
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
};

const captureKlipperPluginData = (id, data) => {
  //TODO this needs to output to a klipper log, doesn't need to be in connection on Printer Manager
  const { payload, subtype } = data;

  let state = subtype === "info" ? "Info" : "Offline";

  if (payload.includes("file")) {
    return;
  }

  if (payload.includes("Disconnect") || payload.includes("Lost")) {
    state = "Offline";
  }

  if (payload.includes("Ready")) {
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

  const octoPi = JSON.stringify(JSON.parse(getPrinterStoreCache().getOctoPiData(id)));

  octoPi.throttled_state.current_overheat = current_overheat;
  octoPi.throttled_state.current_undervoltage = current_undervoltage;

  getPrinterStoreCache().updatePrinterDatabase(id, { octoPi });
};

const captureResourceMonitorData = (id, data) => {
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
  getPrinterStoreCache().updatePrinterLiveValue(id, { layerData: data });
};

module.exports = {
  testAndCollectPSUControlPlugin,
  testAndCollectCostPlugin,
  captureKlipperPluginData,
  capturePluginManagerData,
  captureThrottlePluginData,
  captureResourceMonitorData,
  captureDisplayLayerProgress
};
