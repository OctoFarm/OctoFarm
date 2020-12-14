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

const logger = new Logger("OctoFarm-Server");
const printerClean = require("./server_src/lib/dataFunctions/printerClean.js");

const { databaseSetup } = require("./server_src/lib/influxExport.js");

const { PrinterClean } = printerClean;

const pluginManager = require("./server_src/runners/pluginManager.js");

const { updatePluginList } = pluginManager;
const autoDiscovery = require("./server_src/runners/autoDiscovery.js");
// Server Port
const app = express();

let databaseStatus = 0;

// Passport Config
require("./server_src/config/passport.js")(passport);

// DB Config
const db = require("./config/db.js").MongoURI;
console.log(db);
// JSON
app.use(express.json());

// EJS
app.use(expressLayouts);
app.set("view engine", "ejs");

// Bodyparser
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

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
  const { ServerSettings } = serverSettings;
  await logger.info("Checking Server Settings...");
  const ss = await ServerSettings.init();
  // Setup Settings
  await logger.info(ss);
};

const serverStart = async () => {
  try {
    await logger.info("MongoDB Connected...");
    await logger.info("Grabbing plugin list from OctoPrint.org");
    let pluginList = await updatePluginList();
    await logger.info(pluginList);
    // Initialise farm information
    const farmInformation = await PrinterClean.initFarmInformation();
    await logger.info(farmInformation);
    // Find server Settings
    const settings = await ServerSettingsDB.find({});
    const clientSettings = require("./server_src/settings/clientSettings.js");
    const { ClientSettings } = clientSettings;
    await logger.info("Checking Client Settings...");
    const cs = await ClientSettings.init();
    await logger.info(cs);
    const runner = require("./server_src/runners/state.js");
    const { Runner } = runner;
    const rn = await Runner.init();

    await logger.info("Printer Runner has been initialised...", rn);
    const PORT = process.env.PORT || settings[0].server.port;
    await logger.info("Starting System Information Runner...");
    const system = require("./server_src/runners/systemInfo.js");
    const { SystemRunner } = system;
    const sr = await SystemRunner.init();
    await logger.info(sr);

    await databaseSetup();

    app.listen(PORT, () => {
      logger.info(`HTTP server started...`);
      logger.info(`You can now access your server on port: ${PORT}`);
      // eslint-disable-next-line no-console
      console.log(`You can now access your server on port: ${PORT}`);
    });
  } catch (err) {
    await logger.error(err);
  }

  // Routes
  app.use(express.static(`${__dirname}/views`));
  app.use(`/images`, express.static(`${__dirname}/images`));
  if (db === "") {
    app.use("/", require("./server_src/routes/index", { page: "route" }));
  } else {
    try {
      app.use("/", require("./server_src/routes/index", { page: "route" }));
      app.use(
        "/serverChecks",
        require("./server_src/routes/serverChecks", { page: "route" })
      );
      app.use(
        "/users",
        require("./server_src/routes/users", { page: "route" })
      );
      app.use(
        "/printers",
        require("./server_src/routes/printers", { page: "route" })
      );
      app.use(
        "/settings",
        require("./server_src/routes/settings", { page: "route" })
      );
      app.use(
        "/printersInfo",
        require("./server_src/routes/SSE-printersInfo", { page: "route" })
      );
      app.use(
        "/dashboardInfo",
        require("./server_src/routes/SSE-dashboard", { page: "route" })
      );
      app.use(
        "/monitoringInfo",
        require("./server_src/routes/SSE-monitoring", { page: "route" })
      );
      app.use(
        "/filament",
        require("./server_src/routes/filament", { page: "route" })
      );
      app.use(
        "/history",
        require("./server_src/routes/history", { page: "route" })
      );
      app.use(
        "/scripts",
        require("./server_src/routes/scripts", { page: "route" })
      );
      app.use(
        "/input",
        require("./server_src/routes/externalDataCollection", { page: "route" })
      );
      app.use(
        "/client",
        require("./server_src/routes/sorting", { page: "route" })
      );
    } catch (e) {
      await logger.error(e);
      // eslint-disable-next-line no-console
      console.log(e);
    }
  }
};
// Mongo Connect
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log(mongoose.connection.readyState);
    //Check database actually works...
    if (!mongoose.connection.readyState === 1) {
      databaseIssue();
      let err = "No db connection...";
      throw err;
    }
  })
  .then(() => setupServerSettings())
  .then(() => serverStart())
  .catch((err) => {
    databaseIssue();
    logger.error(err);
  });

const databaseIssue = async () => {
  app.listen(4000, () => {
    logger.info(`HTTP server started...`);
    logger.info(`You can now access your server on port: ${4000}`);
    // eslint-disable-next-line no-console
    console.log(`You can now access your server on port: ${4000}`);
  });
  app.use(express.static(`${__dirname}/views`));
  app.use("/", require("./server_src/routes/databaseIssue", { page: "route" }));
};
