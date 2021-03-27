const historyService = jest.createMockFromModule("../history.service");

const testHistory = [];

/**
 * Test version of: history repository/service
 * @returns {Promise<*|null>}
 */
historyService.find = async () => {
  return Promise.resolve(testHistory);
};

module.exports = historyService;
