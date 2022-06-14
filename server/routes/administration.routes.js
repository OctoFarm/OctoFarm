const express = require("express");
const { TaskManager } = require("../services/task-manager.service");
const { ADMINISTRATION, ADMINISTRATION_BASE } = require("../constants/route.constants");
const { validateBodyMiddleware } = require("../middleware/validators");
const { SYSTEM_SETTINGS, THEME_SETTINGS } = require("../constants/validate-settings.constants");
const { patchServerSettings, patchThemeSettings } = require("../api/administration.api");

const router = express.Router();

router.get(ADMINISTRATION_BASE.TASKS, async (_req, res) => {
  res.send(TaskManager.getTaskState());
});

router.patch(ADMINISTRATION.SYSTEM, validateBodyMiddleware(SYSTEM_SETTINGS), async (req, res) => {
  res.send(await patchServerSettings(req.body));
});
router.patch(ADMINISTRATION.THEME, validateBodyMiddleware(THEME_SETTINGS), async (req, res) => {
  res.send(await patchThemeSettings(req.body));
});
router.patch(ADMINISTRATION.PRINTERS, async (_req, res) => {});
router.patch(ADMINISTRATION.VIEWS, async (_req, res) => {});
router.patch(ADMINISTRATION.HISTORY, async (_req, res) => {});
router.patch(ADMINISTRATION.FILAMENT, async (_req, res) => {});
router.patch(ADMINISTRATION.INFLUX, async (_req, res) => {});

module.exports = router;
