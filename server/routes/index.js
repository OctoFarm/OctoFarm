const express = require("express");
const router = express.Router();
const { ensureAuthenticated, ensureAdministrator } = require("../middleware/auth.js");
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
const {
  getLatestReleaseNotes,
  getFutureReleaseNote
} = require("../services/github-client.service");

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
        layout: "layout-no-sign-in",
        octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
        registration
      });
    }
  }
});

// Dashboard Page
router.get("/dashboard", ensureAuthenticated, ensureCurrentUserAndGroup, async (req, res) => {
  const printers = getPrinterStoreCache().listPrintersInformation();
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
    clientSettings: req.user.clientSettings
  });
});
router.get("/printers", ensureAuthenticated, ensureCurrentUserAndGroup, async (req, res) => {
  const printers = getPrinterStoreCache().listPrintersInformation();
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
    clientSettings: req.user.clientSettings
  });
});
// History Page
router.get("/history", ensureAuthenticated, ensureCurrentUserAndGroup, async (req, res) => {
  const printers = getPrinterStoreCache().listPrintersInformation();

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
    currentChanges: { currentSort, currentFilter },
    dashboardStatistics: dashStatistics
  });
});
// Camera view  Page
router.get("/mon/camera", ensureAuthenticated, ensureCurrentUserAndGroup, async (req, res) => {
  const printers = getPrinterStoreCache().listPrintersInformation();
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
    currentChanges: { currentSort, currentFilter },
    dashboardStatistics: dashStatistics
  });
});
router.get("/mon/group", ensureAuthenticated, ensureCurrentUserAndGroup, async (req, res) => {
  const printers = getPrinterStoreCache().listPrintersInformation();

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
    currentChanges: { currentSort, currentFilter }
  });
});
// List view  Page
router.get("/mon/list", ensureAuthenticated, ensureCurrentUserAndGroup, async (req, res) => {
  const printers = getPrinterStoreCache().listPrintersInformation();
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
    currentChanges: { currentSort, currentFilter },
    dashboardStatistics: dashStatistics
  });
});

router.get("/mon/combined", ensureAuthenticated, ensureCurrentUserAndGroup, async (req, res) => {
  const printers = getPrinterStoreCache().listPrintersInformation();
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
    currentChanges: { currentSort, currentFilter },
    dashboardStatistics: dashStatistics
  });
});

router.get("/mon/currentOp", ensureAuthenticated, ensureCurrentUserAndGroup, async (req, res) => {
  const printers = getPrinterStoreCache().listPrintersInformation();

  res.render("currentOperationsView", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    printers,
    printerCount: printers.length,
    page: "Current Operations",
    octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
    helpers: prettyHelpers,
    clientSettings: req.user.clientSettings
  });
});
router.get("/filament", ensureAuthenticated, ensureCurrentUserAndGroup, async (req, res) => {
  const historyCache = getHistoryCache();
  const historyStats = historyCache.generateStatistics();

  const printers = getPrinterStoreCache().listPrintersInformation();
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
    spools,
    profiles,
    statistics,
    historyStats,
    clientSettings: req.user.clientSettings
  });
});

router.get(
  "/administration",
  ensureAuthenticated,
  ensureCurrentUserAndGroup,
  ensureAdministrator,
  async (_req, res) => {
    const softwareUpdateNotification = softwareUpdateChecker.getUpdateNotificationIfAny();
    const latestReleaseNotes = getLatestReleaseNotes();
    const futureReleaseNotes = getFutureReleaseNote();
    res.render("administration", {
      page: "Administration",
      helpers: prettyHelpers,
      taskManagerState: TaskManager.getTaskState(),
      serviceInformation: {
        update: softwareUpdateNotification
      },
      latestReleaseNotes,
      futureReleaseNotes,
      mongoURI: process.env[AppConstants.MONGO_KEY],
      portNumber: process.env[AppConstants.OCTOFARM_PORT_KEY],
      logLevel: process.env[AppConstants.LOG_LEVEL]
    });
  }
);

module.exports = router;
