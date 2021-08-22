export class PrinterClientError extends Error {
  constructor(options, overrides) {
    super();
    Object.assign(options, overrides);

    this.type = options.type;
    this.code = options.code;
    this.message = options.message;
    this.statusCode = options.statusCode;
    this.color = options.color;
  }
}
