jest.mock("mjpeg-decoder");
const decoderMock = require("mjpeg-decoder");
jest.mock("../../server_src/services/octoprint/octoprint-api.service");
const { configureContainer } = require("../../server_src/container");
const Spool = require("../../server_src/models/Spool.js");
const DITokens = require("../../server_src/container.tokens");

const dbHandler = require("../db-handler");
let container;
let historyService;
let printerStateFactory;
let octoPrintClientMock;
let printerInstance;

const legalURL = "http://prusa/";
const goodAPIKey = "123456ABCD123456ABCD123456ABCDEF";
const basePath = "./images/historyService";
const testFilename = "test.file";
const testIllegalURL = "totally.illegal test.url";

beforeAll(async () => {
  await dbHandler.connect();
  // FS should be mocked as late as possible in order to give MongoDB Memory Server a chance
  jest.mock("fs");
  container = configureContainer();
  const settingsStore = container.resolve(DITokens.settingsStore);
  await settingsStore.loadSettings();
  historyService = container.resolve(DITokens.historyService);
  printerStateFactory = container.resolve(DITokens.printerStateFactory);
  octoPrintClientMock = container.resolve(DITokens.octoPrintApiService);

  printerInstance = await printerStateFactory.create({
    _id: "fake",
    _doc: {
      printerURL: legalURL,
      apiKey: goodAPIKey
    }
  });
});

afterEach(async () => {
  await dbHandler.clearDatabase();
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("HistoryService", () => {
  const testCorrectURLs = [
    "https://url.myurl:80",
    "https://url.myurl:443",
    "http://url.myurl?asd=123",
    "http://url.myurl/?asd=123", // Python/OP doesnt like closed routes...
    "http://url.myurl?asd=123"
  ];
  const testId = 'totally.illegal id with code fs.removeFile("~/.ssh/authorizedKeys")';

  test.skip("should be able to download an OctoPrint timelapse", async () => {
    const response = await historyService.downloadTimeLapse(printerInstance, testFilename, testId);
    expect(response).toContain(`${basePath}/timelapses/${testId}-${testFilename}`);
  });

  it("should prevent downloading an OctoPrint thumbnail with wrong URL", async () => {
    // false positive
    await expect(
      async () =>
        await historyService
          .grabThumbnail(printerInstance, testIllegalURL, testFilename, testId)
          .toThrow()
    );
  });

  test.skip("should be able to download an OctoPrint thumbnail", async () => {
    for (let url of testCorrectURLs) {
      const response = await historyService.grabThumbnail(printerInstance, testFilename, testId);
      expect(response).toContain(`${basePath}/thumbs/${testId}-${testFilename}`);
    }
  });

  test.skip("should be able to call snapPictureOfPrinter", async () => {
    const buf = Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
    decoderMock.setBuffer(buf);
    const testImage = "test";
    const response = await historyService.snapPictureOfPrinter(testIllegalURL, testId, testImage);

    expect(response).toContain(`${basePath}/snapshots/${testId}-${testImage}.jpg`);
  });

  test.skip("should fail updatePrinterSelectedFilament without OctoPrint Connector service", async () => {
    const printer = {
      apiKey: goodAPIKey,
      selectedFilament: [
        {
          spools: {
            fmID: 1
          }
        }
      ]
    };

    await expect(async () => await historyService.resyncFilament(printer)).rejects.toContain(
      "OctoPrint Client Connector not instantiated. Report please."
    );
  });

  test.skip("should fail updatePrinterSelectedFilament when printer selected filamentID falsy", async () => {
    const printer = {
      apiKey: goodAPIKey,
      printerURL: testCorrectURLs[0],
      selectedFilament: [
        {
          spools: {}
        }
      ]
    };

    await expect(async () => await historyService.resyncFilament(printer)).not.toThrow();
  });

  test.skip("should fail updatePrinterSelectedFilament when ID not known", async () => {
    const printer = {
      apiKey: goodAPIKey,
      printerURL: testCorrectURLs[0],
      selectedFilament: [
        {
          spools: {
            fmID: 1
          }
        }
      ]
    };

    await expect(async () => await historyService.resyncFilament(printer)).not.toThrow();
  });

  test.skip("should fail updatePrinterSelectedFilament - missing filament db document", async () => {
    const printer = {
      apiKey: goodAPIKey,
      printerURL: testCorrectURLs[0],
      selectedFilament: [
        {
          spools: {
            fmID: 1
          },
          _id: "4edd40c86762e0fb12000003"
        }
      ]
    };

    await expect(async () => await historyService.resyncFilament(printer)).not.toThrow();
  });

  test.skip("should succeed updatePrinterSelectedFilament when every code weakness is overcome", async () => {
    const obj = await Spool.create({ spools: {} });

    const printer = {
      apiKey: goodAPIKey,
      printerURL: testCorrectURLs[0],
      selectedFilament: [
        {
          spools: {
            fmID: 1
          },
          _id: obj._id
        }
      ]
    };

    octoPrintClientMock.saveMockResponse(200, { spool: { profile: {} } });

    const spools = await historyService.resyncFilament(printer);
    expect(spools).toHaveLength(1);
    expect(spools[0]).toMatchObject({ __v: 0, _id: expect.anything() });
  });

  it("should safely skip for bad input thumbnailCheck", async () => {
    const thumbNail = await historyService.thumbnailCheck(
      {
        name: "test2_notgoingtobefound.file",
        apiKey: goodAPIKey
      },
      {},
      { files: [{ name: testFilename }] }
    );
    expect(thumbNail).toBeNull();
  });

  it("should safely skip for disabled thumbnail event serverSetting - thumbnailCheck", async () => {
    const thumbNail = await historyService.thumbnailCheck(
      { name: "test2_notgoingtobefound.file" },
      { history: { thumbnails: [] } },
      [{ name: testFilename }],
      {
        apiKey: goodAPIKey
      }
    );
    expect(thumbNail).toBeNull();
  });

  it("should be able to call thumbnailCheck", async () => {
    const thumbNail = await historyService.thumbnailCheck(
      { apiKey: goodAPIKey, printerURL: testCorrectURLs[1] },
      "derp",
      {
        files: [{ name: testFilename, thumbnail: "notnullforsure" }]
      }
    );
    expect(thumbNail).toBeNull();
  });

  it("should safely skip for snapshot event serversetting disabled - snapshotCheck", async () => {
    const thumbNail = await historyService.snapshotCheck(
      {
        apiKey: goodAPIKey,
        printerURL: testCorrectURLs[1]
      },
      { _id: "test_id" },
      {
        payload: { name: "asd" }
      }
    );
    expect(thumbNail).toBeNull();
  });

  test.skip("should be able to call snapshotCheck", async () => {
    const thumbNail = await historyService.snapshotCheck(
      {
        apiKey: goodAPIKey,
        printerURL: testCorrectURLs[1]
      },
      { _id: "test_id" },
      { payload: { name: "asd" } }
    );
    // [{ name: testFilename, thumbnail: "notnullforsure" }],
    expect(thumbNail).toBeTruthy();
  });
});
