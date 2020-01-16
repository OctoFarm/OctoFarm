const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const db = require("../config/db").MongoURI;
const pjson = require("../package.json");
const Printers = require("../models/Printer.js");
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
router.get("/dashboard", ensureAuthenticated, (req, res) => {
  Printers.find({}, null, { sort: { index: 1 } }, async (err, printers) => {
    let active = [];
    let idle = [];
    let offline = [];
    printers.forEach(print => {
      if (print.stateColour.category === "Active") {
        active.push(print.ip);
      }
      if (print.stateColour.category === "Idle") {
        idle.push(print.ip);
      }
      if (
        print.stateColour.category === "Closed" ||
        print.stateColour.category === "Offline"
      ) {
        offline.push(print.ip);
      }
    });
    let systemInformation = await SystemInfo.find({});
    res.render("dashboard", {
      name: req.user.name,
      version: pjson.version,
      printers: printers,
      printerCount: printers.length,
      activeCount: active.length,
      idleCount: idle.length,
      offlineCount: offline.length,
      page: "Dashboard",
      helpers: prettyHelpers,
      systemInfo: systemInformation[0]
    });
  });
});
//File Manager Page
router.get("/filemanager", ensureAuthenticated, (req, res) => {
  Printers.find({}, null, { sort: { index: 1 } }, (err, printers) => {
    res.render("filemanager", {
      name: req.user.name,
      version: pjson.version,
      printers: printers,
      printerCount: printers.length,
      page: "File Manager",
      helpers: prettyHelpers
    });
  });
});
//Panel view  Page
router.get("/mon/panel", ensureAuthenticated, (req, res) => {
  Printers.find({}, null, { sort: { index: 1 } }, (err, printers) => {
    res.render("panelView", {
      name: req.user.name,
      version: pjson.version,
      printers: printers,
      printerCount: printers.length,
      page: "Panel View",
      helpers: prettyHelpers
    });
  });
});
//Camera view  Page
router.get("/mon/camera", ensureAuthenticated, (req, res) => {
  Printers.find({}, null, { sort: { index: 1 } }, (err, printers) => {
    res.render("cameraView", {
      name: req.user.name,
      version: pjson.version,
      printers: printers,
      printerCount: printers.length,
      page: "Camera View",
      helpers: prettyHelpers
    });
  });
});
//List view  Page
router.get("/mon/list", ensureAuthenticated, (req, res) => {
  Printers.find({}, null, { sort: { index: 1 } }, (err, printers) => {
    res.render("listView", {
      name: req.user.name,
      version: pjson.version,
      printers: printers,
      printerCount: printers.length,
      page: "Camera View",
      helpers: prettyHelpers
    });
  });
});
module.exports = router;
