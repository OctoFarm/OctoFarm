
const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const db = require("../config/db").MongoURI;
const pjson = require("../package.json");
const ServerSettings = require("../models/ServerSettings.js");
const prettyHelpers = require("../views/partials/functions/pretty.js");
const runner = require("../runners/state.js");
const Runner = runner.Runner;
const _ = require("lodash");

const historyClean = require("../lib/dataFunctions/historyClean.js");
const HistoryClean = historyClean.HistoryClean;
const filamentClean = require("../lib/dataFunctions/filamentClean.js");
const FilamentClean = filamentClean.FilamentClean;
const settingsClean = require("../lib/dataFunctions/settingsClean.js");
const SettingsClean = settingsClean.SettingsClean;

const version = pjson.version + ".6.1";

console.log("db: " + db);

//Welcome Page
async function welcome() {
    if (db === "") {
        //No db setup, show db warning before login.
        router.get("/", (req, res) =>
            res.render("database", { page: "Database Warning" })
        );
    } else {
        let serverSettings = await ServerSettings.find({});
        if (serverSettings[0].server.loginRequired === false) {
            router.get("/", (req, res) => res.redirect("/dashboard"));
        } else {
            let registration = serverSettings[0].server.registration;
            router.get("/", (req, res) =>
                res.render("welcome", {
                    page: "Welcome",
                    registration: registration,
                    serverSettings: serverSettings[0],
                })
            );
        }
    }
}
welcome();

//Dashboard Page
router.get("/dashboard", ensureAuthenticated, async(req, res) => {
    let printers = await Runner.returnFarmPrinters();
    let serverSettings = await SettingsClean.returnSystemSettings();
    let user = null;
    let group = null;
    if (serverSettings.server.loginRequired === false) {
        user = "No User";
        group = "Administrator";
    } else {
        user = req.user.name;
        group = req.user.group;
    }
    res.render("dashboard", {
        name: user,
        userGroup: group,
        version: version,
        printerCount: printers.length,
        page: "Dashboard",
        helpers: prettyHelpers,
    });
});
router.get("/printers", ensureAuthenticated, async(req, res) => {
    let printers = await Runner.returnFarmPrinters();
    let serverSettings = await SettingsClean.returnSystemSettings();
    let user = null;
    let group = null;
    if (serverSettings.server.loginRequired === false) {
        user = "No User";
        group = "Administrator";
    } else {
        user = req.user.name;
        group = req.user.group;
    }
    res.render("printerManagement", {
        name: user,
        userGroup: group,
        version: version,
        page: "Printer Manager",
        printerCount: printers.length,
        helpers: prettyHelpers,
    });
});
//File Manager Page
router.get("/filemanager", ensureAuthenticated, async(req, res) => {
    let printers = await Runner.returnFarmPrinters();
    let serverSettings = await SettingsClean.returnSystemSettings();
    let user = null;
    let group = null;
    if (serverSettings.server.loginRequired === false) {
        user = "No User";
        group = "Administrator";
    } else {
        user = req.user.name;
        group = req.user.group;
    }
    res.render("printerManagement", {
        name: user,
        userGroup: group,
        version: version,
        page: "Printer Manager",
        printerCount: printers.length,
        helpers: prettyHelpers,
    });
});
//History Page
router.get("/history", ensureAuthenticated, async (req, res) => {
    let printers = Runner.returnFarmPrinters();
    let history = await HistoryClean.returnHistory();
    let statistics = await HistoryClean.returnStatistics();
    let serverSettings = await SettingsClean.returnSystemSettings();
    let user = null;
    let group = null;
    if (serverSettings.server.loginRequired === false) {
        user = "No User";
        group = "Administrator";
    } else {
        user = req.user.name;
        group = req.user.group;
    }
    res.render("history", {
        name: user,
        userGroup: group,
        version: version,
        printerCount: printers.length,
        history: history,
        printStatistics: statistics,
        helpers: prettyHelpers,
        page: "History",
    });
});
//Panel view  Page
router.get("/mon/panel", ensureAuthenticated, async(req, res) => {
    let printers = await Runner.returnFarmPrinters();
    let sortedIndex = await Runner.sortedIndex();
    let clientSettings = await SettingsClean.returnClientSettings();
    let serverSettings = await SettingsClean.returnSystemSettings();
    let user = null;
    let group = null;
    if (serverSettings.server.loginRequired === false) {
        user = "No User";
        group = "Administrator";
    } else {
        user = req.user.name;
        group = req.user.group;
    }
    res.render("panelView", {
        name: user,
        userGroup: group,
        version: version,
        printers: printers,
        printerCount: printers.length,
        sortedIndex: sortedIndex,
        page: "Panel View",
        helpers: prettyHelpers,
        clientSettings: clientSettings,
    });
});
//Camera view  Page
router.get("/mon/camera", ensureAuthenticated, async(req, res) => {
    let printers = Runner.returnFarmPrinters();
    let sortedPrinters = await Runner.sortedIndex();
    const farmStatistics = require("../runners/statisticsCollection.js");
    const FarmStatistics = farmStatistics.StatisticsCollection;
    let statistics = await FarmStatistics.returnStats();
    let clientSettings = await SettingsClean.returnClientSettings();
    let serverSettings = await SettingsClean.returnSystemSettings();
    let user = null;
    let group = null;
    if (serverSettings.server.loginRequired === false) {
        user = "No User";
        group = "Administrator";
    } else {
        user = req.user.name;
        group = req.user.group;
    }
    res.render("cameraView", {
        name: user,
        userGroup: group,
        version: version,
        printers: printers,
        sortedIndex: sortedPrinters,
        currentOperations: statistics.currentOperations,
        currentOperationsCount: statistics.currentOperationsCount,
        printerCount: printers.length,
        page: "Camera View",
        helpers: prettyHelpers,
        clientSettings: clientSettings,
        serverSettings: serverSettings,
    });
});
//List view  Page
router.get("/mon/list", ensureAuthenticated, async(req, res) => {
    let printers = Runner.returnFarmPrinters();
    let sortedPrinters = await Runner.sortedIndex();
    const farmStatistics = require("../runners/statisticsCollection.js");
    const FarmStatistics = farmStatistics.StatisticsCollection;
    let statistics = await FarmStatistics.returnStats();
    let clientSettings = await SettingsClean.returnClientSettings();
    let serverSettings = await SettingsClean.returnSystemSettings();
    let user = null;
    let group = null;
    if (serverSettings.server.loginRequired === false) {
        user = "No User";
        group = "Administrator";
    } else {
        user = req.user.name;
        group = req.user.group;
    }
    res.render("listView", {
        name: user,
        userGroup: group,
        version: version,
        printers: printers,
        sortedIndex: sortedPrinters,
        currentOperations: statistics.currentOperations,
        currentOperationsCount: statistics.currentOperationsCount,
        printerCount: printers.length,
        page: "List View",
        helpers: prettyHelpers,
        clientSettings: clientSettings,
        serverSettings: serverSettings,
    });
});
router.get("/mon/currentOp", ensureAuthenticated, async(req, res) => {
    let printers = Runner.returnFarmPrinters();
    let sortedPrinters = await Runner.sortedIndex();
    const farmStatistics = require("../runners/statisticsCollection.js");
    const FarmStatistics = farmStatistics.StatisticsCollection;
    let statistics = await FarmStatistics.returnStats();
    let serverSettings = await SettingsClean.returnSystemSettings();
    let user = null;
    let group = null;
    if (serverSettings.server.loginRequired === false) {
        user = "No User";
        group = "Administrator";
    } else {
        user = req.user.name;
        group = req.user.group;
    }
    res.render("currentOperationsView", {
        name: user,
        userGroup: group,
        version: version,
        printers: printers,
        sortedIndex: sortedPrinters,
        currentOperations: statistics.currentOperations,
        printerCount: printers.length,
        currentOperationsCount: statistics.currentOperationsCount,
        page: "Current Operations View",
        helpers: prettyHelpers,
    });
});
router.get("/filament", ensureAuthenticated, async(req, res) => {
    let printers = Runner.returnFarmPrinters();
    let clientSettings = await SettingsClean.returnClientSettings();
    let serverSettings = await SettingsClean.returnSystemSettings();
    let statistics = await FilamentClean.getStatistics();
    let spools = await FilamentClean.getSpools();
    let profiles = await FilamentClean.getProfiles();
    let user = null;
    let group = null;
    if (serverSettings.server.loginRequired === false) {
        user = "No User";
        group = "Administrator";
    } else {
        user = req.user.name;
        group = req.user.group;
    }
    res.render("filament", {
        name: user,
        userGroup: group,
        version: version,
        printerCount: printers.length,
        page: "Filament Manager",
        helpers: prettyHelpers,
        clientSettings: clientSettings,
        serverSettings: serverSettings,
        spools: spools,
        profiles: profiles,
        statistics: statistics,
    });
});
router.get("/system", ensureAuthenticated, async(req, res) => {
    let clientSettings = await SettingsClean.returnClientSettings();
    let serverSettings = await SettingsClean.returnSystemSettings();
    let printers = Runner.returnFarmPrinters();
    let user = null;
    let group = null;
    if (serverSettings.server.loginRequired === false) {
        user = "No User";
        group = "Administrator";
    } else {
        user = req.user.name;
        group = req.user.group;
    }
    res.render("system", {
        name: user,
        userGroup: group,
        version: version,
        printerCount: printers.length,
        page: "System",
        helpers: prettyHelpers,
        clientSettings: clientSettings,
        serverSettings: serverSettings,
    });
});
module.exports = router;