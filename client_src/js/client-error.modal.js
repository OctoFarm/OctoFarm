const octoFarmErrorModalElement = "#octofarmErrorModal";

function returnDodoCodingMessage(options) {
  return `
     <div class="py-3">
        Please report this error to <a href="https://github.com/octofarm/octofarm/issues">OctoFarm Issues</a>!
     </div>
      ${options.message}
  `;
}

function returnErrorMessage(options) {
  return `
     <br>
     ${options.type} ERROR (${options?.statusCode}): 
     <br>
     ${options.message}
     <div class="py-3">
        If this issue persists, please submit a bug report with the below information...
     </div>
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

function openDodoModal(options) {
  //TODO: Duplicate, doesn't work when caught on page load comes back null :?
  const apiErrorTitle = document.getElementById("apiErrorTitle");
  const apiErrorMessage = document.getElementById("apiErrorMessage");
  const apiDeveloperInfo = document.getElementById("apiDeveloperInfo");
  apiErrorTitle.innerHTML = "Dodo Coding Error!";
  apiErrorMessage.innerHTML = returnDodoCodingMessage(options);
  apiErrorMessage.className = `text-${options?.color}`;
  apiDeveloperInfo.innerHTML = returnModalDeveloperInfo(options.error);
  $(octoFarmErrorModalElement).modal("show");
}

function handleEvent() {
  if (!event.reason) {
    openDodoModal(event);
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
