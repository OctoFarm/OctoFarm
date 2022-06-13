const express = require("express");
const { TaskManager } = require("../services/task-manager.service");
const { ADMINISTRATION } = require("../constants/route.constants");

const router = express.Router();

router.get(ADMINISTRATION.TASKS, async (_req, res) => {
  res.send(TaskManager.getTaskState());
});

router.patch(ADMINISTRATION.SYSTEM, async (_req, res) => {});
router.patch(ADMINISTRATION.THEME, async (_req, res) => {});
router.patch(ADMINISTRATION.PRINTERS, async (_req, res) => {});
router.patch(ADMINISTRATION.VIEWS, async (_req, res) => {});
router.patch(ADMINISTRATION.HISTORY, async (_req, res) => {});
router.patch(ADMINISTRATION.FILAMENT, async (_req, res) => {});

module.exports = router;
