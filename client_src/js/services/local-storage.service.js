import { ClientError } from "../exceptions/client-error.handler";
import { ClientErrors } from "../exceptions/client.exceptions";

export function removeLocalStorage(key) {
  if (!!key) throw new ClientError(ClientErrors.FAILED_VALIDATION_KEY);
  const serializedData = getLocalStorage(key);
  if (!!serializedData && serializedData.length !== 0) {
    localStorage.removeItem(key);
  }
}
export function getLocalStorage(key) {
  if (!!key) throw new ClientError(ClientErrors.FAILED_VALIDATION_KEY);
  const localStorageData = localStorage.getItem(key);
  return JSON.parse(localStorageData);
}
