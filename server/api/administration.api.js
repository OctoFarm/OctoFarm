const path = require("path");
const { SettingsClean } = require("../services/settings-cleaner.service");
const { AppConstants } = require("../constants/app.constants");
const envUtils = require("../utils/env.utils");
const dotEnvPath = path.join(__dirname, "../../.env");
const { isEqual } = require("lodash");

const patchServerSettings = async ({
  mongoURI,
  serverPort,
  logLevel,
  loginRequired,
  registration
}) => {
  const errors = [];
  let restartRequired = false;

  try {
    await SettingsClean.saveServerSettings({ loginRequired, registration });
    restartRequired = isEqual(JSON.parse(JSON.stringify(SettingsClean.returnServerSettings())), {
      loginRequired,
      registration
    });
  } catch (e) {
    errors.push(e.toString());
  }

  try {
    envUtils.writeVariableToEnvFile(path.resolve(dotEnvPath), AppConstants.MONGO_KEY, mongoURI);
    restartRequired = process.env[AppConstants.MONGO_KEY] !== mongoURI;
  } catch (e) {
    errors.push(e.toString());
  }

  try {
    envUtils.writeVariableToEnvFile(
      path.resolve(dotEnvPath),
      AppConstants.OCTOFARM_PORT_KEY,
      serverPort
    );
    restartRequired = process.env[AppConstants.OCTOFARM_PORT_KEY] !== serverPort;
  } catch (e) {
    errors.push(e.toString());
  }

  try {
    envUtils.writeVariableToEnvFile(path.resolve(dotEnvPath), AppConstants.LOG_LEVEL, logLevel);
    restartRequired = process.env[AppConstants.LOG_LEVEL] !== logLevel;
  } catch (e) {
    errors.push(e.toString());
  }

  return {
    errors,
    newSystemSettings: { mongoURI, serverPort, logLevel, loginRequired, registration },
    restartRequired
  };
};

const patchThemeSettings = async ({
  mode,
  navbarColourDark,
  navbarColourLight,
  octofarmHighlightColour,
  octofarmMainColour,
  sidebarColourDark,
  sidebarColourLight,
  applicationTitle
}) => {
  const errors = [];
  let restartRequired = false;

  try {
    await SettingsClean.saveClientThemeSettings({
      mode,
      navbarColourDark,
      navbarColourLight,
      octofarmHighlightColour,
      octofarmMainColour,
      sidebarColourDark,
      sidebarColourLight
    });
  } catch (e) {
    errors.push(e.toString());
  }

  try {
    envUtils.writeVariableToEnvFile(
      path.resolve(dotEnvPath),
      AppConstants.OCTOFARM_SITE_TITLE_KEY,
      applicationTitle
    );

    restartRequired = process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY] !== applicationTitle;
  } catch (e) {
    errors.push(e.toString());
  }

  return {
    errors,
    newThemeSettings: {
      mode,
      navbarColourDark,
      navbarColourLight,
      octofarmHighlightColour,
      octofarmMainColour,
      sidebarColourDark,
      sidebarColourLight,
      applicationTitle
    },
    restartRequired
  };
};

module.exports = {
  patchServerSettings,
  patchThemeSettings
};
