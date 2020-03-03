const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");

const Roll = require("../models/Filament.js");

module.exports = router;

router.get("/get", ensureAuthenticated, (req, res) => {
  Roll.find({}).then(checked => {
    res.send(checked);
  });
});
router.post("/saveNew", ensureAuthenticated, async (req, res) => {
  const filament = req.body;
  roll = {
    name: filament.name,
    type: filament.type,
    colour: filament.colour,
    manufacturer: filament.manufacturer
  };
  let newFilament = new Roll({
    roll
  });

  newFilament.save().then(e => {
    res.send({ res: "success", filament: filament });
  });
});

router.post("/delete", ensureAuthenticated, async (req, res) => {
  let searchId = req.body.id;
  let rel = await Roll.deleteOne({ _id: searchId }).exec();
  rel.status = 200;
  res.send(rel);
});
