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
//Register Handle for Saving printers
router.get("/allBasic", ensureAuthenticated, (req, res) => {
  //Check required fields
  let basic = [];
  Printers.find({}, async (err, printers) => {
    for (let i = 0; i < printers.length; i++) {
      re = {
        ip: printers[i].ip,
        port: printers[i].port,
        camURL: printers[i].camURL,
        apikey: printers[i].apikey
      };
      basic.push(re);
    }
    res.send({
      printers: basic
    });
  });
});
//Register handle for initialising runners
router.post("/runner/init", ensureAuthenticated, (req, res) => {
  Runner.init();
  res.send("Initialised Printers");
});
//Register handle for checking for offline printers
router.post("/runner/checkOffline", ensureAuthenticated, (req, res) => {
  let checked = [];
  Printers.find({}, async (err, printers) => {
    for (let i = 0; i < printers.length; i++) {
      if (printers[i].current.state === "Offline") {
        console.log(i);
        await Runner.checkOffline(printers[i]);
        await checked.push(i);
      }
    }
    res.send({
      printers: checked,
      msg: " If they were found they will appear online shortly."
    });
  });
});
module.exports = router;
