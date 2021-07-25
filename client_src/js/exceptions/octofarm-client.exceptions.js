import { errorTypes } from "./error.types";

export const ClientErrors = {
  FAILED_VALIDATION: {
    type: errorTypes.CLIENT,
    color: "danger",
    code: "FAILED_VALIDATION_PATH",
    message: "Input validation failed, no path was supplied",
    statusCode: 412
  },
  FAILED_STATE_UPDATE: {
    type: errorTypes.CLIENT,
    color: "warning",
    code: "FAILED_STATE_UPDATE",
    message: "There was an issue updating the printer state",
    statusCode: 412
  }
};
