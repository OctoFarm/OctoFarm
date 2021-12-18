const { returnConnectionLogs } = require("./connection-monitor.service");

//TODO move to utils
function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}
//TODO move to utils
function isValidWebsocketUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "ws:" || url.protocol === "wss:";
}

const printerChecks = (printer) => {
  const { printerURL, webSocketURL, camURL } = printer;

  let doTheyMatch = false;

  if (printerURL.includes("https://")) {
    doTheyMatch = webSocketURL.includes("wss://");
  }

  if (printerURL.includes("http://")) {
    doTheyMatch = webSocketURL.includes("ws://");
  }

  return {
    printerURL: isValidHttpUrl(printerURL),
    webSocketURL: isValidWebsocketUrl(webSocketURL),
    cameraURL: camURL === "" ? true : isValidHttpUrl(camURL),
    match: doTheyMatch
  };
};

const apiChecks = (checks) => {
  if (!checks) {
    return false;
  }
  return {
    userCheck: checks.api.status === "success",
    filesCheck: checks.files.status === "success",
    stateCheck: checks.profile.status === "success",
    profileCheck: checks.profile.status === "success",
    settingsCheck: checks.settings.status === "success",
    systemCheck: checks.system.status === "success",
    octoPrintSystemInfo: checks.systemInfo.status === "success",
    octoPrintUpdatesCheck: checks.updates.status === "success",
    octoPrintPluginsCheck: checks.plugins.status === "success"
  };
};

const websocketChecks = (printerURL) => {
  const connectionLogs = returnConnectionLogs(printerURL);

  let logs = false;

  if (connectionLogs?.connections) {
    for (let i = 0; i < connectionLogs.connections.length; i++) {
      const log = connectionLogs.connections[i];
      if (log.url.includes("/sockjs/websocket")) {
        logs = log.log;
      }
    }
  }

  return logs;
};

const printerConnectionCheck = (currentConnection, connectionOptions) => {
  const connectionDefaults = {
    baud: false,
    port: false,
    profile: false
  };

  if (connectionOptions?.baudratePreference) {
    connectionDefaults.baud = !isNaN(connectionOptions.baudratePreference);
  }

  if (connectionOptions?.portPreference) {
    connectionDefaults.port = typeof connectionOptions.baudratePreference === "string";
  }

  if (connectionOptions?.printerProfilePreference) {
    connectionDefaults.profile = typeof connectionOptions.printerProfilePreference === "string";
  }

  return connectionDefaults;
};

const profileChecks = (profile) => {
  return !!profile;
};

const webcamChecks = (cameraURL, camSettings) => {
  const results = {
    camSetup: false,
    historySetup: false
  };
  console.log(cameraURL, camSettings);
  if (!cameraURL || !camSettings) return results;

  console.log(cameraURL);
  if (cameraURL === "") {
    //Blank URL, make sure cam settings are off!
    console.log(camSettings);
  }

  return results;
};

const checkConnectionsMatchRetrySettings = () => {
  // check if current settings are causing high retry counts...
};

module.exports = {
  apiChecks,
  websocketChecks,
  printerConnectionCheck,
  profileChecks,
  webcamChecks,
  printerChecks,
  checkConnectionsMatchRetrySettings
};
