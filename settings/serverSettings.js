const ServerSettingsDB = require("../models/ServerSettings.js");

class ServerSettings {
  static init() {
    ServerSettingsDB.find({}).then(settings => {
      if (settings.length < 1) {
        let onlinePolling = {
          seconds: 0.5
        };
        let offlinePolling = {
          on: true,
          seconds: 300000
        };
        let defaultSystemSettings = new ServerSettingsDB({
          onlinePolling,
          offlinePolling
        });
        defaultSystemSettings.save();
        return "Server settings have been created...";
      }
    });
    return "Server settings already exist, loaded existing values...";
  }
  static check() {
    return ServerSettingsDB.find({});
  }
  static update(obj) {
    ServerSettingsDB.find({}).then(checked => {
      checked[0] = obj;
      checked[0].save;
    });
  }
}

module.exports = {
  ServerSettings: ServerSettings
};
