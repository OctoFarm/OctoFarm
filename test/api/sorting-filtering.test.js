jest.mock("../../server_src/middleware/auth");

const dbHandler = require("../db-handler");
const supertest = require("supertest");
const getEndpoints = require("express-list-endpoints");
const DITokens = require("../../server_src/container.tokens");
const {
  defaultFilterBy,
  defaultSortBy
} = require("../../server_src/constants/filter-sorting.constants");
const { setupTestApp } = require("../../server_src/app-test");

let request;
let container;

const routeBase = "/api/client";
const updateFilterGetRoute = routeBase + "/updateFilter/filterstring";

beforeAll(async () => {
  await dbHandler.connect();
  const { server, container: testContainer } = await setupTestApp();
  container = testContainer;

  const endpoints = getEndpoints(server);
  expect(endpoints).toContainEqual({
    methods: ["GET"],
    middleware: ["anonymous", "memberInvoker"],
    path: `${routeBase}/updateFilter/:filter`
  });
  expect(endpoints).toContainEqual({
    methods: ["GET"],
    middleware: ["anonymous", "memberInvoker"],
    path: `${routeBase}/updateSorting/:sorting`
  });
  request = supertest(server);
});

describe("Filter", () => {
  it("should default to defaultFilterBy constant", async () => {
    const cache = container.resolve(DITokens.sortingFilteringCache);
    const filtering = cache.getFilter();
    expect(filtering).toEqual(defaultFilterBy);
  });

  // TODO this test shows that this API endpoint is weakly constrained
  it("should be able to update filter with route child as param", async () => {
    const response = await request.get(updateFilterGetRoute).send();
    expect(response.statusCode).toEqual(200);

    const cache = container.resolve(DITokens.sortingFilteringCache);
    const filtering = cache.getFilter();
    expect(filtering).toEqual("filterstring");
  });
});

describe("Sorting", () => {
  const updateSortingGetRoute = routeBase + "/updateSorting/sortingstring";

  it("should default to defaultFilterBy constant", async () => {
    const cache = container.resolve(DITokens.sortingFilteringCache);
    const sorting = cache.getSorting();
    expect(sorting).toEqual(defaultSortBy);
  });

  // TODO this test shows that this API endpoint is weakly constrained
  it("should be able to update sorting with route child as param", async () => {
    const response = await request.get(updateSortingGetRoute).send();
    expect(response.statusCode).toEqual(200);

    const cache = container.resolve(DITokens.sortingFilteringCache);
    const sorting = cache.getSorting();
    expect(sorting).toEqual("sortingstring");
  });
});
