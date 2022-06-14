const express = require("express");
const { TaskManager } = require("../services/task-manager.service");
const { ADMINISTRATION, ADMINISTRATION_BASE } = require("../constants/route.constants");
const { validateBodyMiddleware } = require("../middleware/validators");
const { SYSTEM_SETTINGS } = require("../constants/validate-settings.constants");
const { SettingsClean } = require("../services/settings-cleaner.service");
const envUtils = require("../utils/env.utils");
const path = require("path");
const { AppConstants } = require("../constants/app.constants");
const dotEnvPath = path.join(__dirname, "../../.env");

const router = express.Router();

router.get(ADMINISTRATION_BASE.TASKS, async (_req, res) => {
  res.send(TaskManager.getTaskState());
});

router.patch(ADMINISTRATION.SYSTEM, validateBodyMiddleware(SYSTEM_SETTINGS), async (req, res) => {
  let errors = [];
  const { mongoURI, serverPort, logLevel, loginRequired, registration } = req.body;

  try {
    await SettingsClean.saveServerSettings({ loginRequired, registration });
  } catch (e) {
    errors.push(e.toString());
  }

  try {
    envUtils.writeVariableToEnvFile(path.resolve(dotEnvPath), AppConstants.MONGO_KEY, mongoURI);
  } catch (e) {
    errors.push(e.toString());
  }

  try {
    envUtils.writeVariableToEnvFile(
      path.resolve(dotEnvPath),
      AppConstants.OCTOFARM_PORT_KEY,
      serverPort
    );
  } catch (e) {
    errors.push(e.toString());
  }

  try {
    envUtils.writeVariableToEnvFile(path.resolve(dotEnvPath), AppConstants.LOG_LEVEL, logLevel);
  } catch (e) {
    errors.push(e.toString());
  }

  res.send({
    errors,
    newSystemSettings: { mongoURI, serverPort, logLevel, loginRequired, registration },
    restartRequired: true
  });
});
router.patch(ADMINISTRATION.THEME, async (_req, res) => {});
router.patch(ADMINISTRATION.PRINTERS, async (_req, res) => {});
router.patch(ADMINISTRATION.VIEWS, async (_req, res) => {});
router.patch(ADMINISTRATION.HISTORY, async (_req, res) => {});
router.patch(ADMINISTRATION.FILAMENT, async (_req, res) => {});
router.patch(ADMINISTRATION.INFLUX, async (_req, res) => {});

module.exports = router;
