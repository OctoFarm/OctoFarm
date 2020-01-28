const FarmStatistics = require("../models/FarmStatistics.js");
const Printers = require("../models/Printer.js");

class StatisticsCollection {
  static init() {
    setInterval(function() {
      StatisticsCollection.grab();
    }, 3000);
  }
  static async grab() {
    FarmStatistics.find({}).then(async farmStats => {
      let farmInfo = await this.blankFarmInfo();
      let octofarmStatistics = {};
      let printStatistics = {};
      if (typeof farmStats === undefined || farmStats.length < 1) {
        let newfarmStats = new FarmStatistics({
          farmInfo,
          octofarmStatistics,
          printStatistics
        });
        newfarmStats.save();
      } else {
        //Count Printers
        let printers = await Printers.find({});
        farmInfo.printerCount = printers.length;
        //Grab state counts
        let complete = [];
        let active = [];
        let idle = [];
        let offline = [];
        let toolA = [];
        let toolT = [];
        let bedA = [];
        let bedT = [];
        let progress = [];
        let currentOperations = [];
        let printTimeEstimate = [];
        let printTimeRemaining = [];
        let printTimeElapsed = [];
        printers.forEach(printer => {
          if (printer.stateColour.category === "Complete") {
            complete.push(printer.index);
            toolA.push(printer.temperature.tool0.actual);
            toolT.push(printer.temperature.tool0.target);
            bedA.push(printer.temperature.bed.actual);
            bedT.push(printer.temperature.bed.target);
            progress.push(printer.progress.completion);
            currentOperations.push({
              index: printer.index,
              name: printer.settingsApperance.name,
              progress: Math.floor(printer.progress.completion),
              progressColour: "success"
            })
            printTimeEstimate.push(printer.job.estimatedPrintTime)
            printTimeRemaining.push(printer.progress.printTimeLeft)
            printTimeElapsed.push(printer.progress.printTime)
          }
          if (printer.stateColour.category === "Active") {
            active.push(printer.index);
            toolA.push(printer.temperature.tool0.actual);
            toolT.push(printer.temperature.tool0.target);
            bedA.push(printer.temperature.bed.actual);
            bedT.push(printer.temperature.bed.target);
            progress.push(printer.progress.completion);
            currentOperations.push({
              index: printer.index,
              name: printer.settingsApperance.name,
              progress: Math.floor(printer.progress.completion),
              progressColour: "warning"
            })
            printTimeEstimate.push(printer.job.estimatedPrintTime)
            printTimeRemaining.push(printer.progress.printTimeLeft)
            printTimeElapsed.push(printer.progress.printTime)
          }
          if (printer.stateColour.category === "Idle") {
            idle.push(printer.index);
            toolA.push(printer.temperature.tool0.actual);
            toolT.push(printer.temperature.tool0.target);
            bedA.push(printer.temperature.bed.actual);
            bedT.push(printer.temperature.bed.target);
          }
          if (
            printer.stateColour.category === "Offline" ||
            printer.stateColour.category === "Closed"
          ) {
            offline.push(printer.index);
          }
        });

        farmInfo.complete = complete.length;
        farmInfo.active = active.length;
        farmInfo.idle = idle.length;
        farmInfo.offline = offline.length;
        farmInfo.activeToolT = toolA.reduce((a, b) => a + b, 0);
        farmInfo.activeToolA = toolT.reduce((a, b) => a + b, 0);
        farmInfo.activeBedA = bedA.reduce((a, b) => a + b, 0);
        farmInfo.activeBedT = bedT.reduce((a, b) => a + b, 0);
        let actProg = progress.reduce((a, b) => a + b, 0);
        farmInfo.farmProgress = Math.floor(actProg / progress.length)
        if(farmInfo.farmProgress === 100){
          farmInfo.farmProgressColour = "success"
        }else{
          farmInfo.farmProgressColour = "warning"
        }
        farmInfo.currentOperations = currentOperations;
        farmInfo.totalElapsedTime = printTimeElapsed.reduce((a, b) => a + b, 0);
        farmInfo.totalRemainingTime = printTimeRemaining.reduce((a, b) => a + b, 0);
        farmInfo.totalEstimateTime = printTimeEstimate.reduce((a, b) => a + b, 0);
        farmInfo.avgElapsedTime =  farmInfo.totalElapsedTime / printTimeElapsed.length;
        farmInfo.avgRemainingTime = farmInfo.totalRemainingTime / printTimeRemaining.length;
        farmInfo.avgEstimateTime = farmInfo.totalEstimateTime / printTimeEstimate.length;

        farmStats[0].farmInfo = farmInfo;

        farmStats[0].save();
      }
    });
  }
  static blankFarmInfo() {
    let farmInfo = {
      printerCount: 0,
      complete: 0,
      offline: 0,
      active: 0,
      idle: 0,
      activeToolT: 0,
      activeBedT: 0,
      activeToolA: 0,
      activeBedA: 0,
      farmProgress: 0,
      farmProgressColour: "",
      avgEstimateTime: 0,
      avgRemainingTime: 0,
      avgElapsedTime: 0,
      totalEstimateTime: 0,
      totalRemainingTime: 0,
      totalElapsedTime: 0,
      currentOperations: []
    };
    return farmInfo;
  }
}

module.exports = {
  StatisticsCollection: StatisticsCollection
};
