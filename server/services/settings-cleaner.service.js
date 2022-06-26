"use strict";

const ClientSettingsDB = require("../models/ClientSettings.js");
const ServerSettingsDB = require("../models/ServerSettings.js");
const { findIndex } = require("lodash");
const { SERVER_ISSUES } = require("../constants/server-issues.constants");

let systemClean = [];
let clientClean = [];

class SettingsCleanerService {
  static isLogonRequired() {
    return systemClean.server.loginRequired;
  }

  static returnSystemSettings() {
    return systemClean;
  }

  static returnServerSettings() {
    return systemClean.server;
  }

  static returnTimeoutSettings() {
    return systemClean.timeout;
  }

  static returnFilamentManagerSettings() {
    return systemClean.filamentManager;
  }

  static isMultipleSelectEnabled() {
    return systemClean.filament.allowMultiSelect;
  }

  static isProxyCamerasEnabled() {
    return systemClean?.cameras?.proxyEnabled;
  }

  static returnCameraSettings() {
    return {
      updateInterval: systemClean.cameras.updateInterval,
      aspectRatio: systemClean.cameras.aspectRatio
    };
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
    const clientSettings = await ClientSettingsDB.find({});
    const serverSettings = await ServerSettingsDB.find({});
    systemClean = serverSettings[0];
    clientClean = clientSettings;
  }

  static async initialise() {
    await this.initialiseServerSettings();
    await this.initaliseClientSettings();
    await this.start();
  }

  static async initialiseServerSettings() {
    const serverSettings = await ServerSettingsDB.find({});
    if (serverSettings.length < 1) {
      // No settings... save default.
      const newSettingsDefaults = new ServerSettingsDB();
      await newSettingsDefaults.save().catch((e) => {
        throw new Error(SERVER_ISSUES.SERVER_SETTINGS_FAIL_INIT + e);
      });
    } else {
      // Make sure to update records with any new additions
      serverSettings[0].save().catch((e) => {
        throw new Error(SERVER_ISSUES.SERVER_SETTINGS_FAIL_UPDATE + e);
      });
    }
  }
  static async initaliseClientSettings() {
    const clientSettings = await ClientSettingsDB.find({});

    if (clientSettings.length < 1) {
      const newClientDefaults = new ClientSettingsDB();
      newClientDefaults.save().catch((e) => {
        throw new Error(SERVER_ISSUES.CLIENT_SETTINGS_FAIL_INIT + e);
      });
    } else {
      for (const existingSettings of clientSettings) {
        existingSettings.save().catch((e) => {
          throw new Error(SERVER_ISSUES.CLIENT_SETTINGS_FAIL_UPDATE + e);
        });
      }
    }
  }

  static async saveServerSettings(newSettings) {
    const serverSettings = await ServerSettingsDB.find({});
    serverSettings[0].server = { ...newSettings };
    await serverSettings[0].save();
    systemClean = serverSettings[0];
  }

  static async saveClientThemeSettings(newSettings) {
    const serverSettings = await ServerSettingsDB.find({});
    serverSettings[0].clientTheme = { ...newSettings };
    await serverSettings[0].save();
    systemClean = serverSettings[0];
  }
}

module.exports = {
  SettingsClean: SettingsCleanerService
};
