const Logger = require("../../handlers/logger.js");
const { getDefaultHistoryStatistics } = require("../../constants/cleaner.constants");
const { arrayCounts } = require("../../utils/array.util");
const { sumValuesGroupByDate, assignYCumSum } = require("../../utils/graph-point.utils");
const { getSpool, processHistorySpools } = require("../../utils/spool.utils");
const { getPrintCostNumeric, noCostSettingsMessage } = require("../../utils/print-cost.util");
const { stateToHtml } = require("../../utils/html.util");
const { toDefinedKeyValue } = require("../../utils/property.util");
const { floatOrZero } = require("../../utils/number.util");
const { toTimeFormat } = require("../../utils/time.util");
const { getJobAnalysis } = require("../../utils/job.utils");

class HistoryCache {
  #statisticsClean = getDefaultHistoryStatistics();
  #historyClean = [];

  #enableLogging = false;
  #logger = new Logger("OctoFarm-InformationCleaning", this.#enableLogging, "warn");

  #historyService;
  #settingsStore;

  constructor({ historyService, settingsStore }) {
    this.#historyService = historyService;
    this.#settingsStore = settingsStore;
  }

  getHistoryCache() {
    return {
      history: this.#historyClean,
      stats: this.#statisticsClean
    };
  }

  /**
   * Set the initial state for the history cache
   * @returns {Promise<void>}
   */
  async initCache() {
    const storedHistory = await this.#historyService.find(100);
    const historyEntities = storedHistory ?? [];

    // Empty history means database was nuked - so dont skip
    // if (!historyEntities?.length) {
    //   return;
    // }

    const historyArray = [];
    for (let hist of historyEntities) {
      const printHistory = hist.printHistory;
      const printCost = getPrintCostNumeric(printHistory.printTime, printHistory.costSettings);
      const historyJob = printHistory;
      const printSummary = {
        _id: hist._id,
        index: printHistory.historyIndex,
        // TODO success: printHistory.success, // Proposal to avoid parsing html again
        state: stateToHtml(printHistory.success, printHistory?.reason),
        printer: printHistory.printerName,
        // TODO why this conversion?? Only creates possibility for mistakes. Keep job a job, and file a file
        file: {
          name: printHistory.fileName,
          uploadDate: historyJob?.date || null,
          path: historyJob?.path || printHistory.filePath, // TODO discuss this alternative
          size: historyJob?.size || null,
          averagePrintTime: historyJob?.averagePrintTime || null,
          lastPrintTime: historyJob?.lastPrintTime || null
        },
        startDate: printHistory.startDate,
        endDate: printHistory.endDate,
        printTime: printHistory.printTime,
        notes: printHistory.notes,
        printerCost: printCost?.toFixed(2) || noCostSettingsMessage,
        spools: getSpool(
          printHistory.filamentSelection,
          printHistory.job,
          printHistory.success,
          printHistory.printTime
        ),
        thumbnail: printHistory.thumbnail,
        job: getJobAnalysis(printHistory.job, printHistory.printTime),
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

    this.#historyClean = historyArray;
    this.#statisticsClean = this.generateStatistics();
  }

  generateStatistics() {
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

    for (let h = 0; h < this.#historyClean.length; h++) {
      const { printerCost, file, totalLength, state, printTime, printer, totalWeight, spoolCost } =
        this.#historyClean[h];

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

      processHistorySpools(this.#historyClean[h], usageOverTime, totalByDay, historyByDay);
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
      usage.data = sumValuesGroupByDate(usage.data);
    });
    usageOverTime.forEach((usage) => {
      usage.data = sumValuesGroupByDate(usage.data);
    });
    usageOverTime.forEach((usage) => {
      usage.data = assignYCumSum(usage.data);
    });
    historyByDay.forEach((usage) => {
      usage.data = sumValuesGroupByDate(usage.data);
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
}

module.exports = HistoryCache;
