import UI from "../../../utils/ui";
import OctoFarmClient from "../../../services/octofarm-client.service.js";
import { updateActionLog, updateConnectionLog, updateAlertsLog } from "../log-tickers.functions";
import PrinterControlManagerService from "../../monitoring/services/printer-control-manager.service";
import { updatePrinterSettingsModal } from "../services/printer-settings.service";
import Validate from "../../../utils/validate";
import { PrintersManagement } from "../printer-constructor";
import PrinterSelectionService from "../services/printer-selection.service";
import FileOperations from "../../../utils/file";
import { createPrinterAddInstructions } from "../templates/printer-add-instructions.template";
import PrinterFileManagerService from "../../monitoring/services/printer-file-manager.service";
import {
  addHealthCheckListeners,
  returnFarmOverviewTableRow,
  returnHealthCheckRow,
} from "../templates/health-checks-table-row.templates";
import { collapsableContent, collapsableRow } from "../templates/connection-overview.templates";
import PrinterTerminalManagerService from "../../monitoring/services/printer-terminal-manager.service";

const currentOpenModal = document.getElementById("printerManagerModalTitle");
const connectionLogMessageBox = document.getElementById("printerTickerMessageBox");
const connectionLogMessageCount = document.getElementById("printerManagementConnectionLogStatus");
const connectionLogLoader = document.getElementById("printerTickerLoader");
const alertsLogMesssageBox = document.getElementById("printerAlertsMessageBox");
const alertsLogMessageCount = document.getElementById("printerManagementAlertsLogStatus");
const alertsLogMessageLoader = document.getElementById("printerAlertsLoader");
const userActionsLogMessageBox = document.getElementById("userActionsLogTable");
const userActionsLogMessageCount = document.getElementById("printerManagementUserActionsStatus");
const userActionsLogMessageLoader = document.getElementById("printerActionsLoader");

export function workerEventFunction(data) {
  if (data) {
    const modalVisibility = UI.checkIfAnyModalShown();

    if (!modalVisibility) {
      updateActionLog(
        data.currentActionList,
        userActionsLogMessageBox,
        userActionsLogMessageCount,
        userActionsLogMessageLoader
      );
      updateConnectionLog(
        data.currentTickerList,
        connectionLogMessageBox,
        connectionLogMessageCount,
        connectionLogLoader
      );
      updateAlertsLog(alertsLogMesssageBox, alertsLogMessageCount, alertsLogMessageLoader);
      if (data.printersInformation.length > 0) {
      }
    } else {
      if (UI.checkIfSpecificModalShown("printerManagerModal")) {
        if (currentOpenModal.innerHTML.includes("Files")) {
          PrinterFileManagerService.init("", data.printersInformation, data.printerControlList);
        } else if (currentOpenModal.innerHTML.includes("Control")) {
          PrinterControlManagerService.init("", data.printersInformation, data.printerControlList);
        } else if (currentOpenModal.innerHTML.includes("Terminal")) {
          PrinterTerminalManagerService.init("", data.printersInformation, data.printerControlList);
        }
      }

      if (UI.checkIfSpecificModalShown("printerSettingsModal")) {
        updatePrinterSettingsModal(data.printersInformation).then();
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

export async function loadPrintersRegisteredEvents(id) {
  const printerEvents = await OctoFarmClient.get("printers/events/" + id);
  const printerEventsContent = document.getElementById("printerEventsList");

  printerEventsContent.innerHTML = "";

  printerEvents.forEach((event) => {
    printerEventsContent.insertAdjacentHTML(
      "beforeend",
      `
      <div class="card text-white bg-info mb-3">
        <div class="card-header"><i class="${event.icon}"></i> ${event.name}</div>
        <div class="card-body">
          <p class="card-text">${event.description}</p>
          <small class="card-text">Fires: ${event.amount}</small><br>
          <small class="card-text">Related Setting: ${event.relatedSettings}</small>
        </div>
      </div>
    `
    );
  });
}

export async function scanNetworkForDevices(e) {
  e.target.disabled = true;
  UI.createAlert("info", "Scanning your network for new devices now... Please wait!", 20000);
  const scannedPrinters = await OctoFarmClient.get("printers/scanNetwork");
  for (const scannedPrinter of scannedPrinters) {
    const printer = {
      printerURL: "",
      camURL: "",
      name: "",
      group: "",
      apikey: "",
    };

    if (typeof scannedPrinter.name !== "undefined") {
      printer.name = scannedPrinter.name;
    }
    if (typeof scannedPrinter.url !== "undefined") {
      printer.printerURL = scannedPrinter.url;
    }
    PrintersManagement.addPrinter(printer);
  }
  UI.createAlert(
    "success",
    "Devices on your network have been scanned, any successful matches should now be visible to add to OctoFarm.",
    3000,
    "Clicked"
  );
  e.target.disabled = false;
}

export async function reSyncAPI(force = false, id = null) {
  const reSyncAPIBtn = document.getElementById("reSyncAPI");

  reSyncAPIBtn.disabled = true;
  const alert = UI.createAlert(
    "info",
    "Started a background re-sync of all printers connected to OctoFarm. You may navigate away from this screen."
  );
  reSyncAPIBtn.innerHTML = '<i class="fas fa-redo fa-sm fa-spin"></i> Scanning APIs...';
  const { msg } = await OctoFarmClient.post("printers/reSyncAPI", {
    id: id,
    force: force,
  });
  alert.close();
  let success = "success";
  if (msg.includes("Skipping")) {
    success = "warning";
  }

  UI.createAlert(success, msg, 3000, "Clicked");
  reSyncAPIBtn.innerHTML = '<i class="fas fa-redo fa-sm"></i> ReScan All API\'s';
  reSyncAPIBtn.disabled = false;
}
export async function reSyncWebsockets() {
  const reSyncSocketsBtn = document.getElementById("reSyncSockets");

  reSyncSocketsBtn.disabled = true;
  const alert = UI.createAlert(
    "info",
    "Started a background re-sync of all printers connected to OctoFarm. You may navigate away from this screen."
  );
  reSyncSocketsBtn.innerHTML = '<i class="fas fa-redo fa-sm fa-spin"></i> Syncing Sockets...';
  await OctoFarmClient.post("printers/reSyncSockets", {
    id: null,
  });
  alert.close();
  UI.createAlert("success", "Background sync started successfully!", 3000, "clicked");
  reSyncSocketsBtn.innerHTML = '<i class="fas fa-sync-alt fa-sm"></i> Reconnect All Sockets';
  reSyncSocketsBtn.disabled = false;
}

export async function bulkEditPrinters() {
  let editedPrinters = [];
  const inputBoxes = document.querySelectorAll("*[id^=editPrinterCard-]");
  for (const boxes of inputBoxes) {
    if (boxes) {
      let printerID = boxes.id;
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
    editedPrinters = await OctoFarmClient.post("printers/update", {
      infoList: editedPrinters,
    });
    const printersAdded = editedPrinters.printersAdded;
    printersAdded.forEach((printer) => {
      UI.createAlert(
        "success",
        `Printer: ${printer.printerURL} information has been updated on the farm...`,
        1000,
        "Clicked"
      );
    });
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
  const printers = await OctoFarmClient.listPrinters();
  const printersExport = [];
  for (const currentPrinter of printers) {
    const printer = {
      name: currentPrinter.printerName,
      group: currentPrinter.group,
      printerURL: currentPrinter.printerURL,
      cameraURL: currentPrinter.camURL,
      apikey: currentPrinter.apikey,
    };
    printersExport.push(printer);
  }
  FileOperations.download("printers.json", JSON.stringify(printersExport));
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
      scrollable: false,
    });
  }
  PrintersManagement.addPrinter();
}

export function deleteAllOnAddPrinterTable() {
  const onScreenButtons = document.querySelectorAll("*[id^=delButton-]");
  for (const btn of onScreenButtons) {
    btn.click();
  }
}
export async function saveAllOnAddPrinterTable() {
  const deleteAllBtn = document.getElementById("delAllBtn");
  const saveAllBtn = document.getElementById("saveAllBtn");
  saveAllBtn.disabled = true;
  deleteAllBtn.disabled = true;
  const onScreenButtons = document.querySelectorAll("*[id^=saveButton-]");
  const onScreenDelete = document.querySelectorAll("*[id^=delButton-]");
  for (const btn of onScreenButtons) {
    btn.disabled = true;
  }
  for (const btn of onScreenDelete) {
    btn.disabled = true;
  }
  UI.createAlert(
    "warning",
    "Starting to save all your instances... this may take some time...",
    onScreenButtons.length * 50
  );
  for (const btn of onScreenButtons) {
    btn.disabled = false;
    btn.click();
  }
  UI.createAlert("success", "Successfully saved all your instances", 4000);
  saveAllBtn.disabled = false;
  deleteAllBtn.disabled = true;
}

export async function loadPrinterHealthChecks(id = undefined) {
  const healthChecks = await OctoFarmClient.getHealthChecks();
  const table = document.getElementById("healthChecksTable");
  table.innerHTML = "";
  if (id) {
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
    "<tr><td></td><td></td><td></td><td></td><td></td><td></td><td>" +
    '<i class="fas fa-sync fa-spin"></i> Generating records, please wait...' +
    "</td><td></td><td></td><td></td><td></td><td></td></tr>";

  const farmOverview = await OctoFarmClient.getFarmOverview();
  farmOverviewInformation.innerHTML = "";
  farmOverview.forEach((printer) => {
    const currentPrinter = printer.statistics;
    if (currentPrinter) {
      const printTotal =
        currentPrinter.printSuccessTotal +
        currentPrinter.printCancelTotal +
        currentPrinter.printErrorTotal;
      const printerSuccessRate = (currentPrinter.printSuccessTotal * 100) / printTotal || 0;
      const printerCancelRate = (currentPrinter.printCancelTotal * 100) / printTotal || 0;
      const printerErrorRate = (currentPrinter.printErrorTotal * 100) / printTotal || 0;
      const printUtilisationTotal =
        currentPrinter.activeTimeTotal +
        currentPrinter.idleTimeTotal +
        currentPrinter.offlineTimeTotal;
      const printerActivityRate =
        (currentPrinter.activeTimeTotal * 100) / printUtilisationTotal || 0;
      const printerIdleRate = (currentPrinter.idleTimeTotal * 100) / printUtilisationTotal || 0;
      const printerOfflineRate =
        (currentPrinter.offlineTimeTotal * 100) / printUtilisationTotal || 0;
      const octoSysInfo = currentPrinter.octoPrintSystemInfo;
      const octoPi = printer?.octoPi;
      farmOverviewInformation.insertAdjacentHTML(
        "beforeend",
        returnFarmOverviewTableRow(
          currentPrinter,
          printer,
          octoSysInfo,
          printerSuccessRate,
          printerActivityRate,
          printerCancelRate,
          printerErrorRate,
          printerIdleRate,
          printerOfflineRate,
          octoPi
        )
      );
    }
  });
}

export async function loadConnectionOverViewInformation() {
  const printerConnectionStats = await OctoFarmClient.getConnectionOverview();

  const connectionOverViewTableBody = document.getElementById("connectionOverViewTableBody");

  connectionOverViewTableBody.innerHTML = "";

  const today = new Date();
  document.getElementById("lastUpdateConnectionOverview").innerHTML = today.toLocaleTimeString();

  const totalsArray = [];
  printerConnectionStats.forEach((url, index) => {
    const currentPrinter = url;
    const toCalc = [];
    currentPrinter.connections.forEach((con) => {
      const log = con.log;
      const totalConnections = log.totalRequestsSuccess + log.totalRequestsFailed;
      const totalResponse = log.lastResponseTimes.reduce((a, b) => a + b, 0) / totalConnections;
      const successPercentage = (log.totalRequestsSuccess * 100) / totalConnections;
      const failedPercent = (log.totalRequestsFailed * 100) / totalConnections;
      const apiFailures = log.connectionFailures;
      const retryCount = log.totalRetries;
      const totalPingPong = log?.totalPingPong;

      const toPush = {
        totalResponse,
        successPercentage,
        failedPercent,
        retryCount,
        apiFailures,
        totalPingPong,
      };

      toCalc.push(toPush);
    });
    totalsArray[index] = toCalc;
  });

  printerConnectionStats.forEach((url, index) => {
    const currentPrinter = url;
    const totalSuccessPercent = totalsArray[index].reduce(function (a, b) {
      return a + b["successPercentage"];
    }, 0);
    const totalFailedPercent = totalsArray[index].reduce(function (a, b) {
      return a + b["failedPercent"];
    }, 0);
    const actualSuccessPercent = totalSuccessPercent / totalsArray[index].length;
    const actualFailedPercent = totalFailedPercent / totalsArray[index].length;
    let averageTotalCountLength = 0;
    const averageTotalCount =
      totalsArray[index].reduce(function (a, b) {
        averageTotalCountLength = averageTotalCountLength + 1;
        return a + b["totalResponse"];
      }, 0) / totalsArray[index].length;
    const totalAPIFailed = totalsArray[index].reduce(function (a, b) {
      return a + b["apiFailures"];
    }, 0);
    const averageTotalCalc = averageTotalCount / averageTotalCountLength || 0;
    const totalPingPongFails = totalsArray[index].reduce(function (a, b) {
      return a + b["totalPingPong"];
    }, 0);

    const collapseableRow = collapsableRow(
      index,
      currentPrinter.printerURL,
      averageTotalCalc.toFixed(2) || 0,
      actualSuccessPercent,
      actualFailedPercent,
      totalsArray,
      totalAPIFailed,
      totalPingPongFails
    );

    connectionOverViewTableBody.insertAdjacentHTML("beforeend", collapseableRow);

    currentPrinter.connections.forEach((con) => {
      let currentURL = con.url;
      const log = con.log;
      if (currentURL.includes("http")) {
        if (currentURL.includes("https")) {
          currentURL = currentURL.replace("https://" + currentPrinter.printerURL, "");
        } else {
          currentURL = currentURL.replace("http://" + currentPrinter.printerURL, "");
        }
      } else if (currentURL.includes("ws")) {
        if (currentURL.includes("wss")) {
          currentURL = currentURL.replace("wss://" + currentPrinter.printerURL, "");
        } else {
          currentURL = currentURL.replace("ws://" + currentPrinter.printerURL, "");
        }
      }

      const averageCount = log.lastResponseTimes.reduce((a, b) => a + b, 0);
      const averageCalculation = (averageCount / log.lastResponseTimes.length).toFixed(2) || 0;
      const totalConnections = log.totalRequestsSuccess + log.totalRequestsFailed;
      const successPercent = (log.totalRequestsSuccess * 100) / totalConnections;
      const failedPercent = (log.totalRequestsFailed * 100) / totalConnections;
      const connectionInnerElement = collapsableContent(
        index,
        currentURL,
        averageCalculation,
        successPercent,
        failedPercent,
        log
      );

      connectionOverViewTableBody.insertAdjacentHTML("beforeend", connectionInnerElement);
    });
  });
}
