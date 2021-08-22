import { errorTypes } from "./error.types";

const PrinterApiErrors = {
  // Predefined 4xx http errors
  BAD_REQUEST: {
    type: errorTypes.CLIENT,
    color: "danger",
    code: "BAD_REQUEST",
    message: "OctoFarm has made a bad request...",
    statusCode: 400,
    notification_timeout: 4000
  },
  UNAUTHORIZED: {
    type: errorTypes.CLIENT,
    color: "danger",
    code: "UNAUTHORIZED",
    message: "Unauthorized",
    statusCode: 401,
    notification_timeout: 4000
  },
  FORBIDDEN: {
    type: errorTypes.CLIENT,
    color: "danger",
    code: "FORBIDDEN",
    message: "You are forbidden from accessing this resource",
    statusCode: 403,
    notification_timeout: 4000
  },
  RESOURCE_NOT_FOUND: {
    type: errorTypes.CLIENT,
    color: "danger",
    code: "RESOURCE_NOT_FOUND",
    message: "Resource not found",
    statusCode: 404,
    notification_timeout: 4000
  },
  CONFLICT: {
    type: errorTypes.CLIENT,
    color: "danger",
    code: "CONFLICT",
    message: "There was a conflict with the following request",
    statusCode: 409,
    notification_timeout: 4000
  },
  UNSUPPORTED_MEDIA_TYPE: {
    type: errorTypes.CLIENT,
    color: "danger",
    code: "UNSUPPORTED_MEDIA_TYPE",
    message: "The media type was rejected by the client",
    statusCode: 415,
    notification_timeout: 4000
  },
  NO_CONNECTION: {
    type: errorTypes.PRINTER,
    color: "danger",
    code: "NO_CONNECTION",
    message: "No connection to resource available",
    statusCode: 0,
    notification_timeout: 4000
  },

  // Predefined 5xx http errors
  INTERNAL_SERVER_ERROR: {
    type: errorTypes.PRINTER,
    color: "danger",
    code: "INTERNAL_SERVER_ERROR",
    message: "Something went wrong, Please try again later.",
    statusCode: 500,
    notification_timeout: 4000
  },
  BAD_GATEWAY: {
    type: errorTypes.PRINTER,
    color: "danger",
    code: "BAD_GATEWAY",
    message: "Bad gateway",
    statusCode: 502,
    notification_timeout: 4000
  },
  SERVICE_UNAVAILABLE: {
    type: errorTypes.PRINTER,
    color: "danger",
    code: "SERVICE_UNAVAILABLE",
    message: "Service unavailable",
    statusCode: 503,
    notification_timeout: 4000
  },
  GATEWAY_TIMEOUT: {
    type: errorTypes.PRINTER,
    color: "danger",
    code: "GATEWAY_TIMEOUT",
    message: "Gateway timeout",
    statusCode: 504,
    notification_timeout: 4000
  },
  UNKNOWN: {
    type: errorTypes.PRINTER,
    color: "danger",
    code: "UNKNOWN",
    message: "Unknown Error Response: ",
    statusCode: 999,
    notification_timeout: 4000
  }
};

export { PrinterApiErrors };
