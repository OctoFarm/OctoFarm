const { getHistoryCache } = require("../cache/history.cache");
const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const _ = require("lodash");
const { checkNested, checkNestedIndex, sumValuesGroupByDate } = require("../utils/array.util");

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

module.exports = {
  generatePrinterStatistics
};
