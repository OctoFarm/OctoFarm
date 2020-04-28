const FarmStatistics = require("../models/FarmStatistics.js");
const History = require("../models/History.js");
const _ = require("lodash");
const filamentType = require("../config/filaments.js");
const returnFilamentTypes = filamentType.returnFilamentTypes;

let farmStats = [];

class StatisticsCollection {
  static returnStats() {
    return farmStats[0];
  }
  static async init() {
    farmStats = await FarmStatistics.find({});
    let farmInfo = await this.blankFarmInfo();
    let currentOperations = [];
    let octofarmStatistics = await this.blankFarmStatistics();
    let printStatistics = await this.blankPrintStatistics();
    let currentOperationsCount = await this.blankCurrentCount();
    if (typeof farmStats === undefined || farmStats.length < 1) {
      let newfarmStats = new FarmStatistics({
        farmInfo,
        octofarmStatistics,
        printStatistics,
        currentOperations,
        currentOperationsCount
      });

      farmStats[0] = newfarmStats;
      newfarmStats.save();
    }
    //Saving is pointless now, it keeps crashing anyway due to some concurrent error even though it's the only thing hitting this database...
    // setInterval(async () => {
    //   farmStats[0].save().catch(err => {
    //     console.log(err, "Error saving farm statistics...");
    //   });
    // }, 5000);
    return "Statistics collection has started...";
  }
  static async currentOperations(farmPrinters) {
    let currentOperations = [];
    let currentOperationsCount = await this.blankCurrentCount();
    let complete = [];
    let active = [];
    let idle = [];
    let offline = [];
    let disconnected = [];
    let progress = [];
    let closed = [];
    try {
      farmPrinters.forEach(printer => {
        let name = "";
        if (typeof printer.settingsApperance != "undefined") {
          if (printer.settingsApperance.name === "" || printer.settingsApperance.name === null) {
            name = printer.printerURL;
          } else {
            name = printer.settingsApperance.name;
          }
        } else {
          name = printer.printerURL;
        }
        if (typeof printer.stateColour != "undefined") {
          if (printer.stateColour.category === "Idle") {
            idle.push(printer._id);
          }
          if (
            printer.stateColour.category === "Offline"
          ) {
            offline.push(printer._id);
          }
          if (
              printer.stateColour.category === "Disconnected"
          ) {
            disconnected.push(printer._id);
          }

        }
        if (typeof printer.state != undefined && printer.state === "Closed") {
          closed.push(printer._id);
        }
        
        if (
          typeof printer.stateColour != "undefined" &&
          typeof printer.progress != "undefined"
        ) {
          let id = printer._id
          id = id.toString();
          if (printer.stateColour.category === "Complete") {
            complete.push(printer._id);
            progress.push(printer.progress.completion);

            currentOperations.push({
              index: id,
              name: name,
              progress: Math.floor(printer.progress.completion),
              progressColour: "success",
              timeRemaining: printer.progress.printTimeLeft
            });
          }
          if (
            printer.stateColour.category === "Active" &&
            typeof printer.progress != "undefined"
          ) {
            active.push(printer._id);
            progress.push(printer.progress.completion);
            currentOperations.push({
              index: id,
              name: name,
              progress: Math.floor(printer.progress.completion),
              progressColour: "warning",
              timeRemaining: printer.progress.printTimeLeft
            });
          }
          
        }
      });
      let actProg = progress.reduce((a, b) => a + b, 0);
      currentOperationsCount.farmProgress = Math.floor(
        actProg / progress.length
      );
      if (isNaN(currentOperationsCount.farmProgress)) {
        currentOperationsCount.farmProgress = 0;
      }
      if (currentOperationsCount.farmProgress === 100) {
        currentOperationsCount.farmProgressColour = "success";
      } else {
        currentOperationsCount.farmProgressColour = "warning";
      }
      currentOperationsCount.printerCount = farmPrinters.length;
      currentOperationsCount.complete = complete.length;
      currentOperationsCount.active = active.length;
      currentOperationsCount.offline = offline.length;
      currentOperationsCount.idle = idle.length;
      currentOperationsCount.disconnected = disconnected.length;
      currentOperationsCount.closed = closed.length;
      currentOperations = _.orderBy(currentOperations, ["progress"], ["desc"]);
      farmStats[0].currentOperations = currentOperations;
      farmStats[0].currentOperationsCount = currentOperationsCount;
    } catch (err) {
      console.log("Current Operations issue: " + err);
    }
  }
  static async farmInformation(farmPrinters) {
    let farmInfo = await this.blankFarmInfo();
    let printTimeEstimate = [];
    let printTimeRemaining = [];
    let printTimeElapsed = [];
    let toolA = [];
    let toolT = [];
    let bedA = [];
    let bedT = [];
    farmPrinters.forEach(printer => {
      if (typeof printer.stateColour != "undefined") {
        if (printer.stateColour.category === "Active") {
          if (typeof printer.job != "undefined") {
            printTimeEstimate.push(printer.job.estimatedPrintTime);
          }
          if (typeof printer.progress != "undefined") {
            printTimeRemaining.push(printer.progress.printTimeLeft);
            printTimeElapsed.push(printer.progress.printTime);
          }
          if (typeof printer.temps != "undefined") {
            toolA.push(printer.temps[0].tool0.actual);
            toolT.push(printer.temps[0].tool0.target);
            bedA.push(printer.temps[0].bed.actual);
            bedT.push(printer.temps[0].bed.target);
          }
        }
      }
    });

    farmInfo.activeToolA =
      Math.round(toolA.reduce((a, b) => a + b, 0) * 10) / 10;
    farmInfo.activeToolT =
      Math.round(toolT.reduce((a, b) => a + b, 0) * 10) / 10;
    farmInfo.activeBedA = Math.round(bedA.reduce((a, b) => a + b, 0) * 10) / 10;
    farmInfo.activeBedT = Math.round(bedT.reduce((a, b) => a + b, 0) * 10) / 10;

    farmInfo.totalElapsedTime = printTimeElapsed.reduce((a, b) => a + b, 0);
    farmInfo.totalRemainingTime = printTimeRemaining.reduce((a, b) => a + b, 0);
    farmInfo.totalEstimateTime = printTimeEstimate.reduce((a, b) => a + b, 0);
    farmInfo.avgElapsedTime =
      farmInfo.totalElapsedTime / printTimeElapsed.length;
    farmInfo.avgRemainingTime =
      farmInfo.totalRemainingTime / printTimeRemaining.length;
    farmInfo.avgEstimateTime =
      farmInfo.totalEstimateTime / printTimeEstimate.length;

    farmStats[0].farmInfo = farmInfo;
  }

  static async octofarmStatistics(farmPrinters) {
    let octofarmStatistics = await this.blankFarmStatistics();
    let history = await History.find({});
    let printTimes = [];
    history.forEach(print => {
      if (print.printHistory.success) {
        printTimes.push(print.printHistory.printTime);
      } else {
        if (print.printHistory.reason === "cancelled") {
          printTimes.push(print.printHistory.printTime);
        }
      }
    });
    // farmPrinters.forEach(printer => {
    //   if (typeof printer.stateColour != "undefined") {
    //     if (printer.stateColour.category === "Active") {
    //       //Need to figure this out
    //     }
    //   }
    // });
    let printTimesTotal = printTimes.reduce((a, b) => a + b, 0);

    let currentDate = new Date();
    octofarmStatistics.activeHours = printTimesTotal;
    octofarmStatistics.idleHours =
      currentDate.getTime() - farmStats[0].farmStart.getTime();
    octofarmStatistics.idleHours =
      (octofarmStatistics.idleHours / 1000) * farmPrinters.length;
    octofarmStatistics.idleHours =
      octofarmStatistics.idleHours - octofarmStatistics.activeHours;
    octofarmStatistics.totalHours =
      octofarmStatistics.idleHours + octofarmStatistics.activeHours;

    octofarmStatistics.activePercent =
      (octofarmStatistics.activeHours / octofarmStatistics.totalHours) * 100;
    if (isNaN(octofarmStatistics.activePercent)) {
      octofarmStatistics.activePercent = 100;
    }
    if (octofarmStatistics.activePercent === Infinity) {
      octofarmStatistics.activePercent = 0;
    }
    octofarmStatistics.idlePercent =
      (octofarmStatistics.idleHours / octofarmStatistics.totalHours) * 100;
    if (isNaN(octofarmStatistics.idlePercent)) {
      octofarmStatistics.idlePercent = 100;
    }
    if (octofarmStatistics.idlePercent === Infinity) {
      octofarmStatistics.idlePercent = 0;
    }
    octofarmStatistics.activePercent =
      Math.round(octofarmStatistics.activePercent * 10) / 10;
    octofarmStatistics.idlePercent =
      Math.round(octofarmStatistics.idlePercent * 10) / 10;

    let storageFree = [];
    let storageTotal = [];
    let devices = [];
    let fileSizes = [];
    //Collect unique devices - Total for farm storage should not duplicate storage on instances running on same devices.
    farmPrinters.forEach((printer, index) => {
      if (typeof printer.storage != "undefined") {
        let device = {
          ip: printer.printerURL,
          index: printer.index,
          storage: printer.storage
        };
        devices.push(device);
      }
      if (typeof printer.fileList != "undefined") {
        printer.fileList.files.forEach(file => {
          fileSizes.push(file.size);
        });
      }
    });

    let uniqueDevices = _.uniqBy(devices, "ip");

    uniqueDevices.forEach(device => {
      storageFree.push(device.storage.free);
      storageTotal.push(device.storage.total);
    });

    let storageFreeTotal = storageFree.reduce((a, b) => a + b, 0);
    let storageTotalTotal = storageTotal.reduce((a, b) => a + b, 0);

    octofarmStatistics.storageUsed = storageTotalTotal - storageFreeTotal;
    octofarmStatistics.storageRemain = storageFreeTotal;
    octofarmStatistics.storagePercent = Math.floor(
      (octofarmStatistics.storageUsed / storageTotalTotal) * 100
    );

    octofarmStatistics.largestFile = Math.max(...fileSizes);
    octofarmStatistics.smallestFile = Math.min(...fileSizes);

    farmStats[0].octofarmStatistics = octofarmStatistics;
  }
  static async printStatistics() {
    let printStatistics = await this.blankPrintStatistics();
    let history = await History.find({});
    let completed = [];
    let cancelled = [];
    let failed = [];
    let printTimes = [];
    let filamentLengths = [];
    let filamentWeights = [];
    history.forEach(print => {
      if (print.printHistory.filamentLength != "-") {
        filamentLengths.push(print.printHistory.filamentLength);
      }

      if (print.printHistory.success) {
        let filamentTypes = returnFilamentTypes();
        let calcWeight = null;
        if (
          typeof print.printHistory.filamentSelection != "undefined" &&
          print.printHistory.filamentSelection != "None chosen..."
        ) {
          let currentType = null;
          let filamentKeys = Object.entries(filamentTypes);

          filamentKeys.forEach(entry => {
            if (
              entry[0] === print.printHistory.filamentSelection.roll.type[0]
            ) {
              currentType = entry[1].density;
            }
          });
          calcWeight =
            (3.14 * (1.75 / 2)) ^
            ((2 * parseFloat(currentType) * print.printHistory.filamentLength) /
              1000);
        } else {
          calcWeight =
            (3.14 * (1.75 / 2)) ^
            ((2 * 1.24 * print.printHistory.filamentLength) / 1000);
        }

        completed.push(print.printHistory.success);
        printTimes.push(print.printHistory.printTime);
        filamentLengths.push(print.printHistory.filamentLength);
        filamentWeights.push(calcWeight);
      } else {
        if (print.printHistory.reason === "cancelled") {
          cancelled.push(print.printHistory.success);
        } else {
          failed.push(print.printHistory.success);
        }
      }
    });

    printStatistics.completed = completed.length;
    printStatistics.cancelled = cancelled.length;
    printStatistics.failed = failed.length;

    printStatistics.completedPercent =
      (completed.length /
        (completed.length + cancelled.length + failed.length)) *
      100;
    if (isNaN(printStatistics.completedPercent)) {
      printStatistics.completedPercent = 100;
    }
    if (printStatistics.completedPercent === Infinity) {
      printStatistics.completedPercent = 0;
    }
    printStatistics.cancelledPercent =
      (cancelled.length /
        (cancelled.length + completed.length + failed.length)) *
      100;
    if (isNaN(printStatistics.cancelledPercent)) {
      printStatistics.cancelledPercent = 100;
    }
    if (printStatistics.cancelledPercent === Infinity) {
      printStatistics.cancelledPercent = 0;
    }
    printStatistics.failedPercent =
      (failed.length / (failed.length + completed.length + cancelled.length)) *
      100;
    if (isNaN(printStatistics.failedPercent)) {
      printStatistics.failedPercent = 100;
    }
    if (printStatistics.failedPercent === Infinity) {
      printStatistics.failedPercent = 0;
    }
    printStatistics.completedPercent = printStatistics.completedPercent;
    printStatistics.cancelledPercent = printStatistics.cancelledPercent;
    printStatistics.failedPercent = printStatistics.failedPercent;

    printStatistics.longestPrint = Math.max(...printTimes);
    if (printStatistics.longestPrint === -Infinity) {
      printStatistics.longestPrint = 0;
    }
    printStatistics.shortestPrint = Math.min(...printTimes);
    if (printStatistics.shortestPrint === Infinity) {
      printStatistics.shortestPrint = 0;
    }
    printStatistics.averagePrintTime = printTimes.reduce((a, b) => a + b, 0);

    printStatistics.averagePrintTime =
      printStatistics.averagePrintTime / printTimes.length;
    if (isNaN(printStatistics.averagePrintTime)) {
      printStatistics.averagePrintTime = 0;
    }

    let totalFilamentLength = filamentLengths.reduce((a, b) => a + b, 0);
    if (isNaN(totalFilamentLength)) {
      totalFilamentLength = 0;
    }

    totalFilamentLength = totalFilamentLength / 1000;
    totalFilamentLength = Math.round(totalFilamentLength * 100) / 100;

    let totalFilamentWeight = filamentWeights.reduce((a, b) => a + b, 0);
    if (isNaN(totalFilamentWeight)) {
      totalFilamentWeight = 0;
    }

    printStatistics.filamentUsage =
      totalFilamentLength + "m / " + totalFilamentWeight + "g";

    farmStats[0].printStatistics = printStatistics;
  }
  static blankCurrentCount() {
    let currentOperationsCount = {
      printerCount: 0,
      complete: 0,
      offline: 0,
      active: 0,
      idle: 0,
      disconnected: 0,
      farmProgress: 0,
      farmProgressColour: "danger"
    };
    return currentOperationsCount;
  }
  static blankFarmInfo() {
    let farmInfo = {
      activeToolT: 0,
      activeBedT: 0,
      activeToolA: 0,
      activeBedA: 0,
      avgEstimateTime: 0,
      avgRemainingTime: 0,
      avgElapsedTime: 0,
      totalEstimateTime: 0,
      totalRemainingTime: 0,
      totalElapsedTime: 0
    };
    return farmInfo;
  }
  static blankFarmStatistics() {
    let octofarmStatistics = {
      activeHours: 0,
      activePercent: 0,
      idleHours: 0,
      idlePercent: 0,
      totalHours: 0,
      storageUsed: 0,
      storagePercent: 0,
      storageRemain: 0,
      largestFile: 0,
      smallestFile: 0
    };
    return octofarmStatistics;
  }
  static blankPrintStatistics() {
    let printStatistics = {
      completed: 0,
      completedPercent: 33.3,
      cancelled: 0,
      cancelledPercent: 33.3,
      failed: 0,
      failedPercent: 33.3,
      longestPrint: 0,
      shortestPrint: 0,
      averagePrintTime: 0,
      filamentUsage: 0
    };
    return printStatistics;
  }
}

module.exports = {
  StatisticsCollection: StatisticsCollection
};
