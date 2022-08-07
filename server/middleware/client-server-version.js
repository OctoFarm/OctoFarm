const { AppConstants } = require("../constants/app.constants");

module.exports = {
  ensureClientServerVersion(_req, res, next) {
    res.locals.serverVersion = process.env[AppConstants.VERSION_KEY];
    res.locals.clientVersion = process.env[AppConstants.VERSION_KEY];
    next();
  }
};
