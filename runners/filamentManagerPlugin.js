const runner = import("../runners/state.js");
const { Runner } = runner;

const filamentClean = require("../lib/dataFunctions/filamentClean.js");

const { FilamentClean } = filamentClean;

const Logger = require("../lib/logger.js");

const logger = new Logger("OctoFarm-FilamentManager");

const Spool = require("../models/Filament.js");
const Profile = require("../models/Profiles.js");
const fetch = require("node-fetch");

const filamentManagerReSync = async function () {
  try {
    const runner = require("./state.js");
    const { Runner } = runner;
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
    if (printer === null) {
      return "error";
    }
    const spools = await fetch(
      `${printer.printerURL}/plugin/filamentmanager/spools`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": printer.apikey,
        },
      }
    );
    const profiles = await fetch(
      `${printer.printerURL}/plugin/filamentmanager/profiles`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": printer.apikey,
        },
      }
    );
    // Make sure filament manager responds...
    if (spools.status != 200 || profiles.status != 200) {
      return "FAILED";
    }
    spoolsFM = await spools.json();
    profilesFM = await profiles.json();

    spoolsFM.spools.forEach(async (sp) => {
      const spools = {
        name: sp.name,
        profile: sp.profile.id,
        price: sp.cost,
        weight: sp.weight,
        used: sp.used,
        tempOffset: sp.temp_offset,
        fmID: sp.id,
      };
      const oldSpool = await Spool.findOne({ "spools.name": sp.name });
      if (oldSpool !== null) {
        logger.info("Updating Spool: ", spools);
        oldSpool.spools = spools;
        oldSpool.markModified("spools");
        oldSpool.save();
      } else {
        // New Spool
        logger.info("Saving New Spool: ", spools);
        const newSpool = await new Spool({ spools });
        newSpool.save();
      }
    });
    profilesFM.profiles.forEach(async (pr) => {
      const profile = {
        index: pr.id,
        density: pr.density,
        diameter: pr.diameter,
        manufacturer: pr.vendor,
        material: pr.material,
      };
      const oldProfile = await Profile.findOne({ "profile.index": pr.id });
      if (oldProfile !== null) {
        logger.info("Updating Profile: ", profile);
        oldProfile.profile = profile;
        oldProfile.markModified("profile");
        oldProfile.save();
      } else {
        // New Profile
        logger.info("Saving New Profile: ", profile);
        const newProfile = await new Profile({ profile });
        newProfile.save();
      }
    });
    FilamentClean.start(true);
    logger.info("Successfully synced filament manager with octofarm.");
    return "success";
  } catch (e) {
    console.error("SYNC", e);
  }
};

module.exports = {
  filamentManagerReSync,
};
