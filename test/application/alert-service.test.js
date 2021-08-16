const dbHandler = require("../db-handler");
const Alert = require("../../server_src/models/Alerts");
const { configureContainer } = require("../../server_src/container");
const DITokens = require("../../server_src/container.tokens");

let container;
let alertService;
const testAlert = {
  active: true,
  trigger: "value",
  message: "value",
  scriptLocation: "value",
  printer: []
};

beforeAll(async () => {
  await dbHandler.connect();
  container = configureContainer();
  alertService = container.resolve(DITokens.alertService);
});
afterEach(async () => {
  await Alert.deleteMany();
});
afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("AlertService", () => {
  it("should save ok", async () => {
    // Model validation for trigger, message and scriptLocation
    await expect(
      async () => await alertService.create({ trigger: "", message: "", scriptLocation: "" })
    ).rejects.toBeTruthy();
    await expect(async () => await alertService.create({})).rejects.toBeTruthy();

    await alertService.create(testAlert);
  });

  it("should edit ok", async () => {
    const createdAlert = await alertService.create(testAlert);
    // Find validation not checked
    const msg = await alertService.update(createdAlert.id, {
      ...testAlert,
      trigger: "value2"
    });
    expect(msg).toBeDefined();
    expect(msg.trigger).toEqual("value2");
  });

  it("should check ok", async () => {
    // We have work to do
    await alertService.check({ active: "asd" }, null, {});
  });

  it("should execute ok", async () => {
    const createdAlert = await alertService.create(testAlert);
    // Doesnt report error back
    await alertService.executeAlertScript(createdAlert, null);
  });

  test.skip("should convertMessage ok - .includes error", async () => {
    // Doesnt report error back
    await alertService.convertMessage({ active: "asd" }, null);
  });

  it("should convertMessage with ok message", async () => {
    // Doesnt report error back
    await alertService.convertMessage({ active: "asd" }, "null");
    await alertService.convertMessage({ job: "asd", progress: { completion: true } }, "null");
    await alertService.convertMessage({ active: "asd" }, "[historyID]");
    await alertService.convertMessage({ active: "asd" }, "[historyID]", 123);
    await alertService.convertMessage({ progress: { printTimeLeft: 1 } }, "[ETA]");
    await alertService.convertMessage({ settingsAppearance: { name: "asd" } }, "[PrinterName]");
    await alertService.convertMessage({ active: "asd" }, "[PrinterURL]");
    await alertService.convertMessage({ active: "asd" }, "[PrinterAPIKey]");
    await alertService.convertMessage({ active: "asd" }, "[TimeRemaining]");
    await alertService.convertMessage({ active: "asd" }, "[EstimatedTime]");
    await alertService.convertMessage({ active: "asd" }, "[CurrentZ]");
    await alertService.convertMessage({ active: "asd" }, "[PercentRemaining]");
    await alertService.convertMessage({ active: "asd" }, "[CurrentTime]");
    await alertService.convertMessage({ active: "asd" }, "[CurrentFile]");
    await alertService.convertMessage({ active: "asd" }, "[CurrentFilePath]");
    await alertService.convertMessage({ active: "asd" }, "[Tool0Temp]");
    await alertService.convertMessage({ active: "asd" }, "[BedTemp]");
    await alertService.convertMessage({ active: "asd" }, "[Error!]");
  });
});
