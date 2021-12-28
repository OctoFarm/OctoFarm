const { mapStateToCategory } = require("../utils/printer-state.utils");

const OF_COLOURS = {
  SUCCESS: "success",
  WARNING: "warning",
  INFO: "info",
  DANGER: "danger"
};

const CATEGORIES = {
  ACTIVE: "Active",
  IDLE: "Idle",
  OFFLINE: "Offline",
  DISCONNECTED: "Disconnected",
  ERROR: "Error!",
  COMPLETE: "Complete",
  DISABLED: "Disabled"
};

//Common States
const OF_C_STATE = {
  DISABLED: "Disabled",
  SETTING_UP: "Setting Up",
  OFFLINE: "Offline",
  RE_SYNC: "Please Re-Sync",
  SEARCHING: "Searching..."
};

//Printer States
const OF_S_STATE = {
  API_FAIL: "API Check Fail",
  GLOBAL_API_FAIL: "Global API Fail",
  WEBSOCKET_FAIL: "Websocket Fail",
  DISCONNECTED: "Disconnected"
};
//Host States
const OF_H_STATE = {
  ONLINE: "Online",
  SHUTDOWN: "Shutdown"
};

//Common Descriptions
const OF_C_DESC = {
  DISABLED: "Your printer is disabled...",
  SETTING_UP: "Setting up your Printer",
  RE_SYNC: "Websocket Closed by OctoFarm! Please re-connect your printers websocket...",
  RE_SYNC_API:
    "API couldn't be contacted successfully, please check your connection logs and re-setup!",
  RE_SYNC_API_GLOBAL:
    "Detected global API key, please create a user / application key within OctoFarm.",
  RE_CONNECT_WEBSOCKET: "Websocket couldn't be setup, please check connection logs and re-setup!",
  SEARCHING: "Searching for API connection..."
};

//Websocket Descriptions
const OF_WS_DESC = {
  SETTING_UP: "Setting up the clients websocket connection: ",
  TENTATIVE: "Websocket Connected but in Tentative state until receiving data",
  CLOSED_BY_OF: "Websocket Closed by OctoFarm",
  SHUTDOWN_RECONNECT: "Websocket Terminated by OctoFarm... reconnection planned",
  OFFLINE: "Websocket is Offline"
};
//Printer State Descriptions
const OF_S_DESC = {
  OFFLINE: "OctoPrint is Offline"
};
//Host Descriptions
const OF_H_DESC = {
  SHUTDOWN: "Host is Shutdown",
  ONLINE: "Host is Online"
};

const PRINTER_STATES = {
  DISABLED: {
    state: OF_C_STATE.DISABLED,
    stateColour: mapStateToCategory(OF_C_STATE.DISABLED),
    hostState: OF_C_STATE.DISABLED,
    hostStateColour: mapStateToCategory(OF_C_STATE.DISABLED),
    webSocket: OF_COLOURS.DANGER,
    stateDescription: OF_C_DESC.DISABLED,
    hostDescription: OF_C_DESC.DISABLED,
    webSocketDescription: OF_C_DESC.DISABLED
  },
  SETTING_UP: {
    state: OF_C_STATE.SETTING_UP,
    stateColour: mapStateToCategory(OF_C_STATE.OFFLINE),
    hostState: OF_C_STATE.SETTING_UP,
    hostStateColour: mapStateToCategory(OF_C_STATE.OFFLINE),
    webSocket: OF_COLOURS.DANGER,
    stateDescription: OF_C_DESC.SETTING_UP,
    hostDescription: OF_C_DESC.SETTING_UP,
    webSocketDescription: OF_C_DESC.SETTING_UP
  },
  SEARCHING: {
    state: OF_C_STATE.SEARCHING,
    stateColour: mapStateToCategory(OF_C_STATE.SEARCHING),
    hostState: OF_H_STATE.ONLINE,
    hostStateColour: mapStateToCategory(OF_H_STATE.ONLINE),
    webSocket: OF_COLOURS.INFO,
    stateDescription: OF_C_DESC.SEARCHING,
    hostDescription: OF_C_DESC.SEARCHING,
    webSocketDescription: OF_C_DESC.SEARCHING
  },
  SHUTDOWN: {
    state: OF_C_STATE.OFFLINE,
    stateColour: mapStateToCategory(OF_C_STATE.OFFLINE),
    hostState: OF_H_STATE.SHUTDOWN,
    hostStateColour: mapStateToCategory(OF_H_STATE.SHUTDOWN),
    webSocket: OF_COLOURS.DANGER,
    stateDescription: OF_S_DESC.OFFLINE,
    hostDescription: OF_H_DESC.SHUTDOWN,
    webSocketDescription: OF_WS_DESC.SHUTDOWN_RECONNECT
  },
  SHUTDOWN_RE_SYNC: {
    state: OF_C_STATE.RE_SYNC,
    stateColour: mapStateToCategory(OF_C_STATE.RE_SYNC),
    hostState: OF_H_STATE.SHUTDOWN,
    hostStateColour: mapStateToCategory(OF_C_STATE.RE_SYNC),
    webSocket: OF_COLOURS.DANGER,
    stateDescription: OF_C_DESC.RE_SYNC,
    hostDescription: OF_C_DESC.RE_SYNC,
    webSocketDescription: OF_WS_DESC.CLOSED_BY_OF
  },
  SHUTDOWN_API_FAIL: {
    state: OF_S_STATE.API_FAIL,
    stateColour: mapStateToCategory(OF_C_STATE.OFFLINE),
    hostState: OF_H_STATE.ONLINE,
    webSocket: OF_COLOURS.DANGER,
    hostStateColour: mapStateToCategory(OF_C_STATE.RE_SYNC),
    stateDescription: OF_C_DESC.RE_SYNC_API,
    hostDescription: OF_H_DESC.ONLINE
  },
  SHUTDOWN_API_GLOBAL_FAIL: {
    state: OF_S_STATE.GLOBAL_API_FAIL,
    stateColour: mapStateToCategory(OF_C_STATE.OFFLINE),
    hostState: OF_H_STATE.ONLINE,
    hostStateColour: mapStateToCategory(OF_C_STATE.RE_SYNC),
    stateDescription: OF_C_DESC.RE_SYNC_API_GLOBAL,
    hostDescription: OF_WS_DESC.OFFLINE
  },
  SHUTDOWN_WEBSOCKET_FAIL: {
    state: OF_S_STATE.WEBSOCKET_FAIL,
    stateColour: mapStateToCategory(OF_C_STATE.OFFLINE),
    hostState: OF_H_STATE.ONLINE,
    hostStateColour: mapStateToCategory(OF_C_STATE.RE_SYNC),
    stateDescription: OF_C_DESC.RE_CONNECT_WEBSOCKET,
    hostDescription: OF_H_DESC.ONLINE
  },
  WS_OFFLINE: {
    webSocket: OF_COLOURS.DANGER,
    webSocketDescription: OF_WS_DESC.OFFLINE
  },
  WS_TENTATIVE: {
    webSocket: OF_COLOURS.WARNING,
    webSocketDescription: OF_WS_DESC.TENTATIVE
  },
  PRINTER_TENTATIVE: {
    state: OF_S_STATE.DISCONNECTED,
    stateColour: mapStateToCategory(OF_S_STATE.DISCONNECTED),
    stateDescription: "Current status from OctoPrint"
  },
  HOST_ONLINE: {
    hostState: OF_H_STATE.ONLINE,
    hostStateColour: mapStateToCategory(OF_H_STATE.ONLINE),
    hostDescription: OF_H_DESC.ONLINE
  }
};

module.exports = {
  PRINTER_STATES,
  OF_WS_DESC,
  CATEGORIES
};
