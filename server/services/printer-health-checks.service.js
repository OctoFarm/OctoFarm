const { returnConnectionLogs } = require("./connection-monitor.service");
const { SettingsClean } = require("./settings-cleaner.service");
const { isValidWebsocketUrl, isValidHttpUrl } = require("../utils/url.utils");

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

const apiChecksRequired = (checks) => {
  if (!checks) {
    return false;
  }
  return {
    userCheck: checks.api.status === "success", //Required
    stateCheck: checks.profile.status === "success", //Required
    profileCheck: checks.profile.status === "success", //Required
    settingsCheck: checks.settings.status === "success", //Required
    systemCheck: checks.system.status === "success" //Required
  };
};

const apiChecksOptional = (checks) => {
  if (!checks) {
    return false;
  }
  return {
    filesCheck: checks.files.status === "success",
    octoPrintSystemInfo: checks.systemInfo.status === "success",
    octoPrintUpdatesCheck: checks.updates.status === "success",
    octoPrintPluginsCheck: checks.plugins.status === "success"
  };
};

const websocketChecks = (printerURL) => {
  const connectionLogs = returnConnectionLogs(printerURL);

  let logs = false;

  if (connectionLogs?.connections) {
    for (const log of connectionLogs.connections) {
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
    connectionDefaults.port = typeof connectionOptions.portPreference === "string";
  }

  if (connectionOptions?.printerProfilePreference) {
    connectionDefaults.profile = typeof connectionOptions.printerProfilePreference === "string";
  }

  return connectionDefaults;
};
// REFACTOR this need to be better, no different than the API check at minute.
const profileChecks = (profile) => {
  return !!profile;
};

const webcamChecks = (cameraURL, camSettings) => {
  const results = {
    camSetup: false,
    historySetup: {
      ffmpegPath: true,
      ffmpegVideoCodex: true,
      timelapseEnabled: true
    }
  };

  if (!camSettings) {
    return results;
  }

  if (cameraURL === "" || cameraURL === null) {
    //Blank URL, make sure cam settings are off!
    results.camSetup = !camSettings.webcamEnabled;
  } else {
    results.camSetup = camSettings.webcamEnabled;
  }

  const { history } = SettingsClean.returnSystemSettings();
  if (
    history.snapshot.onComplete ||
    history.snapshot.onFailure ||
    history.timelapse.onComplete ||
    history.timelapse.onFailure
  ) {
    if (typeof camSettings.ffmpegPath !== "string") {
      results.historySetup.ffmpegPath = false;
    }
    if (camSettings.ffmpegVideoCodec !== "libx264") {
      results.historySetup.ffmpegVideoCodex = false;
    }
    if (!camSettings.timelapseEnabled) {
      results.historySetup.timelapseEnabled = false;
    }
  }

  return results;
};

const checkConnectionsMatchRetrySettings = (printerURL) => {
  // check if current settings are causing high retry counts...
  const connectionLogs = returnConnectionLogs(printerURL);

  const logs = [];

  const { timeout } = SettingsClean.returnSystemSettings();

  if (connectionLogs?.connections) {
    for (const log of connectionLogs.connections) {
      if (!log.url.includes("/sockjs/websocket")) {
        logs.push({
          url: log.url,
          responseTimes: log.log.lastResponseTimes
        });
      }
    }
  }

  const responses = [];

  for (const log of logs) {
    if (log.responseTimes.length === 0) {
      log.responseTimes = [0];
    }
    const responsesAverage = log?.responseTimes?.reduce((a, b) => a + b) / log.responseTimes.length;
    if (responsesAverage) {
      responses.push({
        url: log.url,
        initialTimeout: responsesAverage < timeout.apiTimeout + 1000,
        cutOffTimeout: responsesAverage < timeout.apiRetryCutoff,
        responsesAverage: responsesAverage,
        timeoutSettings: timeout
      });
    }
  }

  return {
    apiResponses: responses
  };
};

module.exports = {
  apiChecksOptional,
  apiChecksRequired,
  websocketChecks,
  printerConnectionCheck,
  profileChecks,
  webcamChecks,
  printerChecks,
  checkConnectionsMatchRetrySettings
};
