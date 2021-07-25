import UI from "./lib/functions/ui";

const apiErrorTitle = document.getElementById("apiErrorTitle");
const apiErrorMessage = document.getElementById("apiErrorMessage");
const apiDeveloperInfo = document.getElementById("apiDeveloperInfo");

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

export function createErrorAlert(options) {
  UI.createAlert("error", returnAlertErrorMessage(options), 0, "clicked");
}

export function openErrorModal(options) {
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
