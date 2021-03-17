const express = require("express");

const router = express.Router();
const softwareUpdateChecker = require("../runners/softwareUpdateChecker");
const isDocker = require("is-docker");

router.get("/amialive", async (req, res) => {
  const softwareUpdateNotification = softwareUpdateChecker.getUpdateNotificationIfAny();
  res.json({
    ok: true,
    isDockerContainer: isDocker(),
    isNodemon: 'npm_lifecycle_script' in process.env && process.env.npm_lifecycle_script.includes('nodemon'),
    isNode: 'NODE' in process.env,
    isPm2: 'PM2_HOME' in process.env || 'PM2_JSON_PROCESSING' in process.env || 'PM2_CLI' in process.env,
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