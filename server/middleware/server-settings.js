const { SettingsClean } = require("../services/settings-cleaner.service.js");

module.exports = {
  async ensureServerSettings(_req, res, next) {
    next();
  }
};
