import { errorTypes } from "./error.types";

export const ClientErrors = {
  INVALID_SERVER_RESPONSE: {
    type: errorTypes.CLIENT,
    color: "danger",
    code: "INVALID_SERVER_RESPONSE",
    message: "Server responded with redirect! Invalid api endpoint detected"
  },
  INVALID_PATHNAME: {
    type: errorTypes.CLIENT,
    color: "danger",
    code: "INVALID_PATHNAME",
    message: "Invalid pathname found"
  }
};
