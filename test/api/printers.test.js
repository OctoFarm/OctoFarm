jest.mock("../../server_src/middleware/auth");

const dbHandler = require("../db-handler");
const supertest = require("supertest");
const { AppConstants } = require("../../server_src/app.constants");
const { setupTestApp } = require("../../server_src/app-test");
const { expectInvalidResponse, expectOkResponse } = require("../extensions");
const Printer = require("../../server_src/models/Printer");

let request;

const printerRoute = AppConstants.apiRoute + "/printer";
const getRoute = printerRoute;
const deleteRoute = printerRoute;
const createRoute = printerRoute;
const refreshSettingsRoute = printerRoute + "/refreshSettings";
const updateRoute = printerRoute;

beforeAll(async () => {
  await dbHandler.connect();
  const { server, container } = await setupTestApp(true);

  request = supertest(server);
});

beforeEach(async () => {
  Printer.deleteMany({});
});

describe("PrintersController", () => {
  // TODO this API endpoint is doing unexpected stuff
  it(`should not be able to POST ${createRoute} - invalid apiKey`, async () => {
    const response = await request.post(createRoute).send({
      settingsAppearance: null,
      printerURL: "http://url.com",
      apiKey: "notcorrect",
      tempTriggers: { heatingVariation: null }
    });
    expectInvalidResponse(response, ["apiKey"]);
  });

  it(`should be able to POST ${createRoute}`, async () => {
    const response = await request.post(createRoute).send({
      printerURL: "http://url.com",
      apiKey: "octofarmoctofarmoctofarmoctofarm",
      tempTriggers: { heatingVariation: null }
    });
    expectOkResponse(response, {
      printerState: {
        printerURL: expect.any(String)
      }
    });
  });

  // TODO this API endpoint is doing unexpected stuff, should throw not-found error and not result in 'printersAdded' prop as this is misleading
  it(`should not be able to POST ${updateRoute} - missing printer field`, async () => {
    const response = await request.patch(`${updateRoute}/asd/connection`).send({});

    expectInvalidResponse(response, ["printer"], false);
  });

  it(`should not be able to DELETE ${deleteRoute} - nonexistent id`, async () => {
    const response = await request.delete(`${deleteRoute}/non-id`).send();
    expectInvalidResponse(response, ["id"], true);
  });

  it(`should be able to DELETE ${deleteRoute} - existing id`, async () => {
    const createResponse = await request.post(createRoute).send({
      printerURL: "http://url.com",
      apiKey: "octofarmoctofarmoctofarmoctofarm",
      tempTriggers: { heatingVariation: null }
    });
    const body = expectOkResponse(createResponse, { printerState: expect.anything() });

    const deletionResponse = await request.delete(`${deleteRoute}/${body.printerState._id}`).send();
    expectOkResponse(deletionResponse, { printerRemoved: expect.anything() });
  });

  it("should return printer list when no Id is provided", async function () {
    const response = await request.get(getRoute).send();

    expectOkResponse(response);
  }, 10000);

  it("should return no printer Info entry when Id is provided but doesnt exist", async function () {
    const res = await request.get(getRoute + "asd").send();

    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual({});
  }, 10000);

  it("should return 400 error when wrong input is provided", async function () {
    const res = await request.post(refreshSettingsRoute).send();

    // Assert input validation failed
    // TODO This is actually missing node-input-validation
    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual({});
    expect(res.res.statusMessage).toEqual("No ID key was provided");
  }, 10000);

  it("should return 500 if server fails to refresh printer settings", async function () {
    const requestBody = {
      i: "a0a569d20dd308890a1c06"
    };
    const res = await request.post(refreshSettingsRoute).send(requestBody);

    // Assert server failed
    // TODO This is actually a cheat way out...
    expect(res.statusCode).toEqual(500);
    expect(res.body).toEqual({});
    expect(res.res.statusMessage).toContain("The server couldn't update your printer settings!");
  }, 10000);
});
