//APP Version
const pjson = require("./package.json");
process.env.OCTOFARM_VERSION = `${pjson.version}`;

//Requires
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const ServerSettingsDB = require("./server_src/models/ServerSettings");
const Logger = require("./server_src/lib/logger.js");

const logger = new Logger("OctoFarm-Server", false);
const printerClean = require("./server_src/lib/dataFunctions/printerClean.js");

const {databaseSetup} = require("./server_src/lib/influxExport.js");

const {PrinterClean} = printerClean;

const autoDiscovery = require("./server_src/runners/autoDiscovery.js");

// Server Port
const app = express();
let listenedServer = null;

// Passport Config
require("./server_src/config/passport.js")(passport);

// .env Config
require("dotenv").config();

// JSON
app.use(express.json());

// EJS
app.use(expressLayouts);
app.set("view engine", "ejs");

// Cookie parsing and URL decoding
app.use(cookieParser());
app.use(express.urlencoded({extended: false}));

// Express Session Middleware

app.use(
  session({
    secret: "supersecret",
    resave: true,
    saveUninitialized: true,
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Remember Me!
app.use(passport.authenticate("remember-me"));

// Connect Flash Middleware
app.use(flash());

// Global Vars
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

const setupServerSettings = async () => {
  const serverSettings = require("./server_src/settings/serverSettings.js");
  const {ServerSettings} = serverSettings;
  await logger.info("Checking Server Settings...");
  const ss = await ServerSettings.init();
  // Setup Settings
  await logger.info(ss);
};

const serverStart = async () => {
  try {
    await logger.info("MongoDB Connected...");

    // Initialise farm information
    const farmInformation = await PrinterClean.initFarmInformation();
    await logger.info(farmInformation);
    // Find server Settings
    const settings = await ServerSettingsDB.find({});
    const clientSettings = require("./server_src/settings/clientSettings.js");
    const {ClientSettings} = clientSettings;
    await logger.info("Checking Client Settings...");
    const cs = await ClientSettings.init();
    await logger.info(cs);
    const runner = require("./server_src/runners/state.js");
    const {Runner} = runner;
    const rn = await Runner.init();

    await logger.info("Printer Runner has been initialised...", rn);
    const PORT = process.env.PORT || settings[0].server.port;
    await logger.info("Starting System Information Runner...");
    const system = require("./server_src/runners/systemInfo.js");
    const {SystemRunner} = system;
    const sr = await SystemRunner.init();
    await logger.info(sr);

    await databaseSetup();

    listenedServer = app.listen(PORT, "0.0.0.0", () => {
      logger.info("HTTP server started...");
      logger.info(`You can now access your server on port: ${PORT}`);
      console.log(`You can now access your server on port: ${PORT}`);
      // eslint-disable-next-line no-console
      process.send("ready");
    });
  } catch (err) {
    await logger.error(err);
  }

  // Routes
  app.use(express.static(`${__dirname}/views`));
  app.use("/images", express.static(`${__dirname}/images`));
  try {
    app.use("/", require("./server_src/routes/index", {page: "route"}));
    app.use(
      "/serverChecks",
      require("./server_src/routes/serverChecks", {page: "route"})
    );
    app.use(
      "/users",
      require("./server_src/routes/users", {page: "route"})
    );
    app.use(
      "/printers",
      require("./server_src/routes/printers", {page: "route"})
    );
    app.use(
      "/groups",
      require("./server_src/routes/printerGroups", {page: "route"})
    );
    app.use(
      "/settings",
      require("./server_src/routes/settings", {page: "route"})
    );
    app.use(
      "/printersInfo",
      require("./server_src/routes/SSE-printersInfo", {page: "route"})
    );
    app.use(
      "/dashboardInfo",
      require("./server_src/routes/SSE-dashboard", {page: "route"})
    );
    app.use(
      "/monitoringInfo",
      require("./server_src/routes/SSE-monitoring", {page: "route"})
    );
    app.use(
      "/filament",
      require("./server_src/routes/filament", {page: "route"})
    );
    app.use(
      "/history",
      require("./server_src/routes/history", {page: "route"})
    );
    app.use(
      "/scripts",
      require("./server_src/routes/scripts", {page: "route"})
    );
    app.use(
      "/input",
      require("./server_src/routes/externalDataCollection", {page: "route"})
    );
    app.use(
      "/client",
      require("./server_src/routes/sorting", {page: "route"})
    );
  } catch (e) {
    await logger.error(e);
  }
};

async function setupTestApp() {
  await setupServerSettings();
  await serverStart();

  return app;
}

function getServer() {
  return listenedServer;
}

module.exports = {
  setupTestApp,
  getServer
};