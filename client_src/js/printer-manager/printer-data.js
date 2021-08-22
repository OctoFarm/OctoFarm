import { returnPrinterTableRow } from "./templates/printer-table-row.templates.js";
import {
  checkQuickConnectState,
  init as actionButtonInit
} from "../lib/modules/Printers/actionButtons";
import UI from "../lib/functions/ui.js";
import PrinterManager from "../lib/modules/printerManager.js";
import PrinterLogs from "../lib/modules/printerLogs.js";
import OctoFarmClient from "../services/octofarm-client.service";
import { updatePrinterSettingsModal } from "../lib/modules/printerSettings";

const printerList = document.getElementById("printerList");
const ignoredHostStatesForAPIErrors = ["Setting Up", "Searching...", "Shutdown"];

const printerBase = "printers";
const printerInfoURL = "/printerInfo";

// async function updateBtnOnClick(printerID) {
//   try {
//     let data = {
//       i: printerID
//     };
//
//     const printer = await OctoFarmClient.post(printerBase + printerInfoURL, data);
//
//     let pluginsToUpdate = [];
//     let autoSelect = [];
//     if (printer.octoPrintPluginUpdates.length > 0) {
//       printer.octoPrintPluginUpdates.forEach((plugin) => {
//         pluginsToUpdate.push({
//           text: `${plugin.displayName} - Version: ${plugin.displayVersion}`,
//           value: plugin.id
//         });
//         autoSelect.push(plugin.id);
//       });
//       bootbox.prompt({
//         title: "Select the plugins you'd like to update below...",
//         inputType: "select",
//         multiple: true,
//         value: autoSelect,
//         inputOptions: pluginsToUpdate,
//         callback: async function (result, printer) {
//           if (result.length > 0) {
//             await updateOctoPrintPlugins(result, printer);
//           }
//         }
//       });
//     } else {
//       UI.createAlert(
//         "info",
//         "Please rescan your device as there's no plugins actually available..."
//       );
//     }
//   } catch (e) {
//     console.error(e);
//     UI.createAlert("error", `Unable to grab latest printer information: ${e}`, 0, "clicked");
//   }
// }

export function setupUpdateOctoPrintPluginsBtn(printer) {
  const octoPrintClientPluginUpdateBtn = document.getElementById(
    `octoprintPluginUpdate-${printer._id}`
  );
  if (octoPrintClientPluginUpdateBtn) {
    octoPrintClientPluginUpdateBtn.addEventListener("click", async () => {
      await updateBtnOnClick(printer._id);
    });
  }
}

export async function updateOctoPrintPlugins(pluginList, printer) {
  const data = {
    targets: pluginList,
    force: true
  };
  let updateRequest = await OctoPrintClient.postNOAPI(
    printer,
    "plugin/softwareupdate/update",
    data
  );
  if (updateRequest.status === 200) {
    UI.createAlert(
      "success",
      `${printer.printerName}: Successfully updated! your instance will restart now.`,
      3000,
      "Clicked"
    );
    let post = await OctoPrintClient.systemNoConfirm(printer, "restart");
    if (typeof post !== "undefined") {
      if (post.status === 204) {
        UI.createAlert(
          "success",
          `Successfully made restart attempt to ${printer.printerName}... You may need to Re-Sync!`,
          3000,
          "Clicked"
        );
      } else {
        UI.createAlert(
          "error",
          `There was an issue sending restart to ${printer.printerName} are you sure it's online?`,
          3000,
          "Clicked"
        );
      }
    } else {
      UI.createAlert(
        "error",
        `No response from ${printer.printerName}, is it online???`,
        3000,
        "Clicked"
      );
    }
  } else {
    UI.createAlert(
      "error",
      `${printer.printerName}: Failed to update, manual intervention required!`,
      3000,
      "Clicked"
    );
  }
}

export async function octoPrintPluginInstallAction(printer, pluginList, action) {
  let cleanAction = action.charAt(0).toUpperCase() + action.slice(1);
  if (action === "install") {
    cleanAction = cleanAction + "ing";
  }
  if (printer.printerState.colour.category !== "Active") {
    for (let r = 0; r < pluginList.length; r++) {
      let alert = UI.createAlert(
        "warning",
        `${printer.printerName}: ${cleanAction} - ${pluginList[r]}<br>Do not navigate away from this screen!`
      );
      let postData = {};
      if (action === "install") {
        postData = {
          command: action,
          dependency_links: false,
          url: pluginList[r]
        };
      } else {
        postData = {
          command: action,
          plugin: pluginList[r]
        };
      }

      const post = await OctoPrintClient.post(printer, "plugin/pluginmanager", postData);
      alert.close();
      if (post.status === 409) {
        UI.createAlert(
          "error",
          "Plugin not installed... Printer could be active...",
          4000,
          "Clicked"
        );
      } else if (post.status === 400) {
        UI.createAlert("error", "Malformed request... please log an issue...", 4000, "Clicked");
      } else if (post.status === 200) {
        let response = await post.json();
        if (response.needs_restart || response.needs_refresh) {
          UI.createAlert(
            "success",
            `${printer.printerName}: ${pluginList[r]} - Has successfully been installed... OctoPrint restart is required!`,
            4000,
            "Clicked"
          );
        } else {
          UI.createAlert(
            "success",
            `${printer.printerName}: ${pluginList[r]} - Has successfully been installed... No further action requested...`,
            4000,
            "Clicked"
          );
        }
      }
    }
  } else {
    UI.createAlert(
      "danger",
      `${printer.printerName}: Is active skipping the plugin installation command...`
    );
  }
}

async function updateBtnOnClick(printerID) {
  try {
    let data = {
      i: printerID
    };

    const printer = await OctoFarmClient.post(printerBase + printerInfoURL, data);

    bootbox.confirm({
      message: "This will tell OctoPrint to update, are you sure?",
      buttons: {
        confirm: {
          label: "Yes",
          className: "btn-success"
        },
        cancel: {
          label: "No",
          className: "btn-danger"
        }
      },
      callback: async function (result, printer) {
        if (result) {
          await updateOctoPrintClient(printer);
        }
      }
    });
  } catch (e) {
    console.error(e);
    UI.createAlert("error", `Unable to grab latest printer information: ${e}`, 0, "clicked");
  }
}

export function setupUpdateOctoPrintClientBtn(printer) {
  const octoPrintClientUpdateBtn = document.getElementById(`octoprintUpdate-${printer._id}`);
  if (octoPrintClientUpdateBtn) {
    octoPrintClientUpdateBtn.addEventListener("click", async () => {
      await updateBtnOnClick(printer._id);
    });
  }
}

export async function updateOctoPrintClient(printer) {
  const data = {
    targets: ["octoprint"],
    force: true
  };
  let updateRequest = await OctoPrintClient.postNOAPI(
    printer,
    "plugin/softwareupdate/update",
    data
  );
  if (updateRequest.status === 200) {
    UI.createAlert(
      "success",
      `${printer.printerName}: Update command fired, you may need to restart OctoPrint once complete.`,
      3000,
      "Clicked"
    );
  } else {
    UI.createAlert(
      "error",
      `${printer.printerName}: Failed to update, manual intervention required!`,
      3000,
      "Clicked"
    );
  }
}

export async function quickConnectPrinterToOctoPrint(printer) {
  let data = {};
  if (typeof printer.connectionOptions !== "undefined") {
    data = {
      command: "connect",
      port: printer.connectionOptions.portPreference,
      baudrate: printer.connectionOptions.baudratePreference,
      printerProfile: printer.connectionOptions.printerProfilePreference,
      save: true
    };
  } else {
    UI.createAlert(
      "warning",
      `${printer.printerName} has no preferences saved, defaulting to AUTO...`,
      8000,
      "Clicked"
    );
    data.command = "connect";
    data.port = "AUTO";
    data.baudrate = 0;
    data.printerProfile = "_default";
    data.save = false;
  }
  if (printer.printerState.colour.category === "Disconnected") {
    const post = await OctoPrintClient.post(printer, "connection", data);
    if (typeof post !== "undefined") {
      if (post.status === 204) {
        UI.createAlert(
          "success",
          `Successfully made connection attempt to ${printer.printerName}...`,
          3000,
          "Clicked"
        );
      } else {
        UI.createAlert(
          "error",
          `There was an issue connecting to ${printer.printerName} it's either not online, or the connection options supplied are not available...`,
          3000,
          "Clicked"
        );
      }
    } else {
      UI.createAlert(
        "error",
        `No response from ${printer.printerName}, is it online???`,
        3000,
        "Clicked"
      );
    }
  } else {
    UI.createAlert(
      "warning",
      `Printer ${printer.printerName} is not in "Disconnected" state... skipping`,
      3000,
      "Clicked"
    );
  }
}

export async function disconnectPrinterFromOctoPrint(printer) {
  let data = {
    command: "disconnect"
  };
  if (printer.printerState.colour.category === "Idle") {
    let post = await OctoPrintClient.post(printer, "connection", data);
    if (typeof post !== "undefined") {
      if (post.status === 204) {
        UI.createAlert(
          "success",
          `Successfully made disconnect attempt to ${printer.printerName}...`,
          3000,
          "Clicked"
        );
      } else {
        UI.createAlert(
          "error",
          `There was an issue disconnecting to ${printer.printerName} are you sure it's online?`,
          3000,
          "Clicked"
        );
      }
    } else {
      UI.createAlert(
        "error",
        `No response from ${printer.printerName}, is it online???`,
        3000,
        "Clicked"
      );
    }
  } else {
    UI.createAlert(
      "warning",
      `Printer ${printer.printerName} is not in "Idle" state... skipping`,
      3000,
      "Clicked"
    );
  }
}

export async function sendPowerCommandToOctoPrint(printer, powerCommand) {
  if (printer.printerState.colour.category !== "Active") {
    let post = await OctoPrintClient.systemNoConfirm(printer, powerCommand);
    await UI.delay(1000);
    if (typeof post !== "undefined") {
      if (post.status === 204) {
        UI.createAlert(
          "success",
          `Successfully made ${result} attempt to ${printer.printerName}...`,
          3000,
          "Clicked"
        );
      } else {
        UI.createAlert(
          "error",
          `There was an issue sending ${result} to ${printer.printerName} are you sure it's online?`,
          3000,
          "Clicked"
        );
      }
    } else {
      UI.createAlert(
        "error",
        `No response from ${printer.printerName}, is it online???`,
        3000,
        "Clicked"
      );
    }
  } else {
    UI.createAlert(
      "warning",
      `Printer ${printer.printerName} is not in "Idle" state... skipping`,
      3000,
      "Clicked"
    );
  }
}

function updatePrinterInfoAndState(printer) {
  const printName = document.getElementById(`printerName-${printer._id}`);
  const webButton = document.getElementById(`printerWeb-${printer._id}`);
  const hostBadge = document.getElementById(`hostBadge-${printer._id}`);
  const printerBadge = document.getElementById(`printerBadge-${printer._id}`);
  const socketBadge = document.getElementById(`webSocketIcon-${printer._id}`);

  const printerSortIndex = document.getElementById(`printerSortIndex-${printer._id}`);
  const printerGroup = document.getElementById(`printerGroup-${printer._id}`);

  UI.doesElementNeedUpdating(printer.sortIndex, printerSortIndex, "innerHTML");
  UI.doesElementNeedUpdating(printer.printerName, printName, "innerHTML");
  UI.doesElementNeedUpdating(printer.group, printerGroup, "innerHTML");
  UI.doesElementNeedUpdating(printer.printerURL, webButton, "href");

  printerGroup.innerHTML = printer.groups.map((g) => g.name).join() || printer.group;

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

function updatePrinterColumn(printer) {
  const printerPrinterInformation = document.getElementById(
    `printerPrinterInformation-${printer._id}`
  );
  if (!!printer.octoPrintSystemInfo) {
    if (typeof printer.octoPrintSystemInfo["printer.firmware"] === "undefined") {
      UI.doesElementNeedUpdating(
        '<small title="Please connect and resync to display printer firmware">Unknown</small>',
        printerPrinterInformation,
        "innerHTML"
      );
    } else {
      UI.doesElementNeedUpdating(
        `<small>${printer.octoPrintSystemInfo["printer.firmware"]}</small>`,
        printerPrinterInformation,
        "innerHTML"
      );
    }
  }
}

function updateOctoPiColumn(printer) {
  const printerOctoPrintInformation = document.getElementById(
    `printerOctoPrintInformation-${printer._id}`
  );
  if (!!printer.octoPi) {
    UI.doesElementNeedUpdating(
      `<small>${printer.octoPrintVersion}</small><br>` +
        (printer.octoPi?.version ? `<small>${printer.octoPi.version}</small><br>` : "") +
        `<small>${printer.octoPi.model}</small>`,
      printerOctoPrintInformation,
      "innerHTML"
    );
  } else {
    UI.doesElementNeedUpdating(
      `<small>${printer.octoPrintVersion}</small>`,
      printerOctoPrintInformation,
      "innerHTML"
    );
  }
}

function corsWarningCheck(printer) {
  const printerBadge = document.getElementById(`printerBadge-${printer._id}`);
  if (!printer.corsCheck && !ignoredHostStatesForAPIErrors.includes(printer.hostState.state)) {
    UI.doesElementNeedUpdating("CORS NOT ENABLED!", printerBadge, "innerHTML");
  }
}

function checkForOctoPrintUpdate(printer) {
  let updateButton = document.getElementById(`octoprintUpdate-${printer._id}`);
  let bulkOctoPrintUpdateButton = document.getElementById("blkOctoPrintUpdate");
  if (printer?.octoPrintUpdate?.updateAvailable) {
    if (updateButton.disabled) {
      UI.doesElementNeedUpdating(false, updateButton, "disabled");
      updateButton.setAttribute("title", "You have an OctoPrint Update to install!");
    }
    if (bulkOctoPrintUpdateButton.disabled) {
      bulkOctoPrintUpdateButton.disabled = false;
    }
  } else {
    if (!updateButton.disabled) {
      UI.doesElementNeedUpdating(true, updateButton, "disabled");
      updateButton.setAttribute("title", "No OctoPrint updates available!");
    }
    if (!bulkOctoPrintUpdateButton.disabled) {
      bulkOctoPrintUpdateButton.disabled = true;
    }
  }
}

function checkForOctoPrintPluginUpdates(printer) {
  let updatePluginButton = document.getElementById(`octoprintPluginUpdate-${printer._id}`);
  let bulkPluginUpdateButton = document.getElementById("blkUpdatePluginsBtn");
  if (printer.octoPrintPluginUpdates && printer.octoPrintPluginUpdates.length > 0) {
    if (updatePluginButton.disabled) {
      updatePluginButton.disabled = false;
      updatePluginButton.title = "You have OctoPrint plugin updates to install!";
    }
    if (bulkPluginUpdateButton.disabled) {
      bulkPluginUpdateButton.disabled = false;
    }
  } else {
    if (!updatePluginButton.disabled) {
      updatePluginButton.disabled = true;
      updatePluginButton.title = "No OctoPrint plugin updates available!";
    }
    if (!bulkPluginUpdateButton.disabled) {
      bulkPluginUpdateButton.disabled = true;
    }
  }
}

function checkForApiErrors(printer) {
  const apiErrorTag = document.getElementById(`scanningIssues-${printer._id}`);

  if (!ignoredHostStatesForAPIErrors.includes(printer.hostState.state)) {
    let apiErrors = 0;
    for (const key in printer.systemChecks) {
      if (printer.systemChecks.hasOwnProperty(key)) {
        if (printer.systemChecks[key].status !== "success") {
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

function updateButtonState(printer) {
  const printButton = document.getElementById(`printerButton-${printer._id}`);

  printButton.disabled = printer.printerState.colour.category === "Offline";
}

function updatePrinterRow(printer) {
  const printerCard = document.getElementById(`printerCard-${printer._id}`);
  if (printerCard) {
    updateButtonState(printer);

    checkQuickConnectState(printer);

    updatePrinterInfoAndState(printer);

    updatePrinterColumn(printer);

    updateOctoPiColumn(printer);

    corsWarningCheck(printer);

    checkForOctoPrintUpdate(printer);

    checkForOctoPrintPluginUpdates(printer);

    checkForApiErrors(printer);
  }
}

export function createOrUpdatePrinterTableRow(printers, printerControlList) {
  printers.forEach((printer) => {
    const printerCard = document.getElementById(`printerCard-${printer._id}`);
    if (printerCard) {
      updatePrinterRow(printer);
    } else {
      printerList.insertAdjacentHTML("beforeend", returnPrinterTableRow(printer));
      // Insert actions buttons
      actionButtonInit(printer, `printerActionBtns-${printer._id}`);
      // Check quick connect state and apply
      checkQuickConnectState(printer);
      // Initialise data
      updatePrinterRow(printer);
      // Setup listeners
      setupUpdateOctoPrintClientBtn(printer);
      setupUpdateOctoPrintPluginsBtn(printer);

      // TODO move to function on printer manager cleanup
      document
        .getElementById(`printerButton-${printer._id}`)
        .addEventListener("click", async () => {
          const printers = await OctoFarmClient.listPrinters();
          await PrinterManager.init(printer._id, printers, printerControlList);
        });
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
        let connectionLogs = await OctoFarmClient.getPrinterConnectionLogs(printer._id);
        PrinterLogs.loadLogs(printerInfo, connectionLogs);
      });

      document
        .getElementById(`printerStatistics-${printer._id}`)
        .addEventListener("click", async (e) => {
          await PrinterLogs.loadStatistics(printer._id);
        });
    }
  });
}
