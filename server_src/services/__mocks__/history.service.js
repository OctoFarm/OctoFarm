const historyService = jest.createMockFromModule("../history.service");

let testHistory = [];

class HistoryServiceMock {
  async find() {
    return testHistory;
  }

  saveMockData(inputData) {
    if (!Array.isArray(inputData)) {
      throw new Error(
        "Mate you cant even properly provide an array input to a MOCK TEST??? Dude, git gud."
      );
    }
    testHistory = inputData;
  }

  resetMockData() {
    testHistory = [];
  }
}

module.exports = HistoryServiceMock;
