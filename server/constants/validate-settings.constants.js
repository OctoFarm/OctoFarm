module.exports = {
  DATABASE_NAME: {
    databaseName: ["required", "string", "database_name"]
  },
  SYSTEM_SETTINGS: {
    mongoURI: ["required", "string", "validate_mongo_url"],
    serverPort: ["required", "integer", "min:1", "max:65535"],
    logLevel: ["required", "string", "valid_log_level"],
    loginRequired: ["required", "boolean"],
    registration: ["required", "boolean"]
  },
  THEME_SETTINGS: {
    mode: ["required", "string", "dark_or_light"],
    navbarColourDark: ["required", "string", "hexColor"],
    navbarColourLight: ["required", "string", "hexColor"],
    octofarmHighlightColour: ["required", "string", "hexColor"],
    octofarmMainColour: ["required", "string", "hexColor"],
    sidebarColourDark: ["required", "string", "hexColor"],
    sidebarColourLight: ["required", "string", "hexColor"],
    applicationTitle: ["required", "string", "maxLength:30"]
  }
};
