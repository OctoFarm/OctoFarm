import { returnGithubIssueLink } from "./github-issue.templates";

const octoFarmErrorModalElement = "#octofarmErrorModal";
const errorTitle = document.getElementById("errorTitle");
const errorBody = document.getElementById("errorBody");
const octofarmErrorModalBanner = document.getElementById("octofarmErrorModalBanner");
const errorOverflowBody = document.getElementById("errorOverflowBody");
let errorModalOpened = false;
const octoFarmErrorModalDefaultStyle = "modal-header text-white";

function filterStackMessage(stack) {
  stack = stack.replaceAll(" at ", " <br> at: ");
  stack = stack.replaceAll("@", " <br> at: ");
  return stack;
}

function returnStackTraceBlock(options) {
  if (options?.stack || options?.lineNumber || options?.fileName || options?.columnNumber) {
    return `
      <br>
      <h6 class="pt-3 mb-0"><u>### STACK TRACE ###</u></h6>
      ${options?.stack ? `<code>${filterStackMessage(options.stack)}<br></code>` : ""}
  `;
  }
  return "";
}

function returnFileInfoBlock(options) {
  if (options?.lineNumber || options?.fileName || options?.columnNumber) {
    return `
      <br>
      <h6 class="pt-3 mb-0"><u>### FILE INFO ###</u></h6>
      ${options?.lineNumber ? `LINE: <code>${options.lineNumber}</code><br>` : ""}
      ${options?.columnNumber ? `COL:  <code>${options.columnNumber}<br></code>` : ""}
      ${options?.fileName ? `FILE:  <code>${options.fileName}<br></code>` : ""}
  `;
  }
  return "";
}

function returnServerResponseBlock(options) {
  if (options?.serverResponse) {
    return `
      <br>
      <h6 class="pt-3 mb-0"><u>### SERVER RESPONSE ###</u></h6>
      <code> ${options?.serverResponse.type} </code>
      <code> ${options?.serverResponse.error} </code>
      <code> ${options?.serverResponse.stack} </code>
  `;
  }
  return "";
}

function returnErrorMessage(options) {
  return `
     <h4 class="pt-3">
        ${options?.statusCode ? `(${options.statusCode})` : ""} ${options.message}
     </h4>
     ${returnFileInfoBlock(options)}   
     ${returnStackTraceBlock(options)}   
     ${returnServerResponseBlock(options)}
  `;
}

async function createErrorModal(options) {
  octofarmErrorModalBanner.className = `${octoFarmErrorModalDefaultStyle} bg-${options?.color}`;
  if (!errorModalOpened) {
    $(octoFarmErrorModalElement).modal("show");
    errorTitle.innerHTML = `${options.name}`;
    errorBody.innerHTML = returnErrorMessage(options);
    errorBody.innerHTML += await returnGithubIssueLink(options);
    errorModalOpened = true;
  } else {
    errorOverflowBody.innerHTML += returnErrorMessage(options);
  }
}

export { createErrorModal };
