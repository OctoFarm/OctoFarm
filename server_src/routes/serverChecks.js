const express = require("express");

const router = express.Router();
const softwareUpdateChecker = require("../runners/softwareUpdateChecker");
const isDocker = require("is-docker");
const {isPm2, isNodemon, isNode} = require("../utils/env.utils");

router.get("/amialive", async (req, res) => {
  const softwareUpdateNotification = softwareUpdateChecker.getUpdateNotificationIfAny();
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
    update: softwareUpdateNotification
  });
});

module.exports = router;