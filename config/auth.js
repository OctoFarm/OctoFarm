//Find server Settings
const ServerSettingsDB = require("../models/ServerSettings");

module.exports = {
  ensureAuthenticated: async function(req, res, next) {
    let settings = await ServerSettingsDB.find({});
    if (settings[0].server.loginRequired === false) {
      return next();
    }

    if (req.isAuthenticated()) {
      return next();
    } else {
      req.flash("error_msg", "Please log in to view this resource");
      res.redirect("/users/login");
    }
  }
};
