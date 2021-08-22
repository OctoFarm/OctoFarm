import { createErrorModal } from "./templates/error-message.templates";
import { createNotificationPopUp } from "./templates/client-notification.templates";
import AmIAliveService from "./services/amialive.service";
import { logToConsole } from "./templates/console-log.template";
import { errorTypes } from "./exceptions/error.types";
import { HTTPError } from "./exceptions/api.exceptions";

function handleErrorEvent(event) {
  // Fall back for something we didn't throw
  if (!event?.type) {
    HTTPError.UNKNOWN.message += `<br> ${event}`;
    Object.assign(event, HTTPError.UNKNOWN);
    createErrorModal(event).then();
    return true;
  }

  // Only trigger errors if amIAliveService status is true
  if (AmIAliveService.getStatus()) {
    // Will be used further to specify a reaction to specific event types.
    switch (event.type) {
      case errorTypes.PRINTER:
        createNotificationPopUp(event);
        break;
      default:
        createErrorModal(event).then();
    }
  } else {
    AmIAliveService.showModal();
  }
  // Make sure all events are logged to the console
  logToConsole(event);
  // return true to tell browser we've handled the event
  return true;
}

// Listener to capture unhandled promise errors
window.addEventListener("unhandledrejection", (event) => {
  //console.log("UNHANDLED:", event);
  event.preventDefault();
  return handleErrorEvent(event.reason);
});
// Listener to capture errors
window.addEventListener("error", (event) => {
  //console.log("HANDLED:", event);
  event.preventDefault();
  return handleErrorEvent(event);
});
