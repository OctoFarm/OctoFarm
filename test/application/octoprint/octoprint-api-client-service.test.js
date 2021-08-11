const testPath = "../../";
const dbHandler = require(testPath + "db-handler");
jest.mock("../../../server_src/services/octoprint/octoprint-api.service");
const { configureContainer } = require("../../../server_src/container");
const { ensureSystemSettingsInitiated } = require("../../../server_src/app-core");
const DITokens = require("../../../server_src/container.tokens");

let octoPrintClient;

beforeAll(async () => {
  await dbHandler.connect();
  const container = configureContainer();
  await ensureSystemSettingsInitiated(container);

  octoPrintClient = container.resolve(DITokens.octoPrintApiClientService);
});

afterEach(async () => {
  await dbHandler.clearDatabase();
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("OctoPrint-API-Client-Service", () => {
  it("should throw error on any call incorrect printerURL", async () => {
    // TODO Not human-friendly
    expect(
      async () => await octoPrintClient.get(null, "key", "route", false)
    ).rejects.toHaveProperty("code", "ERR_INVALID_URL");
  });

  it("should throw error on getSettings with incorrect printerURL", async () => {
    // TODO Not human-friendly
    expect(
      async () =>
        await octoPrintClient.getSettings({
          apiKey: "surewhynot",
          printerURL: "some uwrl"
        })
    ).rejects.toHaveProperty("code", "ERR_INVALID_URL");
  });

  it("should not throw error on getSettings with incorrect printerURL", async () => {
    const settings = await octoPrintClient.getSettings({
      apiKey: "surewhynotsurewhynotsurewhynotsu",
      printerURL: "http://someurl/"
    });
  });
});
