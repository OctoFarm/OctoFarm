const Printer = require("../../server_src/models/Printer");
const { expectValidationError } = require("../extensions");

describe("printer-schema", function () {
  it("should be invalid if sortIndex is not numeric", function (done) {
    const m = new Printer({
      apikey: "asd",
      printerURL: "myawesomeprinter/",
      webSocketURL: "myawesomeprinter/",
      sortIndex: "a"
    });

    m.validate(function (err) {
      expectValidationError(err, ["sortIndex"], true);
      done();
    });
  });

  it("should be valid for required properties", function (done) {
    const m = new Printer({
      apikey: "asd",
      printerURL: "myawesomeprinter/",
      webSocketURL: "myawesomeprinter/",
      sortIndex: "1"
    });

    m.validate(function (err) {
      expect(err).toBeNull();
      done();
    });
  });

  it.skip("should be invalid if URLs, sortIndex, and apiKey properties are empty", function (done) {
    const m = new Printer({});

    m.validate(function (err) {
      expectValidationError(err, ["sortIndex", "webSocketURL", "printerURL", "apikey"], true);
      done();
    });
  });

  it.skip("should be invalid if printer misses sortIndex and webSocketURL", function (done) {
    const m = new Printer({
      printerURL: "myawesomeprinter/",
      apiKey: "asd"
    });

    m.validate(function (err) {
      expectValidationError(err, ["sortIndex", "webSocketURL", "apikey"], true);
      done();
    });
  });
});
