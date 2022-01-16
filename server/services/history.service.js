"use strict";

const historyModel = require("../models/History");
const {
  myCustomLabels,
  defaultPaginationOptions,
  defaultInputFilters
} = require("../constants/history-sort.constants");

const defaultHistoryObject = {
  printHistory: {
    printerName: "OctoPrint-0",
    costSettings: {
      powerConsumption: 0.5,
      electricityCosts: 0.15,
      purchasePrice: 500,
      estimateLifespan: 43800,
      maintenanceCosts: 0.25
    },
    success: true,
    fileName: "KeyCap_Opener_0.15mm_OverturePETG_MK3S_32m.gcode",
    filePath: "GRM3D/Customers/Hershberger/KeyCap_Opener_0.15mm_OverturePETG_MK3S_32m.gcode",
    startDate: { $date: "2020-10-01T06:28:02.000Z" },
    endDate: { $date: "2020-10-01T07:01:48.000Z" },
    printTime: 2026,
    filamentSelection: [null],
    previousFilamentSelection: [null],
    job: {
      averagePrintTime: 2000.041373978369,
      lastPrintTime: 2025.9136504530907,
      user: "admin",
      file: {
        origin: "local",
        name: "KeyCap_Opener_0.15mm_OverturePETG_MK3S_32m.gcode",
        date: 1601510856,
        path: "GRM3D/Customers/Hershberger/KeyCap_Opener_0.15mm_OverturePETG_MK3S_32m.gcode",
        display: "KeyCap_Opener_0.15mm_OverturePETG_MK3S_32m.gcode",
        size: 1034896,
        length: [866.001599999987]
      },
      estimatedPrintTime: 1575.6735319681206,
      filament: { tool0: { volume: 2.0829779525514267, length: 866.001599999987 } }
    }
  }
};

/**
 * Finds the history rows in the database.
 * @param {any} input
 * @param options
 */
async function find(input = defaultInputFilters, options = defaultPaginationOptions) {
  //Merge in the custom labels used
  options = { ...options, ...{ customLabels: myCustomLabels } };
  return historyModel.paginate(input, options, function (err, result) {
    return { itemList: result.docs, pagination: result.paginator };
  });
}

/**
 * Get file specifications from a previous print job
 * @param history
 * @returns {{path: (*|string|null|string|string|string), uploadDate: (*|null), size: (*|null), lastPrintTime: (number|*|null), name, averagePrintTime: (number|*|null)}}
 */
function getFileFromHistoricJob(history) {
  const historyJob = history?.job;
  const historyJobFile = history?.job?.file;

  return {
    name: history.fileName,
    uploadDate: historyJobFile?.date || null,
    path: historyJobFile?.path || history.filePath, // TODO discuss this alternative
    size: historyJobFile?.size || null,
    averagePrintTime: historyJob?.averagePrintTime || null,
    lastPrintTime: historyJob?.lastPrintTime || null
  };
}

async function generateYearsWorthOfHistory() {
  function getDaysInMonth(month, year) {
    var date = new Date(year, month, 1);
    var days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }

  let successRatePerDay = [];

  function generateRandom() {
    var y = Math.random();
    if (y < 0.5) return 0;
    else return 1;
  }

  function generateSuccessRate() {
    successRatePerDay = [];
    for (let i = 0; i < 20; i++) {
      successRatePerDay.push(generateRandom() ? "success" : "cancelled");
    }
  }

  generateSuccessRate();

  const monthList = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  for (let i = 0; i < monthList.length; i++) {
    const currentMonth = monthList[i];
    const dayList = getDaysInMonth(currentMonth, 2022);
    for (let d = 0; d < dayList.length; d++) {
      generateSuccessRate();
      for (let r = 0; r < successRatePerDay.length; r++) {
        const currentState = successRatePerDay[r];
        if (currentState === "success") {
          defaultHistoryObject.printHistory.success = true;
        } else {
          defaultHistoryObject.printHistory.success = false;
        }
        const currentDay = dayList[d];
        defaultHistoryObject.printHistory.printTime =
          Math.floor(Math.random() * 2 * 86400000) / 1000;
        defaultHistoryObject.printHistory.startDate = new Date(currentDay);
        let endDate = new Date(currentDay);
        defaultHistoryObject.printHistory.endDate = new Date(
          endDate.getTime() + defaultHistoryObject.printHistory.printTime * 1000
        );

        const history = new historyModel(defaultHistoryObject);
        await history.save();
      }
    }
  }
}

module.exports = {
  find,
  getFileFromHistoricJob,
  generateYearsWorthOfHistory
};
