const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const FarmStatistics = require("../models/FarmStatistics.js");
const SystemInfo = require("../models/SystemInfo");
const runner = require("../runners/state.js");
const Runner = runner.Runner;

module.exports = router;

router.get("/dash/get", ensureAuthenticated, async (req, res) => {
  let printers = await Runner.returnFarmPrinters();
  let statistics = await FarmStatistics.find({});
  let printerInfo = [];
  let systemInformation = await SystemInfo.find({});
  for (let i = 0; i < printers.length; i++){
    printer = {
      state: printers[i].state,
      index: printers[i].index,
      ip: printers[i].ip,
      port: printers[i].port,
      camURL: printers[i].camURL,
      apikey: printers[i].apikey,
      currentZ: printers[i].currentZ,
      progress: printers[i].progress,
      job: printers[i].job,
      profile: printers[i].profiles,
      temps: printers[i].temps,
      filesList: printers[i].fileList,
      url: printers[i].ip + ":" + printers[i].port,
      settingsAppearance: printers[i].settingsApperance,
      stateColour: printers[i].stateColour,
      current: printers[i].current,
      options: printers[i].options
    }
    printerInfo.push(printer)
  }
  let dashboardInfo = {
    printerInfo: printerInfo,
    currentOperations: statistics[0].currentOperations,
    currentOperationsCount: statistics[0].currentOperationsCount,
    farmInfo: statistics[0].farmInfo,
    octofarmStatistics: statistics[0].octofarmStatistics,
    printStatistics: statistics[0].printStatistics,
    systemInfo: systemInformation[0]
  }
  res.json(dashboardInfo);
});