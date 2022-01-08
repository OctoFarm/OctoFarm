import { findIndex } from "lodash";

import OctoFarmClient from "../../../services/octofarm-client.service.js";
import UI from "../../../lib/functions/ui";
import PrinterSelect from "../../../lib/modules/printerSelect";
import {
  octoPrintPluginInstallAction,
  updateOctoPrintPlugins
} from "../../../octoprint/octoprint-plugin-commands";
import {
  disconnectPrinterFromOctoPrint,
  quickConnectPrinterToOctoPrint,
  sendPowerCommandToOctoPrint,
  updateOctoPrintClient
} from "../../../octoprint/octoprint-client-commands";
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
  printerStopPrint
} from "../../../octoprint/octoprint-printer-commands";
import { setupOctoPrintForVirtualPrinter } from "../../../octoprint/octoprint-settings.actions";
import CustomGenerator from "../../../lib/modules/customScripts";
import { setupPluginSearch } from "./plugin-search.function";
import {
  returnPluginListTemplate,
  returnPluginSelectTemplate
} from "../templates/octoprint-plugin-list.template";
import {
  generateTableRows,
  showBulkActionsModal,
  updateBulkActionsProgress,
  updateTableRow
} from "./bulk-actions-progress.functions";
import bulkActionsStates from "../bulk-actions.constants";

import Queue from "../../../lib/modules/clientQueue.js";
import OctoPrintClient from "../../../lib/octoprint";

const fileUploads = new Queue();

let selectedFolder = "";

// TODO this should come from printer select to save the extra call, re-iteration and matching.
async function getCurrentlySelectedPrinterList() {
  try {
    const currentPrinterList = await OctoFarmClient.listPrinters();
    const matchedPrinters = [];
    //Grab all check boxes
    const selectedPrinters = PrinterSelect.getSelected();
    selectedPrinters.forEach((element) => {
      const printerID = element.id.split("-");
      const index = findIndex(currentPrinterList, function (o) {
        return o._id == printerID[1];
      });
      if (index > -1) {
        matchedPrinters.push(currentPrinterList[index]);
      }
    });
    return matchedPrinters;
  } catch (e) {
    console.error(e);
    UI.createAlert("error", `Couldn't get selected printer list: ${e}`, 0, "clicked");
    return [];
  }
}

export async function bulkOctoPrintPluginUpdate() {
  try {
    let currentPrinterList = await OctoFarmClient.listPrinters();
    let message = "";
    let toUpdate = [];
    let pluginList = [];
    for (let printer = 0; printer < currentPrinterList.length; printer++) {
      let currentPrinter = currentPrinterList[printer];
      if (currentPrinter?.octoPrintPluginUpdates?.length > 0) {
        message += currentPrinter.printerName + "<br>";
        toUpdate.push({
          _id: currentPrinter._id,
          printerURL: currentPrinter.printerURL,
          printerName: currentPrinter.printerName,
          apikey: currentPrinter.apikey
        });
        for (let plugin = 0; plugin < currentPrinter.octoPrintPluginUpdates.length; plugin++) {
          let currentPlugin = currentPrinter.octoPrintPluginUpdates[plugin];
          pluginList.push(currentPlugin.id);
        }
      }
    }
    if (toUpdate.length < 1) {
      UI.createAlert("error", "There are no plugin updates available!", 0, "clicked");
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
            const response = await updateOctoPrintPlugins(pluginList, toUpdate[i]);
            updateTableRow(toUpdate[i]._id, response.status, response.message);
            updateBulkActionsProgress(i, toUpdate.length);
          }
          updateBulkActionsProgress(toUpdate.length, toUpdate.length);
        }
      }
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
    let currentPrinterList = await OctoFarmClient.listPrinters();
    let message = "";
    let toUpdate = [];
    for (let printer = 0; printer < currentPrinterList.length; printer++) {
      let currentPrinter = currentPrinterList[printer];
      if (currentPrinter?.octoPrintUpdate?.updateAvailable) {
        message += currentPrinter.printerName + "<br>";

        toUpdate.push({
          _id: currentPrinter._id,
          printerURL: currentPrinter.printerURL,
          printerName: currentPrinter.printerName,
          apikey: currentPrinter.apikey
        });
      }
    }
    if (toUpdate.length < 1) {
      UI.createAlert("error", "There are no OctoPrint updates available!", 0, "clicked");
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
      }
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

function setupSingleFileMode(printers, file = "No File", selectedFolder = "") {
  printers.forEach((printer) => {
    document.getElementById(`printerFileChoice-${printer._id}`).innerHTML = `
      <small><i class="fas fa-file-code"></i> ${selectedFolder}/${file.name}</small>
    `;
  });
}

function setupMultiFileMode(printers, files, selectedFolder = "") {
  if (files) {
    printers.forEach((printer, index) => {
      if (files[index]) {
        document.getElementById(`printerFileChoice-${printer._id}`).innerHTML = `
      <small><i class="fas fa-file-code"></i>${selectedFolder}/${files[index].name}</small>
    `;
      } else {
        document.getElementById(`printerFileChoice-${printer._id}`).innerHTML = `
      <small><i class="fas fa-forward"></i> Select more files to send to this printer!</small>
    `;
      }
    });
  }
}

function fileUpload(file) {
  return new Promise(function (resolve, reject) {
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
    const url = `${printerInfo.printerURL}/api/files/local`;
    const xhr = new XMLHttpRequest();
    file = file.file;
    xhr.open("POST", url);
    xhr.upload.onprogress = function (e) {
      if (e.lengthComputable) {
        // Update progress
        const progressBar = document.getElementById("bpUploadProgress-" + index);
        progressBar.classList = "progress-bar progress-bar-striped bg-warning";
        if (progressBar) {
          let percentLoad = (e.loaded / e.total) * 100;
          if (isNaN(percentLoad)) {
            percentLoad = 0;
          }
          progressBar.style.width = `${Math.floor(percentLoad)}%`;
          progressBar.innerHTML = "Uploading: " + Math.floor(percentLoad) + "%";
          if (percentLoad === 100) {
            progressBar.classList = "progress-bar progress-bar-striped bg-success";
          }
        }
      }
    };

    // xhr.setRequestHeader("Content-Type", "multipart/form-data");
    xhr.setRequestHeader("X-Api-Key", printerInfo.apikey);
    xhr.onloadend = async function (e) {
      if (this.status >= 200 && this.status < 300) {
        resolve({
          status: bulkActionsStates.SUCCESS,
          message: "Successfully uploaded your file! Printing started."
        });
        // Success!
      } else {
        resolve({
          status: bulkActionsStates.ERROR,
          message: "An error occured whilst updating your file... Printing failed."
        });
        // Error occured
      }
    };
    xhr.onerror = function () {
      resolve({
        status: bulkActionsStates.ERROR,
        message: "An error occured whilst updating your file... printing failed."
      });
      // Error occured!
    };
    xhr.send(formData);
  });
}

export async function bulkPrintFileSetup() {
  document.getElementById("bpActionButtonElement").innerHTML =
    '<button id="bpActionButton" type="button" class="btn btn-success" disabled>Start Prints!</button>';
  document.getElementById("bpuploadFilesElement").innerHTML = `<div class="custom-file">
          <input type="file" accept=".gcode,.gco" class="custom-file-input" id="bpFileUpload" multiple>
          <label class="custom-file-label" multiple for="bpFileUpload">Click here to upload file(s)</label>
      </div>
    `;
  document.getElementById(
    "bpFilesSelectElement"
  ).innerHTML = `<select id="bpFileSelect" class="custom-select" multiple>
                </select>`;

  const multiFolderInput = document.getElementById("multiNewFolder");
  const multiNewFolderNew = document.getElementById("multiNewFolderNew");
  let uniqueFolderList = await OctoFarmClient.getOctoPrintUniqueFolders();
  uniqueFolderList.forEach((folder) => {
    multiFolderInput.insertAdjacentHTML(
      "beforeend",
      `
        <option value="${folder}">${folder}</option>
      `
    );
  });

  // Load the new modal up...
  $("#bulkPrintSetupModal").modal("show");
  // Grab current list of printers...
  let selectedFiles;
  const printersToControl = await getCurrentlySelectedPrinterList();

  const printerDisplayElement = document.getElementById("bpSelectedPrintersAndFiles");
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
          <div id="printerFolderChoice-${printer._id}"><small><i class="fas fa-spinner fa-pulse"></i> Awaiting folder selection...</small></div>
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
    for (let p = 0; p < printersToControl.length; p++) {
      const response = await quickConnectPrinterToOctoPrint(printersToControl[p]);
      updateTableRow(printersToControl[p]._id, response.status, response.message);
    }

    // Check if folder exists and create if not...

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
            print: true
          };
          await OctoPrintClient.updateFeedAndFlow(currentPrinter);
          await OctoPrintClient.updateFilamentOffsets(currentPrinter);
          console.log("RUN UPLOAD FOLDER", selectedFolder);
          const url = "files/local/" + selectedFolder + selectedFiles[0].name.replaceAll(" ", "_");
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
          const newObject = {};
          newObject.file = selectedFiles[0];
          newObject.index = currentPrinter._id;
          newObject.printerInfo = currentPrinter;
          newObject.currentFolder = "local/" + selectedFolder;
          newObject.print = true;
          updateTableRow(
            currentPrinter._id,
            bulkActionsStates.SKIPPED,
            `
            <div class="progress">
              <div id="bpUploadProgress-${currentPrinter._id}" class="progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">Uploading: 0%</div>
            </div>
          `
          );

          const response = await fileUpload(newObject);
          updateTableRow(currentPrinter._id, response.status, response.message, true);
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
              print: true
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
            const newObject = {};
            newObject.file = selectedFiles[p];
            newObject.index = currentPrinter._id;
            newObject.printerInfo = currentPrinter;
            newObject.currentFolder = "local/";
            newObject.print = true;

            updateTableRow(
              currentPrinter._id,
              bulkActionsStates.SKIPPED,
              `
              <div class="progress">
                <div id="bpUploadProgress-${currentPrinter._id}" class="progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">Uploading: 0%</div>
              </div>
            `
            );

            const response = await fileUpload(newObject);
            updateTableRow(currentPrinter._id, response.status, response.message, true);
          }
        } else {
          updateTableRow(
            currentPrinter._id,
            bulkActionsStates.ERROR,
            "Seems there wasn't enough files selected for the printers..."
          );
        }
      }
      updateBulkActionsProgress(printersToControl.length, printersToControl.length);
    }

    // Run a background sync of all printers files...
    for (let p = 0; p < printersToControl.length; p++) {
      await OctoFarmClient.post("printers/resyncFile", {
        i: printersToControl[p]._id
      });
    }
  }

  function grabFiles(Afiles) {
    Afiles = [...Afiles];
    return Afiles;
  }

  function setup() {
    if (selectedFiles) {
      updateSelectedFolder();
      if (selectedFiles.length === 1) {
        // Setup single file mode
        bpActionButton.disabled = false;
        setupSingleFileMode(printersToControl, selectedFiles[0], selectedFolder);
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
  document.getElementById("bpFileUpload").addEventListener("change", function () {
    selectedFiles = grabFiles(this.files);
    setup();
  });

  bpActionButton.addEventListener("click", async function () {
    await runUpload();
  });

  async function checkIfPathExistsOnOctoPrint() {
    for (let i = 0; i < printersToControl.length; i++) {
      const currentPrinter = printersToControl[i];

      if (selectedFolder[0] === "/") {
        selectedFolder = selectedFolder.replace("/", "");
      }
      const doesFolderExist = await OctoPrintClient.checkFile(currentPrinter, selectedFolder);

      if (doesFolderExist === 200) {
        document.getElementById("printerFolderChoice-" + currentPrinter._id).innerHTML =
          '<i class="fas fa-folder-plus text-success"></i> Folder exists!';
        printersToControl[i].folderExists = true;
      } else {
        document.getElementById("printerFolderChoice-" + currentPrinter._id).innerHTML =
          '<i class="fas fa-folder-minus text-warning"></i> Folder will be created!';
        printersToControl[i].folderExists = false;
      }
    }
  }

  async function updateSelectedFolder() {
    if (multiFolderInput.value !== "") {
      selectedFolder = multiFolderInput.value;
    }
    if (multiNewFolderNew.value !== "") {
      selectedFolder = multiNewFolderNew.value;
    }
    if (multiFolderInput.value !== "" && multiNewFolderNew.value !== "") {
      selectedFolder = multiFolderInput.value + "/" + multiNewFolderNew.value;
    }

    const regexValidation = new RegExp("\\/[a-zA-Z0-9_\\/-]*[^\\/]$");
    // validate the path
    if (!regexValidation.exec("/" + selectedFolder.replace(/ /g, "_"))) {
      if (multiFolderInput.value !== "") {
        multiFolderInput.classList.add("is-invalid");
      }
      if (multiNewFolderNew.value !== "") {
        multiNewFolderNew.classList.add("is-invalid");
      }
    } else {
      if (multiFolderInput.value !== "") {
        multiFolderInput.classList.remove("is-invalid");
        multiFolderInput.classList.add("is-valid");
      }
      if (multiNewFolderNew.value !== "") {
        multiNewFolderNew.classList.remove("is-invalid");
        multiNewFolderNew.classList.add("is-valid");
      }

      await checkIfPathExistsOnOctoPrint();
    }
  }

  multiFolderInput.addEventListener("change", function () {
    setup();
  });

  multiNewFolderNew.addEventListener("change", function () {
    setup();
  });
}

export async function bulkDisconnectPrinters() {
  const printersToDisconnect = await getCurrentlySelectedPrinterList();
  showBulkActionsModal();
  updateBulkActionsProgress(0, printersToDisconnect.length);
  generateTableRows(printersToDisconnect);
  for (let p = 0; p < printersToDisconnect.length; p++) {
    const response = await disconnectPrinterFromOctoPrint(printersToDisconnect[p]);
    updateTableRow(printersToDisconnect[p]._id, response.status, response.message);
    updateBulkActionsProgress(p, printersToDisconnect.length);
  }
  updateBulkActionsProgress(printersToDisconnect.length, printersToDisconnect.length);
}

export function bulkOctoPrintPowerCommand() {
  bootbox.prompt({
    title: "Power command!",
    message: "<p>Please select an option below:</p>",
    inputType: "radio",
    inputOptions: [
      {
        text: "Restart OctoPrint",
        value: "restart"
      },
      {
        text: "Reboot Host",
        value: "reboot"
      },
      {
        text: "Shutdown Host",
        value: "shutdown"
      }
    ],
    callback: async function (result) {
      const printersToPower = await getCurrentlySelectedPrinterList();
      showBulkActionsModal();
      updateBulkActionsProgress(0, printersToPower.length);
      generateTableRows(printersToPower);
      for (let p = 0; p < printersToPower.length; p++) {
        const response = await sendPowerCommandToOctoPrint(printersToPower[p], result);
        updateTableRow(printersToPower[p]._id, response.status, response.message);
        updateBulkActionsProgress(p, printersToPower.length);
      }
      updateBulkActionsProgress(printersToPower.length, printersToPower.length);
    }
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
              <option value="0">1</option>
              <option value="0">2</option>
              <option value="0">3</option>
              <option value="0">4</option>
            </select>
          </div>
          <div class="input-group mb-3">
            <input type="text" class="form-control" placeholder="0" aria-label="0" aria-describedby="basic-addon1" id="preHeatToolTempSelect">
            <div class="input-group-append">
              <span class="input-group-text" id="basic-addon1">°C</span>
            </div>
          </div>
          <p>&nbsp;</p>
          <div class="input-group mb-3">
            <div class="input-group-prepend">
              <span class="input-group-text" id="basic-addon1">Bed</span>
            </div>
            <input type="text" class="form-control" placeholder="0" aria-label="0" aria-describedby="basic-addon1" id="preHeatBedTempSelect">
            <div class="input-group-append">
              <span class="input-group-text" id="basic-addon1">°C</span>
            </div>
          </div>
          <p>&nbsp;</p>
          <div class="input-group mb-3">
            <div class="input-group-prepend">
              <span class="input-group-text" id="basic-addon1">Chamber</span>
            </div>
            <input type="text" class="form-control" placeholder="0" aria-label="0" aria-describedby="basic-addon1" id="preHeatChamberTempSelect">
                  <div class="input-group-append">
              <span class="input-group-text" id="basic-addon1">°C</span>
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
        label: '<i class="fas fa-fire"></i> Heat!',
        className: "btn-success",
        callback: async function () {
          let toolNumber = document.getElementById("preHeatToolSelect");
          let toolTemp = document.getElementById("preHeatToolTempSelect");
          let bedTemp = document.getElementById("preHeatBedTempSelect");
          let chamberTemp = document.getElementById("preHeatChamberTempSelect");

          const printersToPreHeat = await getCurrentlySelectedPrinterList();
          showBulkActionsModal();
          updateBulkActionsProgress(0, printersToPreHeat.length);
          generateTableRows(printersToPreHeat);
          for (let p = 0; p < printersToPreHeat.length; p++) {
            let response;
            if (toolTemp.value && toolTemp.value > 0) {
              response = await printerPreHeatTool(printersToPreHeat[p], toolTemp, toolNumber);
              updateTableRow(printersToPreHeat[p]._id, response.status, response.message);
              updateBulkActionsProgress(p, printersToPreHeat.length);
            }
            if (bedTemp.value !== "" && bedTemp.value > 0) {
              response = await printerPreHeatBed(printersToPreHeat[p], bedTemp);
              updateTableRow(printersToPreHeat[p]._id, response.status, response.message);
              updateBulkActionsProgress(p, printersToPreHeat.length);
            }
            if (chamberTemp.value !== "" && chamberTemp.value > 0) {
              response = await printerPreHeatChamber(printersToPreHeat[p], chamberTemp);
              updateTableRow(printersToPreHeat[p]._id, response.status, response.message);
              updateBulkActionsProgress(p, printersToPreHeat.length);
            }
          }
          updateBulkActionsProgress(printersToPreHeat.length, printersToPreHeat.length);
        }
      }
    }
  });
}

export async function bulkOctoPrintControlCommand() {
  const printersToControl = await getCurrentlySelectedPrinterList();
  let cameraBlock = "";
  printersToControl.forEach((printer) => {
    if (printer.camURL && printer.camURL.length !== 0) {
      cameraBlock += `
        <div class="col-lg-3">
            <img width="100%" src="${printer.camURL}">
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
                    <div class="col-9">
                        <center>
                            <h5>X/Y</h5>
                        </center>
                        <hr>
                    </div>
                    <div class="col-3">
                        <center>
                            <h5>Z</h5>
                        </center>
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
    onShow: function (e) {
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
        printStop: document.getElementById("pmPrintStop")
      };
      printerControls.printStart.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerStartPrint(printer, e);
        });
      });
      printerControls.printPause.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerPausePrint(printer, e);
        });
      });
      printerControls.printRestart.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerRestartPrint(printer, e);
        });
      });
      printerControls.printResume.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerResumePrint(printer, e);
        });
      });
      printerControls.printStop.addEventListener("click", (e) => {
        bootbox.confirm({
          message: "Are you sure you want to cancel all of your ongoing print?",
          buttons: {
            cancel: {
              label: '<i class="fa fa-times"></i> Cancel'
            },
            confirm: {
              label: '<i class="fa fa-check"></i> Confirm'
            }
          },
          callback(result) {
            if (result) {
              printersToControl.forEach((printer) => {
                printerStopPrint(printer, e);
              });
            }
          }
        });
      });

      printerControls.xPlus.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerMoveAxis(e, printer, "x");
        });
      });
      printerControls.xMinus.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerMoveAxis(e, printer, "x", "-");
        });
      });
      printerControls.yPlus.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerMoveAxis(e, printer, "y");
        });
      });
      printerControls.yMinus.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerMoveAxis(e, printer, "y", "-");
        });
      });
      printerControls.xyHome.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerHomeAxis(e, printer, ["x", "y"]);
        });
      });
      printerControls.zPlus.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerMoveAxis(e, printer, "z");
        });
      });
      printerControls.zMinus.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerMoveAxis(e, printer, "z", "-");
        });
      });
      printerControls.zHome.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerHomeAxis(e, printer, ["z"]);
        });
      });
      printerControls.step01.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          OctoFarmClient.post("printers/stepChange", {
            printer: printer._id,
            newSteps: "01"
          });
        });

        printerControls.step01.className = "btn btn-dark active";
        printerControls.step1.className = "btn btn-light";
        printerControls.step10.className = "btn btn-light";
        printerControls.step100.className = "btn btn-light";
      });
      printerControls.step1.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          OctoFarmClient.post("printers/stepChange", {
            printer: printer._id,
            newSteps: "1"
          });
        });

        printerControls.step1.className = "btn btn-dark active";
        printerControls.step01.className = "btn btn-light";
        printerControls.step10.className = "btn btn-light";
        printerControls.step100.className = "btn btn-light";
      });
      printerControls.step10.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          OctoFarmClient.post("printers/stepChange", {
            printer: printer._id,
            newSteps: "10"
          });
        });

        printerControls.step10.className = "btn btn-dark active";
        printerControls.step1.className = "btn btn-light";
        printerControls.step01.className = "btn btn-light";
        printerControls.step100.className = "btn btn-light";
      });
      printerControls.step100.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          OctoFarmClient.post("printers/stepChange", {
            printer: printer._id,
            newSteps: "100"
          });
        });

        printerControls.step100.className = "btn btn-dark active";
        printerControls.step1.className = "btn btn-light";
        printerControls.step10.className = "btn btn-light";
        printerControls.step01.className = "btn btn-light";
      });
    }
  });
}

export async function bulkOctoPrintGcodeCommand() {
  const printersToSendGcode = await getCurrentlySelectedPrinterList();

  bootbox.prompt({
    size: "large",
    title: "What gcode commands would you like sent?",
    inputType: "textarea",
    onShow: async function (e) {
      let textArea = document.getElementsByClassName(
        "bootbox-input bootbox-input-textarea form-control"
      );
      const customGcodeEE =
        "<h5>Pre-defined Gcode Scripts: </h5><div class='mb-1' id='customGcodeCommandsArea'></div><h5 class='mt-2'>On demand gcode script: </h5>";
      textArea[0].insertAdjacentHTML("beforebegin", customGcodeEE);
      const gcodeButtons = await OctoFarmClient.getCustomGcode();
      let area = document.getElementById("customGcodeCommandsArea");
      if (area) {
        gcodeButtons.forEach((scripts) => {
          let button = CustomGenerator.getButton(scripts);
          area.insertAdjacentHTML("beforeend", button);
          document.getElementById("gcode-" + scripts._id).addEventListener("click", async (e) => {
            showBulkActionsModal();
            updateBulkActionsProgress(0, printersToSendGcode.length);
            generateTableRows(printersToSendGcode);
            for (let p = 0; p < printersToSendGcode.length; p++) {
              // To cover old script states we must check for blank printer ids.
              if (
                scripts.printerIds.length === 0 ||
                scripts.printerIds.includes(printersToSendGcode[p]._id)
              ) {
                let post = await CustomGenerator.fireCommand(
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
            updateBulkActionsProgress(printersToSendGcode.length, printersToSendGcode.length);
          });
        });
      }
    },
    callback: async function (result) {
      if (result) {
        showBulkActionsModal();
        updateBulkActionsProgress(0, printersToSendGcode.length);
        generateTableRows(printersToSendGcode);
        for (let p = 0; p < printersToSendGcode.length; p++) {
          let response = await printerSendGcode(printersToSendGcode[p], result);
          updateTableRow(printersToSendGcode[p]._id, response.status, response.message);
        }
        updateBulkActionsProgress(printersToSendGcode.length, printersToSendGcode.length);
      }
    }
  });
}

export async function bulkOctoPrintPluginAction(action) {
  const printersForPluginAction = await getCurrentlySelectedPrinterList();
  try {
    let pluginList = [];
    if (action === "install") {
      const pluginRepositoryList = await OctoFarmClient.get("printers/pluginList");
      pluginRepositoryList.forEach((plugin) => {
        pluginList.push({
          text: returnPluginListTemplate(plugin),
          value: plugin.archive
        });
      });
    } else {
      const idList = printersForPluginAction.map(function (printer) {
        return printer._id;
      });
      for (let i = 0; i < idList.length; i++) {
        if (action === "enable") {
          try {
            const disabledPluginList = await OctoFarmClient.get(
              "printers/disabledPluginList/" + idList[i]
            );
            disabledPluginList.forEach((plugin) => {
              pluginList.push({
                text: returnPluginSelectTemplate(plugin),
                value: plugin.key
              });
            });
          } catch (e) {
            console.error("Couldn't grab disabled plugin list... ignoring.", e);
          }
        }
        if (action === "disable") {
          try {
            const enabledPluginList = await OctoFarmClient.get(
              "printers/enabledPluginList/" + idList[i]
            );
            enabledPluginList.forEach((plugin) => {
              pluginList.push({
                text: returnPluginSelectTemplate(plugin),
                value: plugin.key
              });
            });
          } catch (e) {
            console.error("Couldn't grab enabled plugin list... ignoring.", e);
          }
        }
        if (action === "uninstall") {
          try {
            const allInstalledPlugins = await OctoFarmClient.get(
              "printers/allPluginsList/" + idList[i]
            );
            allInstalledPlugins.forEach((plugin) => {
              pluginList.push({
                text: returnPluginSelectTemplate(plugin),
                value: plugin.key
              });
            });
          } catch (e) {
            console.error("Couldn't grab installed plugin list... ignoring.", e);
          }
        }
      }
    }

    pluginList = _.sortBy(pluginList, [
      function (o) {
        return o.text;
      }
    ]);

    pluginList = _.uniqBy(pluginList, function (e) {
      return e.text;
    });

    //Install Promt
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
      inputOptions: pluginList,
      scrollable: true,
      onShow: function (e) {
        setupPluginSearch();
      },
      callback: async function (result) {
        if (result) {
          let pluginAmount = result.length * printersForPluginAction.length;
          let cleanAction = action.charAt(0).toUpperCase() + action.slice(1);
          if (action === "install") {
            cleanAction = cleanAction + "ing";
          }
          showBulkActionsModal();
          updateBulkActionsProgress(0, printersForPluginAction.length);
          generateTableRows(printersForPluginAction);
          for (let p = 0; p < printersForPluginAction.length; p++) {
            const response = await octoPrintPluginInstallAction(
              printersForPluginAction[p],
              result,
              action
            );
            updateTableRow(printersForPluginAction[p]._id, response.status, response.message);
            updateBulkActionsProgress(p, printersForPluginAction.length);
          }
          updateBulkActionsProgress(printersForPluginAction.length, printersForPluginAction.length);
        }
      }
    });
  } catch (e) {
    console.error(e);
    UI.createAlert(
      "error",
      `Failed to generate plugin list, please check logs: ${e}`,
      0,
      "clicked"
    );
  }
}

export async function bulkEnableVirtualPrinter() {
  const printers = await OctoFarmClient.listPrinters();
  const alert = UI.createAlert(
    "warning",
    `${UI.returnSpinnerTemplate()} Setting up your OctoPrint settings, please wait...`
  );

  const { successfulPrinters, failedPrinters } = await setupOctoPrintForVirtualPrinter(printers);

  alert.close();
  bootbox.alert(successfulPrinters + failedPrinters);
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
      const post = await OctoFarmClient.post("printers/newFiles", file);
      // const update = await FileManager.updateFileList(file);
      fileUploads.remove();
      const fileCounts = document.getElementById(`fileCounts-${current.index}`);
      if (fileCounts && fileCounts.innerHTML == 1) {
        fileCounts.innerHTML = ` ${0}`;
      }
    }
  }
  const allUploads = fileUploads.all();
  allUploads.forEach((uploads) => {
    const currentCount = allUploads.reduce(function (n, up) {
      return n + (up.index == uploads.index);
    }, 0);
    const fileCounts = document.getElementById(`fileCounts-${uploads.index}`);
    if (fileCounts) {
      fileCounts.innerHTML = ` ${currentCount}`;
    }
  });
}, 1000);
