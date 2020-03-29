const express = require("express");
const router = express.Router();
const History = require("../models/History.js");
const { ensureAuthenticated } = require("../config/auth");

router.post("/update", ensureAuthenticated, async (req, res) => {
  //Check required fields
  const latest = req.body;
  console.log(latest.note);
  let note = latest.note;
  let history = await History.findOne({ _id: latest.id });
  history.printHistory.notes = note;
  history.markModified("printHistory");
  history = history.save();
  res.send("success");
});
//Register Handle for Saving printers
router.post("/delete", ensureAuthenticated, async (req, res) => {
  //Check required fields
  const deleteHistory = req.body;
  await History.findOneAndDelete({ _id: deleteHistory.id });
  res.send("success");
});
router.get("/get", ensureAuthenticated, (req, res) => {
  History.find({}).then(checked => {
    res.send({ history: checked });
  });
});

module.exports = router;
