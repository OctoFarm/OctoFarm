class FarmStatisticsServiceMock {
  testFarmStatistics = [];

  /**
   * Mock saved farm statistics in the database.
   */
  async list() {
    return this.testFarmStatistics;
  }

  async create(startDate, heatmapArray) {
    const newEntry = {
      farmStart: startDate,
      heatMap: heatmapArray,
      markModified: () => {},
      save: async () => {}
    };
    this.testFarmStatistics.push(newEntry);
    return Promise.resolve(newEntry);
  }

  saveMockData(inputData) {
    if (!Array.isArray(inputData)) {
      throw new Error(
        "Mate you cant even properly provide an array input to a MOCK TEST??? Dude, git gud."
      );
    }
    this.testFarmStatistics = inputData;
  }

  resetMockData() {
    this.testFarmStatistics = [];
  }
}

module.exports = FarmStatisticsServiceMock;
