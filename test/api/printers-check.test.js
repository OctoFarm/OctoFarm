const dbHandler = require("../db-handler");
const request = require("supertest");
const { setupTestApp, getServer } = require("../../app-test");

jest.mock("../../server_src/config/auth");
let app = null;
/**
 * Connect to a new in-memory database before running any tests.
 */
beforeAll(async () => {
  await dbHandler.connect();
});

/**
 * Clear all test data after every test.
 */
afterEach(async () => {
  //await dbHandler.clearDatabase();
});

/**
 * Remove and close the db and server.
 */
afterAll(async () => {
  if (!!app) {
    getServer().close();
  }
  await dbHandler.closeDatabase();
  jest.clearAllTimers();
});

async function getOrCreateApp() {
  if (!app) {
    app = await setupTestApp();
  }
  return app;
}

describe("Printer Update Endpoint", () => {
  it("should return 400 error when wrong input is provided", async function (done) {
    app = await getOrCreateApp();
    const res = await request(app)
      .post("/printers/updatePrinterSettings")
      .send();

    // Assert input validation failed
    expect(res.statusCode).toEqual(400);

    done();
  }, 10000);
});
