import { errorTypes } from "./error.types";

export const ClientErrors = {
  INVALID_SERVER_RESPONSE: {
    type: errorTypes.CLIENT,
    color: "danger",
    code: "INVALID_SERVER_RESPONSE",
    message: "Server responded with redirect! Invalid api endpoint detected"
  },
  INVALID_URL_SUPPLIED: {
    type: errorTypes.CLIENT,
    color: "danger",
    code: "INVALID_URL_SUPPLIED",
    message: "You have supplied an invalid url"
  },
  INCORRECT_TYPE_SUPPLIED: {
    type: errorTypes.CLIENT,
    color: "warning",
    code: "INCORRECT_TYPE_SUPPLIED",
    message: "You have supplied the incorrect type"
  },
  FAILED_TO_SUPPLY_VARIABLE: {
    type: errorTypes.CLIENT,
    color: "warning",
    code: "FAILED_TO_SUPPLY_VARIABLE",
    message: "You must supply a variable to this function"
  },
  FAILED_TO_UPDATE_STATE: {
    type: errorTypes.CLIENT,
    color: "danger",
    code: "FAILED_TO_UPDATE_STATE",
    message: "Client has failed to update your printer state"
  }
};
