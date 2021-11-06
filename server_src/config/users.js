const { SettingsClean } = require("../lib/dataFunctions/settingsClean.js");

module.exports = {
  async ensureCurrentUserAndGroup(req, res, next) {
    const serverSettings = SettingsClean.returnSystemSettings();

    let clientID = req?.user?._id || null;

    const clientSettings = SettingsClean.returnClientSettings(clientID);
    // If login is not required, set default user and admin otherwise pass current user/group.
    if (!serverSettings?.server?.loginRequired) {
      req.user = {
        _id: null,
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
