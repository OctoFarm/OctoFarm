const fetch = require("node-fetch");
const { findIndex } = require("lodash");
const runner = require("../runners/state.js");
const { Runner } = runner;

const getOnlinePrinterList = async function () {
  const printerList = Runner.returnFarmPrinters();
  const onlinePrintersList = [];
  for (let i = 0; i < printerList.length; i++) {
    if (
      printerList[i].stateColour.category === "Disconnected" ||
      printerList[i].stateColour.category === "Idle" ||
      printerList[i].stateColour.category === "Active" ||
      printerList[i].stateColour.category === "Complete"
    ) {
      onlinePrintersList.push(printerList[i]);
    }
  }
  return onlinePrintersList;
};

const checkIfFilamentManagerPluginExists = async function (printers) {
  const missingPlugin = [];

  for (let i = 0; i < printers.length; i++) {
    let pluginList = await fetch(`${printers[i].printerURL}/plugin/pluginmanager/plugins`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printers[i].apikey
      }
    });
    const responseJSON = await pluginList.json();
    const pluginIndex = findIndex(responseJSON.plugins, function (o) {
      return o.key == "filamentmanager";
    });
    if (pluginIndex === -1) {
      missingPlugin.push({ url: printers[i].printerURL });
    }
  }

  return missingPlugin;
};

const checkFilamentManagerPluginSettings = async function (printers) {
  const notSetupCorrectly = [];

  for (let i = 0; i < printers.length; i++) {
    let settingsList = await fetch(`${printers[i].printerURL}/api/settings`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printers[i].apikey
      }
    });
    const responseJSON = await settingsList.json();
    const pluginSettings = responseJSON?.plugins["filamentmanager"];
    if (pluginSettings && !pluginSettings?.database?.useExternal) {
      notSetupCorrectly.push({ url: printers[i].printerURL });
    }
  }

  return notSetupCorrectly;
};

module.exports = {
  getOnlinePrinterList,
  checkIfFilamentManagerPluginExists,
  checkFilamentManagerPluginSettings
};
