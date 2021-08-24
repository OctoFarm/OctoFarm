const getFilterDefaults = () => [
  "All Printers",
  "State: Idle",
  "State: Active",
  "State: Complete",
  "State: Disconnected"
];

const ERR_COUNT = {
  offline: "offline",
  apiKeyNotAccepted: "apiKeyNotAccepted",
  missingApiKey: "missingApiKey",
  apiKeyIsGlobal: "apiKeyIsGlobal",
  missingSessionKey: "missingSessionKey"
};

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
      status: "success", //"danger",
      date: null
    },
    [SYSTEM_CHECKS.files]: {
      status: "success", //"danger",
      date: null
    },
    [SYSTEM_CHECKS.state]: {
      status: "success", //"danger",
      date: null
    },
    [SYSTEM_CHECKS.profile]: {
      status: "success", //"danger",
      date: null
    },
    [SYSTEM_CHECKS.settings]: {
      status: "success", //"danger",
      date: null
    },
    [SYSTEM_CHECKS.system]: {
      status: "success", //"danger",
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
      status: "success", // "danger",
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
  Error: "Error!",
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

// Handy model to understand state.flags
const OP_STATE_FLAGS = {
  operational: "operational",
  printing: "printing",
  cancelling: "cancelling",
  pausing: "pausing",
  resuming: "resuming",
  finishing: "finishing",
  closedOrError: "closedOrError",
  error: "error",
  paused: "paused",
  ready: "ready",
  sdReady: "sdReady"
};

// All states of the app. Nice to share between server and client
const PSTATE = {
  Offline: "Offline",
  GlobalAPIKey: "Global API Key Issue",
  ApiKeyRejected: "API Key rejected",
  Searching: "Searching...",
  Error: "Error!",
  NoAPI: "No-API",
  Disconnected: "Disconnected",
  Starting: "Starting",
  Operational: "Operational",
  Paused: "Paused",
  Printing: "Printing",
  Pausing: "Pausing",
  Cancelling: "Cancelling",
  OfflineAfterError: "Offline after error",
  Complete: "Complete",
  Shutdown: "Shutdown",
  Online: "Online"
};

const OF_STATE_REMAP = {
  [OP_STATE.Offline]: {
    state: PSTATE.Disconnected, // hard remap!
    desc: "Your printer is disconnected"
  },
  [OP_STATE.OpeningSerial]: {
    state: PSTATE.Searching, // Lack of better
    desc: "Your printer is connecting to serial"
  },
  [OP_STATE.DetectingSerial]: {
    state: PSTATE.Searching, // Lack of better
    desc: "Your printer is detecting serial connections"
  },
  [OP_STATE.Connecting]: {
    state: PSTATE.Connecting,
    desc: "Your printer is connecting to serial"
  },
  [OP_STATE.Operational]: {
    state: PSTATE.Operational,
    desc: "Printer is ready to print"
  },
  [OP_STATE.StartingPrintFromSD]: {
    state: PSTATE.Searching,
    desc: "STARTING PRINT FROM SD!"
  },
  [OP_STATE.StartSendingPrintToSD]: {
    state: PSTATE.Searching,
    desc: "Starting to send file to SD"
  },
  [OP_STATE.Starting]: {
    state: PSTATE.Starting,
    desc: "Printing right now"
  },
  [OP_STATE.TransferringFileToSD]: {
    state: PSTATE.Searching,
    desc: "Transferring to SD"
  },
  [OP_STATE.SendingFileToSD]: {
    state: PSTATE.Searching,
    desc: "Busy sending file to SD"
  },
  [OP_STATE.PrintingFromSD]: {
    state: PSTATE.Printing,
    desc: "PRINTING FROM SD!"
  },
  [OP_STATE.Printing]: {
    state: PSTATE.Printing,
    desc: "Printing right now"
  },
  [OP_STATE.Cancelling]: {
    state: PSTATE.Cancelling,
    desc: "Print is cancelling"
  },
  [OP_STATE.Pausing]: {
    state: PSTATE.Pausing,
    desc: "Printing paused"
  },
  [OP_STATE.Paused]: {
    state: PSTATE.Paused,
    desc: "Printing paused"
  },
  [OP_STATE.Resuming]: {
    state: PSTATE.Starting,
    desc: "Print resuming"
  },
  [OP_STATE.Finishing]: {
    state: PSTATE.Complete,
    desc: "Print finishing"
  },
  [OP_STATE.UnknownState]: {
    state: "Unknown state",
    desc: "Unknown state"
  }
};

function remapOctoPrintState(octoPrintState) {
  // Handy stuff!
  const flags = octoPrintState.flags;
  const stateLabel = octoPrintState.text;

  if (stateLabel.includes("Error:") || stateLabel.includes("error")) {
    return {
      state: PSTATE.Error,
      flags,
      desc: stateLabel
    };
  }

  const mapping = OF_STATE_REMAP[stateLabel];
  mapping.flags = flags;
  if (!!mapping) return mapping;

  return {
    state: stateLabel,
    flags,
    desc: "OctoPrint's state was not recognized"
  };
}

const mapStateToColor = (state) => {
  if (state === PSTATE.Loading) {
    return { name: "dark", hex: "#262626", category: CATEGORY.Idle };
  }
  if (state === PSTATE.Operational) {
    return { name: "dark", hex: "#262626", category: CATEGORY.Idle };
  }
  if (state === PSTATE.Online) {
    return { name: "success", hex: "#00330e", category: CATEGORY.Idle };
  }
  if (state === PSTATE.Paused) {
    return { name: "warning", hex: "#583c0e", category: CATEGORY.Idle };
  }
  if (state === PSTATE.Printing) {
    return { name: "success", hex: "#583c0e", category: CATEGORY.Active };
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
  if (state === PSTATE.Offline) {
    return { name: "danger", hex: "#2e0905", category: CATEGORY.Offline };
  }
  if (state === PSTATE.Searching) {
    return { name: "danger", hex: "#2e0905", category: CATEGORY.Offline };
  }
  if (state === PSTATE.NoAPI) {
    return { name: "danger", hex: "#2e0905", category: CATEGORY.Offline };
  }
  if (state === PSTATE.Disconnected) {
    return { name: "danger", hex: "#2e0905", category: CATEGORY.Disconnected };
  }
  if (state === PSTATE.Shutdown) {
    return { name: "danger", hex: "#2e0905", category: CATEGORY.Offline };
  }
  if (state === PSTATE.Complete) {
    return { name: "success", hex: "#00330e", category: CATEGORY.Complete };
  }
  if (state === PSTATE.ApiKeyRejected) {
    return { name: "danger", hex: "#2e0905", category: CATEGORY.Error };
  }
  if (state === PSTATE.GlobalAPIKey) {
    return { name: "danger", hex: "#2e0905", category: CATEGORY.Error };
  }
  if (state === PSTATE.Error) {
    return { name: "danger", hex: "#2e0905", category: CATEGORY.Error };
  }
  if (state === PSTATE.OfflineAfterError) {
    return { name: "danger", hex: "#2e0905", category: CATEGORY.Error };
  }

  console.warn("Provided PSTATE not recognized:", state);
  return { name: "warning", hex: "#583c0e", category: CATEGORY.Active };
};

module.exports = {
  getSystemChecksDefault,
  getFilterDefaults,
  mapStateToColor,
  remapOctoPrintState,
  ERR_COUNT,
  PSTATE,
  OP_STATE,
  CATEGORY,
  SYSTEM_CHECKS
};
