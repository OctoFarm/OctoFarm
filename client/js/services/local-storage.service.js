import { ApplicationError } from "../exceptions/application-error.handler";
import { ClientErrors } from "../exceptions/octofarm-client.exceptions";
import {
  LOCAL_STORAGE_CONSTANTS,
  LOCAL_STORAGE_LIST,
} from "../constants/local-storage.constants";
import UI from "../utils/ui";

function checkKeyValue(key) {
  if (!key) {
    throw new ApplicationError(ClientErrors.FAILED_VALIDATION_KEY);
  }

  if (!LOCAL_STORAGE_LIST().includes(key)) {
    throw new ApplicationError(ClientErrors.FAILED_VALIDATION_KEY);
  }
}

export function removeLocalStorage(key) {
  try {
    checkKeyValue(key);
    const serializedData = getLocalStorage(key);
    if (!!serializedData && serializedData.length !== 0) {
      localStorage.removeItem(key);
    }
    return true;
  } catch (e) {
    UI.createAlert(
      "error",
      `Error checking supplied key! Error ${e}`,
      5000,
      "Clicked"
    );
    const errorObject = ClientErrors.SILENT_ERROR;
    errorObject.message = `Bulk Commands - ${e}`;
    throw new ApplicationError(errorObject);
  }
}
export function getLocalStorage(key) {
  try {
    checkKeyValue(key);
    const storage = localStorage.getItem(key);
    return JSON.parse(storage);
  } catch (e) {
    UI.createAlert(
      "error",
      `Error checking supplied key! Error ${e}`,
      5000,
      "Clicked"
    );
    const errorObject = ClientErrors.SILENT_ERROR;
    errorObject.message = `Bulk Commands - ${e}`;
    throw new ApplicationError(errorObject);
  }
}

export function saveLocalStorage(key, data) {
  try {
    checkKeyValue(key);
    localStorage.setItem(
      LOCAL_STORAGE_CONSTANTS().DASHBOARD_CONFIG,
      JSON.stringify(data)
    );
    return true;
  } catch (e) {
    UI.createAlert(
      "error",
      `Error checking supplied key! Error ${e}`,
      5000,
      "Clicked"
    );
  }
  return false;
}
