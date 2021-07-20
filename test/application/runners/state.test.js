jest.mock("../../../server_src/services/octoprint/octoprint-api.service");
const dbHandler = require("../../db-handler");
const { ensureSystemSettingsInitiated } = require("../../../server_src/app-core");

beforeAll(async () => {
  await dbHandler.connect();
  const settings = await ensureSystemSettingsInitiated();
  expect(settings).toEqual("Server settings have been created...");
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("State", () => {
  const {
    OctoprintApiService
  } = require("../../../server_src/services/octoprint/octoprint-api.service");
  const { Runner } = require("../../../server_src/runners/state");

  it("should init with 0 printers", async () => {
    // Requires system settings to be present
    // Will start generating printers, setting up websockets and cleaning Filament.
    await Runner.init();
  });

  it("should be able to detect falsy api key response from OctoPrint using 'compareEnteredKeyToGlobalKey'", async () => {
    // Construct the static OP service...
    await Runner.init();

    OctoprintApiService.saveMockResponse(200, { api: null });
    const comparisonResult = await Runner.compareEnteredKeyToGlobalKey({
      apikey: "surewhynot",
      printerURL: "http://someurl/"
    });

    // TODO the conclusion from the code under test is incorrect
    expect(comparisonResult).toEqual({
      message: "Global API Key detected... unable to authenticate websocket connection",
      type: "system",
      errno: "999",
      code: "999"
    });
  });

  it("should be able to detect the same global api key response from OctoPrint using 'compareEnteredKeyToGlobalKey'", async () => {
    // Construct the static OP service...
    await Runner.init();

    OctoprintApiService.saveMockResponse(200, { api: { key: "surewhynot" } });
    const comparisonResult2 = await Runner.compareEnteredKeyToGlobalKey({
      apikey: "surewhynot",
      printerURL: "http://someurl/"
    });

    expect(comparisonResult2).toEqual({
      message: "Global API Key detected... unable to authenticate websocket connection",
      type: "system",
      errno: "999",
      code: "999"
    });
  });

  it("should return true for correct application/user API key from OctoPrint using 'compareEnteredKeyToGlobalKey'", async () => {
    // Construct the static OP service...
    await Runner.init();

    OctoprintApiService.saveMockResponse(200, { api: { key: "imauserkey" } });
    const comparisonResult3 = await Runner.compareEnteredKeyToGlobalKey({
      apikey: "allaroundtheglobal",
      printerURL: "http://someurl/"
    });

    expect(comparisonResult3).toEqual(true);
  });

  it("should be able to detect the falsy response from OctoPrint using 'compareEnteredKeyToGlobalKey'", async () => {
    // Construct the static OP service...
    await Runner.init();

    OctoprintApiService.saveMockResponse(200, undefined);
    const comparisonResult3 = await Runner.compareEnteredKeyToGlobalKey({
      apikey: "surewhynot",
      printerURL: "http://someurl/"
    });

    // TODO the conclusion from the code under test is incorrect
    expect(comparisonResult3).toEqual({
      message: "Global API Key detected... unable to authenticate websocket connection",
      type: "system",
      errno: "999",
      code: "999"
    });
  });
});
