const { SettingsClean } = require("../services/settings-cleaner.service.js");
const { fetchFirstAdministrator } = require("../services/users.service");
const {AppConstants} = require("../constants/app.constants");

module.exports = {
  async ensureCurrentUserAndGroup(req, res, next) {
    const serverSettings = SettingsClean.returnSystemSettings();

    let clientSettingsID = req?.user?.clientSettings?._id || null;
    const clientSettings = SettingsClean.returnClientSettings(clientSettingsID);

    // If login is not required, set default user and admin otherwise pass current user/group.
    if (!serverSettings?.server?.loginRequired) {
      const firstAdministrator = await fetchFirstAdministrator();
      req.user = {
        _id: firstAdministrator._id,
        name: firstAdministrator.name,
        username: firstAdministrator.username,
        group: "Administrator",
        clientSettings: clientSettings
      };
    } else {
      if (req?.user) {
        req.user.clientSettings = clientSettings;
      }
    }
    res.locals.currentUser = req.user.name;
    res.locals.currentPermissionGroup = req.user.group;
    next();
  }
};
