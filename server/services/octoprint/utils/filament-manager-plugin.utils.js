const Logger = require("../../../handlers/logger.js");
const { LOGGER_ROUTE_KEYS } = require("../../../constants/logger.constants");
const logger = new Logger(LOGGER_ROUTE_KEYS.OP_UTIL_FILAMENT_MANAGER_PLUGIN);
const fetch = require("node-fetch");
const { findIndex } = require("lodash");
const Spool = require("../../../models/Filament.js");
const { getPrinterStoreCache } = require("../../../cache/printer-store.cache");
const Profile = require("../../../models/Profiles");
const { TaskManager } = require("../../task-manager.service");

const getOnlinePrinterList = async function () {
  const printerList = getPrinterStoreCache().listPrintersInformation();
  const onlinePrintersList = [];
  for (const printer of printerList) {
    if (printer?.printerState?.colour?.category !== "Offline" && !printer.disabled) {
      onlinePrintersList.push(printer);
    }
  }
  return onlinePrintersList;
};

const findFirstOnlinePrinter = function () {
  const printerList = getPrinterStoreCache().listPrintersInformation();
  let firstOnlinePrinter = null;
  for (const printer of printerList) {
    if (printer?.printerState?.colour?.category !== "Offline" && !printer.disabled) {
      firstOnlinePrinter = printer;
      break;
    }
  }
  return firstOnlinePrinter;
};

const checkIfFilamentManagerPluginExists = async function (printers) {
  const missingPlugin = [];

  for (const printer of printers) {
    let pluginList = await fetch(`${printer.printerURL}/api/plugin/pluginmanager`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      }
    });

    const responseJSON = await pluginList.json();
    const pluginIndex = findIndex(responseJSON.plugins, function (o) {
      return o.key === "filamentmanager";
    });
    if (pluginIndex === -1) {
      missingPlugin.push({ url: printer.printerURL });
    }
  }

  return missingPlugin;
};

const getFilamentManagerPluginSettings = async function (printer) {
  let settingsList = await fetch(`${printer.printerURL}/api/settings`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": printer.apikey
    }
  });
  const responseJSON = await settingsList.json();
  return responseJSON?.plugins["filamentmanager"];
};

const checkFilamentManagerPluginSettings = async function (printers) {
  const notSetupCorrectly = [];

  for (const printer of printers) {
    const pluginSettings = await getFilamentManagerPluginSettings(printer);
    if (!pluginSettings?.database?.useExternal) {
      notSetupCorrectly.push({ url: printer.printerURL });
    }
  }

  return notSetupCorrectly;
};

const checkIfSpoolAttachedToPrinter = function (spoolId) {
  const printerList = getPrinterStoreCache().listPrinters();
  const filteredList = printerList.filter((printer) => printer.selectedFilament.length > 0);
  let isSpoolAttached = false;
  for (const element of filteredList) {
    const doWeHaveSpoolIndex = element.selectedFilament.some((spool) => spool?._id === spoolId);
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

const checkIfDatabaseCanBeConnected = async function (printers) {
  const unconnectedDatabases = [];

  for (const printer of printers) {
    const pluginSettings = await getFilamentManagerPluginSettings(printer);
    if(!!pluginSettings){
      const { database } = pluginSettings;
      let databaseCheck = await fetch(`${printer.printerURL}/plugin/filamentmanager/database/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": printer.apikey
        },
        body: JSON.stringify({ config: database })
      });
      if (!databaseCheck.ok) {
        unconnectedDatabases.push({ url: printer.printerURL });
      }
    }

  }

  return unconnectedDatabases;
};

const assignSpoolToOctoPrint = async function (spoolId, printers) {
  let spool = null;
  if (!!spoolId && spoolId !== "0") {
    spool = await Spool.findById(spoolId);
  }

  if (!spoolId || !printers) {
    logger.error("Unable to assign spool on OctoPrint, missing data...", {
      spoolId,
      printers
    });
  }

  const printer = getPrinterStoreCache().getPrinterInformation(printers[0].printer);

  const selection = {
    tool: parseInt(printers[0].tool),
    spool: { id: parseInt(spool?.spools?.fmID ? spool.spools.fmID : null) }
  };

  logger.info("Updating OctoPrint with new spool selection", selection);

  const url = `${printer.printerURL}/plugin/filamentmanager/selections/${printers[0].tool}`;
  const updateFilamentManager = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": printer.apikey
    },
    body: JSON.stringify({ selection })
  });

  if (!updateFilamentManager.ok) {
    logger.error(
      "Unable to assign spool on OctoPrint, response errored!",
      updateFilamentManager.toString()
    );
  }
};

const filamentManagerReSync = async function () {
  const errors = [];

  let printer = findFirstOnlinePrinter();
  if (printer === null) {
    errors.push("Cannot find online printer to update records!");
    return errors;
  }
  const spools = await fetch(`${printer.printerURL}/plugin/filamentmanager/spools`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": printer.apikey
    }
  });
  const profiles = await fetch(`${printer.printerURL}/plugin/filamentmanager/profiles`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": printer.apikey
    }
  });

  // Make sure filament manager responds...
  if (spools.status !== 200 || profiles.status !== 200) {
    errors.push("Unable to contact printer for spools and profiles!");
    return errors;
  }

  const newSpools = [];
  const updatedSpools = [];
  const newProfiles = [];
  const updatedProfiles = [];

  const spoolsFM = await spools.json();
  const profilesFM = await profiles.json();

  const S = "Spool";
  const P = "Profile";

  for (const pr of profilesFM.profiles) {
    const profile = {
      index: pr.id,
      density: pr.density,
      diameter: pr.diameter,
      manufacturer: pr.vendor,
      material: pr.material
    };
    const oldProfile = await Profile.findOne({ "profile.index": pr.id });
    if (oldProfile !== null) {
      logger.info("Updating Profile: ", profile);
      oldProfile.profile = profile;
      oldProfile.markModified("profile");
      await oldProfile.save();
      updatedProfiles.push(P);
    } else {
      // New Profile
      logger.info("Saving New Profile: ", profile);
      const newProfile = await new Profile({ profile });
      await newProfile.save();
      newProfiles.push(P);
    }
  }

  for (const sp of spoolsFM.spools) {
    const spool = {
      name: sp.name,
      profile: sp.profile.id,
      price: parseFloat(sp.cost),
      weight: parseFloat(sp.weight),
      used: parseFloat(sp.used),
      tempOffset: parseInt(sp.temp_offset),
      bedOffset: 0,
      fmID: sp.id
    };
    const oldSpool = await Spool.findOne({ "spools.fmID": sp.id });
    const octofarmProfileId = await Profile.findOne({ "profile.index": sp.profile.id });
    if (oldSpool !== null) {
      logger.info("Updating Spool: ", spool);
      const bedOffset = oldSpool.spools.bedOffset;
      oldSpool.spools = spool;
      oldSpool.spools.bedOffset = bedOffset;
      oldSpool.spools.profile = octofarmProfileId._id;
      oldSpool.markModified("spools");
      await oldSpool.save();
      updatedSpools.push(S);
    } else {
      // New Spool
      logger.info("Saving New Spool: ", spool);
      const newSpool = await new Spool({ spools: spool });
      newSpool.spools.profile = octofarmProfileId._id;
      await newSpool.save();
      newSpools.push(S);
    }
  }

  await TaskManager.forceRunTask("FILAMENT_CLEAN_TASK");
  logger.info("Successfully synced filament manager with octofarm.");
  return {
    success: true,
    newSpools: newSpools.length,
    updatedSpools: updatedSpools.length,
    newProfiles: newProfiles.length,
    updatedProfiles: updatedProfiles.length,
    errors
  };
};

module.exports = {
  getOnlinePrinterList,
  findFirstOnlinePrinter,
  checkIfFilamentManagerPluginExists,
  checkFilamentManagerPluginSettings,
  checkIfSpoolAttachedToPrinter,
  checkIfProfileAttachedToSpool,
  checkIfDatabaseCanBeConnected,
  filamentManagerReSync,
  assignSpoolToOctoPrint
};
