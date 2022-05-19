const { SettingsClean } = require("../services/settings-cleaner.service.js");

module.exports = {
  async ensureAuthenticated(req, res, next) {
    const serverSettings = SettingsClean.returnSystemSettings();

    if (serverSettings.server.loginRequired === false) {
      return next();
    }
    if (req.isAuthenticated()) {
      return next();
    }

    req.flash("error_msg", "Please log in to view this resource");
    res.redirect("/users/login");
  },
  async ensureAdministrator(req, res, next) {
    const serverSettings = SettingsClean.returnSystemSettings();

    if (serverSettings.server.loginRequired === false) {
      return next();
    }

    const currentUserGroup = req?.user?.group === "Administrator";

    if (currentUserGroup) {
      return next();
    } else {
      res.sendStatus(401);
    }
  }
};
