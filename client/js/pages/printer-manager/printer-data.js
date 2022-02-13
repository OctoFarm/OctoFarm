import {returnDisabledPrinterTableRow, returnPrinterTableRow} from "./templates/printer-table-row.templates.js";
import {checkQuickConnectState, init as actionButtonInit} from "../../services/printer-action-buttons.service";
import {setupUpdateOctoPrintClientBtn} from "../../services/octoprint/octoprint-client-commands";
import {setupUpdateOctoPrintPluginsBtn} from "../../services/octoprint/octoprint-plugin-commands";
import UI from "../../utils/ui.js";
import PrinterLogsService from "../../services/printer-logs.service.js";
import OctoFarmClient from "../../services/octofarm-client.service";
import {updatePrinterSettingsModal} from "../../services/printer-settings.service";
import {loadPrinterHealthChecks, reSyncAPI} from "./functions/printer-manager.functions";
import {removeAlertsLog, updateAlertsLog} from "./alerts-log";

const printerList = document.getElementById("printerList");
const ignoredHostStatesForAPIErrors = [
  "Shutdown",
  "Offline",
  "Searching...",
  "Setting Up",
  "Incorrect API Key",
  "Error!",
  "Operational"
];
function updatePrinterState(printer) {
  const hostBadge = document.getElementById(`hostBadge-${printer._id}`);
  const printerBadge = document.getElementById(`printerBadge-${printer._id}`);
  const socketBadge = document.getElementById(`webSocketIcon-${printer._id}`);

  UI.doesElementNeedUpdating(
    `tag badge badge-${printer.printerState.colour.name} badge-pill`,
    printerBadge,
    "className"
  );
  UI.doesElementNeedUpdating(printer.printerState.state, printerBadge, "innerHTML");
  printerBadge.setAttribute("title", printer.printerState.desc);

  UI.doesElementNeedUpdating(printer.hostState.state, hostBadge, "innerHTML");
  hostBadge.setAttribute("title", printer.hostState.desc);

  UI.doesElementNeedUpdating(
    `tag badge badge-${printer.hostState.colour.name} badge-pill`,
    hostBadge,
    "className"
  );

  socketBadge.setAttribute("title", printer.webSocketState.desc);
  UI.doesElementNeedUpdating(
    `tag badge badge-${printer.webSocketState.colour} badge-pill`,
    socketBadge,
    "className"
  );
}
function updatePrinterInfo(printer) {
  const printName = document.getElementById(`printerName-${printer._id}`);
  const printerURL = document.getElementById(`printerURL-${printer._id}`);
  const webButton = document.getElementById(`printerWeb-${printer._id}`);

  const printerSortIndex = document.getElementById(`printerSortIndex-${printer._id}`);
  const printerGroup = document.getElementById(`printerGroup-${printer._id}`);

  let printerName = JSON.parse(JSON.stringify(printer?.printerName))

  if(!printerName){
    printerName = "<i class=\"fa-solid fa-spinner fa-spin\"></i>"
  }

  UI.doesElementNeedUpdating(printer.sortIndex, printerSortIndex, "innerHTML");
  UI.doesElementNeedUpdating(printerName, printName, "innerHTML");
  UI.doesElementNeedUpdating(`${printer.printerURL} <br> ${printer.webSocketURL}`, printerURL, "innerHTML");
  UI.doesElementNeedUpdating(printer.group, printerGroup, "innerHTML");
  UI.doesElementNeedUpdating(printer.printerURL, webButton, "href");

  printerGroup.innerHTML = printer.group;
}

function checkIfPrinterHealthOK(printer) {
  const healthAlert = document.getElementById(`healthIssues-${printer._id}`);
  if (!printer.healthChecksPass) {
    UI.addDisplayNoneToElement(healthAlert);
    updateAlertsLog({id: "healthCheck-"+printer._id, name: "Failed health check!", printerName: printer.printerName, colour: "Active"})
  } else {
    UI.removeDisplayNoneFromElement(healthAlert);
    removeAlertsLog({id: "healthCheck-"+printer._id})
  }
}

function corsWarningCheck(printer) {
  const corsAlert = document.getElementById(`corsIssue-${printer._id}`);
  if (!printer.corsCheck) {
    updateAlertsLog({id: "corsCheck-"+printer._id, name: "Cors is not enabled!", printerName: printer.printerName, colour: "Offline"})
    UI.addDisplayNoneToElement(corsAlert);
  } else {
    removeAlertsLog({id: "corsCheck-"+printer._id})
    UI.removeDisplayNoneFromElement(corsAlert);
  }
}

function reconnectingIn(printer) {
  const { reconnectingIn, _id } = printer;
  const printerReScanButton = document.getElementById("printerAPIScanning-" + _id);
  const printerReScanIcon = document.getElementById("apiReScanIcon-" + _id);
  const printerReScanText = document.getElementById("apiReScanText-" + _id);
  const reconnectingInCalculation = reconnectingIn - Date.now();
  if (reconnectingInCalculation > 1000) {
    UI.addDisplayNoneToElement(printerReScanButton);
    // updateAlertsLog({id: "apiReconnect-"+printer._id, name: "Planned API Re-Scan", printerName: printer.printerName, colour: "Offline"})
    if (!printerReScanIcon.innerHTML.includes("fa-spin")) {
      printerReScanIcon.innerHTML = "<i class=\"fas fa-redo fa-sm fa-spin\"></i>";
      printerReScanText.innerHTML = UI.generateMilisecondsTime(reconnectingInCalculation);
    } else {
      printerReScanText.innerHTML = UI.generateMilisecondsTime(reconnectingInCalculation);
    }
  } else {
    // removeAlertsLog({id: "apiReconnect-"+printer._id})
    UI.removeDisplayNoneFromElement(printerReScanButton);
    printerReScanIcon.innerHTML = "<i class=\"fas fa-redo fa-sm\"></i>";
    printerReScanText.innerHTML = "";
  }
}

function reconnectingWebsocketIn(printer) {
  const { websocketReconnectingIn, _id } = printer;
  const printerReScanButton = document.getElementById("printerWebsocketScanning-" + _id);
  const printerReScanIcon = document.getElementById("webosocketScanIcon-" + _id);
  const printerReScanText = document.getElementById("websocketScanText-" + _id);
  const reconnectingInCalculation = websocketReconnectingIn - Date.now();
  if (reconnectingInCalculation > 1000) {
    UI.addDisplayNoneToElement(printerReScanButton);
    // updateAlertsLog({id: "socketReconnect-"+printer._id, name: "Planned Socket Reconnection!", printerName: printer.printerName, colour: "Info"})
    if (!printerReScanIcon.innerHTML.includes("fa-spin")) {
      printerReScanIcon.innerHTML = "<i class=\"fas fa-sync-alt fa-sm fa-spin\"></i>";
      printerReScanText.innerHTML = UI.generateMilisecondsTime(reconnectingInCalculation);
    } else {
      printerReScanText.innerHTML = UI.generateMilisecondsTime(reconnectingInCalculation);
    }
  } else {
    UI.removeDisplayNoneFromElement(printerReScanButton);
    // removeAlertsLog({id: "socketReconnect-"+printer._id})
    printerReScanIcon.innerHTML = "<i class=\"fas fa-sync-alt fa-sm\"></i>";
    printerReScanText.innerHTML = "";
  }
}

function checkForOctoPrintUpdate(printer) {
  let updateButton = document.getElementById(`octoprintUpdate-${printer._id}`);

  if (printer?.octoPrintUpdate?.updateAvailable) {
    UI.addDisplayNoneToElement(updateButton);
    updateAlertsLog({id: "opUpdate-"+printer._id, name: "OctoPrint update available!", printerName: printer.printerName, colour: "Info"})
    updateButton.setAttribute("title", "You have an OctoPrint Update to install!");
  } else {
    UI.removeDisplayNoneFromElement(updateButton);
    removeAlertsLog({id: "opUpdate-"+printer._id})
    updateButton.setAttribute("title", "No OctoPrint updates available!");
  }
}

function checkForOctoPrintPluginUpdates(printer) {
  let updatePluginButton = document.getElementById(`octoprintPluginUpdate-${printer._id}`);

  if (printer.octoPrintPluginUpdates && printer.octoPrintPluginUpdates.length > 0) {
    UI.addDisplayNoneToElement(updatePluginButton);
    updateAlertsLog({id: "pluginUpdate-"+printer._id, name: "OctoPrint plugin update(s) available!", printerName: printer.printerName, colour: "Info"})
    updatePluginButton.title = "You have OctoPrint plugin updates to install!";
  } else {
    UI.removeDisplayNoneFromElement(updatePluginButton);
    removeAlertsLog({id: "pluginUpdate-"+printer._id})
    updatePluginButton.title = "No OctoPrint plugin updates available!";
  }
}

function checkIfRestartRequired(printer) {
  const restartRequiredTag = document.getElementById(`restartRequired-${printer._id}`);
  if (restartRequiredTag && printer?.restartRequired) {
    updateAlertsLog({id: "restartWaiting-"+printer._id, name: "Waiting for OctoPrint restart", printerName: printer.printerName, colour: "Active"})
    UI.addDisplayNoneToElement(restartRequiredTag);
  } else {
    removeAlertsLog({id: "restartWaiting-"+printer._id})
    UI.removeDisplayNoneFromElement(restartRequiredTag);
  }
}

function checkIfMultiUserIssueFlagged(printer) {
  const multiUserIssueAlert = document.getElementById("multiUserIssue-" + printer._id);
  if (printer?.multiUserIssue) {
    updateAlertsLog({id: "userIssue-"+printer._id, name: "Couldn't determine which user to use!", printerName: printer.printerName, colour: "Offline"})
    UI.addDisplayNoneToElement(multiUserIssueAlert);
  } else {
    removeAlertsLog({id: "userIssue-"+printer._id})
    UI.removeDisplayNoneFromElement(multiUserIssueAlert);
  }
}

function checkForApiErrors(printer) {
  if (!printer.printerState.colour.category === "Offline") {
    const apiErrorTag = document.getElementById(`scanningIssues-${printer._id}`);

    if (apiErrorTag && !ignoredHostStatesForAPIErrors.includes(printer.hostState.state)) {
      let apiErrors = 0;
      for (const key in printer.systemChecks) {
        if (printer.systemChecks.scanning.hasOwnProperty(key)) {
          if (printer.systemChecks.scanning[key].status !== "success") {
            apiErrors = apiErrors + 1;
          }
        }
      }

      if (apiErrors > 0) {
        removeAlertsLog({id: "apiIssue-"+printer._id})
        UI.removeDisplayNoneFromElement(apiErrorTag);
      }
    } else {
      updateAlertsLog({id: "apiIssue-"+printer._id, name: "API Scan has issues!", printerName: printer.printerName, colour: "Offline"})
      UI.addDisplayNoneToElement(apiErrorTag);
    }
  }
}

function updateButtonState(printer) {
  const apiReScan = document.getElementById(`printerAPIReScan-${printer._id}`);
  const printerSettings = document.getElementById(`printerSettings-${printer._id}`);
  const printerLog = document.getElementById(`printerLog-${printer._id}`);
  const printerStatistics = document.getElementById(`printerStatistics-${printer._id}`);
  UI.doesElementNeedUpdating(printer.disabled, apiReScan, "disabled");
  UI.doesElementNeedUpdating(printer.disabled, printerSettings, "disabled");
  UI.doesElementNeedUpdating(printer.disabled, printerLog, "disabled");
  UI.doesElementNeedUpdating(printer.disabled, printerStatistics, "disabled");
}

function updatePrinterRow(printer) {
  const printerCard = document.getElementById(`printerCard-${printer._id}`);
  if (printerCard) {
    updatePrinterInfo(printer);
    reconnectingIn(printer);
    reconnectingWebsocketIn(printer);
    updatePrinterState(printer);
    checkQuickConnectState(printer);
    updateButtonState(printer);
    if (!printer.disabled) {
      checkForOctoPrintUpdate(printer);

      checkForOctoPrintPluginUpdates(printer);

      checkForApiErrors(printer);

      checkIfPrinterHealthOK(printer);

      checkIfRestartRequired(printer);

      checkIfMultiUserIssueFlagged(printer);

      corsWarningCheck(printer);
    }
  }
}

export function createOrUpdatePrinterTableRow(printers) {
  printers.forEach((printer) => {
    const printerCard = document.getElementById(`printerCard-${printer._id}`);
    if (printerCard) {
      updatePrinterRow(printer);
    } else {
      if (printer.disabled) {
        printerList.insertAdjacentHTML("beforeend", returnDisabledPrinterTableRow(printer));
      } else {
        printerList.insertAdjacentHTML("beforeend", returnPrinterTableRow(printer));
      }

      // Insert actions buttons
      actionButtonInit(printer, `printerActionBtns-${printer._id}`);
      // Check quick connect state and apply
      checkQuickConnectState(printer);
      // Initialise data
      updatePrinterRow(printer);
      // Setup listeners
      setupUpdateOctoPrintClientBtn(printer);
      setupUpdateOctoPrintPluginsBtn(printer);

      document
        .getElementById(`printerSettings-${printer._id}`)
        .addEventListener("click", async (e) => {
          const printersInfo = await OctoFarmClient.listPrinters();
          await updatePrinterSettingsModal(printersInfo, printer._id);
        });
      document.getElementById(`printerLog-${printer._id}`).addEventListener("click", async (e) => {
        const printerInfo = await OctoFarmClient.getPrinter(printer._id);
        let connectionLogs = await OctoFarmClient.get("printers/connectionLogs/" + printer._id);
        PrinterLogsService.loadLogs(printerInfo, connectionLogs);
      });

      document
        .getElementById(`printerStatistics-${printer._id}`)
        .addEventListener("click", async (e) => {
          await PrinterLogsService.loadStatistics(printer._id);
        });

      document
        .getElementById(`printerAPIReScan-${printer._id}`)
        .addEventListener("click", async (e) => {
          bootbox.dialog({
            title: "Rescan All API endpoints",
            message:
              "<p class=\"alert alert-warning text-dark\" role=\"alert\">ReScan: Will rescan all endpoints, ignoring any that data already exists for.</p>" +
              "<p class=\"alert alert-danger text-dark\" role=\"alert\">Force ReScan: Will rescan all endpoints regardless of existing data.</p>",
            size: "large",
            buttons: {
              normal: {
                label: "ReScan",
                className: "btn-warning text-dark",
                callback: async function () {
                  await reSyncAPI(false, printer._id);
                }
              },
              force: {
                label: "Force ReScan",
                className: "btn-danger text-dark",
                callback: async function () {
                  await reSyncAPI(true, printer._id);
                }
              },
              cancel: {
                label: "Cancel",
                className: "btn-secondary"
              }
            }
          });
        });

      document.getElementById(`printerDisable-${printer._id}`).addEventListener("click", (e) => {
        const isDisabled = UI.isPrinterDisabled(e);
        const messageDisabled =
          "A disabled printer will not make any connection attempts until re-enabled. You will not see it in the UI and it will not effect any stats like Offline printer count.";
        const messageEnabled = "Enabling a printer will restore it to it's previous functionality.";
        bootbox.confirm({
          title: `This will ${
            isDisabled ? "<b>ENABLE</b>" : "<b>DISABLE</b>"
          } your printer. Are you sure?`,
          message: `${isDisabled ? messageEnabled : messageDisabled}`,

          buttons: {
            cancel: {
              label: "<i class=\"fa fa-times\"></i> Cancel"
            },
            confirm: {
              label: "<i class=\"fa fa-check\"></i> Confirm"
            }
          },
          callback: async function (result) {
            if (result) {
              e.target.disabled = true;
              const alert = UI.createAlert(
                "warning",
                `${isDisabled ? "Enabling" : "Disabling"} your printer... please wait!`
              );
              let patch = null;
              if (isDisabled) {
                patch = await OctoFarmClient.enablePrinter(printer._id);
              } else {
                patch = await OctoFarmClient.disablePrinter(printer._id);
              }

              alert.close();
              UI.createAlert(
                "success",
                `Successfully ${isDisabled ? "Enabled" : "Disabled"} your printer!`,
                "Clicked",
                3000
              );
              UI.togglePrinterDisableState(e, printer._id);
              setTimeout(() => {
                e.target.disabled = false;
              }, 5000);
            }
          }
        });
      });

      document
        .getElementById("healthIssues-" + printer._id)
        .addEventListener("click", async (e) => {
          await loadPrinterHealthChecks(printer._id);
        });
    }
  });
}
