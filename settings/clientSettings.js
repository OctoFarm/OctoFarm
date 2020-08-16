const ClientSettingsDB = require("../models/ClientSettings.js");
const settingsClean = require("../lib/dataFunctions/settingsClean.js");

const { SettingsClean } = settingsClean;

class ClientSettings {
  static init() {
    ClientSettingsDB.find({})
      .then((settings) => {
        if (settings.length < 1) {
          const settings = {
            backgroundURL: null,
          };
          // const currentOperationsView = {};
          // const dashboard = {
          //   currentOp: false,
          // };
          const panelView = {
            currentOp: false,
            hideOff: true,
            hideClosed: false,
            extraInfo: false,
            powerBtn: false,
            webBtn: false,
          };
          const listView = {
            currentOp: false,
            hideOff: true,
            hideClosed: false,
            extraInfo: false,
            powerBtn: false,
            webBtn: false,
          };
          const cameraView = {
            currentOp: false,
            cameraRows: 4,
            hideClosed: false,
            extraInfo: false,
            powerBtn: false,
            webBtn: false,
          };
          // const operations = {};
          // const filaManager = {};
          const defaultSystemSettings = new ClientSettingsDB({
            settings,
            panelView,
            listView,
            cameraView,
          });
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
  ClientSettings,
};
