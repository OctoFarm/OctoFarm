const express = require("express");
const flash = require("connect-flash");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const expressLayouts = require("express-ejs-layouts");
const Logger = require("./handlers/logger.js");
const DITokens = require("./container.tokens");
const exceptionHandler = require("./exceptions/exception.handler");
const { configureContainer } = require("./container");
const { scopePerRequest, loadControllers } = require("awilix-express");
const { OctoFarmTasks } = require("./tasks");
const { getViewsPath } = require("./app-env");

function setupExpressServer() {
  let app = express();
  let container = configureContainer();

  const userTokenService = container.resolve("userTokenService");
  require("./middleware/passport.js")(passport, userTokenService);

  app.use(express.json());

  const viewsPath = getViewsPath();

  if (process.env.NODE_ENV === "production") {
    const { getOctoFarmUiPath } = require("@octofarm/client");
    const bundlePath = getOctoFarmUiPath();
    app.use("/assets/dist", express.static(bundlePath));
  }

  app.set("views", viewsPath);
  app.set("view engine", "ejs");
  app.use(expressLayouts);
  app.use(express.static(viewsPath));

  app.use("/images", express.static("./images"));
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: false }));
  app.use(
    session({
      secret: "supersecret",
      resave: true,
      saveUninitialized: true
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(passport.authenticate("remember-me")); // Remember Me!
  app.use(flash());
  app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.error = req.flash("error");
    next();
  });

  app.use(scopePerRequest(container));

  return {
    app,
    container
  };
}

async function ensureSystemSettingsInitiated(container) {
  logger.info("Loading Server Settings.");

  const serverSettingsService = container.resolve(DITokens.serverSettingsService);
  await serverSettingsService.probeDatabase();

  const settingsStore = container.resolve(DITokens.settingsStore);
  return await settingsStore.loadSettings();
}

function serveOctoFarmRoutes(app) {
  const routePath = "./routes";

  app.use(loadControllers(`${routePath}/settings/*.controller.js`, { cwd: __dirname }));
  app.use(loadControllers(`${routePath}/*.controller.js`, { cwd: __dirname }));
  app.use(exceptionHandler);

  app.get("*", function (req, res) {
    const path = req.originalUrl;
    if (path.startsWith("/api") || path.startsWith("/plugins")) {
      logger.error("API resource was not found " + path);
      res.status(404);
      res.send({ error: "API endpoint or method was not found" });
      return;
    } else if (req.originalUrl.endsWith(".min.js")) {
      logger.error("Javascript resource was not found " + path);
      res.status(404);
      res.send("Resource not found " + path);
      return;
    }

    logger.error("MVC resource was not found " + path);
    res.redirect("/");
  });
  app.use(exceptionHandler);
}

async function serveOctoFarmNormally(app, container, quick_boot = false) {
  if (!quick_boot) {
    logger.info("Initialising FarmInformation...");

    const printersStore = container.resolve(DITokens.printersStore);
    await printersStore.loadPrintersStore();
    const filesStore = container.resolve(DITokens.filesStore);
    await filesStore.loadFilesStore();
    const currOpsCache = container.resolve(DITokens.currentOperationsCache);
    currOpsCache.generateCurrentOperations();
    const historyCache = container.resolve(DITokens.historyCache);
    await historyCache.initCache();
    const filamentCache = container.resolve(DITokens.filamentCache);
    await filamentCache.initCache();

    // Just validation, job cache is not seeded by database
    container.resolve(DITokens.jobsCache);
    const heatMapCache = container.resolve(DITokens.heatMapCache);
    await heatMapCache.initHeatMap();

    // const api = container.resolve(DITokens.octoPrintApiClientService);
    // await api
    //   .downloadFile(
    //     {
    //       printerURL: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/",
    //       apiKey: "asd"
    //     },
    //     "BigBuckBunny.mp4",
    //     (resolve, reject) => {
    //       console.log("stream finished");
    //       resolve();
    //     }
    //   )
    //   .then((r) => console.log(r));

    const taskManagerService = container.resolve(DITokens.taskManagerService);
    if (process.env.SAFEMODE_ENABLED !== "true") {
      OctoFarmTasks.BOOT_TASKS.forEach((task) => taskManagerService.registerJobOrTask(task));
    } else {
      logger.warning("Starting in safe mode due to SAFEMODE_ENABLED");
    }

    const influxSetupService = container.resolve(DITokens.influxDbSetupService);
    await influxSetupService.optionalInfluxDatabaseSetup();
  }

  serveOctoFarmRoutes(app);

  return app;
}

const logger = new Logger("OctoFarm-Server");

module.exports = {
  setupExpressServer,
  ensureSystemSettingsInitiated,
  serveOctoFarmRoutes,
  serveOctoFarmNormally
};
