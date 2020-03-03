const ClientSettingsDB = require("../models/ClientSettings.js");

class ClientSettings {
  static init() {
    ClientSettingsDB.find({}).then(settings => {
      if (settings.length < 1) {
        let settings = {
          backgroundURL: null
        };
        let panelView = {
          currentOp: false,
          hideOff: true,
          hideClosed: false
        };
        let listView = {
          currentOp: false,
          hideOff: true,
          hideClosed: false
        };
        let cameraView = {
          currentOp: false,
          cameraRows: 4,
          hideClosed: false
        };
        let operations = {};
        let filaManager = {};
        let defaultSystemSettings = new ClientSettingsDB({
          settings,
          panelView,
          listView,
          cameraView
        });
        defaultSystemSettings.save();
        return "Server settings have been created...";
      }
    });
    return "Client settings already exist, loaded existing values...";
  }
  static check() {
    return ClientSettingsDB.find({});
  }
  static update(obj) {
    ClientSettingsDB.find({}).then(checked => {});
  }
}

module.exports = {
  ClientSettings: ClientSettings
};
