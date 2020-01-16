const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const db = require("../config/db").MongoURI;

module.exports = router;

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
