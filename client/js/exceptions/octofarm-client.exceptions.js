import { errorTypes } from "./error.types";

export const ClientErrors = {
  FAILED_VALIDATION_PATH: {
    type: errorTypes.CLIENT,
    color: "danger",
    code: "FAILED_VALIDATION_PATH",
    message: "Input validation failed, no path was supplied",
    statusCode: 412,
  },
  FAILED_VALIDATION_KEY: {
    type: errorTypes.CLIENT,
    color: "danger",
    code: "FAILED_VALIDATION_KEY",
    message: "Input validation failed, no key was supplied",
    statusCode: 412,
  },
  FAILED_STATE_UPDATE: {
    type: errorTypes.CLIENT,
    color: "warning",
    code: "FAILED_STATE_UPDATE",
    message: "There was an issue updating the printer state",
    statusCode: 412,
  },
  UNKNOWN_ERROR: {
    type: errorTypes.UNKNOWN,
    color: "danger",
    code: "UNKNOWN_ERROR",
    message:
      "We encountered an unknown error! Please help the developer out and send a issue report!",
    statusCode: 999,
  },
  SILENT_ERROR: {
    type: errorTypes.UNKNOWN,
    color: "danger",
    code: "SILENT_ERROR",
    message: "",
    statusCode: 999,
  },
};
