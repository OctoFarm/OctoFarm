const _ = require("lodash");
const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth.js");
const { ensureCurrentUserAndGroup } = require("../config/users.js");
const ServerSettings = require("../models/ServerSettings.js");
const prettyHelpers = require("../../views/partials/functions/pretty.js");
const { Runner } = require("../runners/state.js");
const { FilamentClean } = require("../lib/dataFunctions/filamentClean.js");
const { SettingsClean } = require("../lib/dataFunctions/settingsClean.js");
const { PrinterClean } = require("../lib/dataFunctions/printerClean.js");
const { FileClean } = require("../lib/dataFunctions/fileClean.js");
const { getSorting, getFilter } = require("../lib/sorting.js");
const { AppConstants } = require("../app.constants");
const { getDefaultDashboardSettings } = require("../lib/providers/settings.constants");
const { getHistoryCache } = require("../cache/history.cache");
const softwareUpdateChecker = require("../services/octofarm-update.service");
const { defaultPaginationOptions } = require("../constants/history-sort.constants");

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
  const printers = await Runner.returnFarmPrinters();
  const serverSettings = SettingsClean.returnSystemSettings();
  const dashStatistics = PrinterClean.returnDashboardStatistics();
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
  const printers = await Runner.returnFarmPrinters();
  const serverSettings = SettingsClean.returnSystemSettings();
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
    clientSettings: req.user.clientSettings
  });
});
// File Manager Page
router.get("/filemanager", ensureAuthenticated, ensureCurrentUserAndGroup, async (req, res) => {
  const printers = PrinterClean.listPrintersInformation();
  const serverSettings = SettingsClean.returnSystemSettings();
  const currentOperations = PrinterClean.returnCurrentOperations();
  const fileStatistics = FileClean.returnStatistics();
  res.render("filemanager", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    page: "Printer Manager",
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
  const printers = Runner.returnFarmPrinters();

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
  const printers = await Runner.returnFarmPrinters();
  const sortedIndex = Runner.sortedIndex();
  const dashStatistics = PrinterClean.returnDashboardStatistics();
  const currentSort = getSorting();
  const currentFilter = getFilter();
  const serverSettings = SettingsClean.returnSystemSettings();

  let printGroups = Runner.returnGroupList();
  if (typeof printGroups === "undefined") {
    printGroups = [];
  }

  res.render("panelView", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    printers,
    printerCount: printers.length,
    sortedIndex,
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
  const printers = await Runner.returnFarmPrinters();
  const sortedIndex = await Runner.sortedIndex();
  const serverSettings = SettingsClean.returnSystemSettings();
  const dashStatistics = PrinterClean.returnDashboardStatistics();
  const currentSort = getSorting();
  const currentFilter = getFilter();

  let printGroups = await Runner.returnGroupList();
  if (typeof printGroups === "undefined") {
    printGroups = [];
  }

  res.render("cameraView", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    printers,
    printerCount: printers.length,
    sortedIndex,
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
  const printers = await Runner.returnFarmPrinters();
  const sortedIndex = await Runner.sortedIndex();
  const serverSettings = SettingsClean.returnSystemSettings();

  const currentSort = getSorting();
  const currentFilter = getFilter();

  let printGroups = await Runner.returnGroupList();
  if (typeof printGroups === "undefined") {
    printGroups = [];
  }

  res.render("groupView", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    printers,
    printerCount: printers.length,
    sortedIndex,
    page: "Group",
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
  const printers = await Runner.returnFarmPrinters();
  const sortedIndex = await Runner.sortedIndex();
  const serverSettings = SettingsClean.returnSystemSettings();
  const clientSettings = SettingsClean.returnClientSettings();
  const dashStatistics = PrinterClean.returnDashboardStatistics();
  const currentSort = getSorting();
  const currentFilter = getFilter();

  let printGroups = Runner.returnGroupList();
  if (typeof printGroups === "undefined") {
    printGroups = [];
  }

  res.render("listView", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    printers,
    printerCount: printers.length,
    sortedIndex,
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
  const printers = await Runner.returnFarmPrinters();
  const sortedIndex = await Runner.sortedIndex();
  const serverSettings = SettingsClean.returnSystemSettings();
  const dashStatistics = PrinterClean.returnDashboardStatistics();
  const currentSort = getSorting();
  const currentFilter = getFilter();

  let printGroups = Runner.returnGroupList();
  if (typeof printGroups === "undefined") {
    printGroups = [];
  }

  res.render("combinedView", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    printers,
    printerCount: printers.length,
    sortedIndex,
    page: "Combined View",
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
  const printers = await Runner.returnFarmPrinters();
  const sortedIndex = await Runner.sortedIndex();
  const serverSettings = SettingsClean.returnSystemSettings();

  res.render("currentOperationsView", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    printers,
    printerCount: printers.length,
    sortedIndex,
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

  const printers = Runner.returnFarmPrinters();
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

module.exports = router;
