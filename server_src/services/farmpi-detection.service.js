const { readFileSync } = require("fs");
const Logger = require("../handlers/logger");

const logger = new Logger("OctoFarm-Server");

const fileLocation = "/etc/farmpi_version";

let farmPiVersion = false;

const farmPiStatus = () => {
  return farmPiVersion;
};

const detectFarmPi = async () => {
  try {
    const fileContents = await readFileSync(fileLocation);
    farmPiVersion = fileContents.toString();
    logger.debug(
      "Found farmPi version file... we are on farmpi version : " + fileContents.toString()
    );
  } catch (e) {
    logger.debug("Did not find farmPi version file... we are not on a farmpi install!");
  }
};

module.exports = {
  detectFarmPi,
  farmPiStatus
};
