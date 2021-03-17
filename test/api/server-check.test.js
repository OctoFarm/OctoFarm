const dbHandler = require("../db-handler");
const request = require("supertest");
const {setupTestApp, getServer} = require("../../app-test");
const isDocker = require("is-docker");

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
  await dbHandler.clearDatabase();
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

jest.mock("../../server_src/runners/githubClient");
const softwareUpdateChecker = require("../../server_src/runners/softwareUpdateChecker");

describe("AmIAlive Endpoint", () => {
  it("should return ok and no update", async () => {
    process.env.npm_package_version = require("../../package.json").version;
    process.env.testlatest_package_version = require("../../package.json").version;
    app = await getOrCreateApp();
    await softwareUpdateChecker.syncLatestOctoFarmRelease();

    const res = await request(app).get("/serverchecks/amialive").send();
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("ok");
    expect(res.body.isDockerContainer).toEqual(isDocker());
    expect(res.body.isPm2).toEqual(false);
    expect(res.body).toHaveProperty("update");
    expect(res.body.update.installed_release_found).toEqual(true);
    expect(res.body.update.update_available).toEqual(false);
  }, 15000);

  it("should look for octofarm update", async () => {
    // Ensure that the update sync has completed by explicit call
    process.env.testlatest_package_version = "0.0.0-TEST";
    process.env.npm_package_version = "1.1.1-TEST";
    app = await getOrCreateApp();
    await softwareUpdateChecker.syncLatestOctoFarmRelease();

    // Perform API action
    const res = await request(app).get("/serverchecks/amialive").send();

    // Assert response
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("update");
    expect(res.body.isDockerContainer).toEqual(isDocker());
    expect(res.body.isPm2).toEqual(false);
    expect(res.body.update.update_available).toEqual(false);
    expect(res.body.update.installed_release_found).toEqual(false);
  }, 15000);

  it("should tolerate undefined package version", async () => {
    // Ensure that the update sync has completed by explicit call
    process.env.testlatest_package_version = "0.0.0-TEST";
    process.env.npm_package_version = undefined;
    app = await getOrCreateApp();
    await softwareUpdateChecker.syncLatestOctoFarmRelease();

    // Perform API action
    const res = await request(app).get("/serverchecks/amialive").send();

    // Assert response
    expect(res.body.update.installed_release_found).toEqual(false);
    expect(res.body.update.update_available).toEqual(false);
  }, 15000);

  it('should tolerate being air-gapped silently', async () => {
    process.env.test_airgapped = true;
    process.env.npm_package_version = undefined;
    app = await getOrCreateApp();
    await softwareUpdateChecker.syncLatestOctoFarmRelease();

    // Perform API action
    const res = await request(app).get("/serverchecks/amialive").send();

    // Assert response
    expect(res.body.update.update_available).toEqual(false);

    delete process.env.test_airgapped;
  });
});
