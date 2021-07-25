import { errorTypes } from "./error.types";

export const ClientErrors = {
  FAILED_VALIDATION: {
    type: errorTypes.CLIENT,
    color: "danger",
    code: "FAILED_VALIDATION_PATH",
    message: "Input validation failed, no path was supplied",
    statusCode: 412
  }
};
