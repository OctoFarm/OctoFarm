import UI from "../../../utils/ui";
import OctoFarmClient from "../../../services/octofarm-client.service.js";
import {checkIfLoaderExistsAndRemove, updateConnectionLog} from "../connection-log";
import {createOrUpdatePrinterTableRow} from "../printer-data";
import PrinterPowerService from "../../../services/printer-power-service";
import PrinterControlManagerService from "../../../services/printer-control-manager.service";
import {updatePrinterSettingsModal} from "../../../services/printer-settings.service";
import Validate from "../../../utils/validate";
import {PrintersManagement} from "../printer-constructor";
import PrinterSelectionService from "../../../services/printer-selection.service";
import FileOperations from "../../../utils/file";
import {createPrinterAddInstructions} from "../templates/printer-add-instructions.template";
import PrinterFileManagerService from "../../../services/printer-file-manager.service";
import {
  addHealthCheckListeners,
  returnFarmOverviewTableRow,
  returnHealthCheckRow
} from "../templates/health-checks-table-row.templates";
import {checkIfAlertsLoaderExistsAndRemove} from "../alerts-log";

const currentOpenModal = document.getElementById("printerManagerModalTitle");

let powerTimer = 5000;

export function workerEventFunction(data) {
  if (data) {
    const modalVisibility = UI.checkIfAnyModalShown();

    if (!modalVisibility) {
      if (data.currentTickerList.length > 0) {
        checkIfLoaderExistsAndRemove();
        checkIfAlertsLoaderExistsAndRemove();
        updateConnectionLog(data.currentTickerList);
      } else {
        checkIfAlertsLoaderExistsAndRemove(true);
        checkIfLoaderExistsAndRemove(true);
      }
      if (data.printersInformation.length > 0) {
        createOrUpdatePrinterTableRow(data.printersInformation, data.printerControlList);
      }
      // TODO clean up power buttons wants to be in printer-data.js
      if (powerTimer >= 5000) {
        data.printersInformation.forEach((printer) => {
          PrinterPowerService.applyBtn(printer);
        });
        powerTimer = 0;
      } else {
        powerTimer += 500;
      }
    } else {
      if (UI.checkIfSpecificModalShown("printerManagerModal")) {
        if (currentOpenModal.innerHTML.includes("Files")) {
          PrinterFileManagerService.init("", data.printersInformation, data.printerControlList);
        } else if (currentOpenModal.innerHTML.includes("Control")) {
          PrinterControlManagerService.init("", data.printersInformation, data.printerControlList);
        } else if (currentOpenModal.innerHTML.includes("Terminal")) {
        }
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

export async function scanNetworkForDevices(e) {
  e.target.disabled = true;
  UI.createAlert("info", "Scanning your network for new devices now... Please wait!", 20000);
  try {
    const scannedPrinters = await OctoFarmClient.get("printers/scanNetwork");
    for (let index = 0; index < scannedPrinters.length; index++) {
      const printer = {
        printerURL: "",
        cameraURL: "",
        name: "",
        group: "",
        apikey: ""
      };

      if (typeof scannedPrinters[index].name !== "undefined") {
        printer.name = scannedPrinters[index].name;
      }
      if (typeof scannedPrinters[index].url !== "undefined") {
        printer.printerURL = scannedPrinters[index].url;
      }
      PrintersManagement.addPrinter(printer);
    }
    UI.createAlert(
      "success",
      "Devices on your network have been scanned, any successful matches should now be visible to add to OctoFarm.",
      3000,
      "Clicked"
    );
  } catch (e) {
    console.error(e);
    UI.createAlert(
      "error",
      "There we're issues scanning your network for devices... please check the logs",
      0,
      "clicked"
    );
  }
  e.target.disabled = false;
}

export async function reSyncAPI(force = false, id = null) {
  let reSyncAPIBtn = document.getElementById("reSyncAPI");

  reSyncAPIBtn.disabled = true;
  let alert = UI.createAlert(
    "info",
    "Started a background re-sync of all printers connected to OctoFarm. You may navigate away from this screen."
  );
  reSyncAPIBtn.innerHTML = "<i class=\"fas fa-redo fa-sm fa-spin\"></i> Scanning APIs...";
  try {
    const post = await OctoFarmClient.post("printers/reSyncAPI", {
      id: id,
      force: force
    });
  } catch (e) {
    console.error(e);
    UI.createAlert("error", "There was an issue re-syncing your printers, please check the logs");
  }
  alert.close();
  UI.createAlert("success", "Background sync completed successfully!", 3000, "clicked");
  reSyncAPIBtn.innerHTML = "<i class=\"fas fa-redo fa-sm\"></i> ReScan All API's";
  reSyncAPIBtn.disabled = false;
}
export async function reSyncWebsockets() {
  let reSyncSocketsBtn = document.getElementById("reSyncSockets");

  reSyncSocketsBtn.disabled = true;
  let alert = UI.createAlert(
    "info",
    "Started a background re-sync of all printers connected to OctoFarm. You may navigate away from this screen."
  );
  reSyncSocketsBtn.innerHTML = "<i class=\"fas fa-redo fa-sm fa-spin\"></i> Syncing Sockets...";
  try {
    const post = await OctoFarmClient.post("printers/reSyncSockets", {
      id: null
    });
  } catch (e) {
    console.error(e);
    UI.createAlert("error", "There was an issue re-syncing your printers, please check the logs");
  }
  alert.close();
  UI.createAlert("success", "Background sync started successfully!", 3000, "clicked");
  reSyncSocketsBtn.innerHTML = "<i class=\"fas fa-sync-alt fa-sm\"></i> Reconnect All Sockets";
  reSyncSocketsBtn.disabled = false;
}

export async function bulkEditPrinters() {
  let editedPrinters = [];
  let inputBoxes = document.querySelectorAll("*[id^=editPrinterCard-]");
  for (let i = 0; i < inputBoxes.length; i++) {
    if (inputBoxes[i]) {
      let printerID = inputBoxes[i].id;
      printerID = printerID.split("-");
      printerID = printerID[1];

      const printerURL = document.getElementById(`editInputURL-${printerID}`);
      const printerCamURL = document.getElementById(`editInputCamera-${printerID}`);
      const printerAPIKEY = document.getElementById(`editInputApikey-${printerID}`);
      const printerGroup = document.getElementById(`editInputGroup-${printerID}`);
      const printerName = document.getElementById(`editInputName-${printerID}`);
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
    try {
      editedPrinters = await OctoFarmClient.post("printers/update", editedPrinters);
      const printersAdded = editedPrinters.printersAdded;
      printersAdded.forEach((printer) => {
        UI.createAlert(
          "success",
          `Printer: ${printer.printerURL} information has been updated on the farm...`,
          1000,
          "Clicked"
        );
      });
    } catch (e) {
      console.error(e);
      UI.createAlert("error", "Something went wrong updating the Server...", 3000, "Clicked");
    }
  }
}

export async function bulkDeletePrinters() {
  const deletedPrinters = [];
  //Grab all check boxes
  const selectedPrinters = PrinterSelectionService.getSelected();
  selectedPrinters.forEach((element) => {
    const ca = element.id.split("-");
    deletedPrinters.push(ca[1]);
  });
  await PrintersManagement.deletePrinter(deletedPrinters);
}

export async function exportPrintersToJson() {
  try {
    let printers = await OctoFarmClient.listPrinters();
    const printersExport = [];
    for (let r = 0; r < printers.length; r++) {
      const printer = {
        name: printers[r].printerName,
        group: printers[r].group,
        printerURL: printers[r].printerURL,
        cameraURL: printers[r].camURL,
        apikey: printers[r].apikey
      };
      printersExport.push(printer);
    }
    FileOperations.download("printers.json", JSON.stringify(printersExport));
  } catch (e) {
    console.error(e);
    UI.createAlert("error", `Error exporting printers, please check logs: ${e}`, 3000, "clicked");
  }
}
export async function importPrintersFromJsonFile(file) {
  const Afile = file;
  if (Afile[0].name.includes(".json")) {
    const files = Afile[0];
    const reader = new FileReader();
    reader.onload = await PrintersManagement.importPrinters(files);
    reader.readAsText(files);
  } else {
    // File not json
    UI.createAlert("error", "File type not .json!", 3000);
  }
}

export function addBlankPrinterToTable() {
  const currentPrinterCount = document.getElementById("printerTable").rows.length;
  const newPrinterCount = document.getElementById("printerNewTable").rows.length;
  if (currentPrinterCount === 1 && newPrinterCount === 1) {
    bootbox.alert({
      message: createPrinterAddInstructions(),
      size: "large",
      scrollable: false
    });
  }
  PrintersManagement.addPrinter();
}

export function deleteAllOnAddPrinterTable() {
  let onScreenButtons = document.querySelectorAll("*[id^=delButton-]");
  for (const btn of onScreenButtons) {
    btn.click();
  }
}
export async function saveAllOnAddPrinterTable() {
  const deleteAllBtn = document.getElementById("delAllBtn");
  const saveAllBtn = document.getElementById("saveAllBtn");
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
    await UI.delay(1500);
  }
  UI.createAlert("success", "Successfully saved all your instances", 4000);
  saveAllBtn.disabled = false;
  deleteAllBtn.disabled = true;
}

export async function loadPrinterHealthChecks(id = undefined) {
  const healthChecks = await OctoFarmClient.getHealthChecks();
  const table = document.getElementById("healthChecksTable");
  table.innerHTML = "";
  if (!!id) {
    const filteredCheck = healthChecks.filter(function (check) {
      return check.printerID === id;
    });
    filteredCheck.forEach((check) => {
      table.insertAdjacentHTML("beforeend", returnHealthCheckRow(check));
      addHealthCheckListeners(check);
    });
  } else {
    healthChecks.forEach((check) => {
      table.insertAdjacentHTML("beforeend", returnHealthCheckRow(check));
      addHealthCheckListeners(check);
    });
  }
}

export async function loadFarmOverviewInformation() {
  const farmOverviewInformation = document.getElementById("farmOverviewInformation");
  farmOverviewInformation.innerHTML =
    "<tr><td></td><td></td><td></td><td></td><td></td><td></td><td><i class=\"fas fa-sync fa-spin\"></i> Generating records, please wait...</td><td></td><td></td><td></td><td></td><td></td></tr>";

  const farmOverview = await OctoFarmClient.getFarmOverview();
  farmOverviewInformation.innerHTML = "";
  farmOverview.forEach((printer) => {
    const currentPrinter = printer.statistics;
    if (!!currentPrinter) {
      const printTotal =
        currentPrinter.printSuccessTotal +
        currentPrinter.printCancelTotal +
        currentPrinter.printErrorTotal;
      const printerSuccessRate = (currentPrinter.printSuccessTotal * 100) / printTotal || 0;
      const printUtilisationTotal =
        currentPrinter.activeTimeTotal +
        currentPrinter.idleTimeTotal +
        currentPrinter.offlineTimeTotal;
      const printerActivityRate =
        (currentPrinter.activeTimeTotal * 100) / printUtilisationTotal || 0;
      const octoSysInfo = currentPrinter.octoPrintSystemInfo;
      farmOverviewInformation.insertAdjacentHTML(
        "beforeend",
        returnFarmOverviewTableRow(
          currentPrinter,
          printer,
          octoSysInfo,
          printerSuccessRate,
          printerActivityRate
        )
      );
    }
  });
}
