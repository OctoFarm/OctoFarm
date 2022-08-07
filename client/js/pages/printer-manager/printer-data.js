import {
  returnDisabledPrinterTableRow,
  returnPrinterTableRow,
} from "./templates/printer-table-row.templates.js";
import {
  checkQuickConnectState,
  init as actionButtonInit,
} from "../../services/printer-action-buttons.service";
import {
  sendPowerCommandToOctoPrint,
  setupUpdateOctoPrintClientBtn,
} from "../../services/octoprint/octoprint-client-commands.actions";
import { setupUpdateOctoPrintPluginsBtn } from "../../services/octoprint/octoprint-plugin-commands.actions";
import UI from "../../utils/ui.js";
import PrinterLogsService from "./services/printer-logs.service.js";
import PrinterStatisticsService from "./services/printer-statistics.service";
import PrinterEditService from "./services/printer-edit.service";
import OctoFarmClient from "../../services/octofarm-client.service";
import { updatePrinterSettingsModal } from "./services/printer-settings.service";
import {
  loadPrinterHealthChecks,
  reSyncAPI,
  loadPrintersRegisteredEvents,
} from "./functions/printer-manager.functions";
import {
  createAlertsLogString,
  removeLogLine,
  updateLogLine,
} from "./log-tickers.functions";
import {
  isPrinterFullyScanned,
  printerIsDisabled, printerIsOffline, printerIsSearching,
} from "../../utils/octofarm.utils";
import {
  checkKlipperState
} from "../../services/octoprint/checkKlipperState.actions";

const alertsLogMesssageBox = document.getElementById("printerAlertsMessageBox");

const printerList = document.getElementById("printerList");
const ignoredHostStatesForAPIErrors = [
  "Shutdown",
  "Offline",
  "Searching...",
  "Setting Up",
  "Incorrect API Key",
  "Error!",
  "Operational",
];

const triggerAPIIssues = [
  "version",
  "users",
  "state",
  "profile",
  "settings",
  "system",
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
  UI.doesElementNeedUpdating(
    printer.printerState.state,
    printerBadge,
    "innerHTML"
  );
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
  const printName = document.getElementById(`name-${printer._id}`);
  const printerURL = document.getElementById(`printerURL-${printer._id}`);
  const webButton = document.getElementById(`printerWeb-${printer._id}`);
  const lastStatusElm = document.getElementById(`printerLastStatus-${printer._id}`);

  const octoPrintUser = document.getElementById(`printerOctoPrintUser-${printer._id}`);
  const printerControlUser = document.getElementById(`printerControlUser-${printer._id}`);

  const printerSortIndex = document.getElementById(
    `printerSortIndex-${printer._id}`
  );
  const printerGroup = document.getElementById(`printerGroup-${printer._id}`);

  let printerName = "<i class=\"fa-solid fa-arrows-spin fa-spin\"></i>";

  lastStatusElm.innerHTML = `<span class="text${printer.lastConnectionStatus.state}">${printer.lastConnectionStatus.message}</span>`;

  if (
    printer?.printerName &&
    printer.printerName !== "Grabbing from OctoPrint..."
  ) {
    printerName = JSON.parse(JSON.stringify(printer?.printerName));
  }

  UI.doesElementNeedUpdating(printer.sortIndex, printerSortIndex, "innerHTML");
  UI.doesElementNeedUpdating(printerName, printName, "innerHTML");
  UI.doesElementNeedUpdating(
    `${printer.printerURL} <br> ${printer.webSocketURL}`,
    printerURL,
    "innerHTML"
  );
  UI.doesElementNeedUpdating(printer.group, printerGroup, "innerHTML");
  UI.doesElementNeedUpdating(printer.printerURL, webButton, "href");

  UI.doesElementNeedUpdating(printer?.currentUser ? printer.currentUser : "No User", octoPrintUser, "innerHTML")
  UI.doesElementNeedUpdating(printer?.activeControlUser ? printer.activeControlUser : "No User", printerControlUser, "innerHTML")
  printerGroup.innerHTML = printer.group;
}

function checkIfPrinterHealthOK(printer) {
  const healthAlert = document.getElementById(`healthIssues-${printer._id}`);
  if (printer?.healthChecksPass === false) {
    UI.removeDisplayNoneFromElement(healthAlert);
    updateLogLine(
      "healthCheck-" + printer._id,
      alertsLogMesssageBox,
      createAlertsLogString({
        id: "healthCheck-" + printer._id,
        name: "Failed health check!",
        printerName: printer.printerName,
        colour: "Active",
      })
    );
  } else {
    UI.addDisplayNoneToElement(healthAlert);
    removeLogLine({ id: "healthCheck-" + printer._id });
  }
}

function checkIfPrinterHasEvents(printer) {
  const eventsAlerts = document.getElementById(
    `printerEventsAlert-${printer._id}`
  );
  const printerEventsCount = document.getElementById(
    `printerEventsCount-${printer._id}`
  );
  if (printer?.registeredEvents.length > 0) {
    updateLogLine(
      "printerEvents-" + printer._id,
      alertsLogMesssageBox,
      createAlertsLogString({
        id: "printerEvents-" + printer._id,
        name: "Printer events are registered!",
        printerName: printer.printerName,
        colour: "Info",
      })
    );
    printerEventsCount.innerHTML = printer.registeredEvents.length;
    UI.removeDisplayNoneFromElement(eventsAlerts);
    return;
  }
  UI.addDisplayNoneToElement(eventsAlerts);
  removeLogLine({ id: "printerEvents-" + printer._id });
}

function checkIfCpuDataAvailable(printer) {
  const octoprintCpuUsage = document.getElementById(
    `octoPrintsUsage-${printer._id}`
  );
  const octoprintCpuUsagePercent = document.getElementById(
    `octoprintCpuUsagePercent-${printer._id}`
  );
  const octoprintMemoryUsagePercent = document.getElementById(
    `octoprintMemoryUsagePercent-${printer._id}`
  );
  const octoprintsCpuUsage = document.getElementById(
    `octoprintsCpuUsagePercent-${printer._id}`
  );
  if (!!printer?.octoResourceMonitor) {
    octoprintCpuUsagePercent.innerHTML =
      printer?.octoResourceMonitor?.system_cpu[
        printer?.octoResourceMonitor?.system_cpu.length - 1
      ].toFixed(0);
    octoprintMemoryUsagePercent.innerHTML =
      printer?.octoResourceMonitor?.system_memory[
        printer?.octoResourceMonitor?.system_memory.length - 1
      ].toFixed(0);
    octoprintsCpuUsage.innerHTML =
      printer?.octoResourceMonitor?.octoprint_cpu[
        printer?.octoResourceMonitor?.octoprint_cpu.length - 1
      ].toFixed(0);
    UI.removeDisplayNoneFromElement(octoprintCpuUsage);
    return;
  }
  UI.addDisplayNoneToElement(octoprintCpuUsage);
}

function checkIfPrinterConnectionThrottled(printer) {
  const printerConnectionThrottled = document.getElementById(
    `printerConnectionThrottled-${printer._id}`
  );
  const printerConnectionThrottledCount = document.getElementById(
    `printerConnectionThrottledCount-${printer._id}`
  );
  if (printer?.websocket_throttle > 1) {
    printerConnectionThrottledCount.innerHTML = `${parseInt(
      printer.websocket_throttle
    )}`;
    UI.removeDisplayNoneFromElement(printerConnectionThrottled);
    return;
  }
  UI.addDisplayNoneToElement(printerConnectionThrottled);
}

function setupReconnectingIn(printer) {
  const { reconnectingIn, _id } = printer;
  const printerReScanButton = document.getElementById(
    "printerAPIScanning-" + _id
  );
  const printerReScanIcon = document.getElementById("apiReScanIcon-" + _id);
  const printerReScanText = document.getElementById("apiReScanText-" + _id);
  const reconnectingInCalculation = reconnectingIn - Date.now();
  if (reconnectingInCalculation > 1000) {
    UI.removeDisplayNoneFromElement(printerReScanButton);
    // updateLogLine({id: "apiReconnect-"+printer._id, name: "Planned API Re-Scan", printerName: printer.printerName, colour: "Offline"})
    if (!printerReScanIcon.innerHTML.includes("fa-spin")) {
      printerReScanIcon.innerHTML = "<i class=\"fas fa-redo fa-sm fa-spin\"></i>";
      printerReScanText.innerHTML = UI.generateMilisecondsTime(
        reconnectingInCalculation
      );
    } else {
      printerReScanText.innerHTML = UI.generateMilisecondsTime(
        reconnectingInCalculation
      );
    }
  } else {
    // removeAlertsLog({id: "apiReconnect-"+printer._id})
    UI.addDisplayNoneToElement(printerReScanButton);
    printerReScanIcon.innerHTML = "<i class=\"fas fa-redo fa-sm\"></i>";
    printerReScanText.innerHTML = "";
  }
}

function reconnectingWebsocketIn(printer) {
  const { websocketReconnectingIn, _id } = printer;
  const printerReScanButton = document.getElementById(
    "printerWebsocketScanning-" + _id
  );
  const printerReScanIcon = document.getElementById(
    "webosocketScanIcon-" + _id
  );
  const printerReScanText = document.getElementById("websocketScanText-" + _id);
  const reconnectingInCalculation = websocketReconnectingIn - Date.now();
  if (reconnectingInCalculation > 1000) {
    UI.removeDisplayNoneFromElement(printerReScanButton);
    // updateLogLine({id: "socketReconnect-"+printer._id, name: "Planned Socket Reconnection!", printerName: printer.printerName, colour: "Info"})
    if (!printerReScanIcon.innerHTML.includes("fa-spin")) {
      printerReScanIcon.innerHTML =
        "<i class=\"fas fa-sync-alt fa-sm fa-spin\"></i>";
      printerReScanText.innerHTML = UI.generateMilisecondsTime(
        reconnectingInCalculation
      );
    } else {
      printerReScanText.innerHTML = UI.generateMilisecondsTime(
        reconnectingInCalculation
      );
    }
  } else {
    UI.addDisplayNoneToElement(printerReScanButton);
    // removeAlertsLog({id: "socketReconnect-"+printer._id})
    printerReScanIcon.innerHTML = "<i class=\"fas fa-sync-alt fa-sm\"></i>";
    printerReScanText.innerHTML = "";
  }
}

function checkForOctoPrintUpdate(printer) {
  let updateButton = document.getElementById(`octoprintUpdate-${printer._id}`);

  if (printer?.octoPrintUpdate?.updateAvailable) {
    UI.removeDisplayNoneFromElement(updateButton);
    updateLogLine(
      "opUpdate-" + printer._id,
      alertsLogMesssageBox,
      createAlertsLogString({
        id: "opUpdate-" + printer._id,
        name: "OctoPrint update available!",
        printerName: printer.printerName,
        colour: "Info",
      })
    );
    updateButton.setAttribute(
      "title",
      "You have an OctoPrint Update to install!"
    );
  } else {
    UI.addDisplayNoneToElement(updateButton);
    removeLogLine({ id: "opUpdate-" + printer._id });
    updateButton.setAttribute("title", "No OctoPrint updates available!");
  }
}

function checkForOctoPrintPluginUpdates(printer) {
  let updatePluginButton = document.getElementById(
    `octoprintPluginUpdate-${printer._id}`
  );

  if (
    printer.octoPrintPluginUpdates &&
    printer.octoPrintPluginUpdates.length > 0
  ) {
    UI.removeDisplayNoneFromElement(updatePluginButton);
    updateLogLine(
      "pluginUpdate-" + printer._id,
      alertsLogMesssageBox,
      createAlertsLogString({
        id: "pluginUpdate-" + printer._id,
        name: "OctoPrint plugin update(s) available!",
        printerName: printer.printerName,
        colour: "Info",
      })
    );
    updatePluginButton.title = "You have OctoPrint plugin updates to install!";
  } else {
    UI.addDisplayNoneToElement(updatePluginButton);
    removeLogLine({ id: "pluginUpdate-" + printer._id });
    updatePluginButton.title = "No OctoPrint plugin updates available!";
  }
}

function checkIfRestartRequired(printer) {
  const restartRequiredTag = document.getElementById(
    `restartRequired-${printer._id}`
  );
  if (restartRequiredTag && printer?.restartRequired) {
    updateLogLine(
      "restartWaiting-" + printer._id,
      alertsLogMesssageBox,
      createAlertsLogString({
        id: "restartWaiting-" + printer._id,
        name: "Waiting for OctoPrint restart",
        printerName: printer.printerName,
        colour: "Active",
      })
    );
    UI.removeDisplayNoneFromElement(restartRequiredTag);
  } else {
    removeLogLine({ id: "restartWaiting-" + printer._id });
    UI.addDisplayNoneToElement(restartRequiredTag);
  }
}

function checkIfMultiUserIssueFlagged(printer) {
  const multiUserIssueAlert = document.getElementById(
    "multiUserIssue-" + printer._id
  );
  if (printer?.multiUserIssue && !printerIsSearching()) {
    updateLogLine(
      "userIssue-" + printer._id,
      alertsLogMesssageBox,
      createAlertsLogString({
        id: "userIssue-" + printer._id,
        name: "Couldn't determine which user to use!",
        printerName: printer.printerName,
        colour: "Offline",
      })
    );
    UI.removeDisplayNoneFromElement(multiUserIssueAlert);
  } else {
    removeLogLine({ id: "userIssue-" + printer._id });
    UI.addDisplayNoneToElement(multiUserIssueAlert);
  }
}

function checkIfUnderVoltagedPi(printer) {
  const { octoPi } = printer;

  if (!octoPi || Object.keys(octoPi).length === 0) {
    return;
  }
  const printerUnderVoltaged = document.getElementById(
    "printerUnderVoltaged-" + printer._id
  );
  const { throttle_state } = octoPi;
  if (throttle_state.current_undervoltage) {
    updateLogLine(
      "underVoltageIssue-" + printer._id,
      alertsLogMesssageBox,
      createAlertsLogString({
        id: "underVoltageIssue-" + printer._id,
        name: "Pi is reporting been undervoltaged!",
        printerName: printer.printerName,
        colour: "Offline",
      })
    );
    UI.removeDisplayNoneFromElement(printerUnderVoltaged);
  } else {
    removeLogLine({ id: "underVoltageIssue-" + printer._id });
    UI.addDisplayNoneToElement(printerUnderVoltaged);
  }
}

function checkIfOverheatingPi(printer) {
  const { octoPi } = printer;

  if (!octoPi || Object.keys(octoPi).length === 0) {
    return;
  }
  const printerOverHeating = document.getElementById(
    "printerOverHeating-" + printer._id
  );
  const { throttle_state } = octoPi;
  if (throttle_state.current_overheat) {
    updateLogLine(
      "overheatingIssue-" + printer._id,
      alertsLogMesssageBox,
      createAlertsLogString({
        id: "overheatingIssue-" + printer._id,
        name: "Pi is reporting it is overheating!",
        printerName: printer.printerName,
        colour: "Offline",
      })
    );
    UI.removeDisplayNoneFromElement(printerOverHeating);
  } else {
    removeLogLine({ id: "overheatingIssue-" + printer._id });
    UI.addDisplayNoneToElement(printerOverHeating);
  }
}

function checkForApiErrors(printer) {
  if (
    printer.hostState.colour.category !== "Offline" &&
    printer.hostState.colour.category !== "Info"
  ) {
    const apiErrorTag = document.getElementById(
      `scanningIssues-${printer._id}`
    );

    if (
      apiErrorTag &&
      !ignoredHostStatesForAPIErrors.includes(printer.hostState.state)
    ) {
      let apiErrors = 0;
      for (const key in printer.systemChecks.scanning) {

        if (printer.systemChecks.scanning.hasOwnProperty(key)) {
          if (triggerAPIIssues.includes(key) && printer.systemChecks.scanning[key].status !== "success") {
            apiErrors = apiErrors + 1;
          }
        }
      }

      if (apiErrors > 0) {
        updateLogLine(
            "apiIssue-" + printer._id,
            alertsLogMesssageBox,
            createAlertsLogString({
              id: "apiIssue-" + printer._id,
              name: "API Scan has issues!",
              printerName: printer.printerName,
              colour: "Offline",
            })
        );
        UI.removeDisplayNoneFromElement(apiErrorTag);
      }else{
        removeLogLine({ id: "apiIssue-" + printer._id });
        UI.addDisplayNoneToElement(apiErrorTag);
      }
    } else {
      removeLogLine({ id: "apiIssue-" + printer._id });
      UI.addDisplayNoneToElement(apiErrorTag);
    }
  }
}

function updateButtonState(printer) {
  const apiReScan = document.getElementById(`printerAPIReScan-${printer._id}`);
  const printerSettings = document.getElementById(
    `printerSettings-${printer._id}`
  );
  const printerLog = document.getElementById(`printerLog-${printer._id}`);
  const printerStatistics = document.getElementById(
    `printerStatistics-${printer._id}`
  );
  const forceReconnect = document.getElementById(`printerForceReconnect-${printer._id}`)

  const allowedActions =
    !isPrinterFullyScanned(printer) || printerIsDisabled(printer)

  UI.doesElementNeedUpdating(allowedActions || printerIsOffline(printer), apiReScan, "disabled");
  UI.doesElementNeedUpdating(allowedActions, printerSettings, "disabled");
  UI.doesElementNeedUpdating(allowedActions, printerLog, "disabled");
  UI.doesElementNeedUpdating(allowedActions, printerStatistics, "disabled");
  UI.doesElementNeedUpdating(printerIsDisabled(printer), forceReconnect, "disabled");
}

function updatePrinterRow(printer) {
  const printerCard = document.getElementById(`printerCard-${printer._id}`);
  if (printerCard) {
    updatePrinterInfo(printer);
    setupReconnectingIn(printer);
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

      checkIfUnderVoltagedPi(printer);

      checkIfOverheatingPi(printer);

      checkIfPrinterConnectionThrottled(printer);

      checkIfCpuDataAvailable(printer);

      checkKlipperState(printer);
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
        printerList.insertAdjacentHTML(
          "beforeend",
          returnDisabledPrinterTableRow(printer)
        );
      } else {
        printerList.insertAdjacentHTML(
          "beforeend",
          returnPrinterTableRow(printer)
        );
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
        .getElementById(`printerAPIScanning-${printer._id}`)
        .addEventListener("click", async (e) => {
          e.target.disabled = true;
          UI.addDisplayNoneToElement(e.target);
          const { msg } = await OctoFarmClient.forceReconnect(printer._id);
          UI.createAlert(
            "warning",
            `${msg}`,
            5000,
            "Clicked"
          );
          e.target.disabled = false;
        });

      document
        .getElementById(`printerForceReconnect-${printer._id}`)
        .addEventListener("click", async () => {
          const { msg } = await OctoFarmClient.forceReconnect(printer._id);
          UI.createAlert(
            "warning",
            `${msg}`,
            5000,
            "Clicked"
          );
        });

      document
        .getElementById(`printerEdit-${printer._id}`)
        .addEventListener("click", async () => {
          const printersInfo = await OctoFarmClient.listPrinters(false, true);
          await PrinterEditService.loadPrinterEditInformation(
            printersInfo,
            printer._id
          );
        });

      document
        .getElementById(`printerSettings-${printer._id}`)
        .addEventListener("click", async () => {
          const printersInfo = await OctoFarmClient.listPrinters();
          await updatePrinterSettingsModal(printersInfo, printer._id);
        });
      document
        .getElementById(`printerLog-${printer._id}`)
        .addEventListener("click", async () => {
          const printerInfo = await OctoFarmClient.getPrinter(printer._id);
          let connectionLogs = await OctoFarmClient.get(
            "printers/connectionLogs/" + printer._id
          );
          await PrinterLogsService.initialise(printerInfo, connectionLogs);
        });

      document
        .getElementById(`printerStatistics-${printer._id}`)
        .addEventListener("click", async () => {
          await PrinterStatisticsService.loadStatistics(printer._id);
        });

      document
        .getElementById(`printerDisable-${printer._id}`)
        .addEventListener("click", (e) => {
          const isDisabled = UI.isPrinterDisabled(e);
          const messageDisabled =
            "A disabled printer will not make any connection attempts until re-enabled. You will not see it in the UI and it will not effect any stats like Offline printer count.";
          const messageEnabled =
            "Enabling a printer will restore it to it's previous functionality.";
          bootbox.confirm({
            title: `This will ${
              isDisabled ? "<b>ENABLE</b>" : "<b>DISABLE</b>"
            } your printer. Are you sure?`,
            message: `${isDisabled ? messageEnabled : messageDisabled}`,

            buttons: {
              cancel: {
                label: "<i class=\"fa fa-times\"></i> Cancel",
              },
              confirm: {
                label: "<i class=\"fa fa-check\"></i> Confirm",
              },
            },
            callback: async function (result) {
              if (result) {
                e.target.disabled = true;
                const alert = UI.createAlert(
                  "warning",
                  `${
                    isDisabled ? "Enabling" : "Disabling"
                  } your printer... please wait!`
                );

                if (isDisabled) {
                  await OctoFarmClient.enablePrinter([printer._id]);
                } else {
                  await OctoFarmClient.disablePrinter([printer._id]);
                }

                alert.close();
                UI.createAlert(
                  "success",
                  `Successfully ${
                    isDisabled ? "Enabled" : "Disabled"
                  } your printer!`,
                  "Clicked",
                  3000
                );
                UI.togglePrinterDisableState(e, printer._id);
                setTimeout(() => {
                  e.target.disabled = false;
                }, 5000);
              }
            },
          });
        });

      document
        .getElementById("healthIssues-" + printer._id)
        .addEventListener("click", async () => {
          await loadPrinterHealthChecks(printer._id);
        });

      document
        .getElementById("multiUserIssue-" + printer._id)
        .addEventListener("click", async () => {
          const printersInfo = await OctoFarmClient.listPrinters(false, true);
          await PrinterEditService.loadPrinterEditInformation(
            printersInfo,
            printer._id,
            true
          );
        });

      document
        .getElementById("printerEventsAlert-" + printer._id)
        .addEventListener("click", async () => {
          await loadPrintersRegisteredEvents(printer._id);
        });

      document
        .getElementById("restartRequired-" + printer._id)
        .addEventListener("click", async () => {
          bootbox.confirm({
            message: "This will restart your OctoPrint instance, are you sure?",
            buttons: {
              confirm: {
                label: "Yes",
                className: "btn-success",
              },
              cancel: {
                label: "No",
                className: "btn-danger",
              },
            },
            callback: async function (result) {
              if (result) {
                document.getElementById(
                  "restartRequired-" + printer._id
                ).disabled = true;
                await sendPowerCommandToOctoPrint(printer, "restart");
              }
            },
          });
        });

      document
        .getElementById("printerOverHeating-" + printer._id)
        .addEventListener("click", async () => {
          bootbox.dialog({
            title: "Reported overheating by your Pi!",
            message:
              "<p>Your RaspberryPi has reported it's overheating... Please sort the issue and ReScan the API!</p>",
            size: "small",
            buttons: {
              cancel: {
                label: "Ignore",
                className: "btn-danger",
              },
              ok: {
                label: "Sorted, ReScan API!",
                className: "btn-info",
                callback: async () => {
                  await reSyncAPI(true, printer._id);
                },
              },
            },
          });
        });

      document
        .getElementById("printerUnderVoltaged-" + printer._id)
        .addEventListener("click", async () => {
          bootbox.dialog({
            title: "Reported undervoltage by your Pi!",
            message:
              "<p>Your RaspberryPi has reported it's undervoltaged... Please sort the issue and ReScan the API!</p>",
            size: "small",
            buttons: {
              cancel: {
                label: "Ignore",
                className: "btn-danger",
              },
              ok: {
                label: "Sorted, ReScan API!",
                className: "btn-info",
                callback: async () => {
                  await reSyncAPI(true, printer._id);
                },
              },
            },
          });
        });

      document
        .getElementById("printerConnectionThrottled-" + printer._id)
        .addEventListener("click", async () => {
          bootbox.dialog({
            title: "Printer connection is throttled!",
            message:
              "<p>This is just an alert to let you know. Your printer connection is been throttled because the websocket messages are returning" +
              " slower than the throttle rate on OctoPrint.</p><br><p>There's not much to do to resolve it apart from upgrading/reducing your network conjestion." +
              "</p><br><p>The count on the icon is indicative to how much it is currently been throttled. You can devide the value by 2 to get the milisecond " +
              "rate your messages will come through from OctoPrint at. The default amount is 1 which results in a message speed of 500ms (0.5 seconds). The warning" +
              " will only trigger when a throttle rate above 1 is activated by the server. This is an automated process currently.</p>",
            size: "small",
            buttons: {
              cancel: {
                label: "Ignore",
                className: "btn-danger d-none",
              },
              ok: {
                label: "Ok!",
                className: "btn-info",
              },
            },
          });
        });
      document
        .getElementById("octoPrintsUsage-" + printer._id)
        .addEventListener("click", async () => {
          UI.createAlert("warning", "Doesn't do anything..... YET!", 3000);
        });
    }
  });
}
