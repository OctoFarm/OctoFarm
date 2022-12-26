const patreonData = require("../constants/patreon.constants");
const Logger = require("../handlers/logger");
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");
const logger = new Logger(LOGGER_ROUTE_KEYS.SERVICE_PATREON);

function returnPatreonData() {
  return patreonData;
}

module.exports = {
  returnPatreonData
};
