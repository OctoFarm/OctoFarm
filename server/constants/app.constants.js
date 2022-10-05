const { randomString } = require("../utils/random.util");

const MONGO_KEY = "MONGO";
const OCTOFARM_PORT_KEY = "OCTOFARM_PORT";
const NON_NPM_MODE_KEY = "NON_NPM_MODE";
const OCTOFARM_SITE_TITLE_KEY = "OCTOFARM_SITE_TITLE";
const LOG_LEVEL = "LOG_LEVEL";
const NODE_ENV_KEY = "NODE_ENV";
const SUPER_SECRET_KEY = "SUPER_SECRET_KEY";
const GITHUB_TOKEN_KEY = "GITHUB_TOKEN";
const AIR_GAPPED_KEY = "AIR_GAPPED";

const VERSION_KEY = "npm_package_version";

const defaultMongoStringUnauthenticated = "mongodb://127.0.0.1:27017/octofarm";
const defaultOctoFarmPort = 4000;
const defaultOctoFarmPageTitle = "OctoFarm";
const defaultProductionEnv = "production";
const defaultTestEnv = "test";
const knownEnvNames = ["development", "production", "test"];
const knownLogLevels = ["info", "debug", "silly"];
const defaultLogLevel = "info";
const currentReleaseBranch = "master";
const releaseBranches = ["master", "development"];
const defaultSuperSecretKey = randomString(20);

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

  static get knownLogLevels() {
    return knownLogLevels;
  }

  static get defaultProductionEnv() {
    return defaultProductionEnv;
  }

  static get defaultTestEnv() {
    return defaultTestEnv;
  }

  static get defaultLogLevel() {
    return defaultLogLevel;
  }

  static get defaultSuperSecretKey() {
    return defaultSuperSecretKey;
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

  static get LOG_LEVEL() {
    return LOG_LEVEL;
  }

  static get SUPER_SECRET_KEY() {
    return SUPER_SECRET_KEY;
  }

  static get GITHUB_TOKEN_KEY() {
    return GITHUB_TOKEN_KEY;
  }

  static get AIR_GAPPED_KEY() {
    return AIR_GAPPED_KEY;
  }
}

module.exports = {
  AppConstants
};
