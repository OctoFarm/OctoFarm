/**
 * Mock data
 */
module.exports.PrinterGroupMockData = class PrinterGroupMockData {
  static get PrinterMock() {
    return {
      name: "Printuh",
      sortIndex: 0,
      webSocketURL: "test",
      printerURL: "test",
      apikey: "IwontfailYou"
    };
  }

  static get PrinterMockWithGroup() {
    return {
      name: "Printuh",
      sortIndex: 0,
      printerURL: "test",
      webSocketURL: "test",
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
