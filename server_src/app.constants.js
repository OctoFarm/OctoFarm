const MONGO_KEY = "MONGO";
const OCTOFARM_PORT_KEY = "OCTOFARM_PORT";
const NON_NPM_MODE_KEY = "NON_NPM_MODE";
const defaultMongoStringUnauthenticated = "mongodb://127.0.0.1:27017/octofarm";
const defaultOctoFarmPort = 4000;

class AppConstants {
  static get defaultMongoStringUnauthenticated() {
    return defaultMongoStringUnauthenticated;
  }

  static get defaultOctoFarmPort() {
    return defaultOctoFarmPort;
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
}

module.exports = {
  AppConstants,
};
