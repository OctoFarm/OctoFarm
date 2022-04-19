"use strict";

const _ = require("lodash");
const Logger = require("../handlers/logger.js");
const Spools = require("../models/Filament.js");
const Profiles = require("../models/Profiles.js");
const { SettingsClean } = require("./settings-cleaner.service");
const { getPrinterStoreCache } = require("../cache/printer-store.cache");

const logger = new Logger("OctoFarm-InformationCleaning");

let spoolsClean = [];
let profilesClean = [];
let statisticsClean = [];
let selectedFilamentList = [];
let dropDownList = {
  normalDropDown: [],
  historyDropDown: []
};

class FilamentCleanerService {
  static noSpoolOptions = '<option value="0">No Spool Selected</option>';

  static getSpools() {
    return spoolsClean;
  }

  static getProfiles() {
    return profilesClean;
  }

  static getStatistics() {
    return statisticsClean;
  }

  static getSelected() {
    return selectedFilamentList;
  }

  static getDropDown() {
    return dropDownList;
  }

  static async start() {
    const filamentManager = SettingsClean.returnFilamentManagerSettings();
    const profiles = await Profiles.find({});
    const spools = await Spools.find({});
    const farmPrinters = getPrinterStoreCache().listPrintersInformation();
    const spoolsArray = [];
    const profilesArray = [];

    for (const pr of profiles) {
      const profile = {
        _id: pr._id,
        manufacturer: pr.profile.manufacturer,
        material: pr.profile.material,
        density: pr.profile.density,
        diameter: pr.profile.diameter
      };
      profilesArray.push(profile);
    }
    for (const sp of spools) {
      const spool = {
        _id: sp._id,
        name: sp.spools.name,
        profile: sp.spools.profile,
        price: sp.spools.price,
        weight: sp.spools.weight,
        used: sp.spools.used,
        remaining: sp.spools.weight - sp.spools.used,
        percent: 100 - (sp.spools.used / sp.spools.weight) * 100,
        tempOffset: sp.spools.tempOffset,
        bedOffset: sp.spools.bedOffset,
        printerAssignment: FilamentCleanerService.getPrinterAssignment(sp._id, farmPrinters),
        fmID: sp.spools.fmID
      };
      spoolsArray.push(spool);
    }


    spoolsClean = spoolsArray;
    profilesClean = profilesArray;

    selectedFilamentList = await FilamentCleanerService.selectedFilament(farmPrinters);
    statisticsClean = FilamentCleanerService.createStatistics(
      spoolsArray,
      profilesArray,
      selectedFilamentList
    );
    FilamentCleanerService.createPrinterList();
    await FilamentCleanerService.dropDownList(
      spools,
      profiles,
      filamentManager,
      selectedFilamentList
    );
    logger.info("Filament information cleaned and ready for consumption...");
  }

  static dropDownList(spools, profiles, filamentManager, selected) {
    const currentSettings = SettingsClean.returnSystemSettings();
    const { filament } = currentSettings;
    const { hideEmpty } = filament;
    const normalDropObject = [this.noSpoolOptions];
    const historyDropObject = [this.noSpoolOptions];
    spools.forEach((spool) => {
      let profileId = null;
      if (filamentManager) {
        profileId = _.findIndex(profiles, function (o) {
          return o.profile.index === spool.spools.profile;
        });
      } else {
        profileId = _.findIndex(profiles, function (o) {
          return o._id == spool.spools.profile;
        });
      }
      const index = _.findIndex(selected, function (o) {
        return o == spool._id;
      });
      if (profileId >= 0) {
        const amountLeft = (spool.spools.weight - spool.spools.used).toFixed(2);

        if (hideEmpty && amountLeft < 1) {
        } else {
          if (filamentManager) {
            historyDropObject.push(`
                  <option value="${spool._id}">${spool.spools.name} (${(
              spool.spools.weight - spool.spools.used
            ).toFixed(2)}g) - ${profiles[profileId].profile.material} (${
              profiles[profileId].profile.manufacturer
            })</option>
              `);
            if (index > -1) {
              normalDropObject.push(`
                  <option value="${spool._id}" disabled>${spool.spools.name} (${(
                spool.spools.weight - spool.spools.used
              ).toFixed(2)}g) - ${profiles[profileId].profile.material} (${
                profiles[profileId].profile.manufacturer
              })</option>
              `);
            } else {
              normalDropObject.push(`
                  <option value="${spool._id}">${spool.spools.name} (${(
                spool.spools.weight - spool.spools.used
              ).toFixed(2)}g) - ${profiles[profileId].profile.material} (${
                profiles[profileId].profile.manufacturer
              })</option>
              `);
            }
          } else {
            historyDropObject.push(`
                  <option value="${spool._id}">${spool.spools.name} - ${profiles[profileId].profile.material} (${profiles[profileId].profile.manufacturer})</option>
              `);
            normalDropObject.push(`
                <option value="${spool._id}">${spool.spools.name} (${(
              spool.spools.weight - spool.spools.used
            ).toFixed(2)}g) - ${profiles[profileId].profile.material} (${
              profiles[profileId].profile.manufacturer
            })</option>
          `);
          }
        }
      }
    });
    dropDownList = {
      normalDropDown: normalDropObject,
      historyDropDown: historyDropObject
    };
  }

  static async selectedFilament(printers) {
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

  static createStatistics(spools, profiles, selectedFilamentList) {
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
      activeSpools: selectedFilamentList,
      activeSpoolCount: selectedFilamentList.length,
      materialBreakDown
    };
  }

  static getPrinterAssignment(spoolID, farmPrinters) {
    const assignments = [];
    for (const printer of farmPrinters) {
      if (
        !!printer &&
        Array.isArray(printer.selectedFilament)
      ) {
        for (let s = 0; s < printer.selectedFilament.length; s++) {
          if (printer.selectedFilament[s] !== null) {
            if (printer.selectedFilament[s]._id.toString() === spoolID.toString()) {
              const printerAssignment = {
                id: printer._id,
                tool: s,
                name: printer.printerName
              };
              assignments.push(printerAssignment);
            }
          }
        }
      }
    }
    return assignments;
  }

  static getPrinterAssignmentList() {
    const spoolList = this.getSpools();

    const assignmentList = [];

    let reducedList = spoolList.filter((spool) => spool?.printerAssignment?.length > 0);

    reducedList.forEach((spool) => {
      spool.printerAssignment.forEach((printer) => {
        assignmentList.push(`${printer.id}-${printer.tool}`);
      });
    });
    return assignmentList;
  }

  static createPrinterList() {
    const farmPrinters = getPrinterStoreCache().listPrintersInformation();
    const multipleSelect = SettingsClean.isMultipleSelectEnabled();

    const printerList = [];
    if(!multipleSelect){
      printerList.push('<option value="0">Not Assigned</option>');
    }

    const assignedPrinters = this.getPrinterAssignmentList();

    for(const printer of farmPrinters){
      if (typeof printer.currentProfile !== "undefined" && printer.currentProfile !== null) {
        for (let i = 0; i < printer.currentProfile.extruder.count; i++) {
          if (assignedPrinters.includes(`${printer._id}-${i}`)) {
            printerList.push(
                `<option value="${printer._id}-${i}" disabled>${printer.printerName}: Tool ${i}</option>`
            );
          } else {
            if (
                printer.printerState.colour.category === "Offline" ||
                printer.printerState.colour.category === "Active" && assignedPrinters.includes(`${printer._id}-${i}`)
          ) {
              printerList.push(
                  `<option value="${printer._id}-${i}" disabled>${printer.printerName}: Tool ${i}</option>`
              );
            } else {
              printerList.push(
                  `<option value="${printer._id}-${i}">${printer.printerName}: Tool ${i}</option>`
              );
            }
          }
        }
      }
    }
    return printerList;
  }
}

module.exports = {
  FilamentClean: FilamentCleanerService
};
