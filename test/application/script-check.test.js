const dbHandler = require("../db-handler");
const Alert = require("../../server_src/models/Alerts");
const { configureContainer } = require("../../server_src/container");
const DITokens = require("../../server_src/container.tokens");

let container;
let scriptCheckService;

beforeAll(async () => {
  await dbHandler.connect();
  container = configureContainer();
  scriptCheckService = container.resolve(DITokens.scriptCheckService);
});
afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("scriptCheck", () => {
  it("should save ok", async () => {
    // Model validation for trigger, message and scriptLocation
    await expect(async () => await scriptCheckService.save({}, "", "", "")).rejects.toBeTruthy();
    await expect(async () => await scriptCheckService.save({})).rejects.toBeTruthy();

    // TODO Trigger, message and location validation lacking
    await scriptCheckService.save({}, " ", " ", " ");
  });

  it("should edit ok", async () => {
    // Find validation not checked
    const msg = await scriptCheckService.edit({ active: "asd" });
    expect(msg).toBeUndefined();
  });

  it("should check ok", async () => {
    // We have work to do
    await scriptCheckService.check({ active: "asd" }, null, {});
  });

  it("should test ok", async () => {
    // Doesnt report error back
    await scriptCheckService.test({ active: "asd" }, null);
  });

  it("should fire ok", async () => {
    // Doesnt report error back
    await scriptCheckService.fire({ active: "asd" }, null);
  });

  test.skip("should convertMessage ok - .includes error", async () => {
    // Doesnt report error back
    await scriptCheckService.convertMessage({ active: "asd" }, null);
  });

  it("should convertMessage with ok message", async () => {
    // Doesnt report error back
    await scriptCheckService.convertMessage({ active: "asd" }, "null");
    await scriptCheckService.convertMessage({ job: "asd", progress: { completion: true } }, "null");
    await scriptCheckService.convertMessage({ active: "asd" }, "[historyID]");
    await scriptCheckService.convertMessage({ active: "asd" }, "[historyID]", 123);
    await scriptCheckService.convertMessage({ progress: { printTimeLeft: 1 } }, "[ETA]");
    await scriptCheckService.convertMessage(
      { settingsAppearance: { name: "asd" } },
      "[PrinterName]"
    );
    await scriptCheckService.convertMessage({ active: "asd" }, "[PrinterURL]");
    await scriptCheckService.convertMessage({ active: "asd" }, "[PrinterAPIKey]");
    await scriptCheckService.convertMessage({ active: "asd" }, "[TimeRemaining]");
    await scriptCheckService.convertMessage({ active: "asd" }, "[EstimatedTime]");
    await scriptCheckService.convertMessage({ active: "asd" }, "[CurrentZ]");
    await scriptCheckService.convertMessage({ active: "asd" }, "[PercentRemaining]");
    await scriptCheckService.convertMessage({ active: "asd" }, "[CurrentTime]");
    await scriptCheckService.convertMessage({ active: "asd" }, "[CurrentFile]");
    await scriptCheckService.convertMessage({ active: "asd" }, "[CurrentFilePath]");
    await scriptCheckService.convertMessage({ active: "asd" }, "[Tool0Temp]");
    await scriptCheckService.convertMessage({ active: "asd" }, "[BedTemp]");
    await scriptCheckService.convertMessage({ active: "asd" }, "[Error!]");
  });

  it("should edit ok - doesnt", async () => {
    const obj = new Alert({
      active: true,
      trigger: "trigger",
      message: "trigger",
      scriptLocation: "trigger",
      printers: []
    });

    await obj.save();

    // Find validation not checked
    const msg = await scriptCheckService.edit(obj);
    expect(msg).toEqual("saved");
  });
});
