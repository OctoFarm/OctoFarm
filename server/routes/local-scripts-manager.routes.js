const express = require("express");
const router = express.Router();
const path = require("path");
const { ensureAuthenticated, ensureAdministrator } = require("../middleware/auth");
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");
// User Modal
const Logger = require("../handlers/logger.js");
const logger = new Logger(LOGGER_ROUTE_KEYS.ROUTE_LOCAL_SCRIPTS);
const Alerts = require("../models/Alerts.js");

const script = require("../services/local-scripts.service.js");
const { validateBodyMiddleware, validateParamsMiddleware } = require("../middleware/validators");
const S_VALID = require("../constants/validate-script.constants");
const M_VALID = require("../constants/validate-mongo.constants");
const Script = script.ScriptRunner;
router.get("/get", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  //Grab the API body
  const alerts = await Alerts.find({});
  //Return printers added...
  res.send({ alerts: alerts, status: 200 });
});
router.delete(
  "/delete/:id",
  ensureAuthenticated,
  ensureAdministrator,
  validateParamsMiddleware(M_VALID.MONGO_ID),
  async (req, res) => {
    //Grab the API body
    let id = req.paramString("id");
    await Alerts.deleteOne({ _id: id })
      .then((response) => {
        res.send({ alerts: "success", status: 200 });
      })
      .catch((err) => {
        console.log(err);
        res.send({ alerts: "error", status: 500 });
      });
    //Return printers added...
  }
);

router.post(
  "/test",
  ensureAuthenticated,
  ensureAdministrator,
  validateBodyMiddleware(S_VALID.SCRIPT_TEST),
  async (req, res) => {
    //Grab the API body
    const scriptLocation = req.bodyString("scriptLocation");
    const message = req.bodyString("message");
    //Send Dashboard to Runner..
    let testFire = await Script.test(scriptLocation, message);
    //Return printers added...
    res.send({ testFire: testFire, status: 200 });
  }
);
router.post("/save", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  //Grab the API body
  const opts = req.body;
  //Send Dashboard to Runner..
  let save = await Script.save(opts.printer, opts.trigger, opts.message, opts.scriptLocation);
  //Return printers added...
  res.send({ message: save, status: 200 });
});
router.post("/edit", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  //Grab the API body
  const opts = req.body;
  //Send Dashboard to Runner..
  let save = await Script.edit(opts);
  //Return printers added...
  res.send({ message: save, status: 200 });
});
module.exports = router;
