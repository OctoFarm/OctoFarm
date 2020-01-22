const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const ServerSettingsDB = require("../models/serverSettings.js");
const ClientSettingsDB = require("../models/ClientSettings.js");
const runner = require("../runners/state.js");
const Runner = runner.Runner;

module.exports = router;

router.get("/server/get", ensureAuthenticated, (req, res) => {
  ServerSettingsDB.find({}).then(checked => {
    res.send(checked[0]);
  })

});

router.post("/server/update", ensureAuthenticated, (req, res) => {
  ServerSettingsDB.find({}).then(checked => {
    Runner.stopAll();
    checked[0].onlinePolling = req.body.onlinePolling;
    checked[0].offlinePolling = req.body.offlinePolling;
    checked[0].save();
    res.send({msg: "Successfully saved your settings"})
    return;
  }).then(res => {
    Runner.init();
  })

});

router.get("/client/get", ensureAuthenticated, (req, res) => {
  ClientSettingsDB.find({}).then(checked => {
    res.send(checked[0]);
  })

});