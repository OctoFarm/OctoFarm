const express = require("express");

const router = express.Router();
const { ensureCurrentUserAndGroup } = require("../config/users.js");
const softwareUpdateChecker = require("../runners/softwareUpdateChecker");
const isDocker = require("is-docker");
const { isPm2, isNodemon, isNode } = require("../utils/env.utils");

router.get("/amialive", ensureCurrentUserAndGroup, async (req, res) => {
  let softwareUpdateNotification = softwareUpdateChecker.getUpdateNotificationIfAny();

  // ensure update_vailable can only be true when Administrator group found
  if (req?.user?.group !== "Administrator") {
    softwareUpdateNotification.update_available = false;
  }

  res.json({
    ok: true,
    isDockerContainer: isDocker(),
    isNodemon: isNodemon(),
    isNode: isNode(),
    isPm2: isPm2(),
    // initCwd: process.env.INIT_CWD,
    // npmCommand: process.env.npm_command,
    // npmLifecycleEvent: process.env.npm_lifecycle_event,
    // npmPackageJson: process.env.npm_package_json,
    // npmPackageBinOctoFarm: process.env.npm_package_bin_octofarm,
    // processorArch: process.env.PROCESSOR_ARCHITECTURE,
    // numberOfProcessors: process.env.NUMBER_OF_PROCESSORS,
    // processorIdentifier: process.env.PROCESSOR_IDENTIFIER,
    os: process.env.OS,
    update: softwareUpdateNotification,
  });
});

module.exports = router;
