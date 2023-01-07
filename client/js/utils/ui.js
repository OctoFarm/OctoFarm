import Noty from "noty";

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
  printerSelectModal,
];

export default class UI {
  static elementsScrollPosition = {
    scrollTop: null,
    scrollLeft: null,
  };
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
      text: message,
    });
    alert.show();
    return alert;
  }

  static doesElementNeedUpdating(value, element, meta) {
    if(!element || !meta){
      return;
    }
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
      if (input.localName === "input") {
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
      }
    });
  }
  //REFACTOR: Move to a templates folder
  static returnSpinnerTemplate() {
    return `<i class="fas fa-spinner fa-spin"></i>`;
  }

  static removeLoaderFromElementInnerHTML(element) {
    if (!!element && element.innerHTML.includes("spinner")) {
      element.innerHTML = element.innerHTML.replace(
        UI.returnSpinnerTemplate(),
        ""
      );
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
    const currentModal = currentModals.filter(
      (modal) => modal.id === modalToCheck
    );
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
    if (!seconds || isNaN(seconds)) {
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

      if (mnts === 0) {
        if (string.includes("0m")) {
          string = string.replace(" 0m,", "");
        }
      }
      if (hrs === 0) {
        if (string.includes("0h")) {
          string = string.replace(" 0h,", "");
        }
      }
      if (days === 0) {
        if (string.includes("0d")) {
          string = string.replace("0d,", "");
        }
      }
      if (seconds === 0) {
        string = string.replace(", 0s", "");
      }
      if (mnts === 0 && hrs === 0 && days === 0 && seconds === 0) {
        string = string.replace("0s", miliseconds + " ms");
      }
      if (!miliseconds) {
        string = "No Interval";
      }
    }
    return string;
  }

  static isPrinterDisabled(e) {
    if (e.target.innerHTML.includes("wheelchair")) {
      return false;
    } else if (e.target.innerHTML.includes("running")) {
      return true;
    }
  }

  static removeClassIfExists(element, className) {
    if (element.classList.contains(className)) {
      element.classList.remove(className);
    }
  }

  static addClassIfDoesNotExist(element, className){
    if (!element.classList.contains(className)) {
      element.classList.add(className);
    }
  }

  static removeDisplayNoneFromElement(element) {
    if (element.classList.contains("d-none")) {
      element.classList.remove("d-none");
    }
  }

  static addDisplayNoneToElement(element) {
    if (!element.classList.contains("d-none")) {
      element.classList.add("d-none");
    }
  }

  static removeFaSpinFromElement(element) {
    if (element.classList.contains("fa-spin")) {
      element.classList.remove("fa-spin");
    }
  }

  static addFaSpinToElement(element) {
    if (!element.classList.contains("fa-spin")) {
      element.classList.add("fa-spin");
    }
  }

  static addNotYetToElement(element) {
    if (!element.classList.contains("notyet")) {
      element.classList.add("notyet");
    }
  }

  static removeNotYetFromElement(element) {
    if (element.classList.contains("notyet")) {
      element.classList.remove("notyet");
    }
  }

  static togglePrinterDisableState(e) {
    if (e.target.innerHTML.includes("running")) {
      e.target.innerHTML = '<i class="fas fa-wheelchair"></i> Disable';
      e.target.title = "Printer is Disabled, click to enable";
    } else if (e.target.innerHTML.includes("wheelchair")) {
      e.target.innerHTML = '<i class="fas fa-running text-success"></i> Enable';
      e.target.title = "Printer is Enabled, click to disable";
    }
  }

  static getValueOrPlaceHolder(element) {
    if (!!element) {
      if (element.value === "") {
        return element.placeholder;
      } else {
        return element.value;
      }
    } else {
      return undefined;
    }
  }

  static returnProgressColour(percent, reverse) {
    if (percent < 45) {
      return reverse ? "bg-danger" : "bg-success";
    } else if (percent < 75) {
      return "bg-warning";
    } else {
      return reverse ? "bg-success" : "bg-danger";
    }
  }

  static convertValueToTemplate(key, value) {
    const VALUE_NAME = UI.camelCaseToWords(key);
    const ELEMENT_ID = `opBulk-${key}`;
    if (typeof value === "string") {
      return `
        <div class="input-group mb-3 col-3">
          <div class="input-group-prepend">
            <span class="input-group-text" id="basic-addon1">${VALUE_NAME}</span>
          </div>
          <input id="${ELEMENT_ID}" type="text" class="form-control" placeholder="${value}" aria-label="Username" aria-describedby="basic-addon1">
        </div>
      `;
    }
    if (typeof value === "number") {
      return `
        <div class="input-group mb-3 col-3">
          <div class="input-group-prepend">
            <span class="input-group-text" id="basic-addon1">${VALUE_NAME}</span>
          </div>
          <input id="${ELEMENT_ID}" type="number" class="form-control" placeholder="${value}" aria-label="Username" aria-describedby="basic-addon1">
        </div>
      `;
    }

    if (typeof value === "boolean") {
      const checked = value ? "checked='true'" : "";
      return `
        <div class="col-4">
          <form class="was-validated">
            <div class="custom-control custom-checkbox mb-3">
                <input id="${ELEMENT_ID}" type="checkbox" class="custom-control-input" required ${checked}>
                <label class="custom-control-label" for="${ELEMENT_ID}">${VALUE_NAME}</label>
                <div class="valid-feedback">${VALUE_NAME} is on.</div>
                 <div class="invalid-feedback">${VALUE_NAME} is off.</div>
            </div>
          </form>
        </div>
      `;
    }
    if (value instanceof Array) {
      //return select box
    }
  }

  static camelCaseToWords(str) {
    return str
      .match(/^[a-z]+|[A-Z][a-z]*/g)
      .map(function (x) {
        return x[0].toUpperCase() + x.substr(1).toLowerCase();
      })
      .join(" ");
  }

  static captureScrollPosition(element) {
    this.elementsScrollPosition.scrollTop = element.scrollTop;
    this.elementsScrollPosition.scrollLeft = element.scrollLeft;
  }
  static reApplyScrollPosition(element) {
    element.scrollTop = this.elementsScrollPosition.scrollTop;
    element.scrollLeft = this.elementsScrollPosition.scrollLeft;
  }
}
