import { errorTypes } from "./error.types";

//TODO: Needs updating for actual usage.
export const ClientErrors = {
  INVALID_SERVER_RESPONSE: {
    type: errorTypes.SERVER,
    color: "danger",
    code: "INVALID_SERVER_RESPONSE",
    message: "Server redirect detected, invalid api call",
    statusCode: 0
  }
};
