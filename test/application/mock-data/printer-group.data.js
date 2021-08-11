/**
 * Mock data
 */
module.exports.PrinterGroupMockData = class PrinterGroupMockData {
  static get PrinterMock() {
    return {
      name: "Printuh",
      printerURL: "http://test.com/",
      webSocketURL: "ws://test/",
      apiKey: "asdasasdasdasdasdasdasdasdasdasd"
    };
  }

  static get PrinterMockWithGroup() {
    return {
      name: "Printuh",
      printerURL: "http://test.com/",
      webSocketURL: "ws://test/",
      apiKey: "asdasdasdasdasdasdasdasdasdasdas",
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
