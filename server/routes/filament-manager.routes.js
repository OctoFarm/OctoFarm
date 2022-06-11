const express = require("express");

const router = express.Router();
const fetch = require("node-fetch");
const { ensureAuthenticated, ensureAdministrator } = require("../middleware/auth");
const Spool = require("../models/Filament.js");
const Profiles = require("../models/Profiles.js");
const ServerSettings = require("../models/ServerSettings.js");

const settingsClean = require("../services/settings-cleaner.service.js");

const { SettingsClean } = settingsClean;
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");

const Logger = require("../handlers/logger.js");

const logger = new Logger(LOGGER_ROUTE_KEYS.ROUTE_FILAMENT_MANAGER);

const filamentClean = require("../services/filament-cleaner.service.js");

const { FilamentClean } = filamentClean;

const {
  getOnlinePrinterList,
  checkFilamentManagerPluginSettings,
  checkIfFilamentManagerPluginExists,
  checkIfSpoolAttachedToPrinter,
  checkIfProfileAttachedToSpool,
  findFirstOnlinePrinter,
  checkIfDatabaseCanBeConnected,
  filamentManagerReSync,
  assignSpoolToOctoPrint
} = require("../services/octoprint/utils/filament-manager-plugin.utils");
const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const { TaskManager } = require("../services/task-manager.service");

router.get("/get/printerList", ensureAuthenticated, (_req, res) => {
  const printerList = FilamentClean.createPrinterList();
  res.send({ printerList });
});
router.get("/get/statistics", ensureAuthenticated, async (_req, res) => {
  const statistics = FilamentClean.getStatistics();
  res.send({
    statistics
  });
});
router.get("/get/profile", ensureAuthenticated, (_req, res) => {
  const profiles = FilamentClean.getProfiles();
  res.send({ profiles });
});
router.get("/get/filament", ensureAuthenticated, (_req, res) => {
  const spools = FilamentClean.getSpools();
  res.send({ spools });
});
router.get("/get/dropDownList", ensureAuthenticated, async (_req, res) => {
  res.send({ dropDownList: FilamentClean.getDropDown() });
});
router.post("/assign", ensureAuthenticated, async (req, res) => {
  logger.info("Request to change selected spool:", req.body.printers);
  const multiSelectEnabled = SettingsClean.isMultipleSelectEnabled();

  const filamentManager = SettingsClean.returnFilamentManagerSettings();
  if(filamentManager){
    await assignSpoolToOctoPrint(req.bodyString("spoolId"), req.body.printers);
  }

  await getPrinterStoreCache().assignSpoolToPrinters(
    req.body.printers,
    req.bodyString("spoolId"),
    multiSelectEnabled
  );
  TaskManager.forceRunTask("FILAMENT_CLEAN_TASK");
  res.send({ status: 200 });
});

router.post("/save/filament", ensureAuthenticated, async (req, res) => {
  const filamentManager = SettingsClean.returnFilamentManagerSettings();
  const filament = req.body;
  const errors = [];
  logger.info("Saving Filament Manager Spool: ", filament);
  if (filamentManager) {
    let printer = findFirstOnlinePrinter();
    if (!printer && !printer?.printerURL) {
      errors.push("Unable to update Filament Manager Plugin... No online printer!");
      return res.send({ errors });
    }
    const dataProfile = await Profiles.findById(filament.spoolsProfile);
    if (!dataProfile) {
      errors.push("Couldn't find matching profile! Please Resync your spools...");
      return res.send({ errors });
    }

    const profile = {
      vendor: dataProfile.profile.manufacturer,
      material: dataProfile.profile.material,
      density: dataProfile.profile.density,
      diameter: dataProfile.profile.diameter,
      id: dataProfile.profile.index
    };

    const spool = {
      name: filament.spoolsName,
      profile,
      cost: parseFloat(filament.spoolsPrice),
      weight: parseFloat(filament.spoolsWeight),
      used: parseFloat(filament.spoolsUsed),
      temp_offset: parseFloat(filament.spoolsTempOffset)
    };
    logger.info("Updating OctoPrint: ", spool);
    // REFACTOR move to octoprint service
    const url = `${printer.printerURL}/plugin/filamentmanager/spools`;
    let updateFilamentManager = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      },
      body: JSON.stringify({ spool })
    });
    if (!updateFilamentManager.ok) {
      errors.push("Unable to create ");
    }
    await filamentManagerReSync();
    return res.send({ errors });
  } else {
    const toSaveSpool = {
      name: filament.spoolsName,
      profile: filament.spoolsProfile,
      price: parseFloat(filament.spoolsPrice),
      weight: parseFloat(filament.spoolsWeight),
      used: parseFloat(filament.spoolsUsed),
      tempOffset: parseInt(filament.spoolsTempOffset),
      bedOffset: parseInt(filament.spoolsBedOffset),
      fmID: null
    };
    if (errors.length === 0) {
      const dataFilament = new Spool({
        spools: toSaveSpool
      });
      dataFilament
        .save()
        .catch((e) => {
          errors.push("Couldn't save spool to OctoFarms database! Please check the logs...");
          logger.error("Couldn't save spool to OctoFarms database", e);
        })
        .finally(async () => {
          logger.info("New Spool saved successfully: ", dataFilament);
          TaskManager.forceRunTask("FILAMENT_CLEAN_TASK");
          res.send({ errors, dataFilament });
        });
    } else {
      return res.send({ errors });
    }
  }
});
router.post("/delete/filament", ensureAuthenticated, async (req, res) => {
  const filamentManager = SettingsClean.returnFilamentManagerSettings();
  const errors = [];
  let searchId = req.bodyString("id");
  logger.info("Deleting Filament Manager Spool: ", searchId);

  const isSpoolAttached = checkIfSpoolAttachedToPrinter(searchId);
  if (isSpoolAttached) {
    errors.push("Your spool is attached to a printer, your need to de-attach the spool first!");
    return res.send({ errors });
  }

  if (filamentManager) {
    let printer = findFirstOnlinePrinter();
    if (!printer && !printer?.printerURL) {
      errors.push("Unable to update Filament Manager Plugin... No online printer!");
      return res.send({ errors });
    }
    searchId = await Spool.findById(searchId);
    logger.info("Updating Octoprint to remove: ", searchId);
    const url = `${printer.printerURL}/plugin/filamentmanager/spools/${searchId.spools.fmID}`;
    const deletedSpool = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      }
    });
    if (!deletedSpool.ok) {
      errors.push("Unable to update client with deletion! Try Resyncing...");
      return res.send({ errors });
    }
  }
  await Spool.deleteOne({ _id: searchId })
    .catch((e) => {
      logger.error("Unable to delete spool... please resync!", e);
      errors.push("Unable to delete spool... please resync!");
    })
    .finally(() => {
      logger.info("Spool deleted successfully");
      TaskManager.forceRunTask("FILAMENT_CLEAN_TASK");
      return res.send({ errors });
    });
});
router.post("/edit/filament", ensureAuthenticated, async (req, res) => {
  const filamentManager = await SettingsClean.returnFilamentManagerSettings();
  const searchId = req.bodyString("id");
  const errors = [];
  const newContent = req.body.spool;
  const oldSpoolData = await Spool.findById(searchId);

  logger.info("New details: ", req.body.spool);
  if (filamentManager) {
    let printer = findFirstOnlinePrinter();
    if (!printer && !printer?.printerURL) {
      errors.push("Unable to update Filament Manager Plugin... No online printer!");
      return res.send({ errors });
    }

    const dataProfile = await Profiles.findById(oldSpoolData.spools.profile);
    if (!dataProfile) {
      errors.push("Couldn't find matching profile! Please Resync your spools...");
      return res.send({ errors });
    }

    const profile = {
      vendor: dataProfile.profile.manufacturer,
      material: dataProfile.profile.material,
      density: parseFloat(dataProfile.profile.density),
      diameter: parseFloat(dataProfile.profile.diameter),
      id: dataProfile.profile.index
    };

    const newSpool = {
      name: newContent[0],
      profile,
      cost: parseFloat(newContent[1]),
      weight: parseFloat(newContent[2]),
      used: parseFloat(newContent[3]),
      temp_offset: parseFloat(newContent[4])
    };
    logger.info("Updating OctoPrint: ", newSpool);
    const url = `${printer.printerURL}/plugin/filamentmanager/spools/${oldSpoolData.spools.fmID}`;
    const updateFilamentManager = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      },
      body: JSON.stringify({ spool: newSpool })
    });
    if (!updateFilamentManager.ok) {
      errors.push("Unable to create profile on Plugin... skipping spool creation!");
      return res.send({ errors });
    }
  }

  oldSpoolData.spools.name = newContent[0];
  oldSpoolData.spools.profile = newContent[6];
  oldSpoolData.spools.price = parseFloat(newContent[1]);
  oldSpoolData.spools.weight = parseFloat(newContent[2]);
  oldSpoolData.spools.used = parseFloat(newContent[3]);
  oldSpoolData.spools.tempOffset = parseInt(newContent[4]);
  oldSpoolData.spools.bedOffset = parseInt(newContent[5]);

  oldSpoolData.markModified("spools");

  await oldSpoolData
    .save()
    .catch((e) => {
      errors.push("Couldn't save to OctoFarms database!");
      logger.error(e);
    })
    .finally(() => {
      logger.info("Updated spool saved to database, running filament cleaner");
      TaskManager.forceRunTask("FILAMENT_CLEAN_TASK");
      return res.send({ errors });
    });
});

router.post("/save/profile", ensureAuthenticated, async (req, res) => {
  const filamentManager = SettingsClean.returnFilamentManagerSettings();
  const newProfile = req.body;
  const errors = [];
  logger.info("Saving Filament Manager Profile: ", newProfile);
  if (filamentManager) {
    let printer = findFirstOnlinePrinter();
    if (!printer && !printer?.printerURL) {
      errors.push("Unable to update Filament Manager Plugin... No online printer!");
    }

    const profile = {
      index: null,
      vendor: newProfile.manufacturer,
      material: newProfile.material,
      density: parseFloat(newProfile.density),
      diameter: parseFloat(newProfile.diameter)
    };
    logger.info("Updating OctoPrint: ", profile);

    const updateFilamentManager = await fetch(
      `${printer.printerURL}/plugin/filamentmanager/profiles`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": printer.apikey
        },
        body: JSON.stringify({ profile })
      }
    );

    if (!updateFilamentManager.ok) {
      errors.push("Unable to create profile on Plugin... skipping spool creation!");
      return res.send({ errors });
    }

    await filamentManagerReSync();
    return res.send({ errors });
  } else {
    const toSaveProfile = {
      index: null,
      manufacturer: newProfile.manufacturer,
      material: newProfile.material,
      density: parseFloat(newProfile.density),
      diameter: parseFloat(newProfile.diameter)
    };

    const dataProfile = new Profiles({ profile: toSaveProfile });
    await dataProfile
      .save()
      .catch((e) => {
        errors.push("Couldn't save to OctoFarms database! Please check the logs...");
        logger.error("Couldn't save profile to OctoFarms database", e);
      })
      .finally(async () => {
        logger.info("New profile saved to database, running filament cleaner");
        TaskManager.forceRunTask("FILAMENT_CLEAN_TASK");
        return res.send({ errors });
      });
  }
});
router.post("/edit/profile", ensureAuthenticated, async (req, res) => {
  const filamentManager = SettingsClean.returnFilamentManagerSettings();
  let searchId = req.bodyString("id");
  const newContent = req.body.profile;
  const errors = [];

  const oldProfileData = await Profiles.findById(searchId);

  logger.info("Profile Edit Request: ", newContent);
  if (filamentManager) {
    let printer = findFirstOnlinePrinter();
    if (!printer && !printer?.printerURL) {
      errors.push("Unable to update Filament Manager Plugin... No online printer!");
      return res.send({ errors });
    }

    const newProfile = {
      vendor: newContent[0],
      material: newContent[1],
      density: parseFloat(newContent[2]),
      diameter: parseFloat(newContent[3])
    };
    logger.info("Updating OctoPrint: ", newProfile);
    const url = `${printer.printerURL}/plugin/filamentmanager/profiles/${oldProfileData.profile.index}`;
    let updateFilamentManager = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      },
      body: JSON.stringify({ profile: newProfile })
    });

    if (!updateFilamentManager.ok) {
      errors.push("Unable to create profile on Plugin... skipping spool creation!");
      return res.send({ errors });
    }
  }

  oldProfileData.profile.manufacturer = newContent[0];
  oldProfileData.profile.material = newContent[1];
  oldProfileData.profile.density = parseFloat(newContent[2]);
  oldProfileData.profile.diameter = parseFloat(newContent[3]);
  oldProfileData.markModified("profile");
  await oldProfileData
    .save()
    .catch((e) => {
      errors.push("Couldn't save to OctoFarms database!");
      logger.error(e);
    })
    .finally(() => {
      logger.info("Updated profile saved to database, running filament cleaner");
      TaskManager.forceRunTask("FILAMENT_CLEAN_TASK");
      return res.send({ errors });
    });
});
router.post("/delete/profile", ensureAuthenticated, async (req, res) => {
  const filamentManager = SettingsClean.returnFilamentManagerSettings();
  const searchId = req.bodyString("id");

  const errors = [];

  logger.info("Profile Delete Request: ", searchId);

  const isProfileAttached = await checkIfProfileAttachedToSpool(searchId);

  if (isProfileAttached) {
    errors.push("Your profile is attached to a spool! You need to delete the spool(s) first...");
    return res.send({ errors });
  }

  if (filamentManager) {
    let printer = findFirstOnlinePrinter();
    if (!printer && !printer?.printerURL) {
      errors.push("Unable to update Filament Manager Plugin... No online printer!");
      return res.send({ errors });
    }
    const oldProfileData = await Profiles.findById(searchId);
    logger.info("Updating OctoPrint: ", searchId);
    // REFACTOR move to api service
    const url = `${printer.printerURL}/plugin/filamentmanager/profiles/${oldProfileData.profile.index}`;
    const deleteProfile = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      }
    });
    if (!deleteProfile.ok) {
      errors.push("Unable to update client with deletion! Try Resyncing...");
      return res.send({ errors });
    }
  }
  await Profiles.deleteOne({ _id: searchId })
    .catch((e) => {
      logger.error("Unable to delete profile... please resync!", e);
      errors.push("Unable to delete profile... please resync!");
    })
    .finally(() => {
      logger.info("Profile deleted successfully");
      TaskManager.forceRunTask("FILAMENT_CLEAN_TASK");
      return res.send({ errors });
    });
});

router.post(
  "/filamentManagerReSync",
  ensureAuthenticated,
  ensureAdministrator,
  async (_req, res) => {
    // Find first online printer...
    logger.info("Re-Syncing filament manager database");
    const reSync = await filamentManagerReSync();
    // Return success
    res.send(reSync);
  }
);

router.post("/filamentManagerSync", ensureAuthenticated, ensureAdministrator, async (_req, res) => {
  const errors = [];
  const warnings = [];

  const printerList = getPrinterStoreCache().listPrintersInformation();
  const onlinePrinterList = await getOnlinePrinterList();

  if (onlinePrinterList.length !== printerList.length) {
    warnings.push({
      msg: `Can only check ${onlinePrinterList.length} of ${printerList.length} instances... If those instances don't have Filament Manager installed with the database, you could run into issues!`
    });
  }

  const filamentManagerPluginCheck = await checkIfFilamentManagerPluginExists(onlinePrinterList);
  if (filamentManagerPluginCheck.length > 0) {
    let message =
      "These instances don't seem to have the plugin manager installed... Cannot continue!";
    filamentManagerPluginCheck.forEach((printer) => {
      message += `<br> ${printer.url}`;
    });
    errors.push({ msg: message });
  }
  // Bail out early here... can't continue!
  if (errors.length > 0) {
    return res.send({ errors, warnings });
  }

  const filamentManagerSettingsCheck = await checkFilamentManagerPluginSettings(onlinePrinterList);
  if (filamentManagerSettingsCheck.length > 0) {
    let message = "These instances do not have the database enabled in settings!";
    filamentManagerSettingsCheck.forEach((printer) => {
      message += `<br> ${printer.url}`;
    });
    errors.push({ msg: message });
  }

  const filamentManagerDatabaseCheck = await checkIfDatabaseCanBeConnected(onlinePrinterList);
  if (filamentManagerDatabaseCheck.length > 0) {
    let message = "These instances were unable to contact the database with the supplied settings!";
    filamentManagerDatabaseCheck.forEach((printer) => {
      message += `<br> ${printer.url}`;
    });
    errors.push({ msg: message });
  }
  // Bail out early here... can't continue!
  if (errors.length > 0) {
    return res.send({ errors, warnings });
  }

  const systemSettings = SettingsClean.returnSystemSettings();

  if (systemSettings.filament.allowMultiSelect === false) {
    const spoolList = FilamentClean.getSpools();
    spoolList.forEach((spool) => {
      getPrinterStoreCache().deattachSpoolFromAllPrinters(`${spool._id}`);
    });
    TaskManager.forceRunTask("FILAMENT_CLEAN_TASK");
  }

  await Spool.deleteMany({});
  await Profiles.deleteMany({});

  const { newSpools, newProfiles, errors: SyncErrors } = await filamentManagerReSync();

  if (SyncErrors.length > 0) {
    SyncErrors.forEach((e) => {
      errors.push(e);
    });
  }

  if (errors.length > 0) {
    return res.send({ errors });
  }

  const serverSettings = await ServerSettings.find({});
  serverSettings[0].filamentManager = true;
  serverSettings[0].filament.filamentCheck = true;
  serverSettings[0].filament.allowMultiSelect = false;
  await FilamentClean.start(serverSettings[0].filamentManager);
  serverSettings[0].markModified("filamentManager");
  serverSettings[0].markModified("filament.filamentCheck");
  serverSettings[0].markModified("filament.allowMultiSelect");
  serverSettings[0].save();
  await SettingsClean.start();

  // Return success
  return res.send({
    errors,
    warnings,
    spoolCount: newSpools,
    profileCount: newProfiles
  });
});
router.post("/disableFilamentPlugin", ensureAuthenticated, async (_req, res) => {
  logger.info("Request to disabled filament manager plugin");
  await Spool.deleteMany({}).then(() => {
    logger.info("Spools deleted");
  });

  await Profiles.deleteMany({}).then(() => {
    logger.info("Profiles deleted");
  });

  const serverSettings = await ServerSettings.find({});

  serverSettings[0].filamentManager = false;
  await FilamentClean.start(serverSettings[0].filamentManager);
  serverSettings[0].markModified("filamentManager");
  serverSettings[0].save();
  await SettingsClean.start();
  logger.info("Successfully disabled filament manager");
  // Return success
  res.send({ status: true });
});

module.exports = router;
