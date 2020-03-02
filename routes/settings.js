const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const ServerSettingsDB = require("../models/ServerSettings.js");
const ClientSettingsDB = require("../models/ClientSettings.js");
const runner = require("../runners/state.js");
const Runner = runner.Runner;

module.exports = router;

router.get("/server/get", ensureAuthenticated, (req, res) => {
  ServerSettingsDB.find({}).then(checked => {
    res.send(checked[0]);
  });
});
router.post("/server/update", ensureAuthenticated, (req, res) => {
  ServerSettingsDB.find({}).then(async checked => {
    await Runner.stopAll();
    checked[0].onlinePolling = req.body.onlinePolling;
    checked[0].offlinePolling = req.body.offlinePolling;
    await checked[0].save();
    let printers = await Runner.returnFarmPrinters();
    await Runner.init();
    res.send({ msg: "Settings Saved, Restarting Runners..." });
  });
});
