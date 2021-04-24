const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth.js");
const { ensureCurrentUserAndGroup } = require("../config/users.js");
const ServerSettings = require("../models/ServerSettings.js");
const prettyHelpers = require("../../views/partials/functions/pretty.js");
const runner = require("../runners/state.js");
const { Runner } = runner;
const _ = require("lodash");
const historyClean = require("../lib/dataFunctions/historyClean.js");
const { HistoryClean } = historyClean;
const filamentClean = require("../lib/dataFunctions/filamentClean.js");
const { FilamentClean } = filamentClean;
const settingsClean = require("../lib/dataFunctions/settingsClean.js");
const { SettingsClean } = settingsClean;
const printerClean = require("../lib/dataFunctions/printerClean.js");
const { PrinterClean } = printerClean;
const fileClean = require("../lib/dataFunctions/fileClean.js");
const { FileClean } = fileClean;
const systemInfo = require("../runners/systemInfo.js");
const { getSorting, getFilter } = require("../lib/sorting.js");
const softwareUpdateChecker = require("../runners/softwareUpdateChecker");
const isDocker = require("is-docker");
const { AppConstants } = require("../app.constants");
const { fetchMongoDBConnectionString } = require("../../app-env");
const { isPm2, isNodemon, isNode } = require("../utils/env.utils.js");

const SystemInfo = systemInfo.SystemRunner;
const version = process.env.npm_package_version;
console.log(`Version: ${version} (server started)`);

// Welcome Page
async function welcome() {
  const serverSettings = await ServerSettings.find({});

  if (serverSettings[0].server.loginRequired === false) {
    router.get("/", (req, res) => res.redirect("/dashboard"));
  } else {
    const { registration } = serverSettings[0].server;
    router.get("/", (req, res) => {
      if (req.isAuthenticated()) {
        res.redirect("/dashboard");
      } else {
        res.render("welcome", {
          page: "Welcome",
          registration,
          serverSettings: serverSettings[0],
        });
      }
    });
  }
}

welcome();

// Dashboard Page
router.get(
  "/dashboard",
  ensureAuthenticated,
  ensureCurrentUserAndGroup,
  async (req, res) => {
    const printers = await Runner.returnFarmPrinters();
    const clientSettings = await SettingsClean.returnClientSettings();
    const serverSettings = await SettingsClean.returnSystemSettings();
    const dashStatistics = await PrinterClean.returnDashboardStatistics();
    let dashboardSettings = null;
    if (typeof clientSettings.dashboard === "undefined") {
      dashboardSettings = {
        defaultLayout: [
          { x: 0, y: 0, width: 2, height: 5, id: "currentUtil" },
          { x: 5, y: 0, width: 3, height: 5, id: "farmUtil" },
          { x: 8, y: 0, width: 2, height: 5, id: "averageTimes" },
          { x: 10, y: 0, width: 2, height: 5, id: "cumulativeTimes" },
          { x: 2, y: 0, width: 3, height: 5, id: "currentStat" },
          { x: 6, y: 5, width: 3, height: 5, id: "printerTemps" },
          { x: 9, y: 5, width: 3, height: 5, id: "printerUtilisation" },
          { x: 0, y: 5, width: 3, height: 5, id: "printerStatus" },
          { x: 3, y: 5, width: 3, height: 5, id: "printerProgress" },
          { x: 6, y: 10, width: 6, height: 9, id: "hourlyTemper" },
          { x: 0, y: 10, width: 6, height: 9, id: "weeklyUtil" },
          { x: 0, y: 19, width: 12, height: 8, id: "enviroData" },
        ],
        savedLayout: [],
        farmActivity: {
          currentOperations: false,
          cumulativeTimes: true,
          averageTimes: true,
        },
        printerStates: {
          printerState: true,
          printerTemps: true,
          printerUtilisation: true,
          printerProgress: true,
          currentStatus: true,
        },
        farmUtilisation: {
          currentUtilisation: true,
          farmUtilisation: true,
        },
        historical: {
          weeklyUtilisation: true,
          hourlyTotalTemperatures: false,
          environmentalHistory: false,
        },
      };
    } else {
      dashboardSettings = clientSettings.dashboard;
    }

    res.render("dashboard", {
      name: req.user.name,
      userGroup: req.user.group,
      version,
      printerCount: printers.length,
      page: "Dashboard",
      helpers: prettyHelpers,
      dashboardSettings: dashboardSettings,
      dashboardStatistics: dashStatistics,
    });
  }
);
router.get(
  "/printers",
  ensureAuthenticated,
  ensureCurrentUserAndGroup,
  async (req, res) => {
    const printers = await Runner.returnFarmPrinters();
    const serverSettings = await SettingsClean.returnSystemSettings();
    res.render("printerManagement", {
      name: req.user.name,
      userGroup: req.user.group,
      version,
      page: "Printer Manager",
      printerCount: printers.length,
      helpers: prettyHelpers,
    });
  }
);
// File Manager Page
router.get(
  "/filemanager",
  ensureAuthenticated,
  ensureCurrentUserAndGroup,
  async (req, res) => {
    const printers = await Runner.returnFarmPrinters();
    const serverSettings = await SettingsClean.returnSystemSettings();
    const currentOperations = await PrinterClean.returnCurrentOperations();
    const fileStatistics = await FileClean.returnStatistics();
    res.render("filemanager", {
      name: req.user.name,
      userGroup: req.user.group,
      version,
      page: "Printer Manager",
      printerCount: printers.length,
      helpers: prettyHelpers,
      currentOperationsCount: currentOperations.count,
      fileStatistics,
    });
  }
);
// History Page
router.get(
  "/history",
  ensureAuthenticated,
  ensureCurrentUserAndGroup,
  async (req, res) => {
    const printers = Runner.returnFarmPrinters();
    const history = await HistoryClean.returnHistory();
    const statistics = await HistoryClean.returnStatistics();
    const serverSettings = await SettingsClean.returnSystemSettings();
    res.render("history", {
      name: req.user.name,
      userGroup: req.user.group,
      version,
      printerCount: printers.length,
      history,
      printStatistics: statistics,
      helpers: prettyHelpers,
      page: "History",
    });
  }
);
// Panel view  Page
router.get(
  "/mon/panel",
  ensureAuthenticated,
  ensureCurrentUserAndGroup,
  async (req, res) => {
    const printers = await Runner.returnFarmPrinters();
    const sortedIndex = await Runner.sortedIndex();
    const clientSettings = await SettingsClean.returnClientSettings();
    const serverSettings = await SettingsClean.returnSystemSettings();
    const dashStatistics = await PrinterClean.returnDashboardStatistics();
    const currentSort = await getSorting();
    const currentFilter = await getFilter();

    let printGroups = await Runner.returnGroupList();
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
      helpers: prettyHelpers,
      clientSettings,
      printGroups,
      currentChanges: { currentSort, currentFilter },
      dashboardStatistics: dashStatistics,
    });
  }
);
// Camera view  Page
router.get(
  "/mon/camera",
  ensureAuthenticated,
  ensureCurrentUserAndGroup,
  async (req, res) => {
    const printers = await Runner.returnFarmPrinters();
    const sortedIndex = await Runner.sortedIndex();
    const clientSettings = await SettingsClean.returnClientSettings();
    const serverSettings = await SettingsClean.returnSystemSettings();
    const dashStatistics = await PrinterClean.returnDashboardStatistics();
    const currentSort = await getSorting();
    const currentFilter = await getFilter();

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
      helpers: prettyHelpers,
      clientSettings,
      printGroups,
      currentChanges: { currentSort, currentFilter },
      dashboardStatistics: dashStatistics,
    });
  }
);
router.get(
  "/mon/printerMap",
  ensureAuthenticated,
  ensureCurrentUserAndGroup,
  async (req, res) => {
    const printers = await Runner.returnFarmPrinters();
    const sortedIndex = await Runner.sortedIndex();
    const clientSettings = await SettingsClean.returnClientSettings();
    const serverSettings = await SettingsClean.returnSystemSettings();

    const currentSort = await getSorting();
    const currentFilter = await getFilter();

    let printGroups = await Runner.returnGroupList();
    if (typeof printGroups === "undefined") {
      printGroups = [];
    }

    res.render("printerMap", {
      name: req.user.name,
      userGroup: req.user.group,
      version,
      printers,
      printerCount: printers.length,
      sortedIndex,
      page: "Printer Map",
      helpers: prettyHelpers,
      clientSettings,
      printGroups,
      currentChanges: { currentSort, currentFilter },
    });
  }
);
// List view  Page
router.get(
  "/mon/list",
  ensureAuthenticated,
  ensureCurrentUserAndGroup,
  async (req, res) => {
    const printers = await Runner.returnFarmPrinters();
    const sortedIndex = await Runner.sortedIndex();
    const clientSettings = await SettingsClean.returnClientSettings();
    const serverSettings = await SettingsClean.returnSystemSettings();
    const dashStatistics = await PrinterClean.returnDashboardStatistics();
    const currentSort = await getSorting();
    const currentFilter = await getFilter();

    let printGroups = await Runner.returnGroupList();
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
      helpers: prettyHelpers,
      clientSettings,
      printGroups,
      currentChanges: { currentSort, currentFilter },
      dashboardStatistics: dashStatistics,
    });
  }
);
router.get(
  "/mon/currentOp",
  ensureAuthenticated,
  ensureCurrentUserAndGroup,
  async (req, res) => {
    const printers = await Runner.returnFarmPrinters();
    const sortedIndex = await Runner.sortedIndex();
    const clientSettings = await SettingsClean.returnClientSettings();
    const serverSettings = await SettingsClean.returnSystemSettings();

    res.render("currentOperationsView", {
      name: req.user.name,
      userGroup: req.user.group,
      version,
      printers,
      printerCount: printers.length,
      sortedIndex,
      page: "Current Operations",
      helpers: prettyHelpers,
      clientSettings,
    });
  }
);
router.get(
  "/filament",
  ensureAuthenticated,
  ensureCurrentUserAndGroup,
  async (req, res) => {
    const printers = Runner.returnFarmPrinters();
    const serverSettings = await SettingsClean.returnSystemSettings();
    const statistics = await FilamentClean.getStatistics();
    const spools = await FilamentClean.getSpools();
    const profiles = await FilamentClean.getProfiles();
    const sorted = await HistoryClean.returnHistory();
    const historyStats = await HistoryClean.getStatistics(sorted);

    res.render("filament", {
      name: req.user.name,
      userGroup: req.user.group,
      version,
      printerCount: printers.length,
      page: "Filament Manager",
      helpers: prettyHelpers,
      serverSettings,
      spools,
      profiles,
      statistics,
      historyStats,
    });
  }
);
router.get(
  "/system",
  ensureAuthenticated,
  ensureCurrentUserAndGroup,
  async (req, res) => {
    const clientSettings = await SettingsClean.returnClientSettings();
    const serverSettings = await SettingsClean.returnSystemSettings();
    const systemInformation = await SystemInfo.returnInfo();
    const printers = Runner.returnFarmPrinters();
    const softwareUpdateNotification = softwareUpdateChecker.getUpdateNotificationIfAny();
    let dashboardSettings = null;
    if (typeof clientSettings.dashboard === "undefined") {
      dashboardSettings = {
        defaultLayout: [
          { x: 0, y: 0, width: 2, height: 5, id: "currentUtil" },
          { x: 5, y: 0, width: 3, height: 5, id: "farmUtil" },
          { x: 8, y: 0, width: 2, height: 5, id: "averageTimes" },
          { x: 10, y: 0, width: 2, height: 5, id: "cumulativeTimes" },
          { x: 2, y: 0, width: 3, height: 5, id: "currentStat" },
          { x: 6, y: 5, width: 3, height: 5, id: "printerTemps" },
          { x: 9, y: 5, width: 3, height: 5, id: "printerUtilisation" },
          { x: 0, y: 5, width: 3, height: 5, id: "printerStatus" },
          { x: 3, y: 5, width: 3, height: 5, id: "printerProgress" },
          { x: 6, y: 10, width: 6, height: 9, id: "hourlyTemper" },
          { x: 0, y: 10, width: 6, height: 9, id: "weeklyUtil" },
          { x: 0, y: 19, width: 12, height: 8, id: "enviroData" },
        ],
        savedLayout: [],
        farmActivity: {
          currentOperations: false,
          cumulativeTimes: true,
          averageTimes: true,
        },
        printerStates: {
          printerState: true,
          printerTemps: true,
          printerUtilisation: true,
          printerProgress: true,
          currentStatus: true,
        },
        farmUtilisation: {
          currentUtilisation: true,
          farmUtilisation: true,
        },
        historical: {
          weeklyUtilisation: true,
          hourlyTotalTemperatures: false,
          environmentalHistory: false,
        },
      };
    } else {
      dashboardSettings = clientSettings.dashboard;
    }

    res.render("system", {
      name: req.user.name,
      userGroup: req.user.group,
      version,
      printerCount: printers.length,
      page: "System",
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
        update: softwareUpdateNotification,
      },
    });
  }
);

softwareUpdateChecker
  .syncLatestOctoFarmRelease(false || process.env[AppConstants.OCTOFARM_ALLOW_PRERELEASE_INSTALL_KEY])
  .then(() => {
    softwareUpdateChecker.checkReleaseAndLogUpdate();
  });

HistoryClean.start();

//Hacky database check due to shoddy layout of code...
const mongoose = require("mongoose");
const serverSettings = require("../settings/serverSettings");

let interval = false;
if (interval === false) {
  interval = setInterval(async () => {
    if (mongoose.connection.readyState === 1) {
      const printersInformation = PrinterClean.returnPrintersInformation();
      await PrinterClean.sortCurrentOperations(printersInformation);
      await PrinterClean.statisticsStart();
      await PrinterClean.createPrinterList(printersInformation, serverSettings.filamentManager);
    }
  }, 2500);
}

module.exports = router;
