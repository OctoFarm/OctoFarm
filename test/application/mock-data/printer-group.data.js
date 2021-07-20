/**
 * Mock data
 */
module.exports.PrinterGroupMockData = class PrinterGroupMockData {
  static get PrinterMock() {
    return {
      name: "Printuh",
      printerURL: "test",
      apikey: "IwontfailYou"
    };
  }

  static get PrinterMockWithGroup() {
    return {
      name: "Printuh",
      printerURL: "test",
      apikey: "IwontfailYou",
      group: "testGroupName"
    };
  }

  static get PrinterGroupMock() {
    return {
      name: "Laser Jets",
      printers: []
    };
  }
};
