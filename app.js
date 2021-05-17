const {
  serveDatabaseIssueFallback,
  serveNodeVersionFallback,
  setupFallbackExpressServer
} = require("./app-fallbacks");

let majorVersion = null;
try {
  majorVersion = parseInt(process.version.replace("v", "").split(".")[0]);
} catch (e) {
  // We dont abort on parsing failures
}

if (!!majorVersion && majorVersion < 14) {
  const octoFarmServer = setupFallbackExpressServer();
  return serveNodeVersionFallback(octoFarmServer);
}

const {
  setupExpressServer,
  serveOctoFarmNormally,
  ensureSystemSettingsInitiated,
} = require("./app-core");
const {
  setupEnvConfig,
  fetchMongoDBConnectionString,
  fetchOctoFarmPort,
} = require("./app-env");

const Logger = require("./server_src/lib/logger.js");
const mongoose = require("mongoose");
const logger = new Logger("OctoFarm-Server");

function bootAutoDiscovery() {
  require("./server_src/runners/autoDiscovery.js");
}

setupEnvConfig();
const octoFarmServer = setupExpressServer();

mongoose
  .connect(fetchMongoDBConnectionString(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
    serverSelectionTimeoutMS: 2500
  })
  .then(() => ensureSystemSettingsInitiated())
  .then(() => serveOctoFarmNormally(octoFarmServer, fetchOctoFarmPort()))
  .catch(async (err) => {
    logger.error(err);
    serveDatabaseIssueFallback(octoFarmServer, fetchOctoFarmPort());
  });

bootAutoDiscovery();
