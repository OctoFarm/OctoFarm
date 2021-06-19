const express = require("express");

const router = express.Router();

const { ensureAuthenticated } = require("../middleware/auth");
const ClientSettingsDB = require("../models/ClientSettings.js");
const GcodeDB = require("../models/CustomGcode.js");
const { SystemRunner } = require("../runners/systemInfo.js");
const { SettingsClean } = require("../lib/dataFunctions/settingsClean.js");

// TODO: move to own file...
router.get("/client/get", ensureAuthenticated, (req, res) => {
  ClientSettingsDB.find({}).then((checked) => {
    res.send(checked[0]);
  });
});

router.post("/client/update", ensureAuthenticated, (req, res) => {
  ClientSettingsDB.find({}).then((checked) => {
    const panelView = {
      currentOp: req.body.panelView.currentOp,
      hideOff: req.body.panelView.hideOff,
      hideClosed: req.body.panelView.hideClosed,
      hideIdle: req.body.panelView.hideIdle,
      printerRows: req.body.cameraView.cameraRows
    };
    checked[0].panelView = panelView;
    checked[0].dashboard = req.body.dashboard;
    checked[0].controlSettings = req.body.controlSettings;
    checked[0].markModified("controlSettings");
    checked[0].save().then(() => {
      SettingsClean.start();
    });
    res.send({ msg: "Settings Saved" });
  });
});

/**
 * Acquire system information from system info runner
 */
router.get("/sysInfo", ensureAuthenticated, async (req, res) => {
  const systemInformation = await SystemRunner.returnInfo();
  let sysInfo = null;

  if (!!systemInformation) {
    sysInfo = {
      osInfo: systemInformation.osInfo,
      cpuInfo: systemInformation.cpuInfo,
      cpuLoad: systemInformation.cpuLoad,
      memoryInfo: systemInformation.memoryInfo,
      sysUptime: systemInformation.sysUptime,
      currentProcess: systemInformation.currentProcess,
      processUptime: systemInformation.processUptime
    };
  }
  res.send(sysInfo);
});

// Think this should be it's own route personally.
router.get("/customGcode/delete/:id", ensureAuthenticated, async (req, res) => {
  const scriptId = req.params.id;
  GcodeDB.findByIdAndDelete(scriptId, function (err) {
    if (err) {
      res.send(err);
    } else {
      res.send(scriptId);
    }
  });
});
router.post("/customGcode/edit", ensureAuthenticated, async (req, res) => {
  const newObj = req.body;
  let script = await GcodeDB.findById(newObj.id);
  script.gcode = newObj.gcode;
  script.name = newObj.name;
  script.description = newObj.description;
  script.save();
  res.send(script);
});
router.post("/customGcode", ensureAuthenticated, async (req, res) => {
  let newScript = req.body;
  const saveScript = new GcodeDB(newScript);
  saveScript
    .save()
    .then(res.send(saveScript))
    .catch((e) => res.send(e));
});
router.get("/customGcode", ensureAuthenticated, async (req, res) => {
  const all = await GcodeDB.find();
  res.send(all);
});

module.exports = router;
