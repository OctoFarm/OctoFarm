import {
  returnDisabledPrinterTableRow,
  returnPrinterTableRow
} from "./templates/printer-table-row.templates.js";
import {
  checkQuickConnectState,
  init as actionButtonInit
} from "../../lib/modules/Printers/actionButtons";
import { setupUpdateOctoPrintClientBtn } from "../../octoprint/octoprint-client-commands";
import { setupUpdateOctoPrintPluginsBtn } from "../../octoprint/octoprint-plugin-commands";
import UI from "../../lib/functions/ui.js";
import PrinterLogs from "../../lib/modules/printerLogs.js";
import OctoFarmClient from "../../services/octofarm-client.service";
import { updatePrinterSettingsModal } from "../../lib/modules/printerSettings";
import { reSyncAPI } from "./functions/printer-manager.functions";

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
  const webButton = document.getElementById(`printerWeb-${printer._id}`);

  const printerSortIndex = document.getElementById(`printerSortIndex-${printer._id}`);
  const printerGroup = document.getElementById(`printerGroup-${printer._id}`);

  UI.doesElementNeedUpdating(printer.sortIndex, printerSortIndex, "innerHTML");
  UI.doesElementNeedUpdating(printer.printerName, printName, "innerHTML");
  UI.doesElementNeedUpdating(printer.group, printerGroup, "innerHTML");
  UI.doesElementNeedUpdating(printer.printerURL, webButton, "href");

  printerGroup.innerHTML = printer.group;
}

function corsWarningCheck(printer) {
  // const printerBadge = document.getElementById(`printerBadge-${printer._id}`);
  // if (!printer.corsCheck && !ignoredHostStatesForAPIErrors.includes(printer.printerState.state)) {
  //   UI.doesElementNeedUpdating("CORS NOT ENABLED!", printerBadge, "innerHTML");
  // }
}

function reconnectingIn(printer) {
  const { reconnectingIn, _id } = printer;
  const printerReScanIcon = document.getElementById("apiReScanIcon-" + _id);
  const printerReScanText = document.getElementById("apiReScanText-" + _id);
  const reconnectingInCalculation = reconnectingIn - Date.now();
  if (reconnectingInCalculation > 1000) {
    if (!printerReScanIcon.innerHTML.includes("fa-spin")) {
      printerReScanIcon.innerHTML = '<i class="fas fa-redo fa-sm fa-spin"></i>';
      printerReScanText.innerHTML = UI.generateMilisecondsTime(reconnectingInCalculation);
    } else {
      printerReScanText.innerHTML = UI.generateMilisecondsTime(reconnectingInCalculation);
    }
  } else {
    printerReScanIcon.innerHTML = '<i class="fas fa-redo fa-sm"></i>';
    printerReScanText.innerHTML = "";
  }
}

function checkForOctoPrintUpdate(printer) {
  let updateButton = document.getElementById(`octoprintUpdate-${printer._id}`);
  if (printer?.octoPrintUpdate?.updateAvailable) {
    if (updateButton.disabled) {
      UI.doesElementNeedUpdating(false, updateButton, "disabled");
      updateButton.setAttribute("title", "You have an OctoPrint Update to install!");
    }
  } else {
    if (!updateButton.disabled) {
      UI.doesElementNeedUpdating(true, updateButton, "disabled");
      updateButton.setAttribute("title", "No OctoPrint updates available!");
    }
  }
}

function checkForOctoPrintPluginUpdates(printer) {
  // let updatePluginButton = document.getElementById(`octoprintPluginUpdate-${printer._id}`);
  // if (printer.octoPrintPluginUpdates && printer.octoPrintPluginUpdates.length > 0) {
  //   if (updatePluginButton.disabled) {
  //     updatePluginButton.disabled = false;
  //     updatePluginButton.title = "You have OctoPrint plugin updates to install!";
  //   }
  // } else {
  //   if (!updatePluginButton.disabled) {
  //     updatePluginButton.disabled = true;
  //     updatePluginButton.title = "No OctoPrint plugin updates available!";
  //   }
  // }
}

function checkIfRestartRequired(printer) {
  // const restartRequiredTag = document.getElementById(`restartRequired-${printer._id}`);
  // if (restartRequiredTag && printer?.restartRequired) {
  //   if (restartRequiredTag.classList.contains("d-none")) {
  //     restartRequiredTag.classList.remove("d-none");
  //   }
  // } else {
  //   if (!restartRequiredTag.classList.contains("d-none")) {
  //     restartRequiredTag.classList.add("d-none");
  //   }
  // }
}

function checkIfMultiUserIssueFlagged(printer) {
  // const multiUserIssueAlert = document.getElementById("multiUserIssue-" + printer._id);
  // if (printer?.multiUserIssue) {
  //   if (multiUserIssueAlert.classList.contains("d-none")) {
  //     multiUserIssueAlert.classList.remove("d-none");
  //   }
  // } else {
  //   if (!multiUserIssueAlert.classList.contains("d-none")) {
  //     multiUserIssueAlert.classList.add("d-none");
  //   }
  // }
}

function checkForApiErrors(printer) {
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
      if (apiErrorTag.classList.contains("d-none")) {
        apiErrorTag.classList.remove("d-none");
      }
    }
  } else {
    if (apiErrorTag.classList.contains("d-none")) {
      apiErrorTag.classList.add("d-none");
    }
  }
}

function updatePrinterRow(printer) {
  const printerCard = document.getElementById(`printerCard-${printer._id}`);
  if (printerCard) {
    updatePrinterInfo(printer);
    if (!printer.disabled) {
      checkQuickConnectState(printer);

      updatePrinterState(printer);

      reconnectingIn(printer);

      checkForOctoPrintUpdate(printer);

      checkForOctoPrintPluginUpdates(printer);

      checkForApiErrors(printer);

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
      document
        .getElementById(`scanningIssues-${printer._id}`)
        .addEventListener("click", async (e) => {
          const printersInfo = await OctoFarmClient.listPrinters();
          await updatePrinterSettingsModal(printersInfo, printer._id);
        });
      document.getElementById(`printerLog-${printer._id}`).addEventListener("click", async (e) => {
        const printerInfo = await OctoFarmClient.getPrinter(printer._id);
        let connectionLogs = await OctoFarmClient.get("printers/connectionLogs/" + printer._id);
        PrinterLogs.loadLogs(printerInfo, connectionLogs);
      });

      document
        .getElementById(`printerStatistics-${printer._id}`)
        .addEventListener("click", async (e) => {
          await PrinterLogs.loadStatistics(printer._id);
        });

      document
        .getElementById(`printerAPIReScan-${printer._id}`)
        .addEventListener("click", async (e) => {
          bootbox.dialog({
            title: "Rescan All API endpoints",
            message:
              '<p class="alert alert-warning text-dark" role="alert">ReScan: Will rescan all endpoints, ignoring any that data already exists for.</p>' +
              '<p class="alert alert-danger text-dark" role="alert">Force ReScan: Will rescan all endpoints regardless of existing data.</p>',
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
    }
  });
}