const { returnConnectionLogs } = require("./connection-monitor.service");
const { SettingsClean } = require("../lib/dataFunctions/settingsClean");
const Logger = require("../handlers/logger");
const logger = new Logger("OctoFarm-Server");
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
    connectionDefaults.port = typeof connectionOptions.portPreference === "string";
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
  const WS_logs = [];

  const { timeout, onlinePolling } = SettingsClean.returnSystemSettings();

  if (connectionLogs?.connections) {
    for (let i = 0; i < connectionLogs.connections.length; i++) {
      const log = connectionLogs.connections[i];
      if (!log.url.includes("/sockjs/websocket")) {
        logs.push({
          url: log.url,
          responseTimes: log.log.lastResponseTimes
        });
      } else {
        WS_logs.push({
          url: log.url,
          responseTimes: log.log.lastResponseTimes
        });
      }
    }
  }

  const responses = [];

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    if (log.responseTimes.length === 0) {
      log.responseTimes = [0];
    }
    const responsesAverage = log.responseTimes.reduce((a, b) => a + b) / log.responseTimes.length;
    if (responsesAverage) {
      responses.push({
        url: log.url,
        initialTimeout: responsesAverage < timeout.apiTimeout,
        cutOffTimeout: responsesAverage < timeout.apiRetryCutoff
      });
    }
  }

  const WS_responses = [];

  const THROTTLE_MS = parseFloat(onlinePolling.seconds) * 1000;

  for (let i = 0; i < WS_logs.length; i++) {
    const log = WS_logs[i];
    if (log.responseTimes.length === 0) {
      log.responseTimes = [0];
    }
    const responsesAverage = log.responseTimes.reduce((a, b) => a + b) / log.responseTimes.length;

    if (responsesAverage) {
      logger.debug("Throttle Generation", {
        url: log.url,
        throttle: responsesAverage < THROTTLE_MS - 150 || responsesAverage > THROTTLE_MS + 500,
        over: responsesAverage > THROTTLE_MS + 500,
        under: responsesAverage < THROTTLE_MS - 150
      });
      WS_responses.push({
        url: log.url,
        throttle: responsesAverage < THROTTLE_MS - 150 || responsesAverage > THROTTLE_MS + 500,
        over: responsesAverage > THROTTLE_MS + 500,
        under: responsesAverage < THROTTLE_MS - 150
      });
    }
  }

  return {
    webSocketResponses: WS_responses,
    apiResponses: responses
  };
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