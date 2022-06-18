const express = require("express");
const { LOGS } = require("../constants/route.constants");
const { Logs } = require("../services/server-logs.service");
const { getLogsPath } = require("../utils/system-paths.utils");
const { validateParamsMiddleware } = require("../middleware/validators");
const { LOG_NAME } = require("../constants/validate-logs.constants");

const router = express.Router();

router.get("/", async (_req, res) => {
  res.send(await Logs.grabLogs());
});

router.delete(LOGS.HOUSE_KEEP, async (_req, res) => {
  res.send(Logs.clearLogsOlderThan(5));
});

router.post(LOGS.LOG_DUMP, async (_req, res) => {
  res.send(await Logs.generateOctoFarmLogDump());
});

router.get("/:name", validateParamsMiddleware(LOG_NAME), async (req, res) => {
  const download = req.paramString("name");
  res.download(`${getLogsPath()}/${download}`, download); // Set disposition and send it.
});

router.delete("/:name", validateParamsMiddleware(LOG_NAME), async (req, res) => {
  res.send(Logs.deleteLogByName(req.paramString("name")));
});


module.exports = router;
