jest.mock("../../../server_src/services/octoprint/octoprint-api.service");
const dbHandler = require("../../db-handler");
const DITokens = require("../../../server_src/container.tokens");
const { configureContainer } = require("../../../server_src/container");
const { getSystemChecksDefault } = require("../../../server_src/constants/state.constants");
const { ensureSystemSettingsInitiated } = require("../../../server_src/app-core");
const { ValidationException } = require("../../../server_src/exceptions/runtime.exceptions");

let container;
let printersStore;
let filesStore;

beforeAll(async () => {
  await dbHandler.connect();
  container = configureContainer();
  await ensureSystemSettingsInitiated(container);

  printersStore = container.resolve(DITokens.printersStore);
  filesStore = container.resolve(DITokens.filesStore);
  await printersStore.loadPrintersStore();
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("PrintersStore", () => {
  const invalidNewPrinter = {
    apiKey: "asd",
    webSocketURL: null,
    printerURL: null,
    camURL: null
  };

  const weakNewPrinter = {
    apiKey: "asdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasd",
    webSocketURL: "http://192.168.1.0:81",
    printerURL: "http://192.168.1.0"
  };

  const weakNewPrinter2 = {
    apiKey: "1C0KVOKWEAKWEAK8VBGAR",
    webSocketURL: "http://192.168.1.0:81",
    printerURL: "http://192.168.1.0"
  };

  const validNewPrinter = {
    apiKey: "asdasasdasdasdasdasdasdasdasdasd",
    webSocketURL: "ws://asd.com/",
    printerURL: "https://asd.com:81",
    camURL: "http://asd.com:81"
  };

  it("should return with empty octoprint versions array", async () => {
    const returnedStats = await printersStore.getOctoPrintVersions();
    expect(returnedStats).toEqual([]);
  });

  it("should avoid adding invalid printer", async () => {
    await expect(async () => await printersStore.addPrinter({})).rejects.toBeInstanceOf(
      ValidationException
    );

    expect(() => printersStore.addPrinter(invalidNewPrinter)).rejects.toHaveErrors({
      apiKey: {
        rule: "length"
      },
      webSocketURL: {
        rule: "required"
      }
    });

    await expect(async () => await printersStore.addPrinter(weakNewPrinter)).rejects.toBeInstanceOf(
      ValidationException
    );

    await expect(async () => await printersStore.addPrinter(weakNewPrinter2)).rejects.toBeDefined();
  });

  it("should be able to add printer - receiving an state object back", async () => {
    let frozenObject = await printersStore.addPrinter(validNewPrinter);
    expect(Object.isFrozen(frozenObject)).toBeFalsy();

    // Need the store in order to have files to refer to
    await filesStore.loadFilesStore();

    const flatState = frozenObject.toFlat();
    expect(Object.isFrozen(flatState)).toBeTruthy();

    expect(flatState).toMatchObject({
      _id: expect.any(String),
      printerState: {
        state: expect.any(String),
        desc: expect.any(String),
        colour: {
          category: expect.any(String),
          hex: expect.any(String),
          name: expect.any(String)
        }
      },
      hostState: {
        state: expect.any(String),
        desc: expect.any(String),
        colour: {
          category: expect.any(String),
          hex: expect.any(String),
          name: expect.any(String)
        }
      },
      webSocketState: {
        desc: expect.any(String),
        colour: expect.any(String) // ?
      },
      stepSize: expect.any(Number),
      systemChecks: getSystemChecksDefault(),
      alerts: null
    });
  });
});
