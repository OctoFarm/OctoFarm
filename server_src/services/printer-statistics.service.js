const { getHistoryCache } = require("../cache/history.cache");
const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const _ = require("lodash");
const { checkNested, checkNestedIndex, sumValuesGroupByDate } = require("../utils/array.util");
const RoomData = require("../models/RoomData");
const {
  getDefaultDashboardStatisticsObject,
  getEmptyOperationsObject,
  getEmptyToolTemperatureArray
} = require("../lib/providers/cleaner.constants");
const { returnCurrentOrdering } = require("./current-operations-order.service");
const { getHeatMap, heatMapping } = require("./farm-information.service");
const { PrinterClean } = require("../lib/dataFunctions/printerClean");
const Logger = require("../handlers/logger");

const logger = new Logger("OctoFarm-Server");

const dashboardStatistics = getDefaultDashboardStatisticsObject();
const currentOperations = getEmptyOperationsObject();
const currentHistoryTemp = getEmptyToolTemperatureArray();

let heatMapCounter = 17280;

const getDashboardStatistics = () => {
  return dashboardStatistics;
};
const getCurrentOperations = () => {
  return currentOperations;
};
const getCurrentHistoryTemp = () => {
  return currentHistoryTemp;
};

const generatePrinterStatistics = (id) => {
  const historyCache = getHistoryCache().historyClean;
  let currentHistory = JSON.parse(JSON.stringify(historyCache));
  let currentPrinters = getPrinterStoreCache().listPrintersInformation();
  const i = _.findIndex(currentPrinters, function (o) {
    return JSON.stringify(o._id) === JSON.stringify(id);
  });
  let printer = Object.assign({}, currentPrinters[i]);

  // Calculate time printer has existed...
  let dateAdded = new Date(printer.dateAdded);
  let todaysDate = new Date();
  let dateDifference = parseInt(todaysDate - dateAdded);
  let sevenDaysAgo = new Date(todaysDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  let ninetyDaysAgo = new Date(todaysDate.getTime() - 90 * 24 * 60 * 60 * 1000);
  // Filter down the history arrays for total/daily/weekly
  let historyDaily = [];
  let historyWeekly = [];

  // Create the statistics object to be sent back to client
  let printerStatistics = {
    printerName: printer.printerName,
    timeTotal: dateDifference,
    activeTimeTotal: printer.currentActive,
    idleTimeTotal: printer.currentIdle,
    offlineTimeTotal: printer.currentOffline,
    printerUtilisation: [],
    filamentUsedWeightTotal: [],
    filamentUsedLengthTotal: [],
    printerCostTotal: [],
    filamentCostTotal: [],
    filamentUsedWeightWeek: [],
    filamentUsedLengthWeek: [],
    printerCostWeek: [],
    filamentCostWeek: [],
    filamentUsedWeightDay: [],
    filamentUsedLengthDay: [],
    printerCostDay: [],
    filamentCostDay: [],
    printSuccessTotal: [],
    printCancelTotal: [],
    printErrorTotal: [],
    printSuccessDay: [],
    printCancelDay: [],
    printErrorDay: [],
    printerSuccessWeek: [],
    printerCancelWeek: [],
    printerErrorWeek: [],
    printerResendRatioTotal: [],
    printerResendRatioDaily: [],
    printerResendRatioWeekly: [],
    historyByDay: [],
    historyByDayIncremental: [],
    octoPrintSystemInfo: printer.octoPrintSystemInfo,
    printerFirmware: printer.printerFirmware
  };
  //Generate utilisation chart
  const totalTime = printer.currentActive + printer.currentIdle + printer.currentOffline;
  printerStatistics.printerUtilisation.push((printer.currentActive / totalTime) * 100);
  printerStatistics.printerUtilisation.push((printer.currentIdle / totalTime) * 100);
  printerStatistics.printerUtilisation.push((printer.currentOffline / totalTime) * 100);

  currentHistory.forEach((h) => {
    // Parse the date from history....

    let dateParse = new Date(h.endDate);
    if (h.printer === printerStatistics.printerName) {
      //Collate totals
      printerStatistics.filamentUsedWeightTotal.push(h.totalWeight);
      printerStatistics.filamentUsedLengthTotal.push(h.totalLength);
      printerStatistics.printerCostTotal.push(parseFloat(h.totalCost));
      printerStatistics.filamentCostTotal.push(h.spoolCost);
      if (typeof h.resend !== "undefined") {
        printerStatistics.printerResendRatioTotal.push(h.resend.ratio);
      }

      if (h.state.includes("success")) {
        printerStatistics.printSuccessTotal.push(1);
      } else if (h.state.includes("warning")) {
        printerStatistics.printCancelTotal.push(1);
      } else if (h.state.includes("danger")) {
        printerStatistics.printErrorTotal.push(1);
      }

      if (dateParse.getTime() > todaysDate.getTime()) {
        historyDaily.push(h);
      }
      // Capture Weekly..
      if (dateParse.getTime() > sevenDaysAgo.getTime()) {
        historyWeekly.push(h);
      }
      let successEntry = checkNested("Success", printerStatistics.historyByDay);
      //
      if (typeof successEntry !== "undefined") {
        let checkNestedIndexHistoryRates = null;
        if (h.state.includes("success")) {
          checkNestedIndexHistoryRates = checkNestedIndex(
            "Success",
            printerStatistics.historyByDay
          );
        } else if (h.state.includes("warning")) {
          checkNestedIndexHistoryRates = checkNestedIndex(
            "Cancelled",
            printerStatistics.historyByDay
          );
        } else if (h.state.includes("danger")) {
          checkNestedIndexHistoryRates = checkNestedIndex("Failed", printerStatistics.historyByDay);
        } else {
          return;
        }

        //Check if more than 30 days ago...
        if (dateParse.getTime() > ninetyDaysAgo.getTime()) {
          printerStatistics.historyByDay[checkNestedIndexHistoryRates].data.push({
            x: dateParse,
            y: 1
          });
          // printerStatistics.historyByDayIncremental[
          //   checkNestedIndexHistoryRates
          // ].data.push({
          //   x: dateParse,
          //   y: 1,
          // });
        }
      } else {
        let successKey = {
          name: "Success",
          data: []
        };
        let cancellKey = {
          name: "Cancelled",
          data: []
        };
        let failedKey = {
          name: "Failed",
          data: []
        };
        if (typeof printerStatistics.historyByDay[0] === "undefined") {
          printerStatistics.historyByDay.push(successKey);
          printerStatistics.historyByDay.push(cancellKey);
          printerStatistics.historyByDay.push(failedKey);
          // printerStatistics.historyByDayIncremental.push(successKey);
          // printerStatistics.historyByDayIncremental.push(cancellKey);
          // printerStatistics.historyByDayIncremental.push(failedKey);
        }
      }
    }
  });

  // Collate daily stats
  historyDaily.forEach((d) => {
    printerStatistics.filamentUsedWeightDay.push(d.totalWeight);
    printerStatistics.filamentUsedLengthDay.push(d.totalLength);
    printerStatistics.printerCostDay.push(parseFloat(d.totalCost));
    printerStatistics.filamentCostDay.push(d.spoolCost);
    // console.log(d);
    if (typeof d.resend !== "undefined") {
      printerStatistics.printerResendRatioDaily.push(d.resend.ratio);
    }

    if (d.state.includes("success")) {
      printerStatistics.printSuccessDay.push(1);
    } else if (d.state.includes("warning")) {
      printerStatistics.printCancelDay.push(1);
    } else if (d.state.includes("danger")) {
      printerStatistics.printErrorDay.push(1);
    }
  });
  // Collate weekly stats
  historyWeekly.forEach((w) => {
    printerStatistics.filamentUsedWeightWeek.push(w.totalWeight);
    printerStatistics.filamentUsedLengthWeek.push(w.totalLength);
    printerStatistics.printerCostWeek.push(parseFloat(w.totalCost));
    printerStatistics.filamentCostWeek.push(w.spoolCost);
    if (typeof w.resend !== "undefined") {
      printerStatistics.printerResendRatioWeekly.push(w.resend.ratio);
    }

    if (w.state.includes("success")) {
      printerStatistics.printerSuccessWeek.push(1);
    } else if (w.state.includes("warning")) {
      printerStatistics.printerCancelWeek.push(1);
    } else if (w.state.includes("danger")) {
      printerStatistics.printerErrorWeek.push(1);
    }
  });
  // Reduce all the values and update the variable.
  Object.keys(printerStatistics).forEach(function (key) {
    if (Array.isArray(printerStatistics[key])) {
      if (
        key !== "historyByDay" &&
        key !== "historyByDayIncremental" &&
        key !== "printerUtilisation"
      ) {
        printerStatistics[key] = printerStatistics[key].reduce((a, b) => a + b, 0);
      }
    }
  });

  printerStatistics.historyByDay.forEach((usage) => {
    usage.data = sumValuesGroupByDate(usage.data);
  });

  return printerStatistics;
};

const generateDashboardStatistics = async () => {
  const historyStats = getHistoryCache().statisticsClean;

  dashboardStatistics.currentUtilisation = [
    {
      data: [
        currentOperations.count.active,
        currentOperations.count.complete,
        currentOperations.count.idle,
        currentOperations.count.disconnected,
        currentOperations.count.offline
      ]
    }
  ];
  const farmTotal =
    currentOperations.count.active +
    currentOperations.count.complete +
    currentOperations.count.idle +
    currentOperations.count.disconnected +
    currentOperations.count.offline;
  const activeTotal = currentOperations.count.active;
  const offlineTotal = currentOperations.count.offline;
  const idleTotal =
    currentOperations.count.complete +
    currentOperations.count.idle +
    currentOperations.count.disconnected;
  const activePer = (activeTotal / farmTotal) * 100;
  const idlePer = (idleTotal / farmTotal) * 100;
  const offlinePer = (offlineTotal / farmTotal) * 100;
  dashboardStatistics.currentStatus = [activePer, idlePer, offlinePer];

  const arrayEstimated = [];
  const arrayRemaining = [];
  const arrayElapsed = [];

  const arrayIdle = [];
  const arrayActive = [];
  const arrayOffline = [];
  const heatStatus = [];
  const heatProgress = [];
  const heatTemps = [];
  const heatUtilisation = [];

  const arrayGlobalToolTempActual = [];
  const arrayGlobalToolTempTarget = [];
  const arrayGlobalBedTempActual = [];
  const arrayGlobalBedTempTarget = [];
  const arrayGlobalChamberTempActual = [];
  const arrayGlobalChamberTempTarget = [];
  const printersInformation = getPrinterStoreCache().listPrintersInformation();
  for (let p = 0; p < printersInformation.length; p++) {
    const printer = printersInformation[p];
    if (typeof printer !== "undefined") {
      if (typeof printer.currentJob !== "undefined") {
        if (printer.currentJob.expectedPrintTime !== null) {
          arrayEstimated.push(printer.currentJob.expectedPrintTime);
        }
        if (printer.currentJob.expectedPrintTime !== null) {
          arrayRemaining.push(printer.currentJob.printTimeRemaining);
        }
        if (printer.currentJob.expectedPrintTime !== null) {
          arrayElapsed.push(printer.currentJob.printTimeElapsed);
        }
      }
      arrayIdle.push(printer.currentIdle);
      arrayActive.push(printer.currentActive);
      arrayOffline.push(printer.currentOffline);
      // console.log(printer);
      if (typeof printer.printerState !== "undefined") {
        // console.log(printer.printerState);
        const status = printer.printerState.colour.category;
        let colour = printer.printerState.colour.name;
        if (printer.printerState.colour.category === "Offline") {
          colour = "offline";
        }
        heatStatus.push(
          `<div title="${printer.printerName}: ${status}" class="bg-${colour} heatMap"></div>`
        );
        let tools = null;
        if (
          printer.printerState.colour.category === "Active" ||
          printer.printerState.colour.category === "Complete"
        ) {
          tools = printer.tools;
        } else {
          tools = [];
          tools.push({
            bed: {
              actual: 0,
              target: 0
            },
            tool0: {
              actual: 0,
              target: 0
            }
          });
        }
        if (typeof tools !== "undefined" && tools !== null) {
          const rightString = [`${printer.printerName}: `];
          const leftString = [`${printer.printerName}: `];
          const arrayToolActual = [];
          const arrayToolTarget = [];
          const arrayOtherActual = [];
          const arrayOtherTarget = [];
          const keys = Object.keys(tools[0]);
          for (let k = 0; k < keys.length; k++) {
            if (typeof printer.currentProfile !== "undefined" && printer.currentProfile !== null) {
              if (printer.currentProfile.heatedChamber && keys[k] === "chamber") {
                let actual = "";
                let target = "";
                if (
                  !!printer.tools &&
                  printer.tools[0][keys[k]].actual !== null &&
                  printer.tools[0][keys[k]].target >= 10
                ) {
                  actual = `Chamber A: ${printer.tools[0][keys[k]].actual}°C `;
                  arrayOtherActual.push(printer.tools[0][keys[k]].actual);
                  arrayGlobalChamberTempActual.push(printer.tools[0][keys[k]].actual);
                } else {
                  actual = `Chamber A: ${0}°C`;
                }
                if (
                  !!printer.tools &&
                  printer.tools[0][keys[k]].target !== null &&
                  printer.tools[0][keys[k]].target >= 10
                ) {
                  target = `Chamber T: ${printer.tools[0][keys[k]].target}°C `;
                  arrayOtherTarget.push(printer.tools[0][keys[k]].target);
                  arrayGlobalChamberTempTarget.push(printer.tools[0][keys[k]].target);
                } else {
                  target = `Chamber T: ${0}°C`;
                }
                rightString[2] = `${actual}, ${target}`;
              }
              if (!!printer.tools && printer.currentProfile.heatedBed && keys[k] === "bed") {
                let actual = "";
                let target = "";
                if (
                  !!printer.tools &&
                  printer.tools[0][keys[k]].actual !== null &&
                  printer.tools[0][keys[k]].target >= 10
                ) {
                  actual = `Bed A: ${printer.tools[0][keys[k]].actual}°C `;
                  arrayOtherActual.push(printer.tools[0][keys[k]].actual);
                  arrayGlobalBedTempActual.push(printer.tools[0][keys[k]].actual);
                } else {
                  actual = `Bed A: ${0}°C`;
                }
                if (
                  !!printer.tools &&
                  printer.tools[0][keys[k]].target !== null &&
                  printer.tools[0][keys[k]].target >= 10
                ) {
                  target = `Bed T: ${printer.tools[0][keys[k]].target}°C `;
                  arrayOtherTarget.push(printer.tools[0][keys[k]].target);
                  arrayGlobalBedTempTarget.push(printer.tools[0][keys[k]].target);
                } else {
                  target = `Bed T: ${0}°C`;
                }
                rightString[1] = `${actual}, ${target}`;
              }
              if (keys[k].includes("tool")) {
                const toolNumber = keys[k].replace("tool", "");
                let actual = "";
                let target = "";
                if (
                  !!printer.tools &&
                  printer.tools[0][keys[k]].actual !== null &&
                  printer.tools[0][keys[k]].target >= 10
                ) {
                  actual = `Tool ${toolNumber} A: ${printer.tools[0][keys[k]].actual}°C `;
                  arrayToolActual.push(printer.tools[0][keys[k]].actual);
                  arrayGlobalToolTempActual.push(printer.tools[0][keys[k]].actual);
                } else {
                  actual = `Tool ${toolNumber} A: 0°C`;
                }
                if (
                  !!printer.tools &&
                  printer.tools[0][keys[k]].target !== null &&
                  printer.tools[0][keys[k]].target >= 10
                ) {
                  target = `Tool ${toolNumber} T: ${printer.tools[0][keys[k]].target}°C `;
                  arrayToolTarget.push(printer.tools[0][keys[k]].target);
                  arrayGlobalToolTempTarget.push(printer.tools[0][keys[k]].target);
                } else {
                  target = `Tool ${toolNumber} T: 0°C`;
                }
                leftString[parseInt(toolNumber) + 1] = `${actual}, ${target}`;
              }
            } else {
              leftString[1] = "Offline";
              rightString[1] = "Offline";
            }
          }
          const totalToolActual = arrayToolActual.reduce((a, b) => a + b, 0);
          const totalToolTarget = arrayToolTarget.reduce((a, b) => a + b, 0);
          const totalOtherActual = arrayOtherActual.reduce((a, b) => a + b, 0);
          const totalOtherTarget = arrayToolActual.reduce((a, b) => a + b, 0);
          let actualString = '<div class="d-flex flex-wrap"><div title="';
          for (let l = 0; l < leftString.length; l++) {
            actualString += `${leftString[l]}`;
          }
          actualString += `" class="${PrinterClean.checkTempRange(
            printer.printerState.colour.category,
            totalToolTarget,
            totalToolActual,
            printer.otherSettings.temperatureTriggers.heatingVariation,
            printer.otherSettings.temperatureTriggers.coolDown
          )} heatMapLeft"></div>`;
          actualString += '<div title="';
          for (let r = 0; r < rightString.length; r++) {
            actualString += `${rightString[r]}`;
          }
          actualString += `" class="${PrinterClean.checkTempRange(
            printer.printerState.colour.category,
            totalOtherTarget,
            totalOtherActual,
            printer.otherSettings.temperatureTriggers.heatingVariation,
            printer.otherSettings.temperatureTriggers.coolDown
          )} heatMapLeft"></div></div>`;
          heatTemps.push(actualString);
        }
        let progress = 0;
        if (typeof printer.currentJob !== "undefined" && printer.currentJob.progress !== null) {
          progress = printer.currentJob.progress.toFixed(0);
        }
        heatProgress.push(
          `<div title="${
            printer.printerName
          }: ${progress}%" class="bg-${PrinterClean.getProgressColour(progress)} heatMap"></div>`
        );
      }
      const printerUptime = printer.currentActive + printer.currentIdle + printer.currentOffline;
      const percentUp = (printer.currentActive / printerUptime) * 100;
      heatUtilisation.push(
        `<div title="${printer.printerName}: ${percentUp.toFixed(
          0
        )}" class="bg-${PrinterClean.getProgressColour(percentUp)} heatMap"></div>`
      );
    }
  }
  let timeStamp = new Date();
  timeStamp = timeStamp.getTime();
  const totalGlobalToolTempActual = arrayGlobalToolTempActual.reduce((a, b) => a + b, 0);
  const totalGlobalToolTempTarget = arrayGlobalToolTempTarget.reduce((a, b) => a + b, 0);
  const totalGlobalBedTempActual = arrayGlobalBedTempActual.reduce((a, b) => a + b, 0);
  const totalGlobalBedTempTarget = arrayGlobalBedTempTarget.reduce((a, b) => a + b, 0);
  const totalGlobalChamberTempActual = arrayGlobalChamberTempActual.reduce((a, b) => a + b, 0);
  const totalGlobalChamberTempTarget = arrayGlobalChamberTempTarget.reduce((a, b) => a + b, 0);
  const totalGlobalTemp =
    totalGlobalToolTempActual + totalGlobalBedTempActual + totalGlobalChamberTempActual;
  currentHistoryTemp[0].data.push({
    x: timeStamp,
    y: totalGlobalToolTempActual
  });
  currentHistoryTemp[1].data.push({
    x: timeStamp,
    y: totalGlobalToolTempTarget
  });
  currentHistoryTemp[2].data.push({
    x: timeStamp,
    y: totalGlobalBedTempActual
  });
  currentHistoryTemp[3].data.push({
    x: timeStamp,
    y: totalGlobalBedTempTarget
  });
  currentHistoryTemp[4].data.push({
    x: timeStamp,
    y: totalGlobalChamberTempActual
  });
  currentHistoryTemp[5].data.push({
    x: timeStamp,
    y: totalGlobalChamberTempTarget
  });
  if (currentHistoryTemp[0].data.length > 720) {
    currentHistoryTemp[0].data.shift();
    currentHistoryTemp[1].data.shift();
    currentHistoryTemp[2].data.shift();
    currentHistoryTemp[3].data.shift();
    currentHistoryTemp[4].data.shift();
    currentHistoryTemp[5].data.shift();
  }
  dashboardStatistics.temperatureGraph = currentHistoryTemp;
  const totalEstimated = arrayEstimated.reduce((a, b) => a + b, 0);
  const totalRemaining = arrayRemaining.reduce((a, b) => a + b, 0);
  const totalElapsed = arrayElapsed.reduce((a, b) => a + b, 0);
  const averageEstimated = totalEstimated / arrayEstimated.length;
  const averageRemaining = totalRemaining / arrayRemaining.length;
  const averageElapsed = totalElapsed / arrayElapsed.length;
  const cumulativePercent = (totalElapsed / totalEstimated) * 100;
  const cumulativePercentRemaining = 100 - cumulativePercent;
  const averagePercent = (averageElapsed / averageEstimated) * 100;
  const averagePercentRemaining = 100 - averagePercent;
  dashboardStatistics.timeEstimates = {
    totalElapsed,
    totalRemaining,
    totalEstimated,
    averageElapsed,
    averageRemaining,
    averageEstimated,
    cumulativePercent,
    cumulativePercentRemaining,
    averagePercent,
    averagePercentRemaining,
    totalFarmTemp: totalGlobalTemp
  };

  const activeHours = arrayActive.reduce((a, b) => a + b, 0);
  const idleHours = arrayIdle.reduce((a, b) => a + b, 0);
  const offlineHours = arrayOffline.reduce((a, b) => a + b, 0);
  const failedHours = historyStats.currentFailed;
  const totalHours = historyStats.currentFailed + activeHours + idleHours + offlineHours;
  const activePercent = (activeHours / totalHours) * 100;
  const offlinePercent = (offlineHours / totalHours) * 100;
  const idlePercent = (idleHours / totalHours) * 100;
  const failedPercent = (failedHours / totalHours) * 100;

  dashboardStatistics.farmUtilisation = {
    activeHours,
    failedHours,
    idleHours,
    offlineHours,
    activeHoursPercent: activePercent,
    failedHoursPercent: failedPercent,
    idleHoursPercent: idlePercent,
    offlineHoursPercent: offlinePercent
  };
  dashboardStatistics.printerHeatMaps = {
    heatStatus,
    heatProgress,
    heatTemps,
    heatUtilisation
  };
  dashboardStatistics.utilisationGraph = getHeatMap();

  // TODO this is old old code
  //Find min / max values for gas_resistance to tweak calulation...
  RoomData.find({})
    .sort({ _id: -1 })
    .limit(500)
    .exec(function (err, posts) {
      const currentEnviromentalData = [
        {
          name: "Temperature",
          data: []
        },
        {
          name: "Humidity",
          data: []
        },
        {
          name: "Pressure",
          data: []
        },
        {
          name: "IAQ",
          data: []
        }
      ];

      const enviromentalData = posts;
      if (!!enviromentalData) {
        for (let i = 0; i < enviromentalData.length; i++) {
          if (
            typeof enviromentalData[i].temperature !== "undefined" &&
            enviromentalData[i].temperature !== null
          ) {
            currentEnviromentalData[0].data.push({
              x: enviromentalData[i].date,
              y: enviromentalData[i].temperature.toFixed(2)
            });
            dashboardStatistics.currentTemperature = enviromentalData[0].temperature.toFixed(2);
          } else {
            currentEnviromentalData[0].data.push({
              x: enviromentalData[i].date,
              y: null
            });
          }
          if (
            typeof enviromentalData[i].humidity !== "undefined" &&
            enviromentalData[i].humidity !== null
          ) {
            currentEnviromentalData[1].data.push({
              x: enviromentalData[i].date,
              y: enviromentalData[i].humidity.toFixed(0)
            });
            dashboardStatistics.currentHumidity = enviromentalData[0].humidity;
          } else {
            currentEnviromentalData[1].data.push({
              x: enviromentalData[i].date,
              y: null
            });
          }
          if (
            typeof enviromentalData[i].pressure !== "undefined" &&
            enviromentalData[i].pressure !== null
          ) {
            currentEnviromentalData[2].data.push({
              x: enviromentalData[i].date,
              y: enviromentalData[i].pressure.toFixed(0)
            });
            dashboardStatistics.currentPressure = enviromentalData[0].pressure.toFixed(0);
          } else {
            currentEnviromentalData[2].data.push({
              x: enviromentalData[i].date,
              y: null
            });
          }
          if (typeof enviromentalData[i].iaq !== "undefined" && enviromentalData[i].iaq !== null) {
            currentEnviromentalData[3].data.push({
              x: enviromentalData[i].date,
              y: enviromentalData[i].iaq.toFixed(0)
            });
            dashboardStatistics.currentIAQ = enviromentalData[0].iaq.toFixed(0);
          } else {
            currentEnviromentalData[3].data.push({
              x: enviromentalData[i].date,
              y: null
            });
          }
        }
      }
      dashboardStatistics.enviromentalData = currentEnviromentalData;
    });
};

const sortCurrentOperations = async () => {
  const farmPrinters = getPrinterStoreCache().listPrintersInformation();
  const complete = [];
  const active = [];
  const idle = [];
  const offline = [];
  const disconnected = [];
  const progress = [];
  const operations = [];
  try {
    for (let i = 0; i < farmPrinters.length; i++) {
      const printer = farmPrinters[i];
      if (typeof printer !== "undefined") {
        const name = printer.printerName;

        if (typeof printer.printerState !== "undefined") {
          if (printer.printerState.colour.category === "Idle") {
            idle.push(printer._id);
          }
          if (printer.printerState.colour.category === "Offline") {
            offline.push(printer._id);
          }
          if (printer.printerState.colour.category === "Disconnected") {
            disconnected.push(printer._id);
          }
        }

        if (typeof printer.printerState !== "undefined" && printer.currentJob != null) {
          let id = printer._id;
          id = id.toString();
          if (printer.printerState.colour.category === "Complete") {
            complete.push(printer._id);
            progress.push(printer.currentJob.progress);
            operations.push({
              index: id,
              sortIndex: printer.sortIndex,
              name,
              progress: Math.floor(printer.currentJob.progress),
              progressColour: "success",
              timeRemaining: printer.currentJob.printTimeRemaining,
              fileName: printer.currentJob.fileDisplay
            });
          }

          if (
            printer.printerState.colour.category === "Active" &&
            typeof printer.currentJob !== "undefined"
          ) {
            active.push(printer._id);
            progress.push(printer.currentJob.progress);
            operations.push({
              index: id,
              sortIndex: printer.sortIndex,
              name,
              progress: Math.floor(printer.currentJob.progress),
              progressColour: "warning",
              timeRemaining: printer.currentJob.printTimeRemaining,
              fileName: printer.currentJob.fileDisplay
            });
          }
        }
      }
    }

    const actProg = progress.reduce((a, b) => a + b, 0);

    currentOperations.count.farmProgress = Math.floor(actProg / progress.length);

    if (isNaN(currentOperations.count.farmProgress)) {
      currentOperations.count.farmProgress = 0;
    }
    if (currentOperations.count.farmProgress === 100) {
      currentOperations.count.farmProgressColour = "success";
    } else {
      currentOperations.count.farmProgressColour = "warning";
    }
    // 17280

    if (heatMapCounter >= 17280) {
      await heatMapping(
        currentOperations.count.complete,
        currentOperations.count.active,
        currentOperations.count.offline,
        currentOperations.count.idle,
        currentOperations.count.disconnected
      );
      heatMapCounter = 0;
    } else {
      heatMapCounter += 1728;
    }

    currentOperations.count.printerCount = farmPrinters.length;
    currentOperations.count.complete = complete.length;
    currentOperations.count.active = active.length;
    currentOperations.count.offline = offline.length;
    currentOperations.count.idle = idle.length;
    currentOperations.count.disconnected = disconnected.length;

    const { currentIterie, currentOrder } = returnCurrentOrdering();
    const iterie = [currentIterie];
    const order = [currentOrder];
    currentOperations.operations = _.orderBy(operations, iterie, order);
  } catch (err) {
    logger.error(`Current Operations issue: ${err}`);
  }
};

module.exports = {
  generatePrinterStatistics,
  generateDashboardStatistics,
  sortCurrentOperations,
  getDashboardStatistics,
  getCurrentOperations,
  getCurrentHistoryTemp
};
