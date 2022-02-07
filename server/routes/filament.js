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

const filamentManagerPlugin = require("../services/octoprint/octoprint-filament-manager-plugin.service.js");

const { FilamentManagerPlugin } = filamentManagerPlugin;

const {
  getOnlinePrinterList,
  checkIfFilamentManagerPluginExists,
  checkFilamentManagerPluginSettings,
  checkIfSpoolAttachedToPrinter,
  checkIfProfileAttachedToSpool
} = require("../services/octoprint.service");
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
  const selected = await FilamentClean.getDropDown();
  res.send({ status: 200, selected });
});
// router.post("/select", ensureAuthenticated, async (req, res) => {
//   const filamentManager = await SettingsClean.returnFilamentManagerSettings();
//   logger.info("Request to change:", req.body.printerId + "selected filament");
//   if (filamentManager && req.body.spoolId != 0) {
//     const printerList = Runner.returnFarmPrinters();
//     const i = _.findIndex(printerList, function (o) {
//       return o._id == req.body.printerId;
//     });
//     const printer = printerList[i];
//     const spool = await Spool.findById(req.body.spoolId);
//     const selection = {
//       tool: req.body.tool,
//       spool: { id: spool.spools.fmID }
//     };
//     const url = `${printer.printerURL}/plugin/filamentmanager/selections/0`;
//     const updateFilamentManager = await fetch(url, {
//       method: "PATCH",
//       headers: {
//         "Content-Type": "application/json",
//         "X-Api-Key": printer.apikey
//       },
//       body: JSON.stringify({ selection })
//     });
//   }
//   const printerList = await Runner.selectedFilament(
//     req.body.printerId,
//     req.body.spoolId,
//     req.body.tool
//   );
//   TaskManager.forceRunTask("FILAMENT_CLEAN_TASK");
//   res.send({ status: 200 });
// });
router.post("/assign", ensureAuthenticated, async (req, res) => {
  // const filamentManager = await SettingsClean.returnFilamentManagerSettings();
  logger.info("Request to change selected spool:", req.body.printers);
  // if (filamentManager && req.body.spoolId != 0) {
  //   const printerList = Runner.returnFarmPrinters();
  //   const i = _.findIndex(printerList, function (o) {
  //     return o._id == req.body.printerIds[0];
  //   });
  //   const printer = printerList[i];
  //   const spool = await Spool.findById(req.body.spoolId);
  //   const selection = {
  //     tool: req.body.tool,
  //     spool: { id: spool.spools.fmID }
  //   };
  //   const url = `${printer.printerURL}/plugin/filamentmanager/selections/0`;
  //   const updateFilamentManager = await fetch(url, {
  //     method: "PATCH",
  //     headers: {
  //       "Content-Type": "application/json",
  //       "X-Api-Key": printer.apikey
  //     },
  //     body: JSON.stringify({ selection })
  //   });
  // }
  await getPrinterStoreCache().assignSpoolToPrinters(req.body.printers, req.body.spoolId);
  TaskManager.forceRunTask("FILAMENT_CLEAN_TASK");
  res.send({ status: 200 });
});

router.post("/save/filament", ensureAuthenticated, async (req, res) => {
  const filamentManager = SettingsClean.returnFilamentManagerSettings();

  const filament = req.body;
  logger.info("Saving Filament Manager Spool: ", filament);
  const filamentManagerID = null;

  if (filamentManager) {
    const printerList = getPrinterStoreCache().listPrintersInformation();
    let printer = null;

    for (let i = 0; i < printerList.length; i += 1) {
      if (
        printerList[i].stateColour.category === "Disconnected" ||
        printerList[i].stateColour.category === "Idle" ||
        printerList[i].stateColour.category === "Active" ||
        printerList[i].stateColour.category === "Complete"
      ) {
        printer = printerList[i];
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
    updateFilamentManager = await updateFilamentManager.json();
    const reSync = await FilamentManagerPlugin.filamentManagerReSync("AddSpool");
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
      await FilamentManagerPlugin.filamentManagerReSync();
      await TaskManager.forceRunTask("FILAMENT_CLEAN_TASK");
      res.send({ res: "success", spools: newFilament, filamentManager });
    });
  }
});
router.post("/delete/filament", ensureAuthenticated, async (req, res) => {
  const serverSettings = await SettingsClean.returnSystemSettings();
  const { filamentManager } = serverSettings;

  let searchId = req.body.id;
  logger.info("Deleting Filament Manager Profile: ", searchId);

  const isSpoolAttached = checkIfSpoolAttachedToPrinter(searchId);

  if (isSpoolAttached) return res.send({ spool: false });

  if (filamentManager) {
    // const printerList = Runner.returnFarmPrinters();
    let printer = null;
    for (let i = 0; i < printerList.length; i++) {
      if (
        printerList[i].stateColour.category === "Disconnected" ||
        printerList[i].stateColour.category === "Idle" ||
        printerList[i].stateColour.category === "Active" ||
        printerList[i].stateColour.category === "Complete"
      ) {
        printer = printerList[i];
        break;
      }
    }

    searchId = await Spool.findById(searchId);
    logger.info("Updating Octoprint to remove: ", searchId);
    const url = `${printer.printerURL}/plugin/filamentmanager/spools/${searchId.spools.fmID}`;
    const updateFilamentManager = await fetch(url, {
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
  const searchId = req.body.id;
  logger.info("Request to update spool id: ", searchId);
  logger.info("New details: ", req.body.spool);
  const newContent = req.body.spool;
  const spools = await Spool.findById(searchId);
  if (filamentManager) {
    const printerList = getPrinterStoreCache().listPrintersInformation();
    let printer = null;
    for (let i = 0; i < printerList.length; i++) {
      if (
        printerList[i].stateColour.category === "Disconnected" ||
        printerList[i].stateColour.category === "Idle" ||
        printerList[i].stateColour.category === "Active" ||
        printerList[i].stateColour.category === "Complete"
      ) {
        printer = printerList[i];
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
    const updateFilamentManager = await fetch(url, {
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
  // await Runner.updateFilament();
  Spool.find({}).then((spools) => {
    logger.info("New spool details saved: ", req.body.spool);
    TaskManager.forceRunTask("FILAMENT_CLEAN_TASK");
    // Runner.updateFilament();
    res.send({ spools });
  });
});

router.post("/save/profile", ensureAuthenticated, async (req, res) => {
  const serverSettings = await SettingsClean.returnSystemSettings();
  const { filamentManager } = serverSettings;
  const newProfile = req.body;
  const error = [];
  logger.info("Saving Filament Manager Profile: ", newProfile);
  const filamentManagerID = null;
  if (filamentManager) {
    // const printerList = Runner.returnFarmPrinters();
    let printer = null;
    for (let i = 0; i < 10; i++) {
      if (
        printerList[i].stateColour.category === "Disconnected" ||
        printerList[i].stateColour.category === "Idle" ||
        printerList[i].stateColour.category === "Active" ||
        printerList[i].stateColour.category === "Complete"
      ) {
        printer = printerList[i];
        break;
      }
    }
    const profile = {
      vendor: newProfile.manufacturer,
      material: newProfile.material,
      density: newProfile.density,
      diameter: newProfile.diameter
    };
    logger.info("Updating OctoPrint: ", profile);
    const url = `${printer.printerURL}/plugin/filamentmanager/profiles`;
    let updateFilamentManager = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      },
      body: JSON.stringify({ profile })
    });
    updateFilamentManager = await updateFilamentManager.json();
    const reSync = await FilamentManagerPlugin.filamentManagerReSync("AddSpool");

    res.send({
      res: "success",
      dataProfile: reSync.newProfiles,
      filamentManager
    });
  } else {
    const profile = {
      index: filamentManagerID,
      manufacturer: newProfile.manufacturer,
      material: newProfile.material,
      density: newProfile.density,
      diameter: newProfile.diameter
    };
    const dataProfile = new Profiles({
      profile
    });

    dataProfile
      .save()
      .then(async (e) => {
        logger.info("New profile saved to database, running filament cleaner", e);
        TaskManager.forceRunTask("FILAMENT_CLEAN_TASK");
        res.send({ res: error, dataProfile, filamentManager });
      })
      .catch((e) => logger.error(e));
  }
});
router.post("/edit/profile", ensureAuthenticated, async (req, res) => {
  const serverSettings = await SettingsClean.returnSystemSettings();
  const { filamentManager } = serverSettings;
  let searchId = req.body.id;
  const newContent = req.body.profile;
  logger.info("Profile Edit Request: ", newContent);
  if (filamentManager) {
    // const printerList = Runner.returnFarmPrinters();
    let printer = null;
    for (let i = 0; i < printerList.length; i++) {
      if (
        printerList[i].stateColour.category === "Disconnected" ||
        printerList[i].stateColour.category === "Idle" ||
        printerList[i].stateColour.category === "Active" ||
        printerList[i].stateColour.category === "Complete"
      ) {
        printer = printerList[i];
        break;
      }
    }
    const profile = {
      vendor: newContent[0],
      material: newContent[1],
      density: newContent[2],
      diameter: newContent[3]
    };
    logger.info("Updating OctoPrint: ", profile);
    const url = `${printer.printerURL}/plugin/filamentmanager/profiles/${searchId}`;
    let updateFilamentManager = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      },
      body: JSON.stringify({ profile })
    });

    updateFilamentManager = await updateFilamentManager.json();
    logger.info("New spool created on plugin: ", updateFilamentManager.profile.id);
    filamentManagerID = updateFilamentManager.profile.id;
    const profiles = await Profiles.find({});
    const findID = _.findIndex(profiles, function (o) {
      return o.profile.index == searchId;
    });
    searchId = profiles[findID]._id;
  }
  const profile = await Profiles.findById(searchId);
  if (profile.profile.manufacturer != newContent[0]) {
    profile.profile.manufacturer = newContent[0];
    profile.markModified("profile");
  }
  if (profile.profile.material != newContent[1]) {
    profile.profile.material = newContent[1];
    profile.markModified("profile");
  }
  if (profile.profile.density != newContent[2]) {
    profile.profile.density = newContent[2];
    profile.markModified("profile");
  }
  if (profile.profile.diameter != newContent[3]) {
    profile.profile.diameter = newContent[3];
    profile.markModified("profile");
  }
  await profile.save();
  logger.info("Profile saved successfully");
  TaskManager.forceRunTask("FILAMENT_CLEAN_TASK");
  Profiles.find({}).then((profiles) => {
    // Runner.updateFilament();
    res.send({ profiles });
  });
});
router.post("/delete/profile", ensureAuthenticated, async (req, res) => {
  const filamentManager = SettingsClean.returnFilamentManagerSettings();
  const searchId = req.body.id;

  const isProfileAttached = await checkIfProfileAttachedToSpool(searchId);

  if (isProfileAttached) return res.send({ profiles: false });

  if (filamentManager) {
    const printerList = getPrinterStoreCache().listPrintersInformation();
    let printer = null;
    for (let i = 0; i < printerList.length; i++) {
      if (
        printerList[i].stateColour.category === "Disconnected" ||
        printerList[i].stateColour.category === "Idle" ||
        printerList[i].stateColour.category === "Active" ||
        printerList[i].stateColour.category === "Complete"
      ) {
        printer = printerList[i];
        break;
      }
    }
    logger.info("Updating OctoPrint: ", searchId);
    // REFACTOR move to api service
    const url = `${printer.printerURL}/plugin/filamentmanager/profiles/${searchId}`;
    const updateFilamentManager = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      }
    });
    const profiles = await Profiles.find({});
    const findID = _.findIndex(profiles, function (o) {
      return o.profile.index == searchId;
    });
    logger.info("Deleting from database: ", searchId);
    const rel = await Profiles.deleteOne({ _id: profiles[findID]._id }).exec();
    logger.info("Profile deleted successfully");
    await TaskManager.forceRunTask("FILAMENT_CLEAN_TASK");
    rel.status = 200;
    res.send({ profiles });
  } else {
    logger.info("Deleting from database: ", searchId);
    const rel = await Profiles.deleteOne({ _id: searchId }).exec();
    rel.status = 200;
    logger.info("Profile deleted successfully");
    await TaskManager.forceRunTask("FILAMENT_CLEAN_TASK");
    Profiles.find({}).then((profiles) => {
      res.send({ profiles });
    });
  }
});

router.post(
  "/filamentManagerReSync",
  ensureAuthenticated,
  ensureAdministrator,
  async (req, res) => {
    // Find first online printer...
    logger.info("Re-Syncing filament manager database");
    const reSync = await FilamentManagerPlugin.filamentManagerReSync();
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

  const filamentManagerSettingsCheck = await n(onlinePrinterList);
  if (filamentManagerSettingsCheck.length > 0) {
    let message = "These instances don't have the plugin setup correctly... Cannot continue!";
    filamentManagerSettingsCheck.forEach((printer) => {
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
    const spools = {
      name: sp.name,
      profile: sp.profile.id,
      price: sp.cost,
      weight: sp.weight,
      used: sp.used,
      tempOffset: sp.temp_offset,
      fmID: sp.id
    };
    const newS = new Spool({
      spools
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
  await Spool.deleteMany({}).then((e) => {
    logger.info("Spools deleted");
  });

  await Profiles.deleteMany({}).then((e) => {
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
