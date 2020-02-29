const ClientSettingsDB = require("../models/ClientSettings.js");

class ClientSettings {
  static init() {
    ClientSettingsDB.find({}).then(settings => {
      if (settings.length < 1) {
      }
    });
    return "Dev: Setup client settings!";
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
