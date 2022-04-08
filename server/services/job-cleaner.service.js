"use strict";

const { findIndex } = require("lodash");
const { DateTime } = require("luxon");
const { getPrintCostNumeric } = require("../utils/print-cost.util");
const { HistoryClean } = require("./history-cleaner.service.js");
const { floatOrZero } = require("../utils/number.util");

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
   * @param printer
   * @param currentZ
   * @param costSettings
   * @param printerProgress
   * @returns {{fileName: string, thumbnail: null, filePath: string, currentZ: null, expectedPrintTime: null, printTimeRemaining: null, printTimeElapsed: null, expectedFilamentCosts: null, expectedTotals: null, lastPrintTime: null, fileDisplay: string, averagePrintTime: null, progress: number, expectedCompletionDate: null, expectedPrinterCosts: null}}
   */
  static generate(printerJob, selectedFilament, printer, currentZ, costSettings, printerProgress) {
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
      currentZ: null,
      printTimeElapsed: null,
      printTimeRemaining: null,
      averagePrintTime: null,
      lastPrintTime: null,
      thumbnail: null
    };

    // console.log(selectedFilament);

    if (!!printerJob) {
      if (!!printerJob?.file?.name) {
        currentJob.fileName = printerJob.file.name;
        const foundFile = findIndex(printer?.fileList.fileList, (o) => {
          return o.name === printerJob.file.name;
        });
        if (!!foundFile) {
          currentJob.thumbnail = printer.fileList.fileList[foundFile]?.thumbnail;
        }
      }
      if (!!printerJob?.file?.display) currentJob.fileDisplay = printerJob.file.display;

      if (!!printerJob?.file?.path) currentJob.filePath = printerJob.file.path;
      if (!!printerJob?.averagePrintTime) currentJob.averagePrintTime = printerJob.averagePrintTime;
      if (!!printerJob?.lastPrintTime) currentJob.lastPrintTime = printerJob.lastPrintTime;

      if (!!currentZ) {
        currentJob.currentZ = currentZ;
      }

      currentJob.expectedPrinterCosts = getPrintCostNumeric(
        printerJob.estimatedPrintTime,
        costSettings
      )?.toFixed(2);

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

    return currentJob;
  }
}

module.exports = {
  JobClean: JobCleanerService
};
