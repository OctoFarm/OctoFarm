let majorVersion = null;
try {
  majorVersion = parseInt(process.version.replace("v", "").split(".")[0]);
} catch (e) {
  // We dont abort on parsing failures
}

if (!!majorVersion && majorVersion < 14) {
  // Dont require this in the normal flow (or NODE_ENV can not be fixed before start)
  const {
    serveNodeVersionFallback,
    setupFallbackExpressServer
  } = require("./server_src/app-fallbacks");

  const octoFarmServer = setupFallbackExpressServer();
  serveNodeVersionFallback(octoFarmServer);
} else {
  const {
    setupEnvConfig,
    fetchMongoDBConnectionString,
    fetchOctoFarmPort,
    runMigrations
  } = require("./server_src/app-env");

  function bootAutoDiscovery() {
    require("./server_src/runners/autoDiscovery.js");
  }

  // Set environment/.env file and NODE_ENV if not set. Will call startup checks.
  setupEnvConfig();

  const {
    setupExpressServer,
    serveOctoFarmNormally,
    ensureSystemSettingsInitiated
  } = require("./server_src/app-core");

  const mongoose = require("mongoose");
  const Logger = require("./server_src/handlers/logger.js");
  const logger = new Logger("OctoFarm-Server");

  const octoFarmServer = setupExpressServer();

  mongoose
    .connect(fetchMongoDBConnectionString(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 2500
    })
    .then(async (mg) => {
      await runMigrations(mg.connection.db, mg.connection.getClient());
    })
    .then(() => ensureSystemSettingsInitiated())
    .then(async () => {
      const port = fetchOctoFarmPort();
      if (!port || Number.isNaN(parseInt(port))) {
        throw new Error("The server database-issue mode requires a numeric port input argument");
      }

      const app = await serveOctoFarmNormally(octoFarmServer);

      const { onShutdown } = require("./server_src/services/shutdown-service");

      const applicationServer = app.listen(port, "0.0.0.0", () => {
        logger.info(`Server started... open it at http://127.0.0.1:${port}`);
        // PM2 to signify process is ready... should wait for database connection...
        if (typeof process.send === "function") {
          process.send("ready");
        }
      });

      process.on("beforeExit", (code) => {
        logger.debug("beforeExit: Requesting shutdown of Application with code: ", code);
        onShutdown(applicationServer);
      });

      process.on("exit", (code) => {
        logger.debug("beforeExit: Requesting shutdown of Application with code: ", code);
        onShutdown(applicationServer);
      });

      process.on("SIGINT", function () {
        logger.debug("SIGINT: Requesting shutdown of Application");
        onShutdown(applicationServer);
      });

      process.on("SIGTERM", function () {
        logger.debug("SIGTERM: Requesting shutdown of Application");
        onShutdown(applicationServer);
      });

      //PM2 Specific
      process.on("message", function (msg) {
        if (msg === "shutdown") {
          logger.debug("SIGTERM: Requesting shutdown of Application");
          onShutdown(applicationServer);
        }
      });

      logger.debug("Listeners for shutdown added!");
    })
    .catch(async (err) => {
      const { SERVER_ISSUES } = require("server_src/constants/server-issues.constants");
      logger.error(err.stack);
      if (
        err.includes(SERVER_ISSUES.DATABASE_AUTH_FAIL) ||
        err.includes(SERVER_ISSUES.DATABASE_CONN_FAIL) ||
        err.includes(SERVER_ISSUES.SERVER_SETTINGS_FAIL_INIT) ||
        err.includes(SERVER_ISSUES.SERVER_SETTINGS_FAIL_UPDATE) ||
        err.includes(SERVER_ISSUES.CLIENT_SETTINGS_FAIL_INIT) ||
        err.includes(SERVER_ISSUES.CLIENT_SETTINGS_FAIL_UPDATE)
      ) {
        const { serveDatabaseIssueFallback } = require("./server_src/app-fallbacks");
        serveDatabaseIssueFallback(octoFarmServer, fetchOctoFarmPort());
        // PM2 to signify process is ready...
        if (typeof process.send === "function") {
          process.send("ready");
        }
      } else {
        console.error("THIS IS MAJOR BROKEY");
      }
    });

  bootAutoDiscovery();
}
