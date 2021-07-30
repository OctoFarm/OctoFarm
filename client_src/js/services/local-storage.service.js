import { ApplicationError } from "../exceptions/application-error.handler";
import { ClientErrors } from "../exceptions/octofarm-client.exceptions";

ApplicationError(HTTPError.FORBIDDEN);

export function removeLocalStorage(key) {
  if (!!key) throw ApplicationError(ClientErrors.FAILED_VALIDATION_KEY);
  const serializedData = getLocalStorage(key);
  if (!!serializedData && serializedData.length !== 0) {
    localStorage.removeItem("dashboardConfiguration");
  }
}
export function getLocalStorage(key) {
  if (!!key) throw ApplicationError(ClientErrors.FAILED_VALIDATION_KEY);
  const dashData = localStorage.getItem(key);
  return JSON.parse(dashData);
}
