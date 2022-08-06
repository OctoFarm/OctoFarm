"use strict";

const _ = require("lodash");
const Logger = require("../handlers/logger.js");
const Spools = require("../models/Filament.js");
const Profiles = require("../models/Profiles.js");
const { SettingsClean } = require("./settings-cleaner.service");
const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");
const { findIndex } = require("lodash");
const logger = new Logger(LOGGER_ROUTE_KEYS.SERVICE_FILAMENT_CLEANER);

let spoolsClean = [];
let profilesClean = [];
let statisticsClean = [];
let selectedFilamentList = [];
let dropDownList = {
  normalDropDown: [],
  historyDropDown: []
};

class FilamentCleanerService {
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
    await FilamentCleanerService.dropDownList(spools, profiles, selectedFilamentList);
    logger.info("Filament information cleaned and ready for consumption...");
  }

  static removeSelectedSpoolsFromList(selectedFilament) {
    selectedFilament.forEach((filament) => {
      const currentSpool = findIndex(selectedFilamentList, function (o) {
        return o === filament._id.toString();
      });
      if (currentSpool > -1) {
        selectedFilamentList.splice(currentSpool, 1);
      }
    });
    FilamentCleanerService.start().catch((e) => {
      logger.error("Unable to clean filament", e.toString());
    });
  }

  static dropDownList(spools, profiles, selected) {
    const currentSettings = SettingsClean.returnSystemSettings();
    const { filament } = currentSettings;
    const { hideEmpty } = filament;

    const createList = [];
    spools.forEach((spool) => {
      let profileId = _.findIndex(profiles, function (o) {
        return o._id.toString() === spool.spools.profile.toString();
      });

      const index = _.findIndex(selected, function (o) {
        return o.toString() === spool._id.toString();
      });

      if (profileId < 0) {
        logger.error("Unable to match profile to spool!", spool);
      }

      if (profileId >= 0) {
        const amountLeft = parseInt(spool.spools.weight) - parseInt(spool.spools.used);

        logger.debug("Seeings for spool", {
          hideEmpty,
          amountLeft
        });

        let showSpool = true;

        if (!hideEmpty && amountLeft < 1) {
          // spool should hide
          showSpool = false;
        }

        if (showSpool) {
          createList.push({
            spoolID: spool._id,
            spoolName: spool.spools.name,
            spoolWeight: spool.spools.weight,
            spoolUsed: spool.spools.used,
            spoolRemain: amountLeft,
            spoolMaterial: profiles[profileId].profile.material,
            spoolManufacturer: profiles[profileId].profile.manufacturer,
            selected: index > -1
          });
        }
      }
    });
    dropDownList = createList;
  }

  static async selectedFilament(printers) {
    const selectedArray = [];
    for (const printer of printers) {
      if (typeof printer !== "undefined" && Array.isArray(printer.selectedFilament)) {
        for (const [f, selectedFilament] of printer.selectedFilament.entries()) {
          if (selectedFilament !== null) {
            selectedArray.push(printer.selectedFilament[f]._id);
          }
        }
      }
    }
    return selectedArray;
  }

  static createStatistics(spools, profiles, usedFilamentList) {
    const materials = [];
    let materialBreak = [];
    for (const element of profiles) {
      materials.push(element.material);
      const material = {
        name: element.material,
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
    for (const element of spools) {
      if (element.used <= element.weight) {
        used.push(parseFloat(element.used));
        total.push(parseFloat(element.weight));
        price.push(parseFloat(element.price));
      }
      const profInd = _.findIndex(profiles, function (o) {
        return o._id.toString() === element.profile.toString();
      });
      if (profInd > -1) {
        const index = _.findIndex(materialBreak, function (o) {
          return o.name === profiles[profInd].material;
        });
        if (element.used <= element.weight) {
          materialBreak[index].weight.push(parseFloat(element.weight));
          materialBreak[index].used.push(parseFloat(element.used));
          materialBreak[index].price.push(parseFloat(element.price));
        }
      }
    }

    const materialBreakDown = [];
    for (const element of materialBreak) {
      const mat = {
        name: element.name,
        used: element.used.reduce((a, b) => a + b, 0),
        total: element.weight.reduce((a, b) => a + b, 0),
        price: element.price.reduce((a, b) => a + b, 0)
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
      activeSpools: usedFilamentList,
      activeSpoolCount: usedFilamentList.length,
      materialBreakDown
    };
  }

  static getPrinterAssignment(spoolID, farmPrinters) {
    const assignments = [];
    for (const printer of farmPrinters) {
      if (!!printer && Array.isArray(printer.selectedFilament)) {
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
    if (!multipleSelect) {
      printerList.push('<option value="0">Not Assigned</option>');
    }

    const assignedPrinters = this.getPrinterAssignmentList();

    for (const printer of farmPrinters) {
      if (typeof printer.currentProfile !== "undefined" && printer.currentProfile !== null) {
        for (let i = 0; i < printer.currentProfile.extruder.count; i++) {
          if (assignedPrinters.includes(`${printer._id}-${i}`)) {
            printerList.push(
              `<option value="${printer._id}-${i}" disabled>${printer.printerName}: Tool ${i}</option>`
            );
          } else {
            if (
              printer.printerState.colour.category === "Offline" ||
              (printer.printerState.colour.category === "Active" &&
                assignedPrinters.includes(`${printer._id}-${i}`))
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
