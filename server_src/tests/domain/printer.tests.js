const Printer = require("../../models/Printer");
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
      printerURL: "http://myawesomeprinter/",
    });

    m.validate(function (err) {
      expect(err.errors.printerURL).to.exist;
      done();
    });
  });
});
