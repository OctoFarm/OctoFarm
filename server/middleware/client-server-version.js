const { AppConstants } = require("../constants/app.constants");
const { fetchClientVersion } = require("../app-env");

module.exports = {
  ensureClientServerVersion(_req, res, next) {
    res.locals.serverVersion = process.env[AppConstants.VERSION_KEY];
    res.locals.clientVersion = fetchClientVersion();
    next();
  }
};
