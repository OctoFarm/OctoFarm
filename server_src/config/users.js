const { SettingsClean } = require("../lib/dataFunctions/settingsClean.js");

module.exports = {
  async ensureCurrentUserAndGroup(req, res, next) {
    const serverSettings = SettingsClean.returnSystemSettings();

    let clientSettingsID = req?.user?.clientSettings?._id || null;
    const clientSettings = SettingsClean.returnClientSettings(clientSettingsID);
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
