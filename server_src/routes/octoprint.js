const express = require("express");

const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");

const {
  OctoprintApiClientSystemService
} = require("../services/octoprint/octoprint-api-client-plugins.service.js");
const octoPrintApiSystemService = new OctoprintApiClientSystemService();

router.post("/updateOctoPrint", ensureAuthenticated, async (req, res) => {
  let printerID = req.body.printerID;
  console.log(printerID);
  const printer = {};
  await octoPrintApiSystemService.sendOctoPrintUpdateCommand(printer);
});

router.post("/updatePlugins", ensureAuthenticated, async (req, res) => {});

module.exports = router;
