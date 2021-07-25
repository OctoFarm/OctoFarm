import { errorTypes } from "./error.types";

const HTTPError = {
  // Predefined 4xx http errors
  BAD_REQUEST: {
    type: errorTypes.NETWORK,
    color: "error",
    code: "BAD_REQUEST",
    message: "Bad request",
    statusCode: 400
  },
  UNAUTHORIZED: {
    type: errorTypes.NETWORK,
    color: "error",
    code: "UNAUTHORIZED",
    message: "Unauthorized",
    statusCode: 401
  },
  FORBIDDEN: {
    type: errorTypes.NETWORK,
    color: "error",
    code: "FORBIDDEN",
    message: "Forbidden",
    statusCode: 403
  },
  RESOURCE_NOT_FOUND: {
    type: errorTypes.NETWORK,
    color: "error",
    code: "RESOURCE_NOT_FOUND",
    message: "Resource not found",
    statusCode: 404
  },

  // Predefined 5xx http errors
  INTERNAL_SERVER_ERROR: {
    type: errorTypes.SERVER,
    color: "error",
    code: "INTERNAL_SERVER_ERROR",
    message: "Something went wrong, Please try again later.",
    statusCode: 500
  },
  BAD_GATEWAY: {
    type: errorTypes.SERVER,
    color: "error",
    code: "BAD_GATEWAY",
    message: "Bad gateway",
    statusCode: 502
  },
  SERVICE_UNAVAILABLE: {
    type: errorTypes.SERVER,
    color: "error",
    code: "SERVICE_UNAVAILABLE",
    message: "Service unavailable",
    statusCode: 503
  },
  GATEWAY_TIMEOUT: {
    type: errorTypes.SERVER,
    color: "error",
    code: "GATEWAY_TIMEOUT",
    message: "Gateway timeout",
    statusCode: 504
  }
};

export { HTTPError };
