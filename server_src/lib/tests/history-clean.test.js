jest.mock("../../services/history.service");
const mockHistoryService = require("../../services/history.service");
const { HistoryClean } = require("../dataFunctions/historyClean");

describe("historyClean", function () {
  it("should start and finish within 5 sec for empty history", async function () {
    expect(await mockHistoryService.find({})).toHaveLength(0);

    const historySyncService = new HistoryClean(false, "info");
    expect(historySyncService.logger).toBeDefined();
    const voidResponse = await historySyncService.start();
    expect(voidResponse).toBeFalsy();
    expect(historySyncService.statisticsClean).toBeTruthy();
    expect(historySyncService.historyClean).toBeTruthy();
    expect(historySyncService.historyClean).toHaveLength(0);
    expect(true).toEqual(true);
  });

  // it("should start and finish within 5 sec for empty history", async function () {
  //   expect(await mockHistoryService.find({})).toHaveLength(0);
  //
  //   const historySyncService = new HistoryClean(false, "info");
  //   expect(historySyncService.logger).toBeDefined();
  //   const voidResponse = await historySyncService.start();
  //   expect(voidResponse).toBeFalsy();
  //   expect(historySyncService.statisticsClean).toBeTruthy();
  //   expect(historySyncService.historyClean).toBeTruthy();
  //   expect(historySyncService.historyClean).toHaveLength(0);
  //   expect(true).toEqual(true);
  // });
});
