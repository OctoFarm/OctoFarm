"use strict";

const { findIndex } = require("lodash");
const { DateTime } = require("luxon");
const { getElectricityCosts, getMaintenanceCosts } = require("../utils/print-cost.util");
const { HistoryClean } = require("./history-cleaner.service.js");
const { floatOrZero } = require("../utils/number.util");
const Logger = require("../handlers/logger");
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");
const logger = new Logger(LOGGER_ROUTE_KEYS.SERVICE_JOB_CLEANER);

const cleanJobs = [];

class JobCleanerService {
  static getCompletionDate(printTimeLeftSeconds, completion) {
    if (completion === 100) {
      return "No Active Job";
    }

    const printDoneDT = DateTime.now().plus({ seconds: printTimeLeftSeconds });
    return printDoneDT.toFormat("ccc LLL dd yyyy: HH:mm");
  }

  static getCleanJobAtIndex(p) {
    return cleanJobs[p];
  }

  /**
   * Generate current job report
   * @param printerJob
   * @param selectedFilament
   * @param fileList
   * @param currentZ
   * @param costSettings
   * @param printerProgress
   * @returns {{fileName: string, thumbnail: null, filePath: string, currentZ: number, expectedPrintTime: null, printTimeRemaining: null, printTimeElapsed: null, expectedFilamentCosts: null, expectedTotals: null, lastPrintTime: null, fileDisplay: string, averagePrintTime: null, progress: number, expectedCompletionDate: null, expectedPrinterCosts: null}}
   */
  static generate(printerJob, selectedFilament, fileList, currentZ, costSettings, printerProgress) {
    const currentJob = {
      progress: 0,
      fileName: "No File Selected",
      fileDisplay: "No File Selected",
      filePath: "No File Selected",
      expectedCompletionDate: null,
      expectedPrintTime: null,
      expectedFilamentCosts: null,
      expectedPrinterCosts: null,
      expectedTotals: null,
      expectedMaintenanceCosts: null,
      expectedElectricityCosts: null,
      currentZ: 0,
      printTimeElapsed: null,
      printTimeRemaining: null,
      averagePrintTime: null,
      lastPrintTime: null,
      thumbnail: null
    };

    if (!!printerJob) {
      if (!!printerJob?.file?.name) {
        currentJob.fileName = printerJob.file.name;

        const fileIndex = findIndex(fileList.fileList, (o) => {
          return o.fullPath === printerJob.file.path;
        });
        if (fileIndex > -1) {
          currentJob.thumbnail = fileList.fileList[fileIndex]?.thumbnail;
        }
      }
      if (!!printerJob?.file?.display) currentJob.fileDisplay = printerJob.file.display;

      if (!!printerJob?.file?.path) currentJob.filePath = printerJob.file.path;
      if (!!printerJob?.averagePrintTime) currentJob.averagePrintTime = printerJob.averagePrintTime;
      if (!!printerJob?.lastPrintTime) currentJob.lastPrintTime = printerJob.lastPrintTime;

      if (!!currentZ) {
        currentJob.currentZ = currentZ;
      }
      currentJob.expectedElectricityCosts = getElectricityCosts(
        printerJob.estimatedPrintTime,
        costSettings
      );
      currentJob.expectedMaintenanceCosts = getMaintenanceCosts(
        printerJob.estimatedPrintTime,
        costSettings
      );
      currentJob.expectedPrinterCosts =
        currentJob.expectedElectricityCosts + currentJob.expectedMaintenanceCosts;

      currentJob.expectedFilamentCosts = HistoryClean.getSpool(
        selectedFilament,
        printerJob,
        true,
        printerJob.estimatedPrintTime
      );

      let spoolCost = 0;
      let totalVolume = 0;
      let totalLength = 0;
      let totalWeight = 0;
      if (!!currentJob.expectedFilamentCosts) {
        const keys = Object.keys(currentJob.expectedFilamentCosts);
        for (let s = 0; s < currentJob.expectedFilamentCosts.length; s++) {
          const toolFilamentCosts = currentJob.expectedFilamentCosts[s][`tool${keys[s]}`];
          if (!!toolFilamentCosts) {
            spoolCost += floatOrZero(toolFilamentCosts.cost);
            totalVolume += floatOrZero(toolFilamentCosts.volume);
            totalLength += floatOrZero(toolFilamentCosts.length);
            totalWeight += floatOrZero(toolFilamentCosts.weight);
          }
        }
      }
      spoolCost = floatOrZero(spoolCost);
      currentJob.expectedTotals = {
        totalCost: (parseFloat(currentJob.expectedPrinterCosts) + spoolCost).toFixed(2),
        totalVolume,
        totalLength,
        totalWeight,
        spoolCost
      };
    }

    if (!!printerProgress) {
      currentJob.progress = Math.floor(printerProgress.completion);
      currentJob.printTimeRemaining = printerProgress.printTimeLeft;
      currentJob.printTimeElapsed = printerProgress.printTime;
      currentJob.expectedPrintTime =
        Math.round((printerProgress.printTimeLeft + printerProgress.printTime) / 1000) * 1000;
      currentJob.expectedCompletionDate = JobCleanerService.getCompletionDate(
        printerProgress.printTimeLeft,
        printerProgress.completion
      );
    }
    logger.debug("Job information cleaned and ready for consumption", currentJob);
    return currentJob;
  }
}

module.exports = {
  JobClean: JobCleanerService
};
