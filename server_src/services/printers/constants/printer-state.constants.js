const { mapStateToCategory } = require("../utils/printer-state.utils");

const COLOURS = {
  SUCCESS: "success",
  WARNING: "warning",
  INFO: "info",
  DANGER: "danger"
};

//Common States
const C_STATE = {
  SETTING_UP: "Setting Up",
  OFFLINE: "Offline"
};

//Websocket States
const WS_STATE = {};
//Printer States
const S_STATE = {};
//Host States
const H_STATE = {};

//Common Descriptions
const C_DESC = {
  SETTING_UP: "Setting up your Printer"
};

//Websocket Descriptions
const WS_DESC = {};
//Printer State Descriptions
const S_DESC = {};
//Host Descriptions
const H_DESC = {};

const PRINTER_STATES = {
  SETTING_UP: {
    state: C_STATE.SETTING_UP,
    stateColour: mapStateToCategory(C_STATE.OFFLINE),
    hostState: C_STATE.SETTING_UP,
    hostStateColour: mapStateToCategory(C_STATE.OFFLINE),
    webSocket: COLOURS.DANGER,
    stateDescription: C_DESC.SETTING_UP,
    hostDescription: C_DESC.SETTING_UP,
    webSocketDescription: C_DESC.SETTING_UP
  }
};

module.exports = {
  PRINTER_STATES
};
