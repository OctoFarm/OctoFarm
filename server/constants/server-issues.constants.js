const SERVER_ACTIONS = {
  ABORTING_BOOT: " Aborting boot... please check logs!"
};
module.exports = {
  SERVER_ISSUES: {
    DATABASE_AUTH_FAIL: "Database authentication failed..." + SERVER_ACTIONS.ABORTING_BOOT,
    DATABASE_CONN_FAIL: "Database connection failed..." + SERVER_ACTIONS.ABORTING_BOOT,
    SERVER_SETTINGS_FAIL_INIT:
      "Unable to create defaults for server settings..." + SERVER_ACTIONS.ABORTING_BOOT,
    SERVER_SETTINGS_FAIL_UPDATE:
      "Unable to update existing server settings..." + SERVER_ACTIONS.ABORTING_BOOT,
    CLIENT_SETTINGS_FAIL_INIT:
      "Unable to update existing server settings..." + SERVER_ACTIONS.ABORTING_BOOT,
    CLIENT_SETTINGS_FAIL_UPDATE:
      "Unable to update existing server settings..." + SERVER_ACTIONS.ABORTING_BOOT,
    REQUIRED_BOOT_TASKS_FAILED:
      "Unable to start server, some required boot tasks have failed... " +
      SERVER_ACTIONS.ABORTING_BOOT
  }
};
