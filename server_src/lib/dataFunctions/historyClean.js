"use strict";

const { arrayCounts, checkNested, checkNestedIndex } = require("../../utils/array.util");
const { getPrintCostNumeric } = require("../../utils/print-cost.util");
const {
  getDefaultHistoryStatistics,
  ALL_MONTHS,
  DEFAULT_SPOOL_RATIO,
  DEFAULT_SPOOL_DENSITY
} = require("../providers/cleaner.constants");
const historyService = require("../../services/history.service");
const Logger = require("../../handlers/logger.js");
const serverSettingsCache = require("../../settings/serverSettings");
const { noCostSettingsMessage } = require("../../utils/print-cost.util");
const { stateToHtml } = require("../../utils/html.util");
const { toDefinedKeyValue } = require("../../utils/property.util");
const { floatOrZero } = require("../../utils/number.util");
const { toTimeFormat } = require("../../utils/time.util");

let logger;

class HistoryClean {
  // Might seem weird, but this is V2 prep-work
  historyService = null;
  enableLogging = false;
  logger = logger;
  historyClean = [];
  pagination = {};
  statisticsClean = getDefaultHistoryStatistics();

  constructor(enableFileLogging = false, logLevel = "warn") {
    this.historyService = historyService;
    this.logger = new Logger("OctoFarm-InformationCleaning", enableFileLogging, logLevel);
    this.enableLogging = enableFileLogging || false;
  }

  /**
   * Calculate spool weight static (has nothing to do with cleaning state)
   * @param length
   * @param filament
   * @param completionRatio
   * @returns {string|*|number}
   */
  static calcSpoolWeightAsString(length, filament, completionRatio) {
    if (!length) {
      return length === 0 ? 0 : length;
    }

    let density = DEFAULT_SPOOL_DENSITY;
    let radius = DEFAULT_SPOOL_RATIO;
    // TODO improve illegality checks (if one is non-numeric, the weight becomes NaN)
    if (!!filament?.spools?.profile) {
      radius = parseFloat(filament.spools.profile.diameter) / 2;
      density = parseFloat(filament.spools.profile.density);
    }

    const volume = length * Math.PI * radius * radius; // Repeated 4x across server
    return (completionRatio * volume * density).toFixed(2);
  }

  static getSpoolLabel(id) {
    const spool = id?.spools;
    if (!spool) {
      return null;
    }

    let spoolLeftoverConditional = "";
    if (serverSettingsCache.filamentManager) {
      const spoolWeight = (spool.weight - spool.used).toFixed(0);
      spoolLeftoverConditional = `(${spoolWeight}g)`;
    }
    return `${spool.name} ${spoolLeftoverConditional} - ${spool.profile?.material}`;
  }

  static getCostAsString(grams, spool, completionRatio) {
    if (!spool) {
      return "0.00";
    }
    return completionRatio * ((spool.spools.price / spool.spools.weight) * grams).toFixed(2);
  }

  static getJobAnalysis(job, printTime) {
    return !!job
      ? {
          actualPrintTime: printTime,
          estimatedPrintTime: job.estimatedPrintTime,
          printTimeAccuracy: ((printTime - job.estimatedPrintTime) / printTime) * 10000 // TODO can become NaN (2x)
        }
      : null;
  }

  /**
   * TODO needs cleanup or annotation
   * @param input
   * @returns {{x: Date, y: *}[]}
   */
  static sumValuesGroupByDate(input) {
    let dates = {};
    input.forEach((dv) => (dates[dv.x] = (dates[dv.x] || 0) + dv.y));
    return Object.keys(dates).map((date) => ({
      x: new Date(date),
      y: dates[date]
    }));
  }

  /**
   * Cumulative sum operator over numeric-only Y-values
   * @param input
   * @returns {[]}
   */
  static assignYCumSum(input) {
    let cumSum = 0;
    return input
      .filter((elem) => elem?.hasOwnProperty("x"))
      .map((elem) => ({
        x: elem?.x,
        y: (cumSum += elem?.y || 0)
      }));
  }

  static getSpool(filamentSelection, job, success, time) {
    // Fix for old database states
    if (!job?.filament) {
      return null;
    }

    let printPercentage = 0;
    if (!success) {
      // TODO what if estimatedPrintTime is falsy? Should become partial result.
      printPercentage = (time / job.estimatedPrintTime) * 100;
    }
    // TODO ehm?
    job = job.filament;

    const spools = [];
    for (const key of Object.keys(job)) {
      const keyIndex = Object.keys(job).indexOf(key);
      const filamentEntry = Array.isArray(filamentSelection)
        ? filamentSelection[keyIndex]
        : filamentSelection;
      const metric = job[key];
      let completionRatio = success ? 1.0 : printPercentage / 100;

      const spoolWeight = HistoryClean.calcSpoolWeightAsString(
        metric.length / 1000,
        filamentEntry,
        completionRatio
      );
      const spoolName = HistoryClean.getSpoolLabel(filamentEntry);
      spools.push({
        [key]: {
          toolName: "Tool " + key.substring(4, 5),
          spoolName,
          spoolId: filamentEntry?._id || null, // TODO discuss fallback null or undefined
          volume: (completionRatio * metric.volume).toFixed(2),
          length: ((completionRatio * metric.length) / 1000).toFixed(2),
          weight: spoolWeight,
          cost: HistoryClean.getCostAsString(spoolWeight, filamentEntry, completionRatio),
          type: filamentEntry?.spools?.profile?.material || ""
        }
      });
    }
    return spools;
  }

  static processHistorySpools(historyCleanEntry, usageOverTime, totalByDay, historyByDay) {
    const spools = historyCleanEntry?.spools;
    const historyState = historyCleanEntry.state;

    if (!!spools) {
      spools.forEach((spool) => {
        const keys = Object.keys(spool);
        for (const key of keys) {
          // Check if type exists
          let searchKeyword = "";
          let checkNestedResult = checkNested(spool[key].type, totalByDay);
          if (!!checkNestedResult) {
            // TODO state is being rechecked uselessly
            let checkNestedIndexHistoryRates = null;
            if (historyState.includes("success")) {
              searchKeyword = "Success";
            } else if (historyState.includes("warning")) {
              searchKeyword = "Cancelled";
            } else if (historyState.includes("danger")) {
              searchKeyword = "Failed";
            } else {
              return;
            }
            checkNestedIndexHistoryRates = checkNestedIndex(searchKeyword, historyByDay);

            let checkNestedIndexByDay = checkNestedIndex(spool[key].type, usageOverTime);
            let usageWeightCalc = historyCleanEntry.totalWeight;
            if (!!usageOverTime[checkNestedIndexByDay].data[0]) {
              usageWeightCalc =
                usageOverTime[checkNestedIndexByDay].data[
                  usageOverTime[checkNestedIndexByDay].data.length - 1
                ].y + historyCleanEntry.totalWeight;
            }

            let checkedIndex = checkNestedIndex(spool[key].type, totalByDay);
            let weightCalcSan = parseFloat(historyCleanEntry.totalWeight.toFixed(2));

            // Don't include 0 weights
            if (weightCalcSan > 0) {
              let historyDate = historyCleanEntry.endDate;
              let dateSplit = historyDate.split(" ");
              let month = ALL_MONTHS.indexOf(dateSplit[1]);
              let dateString = `${parseInt(dateSplit[3])}-${month + 1}-${parseInt(dateSplit[2])}`;
              let dateParse = new Date(dateString);
              // Check if more than 90 days ago...
              totalByDay[checkedIndex].data.push({
                x: dateParse,
                y: weightCalcSan
              });
              usageOverTime[checkedIndex].data.push({
                x: dateParse,
                y: weightCalcSan
              });
              historyByDay[checkNestedIndexHistoryRates].data.push({
                x: dateParse,
                y: 1
              });
            }
          } else {
            if (spool[key].type !== "") {
              totalByDay.push({
                name: spool[key].type,
                data: []
              });
            }
            if (spool[key].type !== "") {
              usageOverTime.push({
                name: spool[key].type,
                data: []
              });
            }
            if (!historyByDay[0]) {
              historyByDay.push({
                name: "Success",
                data: []
              });
              historyByDay.push({
                name: "Failed",
                data: []
              });
              historyByDay.push({
                name: "Cancelled",
                data: []
              });
            }
          }
        }
      });
    }

    return {
      usageOverTime,
      totalByDay,
      historyByDay
    };
  }

  generateStatistics(historyData) {
    let completedJobsCount = 0;
    let cancelledCount = 0;
    let failedCount = 0;
    const printTimes = [];
    const fileNames = [];
    const printerNames = [];
    const filamentWeight = [];
    const filamentLength = [];
    const printCost = [];
    const filamentCost = [];
    const failedPrintTime = [];

    const usageOverTime = [];
    const totalByDay = [];
    const historyByDay = [];

    let currentHistory = this.historyClean;

    if (historyData) {
      currentHistory = historyData;
    }

    for (let h = 0; h < currentHistory.length; h++) {
      const { printerCost, file, totalLength, state, printTime, printer, totalWeight, spoolCost } =
        currentHistory[h];

      if (state.includes("success")) {
        completedJobsCount++;
        printTimes.push(printTime);
        fileNames.push(file.name);
        printerNames.push(printer);
        filamentWeight.push(totalWeight);
        filamentLength.push(totalLength);
        printCost.push(parseFloat(printerCost));
      } else if (state.includes("warning")) {
        cancelledCount++;
        failedPrintTime.push(printTime);
      } else if (state.includes("danger")) {
        failedCount++;
        failedPrintTime.push(printTime);
      }
      filamentCost.push(spoolCost);

      HistoryClean.processHistorySpools(currentHistory[h], usageOverTime, totalByDay, historyByDay);
    }

    // TODO huge refactor #2
    const totalFilamentWeight = filamentWeight.reduce((a, b) => a + b, 0);
    const totalFilamentLength = filamentLength.reduce((a, b) => a + b, 0);
    const filesArray = arrayCounts(fileNames);
    let mostPrintedFile = "No Files";
    if (filesArray[0].length !== 0) {
      const countFilesArray = filesArray[1].indexOf(Math.max(...filesArray[1]));
      mostPrintedFile = filesArray[0][countFilesArray];
      mostPrintedFile = mostPrintedFile.replace(/_/g, " ");
    }
    const printerNamesArray = arrayCounts(printerNames);
    let mostUsedPrinter = "No Printers";
    let leastUsedPrinter = "No Printers";
    if (printerNamesArray[0].length !== 0) {
      const maxIndexPrinterNames = printerNamesArray[1].indexOf(Math.max(...printerNamesArray[1]));
      const minIndexPrinterNames = printerNamesArray[1].indexOf(Math.min(...printerNamesArray[1]));
      mostUsedPrinter = printerNamesArray[0][maxIndexPrinterNames];
      leastUsedPrinter = printerNamesArray[0][minIndexPrinterNames];
    }
    const statTotal = completedJobsCount + cancelledCount + failedCount;
    totalByDay.forEach((usage) => {
      usage.data = HistoryClean.sumValuesGroupByDate(usage.data);
    });
    usageOverTime.forEach((usage) => {
      usage.data = HistoryClean.sumValuesGroupByDate(usage.data);
    });
    usageOverTime.forEach((usage) => {
      usage.data = HistoryClean.assignYCumSum(usage.data);
    });
    historyByDay.forEach((usage) => {
      usage.data = HistoryClean.sumValuesGroupByDate(usage.data);
    });

    return {
      completed: completedJobsCount,
      cancelled: cancelledCount,
      failed: failedCount,
      completedPercent: ((completedJobsCount / statTotal) * 100).toFixed(2),
      cancelledPercent: ((cancelledCount / statTotal) * 100).toFixed(2),
      failedPercent: ((failedCount / statTotal) * 100).toFixed(2),
      longestPrintTime: Math.max(...printTimes).toFixed(2),
      shortestPrintTime: Math.min(...printTimes).toFixed(2),
      averagePrintTime: (printTimes.reduce((a, b) => a + b, 0) / printTimes.length).toFixed(2),
      mostPrintedFile,
      printerMost: mostUsedPrinter,
      printerLoad: leastUsedPrinter,
      totalFilamentUsage:
        totalFilamentWeight.toFixed(2) + "g / " + totalFilamentLength.toFixed(2) + "m",
      averageFilamentUsage:
        (totalFilamentWeight / filamentWeight.length).toFixed(2) +
        "g / " +
        (totalFilamentLength / filamentLength.length).toFixed(2) +
        "m",
      highestFilamentUsage:
        Math.max(...filamentWeight).toFixed(2) +
        "g / " +
        Math.max(...filamentLength).toFixed(2) +
        "m",
      lowestFilamentUsage:
        Math.min(...filamentWeight).toFixed(2) +
        "g / " +
        Math.min(...filamentLength).toFixed(2) +
        "m",
      totalSpoolCost: filamentCost.reduce((a, b) => a + b, 0).toFixed(2),
      highestSpoolCost: Math.max(...filamentCost).toFixed(2),
      totalPrinterCost: printCost.reduce((a, b) => a + b, 0).toFixed(2),
      highestPrinterCost: Math.max(...printCost).toFixed(2),
      currentFailed: failedPrintTime.reduce((a, b) => a + b, 0),
      totalByDay: totalByDay,
      usageOverTime: usageOverTime,
      historyByDay: historyByDay
    };
  }

  /**
   * Set the initial state for the history cache
   * @returns {Promise<{historyArray: *[], pagination, statistics: {currentFailed: *, historyByDay: *[], usageOverTime: *[], totalPrinterCost, highestFilamentUsage: string, completed: number, failed: number, failedPercent: string, lowestFilamentUsage: string, printerLoad: string, totalFilamentUsage: string, totalSpoolCost, highestSpoolCost: string, completedPercent: string, longestPrintTime: string, printerMost: string, cancelledPercent: string, highestPrinterCost: string, shortestPrintTime: string, averageFilamentUsage: string, averagePrintTime: string, cancelled: number, mostPrintedFile: string, totalByDay: *[]}}>}
   */
  async initCache(findOptions = {}, paginationOptions = undefined) {
    let returnData = false;
    if (paginationOptions) {
      returnData = true;
    }

    const { itemList, pagination } = await this.historyService.find(findOptions, paginationOptions);
    const historyEntities = itemList ?? [];
    if (!historyEntities?.length) {
      return itemList;
    }

    const historyArray = [];
    for (let hist of historyEntities) {
      const printHistory = hist.printHistory;
      const printCost = getPrintCostNumeric(printHistory.printTime, printHistory.costSettings);
      const printSummary = {
        _id: hist._id,
        index: printHistory.historyIndex,
        state: stateToHtml(printHistory.success, printHistory?.reason),
        printer: printHistory.printerName,
        file: this.historyService.getFileFromHistoricJob(printHistory),
        startDate: printHistory.startDate,
        endDate: printHistory.endDate,
        printTime: printHistory.printTime,
        notes: printHistory.notes,
        printerCost: printCost?.toFixed(2) || noCostSettingsMessage,
        spools: HistoryClean.getSpool(
          printHistory.filamentSelection,
          printHistory.job,
          printHistory.success,
          printHistory.printTime
        ),
        thumbnail: printHistory.thumbnail,
        job: HistoryClean.getJobAnalysis(printHistory.job, printHistory.printTime),
        spoolCost: 0,
        totalVolume: 0,
        totalLength: 0,
        totalWeight: 0,
        ...toDefinedKeyValue(printHistory.resends, "resend"),
        ...toDefinedKeyValue(printHistory.snapshot, "snapshot"),
        ...toDefinedKeyValue(printHistory.timelapse, "timelapse")
      };

      if (!!printSummary.spools) {
        const keys = Object.keys(printSummary.spools);
        for (let s = 0; s < printSummary.spools.length; s++) {
          const toolProp = "tool" + keys[s];
          const spoolTool = printSummary.spools[s][toolProp];
          if (!!spoolTool) {
            printSummary.spoolCost += floatOrZero(spoolTool.cost);
            printSummary.totalVolume += floatOrZero(spoolTool.volume);
            printSummary.totalLength += floatOrZero(spoolTool.length);
            printSummary.totalWeight += floatOrZero(spoolTool.weight);
          }
        }
      }
      printSummary.totalCost = (printCost + printSummary.spoolCost).toFixed(2);
      printSummary.costPerHour = floatOrZero(
        parseFloat(printSummary.totalCost) / ((100 * parseFloat(printHistory.printTime)) / 360000)
      ).toFixed(2);

      printSummary.printHours = toTimeFormat(printHistory.printTime);
      historyArray.push(printSummary);
    }
    if (returnData) {
      return { historyArray, statistics: this.generateStatistics(historyArray), pagination };
    } else {
      this.historyClean = historyArray;
      this.statisticsClean = this.generateStatistics();
      this.pagination = pagination;
    }
  }
}

module.exports = {
  HistoryClean
};
