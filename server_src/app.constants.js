const MONGO_KEY = "MONGO";
const OCTOFARM_PORT_KEY = "OCTOFARM_PORT";
const NON_NPM_MODE_KEY = "NON_NPM_MODE";
const OCTOFARM_SITE_TITLE_KEY = "OCTOFARM_SITE_TITLE";
const NODE_ENV_KEY = "NODE_ENV";
const RELEASE_BRANCH_KEY = "RELEASE_BRANCH";
const ENABLE_DASHBOARD_KEY = "ENABLE_DASHBOARD";
const ENABLE_OP_FILE_MANAGER_KEY = "ENABLE_OP_FILE_MANAGER";
const ENABLE_LOCAL_FILE_MANAGER_KEY = "ENABLE_LOCAL_FILE_MANAGER";
const ENABLE_HISTORY_KEY = "ENABLE_HISTORY";
const ENABLE_FILAMANT_MANAGER_KEY = "ENABLE_FILAMENT_MANAGER";

const VERSION_KEY = "npm_package_version";

const defaultMongoStringUnauthenticated = "mongodb://127.0.0.1:27017/octofarm";
const defaultOctoFarmPort = 4000;
const defaultOctoFarmPageTitle = "OctoFarm";
const defaultProductionEnv = "production";
const defaultTestEnv = "test";
const defaultReleaseBranch = "master";
const knownReleaseBranches = ["master", "development", "canary"];
const defaultDashboardEnabled = true;
const defaultOPFileManagerEnabled = true;
const defaultLocalFileManagerEnabled = true;
const defaultHistoryEnabled = true;
const defaultFilamentManager = true;
const knownEnvNames = ["development", "production", "test"];

// Make sure the client is up to date with this
const jsonStringify = false;

const apiRoute = "/api";

class AppConstants {
  static get jsonStringify() {
    return jsonStringify;
  }

  static get apiRoute() {
    return apiRoute;
  }

  static get defaultMongoStringUnauthenticated() {
    return defaultMongoStringUnauthenticated;
  }

  static get defaultOctoFarmPort() {
    return defaultOctoFarmPort;
  }

  static get defaultOctoFarmPageTitle() {
    return defaultOctoFarmPageTitle;
  }

  static get knownEnvNames() {
    return knownEnvNames;
  }

  static get defaultProductionEnv() {
    return defaultProductionEnv;
  }

  static get defaultReleaseBranch() {
    return defaultReleaseBranch;
  }

  static get knownReleaseBranches() {
    return knownReleaseBranches;
  }

  static get defaultDashboardEnabled() {
    return defaultDashboardEnabled;
  }

  static get defaultOPFileManagerEnabled() {
    return defaultOPFileManagerEnabled;
  }

  static get defaultLocalFileManagerEnabled() {
    return defaultLocalFileManagerEnabled;
  }

  static get defaultHistoryEnabled() {
    return defaultHistoryEnabled;
  }

  static get defaultFilamentManager() {
    return defaultFilamentManager;
  }

  static get defaultTestEnv() {
    return defaultTestEnv;
  }

  static get VERSION_KEY() {
    return VERSION_KEY;
  }

  static get NODE_ENV_KEY() {
    return NODE_ENV_KEY;
  }

  static get MONGO_KEY() {
    return MONGO_KEY;
  }

  static get OCTOFARM_PORT_KEY() {
    return OCTOFARM_PORT_KEY;
  }

  static get NON_NPM_MODE_KEY() {
    return NON_NPM_MODE_KEY;
  }

  static get OCTOFARM_SITE_TITLE_KEY() {
    return OCTOFARM_SITE_TITLE_KEY;
  }

  static get RELEASE_BRANCH_KEY() {
    return RELEASE_BRANCH_KEY;
  }

  static get ENABLE_DASHBOARD_KEY() {
    return ENABLE_DASHBOARD_KEY;
  }

  static get ENABLE_OP_FILE_MANAGER_KEY() {
    return ENABLE_OP_FILE_MANAGER_KEY;
  }

  static get ENABLE_LOCAL_FILE_MANAGER_KEY() {
    return ENABLE_LOCAL_FILE_MANAGER_KEY;
  }

  static get ENABLE_HISTORY_KEY() {
    return ENABLE_HISTORY_KEY;
  }

  static get ENABLE_FILAMENT_MANAGER_KEY() {
    return ENABLE_FILAMANT_MANAGER_KEY;
  }
}

module.exports = {
  AppConstants
};
