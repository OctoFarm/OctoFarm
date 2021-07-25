export class ApplicationError extends Error {
  static type = {
    APP_NAME: "APP_NAME",
    INTERNAL: "INTERNAL",
    NETWORK: "NETWORK",
    UNKNOWN: "UNKNOWN"
  };

  constructor(options, overrides) {
    super();
    Object.assign(options, overrides);

    if (!ApplicationError.type.hasOwnProperty(options.type)) {
      throw new Error(`ApplicationError: ${options.type} is not a valid type.`);
    }

    if (!options.message) {
      throw new Error("ApplicationError: error message required.");
    }

    if (!options.code) {
      throw new Error("ApplicationError: error code required.");
    }

    this.name = "ApplicationError";
    this.type = options.type;
    this.code = options.code;
    this.message = options.message;
    this.errors = options.errors;
    this.meta = options.meta;
    // {
    //   analytics:  {},
    //   context: {}
    // }
    this.statusCode = options.statusCode;
  }
}
