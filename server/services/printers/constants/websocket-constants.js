const WS_STATES = {
  OPEN: {
    state: "Open",
    desc: "The connection is open and ready to communicate."
  },
  CONNECTING: {
    state: "Connecting",
    desc: "The connection is not yet open."
  },
  CLOSED: {
    state: "Closed",
    desc: "The connection is closed."
  },
  CLOSING: {
    state: "Closing",
    desc: "The connection is in the process of closing."
  }
};

const WS_STATE = {
  0: WS_STATES.CONNECTING.state,
  1: WS_STATES.OPEN.state,
  2: WS_STATES.CLOSED.state,
  3: WS_STATES.CLOSING.state
};

const WS_DESC = {
  0: WS_STATES.CONNECTING.desc,
  1: WS_STATES.OPEN.desc,
  2: WS_STATES.CLOSED.desc,
  3: WS_STATES.CLOSING.desc
};

const WS_ERRORS = {
  ECONNREFUSED: "ECONNREFUSED",
  ECONNRESET: "ECONNRESET",
  EHOSTUNREACH: "EHOSTUNREACH",
  ENOTFOUND: "ENOTFOUND"
};

module.exports = {
  WS_STATE,
  WS_DESC,
  WS_ERRORS
};
