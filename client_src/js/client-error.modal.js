import UI from "./lib/functions/ui";
import { errorTypes } from "./exceptions/error.types";

const modalErrors = [errorTypes.NETWORK, errorTypes.SERVER, errorTypes.UNKNOWN];
const popUpErrors = [errorTypes.CLIENT];

function returnAlertErrorMessage(options) {
  return `
    <i class="fas fa-exclamation-triangle"></i> ${options.name} 
    <br>
    ${options.type} (${options.statusCode}): 
    <br>
    ${options.message}
    <br>
  `;
}
function returnModalDeveloperInfo(options) {
  return `
    <code>
    <u>DEVELOPER INFO</u><br>
    LINE: ${options?.lineNumber}<br>
    COL: ${options?.columnNumber}<br>
    FILE: ${new URL(options?.fileName).pathname}
    </code>
  `;
}

function createErrorAlert(options) {
  UI.createAlert("error", returnAlertErrorMessage(options), 0, "clicked");
}

function openErrorModal(options) {
  const apiErrorTitle = document.getElementById("apiErrorTitle");
  const apiErrorMessage = document.getElementById("apiErrorMessage");
  const apiDeveloperInfo = document.getElementById("apiDeveloperInfo");
  apiErrorTitle.innerHTML = ` ${options.name}`;
  apiErrorMessage.innerHTML = `
     <br>
     ${options.type} ERROR (${options.statusCode}): 
     <br>
     ${options.message}
  `;
  apiErrorMessage.className = `text-${options.color}`;
  apiDeveloperInfo.innerHTML = returnModalDeveloperInfo(options);
  $("#octofarmErrorModal").modal("show");
}

function handleError(event) {
  if (modalErrors.includes(event.reason.type)) {
    openErrorModal(event.reason);
  }
  if (popUpErrors.includes(event.reason.type)) {
    createErrorAlert(event.reason);
  }
}

window.onunhandledrejection = function (event) {
  handleError(event);
};
window.onunhandledrejection = function (event) {
  handleError(event);
};
