jest.mock("../../server_src/config/auth");

const dbHandler = require("../db-handler");
const supertest = require("supertest");
const { setupTestApp } = require("../../app-test");

let request;

beforeAll(async () => {
  await dbHandler.connect();
  const server = await setupTestApp();

  request = supertest(server);
});

describe("Printers", () => {
  it("should return printer Info list when no Id is provided", async function (done) {
    const res = await request
        .post("/printers/printerInfo")
        .send();

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual([]);

    done();
  }, 10000);

  it("should return no printer Info entry when Id is provided but doesnt exist", async function (done) {
    const res = await request
        .post("/printers/printerInfo")
        .send({
          i: 'asd'
        });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({});

    done();
  }, 10000);
});
