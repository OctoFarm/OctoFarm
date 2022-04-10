const fetch = require("node-fetch");
const { findIndex } = require("lodash");
const Spool = require("../../../models/Filament.js");
const { getPrinterStoreCache } = require("../../../cache/printer-store.cache");

const getOnlinePrinterList = async function () {
  const printerList = getPrinterStoreCache().listPrintersInformation();
  const onlinePrintersList = [];
  for (let i = 0; i < printerList.length; i++) {
    if (
      printerList[i].printerState.colour.category === "Disconnected" ||
      printerList[i].printerState.colour.category === "Idle" ||
      printerList[i].printerState.colour.category === "Active" ||
      printerList[i].printerState.colour.category === "Complete"
    ) {
      onlinePrintersList.push(printerList[i]);
    }
  }
  return onlinePrintersList;
};

const findFirstOnlinePrinter = async function () {
  const printerList = getPrinterStoreCache().listPrintersInformation();
  let firstOnlinePrinter = null;
  for (const printer of printerList) {
    if (
      printer.printerState.colour.category === "Disconnected" ||
      printer.printerState.colour.category === "Idle" ||
      printer.printerState.colour.category === "Active" ||
      printer.printerState.colour.category === "Complete"
    ) {
      firstOnlinePrinter = printer;
      break;
    }
  }
  return firstOnlinePrinter;
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

const checkIfSpoolAttachedToPrinter = function (spoolId) {
  const printerList = getPrinterStoreCache().listPrinters();
  const filteredList = printerList.filter((printer) => printer.selectedFilament.length > 0);
  let isSpoolAttached = false;
  for (let i = 0; i < filteredList.length; i++) {
    const doWeHaveSpoolIndex = filteredList[i].selectedFilament.some(
      (spool) => spool?._id == spoolId
    );
    if (doWeHaveSpoolIndex) {
      isSpoolAttached = true;
    }
  }
  return isSpoolAttached;
};

const checkIfProfileAttachedToSpool = async function (profileId) {
  const attachedSpools = await Spool.find({ "spools.profile": profileId });
  return attachedSpools.length > 0;
};

module.exports = {
  getOnlinePrinterList,
  findFirstOnlinePrinter,
  checkIfFilamentManagerPluginExists,
  checkFilamentManagerPluginSettings,
  checkIfSpoolAttachedToPrinter,
  checkIfProfileAttachedToSpool
};
