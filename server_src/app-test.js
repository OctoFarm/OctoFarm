const DITokens = require("./container.tokens");
const { setupExpressServer, serveOctoFarmRoutes } = require("./app-core");
const { setupEnvConfig } = require("./app-env");
const { ensureSystemSettingsInitiated } = require("./app-core");

/**
 * Setup the application without hassle
 * @returns {app}
 */
async function setupTestApp() {
  setupEnvConfig(true);
  await ensureSystemSettingsInitiated();

  const newServer = setupExpressServer();
  serveOctoFarmRoutes(newServer);
  return newServer;
}

module.exports = {
  setupTestApp
};
