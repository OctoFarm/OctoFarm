const express = require("express");

const router = express.Router();

const prettyHelpers = require("../../views/partials/functions/pretty.js");
const { SystemRunner } = require("../runners/systemInfo.js");

const isDocker = require("is-docker");
const softwareUpdateChecker = require("../services/octofarm-update.service");
const { ensureAuthenticated, ensureAdministrator } = require("../config/auth");
const { ensureCurrentUserAndGroup } = require("../config/users");
const { AppConstants } = require("../app.constants");
const { getDefaultDashboardSettings } = require("../lib/providers/settings.constants");
const { Runner } = require("../runners/state");
const { fetchMongoDBConnectionString } = require("../app-env");
const { isPm2, isNodemon, isNode } = require("../utils/env.utils.js");
const { SettingsClean } = require("../lib/dataFunctions/settingsClean");
const fs = require("fs");
const marked = require("marked");
const { fetchUsers } = require("../services/user-service");

marked.setOptions({
  renderer: new marked.Renderer(),
  smartLists: true,
  smartypants: true
});

router.get("/", ensureAuthenticated, ensureCurrentUserAndGroup, async (req, res) => {
  const clientSettings = await SettingsClean.returnClientSettings();
  const serverSettings = SettingsClean.returnSystemSettings();
  const systemInformation = SystemRunner.returnInfo();
  const printers = Runner.returnFarmPrinters();
  const softwareUpdateNotification = softwareUpdateChecker.getUpdateNotificationIfAny();
  let dashboardSettings = clientSettings?.dashboard || getDefaultDashboardSettings();
  const currentUsers = await fetchUsers();

  const md = function (filename) {
    const path = "./" + filename;
    const include = fs.readFileSync(path, "utf8");
    const html = marked.parse(include);
    return html;
  };

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
    md,
    db: fetchMongoDBConnectionString(),
    dashboardSettings: dashboardSettings,
    serviceInformation: {
      isDockerContainer: isDocker(),
      isNodemon: isNodemon(),
      isNode: isNode(),
      isPm2: isPm2(),
      update: softwareUpdateNotification
    },
    patreonData: require("../patreon.constants"),
    currentUsers
  });
});

/**
 * Acquire system information from system info runner
 */
router.get("/info", ensureAuthenticated, async (req, res) => {
  const systemInformation = await SystemRunner.querySystemInfo();
  res.send(systemInformation);
});

module.exports = router;
