"use strict";

const ClientSettings = require("../../models/ClientSettings.js");
const ServerSettings = require("../../models/ServerSettings.js");
const { findIndex } = require("lodash");

let systemClean = [];
let clientClean = [];

class SettingsClean {
  static returnSystemSettings() {
    return systemClean;
  }

  static returnClientSettings(id) {
    if (!!id) {
      const settingsIndex = findIndex(clientClean, function (o) {
        return o._id.toString() === id.toString();
      });
      return clientClean[settingsIndex];
    } else {
      // No idea, fall back to the default client settings
      return clientClean[0];
    }
  }

  /**
   * Fetch the first client and server settings entries from database
   * @returns {Promise<void>}
   */
  static async start() {
    const clientSettings = await ClientSettings.find({});
    const serverSettings = await ServerSettings.find({});
    systemClean = serverSettings[0];
    clientClean = clientSettings;
  }
}

module.exports = {
  SettingsClean
};
