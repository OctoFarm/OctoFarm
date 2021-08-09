const DITokens = require("../container.tokens");

module.exports = {
  async ensureAuthenticated(req, res, next) {
    const settingsStore = req.container.resolve(DITokens.settingsStore);
    const serverSettings = settingsStore.getServerSettings();

    // If login is not required, short-cut authentication
    if (!serverSettings?.server?.loginRequired) {
      return next();
    }
    if (req.isAuthenticated()) {
      return next();
    }

    req.flash("error_msg", "Please log in to view this resource");
    res.redirect("/users/login");
  }
};
