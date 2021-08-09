const { configureContainer } = require("../../../server_src/container");
const DITokens = require("../../../server_src/container.tokens");
const {
  getDefaultFileCleanStatistics
} = require("../../../server_src/constants/cleaner.constants");

let container;
let fileCache;

beforeEach(() => {
  container = configureContainer();
  fileCache = container.resolve(DITokens.fileCache);
});

const testPrinterId = "asd";
const fileStorageEntry = {
  fileList: [1],
  storage: {}
};

describe("generate", function () {
  it("should generate printer file cache without strict checks", function () {
    const fileStorageEntryNoStorage = {
      fileList: [1]
    };
    fileCache.savePrinterFileStorage(testPrinterId, fileStorageEntryNoStorage);
    expect(fileCache.getPrinterFiles(testPrinterId)).toEqual([1]);
    expect(fileCache.getPrinterStorage(testPrinterId)).toBeUndefined();

    fileCache.savePrinterFileStorage(testPrinterId, fileStorageEntry);
    expect(fileCache.getPrinterFiles(testPrinterId)).toEqual([1]);
    expect(fileCache.getPrinterStorage(testPrinterId)).toEqual({});
  });

  it("should generate file statistics for badly formatted fileList", function () {
    fileCache.savePrinterFileStorage(testPrinterId, fileStorageEntry);

    const fileList = fileCache.getPrinterFiles(testPrinterId);
    expect(fileList).toBeTruthy();
    const stats = fileCache.getStatistics();
    expect(stats).toEqual(getDefaultFileCleanStatistics());
  });

  // TODO We are not that far yet
  test.skip("should generate file statistics for proper printer", function () {
    const fakeIshPrinter = {
      fileList: {
        files: [
          {
            fileSize: 100,
            name: "test"
          }
        ],
        fileCount: 150120310230 // absurdism
      },
      sortIndex: 0
    };

    expect(fileCache.generate(fakeIshPrinter, null)).toBeUndefined();

    const fileStats = fileCache.returnFiles(0);
    expect(fileStats).toBeTruthy();
    expect(fileStats.fileCount).toEqual(150120310230);
    expect(Array.isArray(fileStats.fileList)).toBeTruthy();
    expect(fileStats.fileList[0].name).toEqual("test");
    expect(Array.isArray(fileStats.fileList[0].toolUnits)).toBeTruthy();
    expect(Array.isArray(fileStats.fileList[0].toolCosts)).toBeTruthy();
    const fakeIshFarmPrinters = [
      {
        fileList: {
          files: [
            {
              size: 100,
              length: 500
            }
          ]
        },
        storage: {
          free: 100,
          total: 500
        },
        sortIndex: 0
      }
    ];
    expect(fileCache.statistics(fakeIshFarmPrinters)).toBeUndefined();

    const stats = fileCache.getStatistics();
    expect(stats).toBeTruthy();
    expect(stats.storagePercent).not.toBeNaN();
    expect(stats).toEqual({
      storageUsed: 400,
      storageTotal: 500,
      storageRemain: 100,
      storagePercent: 80,
      fileCount: 1,
      folderCount: 0,
      biggestFile: 100,
      smallestFile: 100,
      biggestLength: 0.5,
      smallestLength: 0.5,
      averageFile: 100,
      averageLength: 0.5
    });
  });
});
