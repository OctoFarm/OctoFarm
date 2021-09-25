const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const flash = require("connect-flash");
const { AppConstants } = require("./app.constants");
const dotenv = require("dotenv");
const path = require("path");

const Logger = require("./handlers/logger.js");
const exceptionHandler = require("./exceptions/exception.handler");
const { loadControllers } = require("awilix-express");
const logger = new Logger("OctoFarm-Fallback-Server");
const routePath = "./routes";
const fallbacksRoutePath = `${routePath}/fallbacks`;
const opts = { cwd: __dirname };

function setupFallbackExpressServer() {
  let app = express();

  app.use(express.json());
  logger.debug("Running in directory:", __dirname);
  const viewsPath = path.join(__dirname, "./views");
  app.set("views", viewsPath);
  app.set("view engine", "ejs");
  app.use(expressLayouts);
  app.use(express.static(viewsPath));
  app.use("/images", express.static("./images"));
  app.use(express.urlencoded({ extended: false }));
  app.use(
    session({
      secret: "supersecret",
      resave: true,
      saveUninitialized: true
    })
  );
  app.use(flash());
  app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.error = req.flash("error");
    next();
  });

  return app;
}

function fetchOctoFarmPort() {
  dotenv.config({ path: path.join(__dirname, ".env") });

  let port = process.env[AppConstants.OCTOFARM_PORT_KEY];
  if (Number.isNaN(parseInt(port))) {
    logger.warning(
      `~ The ${AppConstants.OCTOFARM_PORT_KEY} setting was not a correct port number: >= 0 and < 65536. Actual value: ${port}.`
    );

    // Update config immediately
    process.env[AppConstants.OCTOFARM_PORT_KEY] = AppConstants.defaultOctoFarmPort.toString();
    port = process.env[AppConstants.OCTOFARM_PORT_KEY];
  }
  return port;
}

function serverInitialSetupFallbackRoutes(app) {
  app.use(loadControllers(`${fallbacksRoutePath}/fallback-initial-setup.controller.js`, opts));
  app.use(loadControllers(`${routePath}/amialive.controller.js`, opts));
  app.get("*", function (req, res) {
    res.redirect("/");
  });
  app.use(exceptionHandler);
}

function serverInitialSetupFallback(app, port) {
  if (!port || Number.isNaN(parseInt(port))) {
    throw new Error("The server database-issue mode requires a numeric port input argument");
  }
  let listenerHttpServer = app.listen(port, "0.0.0.0", () => {
    const msg = `Please open our webpage at http://127.0.0.1:${port} and continue the server setup!`;
    logger.info(msg);
  });

  serverInitialSetupFallbackRoutes(app);

  return listenerHttpServer;
}

function serveNodeVersionFallback(app) {
  const port = fetchOctoFarmPort();
  let listenerHttpServer = app.listen(port, "0.0.0.0", () => {
    const msg = `You have an old Node version: ${process.version}. This needs to be version 14.x or higher... open our webpage at http://127.0.0.1:${port} for tips`;
    logger.info(msg);
  });

  // This controller has its own /amialive so dont load that
  app.use(loadControllers(`${fallbacksRoutePath}/fallback-node-version-issue.controller.js`, opts));
  app.get("*", function (req, res) {
    res.redirect("/");
  });
  app.use(exceptionHandler);

  return listenerHttpServer;
}

function serveDatabaseIssueFallbackRoutes(app) {
  app.use(loadControllers(`${fallbacksRoutePath}/fallback-database-issue.controller.js`, opts));
  app.use(loadControllers(`${fallbacksRoutePath}/amialive.controller.js`, opts));
  app.get("*", function (req, res) {
    res.redirect("/");
  });
  app.use(exceptionHandler);
}

function serveDatabaseIssueFallback(app, port) {
  if (!port || Number.isNaN(parseInt(port))) {
    throw new Error("The server database-issue mode requires a numeric port input argument");
  }
  let listenerHttpServer = app.listen(port, "0.0.0.0", () => {
    const msg = `You have database connection issues... open our webpage at http://127.0.0.1:${port}`;
    logger.info(msg);
  });

  serveDatabaseIssueFallbackRoutes(app);

  return listenerHttpServer;
}

module.exports = {
  serveDatabaseIssueFallback,
  serveNodeVersionFallback,
  setupFallbackExpressServer,
  serveDatabaseIssueFallbackRoutes,
  serverInitialSetupFallback
};
