import Noty from "noty";
import OctoFarmClient from "../../services/octofarm-client.service";
import { updatePrinterSettingsModal } from "../modules/printerSettings";
import PrinterLogs from "../modules/printerLogs";
import { reSyncAPI } from "../../pages/printer-manager/functions/printer-manager.functions";

const printerSettingsModal = document.getElementById("printerSettingsModal");
const printerManagerModal = document.getElementById("printerManagerModal");
const printerLogsModal = document.getElementById("printerLogsModal");
const printerStatisticsModal = document.getElementById("printerStatistics");
const printerSelectModal = document.getElementById("printerSelectModal");
const currentModals = [
  printerSettingsModal,
  printerManagerModal,
  printerLogsModal,
  printerStatisticsModal,
  printerSelectModal
];

export default class UI {
  //Colour function
  static getColour(state) {
    if (state === "Operational") {
      return { name: "secondary", hex: "#262626", category: "Idle" };
    } else if (state === "Paused") {
      return { name: "warning", hex: "#583c0e", category: "Idle" };
    } else if (state === "Printing") {
      return { name: "warning", hex: "#583c0e", category: "Active" };
    } else if (state === "Pausing") {
      return { name: "warning", hex: "#583c0e", category: "Active" };
    } else if (state === "Cancelling") {
      return { name: "warning", hex: "#583c0e", category: "Active" };
    } else if (state === "Error") {
      return { name: "danger", hex: "#2e0905", category: "Idle" };
    } else if (state === "Offline") {
      return { name: "danger", hex: "#2e0905", category: "Offline" };
    } else if (state === "Searching...") {
      return { name: "danger", hex: "#2e0905", category: "Idle" };
    } else if (state === "Closed") {
      return { name: "danger", hex: "#2e0905", category: "Closed" };
    } else if (state === "Complete") {
      return { name: "success", hex: "#00330e", category: "Complete" };
    } else {
      return { name: "danger", hex: "#2e0905", category: "Offline" };
    }
  }
  //Create message
  static createMessage(options, element) {
    const message = document.getElementById(element);
    const row = `
      <div class="alert alert-${options.type} alert-dismissible fade show" role="alert">
        ${options.msg}
      <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    `;
    message.insertAdjacentHTML("beforeend", row);
  }

  //Create toast notification
  static createAlert(type, message, delay, click) {
    if (click != undefined) {
      click = ["click"];
    } else {
      click = [];
    }
    //This needs a more elegant solution, I think Noty is keeping the elements I remove with remove() from the DOM in memory somewhere...
    Noty.setMaxVisible(50);
    let alert = new Noty({
      type: type,
      theme: "bootstrap-v4",
      closeWith: click,
      timeout: delay,
      layout: "bottomRight",
      text: message
    });
    alert.show();
    return alert;
  }

  static doesElementNeedUpdating(value, element, meta) {
    //Quick check to see if the UI value differs, if so update.
    if (element) {
      if (JSON.stringify(value) !== JSON.stringify(element[meta])) {
        element[meta] = value;
      }
    }
  }

  static clearSelect(elementValue) {
    let inputBoxes = document.querySelectorAll("*[id^=" + elementValue + "]");
    inputBoxes.forEach((input) => {
      input.value = "";
    });
  }

  static addSelectListeners(elementValue) {
    let inputBoxes = document.querySelectorAll("*[id^=" + elementValue + "]");
    inputBoxes.forEach((input) => {
      input.addEventListener("focus", (e) => {
        if (input.value !== input.placeholder) {
          input.value = input.placeholder;
        }
      });
      input.addEventListener("focusout", (e) => {
        if (input.value !== input.placeholder) {
          input.placeholder = input.value;
        }
      });
    });
  }
  //TODO: Move to a templates folder
  static returnSpinnerTemplate() {
    return '<i class="fas fa-spinner fa-spin"></i>';
  }

  static removeLoaderFromElementInnerHTML(element) {
    if (element.innerHTML.includes("spinner")) {
      element.innerHTML = element.innerHTML.replace(UI.returnSpinnerTemplate(), "");
    }
  }
  static addLoaderToElementsInnerHTML(element) {
    if (!element.innerHTML.includes("spinner")) {
      element.innerHTML += UI.returnSpinnerTemplate();
    }
  }
  static checkIfAnyModalShown() {
    const modalArray = currentModals.map((modal) => {
      return modal.classList.contains("show");
    });
    return modalArray.includes(true);
  }
  static checkIfSpecificModalShown(modalToCheck) {
    const currentModal = currentModals.filter((modal) => modal.id === modalToCheck);
    if (currentModal[0]) {
      return currentModal[0].classList.contains("show");
    } else {
      return false;
    }
  }
  static async delay(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
  static removeLine(element) {
    element.remove();
  }

  static disableElements(elements) {
    elements.forEach((element) => {
      element.disabled = true;
    });
  }
  static enableElements(elements) {
    elements.forEach((element) => {
      element.disabled = false;
    });
  }

  static blankElementValue(elements) {
    elements.forEach((element) => {
      element.value = "";
    });
  }

  static setElementValueFromPlaceholder(elements) {
    elements.forEach((element) => {
      element.value = element.placeholder;
    });
  }
  static setElementPlaceholderFromValue(elements) {
    elements.forEach((element) => {
      element.placeholder = element.value;
    });
  }

  static generateTime(seconds) {
    let string = "";
    if (seconds === undefined || isNaN(seconds) || seconds === null) {
      string = "No Time Estimate";
    } else {
      const days = Math.floor(seconds / (3600 * 24));

      seconds -= days * 3600 * 24;
      const hrs = Math.floor(seconds / 3600);

      seconds -= hrs * 3600;
      const mnts = Math.floor(seconds / 60);

      seconds -= mnts * 60;
      seconds = Math.floor(seconds);

      string = `${days}d, ${hrs}h, ${mnts}m, ${seconds}s`;

      if (mnts == 0) {
        if (string.includes("0m")) {
          string = string.replace(" 0m,", "");
        }
      }
      if (hrs == 0) {
        if (string.includes("0h")) {
          string = string.replace(" 0h,", "");
        }
      }
      if (days == 0) {
        if (string.includes("0d")) {
          string = string.replace("0d,", "");
        }
      }
      if (mnts == 0 && hrs == 0 && days == 0 && seconds == 0) {
        string = string.replace("0s", "Done");
      }
    }

    return string;
  }

  static milisecondsToDays(miliseconds) {
    if (!isNaN(miliseconds)) {
      return Math.floor(miliseconds / (3600 * 24));
    } else {
      return 0;
    }
  }

  static generateMilisecondsTime(miliseconds) {
    let seconds = miliseconds / 1000;
    let string = "";
    if (seconds === undefined || isNaN(seconds) || seconds === null) {
      string = "No Interval";
    } else {
      const days = Math.floor(seconds / (3600 * 24));

      seconds -= days * 3600 * 24;
      const hrs = Math.floor(seconds / 3600);

      seconds -= hrs * 3600;
      const mnts = Math.floor(seconds / 60);

      seconds -= mnts * 60;
      seconds = Math.floor(seconds);

      string = `${days}d, ${hrs}h, ${mnts}m, ${seconds}s`;

      if (mnts == 0) {
        if (string.includes("0m")) {
          string = string.replace(" 0m,", "");
        }
      }
      if (hrs == 0) {
        if (string.includes("0h")) {
          string = string.replace(" 0h,", "");
        }
      }
      if (days == 0) {
        if (string.includes("0d")) {
          string = string.replace("0d,", "");
        }
      }
      if (seconds == 0) {
        string = string.replace(", 0s", "");
      }
      if (mnts == 0 && hrs == 0 && days == 0 && seconds == 0) {
        string = string.replace("0s", miliseconds + " ms");
      }
      if (!miliseconds) {
        string = "No Interval";
      }
      return string;
    }
  }

  static isPrinterDisabled(e) {
    if (e.target.innerHTML.includes("running")) {
      return false;
    } else if (e.target.innerHTML.includes("wheelchair")) {
      return true;
    }
  }

  static togglePrinterDisableState(e, id) {
    const printerCard = document.getElementById(`printerCard-${id}`);
    const apiReScan = document.getElementById(`printerAPIReScan-${id}`);

    if (e.target.innerHTML.includes("running")) {
      e.target.classList = "btn btn-outline-light btn-sm";
      e.target.innerHTML = '<i class="fas fa-wheelchair"></i>';
      printerCard.classList = "printerDisabled";
      apiReScan.disabled = true;
    } else if (e.target.innerHTML.includes("wheelchair")) {
      e.target.classList = "btn btn-outline-success btn-sm";
      e.target.innerHTML = '<i class="fas fa-running"></i>';
      printerCard.classList = "printerEnabled";
      apiReScan.disabled = true;
    }
  }
}
