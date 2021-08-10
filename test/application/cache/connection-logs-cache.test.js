const { configureContainer } = require("../../../server_src/container");
const DITokens = require("../../../server_src/container.tokens");
const dbHandler = require("../../db-handler");

let container;
let connectionLogsCache;
let printersStore;

beforeAll(async () => {
  await dbHandler.connect();
  container = configureContainer();
  connectionLogsCache = container.resolve(DITokens.connectionLogsCache);
  printersStore = container.resolve(DITokens.printersStore);
  await printersStore.loadPrintersStore();
});
afterEach(async () => {
  await dbHandler.clearDatabase();
});
afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe(DITokens.connectionLogsCache, () => {
  it("should resolve", async () => {
    expect(connectionLogsCache).toBeDefined();
  });

  it("should run generateConnectionLogs just fine", async () => {
    const printerState = await printersStore.addPrinter({
      printerURL: "http://url.com",
      webSocketURL: "ws://url.com",
      apiKey: "octofarmoctofarmoctofarmoctofarm",
      tempTriggers: { heatingVariation: null }
    });
    await connectionLogsCache.generateConnectionLogs(printerState.id);
  });

  test.skip("should be able to call returnPrinterLogs", () => {
    expect(connectionLogsCache.generateConnectionLogs()).toEqual([]);
    expect(connectionLogsCache.generateConnectionLogs(0)).toBeUndefined();
  });
});
