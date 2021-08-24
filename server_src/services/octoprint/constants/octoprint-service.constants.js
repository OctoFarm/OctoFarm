class OPClientErrors {
  static filamentIDNotANumber = "FilamentID provided was not numeric";

  static printerValidationErrorMessage = "printer apiKey or URL undefined";
}

const contentTypeHeaderKey = "Content-Type";
const apiKeyHeaderKey = "X-Api-Key";
const jsonContentType = "application/json";

// TODO ofc this is lazy - but I'd rather have working code and optimize later
function getCurrentProfileDefault() {
  return {
    id: "_default",
    name: "Default",
    color: "default",
    model: "Generic RepRap Printer",
    default: true,
    current: true,
    resource: "http://example.com/api/printerprofiles/_default",
    volume: {
      formFactor: "rectangular",
      origin: "lowerleft",
      width: 200,
      depth: 200,
      height: 200
    },
    heatedBed: true,
    heatedChamber: false,
    axes: {
      x: {
        speed: 6000,
        inverted: false
      },
      y: {
        speed: 6000,
        inverted: false
      },
      z: {
        speed: 200,
        inverted: false
      },
      e: {
        speed: 300,
        inverted: false
      }
    },
    extruder: {
      count: 1,
      offsets: [{ x: 0.0, y: 0.0 }]
    }
  };
}

module.exports = {
  OPClientErrors,
  contentTypeHeaderKey,
  apiKeyHeaderKey,
  jsonContentType,
  getCurrentProfileDefault
};
