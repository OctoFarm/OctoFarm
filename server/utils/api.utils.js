/**
 * Calculate the cost of printing
 * @param response
 * @returns {number}
 */
const checkApiStatusResponse = (response) => {
  return response?.status ? response.status : 408;
};

module.exports = {
  checkApiStatusResponse
};
