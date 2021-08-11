const _ = require("lodash");
const Logger = require("../../handlers/logger.js");
const Spools = require("../../models/Spool.js");
const Profiles = require("../../models/Profiles.js");
const { noSpoolOptionTemplate } = require("../../constants/template.constants");

const logger = new Logger("OctoFarm-InformationCleaning");

class FilamentCache {
  #spoolsClean = [];
  #profilesClean = [];
  #statisticsClean = [];
  #selectedFilamentList = [];
  #dropDownList = {
    normalDropDown: [],
    historyDropDown: []
  };

  #settingsStore;
  #printersStore;

  constructor({ settingsStore, printersStore }) {
    this.#settingsStore = settingsStore;
    this.#printersStore = printersStore;
  }

  getSpools() {
    return this.#spoolsClean;
  }

  getProfiles() {
    return this.#profilesClean;
  }

  getStatistics() {
    return this.#statisticsClean;
  }

  getSelected() {
    return this.#selectedFilamentList;
  }

  getDropDown() {
    return this.#dropDownList;
  }

  async initCache() {
    const printers = this.#printersStore.listPrinterStates();

    const profiles = await Profiles.find({});
    const spools = await Spools.find({});
    const spoolsArray = [];
    const profilesArray = [];

    for (let pr = 0; pr < profiles.length; pr++) {
      const profile = {
        _id: null,
        manufacturer: profiles[pr].profile.manufacturer,
        material: profiles[pr].profile.material,
        density: profiles[pr].profile.density,
        diameter: profiles[pr].profile.diameter
      };
      if (this.#settingsStore.isFilamentEnabled()) {
        profile._id = profiles[pr].profile.index;
      } else {
        profile._id = profiles[pr]._id;
      }
      profilesArray.push(profile);
    }

    for (let sp = 0; sp < spools.length; sp++) {
      const spool = {
        _id: spools[sp]._id,
        name: spools[sp].spools.name,
        profile: spools[sp].spools.profile,
        price: spools[sp].spools.price,
        weight: spools[sp].spools.weight,
        used: spools[sp].spools.used,
        remaining: spools[sp].spools.weight - spools[sp].spools.used,
        percent: 100 - (spools[sp].spools.used / spools[sp].spools.weight) * 100,
        tempOffset: spools[sp].spools.tempOffset,
        printerAssignment: this.getPrinterAssignment(spools[sp]._id, printers),
        fmID: spools[sp].spools.fmID
      };
      spoolsArray.push(spool);
    }

    this.#spoolsClean = spoolsArray;
    this.#profilesClean = profilesArray;

    this.#selectedFilamentList = await this.selectedFilament(printers);
    this.#statisticsClean = this.createStatistics(spoolsArray, profilesArray);
    await this.dropDownList(spools, profiles);
    logger.info("Filament information cleaned and ready for consumption...");
  }

  dropDownList(spools, profiles) {
    const normalDropObject = [noSpoolOptionTemplate];
    const historyDropObject = [noSpoolOptionTemplate];

    spools.forEach((spool) => {
      let profileId;
      if (this.#settingsStore.isFilamentEnabled()) {
        profileId = _.findIndex(profiles, function (o) {
          return o.profile.index === spool.spools.profile;
        });
      } else {
        profileId = _.findIndex(profiles, function (o) {
          return o._id === spool.spools.profile;
        });
      }
      const index = _.findIndex(this.#selectedFilamentList, function (o) {
        return o === spool._id;
      });

      if (profileId >= 0) {
        if (this.#settingsStore.isFilamentEnabled()) {
          historyDropObject.push(`
                  <option value="${spool._id}">${spool.spools.name} (${(
            spool.spools.weight - spool.spools.used
          ).toFixed(2)}g) - ${profiles[profileId].profile.material}</option>
              `);
          if (index > -1) {
            normalDropObject.push(`
                  <option value="${spool._id}" disabled>${spool.spools.name} (${(
              spool.spools.weight - spool.spools.used
            ).toFixed(2)}g) - ${profiles[profileId].profile.material}</option>
              `);
          } else {
            normalDropObject.push(`
                  <option value="${spool._id}">${spool.spools.name} (${(
              spool.spools.weight - spool.spools.used
            ).toFixed(2)}g) - ${profiles[profileId].profile.material}</option>
              `);
          }
        } else {
          historyDropObject.push(`
                  <option value="${spool._id}">${spool.spools.name} - ${profiles[profileId].profile.material}</option>
              `);
          normalDropObject.push(`
                  <option value="${spool._id}">${spool.spools.name} - ${profiles[profileId].profile.material}</option>
              `);
        }
      }
    });
    this.#dropDownList = {
      normalDropDown: normalDropObject,
      historyDropDown: historyDropObject
    };
  }

  async selectedFilament(printers) {
    const selectedArray = [];
    for (let s = 0; s < printers.length; s++) {
      if (typeof printers[s] !== "undefined" && Array.isArray(printers[s].selectedFilament)) {
        for (let f = 0; f < printers[s].selectedFilament.length; f++) {
          if (printers[s].selectedFilament[f] !== null) {
            selectedArray.push(printers[s].selectedFilament[f]._id);
          }
        }
      }
    }
    return selectedArray;
  }

  createStatistics(spools, profiles) {
    const materials = [];
    let materialBreak = [];
    for (let p = 0; p < profiles.length; p++) {
      materials.push(profiles[p].material.replace(/ /g, "_"));
      const material = {
        name: profiles[p].material.replace(/ /g, "_"),
        weight: [],
        used: [],
        price: []
      };
      materialBreak.push(material);
    }
    materialBreak = _.uniqWith(materialBreak, _.isEqual);

    const used = [];
    const total = [];
    const price = [];
    for (let s = 0; s < spools.length; s++) {
      used.push(parseFloat(spools[s].used));
      total.push(parseFloat(spools[s].weight));
      price.push(parseFloat(spools[s].price));
      const profInd = _.findIndex(profiles, function (o) {
        return o._id == spools[s].profile;
      });
      if (profInd > -1) {
        const index = _.findIndex(materialBreak, function (o) {
          return o.name == profiles[profInd].material.replace(/ /g, "_");
        });

        materialBreak[index].weight.push(parseFloat(spools[s].weight));
        materialBreak[index].used.push(parseFloat(spools[s].used));
        materialBreak[index].price.push(parseFloat(spools[s].price));
      }
    }

    const materialBreakDown = [];
    for (let m = 0; m < materialBreak.length; m++) {
      const mat = {
        name: materialBreak[m].name,
        used: materialBreak[m].used.reduce((a, b) => a + b, 0),
        total: materialBreak[m].weight.reduce((a, b) => a + b, 0),
        price: materialBreak[m].price.reduce((a, b) => a + b, 0)
      };
      materialBreakDown.push(mat);
    }
    return {
      materialList: materials.filter(function (item, i, ar) {
        return ar.indexOf(item) === i;
      }),
      used: used.reduce((a, b) => a + b, 0),
      total: total.reduce((a, b) => a + b, 0),
      price: price.reduce((a, b) => a + b, 0),
      profileCount: profiles.length,
      spoolCount: spools.length,
      activeSpools: this.#selectedFilamentList,
      activeSpoolCount: this.#selectedFilamentList.length,
      materialBreakDown
    };
  }

  // TODO broken w.r.t. printerState
  getPrinterAssignment(spoolID, farmPrinters) {
    const assignments = [];
    for (let p = 0; p < farmPrinters.length; p++) {
      if (
        typeof farmPrinters[p] !== "undefined" &&
        Array.isArray(farmPrinters[p].selectedFilament)
      ) {
        for (let s = 0; s < farmPrinters[p].selectedFilament.length; s++) {
          if (farmPrinters[p].selectedFilament[s] !== null) {
            if (farmPrinters[p].selectedFilament[s]._id.toString() === spoolID.toString()) {
              const printer = {
                id: farmPrinters[p]._id,
                tool: s,
                name: farmPrinters[p].printerName
              };
              assignments.push(printer);
            }
          }
        }
      }
    }
    return assignments;
  }
}

module.exports = FilamentCache;
