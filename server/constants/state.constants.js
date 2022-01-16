const getFilterDefaults = () => [
  "All Printers",
  "State: Idle",
  "State: Active",
  "State: Complete",
  "State: Disconnected"
];

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
  SettingUp: "Setting Up",
  Offline: "Offline",
  GlobalAPIKey: "Global API Key Issue",
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

const STATE_DESCRIPTION = {
  PrinterSettingUp: "Setting up your Printer...",
  SocketOffline: "Websocket is Offline..."
};

const getBootstrapColour = (state) => {
  switch (state) {
    case PSTATE.Operational:
      return { name: "secondary", category: CATEGORY.Idle };
    case PSTATE.Paused:
      return { name: "warning", category: CATEGORY.Idle };
    case PSTATE.Printing:
      return { name: "warning", category: CATEGORY.Active };
    case PSTATE.Pausing:
      return { name: "warning", category: CATEGORY.Active };
    case PSTATE.Cancelling:
      return { name: "warning", category: CATEGORY.Active };
    case PSTATE.Starting:
      return { name: "warning", category: CATEGORY.Active };
    case PSTATE.Offline:
      return { name: "danger", category: CATEGORY.Offline };
    case PSTATE.Error:
      return { name: "danger", category: CATEGORY.Offline };
    case PSTATE.Searching:
      return { name: "danger", category: CATEGORY.Offline };
    case PSTATE.Disconnected:
      return { name: "danger", category: CATEGORY.Disconnected };
    case PSTATE.NoAPI:
      return { name: "danger", category: CATEGORY.Offline };
    case PSTATE.Complete:
      return { name: "success", category: CATEGORY.Complete };
    case PSTATE.Shutdown:
      return { name: "danger", category: CATEGORY.Offline };
    case PSTATE.Online:
      return { name: "success", category: CATEGORY.Idle };
    case PSTATE.OfflineAfterError:
      return { name: "danger", category: CATEGORY.Error };
    default:
      // Fall back to danger to alert the user and Active to stop any commands going through
      return { name: "danger", category: CATEGORY.Active };
  }
};

module.exports = {
  getFilterDefaults,
  getBootstrapColour,
  STATE_DESCRIPTION,
  PSTATE,
  OP_STATE,
  CATEGORY
};
