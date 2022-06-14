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
  }
};
