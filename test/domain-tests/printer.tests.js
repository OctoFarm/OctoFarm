const Printer = require("../../server_src/models/Printer");
const expect = require("chai").expect;

describe("printer", function () {
  it("should be invalid if printerURL is empty", function (done) {
    const m = new Printer();

    m.validate(function (err) {
      expect(err.errors.printerURL).to.exist;
      done();
    });
  });

  it("should be invalid if printerURL ends with slash", function (done) {
    const m = new Printer({
      printerURL: "myawesomeprinter/",
    });

    m.validate(function (err) {
      expect(err.errors.printerURL).to.exist;
      expect(err.errors.printerURL).to.not.contain("myawesomeprinter/");
      expect(err.errors.printerURL).to.eq("myawesomeprinter");
      done();
    });
  });
});
