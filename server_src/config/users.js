const { SettingsClean } = require("../lib/dataFunctions/settingsClean.js");

module.exports = {
  async ensureCurrentUserAndGroup(req, res, next) {
    const serverSettings = SettingsClean.returnSystemSettings();
    const clientSettings = SettingsClean.returnClientSettings();

    // If login is not required, set default user and admin otherwise pass current user/group.
    if (!serverSettings?.server?.loginRequired) {
      req.user = {
        userID: "BLANK",
        name: "",
        group: "Administrator",
        clientSettings: clientSettings
      };
    } else {
      if (req?.user) {
        req.user.clientSettings = clientSettings;
      }
    }

    next();
  }
};
