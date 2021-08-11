const Logger = require("../../handlers/logger.js");
const Spool = require("../../models/Spool.js");
const Profile = require("../../models/Profiles.js");

class FilamentManagerPluginService {
  #printersStore;
  #octoPrintClient;

  #logger = new Logger("OctoFarm-FilamentManager");

  constructor({ printersStore, octoPrintApiClientService }) {
    this.#printersStore = printersStore;
    this.#octoPrintClient = octoPrintApiClientService;
  }

  async updatePrinterSelectedFilament(printer) {
    const returnSpools = [];
    for (let i = 0; i < printer.selectedFilament.length; i++) {
      if (printer.selectedFilament[i] !== null) {
        const filamentID = printer.selectedFilament[i].spools.fmID;
        if (!filamentID) {
          throw `Could not query OctoPrint FilamentManager for filament. FilamentID '${filamentID}' not found.`;
        }
        const response = await this.#octoPrintClient.getPluginFilamentManagerFilament(
          printer.getLoginDetails(),
          filamentID
        );

        this.#logger.info(`${printer.printerURL}: spools fetched. Status: ${response.status}`);
        const sp = await response.json();

        const spoolID = printer.selectedFilament[i]._id;
        const spoolEntity = await Spool.findById(spoolID);
        if (!spoolEntity) {
          throw `Spool database entity by ID '${spoolID}' not found. Cant update filament.`;
        }
        spoolEntity.spools = {
          name: sp.spool.name,
          profile: sp.spool.profile.id,
          price: sp.spool.cost,
          weight: sp.spool.weight,
          used: sp.spool.used,
          tempOffset: sp.spool.temp_offset,
          fmID: sp.spool.id
        };
        this.#logger.info(`${printer.printerURL}: updating... spool status ${spoolEntity.spools}`);
        spoolEntity.markModified("spools");
        await spoolEntity.save();
        returnSpools.push(spoolEntity);
      }
    }

    // TODO isnt this over the top? Cant we just sync 1 spool at at time and be done?
    const reSync = await this.filamentManagerReSync();
    this.#logger.info(reSync);

    return returnSpools;
  }

  async filamentManagerReSync(addSpool) {
    const printerStates = this.#printersStore.listPrintersFlat();

    // TODO ?????
    let printer = null;
    for (let i = 0; i < printerStates.length; i++) {
      if (
        printerList[i].stateColour.category === "Disconnected" ||
        printerList[i].stateColour.category === "Idle" ||
        printerList[i].stateColour.category === "Active" ||
        printerList[i].stateColour.category === "Complete"
      ) {
        // TODO ?????
        printer = printerList[i];
        // TODO ????
        break;
      }
    }
    if (printer === null) {
      // TODO ?????
      return "error";
    }

    const spools = await this.#octoPrintClient.listPluginFilamentManagerFilament(printer);
    const profiles = await this.#octoPrintClient.listPluginFilamentManagerProfiles(printer);

    // Make sure filament manager responds...
    // TODO this will not be reached in case of errors due to .json() now failing
    if (spools.status != 200 || profiles.status != 200) {
      return {
        success: false,
        spools: spools.status,
        profiles: profiles.status
      };
    }

    const newSpools = [];
    const updatedSpools = [];
    const newProfiles = [];
    const updatedProfiles = [];

    const addSpools = [];
    const addProfiles = [];

    const spoolsFM = await spools.json();
    const profilesFM = await profiles.json();

    const S = "Spool";
    const P = "Profile";

    for (let s = 0; s < spoolsFM.spools.length; s++) {
      const sp = spoolsFM.spools[s];
      const spools = {
        name: sp.name,
        profile: sp.profile.id,
        price: sp.cost,
        weight: sp.weight,
        used: sp.used,
        tempOffset: sp.temp_offset,
        fmID: sp.id
      };
      const oldSpool = await Spool.findOne({ "spools.fmID": sp.id });
      if (oldSpool !== null) {
        updatedSpools.push(S);
        this.#logger.info("Updating Spool: ", spools);
        oldSpool.spools = spools;
        oldSpool.markModified("spools");
        oldSpool.save();
      } else {
        // New Spool
        this.#logger.info("Saving New Spool: ", spools);
        const newSpool = await new Spool({ spools });
        await newSpool.save();
        if (addSpool) {
          addSpools.push(newSpool);
        } else {
          newSpools.push(S);
        }
      }
    }

    for (let p = 0; p < profilesFM.profiles.length; p++) {
      const pr = profilesFM.profiles[p];
      const profile = {
        index: pr.id,
        density: pr.density,
        diameter: pr.diameter,
        manufacturer: pr.vendor,
        material: pr.material
      };
      const oldProfile = await Profile.findOne({ "profile.index": pr.id });
      if (oldProfile !== null) {
        updatedProfiles.push(P);
        this.#logger.info("Updating Profile: ", profile);
        oldProfile.profile = profile;
        oldProfile.markModified("profile");
        oldProfile.save();
      } else {
        // New Profile
        this.#logger.info("Saving New Profile: ", profile);
        const newProfile = await new Profile({ profile });
        await newProfile.save();
        if (addSpool) {
          addProfiles.push(newProfile);
        } else {
          newProfiles.push(P);
        }
      }
    }

    this.#logger.info("Successfully synced filament manager with octofarm.");
    if (addSpool) {
      return {
        success: true,
        newProfiles: addProfiles[0],
        newSpools: addSpools[0]
      };
    } else {
      return {
        success: true,
        newSpools: newSpools.length,
        updatedSpools: updatedSpools.length,
        newProfiles: newProfiles.length,
        updatedProfiles: updatedProfiles.length
      };
    }
  }
}

module.exports = FilamentManagerPluginService;
