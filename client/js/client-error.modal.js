import {ClientErrors} from "./exceptions/octofarm-client.exceptions";

const octoFarmErrorModalElement = "#octofarmErrorModal";
let dealingWithError = false;

function returnErrorMessage(options) {
  let statusCode = `(${options?.statusCode})`;

  return `
     <br>
     ${options.name} ERROR ${statusCode}: 
     <br>
     <div class="py-3">
        Please report this error to <a href="https://github.com/octofarm/octofarm/issues">OctoFarm Issues</a>!
     </div>
     ${options.message}
  `;
}

function returnModalDeveloperInfo(options) {
  return `
    <code>
    <u>FILE INFO</u><br>
    LINE: ${options?.lineNumber}<br>
    COL: ${options?.columnNumber}<br>
   
    ${options?.fileName ? "<b>FILE:</b><br>" + options?.fileName + "<br>" : ""}
    ${options?.stack ? "<b>STACK:</b><br>" + options?.stack : ""}
    </code>
  `;
}

function openErrorModal(options) {
  if (!options?.statusCode) {
    options.statusCode = ClientErrors.UNKNOWN_ERROR.statusCode;
    options.name = ClientErrors.UNKNOWN_ERROR.type;
  }
  const apiErrorTitle = document.getElementById("apiErrorTitle");
  const apiErrorMessage = document.getElementById("apiErrorMessage");
  const apiDeveloperInfo = document.getElementById("apiDeveloperInfo");
  apiErrorTitle.innerHTML = ` ${options?.name}`;
  apiErrorMessage.innerHTML = returnErrorMessage(options);
  apiErrorMessage.className = `text-${options?.color}`;
  apiDeveloperInfo.innerHTML = returnModalDeveloperInfo(options);
  $(octoFarmErrorModalElement).modal("show");
}

function handleEvent() {
  if (!event?.reason) {
    openErrorModal(event);
  } else {
    openErrorModal(event.reason);
    console.trace("TRACE BACK: ", JSON.stringify(event));
  }
}

window.onunhandledrejection = function (event) {
  if (!dealingWithError) {
    handleEvent(event.reason);
    dealingWithError = true;
  }
};
