import { errorTypes } from "./error.types";
import UI from "../lib/functions/ui";

const modalErrors = [errorTypes.NETWORK, errorTypes.SERVER, errorTypes.UNKNOWN];
const popUpErrors = [errorTypes.CLIENT];

const apiErrorTitle = document.getElementById("apiErrorTitle");
const apiErrorMessage = document.getElementById("apiErrorMessage");

function returnErrorMessage(options) {
  return `
     <i class="fas fa-exclamation-triangle"></i> ${options.name} 
     <br>
     ${options.type} (${options.statusCode}): 
     <br>
     ${options.message}
     <br>
  `;
}

function openErrorModal(options) {
  apiErrorTitle.innerHTML = ` ${options.name}`;
  apiErrorMessage.innerHTML = `
     <br>
     ${options.type} (${options.statusCode}): 
     <br>
     ${options.message}
     <br>
     <code>
       DEVELOPER INFO:<br>
       LINE: ${options.lineNumber}<br>
       COL: ${options.column}<br>
       FILE: ${options.fileName}
     </code>
  `;
  $("#octofarmErrorModal").modal("show");
}

export class ApplicationError extends Error {
  static hasErrorNotificationBeenTriggered = false;
  constructor(options, overrides) {
    super();
    Object.assign(options, overrides);

    if (!errorTypes.hasOwnProperty(options.type)) {
      throw new Error(`ApplicationError: ${options.type} is not a valid type.`);
    }

    if (!options.message) {
      throw new Error("ApplicationError: error message required.");
    }

    if (!options.code) {
      throw new Error("ApplicationError: error code required.");
    }

    this.name = "OctoFarm Error";
    this.type = options.type;
    this.code = options.code;
    this.message = options.message;
    this.errors = options.errors;
    this.meta = options.meta;
    this.statusCode = options.statusCode;
    // {
    //   analytics:  {},
    //   context: {}
    // }

    ApplicationError.hasErrorNotificationBeenTriggered = true;
    if (modalErrors.includes(this.type)) {
      openErrorModal(this);
    }
    if (popUpErrors.includes(this.type)) {
      UI.createAlert("error", returnErrorMessage(this), 0, "clicked");
    }
  }
}
