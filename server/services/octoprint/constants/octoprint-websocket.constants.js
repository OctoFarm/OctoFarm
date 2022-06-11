const { mapStateToColor, PSTATE } = require("../../../constants/state.constants");
// REFACTOR old david file, not really used anymore...
function getDefaultProgressState() {
  return {
    completion: undefined,
    filepos: undefined,
    printTime: undefined,
    printTimeLeft: undefined,
    printTimeLeftOrigin: undefined
  };
}

function getDefaultJobState() {
  return {
    file: undefined,
    estimatedPrintTime: undefined,
    averagePrintTime: undefined,
    lastPrintTime: undefined,
    filament: undefined,
    user: undefined
  };
}

function getDefaultPrinterState() {
  return {
    state: PSTATE.Offline,
    desc: "Printer needs WebSocket connection first",
    colour: mapStateToColor(PSTATE.Offline)
  };
}

function getDefaultCurrentState() {
  return {
    state: undefined,
    job: getDefaultJobState(),
    progress: getDefaultProgressState(),
    currentZ: undefined,
    offsets: undefined,
    temps: undefined,
    logs: undefined,
    messages: undefined,
    resends: undefined,
    plugins: undefined
  };
}

const EVENT_TYPES = {
  ClientAuthed: "ClientAuthed",
  ClientClosed: "ClientClosed",
  ClientOpened: "ClientOpened",
  Connected: "Connected",
  Disconnecting: "Disconnecting",
  Disconnected: "Disconnected",
  Dwelling: "Dwelling",
  Error: "Error",
  FileAdded: "FileAdded",
  FileDeselected: "FileDeselected",
  FileRemoved: "FileRemoved",
  FirmwareData: "FirmwareData", // Not modeled yet
  FolderAdded: "FolderAdded",
  FolderRemoved: "FolderRemoved", // Not modeled yet
  Home: "Home",
  MetadataAnalysisFinished: "MetadataAnalysisFinished",
  MetadataAnalysisStarted: "MetadataAnalysisStarted",
  MetadataStatisticsUpdated: "MetadataStatisticsUpdated",
  PositionUpdate: "PositionUpdate",
  PrintCancelled: "PrintCancelled",
  PrintCancelling: "PrintCancelling",
  PrintDone: "PrintDone",
  PrintFailed: "PrintFailed",
  PrintPaused: "PrintPaused",
  PrintStarted: "PrintStarted",
  PrinterStateChanged: "PrinterStateChanged",
  TransferDone: "TransferDone",
  TransferStarted: "TransferStarted",
  UpdatedFiles: "UpdatedFiles",
  Upload: "Upload",
  UserLoggedIn: "UserLoggedIn",
  UserLoggedOut: "UserLoggedOut",
  ZChange: "ZChange"
};

const OP_WS_MSG = {
  connected: "connected",
  reauthRequired: "reauthRequired",
  current: "current",
  history: "history",
  event: "event",
  plugin: "plugin",
  timelapse: "timelapse",
  slicingProgress: "slicingProgress"
};

const OP_WS_MSG_KEYS = {
  state: "state",
  temps: "temps",
  job: "job",
  logs: "logs",
  current: "current",
  connected: "connected",
  resends: "resends",
  progress: "progress",
  currentZ: "currentZ"
};

const OP_WS_PLUGIN_KEYS = {
  pluginmanager: "pluginmanager",
  softwareUpdate: "softwareupdate",
  klipper: "klipper",
  displayLayerProgress: "DisplayLayerProgress",
  softwareupdate: "softwareupdate",
  psucontrol: "psucontrol", //Not used
  pi_support: "pi_support",
  resource_monitor: "resource_monitor",
  display_layer_progress_ws_payload: "DisplayLayerProgress-websocket-payload",
  display_layer_progress: "DisplayLayerProgress"
};

module.exports = {
  getDefaultProgressState,
  getDefaultJobState,
  getDefaultPrinterState,
  getDefaultCurrentState,
  EVENT_TYPES,
  OP_WS_MSG,
  OP_WS_MSG_KEYS,
  OP_WS_PLUGIN_KEYS
};
