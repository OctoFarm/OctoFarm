const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const FarmStatistics = require("../models/FarmStatistics.js");
const Printers = require("../models/Printer.js");
const SystemInfo = require("../models/SystemInfo");


module.exports = router;

router.get("/dash/get", ensureAuthenticated, async (req, res) => {
  let farmStatistics = await FarmStatistics.find({});
  let printers = await Printers.find({});
  let systemInfo = await SystemInfo.find({});

  let dashboard = {
    farmStats: farmStatistics[0],
    printers: printers,
    systemInfo: systemInfo[0]
  }

  res.send(dashboard);
});