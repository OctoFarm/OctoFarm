const dbHandler = require("../db-handler");
const request = require("supertest");
const { setupTestApp, getServer } = require("../../app-test");

jest.mock("../../server_src/config/auth");

let app = null;
const requestBody = {
  i: "a0a569d20dd308890a1c06",
};

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

describe("Printer Settings Update Endpoint", () => {
  it("should return 400 error when wrong input is provided", async function (done) {
    app = await getOrCreateApp();
    const res = await request(app)
      .post("/printers/updatePrinterSettings")
      .send();

    // Assert input validation failed
    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual({});
    expect(res.res.statusMessage).toEqual("No ID key was provided");

    done();
  }, 10000);

  it("should return 500 if server fails to update printer settings", async function (done) {
    app = await getOrCreateApp();
    const res = await request(app)
      .post("/printers/updatePrinterSettings")
      .send(requestBody);

    // Assert server failed
    expect(res.statusCode).toEqual(500);
    expect(res.body).toEqual({});
    expect(res.res.statusMessage).toContain(
      "The server couldn't update your printer settings!"
    );

    done();
  }, 10000);
});
