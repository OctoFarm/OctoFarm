const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const isDocker = require("is-docker");
const envUtils = require("./utils/env.utils");
const dotenv = require("dotenv");
const { AppConstants } = require("./constants/app.constants");

const Logger = require("./handlers/logger.js");
const { status, up } = require("migrate-mongo");
const { LOGGER_ROUTE_KEYS } = require("./constants/logger.constants");

const logger = new Logger(LOGGER_ROUTE_KEYS.SERVER_ENVIRONMENT, false);

// Constants and definition
const instructionsReferralURL = "https://docs.octofarm.net/installation/setup-environment.html";
const deprecatedConfigFolder = "../config";
const deprecatedConfigFilePath = deprecatedConfigFolder + "db.js";
const packageJsonPath = path.join(__dirname, "package.json");
const packageLockPath = path.join(__dirname, "package-lock.json");
const packageLockFile = require(packageLockPath);
const exec = require("child_process").exec;
let currentClientVersion;
const dotEnvPath = path.join(__dirname, "../.env");

/**
 * Set and write the environment name to file, if applicable
 * @returns {*}
 */
function ensureNodeEnvSet() {
  const environment = process.env[AppConstants.NODE_ENV_KEY];
  if (!environment || !AppConstants.knownEnvNames.includes(environment)) {
    const newEnvName = AppConstants.defaultProductionEnv;
    process.env[AppConstants.NODE_ENV_KEY] = newEnvName;
    logger.warning(
      `NODE_ENV=${environment} was not set, or not known. Defaulting to NODE_ENV=${newEnvName}`
    );

    // Avoid writing to .env in case of docker
    if (isDocker()) return;

    envUtils.writeVariableToEnvFile(
      path.resolve(dotEnvPath),
      AppConstants.NODE_ENV_KEY,
      newEnvName
    );
  } else {
    logger.info(`✓ NODE_ENV variable correctly set (${environment})!`);
  }
}

/**
 * Ensures that `process.env[AppConstants.VERSION_KEY]` is never undefined
 */
function ensureEnvNpmVersionSet() {
  const packageJsonVersion = require(packageJsonPath).version;
  if (!process.env[AppConstants.VERSION_KEY]) {
    process.env[AppConstants.VERSION_KEY] = packageJsonVersion;
    process.env[AppConstants.NON_NPM_MODE_KEY] = "true";
    logger.info(
      `✓ Running OctoFarm version ${process.env[AppConstants.VERSION_KEY]} in non-NPM mode!`
    );
  } else {
    logger.debug(
      `✓ Running OctoFarm version ${process.env[AppConstants.VERSION_KEY]} in NPM mode!`
    );
  }

  if (process.env[AppConstants.VERSION_KEY] !== packageJsonVersion) {
    process.env[AppConstants.VERSION_KEY] = packageJsonVersion;
    logger.warning(
      `~ Had to synchronize OctoFarm version to '${packageJsonVersion}' as it was outdated.`
    );
  }
}

/**
 *
 * @param reason
 */
function removePm2Service(reason) {
  logger.error("Removing PM2 service as OctoFarm failed to start", reason);
  execSync("pm2 delete OctoFarm");
}

/**
 *
 * @param folder
 */
function removeFolderIfEmpty(folder) {
  return fs.rmdir(folder, function (err) {
    if (err) {
      logger.error(`~ Could not clear up the folder ${folder} as it was not empty`);
    } else {
      logger.info(`✓ Successfully removed the empty directory ${folder}`);
    }
  });
}

/**
 *
 */
function setupPackageJsonVersionOrThrow() {
  const result = envUtils.verifyPackageJsonRequirements(path.join(__dirname, "../server"));
  if (!result) {
    if (envUtils.isPm2()) {
      removePm2Service("didnt pass startup validation (package.json)");
    }
    throw new Error("Aborting OctoFarm server.");
  }
}

/**
 * Print out instructions URL
 */
function printInstructionsURL() {
  logger.info(
    `Please make sure to read ${instructionsReferralURL} on how to configure your environment correctly.`
  );
}

/**
 *
 */
function removeDeprecatedMongoURIConfigFile() {
  logger.info("~ Removing deprecated middleware file 'middleware/db.js'.");
  fs.rmSync(deprecatedConfigFilePath);
  removeFolderIfEmpty(deprecatedConfigFolder);
}

/**
 *
 * @param persistToEnv
 * @returns {string}
 */
function fetchMongoDBConnectionString(persistToEnv = false) {
  if (!process.env[AppConstants.MONGO_KEY]) {
    logger.warning(
      `~ ${AppConstants.MONGO_KEY} environment variable is not set. Assuming default: ${AppConstants.MONGO_KEY}=${AppConstants.defaultMongoStringUnauthenticated}`
    );
    printInstructionsURL();
    process.env[AppConstants.MONGO_KEY] = AppConstants.defaultMongoStringUnauthenticated;

    // is not isDocker just to be sure, also checked in writeVariableToEnvFile
    if (persistToEnv && !isDocker()) {
      envUtils.writeVariableToEnvFile(
        path.resolve(dotEnvPath),
        AppConstants.MONGO_KEY,
        AppConstants.defaultMongoStringUnauthenticated
      );
    }
  }
  return process.env[AppConstants.MONGO_KEY];
}

/**
 *
 * @returns {string}
 */
function fetchOctoFarmPort() {
  let port = process.env[AppConstants.OCTOFARM_PORT_KEY];
  if (Number.isNaN(parseInt(port))) {
    logger.warning(
      `~ The ${AppConstants.OCTOFARM_PORT_KEY} setting was not a correct port number: >= 0 and < 65536. Actual value: ${port}.`
    );

    // is not isDocker just to be sure, also checked in writeVariableToEnvFile
    if (!isDocker()) {
      envUtils.writeVariableToEnvFile(
        path.resolve(dotEnvPath),
        AppConstants.OCTOFARM_PORT_KEY,
        AppConstants.defaultOctoFarmPort
      );
      logger.info(
        `~ Written ${AppConstants.OCTOFARM_PORT_KEY}=${AppConstants.defaultOctoFarmPort} setting to .env file.`
      );
    }

    // Update middleware immediately
    process.env[AppConstants.OCTOFARM_PORT_KEY] = AppConstants.defaultOctoFarmPort.toString();
    port = process.env[AppConstants.OCTOFARM_PORT_KEY];
  }
  return port;
}
/**
/**
 * Make sure that we have a valid MongoDB connection string to work with.
 */
function ensureMongoDBConnectionStringSet() {
  let dbConnectionString = process.env[AppConstants.MONGO_KEY];
  if (!dbConnectionString) {
    if (isDocker()) {
      // This will not trigger often, as docker entrypoint catches this.
      fetchMongoDBConnectionString(false);
      return;
    }

    if (!fs.existsSync(deprecatedConfigFilePath)) {
      fetchMongoDBConnectionString(true);
      return;
    }

    const mongoFallbackURI = require(deprecatedConfigFilePath).MongoURI;
    if (!mongoFallbackURI) {
      logger.info(
        "~ Found deprecated middleware file 'middleware/db.js', but the MongoURI variable was not set (or possibly invalid)."
      );
      removeDeprecatedMongoURIConfigFile();
      logger.info(
        `~ ${AppConstants.MONGO_KEY} environment variable is not set. Assuming default: ${AppConstants.MONGO_KEY}=${AppConstants.defaultMongoStringUnauthenticated}`
      );
      printInstructionsURL();
      process.env[AppConstants.MONGO_KEY] = AppConstants.defaultMongoStringUnauthenticated;
    } else {
      // We're not in docker, so we have some patch-work to do.
      removeDeprecatedMongoURIConfigFile();
      logger.info(
        "~ Found deprecated middleware file 'middleware/db.js', performing small migration task to '.env'."
      );
      envUtils.writeVariableToEnvFile(
        path.resolve(dotEnvPath),
        AppConstants.MONGO_KEY,
        mongoFallbackURI
      );
      process.env[AppConstants.MONGO_KEY] = mongoFallbackURI;
    }
  } else {
    if (fs.existsSync(deprecatedConfigFilePath)) {
      logger.info(
        "~ Found deprecated middleware file 'middleware/db.js', but it is redundant. Clearing this up for you."
      );
      removeDeprecatedMongoURIConfigFile();
    }
    logger.info(`✓ ${AppConstants.MONGO_KEY} environment variable set!`);
  }
}

/**
 *
 */
function ensurePortSet() {
  fetchOctoFarmPort();

  if (!process.env[AppConstants.OCTOFARM_PORT_KEY]) {
    logger.info(
      `~ ${AppConstants.OCTOFARM_PORT_KEY} environment variable is not set. Assuming default: ${AppConstants.OCTOFARM_PORT_KEY}=${AppConstants.defaultOctoFarmPort}.`
    );
    printInstructionsURL();
    process.env[AppConstants.OCTOFARM_PORT_KEY] = AppConstants.defaultOctoFarmPort.toString();
  }
}

/**
 *
 */
function ensureLogLevelSet() {
  const logLevel = process.env[AppConstants.LOG_LEVEL];

  if (!logLevel || !AppConstants.knownLogLevels.includes(logLevel)) {
    logger.info(
      `~ ${AppConstants.LOG_LEVEL} environment variable is not set. Assuming default: ${AppConstants.LOG_LEVEL}=${AppConstants.defaultLogLevel}.`
    );
    process.env[AppConstants.LOG_LEVEL] = AppConstants.defaultLogLevel.toString();
  }
}

/**
 * Parse and consume the .env file. Validate everything before starting OctoFarm.
 * Later this will switch to parsing a `middleware.yaml` file.
 */
function setupEnvConfig(skipDotEnv = false) {
  if (!skipDotEnv) {
    // This needs to be CWD of app.js, so be careful not to move this call.
    dotenv.config({ path: dotEnvPath });
    logger.info("✓ Parsed environment and (optional) .env file");
  }

  ensureNodeEnvSet();
  setupPackageJsonVersionOrThrow();
  ensureEnvNpmVersionSet();
  ensureMongoDBConnectionStringSet();
  ensurePortSet();
  envUtils.ensureBackgroundImageExists(__dirname);
  ensurePageTitle();
  ensureLogLevelSet();
  ensureSuperSecretKeySet();
}

/**
 *
 * @returns {string}
 */
function getViewsPath() {
  logger.debug("Running in directory:", { dirname: __dirname });
  const viewsPath = path.join(__dirname, "views");
  if (!fs.existsSync(viewsPath)) {
    if (isDocker()) {
      throw new Error(
        `Could not find views folder at ${viewsPath} within this docker container. Please report this as a bug to the developers.`
      );
    } else if (envUtils.isPm2()) {
      removePm2Service(
        `Could not find views folder at ${viewsPath} within the folder being run by Pm2. Please check your path or repository.`
      );
    } else if (envUtils.isNodemon()) {
      throw new Error(
        `Could not find views folder at ${viewsPath} within the folder being run by Nodemon. Please check your path or repository.`
      );
    } else {
      throw new Error(
        `Could not find views folder at ${viewsPath} within the OctoFarm path or binary PKG. Please report this as a bug to the developers.`
      );
    }
  } else {
    logger.debug("✓ Views folder found:", { path: viewsPath });
  }
  return viewsPath;
}

/**
 * Checks and runs database migrations
 * @param db
 * @param client
 * @returns {Promise<void>}
 */
async function runMigrations(db, client) {
  const migrationsStatus = await status(db);
  const pendingMigrations = migrationsStatus.filter((m) => m.appliedAt === "PENDING");

  if (pendingMigrations.length) {
    logger.info(
      `! MongoDB has ${pendingMigrations.length} migrations left to run (${migrationsStatus.length} are already applied)`
    );
  } else {
    logger.info(`✓ Mongo Database is up to date [${migrationsStatus.length} migration applied]`);
  }

  const migrationResult = await up(db, client);

  if (migrationResult > 0) {
    logger.info(`Applied ${migrationResult.length} migrations successfully`, migrationResult);
  }
}

/**
 * Ensures we have a page title set
 */
function ensurePageTitle() {
  if (!process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY]) {
    process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY] =
      AppConstants.defaultOctoFarmPageTitle?.toString();
  }
}

/**
 *
 * @returns {boolean} Is Production Environment
 */
function isEnvProd() {
  return process.env[AppConstants.NODE_ENV_KEY] === AppConstants.defaultProductionEnv;
}

/**
 *
 * @returns {string} Client version number #.#.#
 */
function fetchClientVersion() {
  if (!currentClientVersion) {
    currentClientVersion =
      packageLockFile?.dependencies["@notexpectedyet/octofarm-client"]?.version || "unknown";
    if (currentClientVersion === "unknown") {
      logger.error("Unable to parse package-lock file... please check installation!");
    }
  }
  return currentClientVersion;
}

function fetchSuperSecretKey() {
  return process.env[AppConstants.SUPER_SECRET_KEY];
}

function ensureSuperSecretKeySet() {
  const newlyGeneratedKey = AppConstants.defaultSuperSecretKey;

  if (!process.env[AppConstants.SUPER_SECRET_KEY]) {
    logger.info(
      `~ ${AppConstants.SUPER_SECRET_KEY} environment variable is not set. Setting new randomly generated Key!: ${AppConstants.SUPER_SECRET_KEY}=${newlyGeneratedKey}.`
    );
    envUtils.writeVariableToEnvFile(
      path.resolve(dotEnvPath),
      AppConstants.SUPER_SECRET_KEY,
      newlyGeneratedKey
    );
    process.env[AppConstants.SUPER_SECRET_KEY] = newlyGeneratedKey.toString();
  } else {
    logger.info(`✓ ${AppConstants.SUPER_SECRET_KEY} environment variable set!`);
  }
}

module.exports = {
  isEnvProd,
  setupEnvConfig,
  runMigrations,
  fetchMongoDBConnectionString,
  fetchOctoFarmPort,
  getViewsPath,
  fetchClientVersion,
  fetchSuperSecretKey
};
