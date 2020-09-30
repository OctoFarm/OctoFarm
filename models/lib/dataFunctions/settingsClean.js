const ClientSettings = require("../../models/ClientSettings.js");
const ServerSettings = require("../../models/ServerSettings.js");

let systemClean = [];
let clientClean = [];

class SettingsClean {
  static async returnSystemSettings() {
    return systemClean;
  }

  static async returnClientSettings() {
    return clientClean;
  }

  static async start() {
    const clientSettings = await ClientSettings.find({});
    const serverSettings = await ServerSettings.find({});
    systemClean = serverSettings[0];
    clientClean = clientSettings[0];
  }
}

module.exports = {
  SettingsClean,
};
