const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const db = require("../config/db").MongoURI;
const pjson = require("../package.json");
const ClientSettings = require("../models/ClientSettings.js");
const Filament = require("../models/Filament.js");
const SystemInfo = require("../models/SystemInfo.js");
const prettyHelpers = require("../views/partials/functions/pretty.js");
const runner = require("../runners/state.js");
const Runner = runner.Runner;
const _ = require("lodash");
const filamentType = require("../config/filaments.js");
const returnFilamentTypes = filamentType.returnFilamentTypes;
const serverConfig = require("../serverConfig/server.js");

console.log("db: " + db);

const Roll = require("../models/Filament.js");

//Welcome Page
if (db === "") {
  //No db setup, show db warning before login.
  router.get("/", (req, res) =>
    res.render("database", { page: "Database Warning" })
  );
} else {
  router.get("/", (req, res) => res.render("welcome", { page: "Welcome" }));
}

//Dashboard Page
router.get("/dashboard", ensureAuthenticated, async (req, res) => {
  let printers = await Runner.returnFarmPrinters();
  let sortedPrinters = await Runner.sortedIndex();
  console.log(sortedPrinters);
  const farmStatistics = require("../runners/statisticsCollection.js");
  const FarmStatistics = farmStatistics.StatisticsCollection;
  let statistics = await FarmStatistics.returnStats();
  let systemInformation = await SystemInfo.find({});
  let filament = await Filament.find({});
  let user = null;
  let group = null;
  if (serverConfig.loginRequired === false) {
    user = "No User";
    group = "Administrator";
  } else {
    user = req.user.name;
    group = req.user.group;
  }

  res.render("dashboard", {
    name: user,
    userGroup: group,
    version: pjson.version,
    sortedIndex: sortedPrinters,
    printers: printers,
    farmInfo: statistics.farmInfo,
    currentOperations: statistics.currentOperations,
    octofarmStatistics: statistics.octofarmStatistics,
    printStatistics: statistics.printStatistics,
    printerCount: printers.length,
    currentOperationsCount: statistics.currentOperationsCount,
    page: "Dashboard",
    helpers: prettyHelpers,
    systemInfo: systemInformation[0],
    filament: filament
  });
});
//File Manager Page
router.get("/filemanager", ensureAuthenticated, async (req, res) => {
  let printers = await Runner.returnFarmPrinters();
  let sortedPrinters = await Runner.sortedIndex();
  let filament = await Filament.find({});
  const farmStatistics = require("../runners/statisticsCollection.js");
  const FarmStatistics = farmStatistics.StatisticsCollection;
  let statistics = await FarmStatistics.returnStats();
  let user = null;
  let group = null;
  if (serverConfig.loginRequired === false) {
    user = "No User";
    group = "Administrator";
  } else {
    user = req.user.name;
    group = req.user.group;
  }
  res.render("filemanager", {
    name: user,
    userGroup: group,
    version: pjson.version,
    printers: printers,
    printerCount: printers.length,
    currentOperationsCount: statistics.currentOperationsCount,
    page: "File Manager",
    helpers: prettyHelpers,
    filament: filament
  });
});
//History Page
router.get("/history", ensureAuthenticated, async (req, res) => {
  let printers = Runner.returnFarmPrinters();
  let sortedPrinters = await Runner.sortedIndex();
  const History = require("../models/History.js");
  let history = await History.find({});
  let filament = await Filament.find({});
  let filamentTypes = await returnFilamentTypes();
  let user = null;
  let group = null;
  if (serverConfig.loginRequired === false) {
    user = "No User";
    group = "Administrator";
  } else {
    user = req.user.name;
    group = req.user.group;
  }
  res.render("history", {
    name: user,
    userGroup: group,
    version: pjson.version,
    printers: printers,
    printerCount: printers.length,
    history: history,
    page: "History",
    helpers: prettyHelpers,
    filament: filament,
    filamentTypes: filamentTypes
  });
});
//Panel view  Page
router.get("/mon/panel", ensureAuthenticated, async (req, res) => {
  let printers = Runner.returnFarmPrinters();
  let sortedPrinters = await Runner.sortedIndex();
  const farmStatistics = require("../runners/statisticsCollection.js");
  const FarmStatistics = farmStatistics.StatisticsCollection;
  let statistics = await FarmStatistics.returnStats();
  let systemInformation = await SystemInfo.find({});
  let filament = await Filament.find({});
  let clientSettings = await ClientSettings.find({});
  let user = null;
  let group = null;
  if (serverConfig.loginRequired === false) {
    user = "No User";
    group = "Administrator";
  } else {
    user = req.user.name;
    group = req.user.group;
  }
  res.render("panelView", {
    name: user,
    userGroup: group,
    version: pjson.version,
    printers: printers,
    currentOperations: statistics.currentOperations,
    printerCount: printers.length,
    currentOperationsCount: statistics.currentOperationsCount,
    page: "Panel View",
    helpers: prettyHelpers,
    systemInfo: systemInformation[0],
    filament: filament,
    clientSettings: clientSettings
  });
});
//Camera view  Page
router.get("/mon/camera", ensureAuthenticated, async (req, res) => {
  let printers = Runner.returnFarmPrinters();
  let sortedPrinters = await Runner.sortedIndex();
  const farmStatistics = require("../runners/statisticsCollection.js");
  const FarmStatistics = farmStatistics.StatisticsCollection;
  let statistics = await FarmStatistics.returnStats();
  let systemInformation = await SystemInfo.find({});
  let filament = await Filament.find({});
  let clientSettings = await ClientSettings.find({});
  let user = null;
  let group = null;
  if (serverConfig.loginRequired === false) {
    user = "No User";
    group = "Administrator";
  } else {
    user = req.user.name;
    group = group;
  }
  res.render("cameraView", {
    name: user,
    userGroup: req.user.group,
    version: pjson.version,
    printers: printers,
    currentOperations: statistics.currentOperations,
    currentOperationsCount: statistics.currentOperationsCount,
    printerCount: printers.length,
    page: "Camera View",
    helpers: prettyHelpers,
    systemInfo: systemInformation[0],
    filament: filament,
    clientSettings: clientSettings
  });
});
//List view  Page
router.get("/mon/list", ensureAuthenticated, async (req, res) => {
  let printers = Runner.returnFarmPrinters();
  let sortedPrinters = await Runner.sortedIndex();
  const farmStatistics = require("../runners/statisticsCollection.js");
  const FarmStatistics = farmStatistics.StatisticsCollection;
  let statistics = await FarmStatistics.returnStats();
  let systemInformation = await SystemInfo.find({});
  let filament = await Filament.find({});
  let clientSettings = await ClientSettings.find({});
  let user = null;
  let group = null;
  if (serverConfig.loginRequired === false) {
    user = "No User";
    group = "Administrator";
  } else {
    user = req.user.name;
    group = group;
  }
  res.render("listView", {
    name: user,
    userGroup: req.user.group,
    version: pjson.version,
    printers: printers,
    currentOperations: statistics.currentOperations,
    currentOperationsCount: statistics.currentOperationsCount,
    printerCount: printers.length,
    page: "List View",
    helpers: prettyHelpers,
    systemInfo: systemInformation[0],
    filament: filament,
    clientSettings: clientSettings
  });
});

module.exports = router;
