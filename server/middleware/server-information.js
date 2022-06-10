const { AppConstants } = require("../constants/app.constants");
const { fetchClientVersion } = require("../app-env");
const { SettingsClean } = require("../services/settings-cleaner.service.js");

module.exports = {
  ensureClientServerInformation(_req, res, next) {
    res.locals.octoFarmPageTitle = process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY];
    res.locals.serverVersion = process.env[AppConstants.VERSION_KEY];
    res.locals.clientVersion = fetchClientVersion();
    res.locals.serverSettings = SettingsClean.returnSystemSettings();
    next();
  }
};
