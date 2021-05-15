jest.mock("../../services/farm-statistics.service");
const mockFarmStatisticsService = require("../../services/farm-statistics.service");
const {PrinterClean} = require("../dataFunctions/printerClean");

beforeEach(() => {
  mockFarmStatisticsService.resetMockData();
});

describe("PrinterClean", function () {
  it("should save farmInfos to database when non-existent", async function () {

    const farmStatsBefore = await mockFarmStatisticsService.list();
    expect(farmStatsBefore).toHaveLength(0);

    const message = await PrinterClean.initFarmInformation();

    const farmStats = await mockFarmStatisticsService.list();

    expect(farmStats).toHaveLength(1);
    expect(farmStats[0].farmStart.getDate()).toEqual((new Date()).getDate());
    expect(farmStats[0].heatMap).toHaveLength(5);
    expect(message).toEqual("Farm information inititialised...");
  });

  // TODO This test requires mocking saveModified or change that call in PrinterClean
  test.skip("should fix farmInfos with undefined heatmap", async function () {
    mockFarmStatisticsService.saveMockData([{
      farmStart: new Date(),
      heatMap: undefined
    }])
    const message = await PrinterClean.initFarmInformation();

    const farmStats = await mockFarmStatisticsService.list();

    expect(farmStats).toHaveLength(1);
    expect(message).toEqual("Farm information inititialised...");
  });

  it("should not throw for fresh data arrays in farmInfo:heatMap", async function () {
    mockFarmStatisticsService.saveMockData([{
      farmStart: new Date(),
      heatMap: [
        {
          name: "Completed",
          data: []
        }
      ]
    }])

    expect(PrinterClean.initFarmInformation()).resolves.toBeTruthy();
    // expect(PrinterClean.initFarmInformation()).rejects.toThrow("Cannot read property 'x' of undefined");
  });

  // TODO we'd like to have this test fail (as some statistics are missing)
  it("should tolerate missing statistics in farmInfo:heatMap", async function () {
    mockFarmStatisticsService.saveMockData([{
      farmStart: new Date(),
      heatMap: [
        {
          name: "Completed",
          data: [{
            x: "Wednesday",
            y: 0
          }]
        }
      ]
    }])
    const message = await PrinterClean.initFarmInformation();

    const farmStats = await mockFarmStatisticsService.list();

    expect(farmStats).toHaveLength(1);
    expect(farmStats).toHaveLength(1);
    expect(farmStats[0].farmStart.getDate()).toEqual((new Date()).getDate());
    expect(farmStats[0].heatMap).toHaveLength(1);
    expect(farmStats[0].heatMap[0].name).toEqual("Completed");
    expect(message).toEqual("Farm information inititialised...");
  });
});
