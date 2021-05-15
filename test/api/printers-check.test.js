const dbHandler = require("../db-handler");
const request = require("supertest");
const { setupTestApp, getServer } = require("../../app-test");
const passport = require("passport");

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
  it("should return 302 redirect when no user is logged in", async function (done) {
    process.env.npm_package_version = require("../../package.json").version;
    process.env.testlatest_package_version = require("../../package.json").version;
    app = await getOrCreateApp();
    const res = await request(app)
      .post("/printers/updatePrinterSettings")
      .send();
    expect(res.statusCode).toEqual(302);
    done();
  }, 10000);
});
