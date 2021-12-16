const ClientSettingsDB = require("../models/ClientSettings.js");
const settingsClean = require("../lib/dataFunctions/settingsClean.js");

const { SettingsClean } = settingsClean;

class ClientSettings {
  static init() {
    ClientSettingsDB.find({})
      .then((settings) => {
        if (settings.length < 1) {
          // Make sure fallback client settings exist
          const defaultSystemSettings = new ClientSettingsDB();
          defaultSystemSettings.save();
          return "Server settings have been created...";
        }
      })
      .then((ret) => {
        SettingsClean.start();
      });
    return "Client settings already exist, loaded existing values...";
  }

  static check() {
    return ClientSettingsDB.find({});
  }

  static update(obj) {
    ClientSettingsDB.find({}).then((checked) => {
      SettingsClean.start();
    });
  }
}

module.exports = {
  ClientSettings
};
