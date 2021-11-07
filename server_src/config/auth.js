const { SettingsClean } = require("../lib/dataFunctions/settingsClean.js");

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
      console.log("WE HAVE GROUP");
      return next();
    } else {
      res.sendStatus(401);
    }
  }
};
