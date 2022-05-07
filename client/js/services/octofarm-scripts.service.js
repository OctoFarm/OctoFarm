import UI from "../utils/ui.js";
import OctoFarmClient from "./octofarm-client.service";

//REFACTOR: Rework in another PR

const alertsDrop = `
<option selected value="0">Choose...</option>
<optgroup label = "Print Events">
<option value="done">Print Done</option>
<option value="started">Print Started</option>
<option value="failed">Print Failed</option>
<option value="cancelling">Print Cancelling</option>
<option value="cancelled">Print Cancelled</option>
<option value="paused">Print Paused</option>
<option value="cooldown">Print Cooled</option>
<option value="error">Print Error</option>
<optgroup label = "Printer Events">
<option value="statechange">Printer State Change</option>
<option value="connected">Printer Connected</option>
<option value="disconnecting">Printer Disconnecting</option>
<option value="disconnected">Printer Disconnected</option>
<option value="dwelling">Printer Dwelling</option>
<option value="homed">Printer Homed</option>
<option value="positionupdated">Position Updated</option>
<option value="zchange">Z Changed</option>
<optgroup label = "Client Events">
<option value="clientauthed">Client Authed</option>
<option value="clientopened">Client Opened</option>
<option value="clientclosed">Client Closed</option>
<optgroup label = "File/Folder Events">
<option value="fileuploading">File Uploading</option>
<option value="fileupload">File Uploaded</option>
<option value="fileupdate">File Updated</option>
<option value="fileadded">File Added</option>
<option value="filedeselected">File Deselected</option>
<option value="fileremoved">File Removed</option>
<option value="folderadded">Folder Added</option>
<option value="folderremoved">Folder Removed</option>
<option value="metadatafinished">Metadata Analysis Finished</option>
<option value="metadatastarted">Metadata Analysis Started</option>
<option value="metadataupdated">Metadata Analysis Updated</option>
`;
let testScriptBtn = document.getElementById("testScript");
if (testScriptBtn) {
  testScriptBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    let elements = Script.grabPage();
    let errors = Script.checkPage(elements);
    if (errors.length > 0) {
      UI.createAlert(
        "warning",
        "There are issues with your input, please correct the highlighted fields",
        3000,
        "Clicked"
      );
      errors.forEach((error) => {
        if (error === "script") {
          elements.script.style.borderColor = "red";
        }
        if (error === "message") {
          elements.message.style.borderColor = "red";
        }
        if (error === "trigger") {
          elements.trigger.style.borderColor = "red";
        }
      });
    } else {
      elements.script.style.borderColor = "green";
      elements.message.style.borderColor = "green";
      elements.trigger.style.borderColor = "green";
      Script.test(elements.script.value, elements.message.value);
    }
  });
}
let alertsTriggers = document.getElementById("alertsTrigger");
if (alertsTriggers) {
  alertsTriggers.insertAdjacentHTML("beforeend", alertsDrop);
}

let saveScriptBtn = document.getElementById("saveScript");
if (saveScriptBtn) {
  saveScriptBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    let elements = Script.grabPage();
    let errors = Script.checkPage(elements);
    if (errors.length > 0) {
      UI.createAlert(
        "warning",
        "There are issues with your input, please correct the highlighted fields",
        3000,
        "Clicked"
      );
      errors.forEach((error) => {
        if (error === "script") {
          elements.script.style.borderColor = "red";
        }
        if (error === "message") {
          elements.message.style.borderColor = "red";
        }
        if (error === "trigger") {
          elements.trigger.style.borderColor = "red";
        }
      });
    } else {
      elements.script.style.borderColor = "green";
      elements.message.style.borderColor = "green";
      elements.trigger.style.borderColor = "green";
      let newAlert = {
        active: true,
        trigger: elements.trigger.value,
        script: elements.script.value,
        message: elements.message.value,
      };
      Script.save(newAlert);
    }
  });
}
export default class Script {
  static async alertsDrop() {
    return alertsDrop;
  }
  static async get() {
    let post = await OctoFarmClient.get("scripts/get");
    let alertsTable = document.getElementById("alertsTable");
    alertsTable.innerHTML = "";
    if (post) {
      post.alerts.forEach((alert) => {
        if (alert.printer.length === 0) {
          alert.printer = "All Printers";
        }

        alertsTable.insertAdjacentHTML(
          "beforeend",
          `
                <tr id="alertList-${alert._id}">
                <td class="d-none">
                    ${alert._id}
                </td>
                <td> 
                 <form class="was-validated">
                      <div class="custom-control custom-checkbox mb-3">
                            <input type="checkbox" class="custom-control-input" id="active-${alert._id}" required>
                            <label class="custom-control-label" for="active-${alert._id}"></label>

                        </div>
                    </form>
                </td>
                <td>  
                      <select class="custom-select" id="trigger-${alert._id}" disabled>

                       </select>
                </td> 
                <td >    
                  <div class="form-group">
                    <input type="input" class="form-control" id="scriptLocation-${alert._id}" aria-describedby="scriptLocation" placeholder="Enter your script location" value="${alert.scriptLocation}" disabled />
                  </div>
                </td>
                <td>    
                  <div class="form-group">
                    <textarea type="input" rows="1" class="form-control" id="message-${alert._id}" aria-describedby="message" placeholder="Enter you message" disabled>${alert.message}</textarea>
                  </div>
                </td>
                <td id="printers-${alert._id}">
                        ${alert.printer}
                </td>
                 <td>
                    <button id="edit-${alert._id}" type="button" class="btn btn-sm btn-info edit">
                    <i class="fas fa-edit editIcon"></i>
                  </button>
                  <button id="save-${alert._id}" type="button" class="btn btn-sm d-none btn-success save">
                    <i class="fas fa-save saveIcon"></i>
                  </button>
                  <button id="delete-${alert._id}" type="button" class="btn btn-sm btn-danger delete">
                    <i class="fas fa-trash deleteIcon"></i>
                  </button>
                </td>
                </tr>
           `
        );
        let alertsTrigger = document.getElementById("trigger-" + alert._id);
        alertsTrigger.innerHTML = alertsDrop;
        alertsTrigger.value = alert.trigger;

        document.getElementById("active-" + alert._id).checked = alert.active;
        document
          .getElementById("edit-" + alert._id)
          .addEventListener("click", (event) => {
            Script.edit(alert._id);
          });
        document
          .getElementById("save-" + alert._id)
          .addEventListener("click", (event) => {
            let newAlert = {
              active: document.getElementById("active-" + alert._id).checked,
              trigger: document.getElementById("trigger-" + alert._id).value,
              script: document
                .getElementById("scriptLocation-" + alert._id)
                .value.trim(),
              message: document
                .getElementById("message-" + alert._id)
                .value.trim(),
            };
            Script.saveEdit(alert._id, newAlert);
          });
        document
          .getElementById("delete-" + alert._id)
          .addEventListener("click", (event) => {
            Script.delete(alert._id);
          });
      });
    } else {
      alertsTable.insertAdjacentHTML("beforeend"`
                           <tr class="d-none">

                </td>
                <td>  
                </td>
                <td>  

                </td> 
                <td>    
                    No Alerts Found
                </td>
                <td>    

                </td>
                <td>

                </td>
                </tr>`);
    }
  }
  static async edit(id) {
    document.getElementById("scriptLocation-"+id).disabled = false;
    const message = document.getElementById("message-"+id);
    message.disabled = false;
    message.rows = "5";
    document.getElementById("save-" + id).classList.remove("d-none");
    document.getElementById("edit-" + id).classList.add("d-none");
    document.getElementById("trigger-" + id).disabled = false;
  }
  static async saveEdit(id, newAlert) {
    let opts = {
      id: id,
      active: newAlert.active,
      trigger: newAlert.trigger,
      scriptLocation: newAlert.script,
      message: newAlert.message,
    };
    let post = await OctoFarmClient.post("scripts/edit", opts);
    if (!post) {
      UI.createAlert("error", "Failed to save your alert!", 3000, "Clicked");
    } else {
      UI.createAlert(
        "success",
        "Successfully saved your alert!",
        3000,
        "Clicked"
      );
      Script.get();
    }
    let row = document.getElementById("alertList-" + id);
    let editable = row.querySelectorAll("[contenteditable]");

    editable.forEach((edit) => {
      edit.contentEditable = false;
      edit.classList.remove("contentEditable");
    });
    document.getElementById("save-" + id).classList.add("d-none");
    document.getElementById("edit-" + id).classList.remove("d-none");
    document.getElementById("trigger-" + id).disabled = true;
  }
  static async save(newAlert) {
    let opts = {
      active: newAlert.active,
      trigger: newAlert.trigger,
      scriptLocation: newAlert.script,
      message: newAlert.message,
      printer: [],
    };
    let post = await OctoFarmClient.post("scripts/save", opts);
    if (!post) {
      UI.createAlert("error", "Failed to save your alert!", 3000, "Clicked");
    } else {
      UI.createAlert(
        "success",
        "Successfully saved your alert!",
        3000,
        "Clicked"
      );
      Script.get();
    }
  }
  static async delete(id) {
    let post = await OctoFarmClient.delete("scripts/delete/" + id);
    if (!post) {
      UI.createAlert("error", "Failed to delete your alert.", 3000, "Clicked");
    } else {
      UI.createAlert(
        "success",
        "Successfully deleted your alert.",
        3000,
        "Clicked"
      );
      document.getElementById("alertList-" + id).remove();
    }
  }
  static async test(scriptLocation, message) {
    let opts = {
      scriptLocation: scriptLocation,
      message: message,
    };
    let post = await OctoFarmClient.post("scripts/test", opts);
    if (typeof post.testFire === "object") {
      UI.createAlert("error", post.testFire.stderr, 3000, "Clicked");
    } else {
      UI.createAlert("success", post.testFire, 3000, "Clicked");
    }
  }
  static checkPage(elements) {
    let errors = [];

    if (elements.script.value === "") {
      errors.push("script");
    }
    if (elements.trigger.value === "0") {
      errors.push("trigger");
    }
    if (elements.message.value === "") {
      errors.push("message");
    }
    return errors;
  }
  static grabPage() {
    return {
      trigger: document.getElementById("alertsTrigger"),
      script: document.getElementById("scriptLocation"),
      message: document.getElementById("scriptMessage"),
    };
  }
}
