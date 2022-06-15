const express = require("express");

const router = express.Router();

const { returnPatreonData } = require("../services/patreon.service");
const { DATA } = require("../constants/route.constants");
const { ensureAdministrator } = require("../middleware/auth");
const { TaskManager } = require("../services/task-manager.service");
const { SystemRunner } = require("../services/system-information.service");
const isDocker = require("is-docker");
const { isNodemon, isNode, isPm2 } = require("../utils/env.utils");
const { AppConstants } = require("../constants/app.constants");
const { fetchClientVersion } = require("../app-env");
const { isAirGapped } = require("../services/octofarm-update.service");

router.get(DATA.PATREONS, (req, res) => {
  res.send(returnPatreonData());
});

router.get(DATA.SYSTEM_INFO, ensureAdministrator, (req, res) => {
  TaskManager.forceRunTask("SYSTEM_INFO_CHECK_TASK");

  const response = {
    serviceInformation: {
      isDockerContainer: isDocker(),
      isNodemon: isNodemon(),
      isNode: isNode(),
      isPm2: isPm2(),
      airGapped: isAirGapped()
    },
    systemEnvironment: process.env[AppConstants.NODE_ENV_KEY],
    clientVersion: fetchClientVersion(),
    serverVersion: process.env[AppConstants.VERSION_KEY],
    systemInformation: SystemRunner.returnInfo(true)
  };

  res.send(response);
});

module.exports = router;
