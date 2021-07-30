const octoFarmErrorModalElement = "#octofarmErrorModal";

function returnErrorMessage(options) {
  return `
     <br>
     ${options.type} ERROR (${options.statusCode}): 
     <br>
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
  apiErrorTitle.innerHTML = ` ${options.name}`;
  apiErrorMessage.innerHTML = returnErrorMessage(options);
  apiErrorMessage.className = `text-${options.color}`;
  apiDeveloperInfo.innerHTML = returnModalDeveloperInfo(options);
  $(octoFarmErrorModalElement).modal("show");
}

window.onunhandledrejection = function (event) {
  openErrorModal(event.reason);
};
window.onerror = function (event) {
  openErrorModal(event.reason);
};
