const { mapStateToCategory } = require("../utils/printer-state.utils");

const OF_COLOURS = {
  SUCCESS: "success",
  WARNING: "warning",
  INFO: "info",
  DANGER: "danger"
};

//Common States
const OF_C_STATE = {
  SETTING_UP: "Setting Up",
  OFFLINE: "Offline",
  RE_SYNC: "Please Re-Sync"
};

//Printer States
const OF_S_STATE = {};
//Host States
const OF_H_STATE = {
  SHUTDOWN: "Shutdown"
};

//Common Descriptions
const OF_C_DESC = {
  SETTING_UP: "Setting up your Printer",
  RE_SYNC: "Websocket Closed by OctoFarm! Please re-connect your printers websocket..."
};

//Websocket Descriptions
const OF_WS_DESC = {
  SETTING_UP: "Setting up the clients websocket connection: ",
  TENTATIVE: "Websocket Connected but in Tentative state until receiving data",
  CLOSED_BY_OF: "Websocket Closed by OctoFarm",
  SHUTDOWN_RECONNECT: "Websocket Terminated by OctoFarm... reconnection planned"
};
//Printer State Descriptions
const OF_S_DESC = {
  OFFLINE: "OctoPrint is Offline"
};
//Host Descriptions
const OF_H_DESC = {
  SHUTDOWN: "Host is Shutdown"
};

const PRINTER_STATES = {
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
  WS_TENTATIVE: {
    webSocket: OF_COLOURS.WARNING,
    webSocketDescription: OF_WS_DESC.TENTATIVE
  }
};

module.exports = {
  PRINTER_STATES,
  OF_WS_DESC
};
