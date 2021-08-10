const _ = require("lodash");
const { createController } = require("awilix-express");
const { ensureAuthenticated } = require("../middleware/auth");
const Spool = require("../models/Spool.js");
const Profiles = require("../models/Profiles.js");
const { AppConstants } = require("../app.constants");
const Logger = require("../handlers/logger.js");

class FilamentController {
  #serverVersion;
  #settingsStore;
  #printersStore;
  #filamentCache;
  #filamentManagerPluginService;
  #octoFarmPageTitle;

  #logger = new Logger("OctoFarm-FilamentManager");

  constructor({
    settingsStore,
    printersStore,
    filamentManagerPluginService,
    filamentCache,
    serverVersion,
    octoFarmPageTitle
  }) {
    this.#settingsStore = settingsStore;
    this.#serverVersion = serverVersion;
    this.#printersStore = printersStore;
    this.#filamentCache = filamentCache;
    this.#filamentManagerPluginService = filamentManagerPluginService;
    this.#octoFarmPageTitle = octoFarmPageTitle;
  }

  async listProfiles(req, res) {
    const profiles = await this.#filamentCache.getProfiles();
    res.send({ profiles });
  }

  async listSpools(req, res) {
    const spools = await this.#filamentCache.getSpools();
    res.send({ Spool: spools });
  }

  async dropDownList(req, res) {
    const selected = await this.#filamentCache.getDropDown();
    res.send({ status: 200, selected });
  }

  async filamentList(req, res) {
    const printerList = await PrinterClean.returnFilamentList();
    res.send({ printerList });
  }

  async selectFilament(req, res) {
    const { filamentManager } = this.#settingsStore.getServerSettings();

    this.#logger.info("Request to change:", req.body.printerId + "selected filament");
    if (filamentManager && req.body.spoolId != 0) {
      const printerList = Runner.returnFarmPrinters();
      const i = _.findIndex(printerList, function (o) {
        return o._id == req.body.printerId;
      });
      const printer = printerList[i];
      const spool = await Spool.findById(req.body.spoolId);
      const selection = {
        tool: req.body.tool,
        spool: { id: spool.spools.fmID }
      };

      // TODO move to client service
      const url = `${printer.printerURL}/plugin/filamentmanager/selections/0`;
      const updateFilamentManager = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": printer.apiKey
        },
        body: JSON.stringify({ selection })
      });
    }
    const printerList = await Runner.selectedFilament(
      req.body.printerId,
      req.body.spoolId,
      req.body.tool
    );
    FilamentClean.start(filamentManager);
    res.send({ status: 200 });
  }

  async saveFilament(req, res) {
    const { filamentManager } = this.#settingsStore.getServerSettings();

    const filament = req.body;
    this.#logger.info("Saving Filament Manager Spool: ", filament);
    const filamentManagerID = null;

    if (filamentManager) {
      const printerList = Runner.returnFarmPrinters();
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
      this.#logger.info("Updating OctoPrint: ", spool);

      // TODO move to client service
      const url = `${printer.printerURL}/plugin/filamentmanager/spools`;
      let updateFilamentManager = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": printer.apiKey
        },
        body: JSON.stringify({ spool })
      });
      updateFilamentManager = await updateFilamentManager.json();
      const reSync = await this.#filamentManagerPluginService.filamentManagerReSync("AddSpool");

      res.send({ res: "success", spools: reSync.newSpools, filamentManager });
    } else {
      const spools = {
        name: filament.spoolsName,
        profile: filament.spoolsProfile,
        price: filament.spoolsPrice,
        weight: filament.spoolsWeight,
        used: filament.spoolsUsed,
        tempOffset: filament.spoolsTempOffset,
        fmID: filamentManagerID
      };
      const newFilament = new Spool({
        spools
      });
      newFilament.save().then(async (e) => {
        this.#logger.info("New Spool saved successfully: ", newFilament);
        await this.#filamentManagerPluginService.filamentManagerReSync();
        FilamentClean.start(filamentManager);
        res.send({ res: "success", spools: newFilament, filamentManager });
      });
    }
  }

  async deleteFilament(req, res) {
    const { filamentManager } = this.#settingsStore.getServerSettings();

    let searchId = req.body.id;
    this.#logger.info("Deleting Filament Manager Profile: ", searchId);
    if (filamentManager) {
      const printerList = Runner.returnFarmPrinters();
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
      this.#logger.info("Updating Octoprint to remove: ", searchId);

      // TODO move to client service
      const url = `${printer.printerURL}/plugin/filamentmanager/spools/${searchId.spools.fmID}`;
      const updateFilamentManager = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": printer.apiKey
        }
      });

      const rel = await Spool.deleteOne({ _id: searchId }).exec();
      this.#logger.info("Successfully deleted: ", searchId);
      rel.status = 200;
      Spool.find({}).then((spools) => {
        FilamentClean.start(filamentManager);
        res.send({ spool: spools });
      });
    } else {
      const rel = await Spool.deleteOne({ _id: searchId }).exec();
      this.#logger.info("Successfully deleted: ", searchId);
      rel.status = 200;
      Spool.find({}).then((spools) => {
        FilamentClean.start(filamentManager);
        res.send({ spool: spools });
      });
    }
  }

  async editFilament(req, res) {
    const { filamentManager } = this.#settingsStore.getServerSettings();

    const searchId = req.body.id;
    this.#logger.info("Request to update spool id: ", searchId);
    this.#logger.info("New details: ", req.body.spool);
    const newContent = req.body.spool;
    const spools = await Spool.findById(searchId);

    if (filamentManager) {
      const printerList = Runner.returnFarmPrinters();
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
      this.#logger.info("Updating OctoPrint: ", spool);

      // TODO move to client service
      const url = `${printer.printerURL}/plugin/filamentmanager/spools/${spools.spools.fmID}`;
      const updateFilamentManager = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": printer.apiKey
        },
        body: JSON.stringify({ spool })
      });
    }

    if (spools.spools.name != newContent[0]) {
      spools.spools.name = newContent[0];
      spools.markModified("spools");
    }
    if (spools.spools.profile != newContent[5]) {
      spools.spools.profile = newContent[5];
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
    await spools.save();
    Runner.updateFilament();
    Spool.find({}).then((spools) => {
      this.#logger.info("New spool details saved: ", req.body.spool);
      FilamentClean.start(filamentManager);
      Runner.updateFilament();
      res.send({ spools });
    });
  }

  async saveProfile(req, res) {
    const { filamentManager } = this.#settingsStore.getServerSettings();

    const newProfile = req.body;
    const error = [];
    this.#logger.info("Saving Filament Manager Profile: ", newProfile);
    const filamentManagerID = null;
    if (filamentManager) {
      const printerList = Runner.returnFarmPrinters();
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
      this.#logger.info("Updating OctoPrint: ", profile);

      // TODO move to client service
      const url = `${printer.printerURL}/plugin/filamentmanager/profiles`;
      let updateFilamentManager = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": printer.apiKey
        },
        body: JSON.stringify({ profile })
      });
      updateFilamentManager = await updateFilamentManager.json();
      const reSync = await this.#filamentManagerPluginService.filamentManagerReSync("AddSpool");

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
          this.#logger.info("New profile saved to database, running filament cleaner", e);
          FilamentClean.start(filamentManager);
          res.send({ res: error, dataProfile, filamentManager });
        })
        .catch((e) => this.#logger.error(e));
    }
  }

  async editProfile(req, res) {
    const { filamentManager } = this.#settingsStore.getServerSettings();

    let searchId = req.body.id;
    const newContent = req.body.profile;
    this.#logger.info("Profile Edit Request: ", newContent);

    if (filamentManager) {
      const printerList = Runner.returnFarmPrinters();
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

      this.#logger.info("Updating OctoPrint: ", profile);
      // TODO move to client service
      const url = `${printer.printerURL}/plugin/filamentmanager/profiles/${searchId}`;
      let updateFilamentManager = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": printer.apiKey
        },
        body: JSON.stringify({ profile })
      });

      updateFilamentManager = await updateFilamentManager.json();
      this.#logger.info("New spool created on plugin: ", updateFilamentManager.profile.id);
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
    this.#logger.info("Profile saved successfully");
    FilamentClean.start(filamentManager);
    Profiles.find({}).then((profiles) => {
      Runner.updateFilament();
      res.send({ profiles });
    });
  }

  async deleteProfile(req, res) {
    const { filamentManager } = this.#settingsStore.getServerSettings();

    const searchId = req.body.id;
    this.#logger.info("Profile delete request: ", searchId);
    if (filamentManager) {
      const printerList = Runner.returnFarmPrinters();
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
      this.#logger.info("Updating OctoPrint: ", searchId);
      // TODO move to client service
      const url = `${printer.printerURL}/plugin/filamentmanager/profiles/${searchId}`;
      const updateFilamentManager = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": printer.apiKey
        }
      });
      const profiles = await Profiles.find({});
      const findID = _.findIndex(profiles, function (o) {
        return o.profile.index == searchId;
      });
      this.#logger.info("Deleting from database: ", searchId);
      const rel = await Profiles.deleteOne({ _id: profiles[findID]._id }).exec();
      this.#logger.info("Profile deleted successfully");
      FilamentClean.start(filamentManager);
      rel.status = 200;
      res.send({ profiles });
    } else {
      this.#logger.info("Deleting from database: ", searchId);
      const rel = await Profiles.deleteOne({ _id: searchId }).exec();
      rel.status = 200;
      this.#logger.info("Profile deleted successfully");
      FilamentClean.start(filamentManager);
      Profiles.find({}).then((profiles) => {
        res.send({ profiles });
      });
    }
  }

  async filamentManagerReSync(req, res) {
    // Find first online printer...
    this.#logger.info("Re-Syncing filament manager database");
    const reSync = await this.#filamentManagerPluginService.filamentManagerReSync();
    // Return success
    res.send(reSync);
  }

  async filamentManagerSync(req, res) {
    const searchId = req.body.id;
    // Find first online printer...

    this.#logger.info("Turning on filament manager sync...");

    const printerList = Runner.returnFarmPrinters();
    let printer = null;
    this.#logger.info("Looking for online printer...");
    for (let i = 0; i < printerList.length; i++) {
      if (
        printerList[i].stateColour.category === "Disconnected" ||
        printerList[i].stateColour.category === "Idle" ||
        printerList[i].stateColour.category === "Active" ||
        printerList[i].stateColour.category === "Complete"
      ) {
        printer = printerList[i];
        this.#logger.info(
          "Using ",
          printer.printerURL + " to establish a connection to Filament Manager Plugin..."
        );
        break;
      }
    }

    if (printer === null) {
      this.#logger.info("No printer online, please connect a printer...");
      res.send({ status: false });
    }

    // TODO move to client service
    let spools = await fetch(`${printer.printerURL}/plugin/filamentmanager/spools`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apiKey
      }
    });
    this.#logger.info("Grabbing Profiles");

    // TODO move to client service
    let profiles = await fetch(`${printer.printerURL}/plugin/filamentmanager/profiles`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apiKey
      }
    });
    this.#logger.info("Grabbing Spools");
    // Make sure filament manager responds...
    if (spools.status != 200 || profiles.status != 200) {
      this.#logger.info(
        "Couldn't grab something: Profiles Status:" +
          profiles.status +
          " Spools Status: " +
          spools.status
      );
      res.send({ status: false });
    }
    await Spool.deleteMany({});
    await Profiles.deleteMany({});
    spools = await spools.json();
    profiles = await profiles.json();
    spools.spools.forEach((sp) => {
      this.#logger.info("Saving Spool: ", sp);
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
      this.#logger.info("Saving Profile: ", sp);
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
    FilamentClean.start(serverSettings[0].filamentManager);
    serverSettings[0].markModified("filamentManager");
    serverSettings[0].save();
    SettingsClean.start();
    // Return success
    if (spools.status === 200 || profiles.status != 200) {
      res.send({ status: true });
    }
  }

  async disableFilamentPlugin(req, res) {
    this.#logger.info("Request to disabled filament manager plugin");
    await Spool.deleteMany({}).then((e) => {
      this.#logger.info("Spools deleted");
    });

    await Profiles.deleteMany({}).then((e) => {
      this.#logger.info("Profiles deleted");
    });

    // TODO use store to update both cache and database
    const serverSettings = await ServerSettings.find({});
    serverSettings[0].filamentManager = false;
    FilamentClean.start(serverSettings[0].filamentManager);
    serverSettings[0].markModified("filamentManager");
    serverSettings[0].save();
    SettingsClean.start();
    this.#logger.info("Successfully disabled filament manager");
    // Return success
    res.send({ status: true });
  }
}

// prettier-ignore
module.exports = createController(FilamentController)
  .prefix(AppConstants.apiRoute + "/filament")
  .before([ensureAuthenticated])
  .get("/dropdown-list", "dropDownList")
  .get("/profiles", "listProfiles")
  .get("/spools", "listSpools")
  .patch("/select", "selectFilament")
  // WIP line
  .get("/get/printerList", "filamentList")
  .post("/save/filament", "saveFilament")
  .delete("/delete/filament", "deleteFilament")
  .post("/edit/filament", "editFilament")
  .post("/save/profile", "saveProfile")
  .post("/edit/profile", "editProfile")
  .delete("/delete/profile", "deleteProfile")
  .put("/filament-manager/resync", "filamentManagerReSync")
  .post("/filament-manager/sync", "filamentManagerSync")
  .post("/disableFilamentPlugin", "disableFilamentPlugin");