const { SettingsClean } = require("../services/settings-cleaner.service.js");

module.exports = {
  async ensureServerSettings(_req, res, next) {
    res.locals.serverSettings = SettingsClean.returnSystemSettings();

    next();
  }
};
