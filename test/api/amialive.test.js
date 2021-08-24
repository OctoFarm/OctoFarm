const dbHandler = require("../db-handler");
const supertest = require("supertest");
const getEndpoints = require("express-list-endpoints");
const { setupTestApp } = require("../../server_src/app-test");
const isDocker = require("is-docker");
const { AppConstants } = require("../../server_src/app.constants");

let request;
let testContainer;
let softwareUpdateChecker;

require("../../server_src/services/octofarm-update.service");
const DITokens = require("../../server_src/container.tokens");
const awilix = require("awilix");
const AxiosMock = require("../provisioning/axios.mock");
const GithubApiServiceMock = require("../provisioning/github-api.mock");

const testRoute = "/api/amialive";

beforeAll(async () => {
  await dbHandler.connect();
  const { server, container } = await setupTestApp();
  testContainer = container;
  container.register(DITokens.httpClient, awilix.asClass(AxiosMock));
  container.register(DITokens.githubApiService, awilix.asClass(GithubApiServiceMock));
  request = supertest(server);

  const endpoints = getEndpoints(server);
  expect(endpoints).toContainEqual({
    methods: ["GET"],
    middleware: ["ensureCurrentUserAndGroup", "memberInvoker"],
    path: testRoute
  });
});

beforeEach(() => {
  softwareUpdateChecker = testContainer.resolve(DITokens.octofarmUpdateService);
});

describe("AmIAliveController", () => {
  it("should return ok and no update", async () => {
    process.env[AppConstants.VERSION_KEY] = require("../../package.json").version;
    process.env.testlatest_package_version = require("../../package.json").version;

    await softwareUpdateChecker.syncLatestOctoFarmRelease();

    const res = await request.get(testRoute).send();
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
    process.env[AppConstants.VERSION_KEY] = "1.1.1-TEST";

    await softwareUpdateChecker.syncLatestOctoFarmRelease();

    // Perform API action
    const res = await request.get(testRoute).send();

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
    process.env[AppConstants.VERSION_KEY] = undefined;

    await softwareUpdateChecker.syncLatestOctoFarmRelease();

    // Perform API action
    const res = await request.get(testRoute).send();

    // Assert response
    expect(res.body.update.installed_release_found).toEqual(false);
    expect(res.body.update.update_available).toEqual(false);
  }, 15000);

  it("should tolerate being air-gapped silently", async () => {
    process.env.test_airgapped = true;
    process.env[AppConstants.VERSION_KEY] = undefined;

    await softwareUpdateChecker.syncLatestOctoFarmRelease();

    // Perform API action
    const res = await request.get(testRoute).send();

    // Assert response
    expect(res.statusCode).toEqual(200);
    expect(res.body.update.update_available).toEqual(false);

    delete process.env.test_airgapped;
  });
});
