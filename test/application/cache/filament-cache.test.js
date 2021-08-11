const dbHandler = require("../../db-handler");
const { configureContainer } = require("../../../server_src/container");
const DITokens = require("../../../server_src/container.tokens");
const { noSpoolOptionTemplate } = require("../../../server_src/constants/template.constants");

let container;
let filamentCache;

beforeAll(async () => {
  await dbHandler.connect();
  container = configureContainer();
  filamentCache = container.resolve(DITokens.filamentCache);
  const printersStore = container.resolve(DITokens.printersStore);
  await printersStore.loadPrintersStore();
});

afterEach(async () => {
  await dbHandler.clearDatabase();
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("Filament-Cache", function () {
  it("should have default values", () => {
    const spools = filamentCache.getSpools();
    const profiles = filamentCache.getProfiles();
    const stats = filamentCache.getStatistics();
    const selectedFilamentList = filamentCache.getSelected();
    const dropDownList = filamentCache.getDropDown();

    expect(spools).toHaveLength(0);
    expect(profiles).toHaveLength(0);
    expect(stats).toHaveLength(0);
    expect(selectedFilamentList).toHaveLength(0);
    expect(dropDownList).toMatchObject({
      normalDropDown: [],
      historyDropDown: []
    });
  });

  it("should be able to construct dropdown list data", async () => {
    expect(filamentCache.getDropDown()).toMatchObject({
      normalDropDown: [],
      historyDropDown: []
    });

    const result = await filamentCache.dropDownList([], [], true, []);
    expect(result).toBeUndefined();

    expect(filamentCache.getDropDown()).toMatchObject({
      normalDropDown: [noSpoolOptionTemplate],
      historyDropDown: [noSpoolOptionTemplate]
    });
  });

  it("should be able to get printer assignment at start", async () => {
    const result = filamentCache.getPrinterAssignment(null, []);
    expect(result).toEqual([]);
  });

  it("should create stats with minimal input", async () => {
    const result = filamentCache.createStatistics([], [], []);

    expect(result).toMatchObject({
      materialList: [],
      used: expect.any(Number),
      total: expect.any(Number),
      price: expect.any(Number),
      profileCount: 0,
      spoolCount: 0,
      activeSpools: expect.any(Array),
      activeSpoolCount: expect.any(Number),
      materialBreakDown: []
    });
  });

  it("should be able to start with empty database", async () => {
    await filamentCache.initCache();
  });
});
