const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const db = require("../config/db").MongoURI;
const pjson = require("../package.json");
const Printers = require("../models/Printer.js");
const FarmStatistics = require("../models/FarmStatistics.js");
const SystemInfo = require("../models/SystemInfo.js");
const prettyHelpers = require("../views/partials/functions/pretty.js");

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
  let printers = await Printers.find({}, null, { sort: { index: 1 } });
  let statistics = await FarmStatistics.find({});
  let systemInformation = await SystemInfo.find({});
    res.render("dashboard", {
      name: req.user.name,
      version: pjson.version,
      printers: printers,
      farmInfo: statistics[0].farmInfo,
      printerCount: printers.length,
      activeCount: statistics[0].farmInfo.active,
      idleCount: statistics[0].farmInfo.idle,
      completeCount: statistics[0].farmInfo.complete,
      offlineCount: statistics[0].farmInfo.offline,
      page: "Dashboard",
      helpers: prettyHelpers,
      systemInfo: systemInformation[0]
    });

});
//File Manager Page
router.get("/filemanager", ensureAuthenticated, async (req, res) => {
  let printers = await Printers.find({}, null, { sort: { index: 1 } })
    res.render("filemanager", {
      name: req.user.name,
      version: pjson.version,
      printers: printers,
      printerCount: printers.length,
      page: "File Manager",
      helpers: prettyHelpers
    });

});
//History Page
router.get("/history", ensureAuthenticated, async (req, res) => {
  let printers = await Printers.find({}, null, { sort: { index: 1 } })
    res.render("history", {
      name: req.user.name,
      version: pjson.version,
      printers: printers,
      printerCount: printers.length,
      page: "History",
      helpers: prettyHelpers
    });

});
//Panel view  Page
router.get("/mon/panel", ensureAuthenticated, async (req, res) => {
  let printers = await Printers.find({}, null, { sort: { index: 1 } })
    res.render("panelView", {
      name: req.user.name,
      version: pjson.version,
      printers: printers,
      printerCount: printers.length,
      page: "Panel View",
      helpers: prettyHelpers
    });

});
//Camera view  Page
router.get("/mon/camera", ensureAuthenticated, async (req, res) => {
  let printers = await Printers.find({}, null, { sort: { index: 1 } })
    res.render("cameraView", {
      name: req.user.name,
      version: pjson.version,
      printers: printers,
      printerCount: printers.length,
      page: "Camera View",
      helpers: prettyHelpers
    });

});
//List view  Page
router.get("/mon/list", ensureAuthenticated, async (req, res) => {
  let printers = await Printers.find({}, null, { sort: { index: 1 } })
    res.render("listView", {
      name: req.user.name,
      version: pjson.version,
      printers: printers,
      printerCount: printers.length,
      page: "Camera View",
      helpers: prettyHelpers
    });

});
module.exports = router;
