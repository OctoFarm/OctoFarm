const express = require("express");

const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const ServerSettingsDB = require("../models/ServerSettings.js");
const ClientSettingsDB = require("../models/ClientSettings.js");
const runner = require("../runners/state.js");

const { Runner } = runner;

const systemInfo = require("../runners/systemInfo.js");

const SystemInfo = systemInfo.SystemRunner;

const settingsClean = require("../lib/dataFunctions/settingsClean.js");

const { SettingsClean } = settingsClean;

const serverCommands = require("../lib/serverCommands.js");

const { Logs } = serverCommands;
const { SystemCommands } = serverCommands;

module.exports = router;

router.get("/server/get/logs", ensureAuthenticated, async (req, res) => {
  const serverLogs = await Logs.grabLogs();
  res.send(serverLogs);
});
router.get("/server/download/logs/:name", ensureAuthenticated, (req, res) => {
  const download = req.params.name;
  const file = `./logs/${download}`;
  res.download(file, download); // Set disposition and send it.
});
router.get("/server/restart", ensureAuthenticated, (req, res) => {
  SystemCommands.rebootOctoFarm();
});
router.get("/client/get", ensureAuthenticated, (req, res) => {
  ClientSettingsDB.find({}).then((checked) => {
    res.send(checked[0]);
  });
});
router.post("/client/update", ensureAuthenticated, (req, res) => {
  ClientSettingsDB.find({}).then((checked) => {
    const settings = {
      backgroundURL: req.body.settings.backgroundURL,
    };
    const panelView = {
      currentOp: req.body.panelView.currentOp,
      hideOff: req.body.panelView.hideOff,
      hideClosed: req.body.panelView.hideClosed,
      extraInfo: req.body.panelView.extraInfo,
    };
    const listView = {
      currentOp: req.body.listView.currentOp,
      hideOff: req.body.listView.hideOff,
      hideClosed: req.body.listView.hideClosed,
      extraInfo: req.body.listView.extraInfo,
    };
    const cameraView = {
      currentOp: req.body.cameraView.currentOp,
      cameraRows: req.body.cameraView.cameraRows,
      hideClosed: req.body.cameraView.hideClosed,
      extraInfo: req.body.cameraView.extraInfo,
    };
    checked[0].settings = settings;
    checked[0].panelView = panelView;
    checked[0].listView = listView;
    checked[0].cameraView = cameraView;
    checked[0].save().then(() => {
      SettingsClean.start();
    });

    res.send({ msg: "Settings Saved" });
  });
});

router.get("/server/get", ensureAuthenticated, (req, res) => {
  ServerSettingsDB.find({}).then((checked) => {
    res.send(checked[0]);
  });
});
router.post("/server/update", ensureAuthenticated, (req, res) => {
  ServerSettingsDB.find({}).then(async (checked) => {
    checked[0].onlinePolling = req.body.onlinePolling;
    Runner.updatePoll();
    checked[0].server = req.body.server;
    checked[0].timeout = req.body.timeout;
    checked[0].filament = req.body.filament;
    await checked[0].save().then(() => {
      SettingsClean.start();
    });
    res.send({ msg: "Settings Saved" });
  });
});
router.get("/sysInfo", ensureAuthenticated, async (req, res) => {
  const systemInformation = await SystemInfo.returnInfo();
  // There is a circular structure in here somewhere!?
  let sysInfo = null;
  if (typeof systemInformation !== "undefined") {
    sysInfo = {
      osInfo: systemInformation.osInfo,
      cpuInfo: systemInformation.cpuInfo,
      cpuLoad: systemInformation.cpuLoad,
      memoryInfo: systemInformation.memoryInfo,
      sysUptime: systemInformation.sysUptime,
      sysProcess: systemInformation.sysProcess,
      processUptime: systemInformation.processUptime,
    };
  }
  res.send(sysInfo);
});
