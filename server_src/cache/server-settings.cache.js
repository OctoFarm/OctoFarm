const {
  ServerSettingsService
} = require("../services/database/server-settings.service.js");

let serverSettingsCache;

function getServerSettingsCache() {
  return serverSettingsCache;
}

async function initializeServerSettingsCache() {
  serverSettingsCache = new ServerSettingsService();
  serverSettingsCache.init();
  return "Server settings cache initiated..."
}

module.exports = { initializeServerSettingsCache, getServerSettingsCache };
