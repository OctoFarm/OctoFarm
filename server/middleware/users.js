const { SettingsClean } = require("../services/settings-cleaner.service.js");
const { fetchFirstAdministrator } = require("../api/users.api.js");

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

    res.locals.currentUser = {
      name: req.user?.name,
      username: req.user?.username,
      group: req.user?.group,
      clientSettings: req.user?.clientSettings
    };

    next();
  }
};
