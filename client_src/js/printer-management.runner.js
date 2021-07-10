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
  bulkOctoPrintControlCommand
} from "./printerManager/functions/bulk-commands-functions";
import { scanNetworkForDevices } from "./printerManager/functions/printer-manager.functions";

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
  PrinterSelect.create(
    multiPrinterSelectModal,
    false,
    "Pre-Heat Printers",
    await bulkOctoPrintPreHeatCommand
  );
});

let bulkControl = document.getElementById("bulkControl");
bulkControl.addEventListener("click", async (e) => {
  PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    false,
    "Control Printers",
    bulkOctoPrintControlCommand()
  );
});

let bulkGcodeCommands = document.getElementById("bulkGcodeCommands");
bulkGcodeCommands.addEventListener("click", async (e) => {
  const printersControl = async function () {
    let printersToConnect = [];
    //Grab all check boxes
    const selectedPrinters = PrinterSelect.getSelected();
    selectedPrinters.forEach((element) => {
      const ca = element.id.split("-");
      printersToConnect.push(ca[1]);
    });

    bootbox.prompt({
      size: "large",
      title: "What gcode commands would you like sent?",
      inputType: "textarea",
      onShow: function (e) {
        let textArea = document.getElementsByClassName(
          "bootbox-input bootbox-input-textarea form-control"
        );
        const customGcodeEE =
          "<div class='mb-1' id='customGcodeCommandsArea'></div>";
        textArea[0].insertAdjacentHTML("beforebegin", customGcodeEE);
        let buttonPrinters = [];
        printersToConnect.forEach(async (printer) => {
          const index = _.findIndex(printerInfo, function (o) {
            return o._id === printer;
          });
          if (index > -1) {
            buttonPrinters.push(printerInfo[index]);
          }
        });
        CustomGenerator.generateButtons(buttonPrinters);
      },
      callback: function (result) {
        if (result !== null) {
          printersToConnect.forEach(async (printer) => {
            const index = _.findIndex(printerInfo, function (o) {
              return o._id === printer;
            });
            if (index > -1) {
              let lines = result.match(/[^\r\n]+/g);
              lines = lines.map(function (name) {
                if (!name.includes("=")) {
                  return name.toLocaleUpperCase();
                } else {
                  return name;
                }
              });
              const opt = {
                commands: lines
              };
              const post = await OctoPrintClient.post(
                printerInfo[index],
                "printer/command",
                opt
              );
              if (post.status === 204) {
                UI.createAlert(
                  "success",
                  "Your gcode commands have successfully been sent!",
                  3000,
                  "Clicked"
                );
              } else {
                UI.createAlert(
                  "danger",
                  "Your gcode failed to send! Please check the printer is able to receive these commands.",
                  3000,
                  "Clicked"
                );
              }
            }
          });
        }
      }
    });
  };

  PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    false,
    "Send Gcode to Printers",
    printersControl
  );
});

const customGcodeScripts = document.getElementById("customGcodeBtn");
customGcodeScripts.addEventListener("click", async (e) => {
  let customScripts = await OctoFarmClient.get("settings/customGcode");
  customScripts = await customScripts.json();

  //Draw Scripts
  let scriptTable = document.getElementById("gcodeScriptTable");
  scriptTable.innerHTML = "";
  customScripts.forEach((scripts) => {
    drawScriptTable(scripts);
  });
});
const createNewScriptBtn = document.getElementById("createNewScriptBtn");

async function newGcodeScript(newScript) {
  const keys = Object.keys(newScript);
  let errors = [];
  for (const key of keys) {
    if (newScript["name"] === "") {
      errors.push(key);
    }
    if (newScript["gcode"] === "") {
      errors.push(key);
    }
  }
  if (errors.length !== 0) {
    UI.createAlert(
      "error",
      "You have blank fields sony jim!, sort them out...",
      3000,
      "Clicked"
    );
    return false;
  } else {
    let lines = newScript.gcode.match(/[^\r\n]+/g);
    newScript.gcode = lines.map(function (name) {
      if (!name.includes("=")) {
        return name.toLocaleUpperCase();
      } else {
        return name;
      }
    });
    if (newScript.id) {
      let post = await OctoFarmClient.post(
        "settings/customGcode/edit",
        newScript
      );
      if (post.status === 200) {
        post = await post.json();
      } else {
        UI.createAlert(
          "error",
          "Something went wrong updating, is the server online?"
        );
      }
    } else {
      let post = await OctoFarmClient.post("settings/customGcode", newScript);
      if (post.status === 200) {
        post = await post.json();
        drawScriptTable(post);
      } else {
        UI.createAlert(
          "error",
          "Something went wrong updating, is the server online?"
        );
      }
    }
  }
  return true;
}

createNewScriptBtn.addEventListener("click", async (e) => {
  let newScript = {
    name: document.getElementById("gcodeScriptName").value,
    description: document.getElementById("gcodeScriptDescription").value,
    gcode: document.getElementById("gcodeScriptScript").value
  };
  await newGcodeScript(newScript);
  document.getElementById("gcodeScriptName").value = "";
  document.getElementById("gcodeScriptDescription").value = "";
  document.getElementById("gcodeScriptScript").value = "";
});

function drawScriptTable(scripts) {
  let scriptTable = document.getElementById("gcodeScriptTable");
  let scriptLines = "";

  scripts.gcode.forEach((e) => {
    scriptLines += `${e}\n`;
  });

  scriptTable.insertAdjacentHTML(
    "beforeend",
    `
             <tr id="scriptRow-${scripts._id}" >
                <td id="script_id_${scripts._id}" class="d-none">${scripts._id}</td>
                <td><input type="text" class="form-control" id="script_name_${scripts._id}" placeholder="${scripts.name}" disabled></input></td>
                <td><input type="text" class="form-control" id="script_desc_${scripts._id}"  placeholder="${scripts.description}" disabled></input></td>
                <td><textarea type="text" class="form-control" id="script_lines_${scripts._id}"  placeholder="${scriptLines}" disabled></textarea></td>
                <td>                                
                <button id="editScript-${scripts._id}" type="button" class="btn btn-sm btn-info edit bg-colour-1">
                    <i class="fas fa-edit editIcon"></i>
                </button>
                <button id="saveScript-${scripts._id}" type="button" class="btn btn-sm btn-success save bg-colour-2 d-none">
                    <i class="fas fa-save saveIcon"></i>
                </button>
                <button id="deleteScript-${scripts._id}" type="button" class="btn btn-sm btn-danger delete">
                    <i class="fas fa-trash deleteIcon"></i>
                </button>
                </td>
            </tr>
      `
  );
  document
    .getElementById("deleteScript-" + scripts._id)
    .addEventListener("click", async (e) => {
      let delt = await OctoFarmClient.get(
        "settings/customGcode/delete/" + scripts._id
      );
      if (delt.status === 200) {
        UI.createAlert(
          "success",
          "Successfully deleted your script...",
          3000,
          "Clicked"
        );
        document.getElementById("scriptRow-" + scripts._id).remove();
      } else {
        UI.createAlert(
          "error",
          "Something went wrong, is the OctoFarm server online?",
          3000,
          "Clicked"
        );
      }
    });
  document
    .getElementById("editScript-" + scripts._id)
    .addEventListener("click", async (e) => {
      document.getElementById(`script_name_${scripts._id}`).disabled = false;
      document.getElementById(`script_desc_${scripts._id}`).disabled = false;
      document.getElementById(`script_lines_${scripts._id}`).disabled = false;
      document.getElementById(`script_name_${scripts._id}`).value =
        document.getElementById(`script_name_${scripts._id}`).placeholder;
      document.getElementById(`script_desc_${scripts._id}`).value =
        document.getElementById(`script_desc_${scripts._id}`).placeholder;
      document.getElementById(`script_lines_${scripts._id}`).value =
        document.getElementById(`script_lines_${scripts._id}`).placeholder;
      document
        .getElementById(`editScript-${scripts._id}`)
        .classList.toggle("d-none");
      document
        .getElementById(`saveScript-${scripts._id}`)
        .classList.toggle("d-none");
    });
  document
    .getElementById("saveScript-" + scripts._id)
    .addEventListener("click", async (e) => {
      let newScript = {
        id: document.getElementById(`script_id_${scripts._id}`).innerHTML,
        name: document.getElementById(`script_name_${scripts._id}`).value,
        description: document.getElementById(`script_desc_${scripts._id}`)
          .value,
        gcode: document.getElementById(`script_lines_${scripts._id}`).value
      };
      console.log(newScript);
      let save = await newGcodeScript(newScript);
      if (save) {
        document.getElementById(`script_name_${scripts._id}`).placeholder =
          document.getElementById(`script_name_${scripts._id}`).value;
        document.getElementById(`script_desc_${scripts._id}`).placeholder =
          document.getElementById(`script_desc_${scripts._id}`).value;
        document.getElementById(`script_lines_${scripts._id}`).placeholder =
          document.getElementById(`script_lines_${scripts._id}`).value;
        document.getElementById(`script_name_${scripts._id}`).value = "";
        document.getElementById(`script_desc_${scripts._id}`).value = "";
        document.getElementById(`script_lines_${scripts._id}`).value = "";
        document.getElementById(`script_name_${scripts._id}`).disabled = true;
        document.getElementById(`script_desc_${scripts._id}`).disabled = true;
        document.getElementById(`script_lines_${scripts._id}`).disabled = true;
        document
          .getElementById(`editScript-${scripts._id}`)
          .classList.toggle("d-none");
        document
          .getElementById(`saveScript-${scripts._id}`)
          .classList.toggle("d-none");
      }
    });
}

const pluginAction = async function (action) {
  let printersToConnect = [];
  //Grab all check boxes
  const selectedPrinters = PrinterSelect.getSelected();
  selectedPrinters.forEach((element) => {
    const ca = element.id.split("-");
    printersToConnect.push(ca[1]);
  });
  //Grab first printer for now...
  const index = _.findIndex(printerInfo, function (o) {
    return o._id === printersToConnect[0];
  });
  if (index > -1) {
    let pluginList = [];
    let printerPluginList = null;
    if (action === "install") {
      printerPluginList = await OctoFarmClient.get(
        "printers/pluginList/" + printerInfo[index]._id
      );
    } else {
      printerPluginList = await OctoFarmClient.get("printers/pluginList/all");
    }

    printerPluginList = await printerPluginList.json();
    printerPluginList.forEach((plugin) => {
      if (action === "install") {
        pluginList.push({
          text: pluginListTemplate(plugin),
          value: plugin.archive
        });
      } else {
        pluginList.push({
          text: pluginListTemplate(plugin),
          value: plugin.id
        });
      }
    });
    pluginList = _.sortBy(pluginList, [
      function (o) {
        return o.text;
      }
    ]);
    //Install Promt
    if (action === "install") {
      bootbox.prompt({
        size: "large",
        title: `<form class="form-inline float-right">
                  <div class="form-group">
                    <label for="searchPlugins">
                      Please choose the plugin you'd like to install... or: &nbsp;
                    </label>
                    <input width="50%" id="searchPlugins" type="text" placeholder="Type your plugin name here..." class="search-control search-control-underlined">
                  </div>
                </form>`,
        inputType: "checkbox",
        multiple: true,
        inputOptions: pluginList,
        scrollable: true,
        onShow: function (e) {
          let pluginSearch = document.getElementById("searchPlugins");
          pluginSearch.addEventListener("keyup", (e) => {
            const fileList = document.getElementsByClassName(
              "bootbox-checkbox-list"
            );
            let input = document
              .getElementById("searchPlugins")
              .value.toUpperCase();

            input = input.replace(/ /g, "_");
            const button = fileList[0].querySelectorAll('*[id^="plugin-"]');
            for (let i = 0; i < button.length; i++) {
              const file = button[i].id.replace("plugin-", "");
              if (file.toUpperCase().indexOf(input) > -1) {
                button[i].parentNode.parentNode.style.display = "";
              } else {
                button[i].parentNode.parentNode.style.display = "none";
              }
            }
          });
        },
        callback: async function (result) {
          if (result) {
            let tracker = document.getElementById("pluginTracking");
            let trackerBtn = document.getElementById("pluginTracking");
            trackerBtn.classList.remove("d-none");
            let pluginAmount = result.length * printersToConnect.length;
            tracker.innerHTML = `
               Installing Plugins!<br>
               <i class="fas fa-print"></i>${printersToConnect.length} / <i class="fas fa-plug"></i> ${pluginAmount}
        `;
            for (let p = 0; p < printersToConnect.length; p++) {
              //grab index
              const index = _.findIndex(printerInfo, function (o) {
                return o._id === printersToConnect[p];
              });
              if (
                printerInfo[index].printerState.colour.category !== "Active"
              ) {
                for (let r = 0; r < result.length; r++) {
                  let alert = UI.createAlert(
                    "warning",
                    `${printerInfo[index].printerName}: Installing - ${result[r]}<br>Do not navigate away from this screen!`
                  );

                  let postData = {
                    command: action,
                    dependency_links: false,
                    url: result[r]
                  };

                  let post = await OctoPrintClient.post(
                    printerInfo[index],
                    "plugin/pluginmanager",
                    postData
                  );
                  tracker.innerHTML = `
                Installing Plugins!<br>
                <i class="fas fa-print"></i>${
                  printersToConnect.length - p
                } / <i class="fas fa-plug"></i> ${pluginAmount}
              `;
                  pluginAmount = pluginAmount - 1;
                  alert.close();
                  if (post.status == 409) {
                    UI.createAlert(
                      "error",
                      "Plugin not installed... Printer could be active...",
                      4000,
                      "Clicked"
                    );
                  } else if (post.status == 400) {
                    UI.createAlert(
                      "error",
                      "Malformed request... please log an issue...",
                      4000,
                      "Clicked"
                    );
                  } else if (post.status === 200) {
                    let response = await post.json();
                    if (response.needs_restart || response.needs_refresh) {
                      UI.createAlert(
                        "success",
                        `${printerInfo[index].printerName}: ${result[r]} - Has successfully been installed... OctoPrint restart is required!`,
                        4000,
                        "Clicked"
                      );
                    } else {
                      UI.createAlert(
                        "success",
                        `${printerInfo[index].printerName}: ${result[r]} - Has successfully been installed... No further action requested...`,
                        4000,
                        "Clicked"
                      );
                    }
                  }
                }
              } else {
                UI.createAlert(
                  "danger",
                  `${printerInfo[index].printerName}: Is active skipping the plugin installation command...`
                );
              }
            }
            let restartInstance = document.getElementById("restartInstances");
            restartInstance.classList.remove("d-none");
            restartInstance.addEventListener("click", async (e) => {
              restartInstance.classList.add("d-none");
              for (let p = 0; p < printersToConnect.length; p++) {
                const index = _.findIndex(printerInfo, function (o) {
                  return o._id === printersToConnect[p];
                });
                if (index > -1) {
                  if (
                    printerInfo[index].printerState.colour.category !== "Active"
                  ) {
                    let post = await OctoPrintClient.systemNoConfirm(
                      printerInfo[index],
                      "restart"
                    );
                    if (typeof post !== "undefined") {
                      if (post.status === 204) {
                        UI.createAlert(
                          "success",
                          `Successfully made restart attempt to ${printerInfo[index].printerName}...`,
                          3000,
                          "Clicked"
                        );
                      } else {
                        UI.createAlert(
                          "error",
                          `There was an issue sending restart to ${printerInfo[index].printerName} are you sure it's online?`,
                          3000,
                          "Clicked"
                        );
                      }
                    } else {
                      UI.createAlert(
                        "error",
                        `No response from ${printerInfo[index].printerName}, is it online???`,
                        3000,
                        "Clicked"
                      );
                    }
                  } else {
                    UI.createAlert(
                      "warning",
                      `Printer ${printerInfo[index].printerName} is not in "Idle" state... skipping`,
                      3000,
                      "Clicked"
                    );
                  }
                } else {
                  UI.createAlert(
                    "error",
                    "Could not find your printer in your printer in the list of available printers...",
                    3000,
                    "Clicked"
                  );
                }
              }
            });
            trackerBtn.classList.add("d-none");
          }
        }
      });
    } else {
      bootbox.prompt({
        size: "large",
        title: `<form class="form-inline float-right">
                  <div class="form-group">
                    <label for="searchPlugins">
                      Please choose the plugin you'd like to ${action}... or: &nbsp;
                    </label>
                    <input width="50%" id="searchPlugins" type="text" placeholder="Type your plugin name here..." class="search-control search-control-underlined">
                  </div>
                </form>`,
        inputType: "checkbox",
        multiple: true,
        inputOptions: pluginList,
        scrollable: true,
        onShow: function (e) {
          let pluginSearch = document.getElementById("searchPlugins");
          pluginSearch.addEventListener("keyup", (e) => {
            const fileList = document.getElementsByClassName(
              "bootbox-checkbox-list"
            );
            let input = document
              .getElementById("searchPlugins")
              .value.toUpperCase();

            input = input.replace(/ /g, "_");
            const button = fileList[0].querySelectorAll('*[id^="plugin-"]');
            for (let i = 0; i < button.length; i++) {
              const file = button[i].id.replace("plugin-", "");
              if (file.toUpperCase().indexOf(input) > -1) {
                button[i].parentNode.parentNode.style.display = "";
              } else {
                button[i].parentNode.parentNode.style.display = "none";
              }
            }
          });
        },
        callback: async function (result) {
          if (result) {
            let tracker = document.getElementById("pluginTracking");
            let trackerBtn = document.getElementById("pluginTracking");
            trackerBtn.classList.remove("d-none");
            let pluginAmount = result.length * printersToConnect.length;
            let cleanAction = action.charAt(0).toUpperCase() + action.slice(1);
            tracker.innerHTML = `
                   ${cleanAction} Plugins!<br>
                   <i class="fas fa-print"></i>${printersToConnect.length} / <i class="fas fa-plug"></i> ${pluginAmount}
            `;
            for (let p = 0; p < printersToConnect.length; p++) {
              //grab index
              const index = _.findIndex(printerInfo, function (o) {
                return o._id === printersToConnect[p];
              });
              if (
                printerInfo[index].printerState.colour.category !== "Active"
              ) {
                for (let r = 0; r < result.length; r++) {
                  let alert = UI.createAlert(
                    "warning",
                    `${printerInfo[index].printerName}: ${cleanAction} - ${result[r]}<br>Do not navigate away from this screen!`
                  );

                  let postData = {
                    command: action,
                    plugin: result[r]
                  };

                  let post = await OctoPrintClient.post(
                    printerInfo[index],
                    "plugin/pluginmanager",
                    postData
                  );
                  tracker.innerHTML = `
                    Installing Plugins!<br>
                    <i class="fas fa-print"></i>${
                      printersToConnect.length - p
                    } / <i class="fas fa-plug"></i> ${pluginAmount}
                  `;
                  pluginAmount = pluginAmount - 1;
                  alert.close();
                  if (post.status == 409) {
                    UI.createAlert(
                      "error",
                      "Plugin not installed... Printer could be active...",
                      4000,
                      "Clicked"
                    );
                  } else if (post.status == 400) {
                    UI.createAlert(
                      "error",
                      "Malformed request... please log an issue...",
                      4000,
                      "Clicked"
                    );
                  } else if (post.status === 200) {
                    let response = await post.json();
                    if (response.needs_restart || response.needs_refresh) {
                      UI.createAlert(
                        "success",
                        `${printerInfo[index].printerName}: ${response.plugin.name} - Has successfully been ${cleanAction}... OctoPrint restart is required!`,
                        4000,
                        "Clicked"
                      );
                    } else {
                      UI.createAlert(
                        "success",
                        `${printerInfo[index].printerName}: ${response.plugin.name} - Has successfully been ${cleanAction}... No further action requested...`,
                        4000,
                        "Clicked"
                      );
                    }
                  }
                }
              } else {
                UI.createAlert(
                  "danger",
                  `${printerInfo[index].printerName}: Is active skipping the plugin  ${cleanAction} command...`
                );
              }
            }
            let restartInstance = document.getElementById("restartInstances");
            restartInstance.classList.remove("d-none");
            restartInstance.addEventListener("click", async (e) => {
              restartInstance.classList.add("d-none");
              for (let p = 0; p < printersToConnect.length; p++) {
                const index = _.findIndex(printerInfo, function (o) {
                  return o._id === printersToConnect[p];
                });
                if (index > -1) {
                  if (
                    printerInfo[index].printerState.colour.category !== "Active"
                  ) {
                    let post = await OctoPrintClient.systemNoConfirm(
                      printerInfo[index],
                      "restart"
                    );
                    if (typeof post !== "undefined") {
                      if (post.status === 204) {
                        UI.createAlert(
                          "success",
                          `Successfully made restart attempt to ${printerInfo[index].printerName}...`,
                          3000,
                          "Clicked"
                        );
                      } else {
                        UI.createAlert(
                          "error",
                          `There was an issue sending restart to ${printerInfo[index].printerName} are you sure it's online?`,
                          3000,
                          "Clicked"
                        );
                      }
                    } else {
                      UI.createAlert(
                        "error",
                        `No response from ${printerInfo[index].printerName}, is it online???`,
                        3000,
                        "Clicked"
                      );
                    }
                  } else {
                    UI.createAlert(
                      "warning",
                      `Printer ${printerInfo[index].printerName} is not in "Idle" state... skipping`,
                      3000,
                      "Clicked"
                    );
                  }
                } else {
                  UI.createAlert(
                    "error",
                    "Could not find your printer in your printer in the list of available printers...",
                    3000,
                    "Clicked"
                  );
                }
              }
            });
            trackerBtn.classList.add("d-none");
          }
        }
      });
    }
  }
};
const blkPluginsBtn = document.getElementById("blkPluginsInstallBtn");
blkPluginsBtn.addEventListener("click", async (e) => {
  PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    false,
    "Install Plugins",
    function () {
      pluginAction("install");
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
      pluginAction("uninstall");
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
      pluginAction("enable");
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
      pluginAction("disable");
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
