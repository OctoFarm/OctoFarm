import OctoPrintClient from "./lib/octoprint.js";
import OctoFarmClient from "./lib/octofarm.js";
import UI from "./lib/functions/ui.js";
import { createClientSSEWorker } from "./lib/client-worker";
import PrinterManager from "./lib/modules/printerManager.js";
import { updatePrinterSettingsModal } from "./lib/modules/printerSettings.js";
import FileOperations from "./lib/functions/file.js";
import Validate from "./lib/functions/validate.js";
import PowerButton from "./lib/modules/powerButton.js";
import PrinterSelect from "./lib/modules/printerSelect";
import CustomGenerator from "./lib/modules/customScripts.js";
import Sortable from "./vendor/sortable";

import { updateConnectionLog } from "./printerManager/connection-log";
import { createOrUpdatePrinterTableRow } from "./printerManager/printer-data.js";
import {
  bulkOctoPrintClientUpdate,
  bulkOctoPrintPluginUpdate,
  bulkConnectPrinters,
  bulkDisconnectPrinters,
  bulkOctoPrintPowerCommand,
  bulkOctoPrintPreHeatCommand,
  bulkOctoPrintControlCommand,
  bulkOctoPrintGcodeCommand,
  bulkOctoPrintPluginAction
} from "./printerManager/functions/bulk-commands-functions";
import { scanNetworkForDevices } from "./printerManager/functions/printer-manager.functions";
import { loadCustomGcodeScriptsModel } from "./printerManager/functions/custom-gcode-scripts";
import { sendOctoPrintPluginAction } from "./octoprint/octoprint-plugin-commands";

const workerURL = "/printersInfo/get/";

const deletedPrinters = [];
let powerTimer = 5000;

const multiPrinterSelectModal = document.getElementById("multiPrintersSection");

// Bulk OctoPrint Command Listeners
let bulkPluginUpdateButton = document.getElementById("blkUpdatePluginsBtn");
bulkPluginUpdateButton.addEventListener("click", async () => {
  await bulkOctoPrintPluginUpdate();
});

let bulkOctoPrintUpdateButton = document.getElementById("blkOctoPrintUpdate");
bulkOctoPrintUpdateButton.addEventListener("click", async (e) => {
  await bulkOctoPrintClientUpdate();
});

const bulkConnectBtn = document.getElementById("bulkConnectBtn");
bulkConnectBtn.addEventListener("click", async (e) => {
  await PrinterSelect.create(
    multiPrinterSelectModal,
    false,
    "Connect Printers",
    bulkConnectPrinters
  );
});
const bulkDisconnectBtn = document.getElementById("bulkDisconnectBtn");
bulkDisconnectBtn.addEventListener("click", async (e) => {
  await PrinterSelect.create(
    multiPrinterSelectModal,
    false,
    "Disconnect Printers",
    bulkDisconnectPrinters
  );
});
const bulkPowerBtn = document.getElementById("bulkPowerBtn");
bulkPowerBtn.addEventListener("click", async (e) => {
  await PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    false,
    "Power On/Off Printers",
    bulkOctoPrintPowerCommand
  );
});

let scanNetworkBtn = document.getElementById("scanNetworkBtn");
scanNetworkBtn.addEventListener("click", async (e) => {
  await scanNetworkForDevices();
});

let bulkPreHeat = document.getElementById("bulkPreHeat");
bulkPreHeat.addEventListener("click", async (e) => {
  await PrinterSelect.create(
    multiPrinterSelectModal,
    false,
    "Pre-Heat Printers",
    await bulkOctoPrintPreHeatCommand
  );
});

let bulkControl = document.getElementById("bulkControl");
bulkControl.addEventListener("click", async (e) => {
  await PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    false,
    "Control Printers",
    bulkOctoPrintControlCommand
  );
});

let bulkGcodeCommands = document.getElementById("bulkGcodeCommands");
bulkGcodeCommands.addEventListener("click", async (e) => {
  await PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    false,
    "Send Gcode to Printers",
    bulkOctoPrintGcodeCommand
  );
});

const customGcodeScripts = document.getElementById("customGcodeBtn");
customGcodeScripts.addEventListener("click", async (e) => {
  await loadCustomGcodeScriptsModel();
});

const blkPluginsBtn = document.getElementById("blkPluginsInstallBtn");
blkPluginsBtn.addEventListener("click", async (e) => {
  PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    false,
    "Install Plugins",
    function () {
      bulkOctoPrintPluginAction("install");
    }
  );
});

const blkPluginsUninstallBtn = document.getElementById(
  "blkPluginsUnInstallBtn"
);
blkPluginsUninstallBtn.addEventListener("click", async (e) => {
  PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    false,
    "Uninstall Plugins",
    function () {
      bulkOctoPrintPluginAction("uninstall");
    }
  );
});

const blkPluginsEnableBtn = document.getElementById("blkPluginsEnableBtn");
blkPluginsEnableBtn.addEventListener("click", async (e) => {
  PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    false,
    "Enable Plugins",
    function () {
      bulkOctoPrintPluginAction("enable");
    }
  );
});

const blkPluginsDisableBtn = document.getElementById("blkPluginsDisableBtn");
blkPluginsDisableBtn.addEventListener("click", async (e) => {
  PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    false,
    "Disable Plugins",
    function () {
      bulkOctoPrintPluginAction("disable");
    }
  );
});

const searchOffline = document.getElementById("searchOfflineBtn");
searchOffline.addEventListener("click", async (e) => {
  let alert = UI.createAlert(
    "success",
    "Started a background re-sync of all printers connected to OctoFarm. You may navigate away from this screen."
  );
  searchOffline.innerHTML =
    '<i class="fas fa-redo fa-sm fa-spin"></i> Syncing...';

  const post = await OctoFarmClient.post("printers/reScanOcto", {
    id: null
  });
  alert.close();
  searchOffline.innerHTML = '<i class="fas fa-redo fa-sm"></i> Re-Sync';
});
const editBtn = document.getElementById("editPrinterBtn");
editBtn.addEventListener("click", (event) => {
  const confirmEditFunction = async function () {
    let editedPrinters = [];
    let inputBoxes = document.querySelectorAll("*[id^=editPrinterCard-]");
    for (let i = 0; i < inputBoxes.length; i++) {
      if (inputBoxes[i]) {
        let printerID = inputBoxes[i].id;
        printerID = printerID.split("-");
        printerID = printerID[1];

        const printerURL = document.getElementById(`editInputURL-${printerID}`);
        const printerCamURL = document.getElementById(
          `editInputCamera-${printerID}`
        );
        const printerAPIKEY = document.getElementById(
          `editInputApikey-${printerID}`
        );
        const printerGroup = document.getElementById(
          `editInputGroup-${printerID}`
        );
        const printerName = document.getElementById(
          `editInputName-${printerID}`
        );
        //Check if value updated, if not fill in the old value from placeholder
        if (
          printerURL.value.length !== 0 ||
          printerCamURL.value.length !== 0 ||
          printerAPIKEY.value.length !== 0 ||
          printerGroup.value.length !== 0 ||
          printerName.value.length !== 0
        ) {
          if (printerURL.value.length === 0) {
            printerURL.value = printerURL.placeholder;
          }
          if (printerCamURL.value.length === 0) {
            printerCamURL.value = printerCamURL.placeholder;
          }
          if (printerAPIKEY.value.length === 0) {
            printerAPIKEY.value = printerAPIKEY.placeholder;
          }
          if (printerGroup.value.length === 0) {
            printerGroup.value = printerGroup.placeholder;
          }
          if (printerName.value.length === 0) {
            printerName.value = printerName.placeholder;
          }
          const printer = new PrintersManagement(
            Validate.stripHTML(printerURL.value),
            Validate.stripHTML(printerCamURL.value),
            Validate.stripHTML(printerAPIKEY.value),
            Validate.stripHTML(printerGroup.value),
            Validate.stripHTML(printerName.value)
          ).build();
          printer._id = printerID;
          editedPrinters.push(printer);
        }
      }
    }

    if (editedPrinters.length > 0) {
      const post = await OctoFarmClient.post("printers/update", editedPrinters);
      if (post.status === 200) {
        let printersAdded = await post.json();
        printersAdded = printersAdded.printersAdded;
        printersAdded.forEach((printer) => {
          UI.createAlert(
            "success",
            `Printer: ${printer.printerURL} information has been updated on the farm...`,
            1000,
            "Clicked"
          );
        });
      } else {
        UI.createAlert(
          "error",
          "Something went wrong updating the Server...",
          3000,
          "Clicked"
        );
        saveEdits.innerHTML = '<i class="fas fa-save"></i> Save Edits';
      }
    }
  };
  PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    true,
    "Edit Printers",
    confirmEditFunction
  );
});
document
  .getElementById("deletePrintersBtn")
  .addEventListener("click", (event) => {
    const printerDelete = function () {
      //Grab all check boxes
      const selectedPrinters = PrinterSelect.getSelected();
      selectedPrinters.forEach((element) => {
        const ca = element.id.split("-");
        deletedPrinters.push(ca[1]);
      });
      PrintersManagement.deletePrinter();
    };

    PrinterSelect.create(
      document.getElementById("multiPrintersSection"),
      false,
      "Printer Deletion",
      printerDelete
    );
  });

document
  .getElementById("exportPrinterBtn")
  .addEventListener("click", async (event) => {
    let printers = await OctoFarmClient.post("printers/printerInfo", {});
    printers = await printers.json();
    const printersExport = [];
    for (let r = 0; r < printers.length; r++) {
      const printer = {
        name: printers[r].printerName,
        group: printers[r].group,
        printerURL: printers[r].printerURL,
        cameraURL: printers[r].cameraURL,
        apikey: printers[r].apikey
      };
      printersExport.push(printer);
    }
    FileOperations.download("printers.json", JSON.stringify(printersExport));
  });
document
  .getElementById("importPrinterBtn")
  .addEventListener("change", async function () {
    const Afile = this.files;
    if (Afile[0].name.includes(".json")) {
      const files = Afile[0];
      const reader = new FileReader();
      reader.onload = await PrintersManagement.importPrinters(files);
      reader.readAsText(files);
    } else {
      // File not json
      UI.createAlert("error", "File type not .json!", 3000);
    }
  });
document.getElementById("addPrinterBtn").addEventListener("click", (event) => {
  const currentPrinterCount =
    document.getElementById("printerTable").rows.length;
  const newPrinterCount =
    document.getElementById("printerNewTable").rows.length;
  if (currentPrinterCount === 1 && newPrinterCount === 1) {
    bootbox.alert({
      message: `
            <div class="row">
              <div class="col-lg-12">
                <h4><u>OctoPrint / OctoFarm Setup Instructions</u></h4><br>
                <p>Octoprint will require some setting's changes applying and an OctoPrint service restart actioning before a connection can be established. </p><p>Click the buttons below to display instructions if required. Otherwise close and continue. </p>
              </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                  <button class="btn btn-primary" type="button" data-toggle="collapse" data-target="#octoprintCollapse" aria-expanded="false" aria-controls="octoprintCollapse">
                    OctoPrint Setup
                  </button>
                </div>
                <div class="col-md-6">
                    <button class="btn btn-primary" type="button" data-toggle="collapse" data-target="#octofarmCollapse" aria-expanded="false" aria-controls="octofarmCollapse">
                      OctoFarm Instructions
                    </button>
                </div>
            </div>
              <div class="collapse" id="octofarmCollapse">
                <div class="card card-body">
                  <div class="row pb-1">
                     <div class="col">
                          <label for="psPrinterName">Name:</label>
                          <input id="psPrinterName" type="text" class="form-control" placeholder="Printer Name" disabled>
                          <small class="form-text text-muted">Custom name for your OctoPrint instance, leave this blank to grab from OctoPrint -> Settings -> Appearance Name.</small>
                          <small class="form-text text-muted">If this is blank and no name is found then it will default to the Printer URL.</small>
                          <small>Example: <code>My Awesome Printer Name</code></small>
                      </div>
                      <div class="col">
                          <label for="psPrinterURL">Printer URL:</label>
                          <input id="psPrinterURL" type="text" class="form-control" placeholder="Printer URL" disabled>
                          <small class="form-text text-muted">URL of OctoPrint Host inc. port. Defaults to "http://" if not specified.</small>
                          <small>Example: <code>http://192.168.1.5:81</code></small>
                      </div>
                      <div class="col">
                          <label for="psCamURL">Camera URL:</label>
                          <input id="psCamURL" type="text" class="form-control" placeholder="Camera URL" disabled>
                          <small class="form-text text-muted">URL of mjpeg camera stream. Defaults to "http://" if not specified.</small>
                          <small class="form-text text-muted">You may also leave this blank to be automatically detected from OctoPrint.</small>
                          <small>Example: <code>http://192.168.1.5/webcam/?action=stream</code></small>
                      </div>
                  </div>
                  <div class="row pb-2">
                      <div class="col">
                          <label for="psPrinterGroup">Group:</label>
                          <input id="psPrinterGroup" type="text" class="form-control" placeholder="Printer Group" disabled>
                          <small class="form-text text-muted">OctoFarm allows for groups </small>
                          <small>Example: <code>http://192.168.1.5:81</code></small>
                      </div>
                      <div class="col">
                          <label for="psAPIKEY">API Key:</label>
                          <input id="psAPIKEY" type="text" class="form-control" placeholder="API Key" disabled>
                          <small class="form-text text-muted">OctoPrints API Key. It's required to use the User/Application API Key for OctoPrint version 1.4.1+.</small>
                          <small class="form-text text-muted">If you do not use authentication on your OctoPrint instance just use the global API Key which should work across all OctoPrint versions.</small>
                      </div>
                  
                  </div>
                </div>
              </div>
              <div class="collapse" id="octoprintCollapse">
                <div class="card card-body">
                   <div class="row">
                        <div class="col-md-3">
                            <p>1. Make sure CORS is switched on and OctoPrint has been restarted...</p>
                        </div>
                        <div class="col-md-9">
                                 <img width="100%" src="/images/userCORSOctoPrint.png">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-9">
                            <p>2. Grab your OctoPrint instances API Key.<br> This can be generated in the User Settings dialog.</p>
                            <code>Note: since OctoPrint version 1.4.1 it is recommended to connect using the Application Key / User Key detailed below. Versions before that are fine using the Global API Key generated by OctoPrint.</code>
                        </div>
                        <div class="col-md-3">
                                 <img src="/images/userSettingsOctoPrint.png">
                        </div>
                    </div>
                     <div class="row">
                        <div class="col-md-5">
                            <p>2.1 You can generate a API Key from your current user.</p>
                            <code>Please note, this user currently requires Admin permission rights. If in doubt, it's usually the first user you have created.</code>              
                        </div>
                        <div class="col-md-7">
                                 <img src="/images/userAPIKEYOctoPrint.png">
                        </div>
                    </div>
                    </div>
                    <div class="row">
                        <div class="col-md-5">
                            <p>2.1 You can generate a API Key for a specific application.</p>
                            <code>Please note, this user currently requires Admin permission rights. If in doubt, it's usually the first user you have created.</code>         
                        </div>
                        <div class="col-md-7">
                                 <img src="/images/userApplicationKeyOctoPrint.png">
                        </div>
                    </div>
                </div>

            `,
      size: "large",
      scrollable: false
    });
  }
  PrintersManagement.addPrinter();
});

const deleteAllBtn = document.getElementById("delAllBtn");
deleteAllBtn.addEventListener("click", async (e) => {
  let onScreenButtons = document.querySelectorAll("*[id^=delButton-]");
  for (const btn of onScreenButtons) {
    btn.click();
  }
});
const saveAllBtn = document.getElementById("saveAllBtn");
saveAllBtn.addEventListener("click", async (e) => {
  saveAllBtn.disabled = true;
  deleteAllBtn.disabled = true;
  let onScreenButtons = document.querySelectorAll("*[id^=saveButton-]");
  let onScreenDelete = document.querySelectorAll("*[id^=delButton-]");
  for (const btn of onScreenButtons) {
    btn.disabled = true;
  }
  for (const btn of onScreenDelete) {
    btn.disabled = true;
  }
  UI.createAlert(
    "warning",
    "Starting to save all your instances... this may take some time...",
    onScreenButtons.length * 1500
  );
  for (const btn of onScreenButtons) {
    btn.disabled = false;
    btn.click();
    await delay(1500);
  }
  UI.createAlert("success", "Successfully saved all your instances", 4000);
  saveAllBtn.disabled = false;
  deleteAllBtn.disabled = true;
});

// Setup drag and drop re-ordering listeners
const el = document.getElementById("printerList");
const sortable = Sortable.create(el, {
  handle: ".sortableList",
  animation: 150,
  onUpdate(/** Event */ e) {
    const elements = e.target.querySelectorAll("[id^='printerCard-']");
    const listID = [];
    elements.forEach((e) => {
      const ca = e.id.split("-");
      listID.push(ca[1]);
    });
    OctoFarmClient.post("printers/updateSortIndex", listID);
  }
});

function workerEventFunction(data) {
  if (data != false) {
    const modalVisibility = UI.checkIfAnyModalShown();

    if (!modalVisibility) {
      if (data.currentTickerList.length > 0) {
        updateConnectionLog(data.currentTickerList);
      }
      if (data.printersInformation.length > 0) {
        createOrUpdatePrinterTableRow(
          data.printersInformation,
          data.printerControlList
        );
      }
      // TODO clean up power buttons wants to be in printer-data.js
      if (powerTimer >= 5000) {
        data.printersInformation.forEach((printer) => {
          PowerButton.applyBtn(printer, "powerBtn-");
        });
        powerTimer = 0;
      } else {
        powerTimer += 500;
      }
    } else {
      if (UI.checkIfSpecificModalShown("printerManagerModal")) {
        PrinterManager.init(
          "",
          data.printersInformation,
          data.printerControlList
        );
      }

      if (UI.checkIfSpecificModalShown("printerSettingsModal")) {
        updatePrinterSettingsModal(data.printersInformation);
      }
    }
  } else {
    UI.createAlert(
      "warning",
      "Server Events closed unexpectedly... Retying in 10 seconds",
      10000,
      "Clicked"
    );
  }
}

createClientSSEWorker(workerURL, workerEventFunction);
