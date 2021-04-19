const request = require("supertest");
const { setupDatabaseIssueApp, getServer } = require("../../app-test");
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

async function getOrCreateDatabaseIssueApp() {
  if (!app) {
    app = await setupDatabaseIssueApp();
  }
  return app;
}

jest.mock("../../server_src/runners/githubClient");

describe("DatabaseIssue server", () => {
  it("should return database issue page when no database is connected", async () => {
    app = await getOrCreateDatabaseIssueApp();

    const res = await request(app).get("/").send();
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain("Docker mode:\n" +
      "                    <span class=\"badge badge-dark\">false</span>");
    expect(res.text).toContain("const defaultMongoDBString = \"mongodb://127.0.0.1:27017/octofarm\";");
  }, 15000);
});