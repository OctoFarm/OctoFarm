import { ClientErrors } from '../js/exceptions/octofarm-client.exceptions';
import OctoFarmClient from '../js/services/octofarm-client.service';
const octoFarmErrorModalElement = '#octofarmErrorModal';
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
     ${options?.message ? options.message : options.toString()}
  `;
}

function returnModalDeveloperInfo(options) {
  return `
    <code>
    <u>FILE INFO</u><br>
    LINE: ${options?.lineNumber}<br>
    COL: ${options?.columnNumber}<br>
   
    ${options?.fileName ? '<b>FILE:</b><br>' + options?.fileName + '<br>' : ''}
    ${options?.stack ? '<b>STACK:</b><br>' + options?.stack : ''}
    </code>
  `;
}

function returnDeveloperObject(options) {
  const { lineNumber, columnNumber, fileName, stack } = options;
  return {
    lineNumber,
    columnNumber,
    fileName,
    stack,
  };
}

function openErrorModal(options) {
  let errorObject = {};
  if (!options?.statusCode || options.statusCode === 999) {
    errorObject.message = options.toString();
    errorObject.statusCode = ClientErrors.UNKNOWN_ERROR.statusCode;
    errorObject.name = ClientErrors.UNKNOWN_ERROR.type;
    errorObject.type = ClientErrors.UNKNOWN_ERROR.type;
    errorObject.code = ClientErrors.UNKNOWN_ERROR.code;
    errorObject.color = ClientErrors.UNKNOWN_ERROR.color;
    errorObject.developerMessage = returnDeveloperObject(options);
  }

  const apiErrorTitle = document.getElementById('apiErrorTitle');
  const apiErrorMessage = document.getElementById('apiErrorMessage');
  const apiDeveloperInfo = document.getElementById('apiDeveloperInfo');
  apiErrorTitle.innerHTML = ` ${options?.name}`;
  apiErrorMessage.innerHTML = returnErrorMessage(options);
  apiErrorMessage.className = `text-${options?.color}`;
  apiDeveloperInfo.innerHTML = returnModalDeveloperInfo(options);
  if (errorObject?.statusCode === 999) {
    setTimeout(async () => {
      await OctoFarmClient.sendError(errorObject);
    }, 1000);
    if (options.code === 'SILENT_ERROR') {
      return;
    }
  }
  setTimeout(() => {
    $(octoFarmErrorModalElement).modal('show');
  }, 2000);
}

function handleEvent(event) {
  if (!event?.reason) {
    openErrorModal(event);
  } else {
    openErrorModal(event.reason);
    console.trace('TRACE BACK: ', JSON.stringify(event));
  }
}

window.onunhandledrejection = function (event) {
  if (!dealingWithError) {
    handleEvent(event.reason);
    dealingWithError = true;
  }
};
