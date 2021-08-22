export class ServerError extends Error {
  constructor(options, serverResponse, overrides) {
    super();
    Object.assign(options, overrides);
    this.name = "OctoFarm Server Error!";
    this.type = options.type;
    this.code = options.code;
    this.message = options.message;
    this.meta = options.meta;
    this.statusCode = options.statusCode;
    this.color = options.color;
    this.serverResponse = serverResponse;
  }
}
