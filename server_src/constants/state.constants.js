const getWolPowerSubSettingsDefault = () => {
  return {
    enabled: false,
    ip: "255.255.255.0",
    packets: "3",
    port: "9",
    interval: "100",
    MAC: ""
  };
};

const getPowerSettingsDefault = () => {
  return {
    powerOnCommand: "",
    powerOnURL: "",
    powerOffCommand: "",
    powerOffURL: "",
    powerToggleCommand: "",
    powerToggleURL: "",
    powerStatusCommand: "",
    powerStatusURL: "",
    wol: getWolPowerSubSettingsDefault()
  };
};

const getCostSettingsDefault = () => {
  return {
    powerConsumption: 0.5,
    electricityCosts: 0.15,
    purchasePrice: 500,
    estimateLifespan: 43800,
    maintenanceCosts: 0.25
  };
};

const getFilterDefaults = () => [
  "All Printers",
  "State: Idle",
  "State: Active",
  "State: Complete",
  "State: Disconnected"
];

const SYSTEM_CHECKS = {
  api: "api",
  files: "files",
  state: "state",
  profile: "profile",
  settings: "settings",
  system: "system"

  //Special
  // cleaning: "cleaning"
};

const getSystemChecksDefault = () => {
  return {
    [SYSTEM_CHECKS.api]: {
      status: "danger",
      date: null
    },
    [SYSTEM_CHECKS.files]: {
      status: "danger",
      date: null
    },
    [SYSTEM_CHECKS.state]: {
      status: "danger",
      date: null
    },
    [SYSTEM_CHECKS.profile]: {
      status: "danger",
      date: null
    },
    [SYSTEM_CHECKS.settings]: {
      status: "danger",
      date: null
    },
    [SYSTEM_CHECKS.system]: {
      status: "danger",
      date: null
    },
    // TODO Hmm
    cleaning: {
      information: {
        date: null
      },
      job: {
        date: null
      },
      file: {
        date: null
      },
      status: "danger",
      date: null
    }
  };
};

// State category
const CATEGORY = {
  Idle: "Idle",
  Offline: "Offline",
  Disconnected: "Disconnected",
  Complete: "Complete",
  "Error!": "Error!",
  Active: "Active"
};

// https://github.com/OctoPrint/OctoPrint/blob/161e21fe0f6344ec3b9b9b541e9b2c472087ba77/src/octoprint/util/comm.py#L913
const OP_STATE = {
  Offline: "Offline",
  OpeningSerial: "Opening serial connection",
  DetectingSerial: "Detecting serial connection",
  Connecting: "Connecting",
  Operational: "Operational",
  StartingPrintFromSD: "Starting print from SD", // Starting
  StartSendingPrintToSD: "Starting to send file to SD", // Starting
  Starting: "Starting", // Starting
  TransferringFileToSD: "Transferring file to SD", // Transferring
  PrintingFromSD: "Printing from SD", // Printing
  SendingFileToSD: "Sending file to SD", // Printing
  Printing: "Printing", // Printing,
  Cancelling: "Cancelling",
  Pausing: "Pausing",
  Paused: "Paused",
  Resuming: "Resuming",
  Finishing: "Finishing",
  Error: "Error",
  OfflineAfterError: "Offline after error",
  UnknownState: "Unknown State ()" // Unknown State (...) needs proper parsing
};

// All states of the app. Nice to share between server and client
const PSTATE = {
  Offline: "Offline",
  GlobalAPIKey: "Global API Key Issue",
  Searching: "Searching...",
  "Error!": "Error!",
  "No-API": "No-API",
  Disconnected: "Disconnected",
  Starting: "Starting",
  Operational: "Operational",
  Paused: "Paused",
  Printing: "Printing",
  Pausing: "Pausing",
  Cancelling: "Cancelling",
  "Offline after error": "Offline after error",
  Complete: "Complete",
  Shutdown: "Shutdown",
  Online: "Online"
};

const mapStateToColor = (state) => {
  if (state === PSTATE.Loading) {
    return { name: "dark", hex: "#262626", category: CATEGORY.Idle };
  }
  if (state === PSTATE.Operational) {
    return { name: "dark", hex: "#262626", category: CATEGORY.Idle };
  }
  if (state === PSTATE.Paused) {
    return { name: "warning", hex: "#583c0e", category: CATEGORY.Idle };
  }
  if (state === PSTATE.Printing) {
    return { name: "warning", hex: "#583c0e", category: CATEGORY.Active };
  }
  if (state === PSTATE.Pausing) {
    return { name: "warning", hex: "#583c0e", category: CATEGORY.Active };
  }
  if (state === PSTATE.Cancelling) {
    return { name: "warning", hex: "#583c0e", category: CATEGORY.Active };
  }
  if (state === PSTATE.Starting) {
    return { name: "warning", hex: "#583c0e", category: CATEGORY.Active };
  }
  if (state === PSTATE.GlobalAPIKey) {
    return { name: "danger", hex: "#2e0905", category: CATEGORY["Error!"] };
  }
  if (state === PSTATE["Error!"]) {
    return { name: "danger", hex: "#2e0905", category: CATEGORY["Error!"] };
  }
  if (state === PSTATE.Offline) {
    return { name: "danger", hex: "#2e0905", category: CATEGORY.Offline };
  }
  if (state === PSTATE["Searching"]) {
    return { name: "danger", hex: "#2e0905", category: CATEGORY.Offline };
  }
  if (state === PSTATE.Disconnected) {
    return { name: "danger", hex: "#2e0905", category: CATEGORY.Disconnected };
  }
  if (state === PSTATE["No-API"]) {
    return { name: "danger", hex: "#2e0905", category: CATEGORY.Offline };
  }
  if (state === PSTATE.Complete) {
    return { name: "success", hex: "#00330e", category: CATEGORY.Complete };
  }
  if (state === PSTATE.Shutdown) {
    return { name: "danger", hex: "#2e0905", category: CATEGORY.Offline };
  }
  if (state === PSTATE.Online) {
    return { name: "success", hex: "#00330e", category: CATEGORY.Idle };
  }
  if (state === PSTATE["Offline after error"]) {
    return { name: "danger", hex: "#2e0905", category: CATEGORY["Error!"] };
  }

  // TODO is this a smart idea? No error?
  console.warn("PSTATE not recognized:", state);
  return { name: "warning", hex: "#583c0e", category: CATEGORY.Active };
};

module.exports = {
  getPowerSettingsDefault,
  getWolPowerSubSettingsDefault,
  getSystemChecksDefault,
  getCostSettingsDefault,
  getFilterDefaults,
  mapStateToColor,
  PSTATE,
  OP_STATE,
  CATEGORY,
  SYSTEM_CHECKS
};
