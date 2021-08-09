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

      const autoDiscoveryService = container.resolve(DITokens.autoDiscoveryService);
      return autoDiscoveryService.searchForDevicesOnNetwork();
    })
    .catch(async (err) => {
      logger.error(err.stack);
      const { serveDatabaseIssueFallback } = require("./server_src/app-fallbacks");
      serveDatabaseIssueFallback(octoFarmServer, fetchOctoFarmPort());
    });
}
