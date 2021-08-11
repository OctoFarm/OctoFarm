const printerGroupModel = require("../../server_src/models/PrinterGroup");
const dbHandler = require("../db-handler");
const DITokens = require("../../server_src/container.tokens");
const { configureContainer } = require("../../server_src/container");
const { PrinterGroupMockData } = require("./mock-data/printer-group.data");

let printerService;
let printerGroupService;

beforeAll(async () => {
  await dbHandler.connect();
  const container = configureContainer();
  printerService = container.resolve(DITokens.printerService);
  printerGroupService = container.resolve(DITokens.printerGroupService);
});
afterEach(async () => {
  await dbHandler.clearDatabase();
});
afterAll(async () => {
  await dbHandler.closeDatabase();
});

/**
 * PrinterGrouoService test suite.
 */
describe("printerGroup ", () => {
  /**
   * Tests that a valid printer group can be created through the printerGrouoService without throwing any errors.
   */
  it("can be created correctly with printer", async () => {
    // Seed with a mock Printer DTO
    const newPrinterData = PrinterGroupMockData.PrinterMock;
    const createdPrinter = await printerService.create(newPrinterData);
    expect(createdPrinter._id).toBeTruthy();

    // Prepare the CRUD DTO
    const newPrinterGroup = PrinterGroupMockData.PrinterGroupMock;
    newPrinterGroup.printers.push(createdPrinter._id);

    // Create it
    await printerGroupService.create(newPrinterGroup);

    // Assert creation
    const createdPrinterGroup = await printerGroupModel.findOne();
    expect(createdPrinterGroup).toBeTruthy();
  });

  it("can be synced by unique printer's group values", async () => {
    const newPrinterData = PrinterGroupMockData.PrinterMockWithGroup;
    const createdPrinter = await printerService.create(newPrinterData);
    expect(createdPrinter._id).toBeTruthy();

    const groups = await printerGroupService.syncPrinterGroups();
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveProperty("printers");
    expect(groups[0].printers).toContainEqual(createdPrinter._id);
    expect(groups.errors).toBeFalsy();
  });

  it("can be synced with multiple printer's with the same group", async () => {
    const newPrinterData = PrinterGroupMockData.PrinterMockWithGroup;
    const createdPrinter = await printerService.create(newPrinterData);
    expect(createdPrinter._id).toBeTruthy();
    const createdPrinter2 = await printerService.create(newPrinterData);
    expect(createdPrinter2._id).toBeTruthy();
    expect(createdPrinter2._id).toB;

    const groups = await printerGroupService.syncPrinterGroups();
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveProperty("printers");
    expect(groups[0].printers).toHaveLength(2);
    expect(groups[0].printers).toContainEqual(createdPrinter._id);
    expect(groups.errors).toBeFalsy();
  });

  it("can be synced with multiple printer's with multiple groups", async () => {
    const newPrinterData = PrinterGroupMockData.PrinterMockWithGroup;
    const createdPrinter = await printerService.create(newPrinterData);
    expect(createdPrinter._id).toBeTruthy();
    newPrinterData.group = "anotherdifferentGroupName";
    const createdPrinter2 = await printerService.create(newPrinterData);
    expect(createdPrinter2._id).toBeTruthy();
    expect(createdPrinter2._id).toB;

    const groups = await printerGroupService.syncPrinterGroups();
    expect(groups).toHaveLength(2);
    expect(groups[0]).toHaveProperty("printers");
    expect(groups[0].printers).toHaveLength(1);
    expect(groups[1].printers).toHaveLength(1);
    expect(groups[0].printers).toContainEqual(createdPrinter._id);
    expect(groups.errors).toBeFalsy();
  });

  it("return empty array if no groups or printers are present to sync up", async () => {
    const groups = await printerGroupService.syncPrinterGroups();
    expect(groups).toHaveLength(0);
    expect(groups.errors).toBeFalsy();
  });
});
