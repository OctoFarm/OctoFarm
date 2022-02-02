const Logger = require("../handlers/logger");
const logger = new Logger("OctoFarm-State");

/**
 * Logs out the response object from the check api function
 * @param response
 * @returns {number}
 */
const logTheApiResponse = (response) => {
  logger.error("Error in API response", response);
  return 408;
};

/**
 * Calculate the cost of printing
 * @param response
 * @returns {number}
 */
const checkApiStatusResponse = (response) => {
  return response?.status ? response.status : logTheApiResponse(response);
};

module.exports = {
  checkApiStatusResponse
};
