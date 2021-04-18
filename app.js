const { setupEnvConfig } = require("./app-env");
const Logger = require("./server_src/lib/logger.js");
const mongoose = require("mongoose");
const {
  setupExpressServer,
  serveDatabaseIssueFallback,
  serveOctoFarmNormally,
  ensureSystemSettingsInitiated,
} = require("./app-core");

function bootAutoDiscovery() {
  require("./server_src/runners/autoDiscovery.js");
}

const logger = new Logger("OctoFarm-Server");

setupEnvConfig();
const octoFarmServer = setupExpressServer();

mongoose
  .connect(process.env.MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    serverSelectionTimeoutMS: 2500,
  })
  .then(() => ensureSystemSettingsInitiated())
  .then(() => serveOctoFarmNormally(octoFarmServer))
  .catch(async (err) => {
    logger.error(err);
    serveDatabaseIssueFallback(octoFarmServer);
  });

bootAutoDiscovery();
