const historyClean = require("./historyClean.js");

const { HistoryClean } = historyClean;
// eslint-disable-next-line import/order
const _ = require("lodash");

const cleanJobs = [];

class JobClean {
  static async getCompletionDate(printTimeLeft, completion) {
    let currentDate = new Date();
    let dateComplete = "";
    if (completion === 100) {
      dateComplete = "No Active Job";
    } else {
      currentDate = currentDate.getTime();
      const futureDateString = new Date(
        currentDate + printTimeLeft * 1000
      ).toDateString();
      let futureTimeString = new Date(
        currentDate + printTimeLeft * 1000
      ).toTimeString();
      futureTimeString = futureTimeString.substring(0, 5);
      dateComplete = `${futureDateString}: ${futureTimeString}`;
    }
    return dateComplete;
  }

  static returnJob(p) {
    return cleanJobs[p];
  }

  static async generate(farmPrinter, selectedFilament) {
    const printer = farmPrinter;

    if (typeof farmPrinter.systemChecks !== "undefined") {
      farmPrinter.systemChecks.cleaning.job.status = "warning";
    }

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
      thumbnail: null,
    };
    if (typeof printer.job !== "undefined") {
      currentJob.fileName = printer.job.file.name;
      const fileIndex = _.findIndex(printer.fileList.files, function (o) {
        return o.name == printer.job.file.name;
      });
      if (fileIndex > -1) {
        currentJob.thumbnail = printer.fileList.files[fileIndex].thumbnail;
      }
      currentJob.fileDisplay = printer.job.file.display;
      currentJob.filePath = printer.job.file.path;
      currentJob.expectedPrintTime = printer.job.estimatedPrintTime;
      currentJob.averagePrintTime = printer.job.averagePrintTime;
      currentJob.lastPrintTime = printer.job.lastPrintTime;
      if (typeof printer.currentZ !== "undefined") {
        currentJob.currentZ = printer.currentZ;
      }
      currentJob.expectedPrinterCosts = await HistoryClean.getPrintCost(
        printer.job.estimatedPrintTime,
        printer.costSettings
      );
      currentJob.expectedFilamentCosts = await HistoryClean.getSpool(
        selectedFilament,
        printer.job,
        true,
        printer.job.estimatedPrintTime
      );
      const numOr0 = (n) => (isNaN(n) ? 0 : parseFloat(n));
      let spoolCost = 0;
      let totalVolume = 0;
      let totalLength = 0;
      let totalWeight = 0;
      if (
        typeof currentJob.expectedFilamentCosts !== "undefined" &&
        currentJob.expectedFilamentCosts !== null
      ) {
        const keys = Object.keys(currentJob.expectedFilamentCosts);
        for (let s = 0; s < currentJob.expectedFilamentCosts; s++) {
          if (
            typeof currentJob.expectedFilamentCosts[s][`tool${keys[s]}`] !==
            "undefined"
          ) {
            spoolCost += numOr0(
              currentJob.expectedFilamentCosts[s][`tool${keys[s]}`].cost
            );
            totalVolume += numOr0(
              currentJob.expectedFilamentCosts[s][`tool${keys[s]}`].volume
            );
            totalLength += numOr0(
              currentJob.expectedFilamentCosts[s][`tool${keys[s]}`].length
            );
            totalWeight += numOr0(
              currentJob.expectedFilamentCosts[s][`tool${keys[s]}`].weight
            );
          }
        }
      }
      spoolCost = numOr0(spoolCost);
      currentJob.expectedTotals = {
        totalCost: (
          parseFloat(currentJob.expectedPrinterCosts) + parseFloat(spoolCost)
        ).toFixed(2),
        totalVolume: parseFloat(totalVolume),
        totalLength: parseFloat(totalLength),
        totalWeight: parseFloat(totalWeight),
        spoolCost: parseFloat(spoolCost),
      };
    }

    if (typeof printer.progress !== "undefined") {
      currentJob.progress = printer.progress.completion;
      currentJob.printTimeRemaining = printer.progress.printTimeLeft;
      currentJob.printTimeElapsed = printer.progress.printTime;
      currentJob.expectedCompletionDate = await JobClean.getCompletionDate(
        printer.progress.printTimeLeft,
        printer.progress.completion
      );
    }
    if (typeof farmPrinter.systemChecks !== "undefined") {
      farmPrinter.systemChecks.cleaning.job.status = "success";
      farmPrinter.systemChecks.cleaning.job.date = new Date();
    }
    cleanJobs[printer.sortIndex] = currentJob;
  }
}
module.exports = {
  JobClean,
};
