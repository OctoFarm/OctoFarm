import { errorTypes } from "./error.types";
import { createErrorAlert, openErrorModal } from "../client-error.modal";

const modalErrors = [errorTypes.NETWORK, errorTypes.SERVER, errorTypes.UNKNOWN];
const popUpErrors = [errorTypes.CLIENT];

export class ApplicationError extends Error {
  static hasErrorNotificationBeenTriggered = false;
  constructor(options, overrides) {
    super();
    Object.assign(options, overrides);

    if (!errorTypes.hasOwnProperty(options.type)) {
      throw new Error(`ApplicationError: ${options.type} is not a valid type.`);
    }

    if (!options.message) {
      throw new Error("ApplicationError: error message required.");
    }

    if (!options.code) {
      throw new Error("ApplicationError: error code required.");
    }

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

    // Show error message to client...
    ApplicationError.hasErrorNotificationBeenTriggered = true;
    if (modalErrors.includes(this.type)) {
      openErrorModal(this);
    }
    if (popUpErrors.includes(this.type)) {
      createErrorAlert(this);
    }
  }
}
