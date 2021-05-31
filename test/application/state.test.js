const dbHandler = require("../db-handler");

beforeAll(async () => {
  await dbHandler.connect();
});

afterEach(async () => {
  await dbHandler.clearDatabase();
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("State", () => {
  jest.mock("../../server_src/services/octoprint/octoprint-api.service");

  it("should init", async () => {
    const {Runner} = require("../../server_src/runners/state");
    await Runner.init();
  });
});
