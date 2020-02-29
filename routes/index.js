const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const db = require("../config/db").MongoURI;
const pjson = require("../package.json");
const Printers = require("../models/Printer.js");
const FarmStatistics = require("../models/FarmStatistics.js");
const SystemInfo = require("../models/SystemInfo.js");
const prettyHelpers = require("../views/partials/functions/pretty.js");
const runner = require("../runners/state.js");
const Runner = runner.Runner;

console.log("db: " + db);

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
  let printers = Runner.returnFarmPrinters();
  let statistics = await FarmStatistics.find({});
  let systemInformation = await SystemInfo.find({});
  res.render("dashboard", {
    name: req.user.name,
    version: pjson.version,
    printers: printers,
    farmInfo: statistics[0].farmInfo,
    currentOperations: statistics[0].currentOperations,
    octofarmStatistics: statistics[0].octofarmStatistics,
    printStatistics: statistics[0].printStatistics,
    printerCount: printers.length,
    currentOperationsCount: statistics[0].currentOperationsCount[0],
    page: "Dashboard",
    helpers: prettyHelpers,
    systemInfo: systemInformation[0]
  });
});
//File Manager Page
router.get("/filemanager", ensureAuthenticated, async (req, res) => {
  let printers = Runner.returnFarmPrinters();
  let statistics = await FarmStatistics.find({});
  let systemInformation = await SystemInfo.find({});
  res.render("dashboard", {
    name: req.user.name,
    version: pjson.version,
    printers: printers,
    farmInfo: statistics[0].farmInfo,
    currentOperations: statistics[0].currentOperations,
    octofarmStatistics: statistics[0].octofarmStatistics,
    printStatistics: statistics[0].printStatistics,
    printerCount: printers.length,
    currentOperationsCount: statistics[0].currentOperationsCount[0],
    page: "Dashboard",
    helpers: prettyHelpers,
    systemInfo: systemInformation[0]
  });
});
//History Page
router.get("/history", ensureAuthenticated, async (req, res) => {
  let printers = Runner.returnFarmPrinters();
  let statistics = await FarmStatistics.find({});
  let systemInformation = await SystemInfo.find({});
  res.render("dashboard", {
    name: req.user.name,
    version: pjson.version,
    printers: printers,
    farmInfo: statistics[0].farmInfo,
    currentOperations: statistics[0].currentOperations,
    octofarmStatistics: statistics[0].octofarmStatistics,
    printStatistics: statistics[0].printStatistics,
    printerCount: printers.length,
    currentOperationsCount: statistics[0].currentOperationsCount[0],
    page: "Dashboard",
    helpers: prettyHelpers,
    systemInfo: systemInformation[0]
  });
});
//Panel view  Page
router.get("/mon/panel", ensureAuthenticated, async (req, res) => {
  let printers = Runner.returnFarmPrinters();
  let statistics = await FarmStatistics.find({});
  let systemInformation = await SystemInfo.find({});
  res.render("dashboard", {
    name: req.user.name,
    version: pjson.version,
    printers: printers,
    farmInfo: statistics[0].farmInfo,
    currentOperations: statistics[0].currentOperations,
    octofarmStatistics: statistics[0].octofarmStatistics,
    printStatistics: statistics[0].printStatistics,
    printerCount: printers.length,
    currentOperationsCount: statistics[0].currentOperationsCount[0],
    page: "Dashboard",
    helpers: prettyHelpers,
    systemInfo: systemInformation[0]
  });
});
//Camera view  Page
router.get("/mon/camera", ensureAuthenticated, async (req, res) => {
  let printers = Runner.returnFarmPrinters();
  let statistics = await FarmStatistics.find({});
  let systemInformation = await SystemInfo.find({});
  res.render("dashboard", {
    name: req.user.name,
    version: pjson.version,
    printers: printers,
    farmInfo: statistics[0].farmInfo,
    currentOperations: statistics[0].currentOperations,
    octofarmStatistics: statistics[0].octofarmStatistics,
    printStatistics: statistics[0].printStatistics,
    printerCount: printers.length,
    currentOperationsCount: statistics[0].currentOperationsCount[0],
    page: "Dashboard",
    helpers: prettyHelpers,
    systemInfo: systemInformation[0]
  });
});
//List view  Page
router.get("/mon/list", ensureAuthenticated, async (req, res) => {
  let printers = Runner.returnFarmPrinters();
  let statistics = await FarmStatistics.find({});
  let systemInformation = await SystemInfo.find({});
  res.render("dashboard", {
    name: req.user.name,
    version: pjson.version,
    printers: printers,
    farmInfo: statistics[0].farmInfo,
    currentOperations: statistics[0].currentOperations,
    octofarmStatistics: statistics[0].octofarmStatistics,
    printStatistics: statistics[0].printStatistics,
    printerCount: printers.length,
    currentOperationsCount: statistics[0].currentOperationsCount[0],
    page: "Dashboard",
    helpers: prettyHelpers,
    systemInfo: systemInformation[0]
  });
});
module.exports = router;
