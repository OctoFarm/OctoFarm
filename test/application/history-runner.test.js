const dbHandler = require("../db-handler");

/**
 * Connect to a new in-memory database before running any tests.
 */
beforeAll(async () => {
  await dbHandler.connect();
});

/**
 * Clear all test data after every test.
 */
afterEach(async () => {
  await dbHandler.clearDatabase();
});

/**
 * Remove and close the db and server.
 */
afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("History:Runner", () => {
  jest.mock("../../server_src/utils/download.util");
  const { HistoryCollection } = require("../../server_src/runners/history");

  const testFilename = "test.file";
  const testUrl = "totally.illegal test.url";
  const testId = "totally.illegal id with code fs.removeFile(\"~/.ssh/authorizedKeys\")";
  const totallyInvalidServerSettings = {};

  it("should be able to download an OctoPrint timelapse", async () => {
    const response = await HistoryCollection.grabTimeLapse(testFilename, testUrl, testId, totallyInvalidServerSettings);

    expect(response).toContain(`images/historyCollection/timelapses/${testId}-${testFilename}`);
  });
});
