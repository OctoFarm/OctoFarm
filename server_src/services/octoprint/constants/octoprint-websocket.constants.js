const { mapStateToColor, PSTATE } = require("../../../constants/state.constants");

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
    plugins: undefined // TODO might be better in different state
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

const OP_WS_SKIP = [OP_WS_MSG.slicingProgress, OP_WS_MSG.timelapse];

const WS_STATE = {
  unopened: "unopened",
  opening: "opening",
  connected: "connected",
  authed: "authed",
  errored: "errored", // Not a disconnect error
  closed: "closed" // Closing error received
};

module.exports = {
  getDefaultProgressState,
  getDefaultJobState,
  getDefaultPrinterState,
  getDefaultCurrentState,
  EVENT_TYPES,
  WS_STATE,
  OP_WS_MSG,
  OP_WS_SKIP
};
