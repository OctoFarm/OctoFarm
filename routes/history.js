const express = require("express");
const router = express.Router();
const Printers = require("../models/History.js");
const { ensureAuthenticated } = require("../config/auth");

router.post("/update", ensureAuthenticated, async (req, res) => {
  //Check required fields
  const settings = req.body;
  Runner.updateSettings(settings.index, settings.options);
  let printer = await Printers.findOne({ index: settings.index });
  if (typeof settings.options.camURL != "undefined")
    printer.camURL = settings.options.camURL;
  await printer.save();
  res.send("success");
});
//Register Handle for Saving printers
router.post("/delete", ensureAuthenticated, async (req, res) => {
  //Check required fields
  const printers = req.body;
  const reset = await Runner.reset();
  await Printers.deleteMany({}).catch(err => console.log(err));
  for (let i = 0; i < printers.length; i++) {
    let newPrinter = await new Printers(printers[i]);
    await newPrinter.save();
  }
  let run = await Runner.init();
  res.send(printers);
});

module.exports = router;
