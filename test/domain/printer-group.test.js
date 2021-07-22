const PrinterGroup = require("../../server_src/models/PrinterGroup");

describe("printer group", function () {
  it("should be invalid if name is empty", () => {
    const m = new PrinterGroup();

    const errors = m.validateSync();
    expect(errors.name).toBeTruthy();
  });

  it("should be valid if printers array is empty", () => {
    const m = new PrinterGroup({
      name: "TestPrinterGroup"
    });

    const errors = m.validateSync();
    expect(errors).toBeFalsy();
  });
});
