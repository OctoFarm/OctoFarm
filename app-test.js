const {
  setupExpressServer,
  serveOctoFarmNormally,
  serveDatabaseIssueFallback,
  ensureSystemSettingsInitiated,
} = require("./app-core");
const { setupEnvConfig, fetchOctoFarmPort } = require("./app-env");
const getEndpoints = require('express-list-endpoints');

let httpListener;

async function setupTestApp() {
  setupEnvConfig(true);
  const octoFarmTestServer = setupExpressServer();
  await ensureSystemSettingsInitiated()
    .catch();

  // Save listener as state for tests
  httpListener = await serveOctoFarmNormally(octoFarmTestServer, fetchOctoFarmPort());

  return octoFarmTestServer;
}

async function setupDatabaseIssueApp() {
  setupEnvConfig(true);

  const octoFarmTestServer = setupExpressServer();
  httpListener = await serveDatabaseIssueFallback(octoFarmTestServer, fetchOctoFarmPort());

  return octoFarmTestServer;
}

function getServer() {
  return httpListener;
}

module.exports = {
  setupTestApp,
  setupDatabaseIssueApp,
  getServer,
};
