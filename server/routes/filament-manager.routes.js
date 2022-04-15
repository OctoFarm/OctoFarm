const express = require("express");

const router = express.Router();
const fetch = require("node-fetch");
const _ = require("lodash");
const { ensureAuthenticated, ensureAdministrator } = require("../middleware/auth");
const Spool = require("../models/Filament.js");
const Profiles = require("../models/Profiles.js");
const ServerSettings = require("../models/ServerSettings.js");

const settingsClean = require("../services/settings-cleaner.service.js");

const { SettingsClean } = settingsClean;

const Logger = require("../handlers/logger.js");

const logger = new Logger("OctoFarm-FilamentManager");

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
  filamentManagerReSync
} = require("../services/octoprint/utils/filament-manager-plugin.utils");
const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const { TaskManager } = require("../services/task-manager.service");

router.get("/get/printerList", ensureAuthenticated, (req, res) => {
  const printerList = FilamentClean.returnFilamentList();
  res.send({ printerList });
});
router.get("/get/statistics", ensureAuthenticated, async (req, res) => {
  const statistics = FilamentClean.getStatistics();
  const spools = FilamentClean.getSpools();
  const profiles = FilamentClean.getProfiles();
  res.send({
    statistics,
    spools,
    profiles
  });
});
router.get("/get/profile", ensureAuthenticated, (req, res) => {
  const profiles = FilamentClean.getProfiles();
  res.send({ profiles });
});
router.get("/get/filament", ensureAuthenticated, (req, res) => {
  const spools = FilamentClean.getSpools();
  res.send({ Spool: spools });
});
router.get("/get/dropDownList", ensureAuthenticated, async (req, res) => {
  const selected = FilamentClean.getDropDown();
  res.send({ status: 200, selected });
});
router.post("/assign", ensureAuthenticated, async (req, res) => {
  logger.info("Request to change selected spool:", req.body.printers);

  await getPrinterStoreCache().assignSpoolToPrinters(
    req.bodyString("printers"),
    req.bodyString("spoolId")
  );
  TaskManager.forceRunTask("FILAMENT_CLEAN_TASK");
  res.send({ status: 200 });
});

router.post("/save/filament", ensureAuthenticated, async (req, res) => {
  const filamentManager = SettingsClean.returnFilamentManagerSettings();

  const filament = req.body;
  logger.info("Saving Filament Manager Spool: ", filament);
  const filamentManagerID = null;
  console.log(filamentManager);
  if (filamentManager) {
    const printerList = getPrinterStoreCache().listPrintersInformation();
    let printer = null;

    for (let newPrinter of printerList) {
      if (
        newPrinter.stateColour.category === "Disconnected" ||
        newPrinter.stateColour.category === "Idle" ||
        newPrinter.stateColour.category === "Active" ||
        newPrinter.stateColour.category === "Complete"
      ) {
        printer = newPrinter;
        break;
      }
    }
    const profiles = await Profiles.find({});
    const findID = _.findIndex(profiles, function (o) {
      return o.profile.index == filament.spoolsProfile;
    });

    const profile = {
      vendor: profiles[findID].profile.manufacturer,
      material: profiles[findID].profile.material,
      density: profiles[findID].profile.density,
      diameter: profiles[findID].profile.diameter,
      id: profiles[findID].profile.index
    };
    const spool = {
      name: filament.spoolsName,
      profile,
      cost: filament.spoolsPrice,
      weight: filament.spoolsWeight,
      used: filament.spoolsUsed,
      temp_offset: filament.spoolsTempOffset
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
    await updateFilamentManager.json();
    const reSync = await filamentManagerReSync("AddSpool");
    res.send({ res: "success", spools: reSync.newSpools, filamentManager });
  } else {
    const spools = {
      name: filament.spoolsName,
      profile: filament.spoolsProfile,
      price: filament.spoolsPrice,
      weight: filament.spoolsWeight,
      used: filament.spoolsUsed,
      tempOffset: filament.spoolsTempOffset,
      bedOffset: filament.spoolsBedOffset,
      fmID: filamentManagerID
    };
    const newFilament = new Spool({
      spools
    });
    newFilament.save().then(async (e) => {
      logger.info("New Spool saved successfully: ", newFilament);
      await filamentManagerReSync();
      TaskManager.forceRunTask("FILAMENT_CLEAN_TASK");
      res.send({ res: "success", spools: newFilament, filamentManager });
    });
  }
});
router.post("/delete/filament", ensureAuthenticated, async (req, res) => {
  const serverSettings = SettingsClean.returnSystemSettings();
  const { filamentManager } = serverSettings;

  let searchId = req.bodyString("id");
  logger.info("Deleting Filament Manager Profile: ", searchId);

  const isSpoolAttached = checkIfSpoolAttachedToPrinter(searchId);

  if (isSpoolAttached) return res.send({ spool: false });

  if (filamentManager) {
    let printer = null;
    for (let newPrinter of printerList) {
      if (
        newPrinter.stateColour.category === "Disconnected" ||
        newPrinter.stateColour.category === "Idle" ||
        newPrinter.stateColour.category === "Active" ||
        newPrinter.stateColour.category === "Complete"
      ) {
        printer = newPrinter;
        break;
      }
    }
    searchId = await Spool.findById(searchId);
    logger.info("Updating Octoprint to remove: ", searchId);
    const url = `${printer.printerURL}/plugin/filamentmanager/spools/${searchId.spools.fmID}`;
    await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      }
    });

    const rel = await Spool.deleteOne({ _id: searchId }).exec();
    logger.info("Successfully deleted: ", searchId);
    rel.status = 200;
    Spool.find({}).then((spools) => {
      TaskManager.forceRunTask("FILAMENT_CLEAN_TASK");
      res.send({ spool: spools });
    });
  } else {
    const rel = await Spool.deleteOne({ _id: searchId }).exec();
    logger.info("Successfully deleted: ", searchId);
    rel.status = 200;
    Spool.find({}).then((spools) => {
      TaskManager.forceRunTask("FILAMENT_CLEAN_TASK");
      res.send({ spool: spools });
    });
  }
});
router.post("/edit/filament", ensureAuthenticated, async (req, res) => {
  const filamentManager = await SettingsClean.returnFilamentManagerSettings();
  const searchId = req.bodyString("id");
  logger.info("Request to update spool id: ", searchId);
  logger.info("New details: ", req.body.spool);
  const newContent = req.body.spool;
  const spools = await Spool.findById(searchId);
  if (filamentManager) {
    const printerList = getPrinterStoreCache().listPrintersInformation();
    let printer = null;
    for (let newPrinter of printerList) {
      if (
        newPrinter.stateColour.category === "Disconnected" ||
        newPrinter.stateColour.category === "Idle" ||
        newPrinter.stateColour.category === "Active" ||
        newPrinter.stateColour.category === "Complete"
      ) {
        printer = newPrinter;
        break;
      }
    }
    const filamentManagerID = newContent[5];
    const profiles = await Profiles.find({});
    const findID = _.findIndex(profiles, function (o) {
      return o.profile.index == filamentManagerID;
    });

    const profile = {
      vendor: profiles[findID].profile.manufacturer,
      material: profiles[findID].profile.material,
      density: profiles[findID].profile.density,
      diameter: profiles[findID].profile.diameter,
      id: profiles[findID].profile.index
    };
    const spool = {
      name: newContent[0],
      profile,
      cost: newContent[1],
      weight: newContent[2],
      used: newContent[3],
      temp_offset: newContent[4]
    };
    logger.info("Updating OctoPrint: ", spool);
    const url = `${printer.printerURL}/plugin/filamentmanager/spools/${spools.spools.fmID}`;
    await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      },
      body: JSON.stringify({ spool })
    });
  }
  if (spools.spools.name != newContent[0]) {
    spools.spools.name = newContent[0];
    spools.markModified("spools");
  }
  if (spools.spools.profile != newContent[6]) {
    spools.spools.profile = newContent[6];
    spools.markModified("spools");
  }
  if (spools.spools.price != newContent[1]) {
    spools.spools.price = newContent[1];
    spools.markModified("spools");
  }
  if (spools.spools.weight != newContent[2]) {
    spools.spools.weight = newContent[2];
    spools.markModified("spools");
  }
  if (spools.spools.used != newContent[3]) {
    spools.spools.used = newContent[3];
    spools.markModified("spools");
  }
  if (spools.spools.tempOffset != newContent[4]) {
    spools.spools.tempOffset = newContent[4];
    spools.markModified("spools");
  }
  if (spools.spools.bedOffset != newContent[5]) {
    spools.spools.bedOffset = newContent[5];
    spools.markModified("spools");
  }
  await spools.save();

  Spool.find({}).then((newSpool) => {
    logger.info("New spool details saved: ", req.body.spool);
    TaskManager.forceRunTask("FILAMENT_CLEAN_TASK");

    res.send({ newSpool });
  });
});

router.post("/save/profile", ensureAuthenticated, async (req, res) => {
  const serverSettings = SettingsClean.returnSystemSettings();
  const { filamentManager } = serverSettings;
  const newProfile = req.body;
  const errors = [];
  logger.info("Saving Filament Manager Profile: ", newProfile);
  let toSaveProfile;

  if (filamentManager) {
    let printer = findFirstOnlinePrinter();
    if (!printer && !printer?.printerURL) {
      errors.push("Unable to update Filament Manager Plugin... No online printer!");
    }

    const profile = {
      vendor: newProfile.manufacturer,
      material: newProfile.material,
      density: newProfile.density,
      diameter: newProfile.diameter
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
      errors.push("Unable to create spool on Plugin... skipping spool creation!");
    } else {
      await filamentManagerReSync();
      res.send({ errors });
      // Nob head plugin developers... no need for this expensive call just to add a profile!
      // Time to hack that plugin apart and write it with OctoFarm in mind.
      // const JSONData = await updateFilamentManager.json();
      // toSaveProfile = {
      //   index: profilesLength.length + 1,
      //   manufacturer: JSONData.profile.vendor,
      //   material: JSONData.profile.material,
      //   density: JSONData.profile.density,
      //   diameter: JSONData.profile.diameter
      // };
    }
  } else {
    toSaveProfile = {
      index: null,
      manufacturer: newProfile.manufacturer,
      material: newProfile.material,
      density: newProfile.density,
      diameter: newProfile.diameter
    };
  }

  if (errors.length === 0) {
    const dataProfile = new Profiles({
      profile: toSaveProfile
    });
    await dataProfile
      .save()
      .catch((e) => {
        errors.push("Couldn't save to OctoFarms database!");
        logger.error(e);
      })
      .finally(() => {
        logger.info("New profile saved to database, running filament cleaner");
        TaskManager.forceRunTask("FILAMENT_CLEAN_TASK");
        res.send({ errors, dataProfile });
      });
  } else {
    res.send({ errors });
  }
});
router.post("/edit/profile", ensureAuthenticated, async (req, res) => {
  const serverSettings = SettingsClean.returnSystemSettings();
  const { filamentManager } = serverSettings;
  let searchId = req.bodyString("id");
  const newContent = req.body.profile;
  const errors = [];
  const oldProfileData = await Profiles.findById(searchId);

  logger.info("Profile Edit Request: ", newContent);
  if (filamentManager) {
    let printer = findFirstOnlinePrinter();
    if (!printer && !printer?.printerURL) {
      errors.push("Unable to update Filament Manager Plugin... No online printer!");
    }

    const newProfile = {
      vendor: newContent[0],
      material: newContent[1],
      density: newContent[2],
      diameter: newContent[3]
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
      errors.push("Unable to create spool on Plugin... skipping spool creation!");
    }
  }

  oldProfileData.profile.manufacturer = newContent[0];
  oldProfileData.profile.material = newContent[1];
  oldProfileData.profile.density = newContent[2];
  oldProfileData.profile.diameter = newContent[3];
  oldProfileData.markModified("profile");
  if (errors.length === 0) {
    await oldProfileData
      .save()
      .catch((e) => {
        errors.push("Couldn't save to OctoFarms database!");
        logger.error(e);
      })
      .finally(() => {
        logger.info("New profile saved to database, running filament cleaner");
        TaskManager.forceRunTask("FILAMENT_CLEAN_TASK");
        res.send({ errors });
      });
  } else {
    res.send({ errors });
  }
});
router.post("/delete/profile", ensureAuthenticated, async (req, res) => {
  const filamentManager = SettingsClean.returnFilamentManagerSettings();
  const searchId = req.bodyString("id");

  const errors = [];

  logger.info("Profile Delete Request: ", searchId);

  const isProfileAttached = await checkIfProfileAttachedToSpool(searchId);

  if (isProfileAttached) {
    errors.push("Your profile is attached to a spool! You need to delete the spool first...");
  }

  if (filamentManager) {
    const oldProfileData = await Profiles.findById(searchId);
    let printer = findFirstOnlinePrinter();
    if (!printer && !printer?.printerURL) {
      errors.push("Unable to update Filament Manager Plugin... No online printer!");
    }
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
    }
  }
  if (errors.length === 0) {
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
  } else {
    return res.send({ errors });
  }
});

router.post(
  "/filamentManagerReSync",
  ensureAuthenticated,
  ensureAdministrator,
  async (req, res) => {
    // Find first online printer...
    logger.info("Re-Syncing filament manager database");
    const reSync = await filamentManagerReSync();
    // Return success
    res.send(reSync);
  }
);

router.post("/filamentManagerSync", ensureAuthenticated, ensureAdministrator, async (req, res) => {
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

  let spools = await fetch(`${onlinePrinterList[0].printerURL}/plugin/filamentmanager/spools`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": onlinePrinterList[0].apikey
    }
  });
  let profiles = await fetch(`${onlinePrinterList[0].printerURL}/plugin/filamentmanager/profiles`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": onlinePrinterList[0].apikey
    }
  });
  // Make sure filament manager responds...
  if (spools.status !== 200 || profiles.status !== 200) {
    logger.info(
      "Couldn't grab something: Profiles Status:" +
        profiles.status +
        " Spools Status: " +
        spools.status
    );
    errors.push({
      msg:
        "Couldn't grab something: Profiles Status:" +
        profiles.status +
        " Spools Status: " +
        spools.status
    });
    // Again early bail out, cannot continue without spools/profiles
    return res.send({ errors, warnings });
  }

  await Spool.deleteMany({});
  await Profiles.deleteMany({});
  spools = await spools.json();
  profiles = await profiles.json();

  spools.spools.forEach((sp) => {
    logger.info("Saving Spool: ", sp);
    const newSpool = {
      name: sp.name,
      profile: sp.profile.id,
      price: sp.cost,
      weight: sp.weight,
      used: sp.used,
      tempOffset: sp.temp_offset,
      fmID: sp.id
    };
    const newS = new Spool({
      newSpool
    });
    newS.save();
  });
  profiles.profiles.forEach((sp) => {
    logger.info("Saving Profile: ", sp);
    const profile = {
      index: sp.id,
      density: sp.density,
      diameter: sp.diameter,
      manufacturer: sp.vendor,
      material: sp.material
    };
    const newP = new Profiles({
      profile
    });
    newP.save();
  });

  const serverSettings = await ServerSettings.find({});
  serverSettings[0].filamentManager = true;
  serverSettings[0].filament.filamentCheck = true;
  await FilamentClean.start(serverSettings[0].filamentManager);
  serverSettings[0].markModified("filamentManager");
  serverSettings[0].markModified("filament.filamentCheck");
  serverSettings[0].save();
  await SettingsClean.start();

  // Return success
  return res.send({
    errors,
    warnings,
    spoolCount: spools.spools.length,
    profileCount: profiles.profiles.length
  });
});
router.post("/disableFilamentPlugin", ensureAuthenticated, async (req, res) => {
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
