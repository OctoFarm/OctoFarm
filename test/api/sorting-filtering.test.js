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
const updateFilterRoute = routeBase + "/filter";
const updateSortingRoute = routeBase + "/sorting";

beforeAll(async () => {
  await dbHandler.connect();
  const { server, container: testContainer } = await setupTestApp();
  container = testContainer;

  const endpoints = getEndpoints(server);
  expect(endpoints).toContainEqual({
    methods: ["PATCH"],
    middleware: ["anonymous", "memberInvoker"],
    path: `${updateFilterRoute}/:filter`
  });
  expect(endpoints).toContainEqual({
    methods: ["PATCH"],
    middleware: ["anonymous", "memberInvoker"],
    path: `${updateSortingRoute}/:sorting`
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
    const response = await request.patch(updateFilterRoute + "/filterstring").send();
    expect(response.statusCode).toEqual(200);

    const cache = container.resolve(DITokens.sortingFilteringCache);
    const filtering = cache.getFilter();
    expect(filtering).toEqual("filterstring");
  });
});

describe("Sorting", () => {
  const updateSortingGetRoute = updateSortingRoute + "/sortingstring";

  it("should default to defaultFilterBy constant", async () => {
    const cache = container.resolve(DITokens.sortingFilteringCache);
    const sorting = cache.getSorting();
    expect(sorting).toEqual(defaultSortBy);
  });

  // TODO this test shows that this API endpoint is weakly constrained
  it("should be able to update sorting with route child as param", async () => {
    const response = await request.patch(updateSortingGetRoute).send();
    expect(response.statusCode).toEqual(200);

    const cache = container.resolve(DITokens.sortingFilteringCache);
    const sorting = cache.getSorting();
    expect(sorting).toEqual("sortingstring");
  });
});
