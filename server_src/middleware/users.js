module.exports = {
  ensureCurrentUserAndGroup: function (req, res, next) {
    // Make sure cache is initiated... don't fill in user if so.
    switch(!req?.serverSettingsCache.server.loginRequired) {
      case undefined:
        // Server settings doesn't seem to be initialised skip
        break;
      case false:
        // code block
        req.user = {
          name: "No User",
          group: "Administrator"
        };
        break;
      default:
        break;
        // code block
    }
    next();
  }
};
