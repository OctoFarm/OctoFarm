export class ApplicationError extends Error {
  static hasErrorNotificationBeenTriggered = false;
  constructor(options, overrides) {
    super();
    Object.assign(options, overrides);

    this.name = "OctoFarm Error";
    this.type = options.type;
    this.code = options.code;
    this.message = options.message;
    this.errors = options.errors;
    this.meta = options.meta;
    this.statusCode = options.statusCode;
    this.color = options.color;
    // {
    //   analytics:  {},
    //   context: {}
    // }

    // Trigger Error Notification
    ApplicationError.hasErrorNotificationBeenTriggered = true;
  }
}
