const express = require("express");

const router = express.Router();

const prettyHelpers = require("../../views/partials/functions/pretty.js");
const system = require("../runners/systemInfo.js");
const SystemInfo = system.SystemRunner;

const isDocker = require("is-docker");
const softwareUpdateChecker = require("../runners/softwareUpdateChecker");
const { ensureAuthenticated } = require("../config/auth");
const { ensureCurrentUserAndGroup } = require("../config/users");
const { AppConstants } = require("../app.constants");
const {
  getDefaultDashboardSettings
} = require("../lib/providers/settings.constants");
const { Runner } = require("../runners/state");
const { fetchMongoDBConnectionString } = require("../../app-env");
const { isPm2, isNodemon, isNode } = require("../utils/env.utils.js");
const { SettingsClean } = require("../lib/dataFunctions/settingsClean");

router.get(
  "/",
  ensureAuthenticated,
  ensureCurrentUserAndGroup,
  async (req, res) => {
    const clientSettings = await SettingsClean.returnClientSettings();
    const serverSettings = await SettingsClean.returnSystemSettings();
    const systemInformation = await SystemInfo.getSystemInfo();
    const printers = Runner.returnFarmPrinters();
    const softwareUpdateNotification =
      softwareUpdateChecker.getUpdateNotificationIfAny();
    let dashboardSettings =
      clientSettings?.dashboard || getDefaultDashboardSettings();

    res.render("system", {
      name: req.user.name,
      userGroup: req.user.group,
      version: process.env[AppConstants.VERSION_KEY],
      printerCount: printers.length,
      page: "System",
      octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
      helpers: prettyHelpers,
      clientSettings,
      serverSettings,
      systemInformation,
      db: fetchMongoDBConnectionString(),
      dashboardSettings: dashboardSettings,
      serviceInformation: {
        isDockerContainer: isDocker(),
        isNodemon: isNodemon(),
        isNode: isNode(),
        isPm2: isPm2(),
        update: softwareUpdateNotification
      }
    });
  }
);

module.exports = router;
