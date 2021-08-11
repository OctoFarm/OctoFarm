const supertest = require("supertest");
jest.mock("../../server_src/services/github-client.service");

const { setupExpressServer } = require("../../server_src/app-core");
const { setupEnvConfig } = require("../../server_src/app-env");
const { serveDatabaseIssueFallbackRoutes } = require("../../server_src/app-fallbacks");

let server;

async function setupDatabaseIssueApp() {
  setupEnvConfig(true);

  let { app, container } = setupExpressServer();
  server = app;
  await serveDatabaseIssueFallbackRoutes(server);
}

describe("DatabaseIssue server", () => {
  it("should return database issue page when no database is connected", async () => {
    await setupDatabaseIssueApp();

    const res = await supertest(server).get("/").send();
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain(
      "Docker mode:\n" + '                    <span class="badge badge-dark">false</span>'
    );
    expect(res.text).toContain(
      'const defaultMongoDBString = "mongodb://127.0.0.1:27017/octofarm";'
    );
  }, 15000);
});
