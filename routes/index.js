const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const db = require("../config/db").MongoURI;
const pjson = require("../package.json");
const ClientSettings = require("../models/ClientSettings.js");
const ServerSettings = require("../models/ServerSettings.js");
const prettyHelpers = require("../views/partials/functions/pretty.js");
const Spools = require("../models/Filament.js");
const Profiles = require("../models/Profiles.js");
const runner = require("../runners/state.js");
const Runner = runner.Runner;
const _ = require("lodash");

const version = pjson.version + ".5";

console.log("db: " + db);

const Roll = require("../models/Filament.js");

//Welcome Page
async function welcome() {
    if (db === "") {
        //No db setup, show db warning before login.
        router.get("/", (req, res) =>
            res.render("database", { page: "Database Warning" })
        );
    } else {
        let settings = await ServerSettings.find({});

        if (settings[0].server.loginRequired === false) {
            router.get("/", (req, res) => res.redirect("/dashboard"));
        } else {
            let registration = settings[0].server.registration;
            router.get("/", (req, res) =>
                res.render("welcome", {
                    page: "Welcome",
                    registration: registration,
                    serverSettings: settings,
                })
            );
        }
    }
}
welcome();

//Dashboard Page
router.get("/dashboard", ensureAuthenticated, async(req, res) => {
    let printers = await Runner.returnFarmPrinters();
    let sortedPrinters = await Runner.sortedIndex();
    const farmStatistics = require("../runners/statisticsCollection.js");
    const FarmStatistics = farmStatistics.StatisticsCollection;
    let statistics = await FarmStatistics.returnStats();
    const system = require("../runners/systemInfo.js");
    const SystemRunner = system.SystemRunner;
    let systemInformation = await SystemRunner.returnInfo();
    let clientSettings = await ClientSettings.find({});
    let serverSettings = await ServerSettings.find({});
    let user = null;
    let group = null;
    if (serverSettings[0].server.loginRequired === false) {
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
        sortedIndex: sortedPrinters,
        printers: printers,
        farmInfo: statistics.farmInfo,
        currentOperations: statistics.currentOperations,
        octofarmStatistics: statistics.octofarmStatistics,
        printStatistics: statistics.printStatistics,
        printerCount: printers.length,
        currentOperationsCount: statistics.currentOperationsCount,
        page: "Dashboard",
        helpers: prettyHelpers,
        systemInfo: systemInformation,
        clientSettings: clientSettings,
        serverSettings: serverSettings,
    });
});
router.get("/printers", ensureAuthenticated, async(req, res) => {
    let printers = await Runner.returnFarmPrinters();
    let sortedPrinters = await Runner.sortedIndex();
    const farmStatistics = require("../runners/statisticsCollection.js");
    const FarmStatistics = farmStatistics.StatisticsCollection;
    let statistics = await FarmStatistics.returnStats();
    const system = require("../runners/systemInfo.js");
    const SystemRunner = system.SystemRunner;
    let systemInformation = await SystemRunner.returnInfo();
    let clientSettings = await ClientSettings.find({});
    let serverSettings = await ServerSettings.find({});
    let user = null;
    let group = null;
    if (serverSettings[0].server.loginRequired === false) {
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
        sortedIndex: sortedPrinters,
        printers: printers,
        page: "Printer Manager",
        printerCount: printers.length,
        helpers: prettyHelpers,
        systemInfo: systemInformation,
        clientSettings: clientSettings,
        serverSettings: serverSettings,
    });
});
//File Manager Page
router.get("/filemanager", ensureAuthenticated, async(req, res) => {
    let printers = await Runner.returnFarmPrinters();
    let sortedPrinters = await Runner.sortedIndex();
    const farmStatistics = require("../runners/statisticsCollection.js");
    const FarmStatistics = farmStatistics.StatisticsCollection;
    let statistics = await FarmStatistics.returnStats();
    let serverSettings = await ServerSettings.find({});
    let user = null;
    let group = null;
    if (serverSettings[0].server.loginRequired === false) {
        user = "No User";
        group = "Administrator";
    } else {
        user = req.user.name;
        group = req.user.group;
    }
    res.render("filemanager", {
        name: user,
        userGroup: group,
        version: version,
        printers: printers,
        sortedIndex: sortedPrinters,
        printerCount: printers.length,
        currentOperationsCount: statistics.currentOperationsCount,
        farmInfo: statistics.fileStatistics,
        page: "File Manager",
        helpers: prettyHelpers,
        serverSettings: serverSettings,
    });
});
//History Page
router.get("/history", ensureAuthenticated, async(req, res) => {
    let printers = Runner.returnFarmPrinters();
    let sortedPrinters = await Runner.sortedIndex();
    const History = require("../models/History.js");
    let history = await History.find({});
    const farmStatistics = require("../runners/statisticsCollection.js");
    const FarmStatistics = farmStatistics.StatisticsCollection;
    let statistics = await FarmStatistics.returnStats();
    let serverSettings = await ServerSettings.find({});
    let user = null;
    let group = null;
    if (serverSettings[0].server.loginRequired === false) {
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
        printers: printers,
        sortedIndex: sortedPrinters,
        printerCount: printers.length,
        history: history,
        page: "History",
        helpers: prettyHelpers,
        printStatistics: statistics.printStatistics,
        serverSettings: serverSettings,
    });
});
//Panel view  Page
router.get("/mon/panel", ensureAuthenticated, async(req, res) => {
    let printers = Runner.returnFarmPrinters();
    let sortedPrinters = await Runner.sortedIndex();
    const farmStatistics = require("../runners/statisticsCollection.js");
    const FarmStatistics = farmStatistics.StatisticsCollection;
    let statistics = await FarmStatistics.returnStats();
    let clientSettings = await ClientSettings.find({});
    let serverSettings = await ServerSettings.find({});
    let user = null;
    let group = null;
    if (serverSettings[0].server.loginRequired === false) {
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
        sortedIndex: sortedPrinters,
        currentOperations: statistics.currentOperations,
        printerCount: printers.length,
        currentOperationsCount: statistics.currentOperationsCount,
        page: "Panel View",
        helpers: prettyHelpers,
        clientSettings: clientSettings,
        serverSettings: serverSettings,
    });
});
//Camera view  Page
router.get("/mon/camera", ensureAuthenticated, async(req, res) => {
    let printers = Runner.returnFarmPrinters();
    let sortedPrinters = await Runner.sortedIndex();
    const farmStatistics = require("../runners/statisticsCollection.js");
    const FarmStatistics = farmStatistics.StatisticsCollection;
    let statistics = await FarmStatistics.returnStats();
    let clientSettings = await ClientSettings.find({});
    let serverSettings = await ServerSettings.find({});
    let user = null;
    let group = null;
    if (serverSettings[0].server.loginRequired === false) {
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
    let clientSettings = await ClientSettings.find({});
    let serverSettings = await ServerSettings.find({});
    let user = null;
    let group = null;
    if (serverSettings[0].server.loginRequired === false) {
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
    let clientSettings = await ClientSettings.find({});
    let serverSettings = await ServerSettings.find({});
    let user = null;
    let group = null;
    if (serverSettings[0].server.loginRequired === false) {
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
        clientSettings: clientSettings,
        serverSettings: serverSettings,
    });
});
router.get("/filament", ensureAuthenticated, async(req, res) => {
    let printers = Runner.returnFarmPrinters();
    let sortedPrinters = await Runner.sortedIndex();
    const farmStatistics = require("../runners/statisticsCollection.js");
    const FarmStatistics = farmStatistics.StatisticsCollection;
    let statistics = await FarmStatistics.returnStats();
    let clientSettings = await ClientSettings.find({});
    let serverSettings = await ServerSettings.find({});
    let spools = await Spools.find({});
    let profiles = await Profiles.find({});
    let user = null;
    let group = null;
    if (serverSettings[0].server.loginRequired === false) {
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
        printers: printers,
        sortedIndex: sortedPrinters,
        currentOperations: statistics.currentOperations,
        printerCount: printers.length,
        currentOperationsCount: statistics.currentOperationsCount,
        page: "Filament Manager",
        helpers: prettyHelpers,
        clientSettings: clientSettings,
        serverSettings: serverSettings,
        spools: spools,
        profiles: profiles,
    });
});
module.exports = router;