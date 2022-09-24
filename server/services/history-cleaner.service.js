'use strict';

const { arrayCounts, checkNested, checkNestedIndex } = require('../utils/array.util');
const { getElectricityCosts, getMaintenanceCosts } = require('../utils/print-cost.util');
const {
  getDefaultHistoryStatistics,
  ALL_MONTHS,
  DEFAULT_SPOOL_RATIO,
  DEFAULT_SPOOL_DENSITY,
} = require('../constants/cleaner.constants');
const historyService = require('./history.service');
const Logger = require('../handlers/logger.js');
const { stateToHtml } = require('../utils/html.util');
const { toDefinedKeyValue } = require('../utils/property.util');
const { floatOrZero } = require('../utils/number.util');
const { toTimeFormat } = require('../utils/time.util');
const { last12Month } = require('../utils/date.utils');
const { orderBy } = require('lodash');
const { SettingsClean } = require('./settings-cleaner.service');
const { LOGGER_ROUTE_KEYS } = require('../constants/logger.constants');
let logger;

class HistoryCleanerService {
  historyService = null;
  enableLogging = false;
  logger = logger;
  historyClean = [];
  pagination = {};
  statisticsClean = getDefaultHistoryStatistics();
  monthlyStatistics = [];
  dailyStatistics = [];

  constructor(enableFileLogging = false, logLevel = 'warn') {
    this.historyService = historyService;
    this.logger = new Logger(
      LOGGER_ROUTE_KEYS.SERVICE_HISTORY_CLEANER,
      enableFileLogging,
      logLevel
    );
    this.enableLogging = enableFileLogging || false;
  }

  /**
   * Calculate spool weight static
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

    let spoolLeftoverConditional = '';
    const spoolWeight = (spool.weight - spool.used).toFixed(0);
    spoolLeftoverConditional = `(${spoolWeight}g)`;
    return `${spool.name} ${spoolLeftoverConditional} - ${spool.profile?.material}`;
  }

  static getCostAsString(grams, spool, completionRatio) {
    if (!spool) {
      return '0.00';
    }
    return completionRatio * ((spool.spools.price / spool.spools.weight) * grams).toFixed(2);
  }

  static getJobAnalysis(job, printTime) {
    return !!job
      ? {
          actualPrintTime: printTime,
          estimatedPrintTime: job.estimatedPrintTime,
          printTimeAccuracy: ((printTime - job.estimatedPrintTime) / printTime) * 10000,
          user: job?.user ? job.user : 'No OP User',
        }
      : null;
  }

  /**
   *
   * @param input
   * @returns {{x: Date, y: *}[]}
   */
  static sumValuesGroupByDate(input) {
    let dates = {};
    input.forEach((dv) => (dates[dv.x.toDateString()] = (dates[dv.x.toDateString()] || 0) + dv.y));
    return Object.keys(dates).map((date) => ({
      x: new Date(date),
      y: dates[date],
    }));
  }

  /**
   * Cumulative sum operator over numeric-only Y-values
   * @param input
   * @returns {[]}
   */
  static assignYCumSum(input) {
    try {
      let usageWeightCalc = 0;
      let newObj = [];
      for (let i = 0; i < input.length; i++) {
        if (typeof newObj[i - 1] !== 'undefined') {
          usageWeightCalc = newObj[i - 1].y + input[i].y;
        } else {
          usageWeightCalc = input[i].y;
        }
        newObj.push({ x: input[i].x, y: usageWeightCalc });
      }
      return newObj;
    } catch (e) {
      logger.error(e, 'ERROR with convert incremental');
    }
  }

  static getSpool(filamentSelection, job, success, time) {
    // Fix for old database states
    if (!job?.filament) {
      return null;
    }

    let printPercentage = 0;
    if (!success) {
      let printTime = 0;
      if (job?.lastPrintTime) {
        // Last print time available, use this as it's more accurate
        printTime = job.lastPrintTime;
      } else {
        printTime = job.estimatedPrintTime;
      }

      printPercentage = (time / printTime) * 100;
    }
    const filament = job.filament;

    const spools = [];
    for (const key of Object.keys(filament)) {
      const keyIndex = Object.keys(filament).indexOf(key);
      const filamentEntry = Array.isArray(filamentSelection)
        ? filamentSelection[keyIndex]
        : filamentSelection;
      const metric = filament[key];
      if (metric !== null) {
        let completionRatio = success ? 1.0 : printPercentage / 100;

        const spoolWeight = HistoryCleanerService.calcSpoolWeightAsString(
          metric.length / 1000,
          filamentEntry,
          completionRatio
        );
        const spoolName = HistoryCleanerService.getSpoolLabel(filamentEntry);

        spools.push({
          [key]: {
            toolName: 'Tool ' + key.substring(4, 5),
            spoolName,
            spoolId: filamentEntry?._id || null,
            volume: (completionRatio * metric.volume).toFixed(2),
            length: ((completionRatio * metric.length) / 1000).toFixed(2),
            weight: spoolWeight,
            cost: HistoryCleanerService.getCostAsString(
              spoolWeight,
              filamentEntry,
              completionRatio
            ),
            type: filamentEntry?.spools?.profile?.material,
            manufacturer: filamentEntry?.spools?.profile?.manufacturer,
          },
        });
      }
    }
    return spools;
  }

  static processHistorySpools(historyCleanEntry, usageOverTime, totalByDay) {
    const spools = historyCleanEntry?.spools;
    const historyState = historyCleanEntry.state;

    if (!!spools) {
      spools.forEach((spool) => {
        const keys = Object.keys(spool);
        for (const key of keys) {
          // Check if type exists
          let searchKeyword = '';
          let checkNestedResult = checkNested(spool[key].type, totalByDay);
          if (!!checkNestedResult) {
            if (historyState.includes('success')) {
              searchKeyword = 'Success';
            } else if (historyState.includes('warning')) {
              searchKeyword = 'Cancelled';
            } else if (historyState.includes('danger')) {
              searchKeyword = 'Failed';
            } else {
              return;
            }
            let checkNestedIndexByDay = checkNestedIndex(spool[key].type, totalByDay);
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
              // Check if more than 90 days ago...
              totalByDay[checkedIndex].data.push({
                x: historyCleanEntry.endDate,
                y: weightCalcSan,
              });
              usageOverTime[checkedIndex].data.push({
                x: historyCleanEntry.endDate,
                y: weightCalcSan,
              });
            }
          } else {
            if (spool[key].type !== '') {
              totalByDay.push({
                name: spool[key].type,
                data: [],
              });
            }
            if (spool[key].type !== '') {
              usageOverTime.push({
                name: spool[key].type,
                data: [],
              });
            }
          }
        }
      });
    }

    return {
      usageOverTime,
      totalByDay,
    };
  }

  static processHistoryCounts(historyCleanEntry, historyByDay, totalOverTime) {
    const historyState = historyCleanEntry.state;

    // Check if type exists
    let searchKeyword = '';
    if (historyState.includes('success')) {
      searchKeyword = 'Success';
    } else if (historyState.includes('warning')) {
      searchKeyword = 'Cancelled';
    } else if (historyState.includes('danger')) {
      searchKeyword = 'Failed';
    } else {
      return;
    }

    let checkNestedResult = checkNested(searchKeyword, historyByDay);
    let checkNestedIndexHistoryRates = checkNestedIndex(searchKeyword, historyByDay);
    let checkNestedIndexOverTimeRates = checkNestedIndex(searchKeyword, totalOverTime);

    if (!!checkNestedResult) {
      historyByDay[checkNestedIndexHistoryRates].data.push({
        x: historyCleanEntry.endDate,
        y: 1,
      });
      totalOverTime[checkNestedIndexOverTimeRates].data.push({
        x: historyCleanEntry.endDate,
        y: 1,
      });
    } else {
      if (!historyByDay[0]) {
        historyByDay.push({
          name: 'Success',
          data: [],
        });
        historyByDay.push({
          name: 'Failed',
          data: [],
        });
        historyByDay.push({
          name: 'Cancelled',
          data: [],
        });
      }
      if (!totalOverTime[0]) {
        totalOverTime.push({
          name: 'Success',
          data: [],
        });
        totalOverTime.push({
          name: 'Failed',
          data: [],
        });
        totalOverTime.push({
          name: 'Cancelled',
          data: [],
        });
      }
    }

    return {
      historyByDay,
      totalOverTime,
    };
  }

  generateStatistics(historyData) {
    let completedJobsCount = 0;
    let cancelledCount = 0;
    let failedCount = 0;
    const printTimes = [];
    const successPrintTimes = [];
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
    const totalOverTime = [];

    const topPrinterList = [];
    const topFilesList = [];

    let currentHistory = this.historyClean;

    if (historyData) {
      currentHistory = historyData;
    }

    currentHistory = orderBy(currentHistory, ['endDate'], ['asc']);

    for (let h = 0; h < currentHistory.length; h++) {
      const { printerCost, file, totalLength, state, printTime, printer, totalWeight, spoolCost } =
        currentHistory[h];
      const topPrinterState = {
        printTime,
        printerName: printer,
        state: 'success',
      };
      const topFileState = {
        file: file.name,
        state: 'success',
        printTime,
      };
      if (state.includes('success')) {
        completedJobsCount++;
        printTimes.push(printTime);
        successPrintTimes.push(printTime);
        fileNames.push(file.name);
        printerNames.push(printer);
        filamentWeight.push(totalWeight);
        filamentLength.push(totalLength);
        printCost.push(parseFloat(printerCost));
      } else if (state.includes('warning')) {
        cancelledCount++;
        printTimes.push(printTime);
        failedPrintTime.push(printTime);
        topPrinterState.state = 'cancelled';
        topFileState.state = 'cancelled';
      } else if (state.includes('danger')) {
        failedCount++;
        printTimes.push(printTime);
        failedPrintTime.push(printTime);
        topPrinterState.state = 'failed';
        topFileState.state = 'failed';
      }
      topFilesList.push(topFileState);
      topPrinterList.push(topPrinterState);
      filamentCost.push(spoolCost);
      HistoryCleanerService.processHistoryCounts(currentHistory[h], historyByDay, totalOverTime);
      HistoryCleanerService.processHistorySpools(currentHistory[h], usageOverTime, totalByDay);
    }

    const totalFilamentWeight = filamentWeight.reduce((a, b) => a + b, 0);
    const totalFilamentLength = filamentLength.reduce((a, b) => a + b, 0);
    const totalPrintTime = printTimes.reduce((a, b) => a + b, 0);
    const totalSuccessPrintTimes = successPrintTimes.reduce((a, b) => a + b, 0);
    const filesArray = arrayCounts(fileNames);
    let mostPrintedFile = 'No Files';
    if (filesArray[0].length !== 0) {
      const countFilesArray = filesArray[1].indexOf(Math.max(...filesArray[1]));
      mostPrintedFile = filesArray[0][countFilesArray];
      mostPrintedFile = mostPrintedFile.replace(/_/g, ' ');
    }
    const printerNamesArray = arrayCounts(printerNames);
    let mostUsedPrinter = 'No Printers';
    let leastUsedPrinter = 'No Printers';
    if (printerNamesArray[0].length !== 0) {
      const maxIndexPrinterNames = printerNamesArray[1].indexOf(Math.max(...printerNamesArray[1]));
      const minIndexPrinterNames = printerNamesArray[1].indexOf(Math.min(...printerNamesArray[1]));
      mostUsedPrinter = printerNamesArray[0][maxIndexPrinterNames];
      leastUsedPrinter = printerNamesArray[0][minIndexPrinterNames];
    }
    const statTotal = completedJobsCount + cancelledCount + failedCount;

    totalByDay.forEach((usage) => {
      usage.data = HistoryCleanerService.sumValuesGroupByDate(usage.data);
    });
    totalOverTime.forEach((usage) => {
      usage.data = HistoryCleanerService.sumValuesGroupByDate(usage.data);
    });

    usageOverTime.forEach((usage) => {
      usage.data = HistoryCleanerService.sumValuesGroupByDate(usage.data);
    });
    usageOverTime.forEach((usage) => {
      usage.data = HistoryCleanerService.assignYCumSum(usage.data);
    });
    historyByDay.forEach((usage) => {
      usage.data = HistoryCleanerService.sumValuesGroupByDate(usage.data);
    });

    const groupedPrinterList = topPrinterList.reduce(function (r, a) {
      r[a.printerName] = r[a.printerName] || [];
      r[a.printerName].push({ printTime: a.printTime, state: a.state });
      return r;
    }, Object.create(null));
    const sortedTopPrinterList = [];
    Object.entries(groupedPrinterList).forEach(([key, value]) => {
      const sumOfPrintTime = value.reduce((sum, currentValue) => {
        return sum + currentValue?.printTime ? currentValue.printTime : 0;
      }, 0);
      const sumOfPrints = value.reduce((sum) => {
        return sum + 1;
      }, 0);
      const sumOfCancelled = value.reduce((sum, currentValue) => {
        if (currentValue.state === 'cancelled') {
          return sum + 1;
        } else {
          return sum + 0;
        }
      }, 0);
      const sumOfFailed = value.reduce((sum, currentValue) => {
        if (currentValue.state === 'failed') {
          return sum + 1;
        } else {
          return sum + 0;
        }
      }, 0);
      const sumOfSuccess = value.reduce((sum, currentValue) => {
        if (currentValue.state === 'success') {
          return sum + 1;
        } else {
          return sum + 0;
        }
      }, 0);

      sortedTopPrinterList.push({
        printerName: key,
        time: sumOfPrintTime,
        prints: sumOfPrints,
        cancelledCount: sumOfCancelled || 0,
        failedCount: sumOfFailed || 0,
        successCount: sumOfSuccess || 0,
      });
    });
    const groupedFilesList = topFilesList.reduce(function (r, a) {
      r[a.file] = r[a.file] || [];
      r[a.file].push({ state: a.state, printTime: a.printTime });
      return r;
    }, Object.create(null));
    const sortedTopFilesList = [];
    Object.entries(groupedFilesList).forEach(([key, value]) => {
      const sumOfPrintTime = value.reduce((sum, currentValue) => {
        return sum + currentValue?.printTime ? currentValue.printTime : 0;
      }, 0);
      const sumOfPrints = value.reduce((sum) => {
        return sum + 1;
      }, 0);
      const sumOfCancelled = value.reduce((sum, currentValue) => {
        if (currentValue.state === 'cancelled') {
          return sum + 1;
        } else {
          return sum + 0;
        }
      }, 0);
      const sumOfFailed = value.reduce((sum, currentValue) => {
        if (currentValue.state === 'failed') {
          return sum + 1;
        } else {
          return sum + 0;
        }
      }, 0);
      const sumOfSuccess = value.reduce((sum, currentValue) => {
        if (currentValue.state === 'success') {
          return sum + 1;
        } else {
          return sum + 0;
        }
      }, 0);

      sortedTopFilesList.push({
        file: key,
        prints: sumOfPrints,
        cancelledCount: sumOfCancelled || 0,
        failedCount: sumOfFailed || 0,
        successCount: sumOfSuccess || 0,
        sumOfPrintTime: sumOfPrintTime || 0,
      });
    });

    return {
      sortedTopFilesList: orderBy(sortedTopFilesList, ['prints'], ['desc']),
      sortedTopPrinterList: orderBy(sortedTopPrinterList, ['time'], ['desc']),
      sortedTopSuccessPrinterList: orderBy(sortedTopPrinterList, ['successCount'], ['desc']),
      totalSuccessPrintTimes,
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
      totalPrintTime,
      totalFilamentUsage:
        totalFilamentWeight.toFixed(2) + 'g / ' + totalFilamentLength.toFixed(2) + 'm',
      averageFilamentUsage:
        (totalFilamentWeight / filamentWeight.length).toFixed(2) +
        'g / ' +
        (totalFilamentLength / filamentLength.length).toFixed(2) +
        'm',
      highestFilamentUsage:
        Math.max(...filamentWeight).toFixed(2) +
        'g / ' +
        Math.max(...filamentLength).toFixed(2) +
        'm',
      lowestFilamentUsage:
        Math.min(...filamentWeight).toFixed(2) +
        'g / ' +
        Math.min(...filamentLength).toFixed(2) +
        'm',
      totalSpoolCost: filamentCost.reduce((a, b) => a + b, 0).toFixed(2),
      highestSpoolCost: Math.max(...filamentCost).toFixed(2),
      totalPrinterCost: printCost.reduce((a, b) => a + b, 0).toFixed(2),
      highestPrinterCost: Math.max(...printCost).toFixed(2),
      lowestPrinterCost: Math.min(...printCost).toFixed(2),
      lowestSpoolCost: Math.min(...filamentCost).toFixed(2),
      averagePrinterCost: (printCost.reduce((a, b) => a + b, 0) / printCost.length).toFixed(2),
      averageSpoolCost: (filamentCost.reduce((a, b) => a + b, 0) / filamentCost.length).toFixed(2),
      currentFailed: failedPrintTime.reduce((a, b) => a + b, 0),
      totalByDay: totalByDay,
      usageOverTime: usageOverTime,
      historyByDay: historyByDay,
      totalOverTime,
    };
  }

  async generateMonthlyStats() {
    // Get previous twelve months...
    const lastTwelveMonths = last12Month();

    const workingData = [];
    // Get item lists for each month...
    for (let i = 0; i < lastTwelveMonths.length; i++) {
      const firstDayOfTheMonth = lastTwelveMonths[i];
      const firstDate = new Date(firstDayOfTheMonth);
      const lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth() + 1, 0);
      const { itemList } = await this.historyService.find(
        {
          'printHistory.endDate': {
            $gte: firstDate,
            $lte: lastDate,
          },
        },
        { pagination: false }
      );

      let printSummary = [];
      if (itemList.length !== 0) {
        printSummary = this.generateDataSummary(itemList);
      }
      workingData.push({
        date: firstDate,
        data: printSummary,
      });
    }
    const returnData = [];
    for (let d = 0; d < workingData.length; d++) {
      const currentMonthsData = workingData[d];
      if (currentMonthsData.data.length !== 0) {
        let parsedObject = {
          month:
            ALL_MONTHS[currentMonthsData.date.getMonth()] +
            ' ' +
            currentMonthsData.date.getFullYear(),
          statistics: this.generateStatistics(currentMonthsData.data),
        };
        returnData.push(parsedObject);
      } else {
        let parsedObject = {
          month:
            ALL_MONTHS[currentMonthsData.date.getMonth()] +
            ' ' +
            currentMonthsData.date.getFullYear(),
          statistics: {},
        };
        returnData.push(parsedObject);
      }
    }
    // Store in cache for retreival

    this.monthlyStatistics = returnData;
    return {
      returnData,
    };
  }

  generateHistoryFilterData = function (history) {
    const historyFileNames = [];
    const historyFilePaths = [];
    const historyPrinterNames = [];
    const historyPrinterGroups = [];
    const historySpoolsManu = [];
    const historySpoolsMat = [];
    if (history) {
      history.forEach((hist) => {
        historyPrinterNames.push(hist.printer.replace(/ /g, '_'));
        if (hist?.printerGroup) {
          historyPrinterGroups.push(hist.printerGroup);
        }
        if (hist?.file?.name) {
          historyFileNames.push(hist.file.name.replace('.gcode', ''));
          const path = hist.file.path.substring(0, hist.file.path.lastIndexOf('/'));
          if (path !== '') {
            historyFilePaths.push(path);
          }
          if (hist?.spools && hist.spools.length > 0) {
            for (let s = 0; s < hist.spools.length; s++) {
              const currentSpool = hist.spools[s];
              if (currentSpool !== null) {
                const spoolKey = Object.keys(currentSpool)[0];
                historySpoolsManu.push(currentSpool[spoolKey].manufacturer);
                historySpoolsMat.push(currentSpool[spoolKey].type);
              }
            }
          }
        }
      });
    }

    return {
      pathList: historyFilePaths.filter(function (item, i, ar) {
        return ar.indexOf(item) === i;
      }),
      fileNames: historyFileNames.filter(function (item, i, ar) {
        return ar.indexOf(item) === i;
      }),
      printerNames: historyPrinterNames.filter(function (item, i, ar) {
        return ar.indexOf(item) === i;
      }),
      printerGroups: historyPrinterGroups.filter(function (item, i, ar) {
        return ar.indexOf(item) === i;
      }),
      spoolsMat: historySpoolsMat.filter(function (item, i, ar) {
        return ar.indexOf(item) === i;
      }),
      spoolsManu: historySpoolsManu.filter(function (item, i, ar) {
        return ar.indexOf(item) === i;
      }),
    };
  };

  generateDataSummary(data) {
    const returnData = [];

    for (let hist of data) {
      const printHistory = hist.printHistory;

      const electricityCosts = getElectricityCosts(
        printHistory.printTime,
        printHistory.costSettings
      );
      const maintenanceCosts = getMaintenanceCosts(
        printHistory.printTime,
        printHistory.costSettings
      );
      const printCost = electricityCosts + maintenanceCosts;
      const printSummary = {
        _id: hist._id,
        state: stateToHtml(printHistory.success, printHistory?.reason),
        printer: printHistory.printerName,
        file: this.historyService.getFileFromHistoricJob(printHistory),
        startDate: printHistory.startDate,
        endDate: printHistory.endDate,
        printTime: printHistory.printTime,
        notes: printHistory.notes,
        printerCost: printCost?.toFixed(2),
        maintenanceCosts,
        electricityCosts,
        spools: HistoryCleanerService.getSpool(
          printHistory.filamentSelection,
          printHistory.job,
          printHistory.success,
          printHistory.printTime
        ),
        thumbnail: printHistory.thumbnail,
        job: HistoryCleanerService.getJobAnalysis(printHistory.job, printHistory.printTime),
        spoolCost: 0,
        totalVolume: 0,
        totalLength: 0,
        totalWeight: 0,
        ...toDefinedKeyValue(printHistory.resends, 'resend'),
        ...toDefinedKeyValue(printHistory.snapshot, 'snapshot'),
        ...toDefinedKeyValue(printHistory.timelapse, 'timelapse'),
        activeControlUser: printHistory.activeControlUser,
      };

      if (!!printSummary.spools) {
        const keys = Object.keys(printSummary.spools);
        for (let s = 0; s < printSummary.spools.length; s++) {
          const toolProp = 'tool' + keys[s];
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
      returnData.push(printSummary);
    }

    return returnData;
  }

  /**
   * Set the initial state for the history cache
   * @returns {Promise<{historyArray: *[], pagination, statistics: {currentFailed: *, historyByDay: *[], usageOverTime: *[], totalPrinterCost, highestFilamentUsage: string, completed: number, failed: number, failedPercent: string, lowestFilamentUsage: string, printerLoad: string, totalFilamentUsage: string, totalSpoolCost, highestSpoolCost: string, completedPercent: string, longestPrintTime: string, printerMost: string, cancelledPercent: string, highestPrinterCost: string, shortestPrintTime: string, averageFilamentUsage: string, averagePrintTime: string, cancelled: number, mostPrintedFile: string, totalByDay: *[]}}>}
   */
  async initCache(findOptions = undefined, paginationOptions = undefined) {
    let returnData = false;
    if (!!paginationOptions) {
      returnData = true;
    }

    const { itemList, pagination } = await this.historyService.find(findOptions, paginationOptions);

    const historyEntities = itemList ?? [];

    if (!historyEntities?.length) {
      return itemList;
    }

    const historyArray = this.generateDataSummary(itemList);

    this.historyClean = historyArray;
    this.statisticsClean = this.generateStatistics(historyArray);
    this.pagination = pagination;

    if (returnData) {
      return {
        historyClean: historyArray,
        statisticsClean: this.generateStatistics(historyArray),
        pagination,
      };
    }
  }
}

module.exports = {
  HistoryClean: HistoryCleanerService,
};
