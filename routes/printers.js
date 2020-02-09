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
router.post("/save", ensureAuthenticated, (req, res) => {
  //Check required fields
  const printers = req.body;

  Printers.deleteMany({})
    .then(res => {
      Runner.stopAll();
    })
    .catch(err => console.log(err));

  printers.forEach(printer => {
    let newPrinter = new Printers(printer);
    newPrinter.save().then(res => {});
  });

  res.send(printers);
});
//Register handle for initialising runners
router.post("/runner/init", ensureAuthenticated, (req, res) => {
  Runner.init();
  res.send("Initialised Printers");
});
//Register handle for checking for offline printers
router.post("/runner/checkOffline", ensureAuthenticated, (req, res) => {
  let checked = [];
  let farmPrinters = Runner.returnFarmPrinters();

    for (let i = 0; i < farmPrinters.length; i++) {
    if (farmPrinters[i].state === "Offline") {
      let client = {
        index: i
      }
         //Make sure runners are created ready for each printer to pass between...
        Runner.setOffline(client)
        checked.push(i)
    }
  };
    res.send({
      printers: checked,
      msg: " If they were found they will appear online shortly."
    });
})
module.exports = router;
