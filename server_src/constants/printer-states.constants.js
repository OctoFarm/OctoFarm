const { PSTATE, STATE_DESCRIPTION, getBootstrapColour } = require("../constants/state.constants");

const defaultPrinterState = () => {
  const defaultState = {
    hostState: {
      state: PSTATE.SettingUp,
      colour: getBootstrapColour(PSTATE.Offline),
      desc: STATE_DESCRIPTION.PrinterSettingUp
    },
    printerState: {
      state: PSTATE.SettingUp,
      colour: getBootstrapColour(PSTATE.Offline),
      desc: STATE_DESCRIPTION.PrinterSettingUp
    },
    webSocketState: {
      colour: getBootstrapColour(PSTATE.Offline),
      desc: STATE_DESCRIPTION.SocketOffline
    },
    stepRate: 10
  };
  return Object.assign({}, defaultState);
};

const searchingPrinterState = () => {
  const defaultState = {
    hostState: {
      state: PSTATE.Searching,
      colour: getBootstrapColour(PSTATE.Searching),
      desc: STATE_DESCRIPTION.PrinterSettingUp
    },
    printerState: {
      state: PSTATE.SettingUp,
      colour: getBootstrapColour(PSTATE.Searching),
      desc: STATE_DESCRIPTION.PrinterSettingUp
    },
    webSocketState: {
      colour: getBootstrapColour(PSTATE.Offline),
      desc: STATE_DESCRIPTION.SocketOffline
    },
    stepRate: 10
  };
  return Object.assign({}, defaultState);
};

//TODO should be in own file
const defaultApiChecksState = () => {
  let dict = Object.create(null);

  dict.files = {
    status: "danger",
    date: null
  };

  dict.profile = {
    status: "danger",
    date: null
  };
  dict.settings = {
    status: "danger",
    date: null
  };
  dict.system = {
    status: "danger",
    date: null
  };
  return Object.assign({}, dict);
};

module.exports = {
  defaultApiChecksState,
  defaultPrinterState
};
