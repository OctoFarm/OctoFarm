jest.mock("../../server_src/middleware/auth");

const EventSource = require("eventsource");
const { parse } = require("flatted/cjs");
const dbHandler = require("../db-handler");
const supertest = require("supertest");
const getEndpoints = require("express-list-endpoints");
const { setupTestApp } = require("../../server_src/app-test");
const DITokens = require("../../server_src/container.tokens");

let request;
let sseTask;
const routeBase = "/printers/";
const ssePath = "sse";

beforeAll(async () => {
  await dbHandler.connect();
  const { server, container } = await setupTestApp(true);

  sseTask = container.resolve(DITokens.printerSseTask);

  const endpoints = getEndpoints(server);
  expect(endpoints).toContainEqual({
    methods: ["GET"],
    middleware: ["anonymous", "ensureCurrentUserAndGroup", "memberInvoker"],
    path: routeBase + ssePath
  });
  request = supertest(server);
});

describe("SSE-printersInfo", () => {
  it("should be able to be called with an EventSource", async () => {
    const getRequest = request.get(routeBase + ssePath);
    const url = getRequest.url;
    expect(url).toBeTruthy();

    let firedEvent = false;

    await new Promise(async (resolve) => {
      const es = new EventSource(url);

      es.onmessage = (e) => {
        firedEvent = true;
        expect(parse(e.data)).toEqual({
          printersInformation: [],
          printerControlList: [],
          currentTickerList: []
        });
        es.close();
        resolve();
      };

      await sseTask.run();
    });

    expect(firedEvent).toBeTruthy();
  }, 10000);
});
