const serverDatabaseKeys = {
  ALL: "Everything",
  ALERTS: "Alerts",
  CLIENT: "ClientSettings",
  CUSTOM_GCODE: "CustomGcode",
  ERROR_LOG: "ErrorLog",
  FARM_STATISTICS: "FarmStatistics",
  FILAMENT: "Filament",
  HISTORY: "History",
  PRINTERS: "Printers",
  PROFILES: "Profiles",
  ROOMDATA: "RoomData",
  SERVER: "ServerSettings",
  TEMP_HISTORY: "TempHistory",
  USERS: "User"
};

const databaseNamesList = Object.keys(serverDatabaseKeys).map(function (key) {
  return serverDatabaseKeys[key] + "DB";
});

module.exports = {
  serverDatabaseKeys,
  databaseNamesList
};
