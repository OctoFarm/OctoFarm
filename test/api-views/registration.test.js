const dbHandler = require("../db-handler");
const supertest = require("supertest");
const getEndpoints = require("express-list-endpoints");
const { setupTestApp } = require("../../server_src/app-test");

let request;

beforeAll(async () => {
  await dbHandler.connect();
  const { server } = await setupTestApp();

  expect(getEndpoints(server)).toContainEqual({
    methods: ["GET", "POST"],
    middleware: ["memberInvoker"],
    path: "/users/register"
  });
  request = supertest(server);
});

describe("RegisterView", () => {
  const usersBase = "/users";
  const registerRoute = usersBase + "/register";

  it("should be able to load registration", async () => {
    const response = await request.get(registerRoute).send();
    expect(response.statusCode).toEqual(200);
    expect(response.headers.location).toBeUndefined();
  });
});
