const express = require("express");
const router = express.Router();
const Printers = require("../models/Printer.js");
const { ensureAuthenticated } = require("../config/auth");
// User Modal
const runner = require("../runners/state.js");
const Runner = runner.Runner;

/* //Login Page
router.get("/login", (req, res) => res.render("login"));
//Register Page
router.get("/register", (req, res) => res.render("register")); */

//Register Handle for Saving printers
router.post("/removefile", ensureAuthenticated, async (req, res) => {
  //Check required fields
  const file = req.body;
  Runner.removeFile(file.i, file.fullPath);
  res.send("success");
});
router.post("/resyncFile", ensureAuthenticated, async (req, res) => {
  //Check required fields
  const file = req.body;
  let ret = null;
  if (file.fullPath != undefined) {
    ret = await Runner.reSyncFile(file.i, file.fullPath);
  } else {
    ret = await Runner.reSyncFile(file.i);
  }
  res.send(ret);
});
router.post("/stepChange", ensureAuthenticated, async (req, res) => {
  //Check required fields
  const step = req.body;
  Runner.stepRate(step.printer, step.newSteps);
  res.send("success");
});
router.post("/flowChange", ensureAuthenticated, async (req, res) => {
  //Check required fields
  const step = req.body;
  Runner.flowRate(step.printer, step.newSteps);
  res.send("success");
});
router.post("/feedChange", ensureAuthenticated, async (req, res) => {
  //Check required fields
  const step = req.body;
  Runner.feedRate(step.printer, step.newSteps);
  res.send("success");
});
router.post("/updateSettings", ensureAuthenticated, async (req, res) => {
  //Check required fields
  const settings = req.body;
  Runner.updateSettings(settings.index, settings.options);
  let printer = await Printers.findOne({ index: settings.index });
  printer.camURL = settings.options.camURL;
  await printer.save();
  res.send("success");
});
//Register Handle for Saving printers
router.post("/save", ensureAuthenticated, async (req, res) => {
  //Check required fields
  const printers = req.body;
  Runner.stopAll();
  await Printers.deleteMany({}).catch(err => console.log(err));
  for (let i = 0; i < printers.length; i++) {
    let newPrinter = await new Printers(printers[i]);
    await newPrinter.save();
  }
  await Runner.init();
  res.send(printers);
});

//Register handle for initialising runners
router.post("/runner/init", ensureAuthenticated, (req, res) => {
  res.send("Initialised Printers");
});
router.post("/delete", ensureAuthenticated, async (req, res) => {
  await Runner.stopAll();
  await Printers.deleteMany({}).catch(err => console.log(err));
  await Runner.init();
  res.send("Deleted Printers");
});

//Register handle for checking for offline printers
router.post("/runner/checkOffline", ensureAuthenticated, async (req, res) => {
  let checked = [];
  let farmPrinters = Runner.returnFarmPrinters();

  for (let i = 0; i < farmPrinters.length; i++) {
    if (farmPrinters[i].state === "Offline") {
      let client = {
        index: i
      };
      //Make sure runners are created ready for each printer to pass between...
      await Runner.setOffline(client);
      checked.push(i);
    }
  }
  res.send({
    printers: checked,
    msg: " If they were found they will appear online shortly."
  });
});
module.exports = router;
