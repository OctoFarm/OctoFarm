const request = require("supertest");
const { setupTestApp, getServer } = require("../../app-test");
const isDocker = require("is-docker");

let app = null;

/**
 * Remove and close the db and server.
 */
afterAll(async () => {
  if (!!app) {
    getServer().close();
  }
  jest.clearAllTimers();
});

async function getOrCreateApp() {
  if (!app) {
    app = await setupTestApp();
  }
  return app;
}

jest.mock("../../server_src/runners/githubClient");

describe("DatabaseIssue server", () => {
  it("should return database issue page when no database is connected", async () => {
    // app = await getOrCreateApp();

    // const res = await request(app).get("/").send();
    // expect(res.statusCode).toEqual(200);
  }, 15000);
});