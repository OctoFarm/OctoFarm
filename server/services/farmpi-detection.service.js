const { readFileSync } = require("fs");
const Logger = require("../handlers/logger");
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");
const logger = new Logger(LOGGER_ROUTE_KEYS.SERVICE_FARM_PI);

const fileLocation = "/etc/farmpi_version";

let farmPiVersion = false;

const farmPiStatus = () => {
  return farmPiVersion;
};

const detectFarmPi = async () => {
  try {
    const fileContents = await readFileSync(fileLocation);
    farmPiVersion = fileContents.toString();
    farmPiVersion.replace(/ /, "");
    logger.debug(
      "Found farmPi version file... we are on farmpi version : " + fileContents.toString()
    );
  } catch (e) {
    logger.debug("Did not find farmPi version file... we are not on a farmpi install! Error: ", e);
  }
};

module.exports = {
  detectFarmPi,
  farmPiStatus
};
