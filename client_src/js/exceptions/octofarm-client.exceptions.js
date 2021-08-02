import { errorTypes } from "./error.types";

//TODO: Needs updating for actual usage.
export const ClientErrors = {
  INVALID_SERVER_RESPONSE: {
    type: errorTypes.CLIENT,
    color: "danger",
    code: "INVALID_SERVER_RESPONSE",
    message: "Server responded with redirect! Invalid api endpoint detected"
  },
  NO_PATHNAME_SUPPLIED: {
    color: "danger",
    code: "NO_PATHNAME_SUPPLIED",
    message: "You need to supply a url / path to this command"
  },
  INVALID_PATHNAME: {
    type: errorTypes.CLIENT,
    color: "danger",
    code: "INVALID_PATHNAME",
    message: "Invalid pathname found"
  }
};
