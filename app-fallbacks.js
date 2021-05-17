const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const flash = require("connect-flash");
const {AppConstants} = require("./server_src/app.constants");
const path = require("path");

const Logger = require("./server_src/lib/logger.js");
const logger = new Logger("OctoFarm-Fallback-Server");

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
        saveUninitialized: true,
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

function serveNodeVersionFallback(app) {
  let listenerHttpServer = app.listen(
      AppConstants.defaultOctoFarmPort,
      "0.0.0.0",
      () => {
        const msg = `You have an old Node version: ${process.version}. This needs to be version 14.x or higher... open our webpage at http://127.0.0.1:${AppConstants.defaultOctoFarmPort} for tips`;
        logger.info(msg);
      }
  );

  app.use("/", require("./server_src/routes/nodeVersionIssue", { page: "route" }));
  app.get("*", function (req, res) {
    res.redirect("/");
  });

  return listenerHttpServer;
}

function serveDatabaseIssueFallback(app, port) {
  if (!port || Number.isNaN(parseInt(port))) {
    throw new Error("The server database-issue mode requires a numeric port input argument");
  }
  let listenerHttpServer = app.listen(
      port,
      "0.0.0.0",
      () => {
        const msg = `You have database connection issues... open our webpage at http://127.0.0.1:${port}`;
        logger.info(msg);
      }
  );

  app.use("/", require("./server_src/routes/databaseIssue", { page: "route" }));
  app.use(
      "/serverChecks",
      require("./server_src/routes/serverChecks", { page: "route" })
  );
  app.get("*", function (req, res) {
    res.redirect("/");
  });

  return listenerHttpServer;
}

module.exports = {
  serveDatabaseIssueFallback,
  serveNodeVersionFallback,
  setupFallbackExpressServer
}
