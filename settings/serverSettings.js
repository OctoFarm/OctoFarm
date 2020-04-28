const ServerSettingsDB = require("../models/ServerSettings.js");

class ServerSettings {
  static init() {
    ServerSettingsDB.find({}).then(settings => {
      //Default Settings
      let onlinePolling = {
        seconds: 0.5
      };
      let server = {
        port: 4000,
        registration: true,
        loginRequired: true
      };
      let timeout = {
        webSocketRetry: 5000,
        apiTimeout: 1000,
        apiRetryCutoff: 10000,
        apiRetry: 300000
      }
      if (settings.length < 1) {
        let defaultSystemSettings = new ServerSettingsDB({
          onlinePolling,
          server,
          timeout
        });
        defaultSystemSettings.save();
        return "Server settings have been created...";
      }else{
        //Server settings exist, but need updating with new ones if they don't exists.
        if(typeof settings[0].timeout === 'undefined'){
          settings[0].timeout = timeout;
        }
        if(typeof settings[0].server === 'undefined'){
          settings[0].server = server;
        }
        settings[0].save();
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
