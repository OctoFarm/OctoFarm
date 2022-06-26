const serverDatabaseKeys = {
  ALL: "Everything",
  ALERTS: "Alerts",
  CLIENT: "ClientSettings",
  FILAMENT: "Filament",
  HISTORY: "History",
  PRINTERS: "Printers",
  ROOMDATA: "RoomData",
  SERVER: "ServerSettings",
  USERS: "User",
};

const serverActionsElements = {
  OP_TIMELAPSE_SETUP: document.getElementById("setupTimelapseOctoPrint"),
  LOG_DUMP_GENERATE: document.getElementById("logDumpGenerateBtn"),
  RESET_DASHBOARD: document.getElementById("resetDashboardBtn"),
  SAVE_SERVER_SETTINGS: document.getElementById("saveServerSettings"),
  SAVE_CLIENT_SETTINGS: document.getElementById("saveClientSettingsBtn"),
  RESTART_OCTOFARM: document.getElementById("restartOctoFarmBtn"),
  UPDATE_OCTOFARM: document.getElementById("updateOctoFarmBtn"),
  CHECK_OCTOFARM_UPDATES: document.getElementById("checkUpdatesForOctoFarmBtn"),
  OP_FILAMENT_SETUP: document.getElementById("filamentManagerPluginSetupBtn"),
  CLEAR_OLD_LOGS: document.getElementById("clearOldLogs"),
  SERVER_TASK_LIST: document.getElementById("systemTasksTable"),
  ACTIVE_USERS_ROW: document.getElementById("activeUsersRow")
};

const filamentManagerPluginActionElements = {
  postgresURI: document.getElementById("filamentPostGresURI"),
  databaseName: document.getElementById("filamentDatebaseName"),
  username: document.getElementById("filamentUsername"),
  password: document.getElementById("filamentPassword"),
};

const userActionElements = {
  createUserBtn: document.getElementById("createUserBtn"),
  resetPassword: document.getElementById("resetPassword"),
  resetPassword2: document.getElementById("resetPassword2"),
  resetPasswordFooter: document.getElementById("usersResetPasswordModalFooter"),
  userResetMessage: document.getElementById("userResetMessage"),
  editName: document.getElementById("editName"),
  editUserName: document.getElementById("editUserName"),
  editGroup: document.getElementById("editGroup"),
  editUserFooter: document.getElementById("userEditModalFooter"),
  userEditMessage: document.getElementById("userEditMessage"),
  createName: document.getElementById("createName"),
  createUserName: document.getElementById("createUserName"),
  createGroup: document.getElementById("createGroup"),
  createPassword: document.getElementById("createPassword"),
  createPassword2: document.getElementById("createPassword2"),
  createUserFooter: document.getElementById("userCreateModalFooter"),
  userCreateMessage: document.getElementById("userCreateMessage"),
  userTableContent: document.getElementById("userTable"),
};

const localStorageKeys = {
  DASHBOARD_SETTINGS: "dashboardConfiguration",
};

const settingsElements = {
  timeout: {
    webSocketRetry: document.getElementById("webSocketRetry"),
    apiTimeout: document.getElementById("APITimeout"),
    apiRetryCutoff: document.getElementById("APIRetryTimeout"),
    apiRetry: document.getElementById("APIRetry"),
  },
  filament: {
    filamentCheck: document.getElementById("checkFilament"),
    hideEmpty: document.getElementById("hideEmpty"),
    downDateFailed: document.getElementById("downDateFailed"),
    downDateSuccess: document.getElementById("downDateSuccess"),
    allowMultiSelect: document.getElementById("allowMultiSelect"),
  },
  history: {
    snapshot: {
      onComplete: document.getElementById("snapOnComplete"),
      onFailure: document.getElementById("snapOnFailure"),
    },
    thumbnails: {
      onComplete: document.getElementById("thumbOnComplete"),
      onFailure: document.getElementById("thumbOnFailure"),
    },
    timelapse: {
      onComplete: document.getElementById("timelapseOnComplete"),
      onFailure: document.getElementById("timelapseOnFailure"),
      deleteAfter: document.getElementById("timelapseDelete"),
    },
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
      defaultRet: document.getElementById("infRetention"),
    },
  },
  monitoringViews: {
    panel: document.getElementById("monitoring-panel"),
    list: document.getElementById("monitoring-list"),
    camera: document.getElementById("monitoring-camera"),
    group: document.getElementById("monitoring-group"),
    currentOperations: document.getElementById("monitoring-currentOperations"),
    combined: document.getElementById("monitoring-combined"),
  },
  cameras: {
    aspectRatio: document.getElementById("cameraAspectRatio"),
    proxyEnabled: document.getElementById("cameraProxyActive"),
    updateInterval: document.getElementById("cameraUpdateInterval")
  }
};

function returnSaveBtn() {
  return `
    <button id="userActionSave" type="button" class="btn btn-success">Save</button>
  `;
}

export {
  serverDatabaseKeys,
  serverActionsElements,
  localStorageKeys,
  settingsElements,
  userActionElements,
  returnSaveBtn,
  filamentManagerPluginActionElements,
};
