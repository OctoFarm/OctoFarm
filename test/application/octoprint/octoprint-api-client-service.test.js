const testPath = "../../";
const dbHandler = require(testPath + "db-handler");
const { configureContainer } = require("../../../server_src/container");
const { ensureSystemSettingsInitiated } = require("../../../server_src/app-core");
const DITokens = require("../../../server_src/container.tokens");
const AxiosMock = require("../../provisioning/axios.mock");
const awilix = require("awilix");

let octoPrintApi;

beforeAll(async () => {
  await dbHandler.connect();
  const container = configureContainer();
  container.register(DITokens.httpClient, awilix.asClass(AxiosMock));

  await ensureSystemSettingsInitiated(container);

  octoPrintApi = container.resolve(DITokens.octoPrintApiService);
});

afterEach(async () => {
  await dbHandler.clearDatabase();
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("OctoPrint-API-Client-Service", () => {
  it("should throw error on getSettings with incorrect printerURL", async () => {
    // TODO Not human-friendly
    await expect(
      async () =>
        await octoPrintApi.getSettings({
          apiKey: "surewhynot",
          printerURL: "some uwrl"
        })
    ).rejects.toHaveProperty("code", "ERR_INVALID_URL");
  });

  it("should not throw error on getSettings with correct printerURL", async () => {
    const settings = await octoPrintApi.getSettings({
      apiKey: "surewhynotsurewhynotsurewhynotsu",
      printerURL: "http://someurl/"
    });
  });
});
