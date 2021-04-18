const {
  setupExpressServer,
  serveOctoFarmNormally,
  ensureSystemSettingsInitiated,
} = require("./app-core");
const { setupEnvConfig } = require("./app-env");
const getEndpoints = require('express-list-endpoints');

let httpListener;

async function setupTestApp() {
  setupEnvConfig(true);
  const octoFarmTestServer = setupExpressServer();
  await ensureSystemSettingsInitiated()
    .catch();

  // Save listener as state for tests
  httpListener = await serveOctoFarmNormally(octoFarmTestServer);

  const stringRouteMap = JSON.stringify(getEndpoints(octoFarmTestServer).map(r => r.path));
  console.log("Server routes:" , stringRouteMap);
  return octoFarmTestServer;
}

function getServer() {
  return httpListener;
}

module.exports = {
  setupTestApp,
  getServer,
};
