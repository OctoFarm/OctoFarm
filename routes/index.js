const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const db = require("../config/db").MongoURI;
const pjson = require("../package.json");
const Printers = require("../models/Printer.js");

console.log("db: " + db);

//Welcome Page
if (db === "") {
  //No db setup, show db warning before login.
  router.get("/", (req, res) => res.render("database"));
} else {
  router.get("/", (req, res) => res.render("welcome"));
}
//Dashboard Page
router.get("/dashboard", ensureAuthenticated, (req, res) => {
  Printers.find({}, (err, printers) => {
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
    res.render("dashboard", {
      name: req.user.name,
      version: pjson.version,
      printers: printers,
      printerCount: printers.length,
      activeCount: active.length,
      idleCount: idle.length,
      offlineCount: offline.length
    });
  });
});
//File Manager Page
router.get("/filemanager", ensureAuthenticated, (req, res) => {
  Printers.find({}, (err, printers) => {
    res.render("dashboard", {
      name: req.user.name,
      version: pjson.version,
      printers: printers,
      printerCount: printers.length
    });
  });
});
//Panel view  Page
router.get("/mon/panel", ensureAuthenticated, (req, res) => {
  Printers.find({}, (err, printers) => {
    res.render("dashboard", {
      name: req.user.name,
      version: pjson.version,
      printers: printers,
      printerCount: printers.length
    });
  });
});
//Camera view  Page
router.get("/mon/camera", ensureAuthenticated, (req, res) => {
  Printers.find({}, (err, printers) => {
    res.render("dashboard", {
      name: req.user.name,
      version: pjson.version,
      printers: printers,
      printerCount: printers.length
    });
  });
});
//List view  Page
router.get("/mon/list", ensureAuthenticated, (req, res) => {
  Printers.find({}, (err, printers) => {
    res.render("dashboard", {
      name: req.user.name,
      version: pjson.version,
      printers: printers,
      printerCount: printers.length
    });
  });
});
module.exports = router;
