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
    runMigrations,
    fetchOctoFarmPort
  } = require("./server_src/app-env");

  // Set environment/.env file and NODE_ENV if not set. Will call startup checks.
  setupEnvConfig();

  const {
    setupExpressServer,
    serveOctoFarmNormally,
    checkSystemSetupState,
    ensureSystemSettingsInitiated
  } = require("./server_src/app-core");

  const DITokens = require("./server_src/container.tokens");

  const mongoose = require("mongoose");
  const Logger = require("./server_src/handlers/logger.js");
  const logger = new Logger("OctoFarm-Server");

  const { app: octoFarmServer, container } = setupExpressServer();

  mongoose
    .connect(fetchMongoDBConnectionString(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
      serverSelectionTimeoutMS: 2500
    })
    .then(async (mg) => {
      await runMigrations(mg.connection.db, mg.connection.getClient());
    })
    .then(async () => {
      await checkSystemSetupState(container);
    })
    .then(async () => {
      await ensureSystemSettingsInitiated(container);
    })
    .then(async () => {
      const port = fetchOctoFarmPort();

      // Shit hit the fan
      if (!port || Number.isNaN(parseInt(port))) {
        throw new Error("The OctoFarm server requires a numeric port input argument to run");
      }

      const app = await serveOctoFarmNormally(octoFarmServer, container);
      app.listen(port, "0.0.0.0", () => {
        logger.info(`Server started... open it at http://127.0.0.1:${port}`);
      });
    })
    .catch(async (err) => {
      const { SERVER_ISSUES } = require("./server_src/constants/server-message.constants");
      logger.error(err);
      const {
        serverInitialSetupFallback,
        serveDatabaseIssueFallback
      } = require("./server_src/app-fallbacks");
      if (err.includes(SERVER_ISSUES.SYSTEM_NOT_SETUP)) {
        serverInitialSetupFallback(octoFarmServer, fetchOctoFarmPort());
      } else if (
        err.includes(SERVER_ISSUES.DATABASE_AUTH_FAIL || SERVER_ISSUES.DATABASE_CONN_FAIL)
      ) {
        serveDatabaseIssueFallback(octoFarmServer, fetchOctoFarmPort());
      } else {
        console.error("YOU'VE FUCKED SOMETHING");
      }
    });
}
