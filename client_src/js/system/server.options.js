const serverDatabaseKeys = {
  ALL: "Everything",
  ALERTS: "Alerts",
  CLIENT: "ClientSettings",
  FILAMENT: "Filament",
  HISTORY: "History",
  PRINTERS: "Printers",
  ROOMDATA: "RoomData",
  SERVER: "ServerSettings",
  USERS: "Users"
};

const serverActionsElements = {
  OP_TIMELAPSE_SETUP: document.getElementById("setupTimelapseOctoPrint"),
  LOG_DUMP_GENERATE: document.getElementById("logDumpGenerateBtn"),
  RESET_DASHBOARD: document.getElementById("resetDashboardBtn"),
  SAVE_SERVER_SETTINGS: document.getElementById("saveServerSettings"),
  SAVE_CLIENT_SETTINGS: document.getElementById("saveClientSettingsBtn"),
  RESTART_OCTOFARM: document.getElementById("restartOctoFarmBtn"),
  UPDATE_OCTOFARM: document.getElementById("updateOctoFarmBtn"),
  CHECK_OCTOFARM_UPDATES: document.getElementById("checkUpdatesForOctoFarmBtn")
};

const localStorageKeys = {
  DASHBOARD_SETTINGS: "dashboardConfiguration"
};

// TODO clean up with a settings migration...
// onlinePolling.seconds -> octoprintThrottle
// timeout.apiRetry <-> timeout.apiRetryCutoff
// filament.filamentCheck -> filamentManager.isFilamentSelected
const settingsElements = {
  onlinePolling: {
    seconds: document.getElementById("webSocketThrottle")
  },
  server: {
    port: document.getElementById("serverPortNo"),
    loginRequired: document.getElementById("requireLogin"),
    registration: document.getElementById("requireRegistration")
  },
  timeout: {
    webSocketRetry: document.getElementById("webSocketRetry"),
    apiTimeout: document.getElementById("APITimeout"),
    apiRetryCutoff: document.getElementById("APIRetryTimeout"),
    apiRetry: document.getElementById("APIRetry")
  },
  filament: {
    filamentCheck: document.getElementById("checkFilament")
  },
  history: {
    snapshot: {
      onComplete: document.getElementById("snapOnComplete"),
      onFailure: document.getElementById("snapOnFailure")
    },
    thumbnails: {
      onComplete: document.getElementById("thumbOnComplete"),
      onFailure: document.getElementById("thumbOnFailure")
    },
    timelapse: {
      onComplete: document.getElementById("timelapseOnComplete"),
      onFailure: document.getElementById("timelapseOnFailure"),
      deleteAfter: document.getElementById("timelapseDelete")
    }
  },
  influxExport: {
    active: document.getElementById("infActivateInfluxExport"),
    host: document.getElementById("infHostIP"),
    port: document.getElementById("infHostPort"),
    database: document.getElementById("infDatabase"),
    username: document.getElementById("infUsername"),
    password: document.getElementById("infPassword"),
    retentionPolicy: {
      duration: document.getElementById("infDuration"),
      replication: document.getElementById("infReplication"),
      defaultRet: document.getElementById("infRetention")
    }
  },
  monitoringViews: {
    panel: document.getElementById("monitoringpanel"),
    list: document.getElementById("monitoringlist"),
    camera: document.getElementById("monitoringcamera"),
    group: document.getElementById("monitoringgroup"),
    currentOperations: document.getElementById("monitoringcurrentOperations"),
    combined: document.getElementById("monitoringcombined")
  }
};

export { serverDatabaseKeys, serverActionsElements, localStorageKeys, settingsElements };
