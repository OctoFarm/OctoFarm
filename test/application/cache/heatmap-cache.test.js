const dbHandler = require("../../db-handler");
jest.mock("../../../server_src/services/farm-statistics.service");
jest.mock("../../../server_src/models/ErrorLog");
jest.mock("../../../server_src/models/TempHistory");
jest.mock("../../../server_src/models/RoomData");
const { configureContainer } = require("../../../server_src/container");
const DITokens = require("../../../server_src/container.tokens");

let container;
let heatMapCache;
let farmStatisticsService;

beforeAll(async () => {
  await dbHandler.connect();
  container = configureContainer();
  heatMapCache = container.resolve(DITokens.heatMapCache);
  farmStatisticsService = container.resolve(DITokens.farmStatisticsService);
  const printersStore = container.resolve(DITokens.printersStore);
  await printersStore.loadPrintersStore();
});
afterEach(async () => {
  await dbHandler.clearDatabase();
});
afterAll(async () => {
  await dbHandler.closeDatabase();
});
beforeEach(() => {
  farmStatisticsService.resetMockData();
});

describe("HeatMap-Cache", () => {
  it("should initiate fine", async () => {
    await heatMapCache.initHeatMap();
  });

  test.skip("should save farmInfos to database when non-existent", async function () {
    const farmStatsBefore = await farmStatisticsService.list();
    expect(farmStatsBefore).toHaveLength(0);

    const message = await PrinterClean.initFarmInformation();

    const farmStats = await farmStatisticsService.list();

    expect(farmStats).toHaveLength(1);
    expect(farmStats[0].farmStart.getDate()).toEqual(new Date().getDate());
    expect(farmStats[0].heatMap).toHaveLength(5);
    expect(message).toEqual("Farm information inititialised...");
  });

  // TODO This test requires mocking saveModified or change that call in PrinterClean
  test.skip("should fix farmInfos with undefined heatmap", async function () {
    farmStatisticsService.saveMockData([
      {
        farmStart: new Date(),
        heatMap: undefined
      }
    ]);
    const message = await PrinterClean.initFarmInformation();

    const farmStats = await farmStatisticsService.list();

    expect(farmStats).toHaveLength(1);
    expect(message).toEqual("Farm information inititialised...");
  });

  test.skip("should not throw for fresh data arrays in farmInfo:heatMap", async function () {
    farmStatisticsService.saveMockData([
      {
        farmStart: new Date(),
        heatMap: [
          {
            name: "Completed",
            data: []
          }
        ]
      }
    ]);

    expect(PrinterClean.initFarmInformation()).resolves.toBeTruthy();
    // expect(PrinterClean.initFarmInformation()).rejects.toThrow("Cannot read property 'x' of undefined");
  });

  // TODO we'd like to have this test fail (as some statistics are missing)
  test.skip("should tolerate missing statistics in farmInfo:heatMap", async function () {
    farmStatisticsService.saveMockData([
      {
        farmStart: new Date(),
        heatMap: [
          {
            name: "Completed",
            data: [
              {
                x: "Wednesday",
                y: 0
              }
            ]
          }
        ]
      }
    ]);
    const message = await PrinterClean.initFarmInformation();

    const farmStats = await farmStatisticsService.list();

    expect(farmStats).toHaveLength(1);
    expect(farmStats).toHaveLength(1);
    expect(farmStats[0].farmStart.getDate()).toEqual(new Date().getDate());
    expect(farmStats[0].heatMap).toHaveLength(1);
    expect(farmStats[0].heatMap[0].name).toEqual("Completed");
    expect(message).toEqual("Farm information inititialised...");
  });

  test.skip("should run heatmapping problematically", async () => {
    let farmStats = await farmStatisticsService.list({});
    expect(farmStats).toHaveLength(0);

    await PrinterClean.heatMapping();

    farmStats = await farmStatisticsService.list({});
    expect(farmStats).toHaveLength(0);

    await PrinterClean.heatMapping();

    farmStats = await farmStatisticsService.list({});
    expect(farmStats).toHaveLength(0);
  });

  test.skip("should run heatmapping normally - farm is initiated in time", async () => {
    farmStatisticsService.resetMockData();
    let farmStats1 = await farmStatisticsService.list({});
    expect(farmStats1).toHaveLength(0);

    // TODO in no way can we reset the heatmap without a restart... previous tests cause it to be so
    let farmStatsReport = await PrinterClean.initFarmInformation();

    expect(farmStatsReport).toEqual("Farm information inititialised...");
    let farmStats = await farmStatisticsService.list({});
    expect(farmStats).toHaveLength(1);
    // This is what I meant with TODO above
    // expect(farmStats[0].heatMap).toMatchObject(emptyHeatmap);

    await PrinterClean.heatMapping();

    farmStats = await farmStatisticsService.list({});
    expect(farmStats).toHaveLength(1);
    // expect(farmStats[0].heatMap).toMatchObject(emptyHeatmap);

    // Call again for another branch in the code...
    await PrinterClean.heatMapping();

    // TODO NaN figure value, completely random daynames for me (D)
    // expect(farmStats[0].heatMap).toMatchObject(nanFigureHeatmap);

    farmStats = await farmStatisticsService.list({});
    expect(farmStats).toHaveLength(1);
  });
});
