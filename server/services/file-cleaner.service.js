"use strict";

const _ = require("lodash");
const Logger = require("../handlers/logger.js");
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");
const { getMaintenanceCosts, getElectricityCosts } = require("../utils/print-cost.util");

const { getDefaultFileCleanStatistics } = require("../constants/cleaner.constants");

const logger = new Logger(LOGGER_ROUTE_KEYS.SERVICE_FILE_CLEANER);
const cleanFileList = [];
const fileStatistics = getDefaultFileCleanStatistics();

class FileCleanerService {
  static returnFiles(p) {
    return cleanFileList[p];
  }

  static returnStatistics() {
    return fileStatistics;
  }

  static statistics(farmPrinters) {
    const storageFree = [];
    const storageTotal = [];
    const devices = [];
    const fileSizes = [];
    const fileLengths = [];
    const fileCount = [];
    const folderCount = [];
    // Collect unique devices - Total for farm storage should not duplicate storage on instances running on same devices.
    for (const printer of farmPrinters) {
      const fileList = JSON.parse(JSON.stringify(printer.fileList));

      if (!!printer.storage) {
        const device = {
          ip: printer.printerURL,
          index: printer.index,
          storage: printer.storage
        };
        devices.push(device);
      }
      if (!!fileList) {
        for (let i = 0; i < fileList?.fileList?.length; i++) {
          const file = fileList.fileList[i];
          if (!isNaN(file.fileSize)) {
            fileSizes.push(file.fileSize);
          }
          if (!isNaN(file.filamentLength)) {
            fileLengths.push(file.filamentLength / 1000);
          }

          fileCount.push(file);
        }
        for (let i = 0; i < printer.fileList.folderList.length; i++) {
          folderCount.push(printer.fileList.folderList[i]);
        }
      }
    }

    const uniqueDevices = _.uniqBy(devices, "printerURL");
    uniqueDevices.forEach((device) => {
      storageFree.push(device.storage.free);
      storageTotal.push(device.storage.total);
    });

    const storageFreeTotal = storageFree.reduce((a, b) => a + b, 0);
    const storageTotalTotal = storageTotal.reduce((a, b) => a + b, 0);
    fileStatistics.storageUsed = storageTotalTotal - storageFreeTotal;
    fileStatistics.storageTotal = storageTotalTotal;
    fileStatistics.storageRemain = storageFreeTotal;
    fileStatistics.storagePercent =
      storageTotalTotal === 0
        ? 0
        : Math.floor((fileStatistics.storageUsed / storageTotalTotal) * 100);
    fileStatistics.fileCount = fileCount.length;
    fileStatistics.folderCount = folderCount.length;

    if (fileSizes.length !== 0) {
      fileStatistics.biggestFile = Math.max(...fileSizes);
      fileStatistics.smallestFile = Math.min(...fileSizes);
      fileStatistics.averageFile = fileSizes.reduce((a, b) => a + b, 0) / fileCount.length;
    }
    if (fileLengths.length !== 0) {
      fileStatistics.biggestLength = Math.max(...fileLengths);
      fileStatistics.smallestLength = Math.min(...fileLengths);
      fileStatistics.averageLength = fileLengths.reduce((a, b) => a + b, 0) / fileCount.length;
    }
    return fileStatistics;
  }

  static generate(fileList, selectedFilament, costSettings) {
    if (!fileList) {
      logger.error("Printer File Cleaner failed: farmPrinter:fileList not defined.");
      return;
    }

    const sortedFileList = [];
    if (!!fileList?.fileList) {
      for (let file of fileList.fileList) {
        const electricityCosts = getElectricityCosts(file.time, costSettings);
        const maintenanceCosts = getMaintenanceCosts(file.time, costSettings);
        const printCost = electricityCosts + maintenanceCosts;
        const sortedFile = {
          path: file.path,
          fullPath: file.fullPath,
          display: file.display,
          name: file.name,
          uploadDate: file.date,
          fileSize: file.size,
          thumbnail: file.thumbnail,
          toolUnits: "",
          toolCosts: "",
          success: file.success,
          failed: file.failed,
          last: file.last,
          expectedPrintTime: file.time,
          filamentLength: file?.length || 0,
          printCost,
          electricityCosts,
          maintenanceCosts
        };
        sortedFile.toolUnits = FileCleanerService.getUnits(
          selectedFilament,
          sortedFile.filamentLength
        );
        sortedFile.toolCosts = FileCleanerService.getCost(selectedFilament, sortedFile.toolUnits);
        if (!!file?.date && typeof file.date === "number") {
          sortedFileList.push(sortedFile);
        }
      }
    }

    return {
      fileList: sortedFileList,
      filecount: sortedFileList?.length || 0,
      folderList: fileList?.folderList || [],
      folderCount: fileList?.folderList.length || 0
    };
  }

  static generateSingle(file, selectedFilament, costSettings) {
    if (!file) {
      logger.error("Printer File Cleaner failed: file not defined.");
      return;
    }

    const electricityCosts = getElectricityCosts(file.time, costSettings);

    const maintenanceCosts = getMaintenanceCosts(file.time, costSettings);
    const printCost = electricityCosts + maintenanceCosts;

    const sortedFile = {
      path: file.path,
      fullPath: file.fullPath,
      display: file.display,
      name: file.name,
      uploadDate: file.date,
      fileSize: file.size,
      thumbnail: file.thumbnail,
      toolUnits: "",
      toolCosts: "",
      success: file.success,
      failed: file.failed,
      last: file.last,
      expectedPrintTime: file.time,
      filamentLength: file.length,
      printCost,
      electricityCosts,
      maintenanceCosts
    };
    sortedFile.toolUnits = FileCleanerService.getUnits(selectedFilament, sortedFile.filamentLength);
    sortedFile.toolCosts = FileCleanerService.getCost(selectedFilament, sortedFile.toolUnits);

    return sortedFile;
  }

  /**
   * @param filamentSelection
   * @param fileLength
   * @returns {*[]}
   */
  static getUnits(filamentSelection, fileLength) {
    const strings = [];
    const lengthArray = [];
    const weightArray = [];
    if (!!fileLength) {
      for (let l = 0; l < fileLength.length; l++) {
        const length = fileLength[l] / 1000;
        if (typeof filamentSelection !== "undefined" && Array.isArray(filamentSelection)) {
          if (filamentSelection[l] === null) {
            const radius = 1.75 / 2;
            const volume = length * Math.PI * radius * radius;
            const usage = volume * 1.24;
            lengthArray.push(length);
            weightArray.push(usage);
            strings.push(`<b>Tool ${l}:</b> ${length.toFixed(2)}m / ${usage.toFixed(2)}g`);
          } else if (typeof filamentSelection[l] !== "undefined") {
            const radius = parseFloat(filamentSelection[l].spools.profile.diameter) / 2;
            const volume = length * Math.PI * radius * radius;
            const usage = volume * parseFloat(filamentSelection[l].spools.profile.density);
            lengthArray.push(length);
            weightArray.push(usage);
            strings.push(`<b>Tool ${l}:</b> ${length.toFixed(2)}m / ${usage.toFixed(2)}g`);
          } else {
            lengthArray.push(0);
            weightArray.push(0);
            strings.push(`<b>Tool ${l}:</b> (No Spool)`);
          }
        } else {
          lengthArray.push(0);
          weightArray.push(0);
          strings.push(`<b>Tool ${l}:</b> (No Spool)`);
        }
      }

      const totalLength = lengthArray.reduce((a, b) => a + b, 0);
      const totalGrams = weightArray.reduce((a, b) => a + b, 0);
      const total = `<b>Total: </b>${totalLength.toFixed(2)}m / ${totalGrams.toFixed(2)}g`;
      strings.unshift(total);
      return strings;
    }
    return [];
  }

  /**
   * @param filamentSelection
   * @param units
   * @returns {*[]}
   */
  static getCost(filamentSelection, units) {
    units = JSON.parse(JSON.stringify(units));
    if (!Array.isArray(units) || units.length === 0) {
      return [];
    }

    const strings = [];
    const costArray = [];
    filamentSelection = JSON.parse(JSON.stringify(filamentSelection));
    filamentSelection.unshift("SKIP");
    for (let u = 0; u < units.length; u++) {
      if (typeof filamentSelection !== "undefined" && Array.isArray(filamentSelection)) {
        if (filamentSelection[u] === "SKIP") {
          //Skip
        } else if (typeof filamentSelection[u] !== "undefined" && filamentSelection[u] !== null) {
          let newUnit = units[u].split(" / ");
          newUnit = newUnit[1].replace("g", "");
          if (!units[u].includes("Total")) {
            const cost = (
              (filamentSelection[u].spools.price / filamentSelection[u].spools.weight) *
              parseFloat(newUnit)
            ).toFixed(2);
            costArray.push(parseFloat(cost));
            strings.push(cost);
          }
        } else {
          costArray.push(0);
          strings.push("(No Spool)");
        }
      } else {
        costArray.push(0);
        strings.push("(No Spool)");
      }
    }
    const totalCost = costArray.reduce((a, b) => a + b, 0);
    strings.unshift(totalCost.toFixed(2));
    return strings;
  }

  static listFilesOlderThanX(fileList, days) {
    const today = new Date();
    today.setDate(today.getDate() - days);
    const deleteList = [];
    for (const file of fileList) {
      if (new Date(file.date * 1000) < today) {
        deleteList.push(file.fullPath);
      }
    }
    return deleteList;
  }
}

module.exports = {
  FileClean: FileCleanerService
};
