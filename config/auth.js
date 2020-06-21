//Find server Settings
const ServerSettings = require("../models/ServerSettings.js");

module.exports = {
  ensureAuthenticated: async function(req, res, next) {
    let serverSettings = await ServerSettings.find({});
    if (serverSettings[0].server.loginRequired === false) {
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
