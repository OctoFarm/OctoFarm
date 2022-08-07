const { sortBy } = require("lodash");
const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middleware/auth.js");
const { ensureCurrentUserAndGroup } = require("../middleware/users.js");
const prettyHelpers = require("../views/partials/functions/pretty.js");
const { FilamentClean } = require("../services/filament-cleaner.service.js");
const { SettingsClean } = require("../services/settings-cleaner.service.js");
const { FileClean } = require("../services/file-cleaner.service.js");
const { getSorting, getFilter } = require("../services/front-end-sorting.service.js");
const { AppConstants } = require("../constants/app.constants");
const { getDefaultDashboardSettings } = require("../constants/settings.constants");
const { getHistoryCache } = require("../cache/history.cache");
const softwareUpdateChecker = require("../services/octofarm-update.service");
const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const { getPrinterManagerCache } = require("../cache/printer-manager.cache");
const { TaskManager } = require("../services/task-manager.service");
const {
  getDashboardStatistics,
  getCurrentOperations
} = require("../services/printer-statistics.service");
const { SystemRunner } = require("../services/system-information.service");
const { fetchUsers } = require("../services/users.service");
const { fetchMongoDBConnectionString } = require("../app-env");
const isDocker = require("is-docker");
const { isNodemon, isNode, isPm2 } = require("../utils/env.utils");
const { getCurrentBranch, checkIfWereInAGitRepo } = require("../utils/git.utils");
const { returnPatreonData } = require("../services/patreon.service");

const version = process.env[AppConstants.VERSION_KEY];

// Welcome Page
router.get("/", async (req, res) => {
  const serverSettings = SettingsClean.returnSystemSettings();

  if (serverSettings.server.loginRequired === false) {
    res.redirect("/dashboard");
  } else {
    const { registration } = serverSettings.server;

    if (req.isAuthenticated()) {
      res.redirect("/dashboard");
    } else {
      res.render("welcome", {
        page: "Welcome",
        octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
        registration,
        serverSettings: serverSettings
      });
    }
  }
});

// Dashboard Page
router.get("/dashboard", ensureAuthenticated, ensureCurrentUserAndGroup, async (req, res) => {
  const printers = getPrinterStoreCache().listPrintersInformation();
  const serverSettings = SettingsClean.returnSystemSettings();
  const dashStatistics = getDashboardStatistics();
  let dashboardSettings = req.user.clientSettings?.dashboard || getDefaultDashboardSettings();

  res.render("dashboard", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    printerCount: printers.length,
    page: "Dashboard",
    octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
    helpers: prettyHelpers,
    dashboardSettings: dashboardSettings,
    dashboardStatistics: dashStatistics,
    serverSettings,
    clientSettings: req.user.clientSettings
  });
});
router.get("/printers", ensureAuthenticated, ensureCurrentUserAndGroup, async (req, res) => {
  const printers = getPrinterStoreCache().listPrintersInformation();
  const serverSettings = SettingsClean.returnSystemSettings();
  const development_mode = process.env.NODE_ENV === "development";

  res.render("printerManagement", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    page: "Printer Manager",
    octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
    printerCount: printers.length,
    helpers: prettyHelpers,
    air_gapped: softwareUpdateChecker.getUpdateNotificationIfAny().air_gapped,
    serverSettings,
    clientSettings: req.user.clientSettings,
    development_mode
  });
});
// File Manager Page
router.get("/filemanager", ensureAuthenticated, ensureCurrentUserAndGroup, async (req, res) => {
  const printers = getPrinterStoreCache().listPrintersInformation();
  await TaskManager.forceRunTask("GENERATE_FILE_STATISTICS");
  const serverSettings = SettingsClean.returnSystemSettings();
  const currentOperations = getCurrentOperations();
  const fileStatistics = FileClean.returnStatistics();
  res.render("filemanager", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    page: "File Manager",
    octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
    printerCount: printers.length,
    printers,
    helpers: prettyHelpers,
    currentOperationsCount: currentOperations.count,
    fileStatistics,
    serverSettings,
    clientSettings: req.user.clientSettings
  });
});
// History Page
router.get("/history", ensureAuthenticated, ensureCurrentUserAndGroup, async (req, res) => {
  const printers = getPrinterStoreCache().listPrintersInformation();

  const serverSettings = SettingsClean.returnSystemSettings();

  const historyCache = getHistoryCache();

  const { historyClean, statisticsClean, pagination } = historyCache;

  res.render("history", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    printerCount: printers.length,
    helpers: prettyHelpers,
    history: historyClean,
    printStatistics: statisticsClean,
    pagination: pagination,
    page: "History",
    serverSettings,
    monthlyStatistics: historyCache.monthlyStatistics,
    octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
    clientSettings: req.user.clientSettings
  });
});

// Panel view  Page
router.get("/mon/panel", ensureAuthenticated, ensureCurrentUserAndGroup, async (req, res) => {
  const printers = getPrinterStoreCache().listPrintersInformation();
  const dashStatistics = getDashboardStatistics();
  const currentSort = getSorting();
  const currentFilter = getFilter();
  const serverSettings = SettingsClean.returnSystemSettings();
  getPrinterManagerCache().updateGroupList();
  let printGroups = getPrinterManagerCache().returnGroupList();
  if (typeof printGroups === "undefined") {
    printGroups = [];
  }

  res.render("panelView", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    printers,
    printerCount: printers.length,
    page: "Panel View",
    octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
    helpers: prettyHelpers,
    clientSettings: req.user.clientSettings,
    printGroups,
    serverSettings,
    currentChanges: { currentSort, currentFilter },
    dashboardStatistics: dashStatistics
  });
});
// Camera view  Page
router.get("/mon/camera", ensureAuthenticated, ensureCurrentUserAndGroup, async (req, res) => {
  const printers = getPrinterStoreCache().listPrintersInformation();
  const serverSettings = SettingsClean.returnSystemSettings();
  const dashStatistics = getDashboardStatistics();
  const currentSort = getSorting();
  const currentFilter = getFilter();
  getPrinterManagerCache().updateGroupList();
  let printGroups = getPrinterManagerCache().returnGroupList();
  if (typeof printGroups === "undefined") {
    printGroups = [];
  }

  res.render("cameraView", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    printers,
    printerCount: printers.length,
    page: "Camera View",
    octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
    helpers: prettyHelpers,
    clientSettings: req.user.clientSettings,
    printGroups,
    serverSettings,
    currentChanges: { currentSort, currentFilter },
    dashboardStatistics: dashStatistics
  });
});
router.get("/mon/group", ensureAuthenticated, ensureCurrentUserAndGroup, async (req, res) => {
  const printers = getPrinterStoreCache().listPrintersInformation();
  const serverSettings = SettingsClean.returnSystemSettings();

  const currentSort = getSorting();
  const currentFilter = getFilter();
  getPrinterManagerCache().updateGroupList();
  let printGroups = getPrinterManagerCache().returnGroupList();
  if (typeof printGroups === "undefined") {
    printGroups = [];
  }

  res.render("groupView", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    printers,
    printerCount: printers.length,
    page: "Group View",
    octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
    helpers: prettyHelpers,
    clientSettings: req.user.clientSettings,
    printGroups,
    serverSettings,
    currentChanges: { currentSort, currentFilter }
  });
});
// List view  Page
router.get("/mon/list", ensureAuthenticated, ensureCurrentUserAndGroup, async (req, res) => {
  const printers = getPrinterStoreCache().listPrintersInformation();
  const serverSettings = SettingsClean.returnSystemSettings();
  const clientSettings = SettingsClean.returnClientSettings();
  const dashStatistics = getDashboardStatistics();
  const currentSort = getSorting();
  const currentFilter = getFilter();
  getPrinterManagerCache().updateGroupList();
  let printGroups = getPrinterManagerCache().returnGroupList();
  if (typeof printGroups === "undefined") {
    printGroups = [];
  }

  res.render("listView", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    printers,
    printerCount: printers.length,
    page: "List View",
    octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
    helpers: prettyHelpers,
    clientSettings,
    printGroups,
    serverSettings,
    currentChanges: { currentSort, currentFilter },
    dashboardStatistics: dashStatistics
  });
});

router.get("/mon/combined", ensureAuthenticated, ensureCurrentUserAndGroup, async (req, res) => {
  const printers = getPrinterStoreCache().listPrintersInformation();
  const serverSettings = SettingsClean.returnSystemSettings();
  const dashStatistics = getDashboardStatistics();
  const currentSort = getSorting();
  const currentFilter = getFilter();
  getPrinterManagerCache().updateGroupList();
  let printGroups = getPrinterManagerCache().returnGroupList();
  if (typeof printGroups === "undefined") {
    printGroups = [];
  }

  res.render("combinedView", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    printers,
    printerCount: printers.length,
    page: "Super List View",
    octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
    helpers: prettyHelpers,
    clientSettings: req.user.clientSettings,
    printGroups,
    serverSettings,
    currentChanges: { currentSort, currentFilter },
    dashboardStatistics: dashStatistics
  });
});

router.get("/mon/currentOp", ensureAuthenticated, ensureCurrentUserAndGroup, async (req, res) => {
  const printers = getPrinterStoreCache().listPrintersInformation();
  const serverSettings = SettingsClean.returnSystemSettings();

  res.render("currentOperationsView", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    printers,
    printerCount: printers.length,
    page: "Current Operations",
    octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
    helpers: prettyHelpers,
    serverSettings,
    clientSettings: req.user.clientSettings
  });
});
router.get("/filament", ensureAuthenticated, ensureCurrentUserAndGroup, async (req, res) => {
  const historyCache = getHistoryCache();
  const historyStats = historyCache.generateStatistics();

  const printers = getPrinterStoreCache().listPrintersInformation();
  const serverSettings = SettingsClean.returnSystemSettings();
  const statistics = FilamentClean.getStatistics();
  const spools = FilamentClean.getSpools();
  const profiles = FilamentClean.getProfiles();

  res.render("filament", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    printerCount: printers.length,
    page: "Filament Manager",
    octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
    helpers: prettyHelpers,
    serverSettings,
    spools,
    profiles,
    statistics,
    historyStats,
    clientSettings: req.user.clientSettings
  });
});

router.get("/system", ensureAuthenticated, ensureCurrentUserAndGroup, async (req, res) => {
  const clientSettings = await SettingsClean.returnClientSettings();
  const serverSettings = SettingsClean.returnSystemSettings();
  const systemInformation = SystemRunner.returnInfo();
  const softwareUpdateNotification = softwareUpdateChecker.getUpdateNotificationIfAny();
  let dashboardSettings = clientSettings?.dashboard || getDefaultDashboardSettings();
  const currentUsers = await fetchUsers();

  res.render("system", {
    name: req.user.name,
    userGroup: req.user.group,
    version: process.env[AppConstants.VERSION_KEY],
    printerCount: getPrinterStoreCache().getPrinterCount(),
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
    },
    currentGitBranch: await getCurrentBranch(),
    areWeGitRepo: checkIfWereInAGitRepo(),
    systemEnvironment: process.env[AppConstants.NODE_ENV_KEY],
    patreonData: returnPatreonData(),
    currentUsers,
    taskManagerState: TaskManager.getTaskState()
  });
});

module.exports = router;
