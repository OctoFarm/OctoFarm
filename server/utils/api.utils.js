/**
 * Check that status is available, if not return 408 for timeout...
 * @param response
 * @returns {number}
 */
const checkApiStatusResponse = (response) => {
  return response?.status ? response.status : 408;
};

module.exports = {
  checkApiStatusResponse
};
