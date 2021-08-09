const dbHandler = require("../../db-handler");
const { configureContainer } = require("../../../server_src/container");
const DITokens = require("../../../server_src/container.tokens");
const { getEmptyOperationsObject } = require("../../../server_src/constants/cleaner.constants");

let container;
let jobsCache;
let printersStore;
let currentOperationsCache;

const defaultOperationsStatus = getEmptyOperationsObject();
defaultOperationsStatus.count.farmProgressColour = "warning";
const validNewPrinter = {
  apiKey: "asdasasdasdasdasdasdasdasdasdasd",
  webSocketURL: "ws://asd.com/",
  printerURL: "https://asd.com:81",
  camURL: "http://asd.com:81"
};
const websocketCurrentMsgNoProgress = {
  job: {
    file: {
      name: "some.gee.code"
    }
  }
};

beforeAll(async () => {
  await dbHandler.connect();
  container = configureContainer();
  currentOperationsCache = container.resolve(DITokens.currentOperationsCache);
  printersStore = container.resolve(DITokens.printersStore);
  jobsCache = container.resolve(DITokens.jobsCache);
  await printersStore.loadPrintersStore();
});

afterEach(async () => {
  await dbHandler.clearDatabase();
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("Current-Operations-Cache", function () {
  it("should have default values", () => {
    const ops = currentOperationsCache.getCurrentOperations();
    expect(ops).toEqual(defaultOperationsStatus);
  });

  it("should ignore jobs which are not assigned to printers", () => {
    jobsCache.savePrinterJob("some-id", websocketCurrentMsgNoProgress);

    // Assert no jobs registered
    const ops = currentOperationsCache.getCurrentOperations();
    expect(ops).toEqual(defaultOperationsStatus);
  });

  it("should detect idle printer", async () => {
    let frozenObject = await printersStore.addPrinter(validNewPrinter);
    const printerId = frozenObject.id;
    jobsCache.savePrinterJob(printerId, websocketCurrentMsgNoProgress);

    // As the cache could be generated it will not by regenerated automatically
    currentOperationsCache.generateCurrentOperations();

    const ops = currentOperationsCache.getCurrentOperations();
    expect(ops.count.offline).toEqual(1);
    expect(ops.count.idle).toEqual(0);
    expect(ops.count.disconnected).toEqual(0);
  });
});
