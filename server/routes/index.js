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
const { fetchUsers } = require("../api/users.api.js");
const passport = require("passport");
const { UserTokenService } = require("../services/authentication/user-token.service");
const User = require("../models/User");
const ClientSettings = require("../models/ClientSettings");
const bcrypt = require("bcryptjs");
const ServerSettingsDB = require("../models/ServerSettings");

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
  "/users",
  ensureAuthenticated,
  ensureCurrentUserAndGroup,
  ensureAdministrator,
  async (_req, res) => {
    res.render("users", {
      page: "Users",
      helpers: prettyHelpers,

      userList: await fetchUsers(),
      allowedUserGroups: [
        { display: "Administrator", value: "administrator" },
        { display: "User", value: "user" },
        { display: "View", value: "view" }
      ]
    });
  }
);

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

// Login Page
router.get("/login", async (_req, res) => {
  const serverSettings = SettingsClean.returnSystemSettings();
  res.render("login", {
    layout: "layout-no-sign-in",
    page: "Login",
    octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
    registration: serverSettings.server.registration,
    serverSettings: serverSettings
  });
});

// Login Handle
router.post(
  "/login",
  passport.authenticate("local", {
    // Dont add or we wont reach remember_me cookie successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true
  }),
  async function (req, res, next) {
    const prevSession = req.session;
    req.session.regenerate((err) => {
      logger.error("Unable to regenerate session!", err);
      Object.assign(req.session, prevSession);
    });

    if (!req.body.remember_me) {
      return next();
    }
    await UserTokenService.issueTokenWithDone(req.user, function (err, token) {
      if (err) {
        return next(err);
      }

      res.cookie("remember_me", token, {
        path: "/",
        httpOnly: true,
        maxAge: 604800000
      });
      return next();
    });
  },
  (_req, res) => {
    res.redirect("/dashboard");
  }
);

// Register Page
router.get("/register", async (_req, res) => {
  const serverSettings = SettingsClean.returnSystemSettings();
  if (serverSettings.server.registration !== true) {
    return res.redirect("login");
  }

  let currentUsers = await fetchUsers();
  res.render("register", {
    layout: "layout-no-sign-in",
    page: "Register",
    octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
    serverSettings: serverSettings,
    userCount: currentUsers.length
  });
});

// Register Handle
router.post("/register", async (req, res) => {
  const name = req.bodyString("name");
  const username = req.bodyString("username");
  const password = req.bodyString("password");
  const password2 = req.bodyString("password2");

  const errors = [];

  const serverSettings = SettingsClean.returnSystemSettings();
  let currentUsers = await fetchUsers(true);

  // Check required fields
  if (!name || !username || !password || !password2) {
    errors.push({ msg: "Please fill in all fields..." });
  }

  // Check passwords match
  if (password !== password2) {
    errors.push({ msg: "Passwords do not match..." });
  }

  // Password at least 6 characters
  if (password.length < 6) {
    errors.push({ msg: "Password should be at least 6 characters..." });
  }

  if (errors.length > 0) {
    res.render("register", {
      page: "Login",
      octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
      registration: serverSettings.server.registration,
      serverSettings: serverSettings,
      errors,
      name,
      username,
      password,
      password2,
      userCount: currentUsers.length
    });
  } else {
    // Validation Passed
    User.findOne({ username }).then((currentUser) => {
      if (currentUser) {
        // User exists
        errors.push({ msg: "Username is already registered" });
        res.render("register", {
          page: "Login",
          octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
          registration: serverSettings.server.registration,
          serverSettings: serverSettings,
          errors,
          name,
          username,
          password,
          password2,
          userCount: currentUsers.length
        });
      } else {
        // Check if first user that's created.
        User.find({}).then(async (userList) => {
          let userGroup;
          if (userList.length < 1) {
            userGroup = "Administrator";
          } else {
            userGroup = "User";
          }
          const userSettings = new ClientSettings();
          await userSettings.save();
          await SettingsClean.start();
          const newUser = new User({
            name,
            username,
            password,
            group: userGroup,
            clientSettings: userSettings._id
          });
          // Hash Password
          bcrypt.genSalt(10, (error, salt) =>
            bcrypt.hash(newUser.password, salt, (err, hash) => {
              if (err) {
                logger.error("Unable to generate bycrpt hash!!", err);
                throw err;
              }
              // Set password to hashed
              newUser.password = hash;
              // Save new User
              newUser
                .save()
                .then(async () => {
                  if (userList.length < 1) {
                    const currentSettings = await ServerSettingsDB.find({});
                    currentSettings[0].server.registration = false;
                    currentSettings[0].markModified("server.registration");
                    currentSettings[0].save();
                    await SettingsClean.start();
                  }
                  req.flash("success_msg", "You are now registered and can login");
                  res.redirect("/login");
                })
                .catch((theError) => {
                  logger.error("Couldn't save user to database!", theError);
                })
                .finally(async () => {
                  await fetchUsers(true);
                });
            })
          );
        });
      }
    });
  }
});

// Logout Handle
router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success_msg", "You are logged out");
  res.redirect("/login");
});

module.exports = router;
