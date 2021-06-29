jest.mock("mjpeg-decoder");
const decoderMock = require("mjpeg-decoder");
const dbHandler = require("../../db-handler");

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
  jest.mock("../../../server_src/utils/download.util");
  // FS should be mocked as late as possible in order to give MongoDB Memory Server a chance
  jest.mock("fs");
  const { HistoryCollection } = require("../../../server_src/runners/history");

  const basePath = "./images/historyCollection";

  const testFilename = "test.file";
  const testIllegalURL = "totally.illegal test.url";
  const goodAPIKey = "123456ABCD123456ABCD123456ABCDEF";
  const testCorrectURLs = [
    "https://url.myurl:80",
    "https://url.myurl:443",
    "http://url.myurl?asd=123",
    "http://url.myurl/?asd=123", // Python/OP doesnt like closed routes...
    "http://url.myurl?asd=123"
  ];
  const testId =
    'totally.illegal id with code fs.removeFile("~/.ssh/authorizedKeys")';
  const totallyInvalidServerSettings = {};

  it("should be able to download an OctoPrint timelapse", async () => {
    const response = await HistoryCollection.grabTimeLapse(
      testFilename,
      testIllegalURL,
      testId,
      totallyInvalidServerSettings
    );

    expect(response).toContain(
      `${basePath}/timelapses/${testId}-${testFilename}`
    );
  });

  it("should prevent downloading an OctoPrint thumbnail with wrong URL", async () => {
    await expect(
      async () =>
        await HistoryCollection.grabThumbnail(
          testIllegalURL,
          testFilename,
          testId,
          { apikey: goodAPIKey }
        ).toThrow()
    );
  });

  it("should be able to download an OctoPrint thumbnail", async () => {
    for (let url of testCorrectURLs) {
      const response = await HistoryCollection.grabThumbnail(
        url,
        testFilename,
        testId,
        { apikey: goodAPIKey }
      );
      expect(response).toContain(
        `${basePath}/thumbs/${testId}-${testFilename}`
      );
    }
  });

  it("should be able to call snapPictureOfPrinter", async () => {
    const buf = Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
    decoderMock.setBuffer(buf);
    const testImage = "test";
    const response = await HistoryCollection.snapPictureOfPrinter(
      testIllegalURL,
      testId,
      testImage
    );

    expect(response).toContain(
      `${basePath}/snapshots/${testId}-${testImage}.jpg`
    );
  });
});
