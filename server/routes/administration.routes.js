const express = require("express");
const { TaskManager } = require("../services/task-manager.service");

const router = express.Router();

router.get("/tasks", async (req, res) => {
  res.send(TaskManager.getTaskState());
});

module.exports = router;
