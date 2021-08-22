export class ClientError extends Error {
  constructor(options, overrides) {
    super();
    Object.assign(options, overrides);

    this.name = "OctoFarm Client Error";
    this.type = options.type;
    this.code = options.code;
    this.message = options.message;
    this.statusCode = options.statusCode;
    this.color = options.color;
  }
}
