import { findIndex } from "lodash";

import OctoFarmClient from "../../../services/octofarm-client.service.js";
import UI from "../../../utils/ui";
import PrinterSelectionService from "../services/printer-selection.service";
import {
  octoPrintPluginInstallAction,
  updateOctoPrintPlugins,
} from "../../../services/octoprint/octoprint-plugin-commands.actions";
import {
  disconnectPrinterFromOctoPrint,
  quickConnectPrinterToOctoPrint,
  sendPowerCommandToOctoPrint,
  updateOctoPrintClient,
} from "../../../services/octoprint/octoprint-client-commands.actions";
import {
  printerHomeAxis,
  printerMoveAxis,
  printerPausePrint,
  printerPreHeatBed,
  printerPreHeatChamber,
  printerPreHeatTool,
  printerRestartPrint,
  printerResumePrint,
  printerSendGcode,
  printerStartPrint,
  printerStopPrint,
} from "../../../services/octoprint/octoprint-printer-commands.actions";
import { setupOctoPrintForVirtualPrinter } from "../../../services/octoprint/octoprint-settings.actions";
import CustomGenerator from "../../../services/custom-gcode-scripts.service";
import { setupPluginSearch } from "./plugin-search.function";
import {
  returnPluginListTemplate,
  returnPluginSelectTemplate,
} from "../templates/octoprint-plugin-list.template";
import {
  generateTableRows,
  showBulkActionsModal,
  updateBulkActionsProgress,
  updateTableRow,
} from "./bulk-actions-progress.functions";
import { populateBulkSettingsForms } from "./bulk-settings-update.functions";
import bulkActionsStates from "../bulk-actions.constants";
import { allowedFileTypes } from "../../../constants/file-types.constants";

import Queue from "../../../services/file-manager-queue.service.js";
import OctoPrintClient from "../../../services/octoprint/octoprint-client.service";
import { ClientErrors } from "../../../exceptions/octofarm-client.exceptions";
import { ApplicationError } from "../../../exceptions/application-error.handler";

const fileUploads = new Queue();

let selectedFolder = "";
const LIGHT_BUTTON_CLASS = "btn btn-light";
const LIGHT_BUTTON_CLASS_ACTIVE = "btn btn-light active";

//REFACTOR this should come from printer select to save the extra call, re-iteration and matching.
async function getCurrentlySelectedPrinterList(disabled) {
  try {
    const currentPrinterList = await OctoFarmClient.listPrinters(disabled);
    const matchedPrinters = [];
    //Grab all check boxes
    const selectedPrinters = PrinterSelectionService.getSelected();
    selectedPrinters.forEach((element) => {
      const printerID = element.id.split("-");
      const index = findIndex(currentPrinterList, function (o) {
        return o._id === printerID[1];
      });
      if (index > -1) {
        matchedPrinters.push(currentPrinterList[index]);
      }
    });
    return matchedPrinters;
  } catch (e) {
    console.error(e);
    UI.createAlert(
      "error",
      `Couldn't get selected printer list: ${e}`,
      0,
      "clicked"
    );
    return [];
  }
}

export async function bulkOctoPrintPluginUpdate() {
  try {
    const currentPrinterList = await OctoFarmClient.listPrinters();
    let message = "";
    const toUpdate = [];
    const pluginList = [];
    const displayNameList = [];

    for (const currentPrinter of currentPrinterList) {
      if (currentPrinter?.octoPrintPluginUpdates?.length > 0) {
        message += `<b>${currentPrinter.printerName}</b><br>`;
        toUpdate.push({
          _id: currentPrinter._id,
          printerURL: currentPrinter.printerURL,
          printerName: currentPrinter.printerName,
          apikey: currentPrinter.apikey,
        });
        let count = 0;
        for (const plugin of currentPrinter.octoPrintPluginUpdates) {
          const n = plugin.releaseNotesURL.lastIndexOf("/");
          const version = plugin.releaseNotesURL.substring(n + 1);
          message += `<b>${count}.</b> ${plugin.displayName} - Current: ${plugin.displayVersion} - Latest: ${version} <br>`;
          pluginList.push(plugin.id);
          displayNameList.push(plugin.displayName);
          count++;
        }
      }
    }
    if (toUpdate.length < 1) {
      UI.createAlert(
        "error",
        "There are no plugin updates available!",
        0,
        "clicked"
      );
      return;
    }
    message += "Are you sure?";
    bootbox.confirm({
      size: "medium",
      title: "This will update the following printers plugins...",
      message: message,
      callback: async function (result) {
        if (result) {
          showBulkActionsModal();
          updateBulkActionsProgress(0, toUpdate.length);
          generateTableRows(toUpdate);
          for (let i = 0; i < toUpdate.length; i++) {
            const response = await updateOctoPrintPlugins(
              pluginList,
              toUpdate[i],
              displayNameList
            );
            updateTableRow(toUpdate[i]._id, response.status, response.message);
            updateBulkActionsProgress(i, toUpdate.length);
          }
          updateBulkActionsProgress(toUpdate.length, toUpdate.length);
        }
      },
    });
  } catch (e) {
    console.error(e);
    UI.createAlert(
      "error",
      `Encountered and error whilst trying to update your plugins: ${e}`,
      0,
      "clicked"
    );
  }
}

export async function bulkOctoPrintClientUpdate() {
  try {
    const currentPrinterList = await OctoFarmClient.listPrinters();
    let message = "";
    const toUpdate = [];
    for (const currentPrinter of currentPrinterList) {
      if (currentPrinter?.octoPrintUpdate?.updateAvailable) {
        message += currentPrinter.printerName + "<br>";

        toUpdate.push({
          _id: currentPrinter._id,
          printerURL: currentPrinter.printerURL,
          printerName: currentPrinter.printerName,
          apikey: currentPrinter.apikey,
        });
      }
    }
    if (toUpdate.length < 1) {
      UI.createAlert(
        "error",
        "There are no OctoPrint updates available!",
        0,
        "clicked"
      );
      return;
    }
    message += "Are you sure?";
    bootbox.confirm({
      size: "medium",
      title: "This will update the following OctoPrint Installs...",
      message: message,
      callback: async function (result) {
        if (result) {
          showBulkActionsModal();
          updateBulkActionsProgress(0, toUpdate.length);
          generateTableRows(toUpdate);
          for (let i = 0; i < toUpdate.length; i++) {
            const response = await updateOctoPrintClient(toUpdate[i]);
            updateTableRow(toUpdate[i]._id, response.status, response.message);
            updateBulkActionsProgress(i, toUpdate.length);
          }
          updateBulkActionsProgress(toUpdate.length, toUpdate.length);
        }
      },
    });
  } catch (e) {
    console.error(e);
    UI.createAlert(
      "error",
      `Encountered and error whilst trying to update your OctoPrint Clients: ${e}`,
      0,
      "clicked"
    );
  }
}

export async function bulkConnectPrinters() {
  const printersToControl = await getCurrentlySelectedPrinterList();
  showBulkActionsModal();
  updateBulkActionsProgress(0, printersToControl.length);
  generateTableRows(printersToControl);
  for (let p = 0; p < printersToControl.length; p++) {
    const response = await quickConnectPrinterToOctoPrint(printersToControl[p]);
    updateTableRow(printersToControl[p]._id, response.status, response.message);
    updateBulkActionsProgress(p, printersToControl.length);
  }
  updateBulkActionsProgress(printersToControl.length, printersToControl.length);
}

export async function bulkDisablePrinters() {
  const printersToControl = await getCurrentlySelectedPrinterList();
  showBulkActionsModal();
  updateBulkActionsProgress(0, printersToControl.length);
  generateTableRows(printersToControl);
  for (let p = 0; p < printersToControl.length; p++) {
    await OctoFarmClient.disablePrinter([printersToControl[p]._id]);
    const disableButton = document.getElementById(
      "printerDisable-" + printersToControl[p]._id
    );
    const e = {
      target: disableButton,
    };
    UI.togglePrinterDisableState(e);
    updateTableRow(
      printersToControl[p]._id,
      "success",
      "Successfully Disabled your printer!"
    );
    updateBulkActionsProgress(p, printersToControl.length);
  }
  updateBulkActionsProgress(printersToControl.length, printersToControl.length);
}

export async function bulkEnablePrinters(disabled) {
  const printersToControl = await getCurrentlySelectedPrinterList(disabled);
  showBulkActionsModal();
  updateBulkActionsProgress(0, printersToControl.length);
  generateTableRows(printersToControl);
  for (let p = 0; p < printersToControl.length; p++) {
    await OctoFarmClient.enablePrinter([printersToControl[p]._id]);
    const enableButton = document.getElementById(
      "printerDisable-" + printersToControl[p]._id
    );
    const e = {
      target: enableButton,
    };
    UI.togglePrinterDisableState(e);
    updateTableRow(
      printersToControl[p]._id,
      "success",
      "Successfully Enabled your printer!"
    );
    updateBulkActionsProgress(p, printersToControl.length);
  }
  updateBulkActionsProgress(printersToControl.length, printersToControl.length);
}

function setupSingleFileMode(printers, file = "No File", folder = "") {
  printers.forEach((printer) => {
    document.getElementById(`printerFileChoice-${printer._id}`).innerHTML = `
      <small><i class="fas fa-file-code"></i> ${folder}${file.name}</small>
    `;
  });
}

function setupMultiFileMode(printers, files, folder = "") {
  if (files) {
    printers.forEach((printer, index) => {
      if (files[index]) {
        document.getElementById(
          `printerFileChoice-${printer._id}`
        ).innerHTML = `
      <small><i class="fas fa-file-code"></i> ${folder}${files[index].name}</small>
    `;
      } else {
        document.getElementById(
          `printerFileChoice-${printer._id}`
        ).innerHTML = `
      <small><i class="fas fa-forward"></i> Select more files to send to this printer!</small>
    `;
      }
    });
  }
}

function fileUpload(file) {
  return new Promise(async function (resolve, _reject) {
    // Grab folder location
    const { currentFolder } = file;
    // Grab Client Info
    const { index } = file;
    const { printerInfo } = file;

    // XHR doesn't like posting without it been a form, can't use offical octoprint api way...
    // Create form data
    const formData = new FormData();
    let path = "";
    if (currentFolder.includes("local/")) {
      path = currentFolder.replace("local/", "");
    }
    formData.append("file", file.file);
    formData.append("path", path);
    if (file.print) {
      formData.append("print", true);
    }
    const url = `/octoprint/${printerInfo._id}/api/files/local`;
    const xhr = new XMLHttpRequest();
    file = file.file;
    xhr.open("POST", url);
    xhr.upload.onprogress = function (e) {
      if (e.lengthComputable) {
        // Update progress
        const progressBar = document.getElementById(
          "bpUploadProgress-" + index
        );
        progressBar.classList = "progress-bar progress-bar-striped bg-warning";
        if (progressBar) {
          let percentLoad = (e.loaded / e.total) * 100;
          if (isNaN(percentLoad)) {
            percentLoad = 0;
          }
          progressBar.style.width = `${Math.floor(percentLoad)}%`;
          progressBar.innerHTML = `Uploading: ${Math.floor(percentLoad)}%`;
          if (percentLoad === 100) {
            progressBar.classList =
              "progress-bar progress-bar-striped bg-success";
          }
        }
      }
    };

    xhr.setRequestHeader("X-Api-Key", printerInfo.apikey);
    xhr.onloadend = async function () {
      if (this.status >= 200 && this.status < 300) {
        resolve({
          status: bulkActionsStates.SUCCESS,
          message: "Successfully uploaded your file! Printing started.",
        });
        // Success!
      } else {
        resolve({
          status: bulkActionsStates.ERROR,
          message:
            "An error occured whilst updating your file... Printing failed.",
        });
        // Error occured
      }
    };
    xhr.onerror = function () {
      resolve({
        status: bulkActionsStates.ERROR,
        message:
          "An error occured whilst updating your file... printing failed.",
      });
      // Error occured!
    };
    xhr.send(formData);
  });
}

export async function bulkPrintFileSetup() {
  document.getElementById("bpActionButtonElement").innerHTML =
    "<button id=\"bpActionButton\" type=\"button\" class=\"btn btn-success\" disabled>Start Prints!</button>";
  document.getElementById(
    "bpuploadFilesElement"
  ).innerHTML = `<div class="custom-file">
          <input type="file" accept="${allowedFileTypes}" class="custom-file-input" id="bpFileUpload" multiple>
          <label class="custom-file-label" multiple for="bpFileUpload">Click here to upload file(s)</label>
      </div>
    `;
  document.getElementById(
    "bpFilesSelectElement"
  ).innerHTML = `<select id="bpFileSelect" class="custom-select" multiple>
                </select>`;

  const bpFileSelect = document.getElementById("bpFileSelect");

  const printersToControl = await getCurrentlySelectedPrinterList();

  const idList = [];
  for (const printer of printersToControl) {
    idList.push(printer._id);
  }
  const fileList = await OctoFarmClient.get(
      "printers/listUnifiedFiles/" + JSON.stringify(idList)
  );

  let selectedFiles;

  fileList.forEach(file => {
    bpFileSelect.insertAdjacentHTML("beforeend", `
      <option value="${file.fullPath.replace(/%/g, "_")}"> ${file.fullPath} </option>
    `)
  })

  bpFileSelect.addEventListener("change", (e) => {
    selectedFiles = [];
    for(const option of e.target.selectedOptions) {
      selectedFiles.push({name: option.value})
    }
    setup(printersToControl);
  })

  const multiFolderInput = document.getElementById("multiNewFolder");
  multiFolderInput.innerHTML = "";

  multiFolderInput.addEventListener("change", () => {
    setup(printersToControl);
  })

  const uniqueFolderList = await OctoFarmClient.getOctoPrintUniqueFolders();

  uniqueFolderList.forEach((path) => {
    multiFolderInput.insertAdjacentHTML(
      "beforeend",
      `
          <option value=${path.replace(/ /g, "%")}>${path}</option>
      `
    );
  });

  // Load the new modal up...
  $("#bulkPrintSetupModal").modal("show");
  // Grab current list of printers...

  const printerDisplayElement = document.getElementById(
    "bpSelectedPrintersAndFiles"
  );
  printerDisplayElement.innerHTML = "";
  const bpActionButton = document.getElementById("bpActionButton");
  printersToControl.forEach((printer) => {
    printerDisplayElement.insertAdjacentHTML(
      "beforeend",
      `
        <div class="card col-2 px-1 py-1">
         <div class="card-header px-1 py-1">
           <small><i class="fas fa-print"></i> ${printer.printerName}</small> 
          </div>
          <div class="card-body px-1 py-1" >
          <div id="printerFolderChoice-${printer._id}"><small><i class="fa-solid fa-folder-open text-success"></i> local/</small></div>
          <div id="printerFileChoice-${printer._id}"><small><i class="fas fa-spinner fa-pulse"></i> Awaiting file selection...</small></div>
         </div>
        </div>
    `
    );
  });

  async function runUpload() {
    // Setup the tracking modal...
    showBulkActionsModal();
    updateBulkActionsProgress(0, printersToControl.length);
    generateTableRows(printersToControl);
    // Make sure printers are in idle state...
    for (const printer of printersToControl) {
      const response = await quickConnectPrinterToOctoPrint(printer);
      updateTableRow(printer._id, response.status, response.message);
    }

    // Check if file exists and upload if not...
    for (let p = 0; p < printersToControl.length; p++) {
      const currentPrinter = printersToControl[p];
      if (selectedFiles.length === 1) {
        const doesFileExist = await OctoPrintClient.checkFile(
          currentPrinter,
          selectedFolder + selectedFiles[0].name
        );
        if (doesFileExist === 200) {
          const opt = {
            command: "select",
            print: true,
          };
          const url = `files/local/${selectedFolder}${selectedFiles[0].name}`;
          const file = await OctoPrintClient.post(currentPrinter, url, opt);
          if (file.status === 204) {
            updateTableRow(
              currentPrinter._id,
              bulkActionsStates.SUCCESS,
              "File exists... print has successfully started!"
            );
          } else {
            updateTableRow(
              currentPrinter._id,
              bulkActionsStates.ERROR,
              "There was an issue selecting your file to print..."
            );
          }
        } else {
          // Prep the file for upload...
          const newObject = {
            file: selectedFiles[0],
            index: currentPrinter._id,
            printerInfo: currentPrinter,
            currentFolder: `local/${selectedFolder}`,
            print: true,
          };
          updateTableRow(
            currentPrinter._id,
            bulkActionsStates.SKIPPED,
            `
            <div class="progress">
              <div id="bpUploadProgress-${currentPrinter._id}"
               class="progress-bar" role="progressbar"
                style="width: 0;" aria-valuenow="25"
                 aria-valuemin="0" aria-valuemax="100">Uploading: 0%</div>
            </div>
          `
          );

          const response = await fileUpload(newObject);

          updateTableRow(
            currentPrinter._id,
            response.status,
            response.message,
            true
          );
        }
      } else if (selectedFiles.length > 1) {
        if (selectedFiles[p]) {
          const doesFileExist = await OctoPrintClient.checkFile(
            currentPrinter,
            selectedFiles[p].name
          );
          if (doesFileExist === 200) {
            const opt = {
              command: "select",
              print: true,
            };
            await OctoPrintClient.updateFeedAndFlow(currentPrinter);
            await OctoPrintClient.updateFilamentOffsets(currentPrinter);
            const url = "files/local/" + selectedFiles[p].name;
            const file = await OctoPrintClient.post(currentPrinter, url, opt);
            if (file.status === 204) {
              updateTableRow(
                currentPrinter._id,
                bulkActionsStates.SUCCESS,
                "File exists... print has successfully started!"
              );
            } else {
              updateTableRow(
                currentPrinter._id,
                bulkActionsStates.ERROR,
                "There was an issue selecting your file to print..."
              );
            }
          } else {
            // Prep the file for upload...
            const newObject = {
              file: selectedFiles[p],
              index: currentPrinter._id,
              printerInfo: currentPrinter,
              currentFolder: "local/",
              print: true,
            };

            updateTableRow(
              currentPrinter._id,
              bulkActionsStates.SKIPPED,
              `
              <div class="progress">
                <div id="bpUploadProgress-${currentPrinter._id}" 
                class="progress-bar" role="progressbar" 
                style="width: 0;" aria-valuenow="25" 
                aria-valuemin="0" aria-valuemax="100">Uploading: 0%</div>
              </div>
            `
            );

            const response = await fileUpload(newObject);
            updateTableRow(
              currentPrinter._id,
              response.status,
              response.message,
              true
            );
          }
        } else {
          updateTableRow(
            currentPrinter._id,
            bulkActionsStates.ERROR,
            "Seems there wasn't enough files selected for the printers..."
          );
        }
      }
      await OctoFarmClient.post("printers/resyncFile", {
        id: currentPrinter._id,
      });
      updateBulkActionsProgress(
        printersToControl.length,
        printersToControl.length
      );
    }
  }

  function grabFiles(Afiles) {
    Afiles = [...Afiles];
    return Afiles;
  }

  function setup(printers) {
    updateSelectedFolder(printers);
    if (selectedFiles) {

      if (selectedFiles.length === 1) {
        // Setup single file mode
        bpActionButton.disabled = false;
        setupSingleFileMode(
          printersToControl,
          selectedFiles[0],
          selectedFolder
        );
      } else if (selectedFiles.length > 1) {
        // Setup multiple file mode
        bpActionButton.disabled = false;
        setupMultiFileMode(printersToControl, selectedFiles, selectedFolder);
      } else if (selectedFiles.length === 0) {
        bpActionButton.disabled = true;
      }
    }
  }

  // Upload file listener
  document
    .getElementById("bpFileUpload")
    .addEventListener("change", function () {
      selectedFiles = grabFiles(this.files);
      setup();
    });

  bpActionButton.addEventListener("click", async function () {
    await runUpload();
  });


  async function updateSelectedFolder(printers) {
    if(!!printers){
      printers.forEach(printer => {
        const printerFolderChoice = document.getElementById("printerFolderChoice-"+printer._id);
        if (multiFolderInput.value === "/") {
          selectedFolder = "";
          printerFolderChoice.innerHTML = "<small><i class=\"fa-solid fa-folder-open text-success\"></i> local/</small>";
        }else{
          selectedFolder = multiFolderInput.value.replace(/%/g, " ");
          printerFolderChoice.innerHTML = "<small><i class=\"fa-solid fa-folder-open text-success\"></i> " + multiFolderInput.value.replace(/%/g, " ") + "</small>";
        }
      })

    }

  }
}

export async function bulkDisconnectPrinters() {
  const printersToDisconnect = await getCurrentlySelectedPrinterList();
  showBulkActionsModal();
  updateBulkActionsProgress(0, printersToDisconnect.length);
  generateTableRows(printersToDisconnect);
  for (let p = 0; p < printersToDisconnect.length; p++) {
    const response = await disconnectPrinterFromOctoPrint(
      printersToDisconnect[p]
    );
    updateTableRow(
      printersToDisconnect[p]._id,
      response.status,
      response.message
    );
    updateBulkActionsProgress(p, printersToDisconnect.length);
  }
  updateBulkActionsProgress(
    printersToDisconnect.length,
    printersToDisconnect.length
  );
}

export function bulkOctoPrintPowerCommand() {
  bootbox.prompt({
    title: "Power command!",
    message: "<p>Please select an option below:</p>",
    inputType: "radio",
    inputOptions: [
      {
        text: "Restart OctoPrint",
        value: "restart",
      },
      {
        text: "Reboot Host",
        value: "reboot",
      },
      {
        text: "Shutdown Host",
        value: "shutdown",
      },
    ],
    callback: async function (result) {
      const printersToPower = await getCurrentlySelectedPrinterList();
      showBulkActionsModal();
      updateBulkActionsProgress(0, printersToPower.length);
      generateTableRows(printersToPower);
      for (let p = 0; p < printersToPower.length; p++) {
        const response = await sendPowerCommandToOctoPrint(
          printersToPower[p],
          result
        );
        updateTableRow(
          printersToPower[p]._id,
          response.status,
          response.message
        );
        updateBulkActionsProgress(p, printersToPower.length);
      }
      updateBulkActionsProgress(printersToPower.length, printersToPower.length);
    },
  });
}

export function bulkOctoPrintPreHeatCommand() {
  bootbox.dialog({
    title: "Bulk printer heating...",
    message: `
        <form class="form-inline">
           <div class="input-group mb-3">
            <div class="input-group-prepend">
              <label class="input-group-text" for="preHeatToolSelect">Tool #: </label>
            </div>
            <select class="custom-select" id="preHeatToolSelect">
              <option selected value="0">0</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </div>
          <div class="input-group mb-3">
            <input type="text" class="form-control" placeholder="0" aria-label="0" aria-describedby="basic-addon1" id="preHeatToolTempSelect">
            <div class="input-group-append">
              <span class="input-group-text" >°C</span>
            </div>
          </div>
          <p>&nbsp;</p>
          <div class="input-group mb-3">
            <div class="input-group-prepend">
              <span class="input-group-text" >Bed</span>
            </div>
            <input type="text" class="form-control" placeholder="0" aria-label="0" aria-describedby="basic-addon1" id="preHeatBedTempSelect">
            <div class="input-group-append">
              <span class="input-group-text" >°C</span>
            </div>
          </div>
          <p>&nbsp;</p>
          <div class="input-group mb-3">
            <div class="input-group-prepend">
              <span class="input-group-text" >Chamber</span>
            </div>
            <input type="text" class="form-control" placeholder="0" aria-label="0" aria-describedby="basic-addon1" id="preHeatChamberTempSelect">
                  <div class="input-group-append">
              <span class="input-group-text" >°C</span>
            </div>
          </div>
        </form>
        `,
    size: "large",
    onEscape: true,
    backdrop: true,
    closeButton: true,
    buttons: {
      action: {
        label: "<i class=\"fas fa-fire\"></i> Heat!",
        className: "btn-success",
        callback: async function () {
          const toolNumber = document.getElementById("preHeatToolSelect");
          const toolTemp = document.getElementById("preHeatToolTempSelect");
          const bedTemp = document.getElementById("preHeatBedTempSelect");
          const chamberTemp = document.getElementById(
            "preHeatChamberTempSelect"
          );

          const printersToPreHeat = await getCurrentlySelectedPrinterList();
          showBulkActionsModal();
          updateBulkActionsProgress(0, printersToPreHeat.length);
          generateTableRows(printersToPreHeat);
          for (let p = 0; p < printersToPreHeat.length; p++) {
            let response;
            if (toolTemp.value && toolTemp.value > 0) {
              response = await printerPreHeatTool(
                printersToPreHeat[p],
                toolTemp,
                toolNumber
              );
              updateTableRow(
                printersToPreHeat[p]._id,
                response.status,
                response.message
              );
              updateBulkActionsProgress(p, printersToPreHeat.length);
            }
            if (bedTemp.value !== "" && bedTemp.value > 0) {
              response = await printerPreHeatBed(printersToPreHeat[p], bedTemp);
              updateTableRow(
                printersToPreHeat[p]._id,
                response.status,
                response.message
              );
              updateBulkActionsProgress(p, printersToPreHeat.length);
            }
            if (chamberTemp.value !== "" && chamberTemp.value > 0) {
              response = await printerPreHeatChamber(
                printersToPreHeat[p],
                chamberTemp
              );
              updateTableRow(
                printersToPreHeat[p]._id,
                response.status,
                response.message
              );
              updateBulkActionsProgress(p, printersToPreHeat.length);
            }
          }
          updateBulkActionsProgress(
            printersToPreHeat.length,
            printersToPreHeat.length
          );
        },
      },
    },
  });
}

export async function bulkOctoPrintControlCommand() {
  const printersToControl = await getCurrentlySelectedPrinterList();
  let cameraBlock = "";
  printersToControl.forEach((printer) => {
    if (printer.camURL && printer.camURL.length !== 0) {
      cameraBlock += `
        <div class="col-lg-3">
            <img id="printerCameraControl-${printer._id}" alt="Printer Camera Stream" width="100%" src="${printer.camURL}">
        </div>
        `;
    }
  });

  bootbox.dialog({
    title: "Bulk printer control",
    message: `
      <div id="printerControls" class="row">
            <div class="col-lg-12">
              <div class="row">
                 ${cameraBlock}
              </div>
            </div>
            <div class="col-md-6">
                            <div class="row">
                    <div class="col-9 text-center">
                      
                    
                            <h5>X/Y</h5>
                     
                        <hr>
                    </div>
                    <div class="col-3 text-center">
                     
                            <h5>Z</h5>
                     
                        <hr>
                    </div>
                </div>
                <div class="row">
                    <div class="col-3"></div>
                    <div class="col-3">
                        <center><button id="pcYpos" type="button" class="btn btn-light"><i class="fas fa-arrow-up"></i></button></center>
                    </div>
                    <div class="col-3"></div>
                    <div class="col-3">
                        <center><button id="pcZpos" type="button" class="btn btn-light"><i class="fas fa-arrow-up"></i></button></center>
                    </div>
                </div>
                <div class="row">
                    <div class="col-3">
                        <center><button id="pcXneg" type="button" class="btn btn-light"><i class="fas fa-arrow-left"></i></button></center>
                    </div>
                    <div class="col-3">
                        <center><button id="pcXYhome" type="button" class="btn btn-light"><i class="fas fa-home"></i></button></center>
                    </div>
                    <div class="col-3">
                        <center><button id="pcXpos" type="button" class="btn btn-light"><i class="fas fa-arrow-right"></i></button></center>
                    </div>
                    <div class="col-3">
                        <center><button id="pcZhome" type="button" class="btn btn-light"><i class="fas fa-home"></i></button></center>
                    </div>
                </div>
                <div class="row">
                    <div class="col-3"></div>
                    <div class="col-3">
                        <center><button id="pcYneg" type="button" class="btn btn-light"><i class="fas fa-arrow-down"></i></button></center>
                    </div>
                    <div class="col-3"></div>
                    <div class="col-3">
                        <center><button id="pcZneg" type="button" class="btn btn-light"><i class="fas fa-arrow-down"></i></button></center>
                    </div>
                </div>
                <div class="row">
                    <div class="col-12">
                        <center>
                            <div id="pcAxisSteps" class="btn-group" role="group">
                                <button id="pcAxisSteps01" type="button" class="btn btn-light" value="01">0.1</button>
                                <button id="pcAxisSteps1" type="button" class="btn btn-light" value="1">1</button>
                                <button id="pcAxisSteps10" type="button" class="btn btn-dark active" value="10">10</button>
                                <button id="pcAxisSteps100" type="button" class="btn btn-light" value="100">100</button>
                            </div>
                        </center>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
            <center>
            <button id="pmPrintStart" type="button" class="btn btn-success mb-1" role="button" style="display: inline-block;"><i class="fas fa-print"></i> Print</button> <br>
            <button id="pmPrintPause" type="button" class="btn btn-light mb-1" role="button" style="display: inline-block;"><i class="fas fa-pause"></i> Pause</button> <br>
            <button id="pmPrintRestart" type="button" class="btn btn-warning mb-1" role="button"  style="display: inline-block;"><i class="fas fa-undo"></i> Restart</button> <br>
            <button id="pmPrintResume" type="button" class="btn btn-info mb-1" role="button"  style="display: inline-block;"><i class="fas fa-redo"></i> Resume</button> <br>
            <button id="pmPrintStop" type="button" class="btn btn-danger mb-1" style="display: inline-block;"><i class="fas fa-square"></i> Cancel</button> <br>
            </center>
            </div>
        `,
    size: "large",
    onEscape: true,
    backdrop: true,
    closeButton: true,
    onShow: function () {
      //Grab Page
      const printerControls = {
        xPlus: document.getElementById("pcXpos"),
        xMinus: document.getElementById("pcXneg"),
        yPlus: document.getElementById("pcYpos"),
        yMinus: document.getElementById("pcYneg"),
        xyHome: document.getElementById("pcXYhome"),
        zPlus: document.getElementById("pcZpos"),
        zMinus: document.getElementById("pcZneg"),
        zHome: document.getElementById("pcZhome"),
        step01: document.getElementById("pcAxisSteps01"),
        step1: document.getElementById("pcAxisSteps1"),
        step10: document.getElementById("pcAxisSteps10"),
        step100: document.getElementById("pcAxisSteps100"),
        printStart: document.getElementById("pmPrintStart"),
        printPause: document.getElementById("pmPrintPause"),
        printRestart: document.getElementById("pmPrintRestart"),
        printResume: document.getElementById("pmPrintResume"),
        printStop: document.getElementById("pmPrintStop"),
      };
      printerControls.printStart.addEventListener("click", (element) => {
        printersToControl.forEach((printer) => {
          printerStartPrint(printer, element);
        });
      });
      printerControls.printPause.addEventListener("click", (element) => {
        printersToControl.forEach((printer) => {
          printerPausePrint(printer, element);
        });
      });
      printerControls.printRestart.addEventListener("click", (element) => {
        printersToControl.forEach((printer) => {
          printerRestartPrint(printer, element);
        });
      });
      printerControls.printResume.addEventListener("click", (element) => {
        printersToControl.forEach((printer) => {
          printerResumePrint(printer, element);
        });
      });
      printerControls.printStop.addEventListener("click", (element) => {
        bootbox.confirm({
          message: "Are you sure you want to cancel all of your ongoing print?",
          buttons: {
            cancel: {
              label: "<i class=\"fa fa-times\"></i> Cancel",
            },
            confirm: {
              label: "<i class=\"fa fa-check\"></i> Confirm",
            },
          },
          callback(result) {
            if (result) {
              printersToControl.forEach((printer) => {
                printerStopPrint(printer, element);
              });
            }
          },
        });
      });

      printerControls.xPlus.addEventListener("click", (element) => {
        printersToControl.forEach((printer) => {
          printerMoveAxis(element, printer, "x");
        });
      });
      printerControls.xMinus.addEventListener("click", (element) => {
        printersToControl.forEach((printer) => {
          printerMoveAxis(element, printer, "x", "-");
        });
      });
      printerControls.yPlus.addEventListener("click", (element) => {
        printersToControl.forEach((printer) => {
          printerMoveAxis(element, printer, "y");
        });
      });
      printerControls.yMinus.addEventListener("click", (element) => {
        printersToControl.forEach((printer) => {
          printerMoveAxis(element, printer, "y", "-");
        });
      });
      printerControls.xyHome.addEventListener("click", (element) => {
        printersToControl.forEach((printer) => {
          printerHomeAxis(element, printer, ["x", "y"]);
        });
      });
      printerControls.zPlus.addEventListener("click", (element) => {
        printersToControl.forEach((printer) => {
          printerMoveAxis(element, printer, "z");
        });
      });
      printerControls.zMinus.addEventListener("click", (element) => {
        printersToControl.forEach((printer) => {
          printerMoveAxis(element, printer, "z", "-");
        });
      });
      printerControls.zHome.addEventListener("click", (element) => {
        printersToControl.forEach((printer) => {
          printerHomeAxis(element, printer, ["z"]);
        });
      });
      printerControls.step01.addEventListener("click", () => {
        printersToControl.forEach((printer) => {
          OctoFarmClient.setPrinterSteps(printer._id, "01");
        });

        printerControls.step01.className = LIGHT_BUTTON_CLASS_ACTIVE;
        printerControls.step1.className = LIGHT_BUTTON_CLASS;
        printerControls.step10.className = LIGHT_BUTTON_CLASS;
        printerControls.step100.className = LIGHT_BUTTON_CLASS;
      });
      printerControls.step1.addEventListener("click", () => {
        printersToControl.forEach((printer) => {
          OctoFarmClient.setPrinterSteps(printer._id, "1");
        });

        printerControls.step1.className = LIGHT_BUTTON_CLASS_ACTIVE;
        printerControls.step01.className = LIGHT_BUTTON_CLASS;
        printerControls.step10.className = LIGHT_BUTTON_CLASS;
        printerControls.step100.className = LIGHT_BUTTON_CLASS;
      });
      printerControls.step10.addEventListener("click", () => {
        printersToControl.forEach((printer) => {
          OctoFarmClient.setPrinterSteps(printer._id, "100");
        });

        printerControls.step10.className = LIGHT_BUTTON_CLASS_ACTIVE;
        printerControls.step1.className = LIGHT_BUTTON_CLASS;
        printerControls.step01.className = LIGHT_BUTTON_CLASS;
        printerControls.step100.className = LIGHT_BUTTON_CLASS;
      });
      printerControls.step100.addEventListener("click", () => {
        printersToControl.forEach((printer) => {
          OctoFarmClient.setPrinterSteps(printer._id, "100");
        });

        printerControls.step100.className = LIGHT_BUTTON_CLASS_ACTIVE;
        printerControls.step1.className = LIGHT_BUTTON_CLASS;
        printerControls.step10.className = LIGHT_BUTTON_CLASS;
        printerControls.step01.className = LIGHT_BUTTON_CLASS;
      });
    },
  });
}

export async function bulkOctoPrintGcodeCommand() {
  const printersToSendGcode = await getCurrentlySelectedPrinterList();

  bootbox.prompt({
    size: "large",
    title: "What gcode commands would you like sent?",
    inputType: "textarea",
    onShow: async function () {
      const textArea = document.getElementsByClassName(
        "bootbox-input bootbox-input-textarea form-control"
      );
      const customGcodeEE =
        "<h5>Pre-defined Gcode Scripts: </h5><div class='mb-1' id='customGcodeCommandsArea'></div><h5 class='mt-2'>On demand gcode script: </h5>";
      textArea[0].insertAdjacentHTML("beforebegin", customGcodeEE);
      const gcodeButtons = await OctoFarmClient.getCustomGcode();
      const area = document.getElementById("customGcodeCommandsArea");
      if (area) {
        gcodeButtons.forEach((scripts) => {
          const button = CustomGenerator.getButton(scripts);
          area.insertAdjacentHTML("beforeend", button);
          document
            .getElementById("gcode-" + scripts._id)
            .addEventListener("click", async () => {
              showBulkActionsModal();
              updateBulkActionsProgress(0, printersToSendGcode.length);
              generateTableRows(printersToSendGcode);
              for (let p = 0; p < printersToSendGcode.length; p++) {
                // To cover old script states we must check for blank printer ids.
                if (
                  scripts.printerIds.length === 0 ||
                  scripts.printerIds.includes("99aa99aaa9999a99999999aa")
                ) {
                  const post = await CustomGenerator.fireCommand(
                    scripts._id,
                    scripts.gcode,
                    printersToSendGcode[p]
                  );
                  updateBulkActionsProgress(p, printersToSendGcode.length);
                  if (post.status === 204) {
                    updateTableRow(
                      printersToSendGcode[p]._id,
                      "success",
                      "Successfully sent your command to the printer!"
                    );
                  } else {
                    updateTableRow(
                      printersToSendGcode[p]._id,
                      "danger",
                      "Failed to send your command to the printer!"
                    );
                  }
                } else {
                  //Skipped
                  updateTableRow(
                    printersToSendGcode[p]._id,
                    "warning",
                    "Printer was skipped because it is not allowed to be sent the script..."
                  );
                }
              }
              updateBulkActionsProgress(
                printersToSendGcode.length,
                printersToSendGcode.length
              );
            });
        });
      }
    },
    callback: async function (result) {
      if (result) {
        showBulkActionsModal();
        updateBulkActionsProgress(0, printersToSendGcode.length);
        generateTableRows(printersToSendGcode);
        for (const printer of printersToSendGcode) {
          const response = await printerSendGcode(printer, result);
          updateTableRow(printer._id, response.status, response.message);
        }
        updateBulkActionsProgress(
          printersToSendGcode.length,
          printersToSendGcode.length
        );
      }
    },
  });
}

export async function bulkOctoPrintPluginAction(action) {
  const printersForPluginAction = await getCurrentlySelectedPrinterList();
  try {
    const pluginList = [];
    if (action === "install") {
      const pluginRepositoryList = await OctoFarmClient.get(
        "printers/pluginList"
      );
      pluginRepositoryList.forEach((plugin) => {
        pluginList.push({
          text: returnPluginListTemplate(plugin),
          value: plugin.archive,
        });
      });
    } else {
      const idList = printersForPluginAction.map(function (printer) {
        return printer._id;
      });
      for (const id of idList) {
        if (action === "enable") {
          const disabledPluginList = await OctoFarmClient.get(
            "printers/disabledPluginList/" + id
          );
          const cleanDisabledList = createPluginList(disabledPluginList);
          cleanDisabledList.forEach((plugin) => {
            pluginList.push(plugin);
          });
        }
        if (action === "disable") {
          const enabledPluginList = await OctoFarmClient.get(
            "printers/enabledPluginList/" + id
          );
          const cleanEnabledList = createPluginList(enabledPluginList);
          cleanEnabledList.forEach((plugin) => {
            pluginList.push(plugin);
          });
        }
        if (action === "uninstall") {
          const allInstalledPlugins = await OctoFarmClient.get(
            "printers/allPluginsList/" + id
          );
          const cleanAllPluginList = createPluginList(allInstalledPlugins);
          cleanAllPluginList.forEach((plugin) => {
            pluginList.push(plugin);
          });
        }
      }
    }

    const sortedPluginList = _.sortBy(pluginList, [
      function (o) {
        return o.text;
      },
    ]);

    const uniquePluginList = _.uniqBy(sortedPluginList, function (e) {
      return e.text;
    });

    //Install Promt
    if (uniquePluginList.length === 0) {
      UI.createAlert(
        "info",
        `You don't have any plugins to ${action}`,
        "clicked",
        4000
      );
    } else {
      bootbox.prompt({
        size: "large",
        title: `<form class="form-inline float-right">
                  <div class="form-group text-wrap">
                    <label for="searchPlugins text-wrap">
                      Please choose the plugin you'd like to ${action}.. or: &nbsp;
                    </label>
                    <input width="75%" id="searchPlugins" type="text" placeholder="Search for your plugin name here..." class="search-control search-control-underlined">
                  </div>
                </form>`,
        inputType: "checkbox",
        multiple: true,
        inputOptions: uniquePluginList,
        scrollable: true,
        onShow: function () {
          setupPluginSearch();
        },
        callback: async function (result) {
          if (!!result && result.length !== 0) {
            const pluginAmount = result.length * printersForPluginAction.length;
            showBulkActionsModal();
            updateBulkActionsProgress(0, pluginAmount);
            generateTableRows(printersForPluginAction);
            let count = 0;
            for (const printer of printersForPluginAction) {
              for (const plugin of result) {
                const response = await octoPrintPluginInstallAction(
                  printer,
                  plugin,
                  action
                );
                updateTableRow(printer._id, response.status, response.message);
                updateBulkActionsProgress(count, pluginAmount);
                count++;
              }
              await OctoFarmClient.post(
                "printers/rescanOctoPrintUpdates/" + printer._id
              );
            }
            updateBulkActionsProgress(pluginAmount, pluginAmount);
          } else {
            UI.createAlert(
              "warning",
              "No plugins we're selected to install... please select some plugins",
              3000,
              "Clicked"
            );
          }
        },
      });
    }
  } catch (e) {
    console.error(e);
    UI.createAlert(
      "error",
      `Failed to generate plugin list, please check logs: ${e}`,
      0,
      "clicked"
    );
    const errorObject = ClientErrors.SILENT_ERROR;
    errorObject.message = `Bulk Commands - ${e}`;
    throw new ApplicationError(errorObject);
  }
}

function createPluginList(plugins) {
  const pluginList = [];
  plugins.forEach((plugin) => {
    pluginList.push({
      text: returnPluginSelectTemplate(plugin),
      value: plugin.key,
    });
  });
  return pluginList;
}

export async function bulkEnableVirtualPrinter() {
  const printers = await OctoFarmClient.listPrinters();
  const alert = UI.createAlert(
    "warning",
    `${UI.returnSpinnerTemplate()} Setting up your OctoPrint settings, please wait...`
  );

  const { successfulPrinters, failedPrinters } =
    await setupOctoPrintForVirtualPrinter(printers);

  alert.close();
  bootbox.alert(successfulPrinters + failedPrinters);
}

export async function bulkUpdateOctoPrintSettings() {
  const printersForSettingsAction = await getCurrentlySelectedPrinterList();
  const getSettingsList = await OctoPrintClient.get(
    printersForSettingsAction[0],
    "api/settings"
  );
  if (getSettingsList?.status === 200) {
    const {
      appearance,
      gcodeAnalysis,
      plugins, //Special Case, it's it's own settings set...
      scripts,
      serial,
      server,
      system,
      temperature,
      terminalFilters,
      webcam,
      //github
    } = await getSettingsList.json();

    $("#bulkUpdateOctoPrintSettingsModal").modal("show");
    // populate appearance settings
    populateBulkSettingsForms({
      appearance,
      gcodeAnalysis,
      plugins, //Special Case, it's it's own settings set...
      scripts,
      serial,
      server,
      system,
      temperature,
      terminalFilters,
      webcam,
      //github
    });

    // populate gcodeAnalysis

    // populate plugins

    // populate scripts

    // populate serial

    // populate server

    // populate system

    // populate temperature

    // populate terminal filters

    // populate webcam

    // populate github
  } else {
    UI.createAlert(
      "danger",
      "Failed to grab latest settings list...",
      3000,
      "Clicked"
    );
  }
}

setInterval(async () => {
  //Auto refresh of files
  // If there are files in the queue, plow through until uploaded... currently single file at a time.
  if (fileUploads.size() > 0) {
    const current = fileUploads.first();
    if (!current.active) {
      fileUploads.activate(0);
      const currentDate = new Date();
      let file = await current.upload(current);
      file = JSON.parse(file);
      file.index = current.index;
      file.uploadDate = currentDate.getTime() / 1000;
      await OctoFarmClient.post("printers/newFiles", file);
      fileUploads.remove();
      const fileCounts = document.getElementById(`fileCounts-${current.index}`);
      if (fileCounts && fileCounts.innerHTML === "1") {
        fileCounts.innerHTML = ` ${0}`;
      }
    }
  }
  const allUploads = fileUploads.all();
  allUploads.forEach((uploads) => {
    const currentCount = allUploads.reduce(function (n, up) {
      return n + (up.index === uploads.index);
    }, 0);
    const fileCounts = document.getElementById(`fileCounts-${uploads.index}`);
    if (fileCounts) {
      fileCounts.innerHTML = ` ${currentCount}`;
    }
  });
}, 1000);
