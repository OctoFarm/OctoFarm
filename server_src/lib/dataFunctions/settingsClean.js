"use strict";

const ClientSettings = require("../../models/ClientSettings.js");
const ServerSettings = require("../../models/ServerSettings.js");

let systemClean = [];
let clientClean = [];

class SettingsClean {
  static returnSystemSettings() {
    return systemClean;
  }

  static returnClientSettings() {
    return clientClean;
  }

  /**
   * Fetch the first client and server settings entries from database
   * @returns {Promise<void>}
   */
  static async start() {
    const clientSettings = await ClientSettings.find({});
    const serverSettings = await ServerSettings.find({});
    systemClean = serverSettings[0];
    clientClean = clientSettings[0];
  }
}

module.exports = {
  SettingsClean
};
