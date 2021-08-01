const octoFarmErrorModalElement = "#octofarmErrorModal";

function returnErrorMessage(options) {
  let statusCode = `(${options?.statusCode})`;
  if (!statusCode) statusCode = "";

  return `
     <br>
     ${options.type} ERROR ${statusCode}: 
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
    <u>DEVELOPER INFO</u><br>
    LINE: ${options?.lineNumber}<br>
    COL: ${options?.columnNumber}<br>
    FILE: ${new URL(options?.fileName).pathname}
    </code>
  `;
}

function openErrorModal(options) {
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
  if (!event.reason) {
    openErrorModal(event);
  } else {
    openErrorModal(event.reason);
  }
}

window.onunhandledrejection = function (event) {
  handleEvent(event);
};
window.onerror = function (event) {
  handleEvent(event);
};
