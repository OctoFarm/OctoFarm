const ALLOWED_SYSTEM_CHECKS = {
  API: "api",
  FILES: "files",
  STATE: "state",
  PROFILE: "profile",
  SETTINGS: "settings",
  SYSTEM: "system",
  SYSTEM_INFO: "systemInfo",
  PLUGINS: "plugins",
  UPDATES: "updates"
};
const systemChecks = {
  scanning: {
    api: {
      status: "danger",
      date: null
    },
    files: {
      status: "danger",
      date: null
    },
    state: {
      status: "danger",
      date: null
    },
    profile: {
      status: "danger",
      date: null
    },
    settings: {
      status: "danger",
      date: null
    },
    system: {
      status: "danger",
      date: null
    },
    systemInfo: {
      status: "danger",
      date: null
    },
    plugins: {
      status: "danger",
      date: null
    },
    updates: {
      status: "danger",
      date: null
    }
  }
};
const tempTriggers = {
  heatingVariation: 1,
  coolDown: 30
};

module.exports = {
  systemChecks,
  tempTriggers,
  ALLOWED_SYSTEM_CHECKS
};
