const dbHandler = require("../db-handler");
const supertest = require("supertest");
jest.mock("../../server_src/middleware/auth");
const { setupTestApp } = require("../../server_src/app-test");

let request;

beforeAll(async () => {
  await dbHandler.connect();
  const { server, container } = await setupTestApp(true);
  request = supertest(server);
});

describe("AppController", () => {
  it("should load welcome page in case of missing authentication", async () => {
    const response = await request.get("/").send();

    expect(response.statusCode).toEqual(200);
    expect(response.headers.location).toBeUndefined();
    // response.url
  });

  it("should load dashboard", async () => {
    const response = await request.get("/dashboard").send();

    expect(response.headers.location).not.toBe("/users/login");
    expect(response.headers.location).toBeUndefined();
    expect(response.statusCode).toEqual(200);
  });
});
