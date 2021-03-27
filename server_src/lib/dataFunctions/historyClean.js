const { checkNested, checkNestedIndex } = require("../utils/array.util");
const { getPrintCost } = require("../utils/print-cost.util");
const { getHistoryCleanDefault } = require("../providers/history.constants");
const ServerSettings = require("../../models/ServerSettings.js");
const historyService = require("../../services/history.service");

const Logger = require("../logger.js");

class HistoryClean {
  enableLogging = false;
  historyClean = [];
  logger;
  statisticsClean = getHistoryCleanDefault();
  historyService = historyService;

  constructor(enableFileLogging = false, logLevel = "warn") {
    this.logger = new Logger(
      "OctoFarm-InformationCleaning",
      enableFileLogging,
      logLevel,
    );
    this.enableLogging = enableFileLogging || false;
  }

  static async getHours(printTime) {
    printTime = printTime * 1000;
    const h = Math.floor(printTime / 1000 / 60 / 60);
    const m = Math.floor((printTime / 1000 / 60 / 60 - h) * 60);
    const s = Math.floor(((printTime / 1000 / 60 / 60 - h) * 60 - m) * 60);
    return `${h}:${m}`;
  }

  static async getJob(job, printTime) {
    if (typeof job !== "undefined") {
      const accuracy =
        ((printTime - job.estimatedPrintTime) / printTime) * 10000;
      const newJob = {
        estimatedPrintTime: job.estimatedPrintTime,
        actualPrintTime: printTime,
        printTimeAccuracy: accuracy,
      };
      return newJob;
    } else {
      return null;
    }
  }

  static async getSpoolAsync(filamentSelection, metrics, success, time) {
    const serverSettings = await ServerSettings.find({});
    let printPercentage = 0;
    //Fix for old records
    if (
      typeof metrics !== "undefined" &&
      typeof metrics.filament !== "undefined" &&
      metrics.filament !== null
    ) {
      if (!success) {
        printPercentage = (time / metrics.estimatedPrintTime) * 100;
      }
      metrics = metrics.filament;
    } else {
      metrics = null;
    } //Get spoolname function
    function spoolName(id) {
      if (
        typeof id !== "undefined" &&
        id !== null &&
        typeof id.spools !== "undefined"
      ) {
        if (serverSettings[0].filamentManager) {
          return `${id.spools.name} (${(
            id.spools.weight - id.spools.used
          ).toFixed(0)}g) - ${id.spools.profile.material}`;
        } else {
          return `${id.spools.name} - ${id.spools.profile.material}`;
        }
      } else {
        return null;
      }
    }

    // TODO remove as it is simply a nullable call
    //Get spoolid function
    function spoolID(id) {
      if (typeof id !== "undefined" && id !== null) {
        return id._id;
      } else {
        return null;
      }
    }

    function getWeight(length, spool) {
      if (typeof spool !== "undefined" && spool !== null) {
        if (typeof length !== "undefined") {
          if (length === 0) {
            return length;
          } else {
            const radius = parseFloat(spool.spools.profile.diameter) / 2;
            const volume = length * Math.PI * radius * radius;
            let usage = "";
            if (success) {
              usage = (
                volume * parseFloat(spool.spools.profile.density)
              ).toFixed(2);
            } else {
              usage = (
                (printPercentage / 100) *
                (volume * parseFloat(spool.spools.profile.density))
              ).toFixed(2);
            }
            return usage;
          }
        } else {
          return 0;
        }
      } else {
        if (typeof length !== "undefined") {
          length = length;
          if (length === 0) {
            return length;
          } else {
            const radius = 1.75 / 2;
            const volume = length * Math.PI * radius * radius;
            let usage = "";
            if (success) {
              usage = (volume * 1.24).toFixed(2);
            } else {
              usage = ((printPercentage / 100) * (volume * 1.24)).toFixed(2);
            }
            return usage;
          }
        } else {
          return 0;
        }
      }
    }

    function getType(spool) {
      if (typeof spool !== "undefined" && spool !== null) {
        return spool.spools.profile.material;
      } else {
        return "";
      }
    }

    function getCost(grams, spool) {
      if (typeof spool !== "undefined" && spool !== null) {
        if (success) {
          return ((spool.spools.price / spool.spools.weight) * grams).toFixed(
            2,
          );
        } else {
          return (
            (printPercentage / 100) *
            ((spool.spools.price / spool.spools.weight) * grams).toFixed(2)
          );
        }
      } else {
        return null;
      }
    }

    const spools = [];
    if (typeof metrics !== "undefined" && metrics !== null) {
      const keys = Object.keys(metrics);
      for (let m = 0; m < keys.length; m++) {
        let spool = {};
        if (success) {
          spool = {
            [keys[m]]: {
              toolName: "Tool " + keys[m].substring(4, 5),
              spoolName: null,
              spoolId: null,
              volume: metrics[keys[m]].volume.toFixed(2),
              length: (metrics[keys[m]].length / 1000).toFixed(2),
              weight: null,
              cost: null,
            },
          };
        } else {
          spool = {
            [keys[m]]: {
              toolName: "Tool " + keys[m].substring(4, 5),
              spoolName: null,
              spoolId: null,
              volume: (
                (printPercentage / 100) *
                metrics[keys[m]].volume
              ).toFixed(2),
              length: (
                ((printPercentage / 100) * metrics[keys[m]].length) /
                1000
              ).toFixed(2),
              weight: null,
              cost: null,
            },
          };
        }

        if (Array.isArray(filamentSelection)) {
          spool[keys[m]].spoolName = spoolName(filamentSelection[m]);
          spool[keys[m]].spoolId = spoolID(filamentSelection[m]);
          spool[keys[m]].weight = getWeight(
            metrics[keys[m]].length / 1000,
            filamentSelection[m],
          );
          spool[keys[m]].cost = getCost(
            spool[keys[m]].weight,
            filamentSelection[m],
          );

          spool[keys[m]].type = getType(filamentSelection[m]);
        } else {
          spool[keys[m]].spoolName = spoolName(filamentSelection);
          spool[keys[m]].spoolId = spoolID(filamentSelection);
          spool[keys[m]].weight = getWeight(
            metrics[keys[m]].length / 1000,
            filamentSelection,
          );
          spool[keys[m]].cost = getCost(
            spool[keys[m]].weight,
            filamentSelection,
          );
          spool[keys[m]].type = getType(filamentSelection);
        }
        spools.push(spool);
      }
      return spools;
    } else {
      return null;
    }
  }

  static getFile(history) {
    const file = {
      name: history.fileName,
      uploadDate: null,
      path: null,
      size: null,
      averagePrintTime: null,
      lastPrintTime: null,
    };
    if (typeof history.job !== "undefined" && typeof history.job.file) {
      file.uploadDate = history.job.file.date;
      file.path = history.job.file.path;
      file.size = history.job.file.size;
      file.averagePrintTime = history.job.averagePrintTime;
      file.lastPrintTime = history.job.lastPrintTime;
    } else {
      file.path = history.filePath;
    }
    return file;
  }

  async getStatistics(historyClean) {
    this.logger.info("Generating history statistics!");
    let statistics = {};
    try {
      let date = new Date();

      let thirtyDaysAgo = date.getDate() - 90;
      date.setDate(thirtyDaysAgo);
      thirtyDaysAgo = date;

      function arrayCounts(arr) {
        const a = [];
        const b = [];
        let prev;

        arr.sort();
        for (let i = 0; i < arr.length; i++) {
          if (arr[i] !== prev) {
            a.push(arr[i]);
            b.push(1);
          } else {
            b[b.length - 1]++;
          }
          prev = arr[i];
        }

        return [a, b];
      }

      const completed = [];
      const cancelled = [];
      const failed = [];
      const printTimes = [];
      const fileNames = [];
      const printerNames = [];
      const filamentWeight = [];
      const filamentLength = [];
      const printCost = [];
      const filamentCost = [];
      const arrayFailed = [];

      const usageOverTime = [];
      const totalByDay = [];
      const historyByDay = [];

      for (let h = 0; h < historyClean.length; h++) {
        if (historyClean[h].state.includes("success")) {
          completed.push(true);
          printTimes.push(historyClean[h].printTime);

          fileNames.push(historyClean[h].file.name);

          printerNames.push(historyClean[h].printer);

          filamentWeight.push(historyClean[h].totalWeight);
          filamentLength.push(historyClean[h].totalLength);

          printCost.push(parseFloat(historyClean[h].printerCost));
        } else if (historyClean[h].state.includes("warning")) {
          cancelled.push(true);
          arrayFailed.push(historyClean[h].printTime);
        } else if (historyClean[h].state.includes("danger")) {
          failed.push(true);
          arrayFailed.push(historyClean[h].printTime);
        }

        filamentCost.push(historyClean[h].spoolCost);

        if (historyClean[h].spools !== null) {
          historyClean[h].spools.forEach((spool) => {
            //console.log(spool);
            try {
              const keys = Object.keys(spool);
              for (const key of keys) {
                //check if type exists
                let checkNested = checkNested(
                  JSON.parse(JSON.stringify(spool[key].type)),
                  totalByDay,
                );

                if (typeof checkNested !== "undefined") {
                  let checkNestedIndexHistoryRates = null;
                  if (historyClean[h].state.includes("success")) {
                    checkNestedIndexHistoryRates = checkNestedIndex(
                      "Success",
                      historyByDay,
                    );
                  } else if (historyClean[h].state.includes("warning")) {
                    checkNestedIndexHistoryRates = checkNestedIndex(
                      "Cancelled",
                      historyByDay,
                    );
                  } else if (historyClean[h].state.includes("danger")) {
                    checkNestedIndexHistoryRates = checkNestedIndex(
                      "Failed",
                      historyByDay,
                    );
                  } else {
                    return;
                  }

                  let checkNestedIndexByDay = checkNestedIndex(
                    JSON.parse(JSON.stringify(spool[key].type)),
                    usageOverTime,
                  );
                  let usageWeightCalc = 0;

                  if (
                    typeof usageOverTime[checkNestedIndexByDay].data[0] !==
                    "undefined"
                  ) {
                    usageWeightCalc =
                      usageOverTime[checkNestedIndexByDay].data[
                        usageOverTime[checkNestedIndexByDay].data.length - 1
                      ].y +
                      JSON.parse(JSON.stringify(historyClean[h].totalWeight));
                  } else {
                    usageWeightCalc = JSON.parse(
                      JSON.stringify(historyClean[h].totalWeight),
                    );
                  }

                  let checkNestedIndex = checkNestedIndex(
                    JSON.parse(JSON.stringify(spool[key].type)),
                    totalByDay,
                  );
                  let historyDate = JSON.parse(
                    JSON.stringify(historyClean[h].endDate),
                  );

                  let dateSplit = historyDate.split(" ");
                  const months = [
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ];
                  let month = months.indexOf(dateSplit[1]);
                  let dateString = `${parseInt(dateSplit[3])}-${
                    month + 1
                  }-${parseInt(dateSplit[2])}`;

                  let dateParse = new Date(dateString);

                  let weightCalcSan = parseFloat(
                    JSON.parse(
                      JSON.stringify(historyClean[h].totalWeight.toFixed(2)),
                    ),
                  );
                  let dateChecked = new Date(thirtyDaysAgo);
                  //Don't include 0 weights
                  if (weightCalcSan > 0) {
                    //Check if more than 90 days ago...
                    weightCalcSan = JSON.parse(JSON.stringify(weightCalcSan));
                    if (dateParse.getTime() > dateChecked.getTime()) {
                      totalByDay[checkNestedIndex].data.push({
                        x: dateParse,
                        y: weightCalcSan,
                      });
                      usageOverTime[checkNestedIndex].data.push({
                        x: dateParse,
                        y: weightCalcSan,
                      });
                      historyByDay[checkNestedIndexHistoryRates].data.push({
                        x: dateParse,
                        y: 1,
                      });
                    }
                  }
                } else {
                  let usageKey = {
                    name: JSON.parse(JSON.stringify(spool[key].type)),
                    data: [],
                  };
                  let usageByKey = {
                    name: JSON.parse(JSON.stringify(spool[key].type)),
                    data: [],
                  };
                  let successKey = {
                    name: "Success",
                    data: [],
                  };
                  let cancellKey = {
                    name: "Cancelled",
                    data: [],
                  };
                  let failedKey = {
                    name: "Failed",
                    data: [],
                  };

                  if (spool[key].type !== "") {
                    totalByDay.push(usageKey);
                  }
                  if (spool[key].type !== "") {
                    usageOverTime.push(usageByKey);
                  }
                  if (typeof historyByDay[0] === "undefined") {
                    historyByDay.push(successKey);
                    historyByDay.push(cancellKey);
                    historyByDay.push(failedKey);
                  }
                }
              }
            } catch (e) {
              this.logger.error(
                "something went wrong looping through spools...",
                e.message,
              );
            }
          });
        }
      }
      const totalFilamentWeight = filamentWeight.reduce((a, b) => a + b, 0);
      const totalFilamentLength = filamentLength.reduce((a, b) => a + b, 0);
      const filesArray = arrayCounts(fileNames);
      let mostPrintedFile = "No Files";
      if (filesArray[0].length !== 0) {
        const countFilesArray = filesArray[1].indexOf(
          Math.max(...filesArray[1]),
        );
        mostPrintedFile = filesArray[0][countFilesArray];
        mostPrintedFile = mostPrintedFile.replace(/_/g, " ");
      }
      const printerNamesArray = arrayCounts(printerNames);
      let mostUsedPrinter = "No Printers";
      let leastUsedPrinter = "No Printers";
      if (printerNamesArray[0].length != 0) {
        const maxIndexPrinterNames = printerNamesArray[1].indexOf(
          Math.max(...printerNamesArray[1]),
        );
        const minIndexPrinterNames = printerNamesArray[1].indexOf(
          Math.min(...printerNamesArray[1]),
        );
        mostUsedPrinter = printerNamesArray[0][maxIndexPrinterNames];
        leastUsedPrinter = printerNamesArray[0][minIndexPrinterNames];
      }
      const statTotal = completed.length + cancelled.length + failed.length;

      function sumValuesGroupByDate(input) {
        try {
          var dates = {};
          input.forEach((dv) => (dates[dv.x] = (dates[dv.x] || 0) + dv.y));
          return Object.keys(dates).map((date) => ({
            x: new Date(date),
            y: dates[date],
          }));
        } catch (e) {
          this.logger.error(e, "Error with summing group values...");
        }
      }

      function convertIncremental(input) {
        try {
          let usageWeightCalc = 0;
          let newObj = [];
          for (let i = 0; i < input.length; i++) {
            if (typeof newObj[i - 1] !== "undefined") {
              usageWeightCalc = newObj[i - 1].y + input[i].y;
            } else {
              usageWeightCalc = input[i].y;
            }
            newObj.push({ x: input[i].x, y: usageWeightCalc });
          }
          return newObj;
        } catch (e) {
          this.logger.error(e, "ERROR with convert incremental");
        }
      }

      totalByDay.forEach((usage) => {
        usage.data = sumValuesGroupByDate(usage.data);
      });
      // console.log("AFTER", totalByDay[0].data);
      usageOverTime.forEach((usage) => {
        usage.data = sumValuesGroupByDate(usage.data);
      });

      usageOverTime.forEach((usage) => {
        usage.data = convertIncremental(usage.data);
      });

      historyByDay.forEach((usage) => {
        usage.data = sumValuesGroupByDate(usage.data);
      });

      statistics = {
        completed: completed.length,
        cancelled: cancelled.length,
        failed: failed.length,
        completedPercent: ((completed.length / statTotal) * 100).toFixed(2),
        cancelledPercent: ((cancelled.length / statTotal) * 100).toFixed(2),
        failedPercent: ((failed.length / statTotal) * 100).toFixed(2),
        longestPrintTime: Math.max(...printTimes).toFixed(2),
        shortestPrintTime: Math.min(...printTimes).toFixed(2),
        averagePrintTime: (
          printTimes.reduce((a, b) => a + b, 0) / printTimes.length
        ).toFixed(2),
        mostPrintedFile,
        printerMost: mostUsedPrinter,
        printerLoad: leastUsedPrinter,
        totalFilamentUsage:
          totalFilamentWeight.toFixed(2) +
          "g / " +
          totalFilamentLength.toFixed(2) +
          "m",
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
        currentFailed: arrayFailed.reduce((a, b) => a + b, 0),
        totalByDay: totalByDay,
        usageOverTime: usageOverTime,
        historyByDay: historyByDay,
      };
      return statistics;
    } catch (e) {
      this.logger.error("Error Generating statistics: Error:", e.message);
      return [];
    } finally {
      this.logger.info("Finished generating statistics", statistics);
    }
  }

  async getHistory() {
    return this.historyService.find();
  }

  stateToHtml(state, reason) {
    if (state) {
      return '<p class="d-none state">Success</p><i class="fas fa-thumbs-up text-success fa-3x"></i>';
    } else {
      if (reason === "cancelled") {
        return '<p class="d-none state">Cancelled</p><i class="fas fa-thumbs-down text-warning fa-3x"></i>';
      } else {
        return '<p class="d-none state">Failure</p><i class="fas fa-exclamation text-danger fa-3x"></i>';
      }
    }
  }

  /**
   * Set the initial state for the history cache
   * @returns {Promise<void>}
   */
  async start() {
    await this.logger.info("Running history Cleaning");
    try {
      const history = await this.historyService.find({});
      const historyArray = [];
      for (let h = 0; h < history.length; h++) {
        const currHistory = history[h].printHistory;
        const sorted = {
          _id: history[h]._id,
          index: currHistory.historyIndex,
          state: this.stateToHtml(currHistory.success, currHistory?.reason),
          printer: currHistory.printerName,
          file: HistoryClean.getFile(currHistory),
          startDate: currHistory.startDate,
          endDate: currHistory.endDate,
          printTime: currHistory.printTime,
          notes: currHistory.notes,
          printerCost: getPrintCost(
            currHistory.printTime,
            currHistory.costSettings,
          ),
          spools: await HistoryClean.getSpoolAsync(
            currHistory.filamentSelection,
            currHistory.job,
            currHistory.success,
            currHistory.printTime,
          ),
          thumbnail: currHistory.thumbnail,
          job: await HistoryClean.getJob(
            currHistory.job,
            currHistory.printTime,
          ),
        };

        if (
          typeof history[h].printHistory.resends !== "undefined" &&
          history[h].printHistory.resends !== null
        ) {
          sorted.resend = history[h].printHistory.resends;
        }
        if (typeof history[h].printHistory.snapshot !== "undefined") {
          sorted.snapshot = history[h].printHistory.snapshot;
        }
        if (typeof history[h].printHistory.timelapse !== "undefined") {
          sorted.timelapse = history[h].printHistory.timelapse;
        }
        let spoolCost = 0;
        let totalVolume = 0;
        let totalLength = 0;
        let totalWeight = 0;
        const numOr0 = (n) => (isNaN(n) ? 0 : parseFloat(n));
        if (typeof sorted.spools !== "undefined" && sorted.spools !== null) {
          const keys = Object.keys(sorted.spools);
          for (let s = 0; s < sorted.spools.length; s++) {
            if (typeof sorted.spools[s]["tool" + keys[s]] !== "undefined") {
              spoolCost += numOr0(sorted.spools[s]["tool" + keys[s]].cost);
              totalVolume += numOr0(sorted.spools[s]["tool" + keys[s]].volume);
              totalLength += numOr0(sorted.spools[s]["tool" + keys[s]].length);
              totalWeight += numOr0(sorted.spools[s]["tool" + keys[s]].weight);
            }
          }
        }
        spoolCost = numOr0(spoolCost);
        sorted.totalCost = (
          parseFloat(sorted.printerCost) + parseFloat(spoolCost)
        ).toFixed(2);
        sorted.costPerHour =
          parseFloat(sorted.totalCost) /
          parseFloat((history[h].printHistory.printTime / 360000) * 100);
        if (isNaN(sorted.costPerHour)) {
          sorted.costPerHour = 0;
        }
        sorted.printHours = await HistoryClean.getHours(
          history[h].printHistory.printTime,
        );
        if (!isNaN(sorted.costPerHour)) {
          sorted.costPerHour = sorted.costPerHour.toFixed(2);
        }
        sorted.totalVolume = parseFloat(totalVolume);

        sorted.totalLength = parseFloat(totalLength);
        sorted.totalWeight = parseFloat(totalWeight);
        sorted.spoolCost = parseFloat(spoolCost);
        historyArray.push(sorted);
      }

      this.historyClean = historyArray;
      this.statisticsClean = await this.getStatistics(historyArray);

      await this.logger.info(
        "History information cleaned and ready for consumption",
      );
    } catch (e) {
      await this.logger.error("Failed to generate clean history...", e.message);
    }
  }
}

// HistoryClean.start();
module.exports = {
  HistoryClean,
};
