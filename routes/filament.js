const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");

const Roll = require("../models/Filament.js");

let filamentStore = {
  pla: {
    display: "PLA",
    density: "1.24"
  },
  abs: {
    display: "ABS",
    density: "1.04"
  },
  petg: {
    display: "PETG",
    density: "1.27"
  },
  nylon: {
    display: "NYLON",
    density: "1.52"
  },
  tpu: {
    display: "TPU",
    density: "1.21"
  },
  pc: {
    display: "Polycarbonate (PC)",
    density: "1.3"
  },
  wood: {
    display: "Wood Fill",
    density: "1.28"
  },
  wood: {
    display: "Carbon Fibre",
    density: "1.3"
  },
  pcabs: {
    display: "PC/ABS",
    density: "1.19"
  },
  hips: {
    display: "HIPS",
    density: "1.03"
  },
  pva: {
    display: "PVA",
    density: "1.23"
  },
  asa: {
    display: "ASA",
    density: "1.05"
  },
  pp: {
    display: "Polypropylene (PP)",
    density: "0.9"
  },
  acetal: {
    display: "Acetal (POM)",
    density: "1.4"
  },
  pmma: {
    display: "PMMA",
    density: "1.18"
  },
  fpe: {
    display: "Semi Flexible FPE",
    density: "2.16"
  }
};

module.exports = router;

router.get("/get", ensureAuthenticated, (req, res) => {
  filamentStore = filamentStore;
  Roll.find({}).then(checked => {
    res.send({ checked: checked, filamentStore: filamentStore });
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
