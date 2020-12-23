import "@babel/polyfill";
import OctoPrintClient from "./lib/octoprint.js";
import OctoFarmClient from "./lib/octofarm.js";
import UI from "./lib/functions/ui.js";
import PrinterManager from "./lib/modules/printerManager.js";
import PrinterSettings from "./lib/modules/printerSettings.js";
import FileOperations from "./lib/functions/file.js";
import Validate from "./lib/functions/validate.js";
import PowerButton from "./lib/modules/powerButton.js";
import {
  init as actionButtonInit,
  checkQuickConnectState,
} from "./lib/modules/Printers/actionButtons.js";
import PrinterSelect from "./lib/modules/printerSelect";
import PrinterLogs from "./lib/modules/printerLogs.js";
import FileSorting from "./lib/modules/fileSorting";

let printerInfo = "";
const deletedPrinters = [];
let worker = null;
let powerTimer = 5000;
let printerControlList = null;

function createWebWorker() {
  worker = new Worker("/assets/js/workers/printersManagerWorker.min.js");
  worker.onmessage = function (event) {
    if (event.data !== false) {
      if (event.data.currentTickerList.length > 0) {
        dashUpdate.ticker(event.data.currentTickerList);
      }
      printerInfo = event.data.printersInformation;
      printerControlList = event.data.printerControlList;
      if (event.data.printersInformation.length > 0) {
        if (
          document
            .getElementById("printerManagerModal")
            .classList.contains("show")
        ) {
          PrinterManager.init(
            "",
            event.data.printersInformation,
            printerControlList
          );
        } else if (
          document
            .getElementById("printerSettingsModal")
            .classList.contains("show")
        ) {
          PrinterSettings.init(
            "",
            event.data.printersInformation,
            event.data.printerControlList
          );
        } else {
          dashUpdate.printers(
            event.data.printersInformation,
            event.data.printerControlList
          );
          if (powerTimer >= 5000) {
            event.data.printersInformation.forEach((printer) => {
              PowerButton.applyBtn(printer, "powerBtn-");
            });
            powerTimer = 0;
          } else {
            powerTimer += 500;
          }
        }
      }
    }
  };
}
function handleVisibilityChange() {
  if (document.hidden) {
    if (worker !== null) {
      console.log("Screen Abandonded, closing web worker...");
      worker.terminate();
      worker = null;
    }
  } else {
    if (worker === null) {
      console.log("Screen resumed... opening web worker...");
      createWebWorker();
    }
  }
}

document.addEventListener("visibilitychange", handleVisibilityChange, false);

if (window.Worker) {
  // Yes! Web worker support!
  try {
    if (worker === null) {
      createWebWorker();
    }
  } catch (e) {
    console.log(e);
  }
} else {
  // Sorry! No Web Worker support..
  console.log("Web workers not available... sorry!");
}

let newPrintersIndex = 0;
const removeLine = function (element) {
  element.remove();
};
// Dash control listeners
let bulkPluginsToUpdate = false;
let bulkPluginUpdateButton = document.getElementById("blkUpdatePluginsBtn");
bulkPluginUpdateButton.addEventListener("click", async (e) => {
  let currentPrinterList = await OctoFarmClient.post("printers/printerInfo");
  currentPrinterList = await currentPrinterList.json();
  let message = "";
  let toUpdate = [];
  for (let printer = 0; printer < currentPrinterList.length; printer++) {
    let currentPrinter = currentPrinterList[printer];
    if (typeof currentPrinter.updateAvailable !== "undefined") {
      if (currentPrinter.updateAvailable.pluginUpdates.length > 0) {
        message += currentPrinter.printerName + "<br>";
        let prepPrinter = {
          printer: currentPrinter,
          plugins: [],
        };
        toUpdate.push(prepPrinter);
        for (
          let plugin = 0;
          plugin < currentPrinter.updateAvailable.pluginUpdates.length;
          plugin++
        ) {
          let currentPlugin =
            currentPrinter.updateAvailable.pluginUpdates[plugin];
          toUpdate[toUpdate.length - 1].plugins.push(currentPlugin.id);
        }
      }
    }
  }

  message += "Are you sure?";
  bootbox.confirm({
    size: "medium",
    title: "This will update the following printers plugins...",
    message: message,
    callback: async function (result) {
      if (result) {
        for (let i = 0; i < toUpdate.length; i++) {
          const data = {
            targets: toUpdate[i].plugins,
            force: true,
          };
          let updateRequest = await OctoPrintClient.postNOAPI(
            toUpdate[i].printer,
            "plugin/softwareupdate/update",
            data
          );
          if (updateRequest.status === 200) {
            UI.createAlert(
              "success",
              `${toUpdate[i].printer.printerName}: Successfully updated! your instance will restart now.`,
              3000,
              "Clicked"
            );
            let post = await OctoPrintClient.systemNoConfirm(
              toUpdate[i].printer,
              "restart"
            );
            if (typeof post !== "undefined") {
              if (post.status === 204) {
                UI.createAlert(
                  "success",
                  `Successfully made restart attempt to ${toUpdate[i].printer.printerName}... You may need to Re-Sync!`,
                  3000,
                  "Clicked"
                );
              } else {
                UI.createAlert(
                  "error",
                  `There was an issue sending restart to ${toUpdate[i].printer.printerName} are you sure it's online?`,
                  3000,
                  "Clicked"
                );
              }
            } else {
              UI.createAlert(
                "error",
                `No response from ${toUpdate[i].printer.printerName}, is it online???`,
                3000,
                "Clicked"
              );
            }
          } else {
            UI.createAlert(
              "error",
              `${toUpdate[i].printer.printerName}: Failed to update, manual intervention required!`,
              3000,
              "Clicked"
            );
          }
        }
      }
    },
  });
});

let bulkOctoPrintsToUpdate = false;
let bulkOctoPrintUpdateButton = document.getElementById("blkOctoPrintUpdate");
bulkOctoPrintUpdateButton.addEventListener("click", async (e) => {
  let onScreenButtons = document.querySelectorAll("*[id^=octoprintUpdate-]");
  let currentUpdates = [...onScreenButtons].filter((item) => {
    return !item.classList.contains("d-none");
  });
  bootbox.confirm({
    message:
      "This will update any OctoPrint instance with one update available, are you sure?",
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
        for (const btn of currentUpdates) {
          btn.disabled = false;
          btn.click();
          await delay(1000);
        }
      }
    },
  });
});

const deleteAllBtn = document.getElementById("delAllBtn");

async function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
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

const bulkConnectBtn = document.getElementById("bulkConnectBtn");
bulkConnectBtn.addEventListener("click", async (e) => {
  const printerConnect = async function () {
    let printersToConnect = [];
    //Grab all check boxes
    const selectedPrinters = PrinterSelect.getSelected();
    selectedPrinters.forEach((element) => {
      const ca = element.id.split("-");
      printersToConnect.push(ca[1]);
    });
    for (let p = 0; p < printersToConnect.length; p++) {
      const index = _.findIndex(printerInfo, function (o) {
        return o._id === printersToConnect[p];
      });
      if (index > -1) {
        let data = {};
        if (typeof printerInfo[index].connectionOptions !== "undefined") {
          data = {
            command: "connect",
            port: printerInfo[index].connectionOptions.portPreference,
            baudrate: printerInfo[index].connectionOptions.baudratePreference,
            printerProfile:
              printerInfo[index].connectionOptions.printerProfilePreference,
            save: true,
          };
        } else {
          UI.createAlert(
            "warning",
            `${printerInfo[index].printerName} has no preferences saved, defaulting to AUTO...`,
            8000,
            "Clicked"
          );
          data.command = "connect";
          data.port = "AUTO";
          data.baudrate = "AUTO";
          data.printerProfile = "_default";
          data.save = false;
        }
        if (
          printerInfo[index].printerState.colour.category === "Disconnected"
        ) {
          let post = await OctoPrintClient.post(
            printerInfo[index],
            "connection",
            data
          );
          if (typeof post !== "undefined") {
            if (post.status === 204) {
              UI.createAlert(
                "success",
                `Successfully made connection attempt to ${printerInfo[index].printerName}...`,
                3000,
                "Clicked"
              );
            } else {
              UI.createAlert(
                "error",
                `There was an issue connecting to ${printerInfo[index].printerName} it's either not online, or the connection options supplied are not available...`,
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
            `Printer ${printerInfo[index].printerName} is not in "Disconnected" state... skipping`,
            3000,
            "Clicked"
          );
        }
      } else {
        UI.createAlert(
          "error",
          `Could not find ${printerInfo[index].printerName} in your printer in the list of available printers...`,
          3000,
          "Clicked"
        );
      }
    }
  };

  PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    false,
    "Connect Printers",
    printerConnect
  );
});
const bulkDisconnectBtn = document.getElementById("bulkDisconnectBtn");
bulkDisconnectBtn.addEventListener("click", async (e) => {
  const printerDisconnect = async function () {
    let printersToConnect = [];
    //Grab all check boxes
    const selectedPrinters = PrinterSelect.getSelected();
    selectedPrinters.forEach((element) => {
      const ca = element.id.split("-");
      printersToConnect.push(ca[1]);
    });
    for (let p = 0; p < printersToConnect.length; p++) {
      const index = _.findIndex(printerInfo, function (o) {
        return o._id === printersToConnect[p];
      });
      if (index > -1) {
        let data = {
          command: "disconnect",
        };
        if (printerInfo[index].printerState.colour.category === "Idle") {
          let post = await OctoPrintClient.post(
            printerInfo[index],
            "connection",
            data
          );
          if (typeof post !== "undefined") {
            if (post.status === 204) {
              UI.createAlert(
                "success",
                `Successfully made disconnect attempt to ${printerInfo[index].printerName}...`,
                3000,
                "Clicked"
              );
            } else {
              UI.createAlert(
                "error",
                `There was an issue disconnecting to ${printerInfo[index].printerName} are you sure it's online?`,
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
          `Could not find ${printerInfo[index].printerName} in your printer in the list of available printers...`,
          3000,
          "Clicked"
        );
      }
    }
  };

  PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    false,
    "Disconnect Printers",
    printerDisconnect
  );
});
const bulkPowerBtn = document.getElementById("bulkPowerBtn");
bulkPowerBtn.addEventListener("click", async (e) => {
  const printerPower = async function () {
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
        let printersToConnect = [];
        //Grab all check boxes
        const selectedPrinters = PrinterSelect.getSelected();
        selectedPrinters.forEach((element) => {
          const ca = element.id.split("-");
          printersToConnect.push(ca[1]);
        });
        for (let p = 0; p < printersToConnect.length; p++) {
          const index = _.findIndex(printerInfo, function (o) {
            return o._id === printersToConnect[p];
          });
          if (index > -1) {
            if (printerInfo[index].printerState.colour.category !== "Active") {
              let post = await OctoPrintClient.systemNoConfirm(
                printerInfo[index],
                result
              );
              await delay(1000);
              if (typeof post !== "undefined") {
                if (post.status === 204) {
                  UI.createAlert(
                    "success",
                    `Successfully made ${result} attempt to ${printerInfo[index].printerName}...`,
                    3000,
                    "Clicked"
                  );
                } else {
                  UI.createAlert(
                    "error",
                    `There was an issue sending ${result} to ${printerInfo[index].printerName} are you sure it's online?`,
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
              `Could not find your printer in your printer in the list of available printers...`,
              3000,
              "Clicked"
            );
          }
        }
      },
    });
  };

  PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    false,
    "Power On/Off Printers",
    printerPower
  );
});

let scanNetworkBtn = document.getElementById("scanNetworkBtn");
scanNetworkBtn.addEventListener("click", async (e) => {
  e.target.disabled = true;
  UI.createAlert(
    "warning",
    "Scanning your network for new devices now... Please wait!",
    20000
  );
  let printers = await OctoFarmClient.get("printers/scanNetwork");
  let scannedPrinters = await printers.json();
  for (let index = 0; index < scannedPrinters.length; index++) {
    const printer = {
      printerURL: "",
      cameraURL: "",
      name: "",
      group: "",
      apikey: "",
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
    "Scanning your network for new devices now... Please wait!",
    3000,
    "Clicked"
  );
  e.target.disabled = false;
});

function pluginListTemplate(plugin) {
  //Also need check inplace for incompatible...
  let abandoned = ``;
  if (plugin.abandoned === true) {
    abandoned = `<i class="fa fa-heartbeat" title="Abandoned by its maintainer"></i>`;
  }
  let latestRelease = ``;
  console.log(plugin);
  if (
    typeof plugin.github !== "undefined" &&
    typeof plugin.github.latest_release !== "undefined"
  ) {
    latestRelease = `
    <small class="prop" title="Github stars"><i class="fa fa-star"></i> <span >${plugin.github.stars}</span></small>
    <small class="prop" title="Last push to main branch"><i class="fa fa-refresh"></i> <span>${plugin.github.stars}</span></small>
    <small class="prop" title="Latest release &amp; date"><i class="fa fa-tag"></i> <span >${plugin.github.latest_release.tag}</span> (<span >${plugin.github.latest_release.date}</span>)</small>`;
  }

  return `
      <div class="entry" id="plugin-${plugin.title.replace(/ /g, "_")}">
                        <div class="row-fluid">
                            <div class="span12">
                                <div>
                                    <span>${plugin.title}</span>

                                    ${abandoned}
                           
                                </div>
                                <div class="meta">
                                    <small class="prop"><i class="fa fa-info"></i>&nbsp;<a target="_blank" href="${
                                      plugin.page
                                    }" title="${
    plugin.page
  }">Details</a></small>
                                    <small class="prop"><i class="fa fa-home"></i>&nbsp;<a target="_blank" href="${
                                      plugin.homepage
                                    }" title="${
    plugin.homepage
  }">Homepage</a></small>
                                    <small class="prop"><i class="fa fa-user"></i> <span title="${
                                      plugin.author
                                    }">${plugin.author}</span></small>
                                </div>
                                <div class="muted"><small>${
                                  plugin.description
                                }</small></div>
                                <div class="stats">
                                    <small class="prop" title="License"><i class="fa fa-gavel"></i> <span>${
                                      plugin.license
                                    }</span></small>
                                    <small class="prop" title="Publication date"><i class="fa fa-birthday-cake"></i> <span>${JSON.stringify(
                                      plugin.published
                                    ).substring(1, 11)}</span></small>
                                    <small class="prop" title="Active instances past month"><i class="fa fa-server"></i> <span >${JSON.stringify(
                                      plugin.stats.instances_month
                                    ).substring(0, 11)}</span></small>
                                    ${latestRelease}
                                </div>
                            </div>

                        </div>
                    </div>
  
  
  `;
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
          value: plugin.archive,
        });
      } else {
        pluginList.push({
          text: pluginListTemplate(plugin),
          value: plugin.id,
        });
      }
    });
    pluginList = _.sortBy(pluginList, [
      function (o) {
        return o.text;
      },
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
              `bootbox-checkbox-list`
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
                    url: result[r],
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
                        `${printerInfo[index].printerName}: ${response.plugin.name} - Has successfully been installed... OctoPrint restart is required!`,
                        4000,
                        "Clicked"
                      );
                    } else {
                      UI.createAlert(
                        "success",
                        `${printerInfo[index].printerName}: ${response.plugin.name} - Has successfully been installed... No further action requested...`,
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
                    `Could not find your printer in your printer in the list of available printers...`,
                    3000,
                    "Clicked"
                  );
                }
              }
            });
            trackerBtn.classList.add("d-none");
          }
        },
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
              `bootbox-checkbox-list`
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
                    plugin: result[r],
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
                    `Could not find your printer in your printer in the list of available printers...`,
                    3000,
                    "Clicked"
                  );
                }
              }
            });
            trackerBtn.classList.add("d-none");
          }
        },
      });
    }
  } else {
  }

  // bootbox.prompt({
  //   title: "Enter the plugin URL you'd like to install below:",
  //   centerVertical: true,
  //   callback: async function (result) {
  //     if (result === "" && result === null) {
  //       UI.createAlert("warning", "URL blank... ignoring...", 3000);
  //     } else if (Validate.URL(result)) {
  //       let printersToConnect = [];
  //       //Grab all check boxes
  //       const selectedPrinters = PrinterSelect.getSelected();
  //       selectedPrinters.forEach((element) => {
  //         const ca = element.id.split("-");
  //         printersToConnect.push(ca[1]);
  //       });
  //       if (selectedPrinters.length === 0) {
  //       }
  //       for (let p = 0; p < printersToConnect.length; p++) {
  //         const index = _.findIndex(printerInfo, function (o) {
  //           return o._id === printersToConnect[p];
  //         });
  //         if (index > -1) {
  //           //Success install plugin!
  //           let get = await OctoPrintClient.get(
  //             printerInfo[index],
  //             "plugin/softwareupdate/check?force=true"
  //           );
  //           if (typeof get !== "undefined") {
  //             console.log(get);
  //             console.log(await get.json());
  //             if (get.status === 200) {
  //               UI.createAlert(
  //                 "success",
  //                 `Successfully made disconnect attempt to ${printerInfo[index].printerName}...`,
  //                 3000,
  //                 "Clicked"
  //               );
  //             } else {
  //               UI.createAlert(
  //                 "error",
  //                 `There was an issue disconnecting to ${printerInfo[index].printerName} are you sure it's online?`,
  //                 3000,
  //                 "Clicked"
  //               );
  //             }
  //           } else {
  //             UI.createAlert(
  //               "error",
  //               `No response from ${printerInfo[index].printerName}, is it online???`,
  //               3000,
  //               "Clicked"
  //             );
  //           }
  //         } else {
  //           UI.createAlert(
  //             "error",
  //             `Could not find ${printerInfo[index].printerName} in your printer in the list of available printers...`,
  //             3000,
  //             "Clicked"
  //           );
  //         }
  //       }
  //     } else {
  //       UI.createAlert(
  //         "error",
  //         "Unable to validate URL... please check and try again...",
  //         3000
  //       );
  //     }
  //   },
  // });
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
    id: null,
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
        apikey: printers[r].apikey,
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
  const currentPrinterCount = document.getElementById("printerTable").rows
    .length;
  const newPrinterCount = document.getElementById("printerNewTable").rows
    .length;
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
                          <label for="psPrinterURL">Name:</label>
                          <input id="psPrinterURL" type="text" class="form-control" placeholder="Printer URL" disabled>
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
                          <label for="psPrinterURL">Group:</label>
                          <input id="psPrinterURL" type="text" class="form-control" placeholder="Printer URL" disabled>
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
      scrollable: false,
    });
  }
  PrintersManagement.addPrinter();
});
class Printer {
  constructor(printerURL, camURL, apikey, group, name) {
    this.settingsAppearance = {
      color: "default",
      colorTransparent: false,
      defaultLanguage: "_default",
      name,
      showFahrenheitAlso: false,
    };
    this.printerURL = printerURL;
    this.camURL = camURL;
    this.apikey = apikey;
    this.group = group;
  }
}
class PrintersManagement {
  constructor(printerURL, camURL, apikey, group, name) {
    this.printer = new Printer(printerURL, camURL, apikey, group, name);
  }

  build() {
    return this.printer;
  }

  static addPrinter(newPrinter) {
    // Insert Blank Row at top of printer list
    if (
      document.getElementById("printerNewTable").classList.contains("d-none")
    ) {
      document.getElementById("printerNewTable").classList.remove("d-none");
    }

    if (typeof newPrinter !== "undefined") {
      document.getElementById("printerNewList").insertAdjacentHTML(
        "beforebegin",
        `
         <tr id="newPrinterCard-${newPrintersIndex}">
              <td><div class="input-group mb-3">
                  <input id="newPrinterName-${newPrintersIndex}" type="text" class="form-control" value="${newPrinter.name}">

                </div></td>
                <td><div class="input-group mb-3">
                  <input id="newPrinterGroup-${newPrintersIndex}" type="text" class="form-control" value="${newPrinter.group}">

                </div></td>
                <td><div class="input-group mb-3">
                  <input id="newPrinterURL-${newPrintersIndex}" type="text" class="form-control" value="${newPrinter.printerURL}">

                </div></td>
                <td><div class="input-group mb-3">
                  <input id="newPrinterCamURL-${newPrintersIndex}" type="text" class="form-control" value="${newPrinter.cameraURL}">

                </div></td>
                <td><div class="input-group mb-3">
                  <input id="newPrinterAPIKEY-${newPrintersIndex}" type="text" class="form-control" value="${newPrinter.apikey}">
                </div></td>
              <td><button id="saveButton-${newPrintersIndex}" type="button" class="btn btn-success btn-sm">
                      <i class="fas fa-save"></i>
                  </button></td>
              <td><button id="delButton-${newPrintersIndex}" type="button" class="btn btn-danger btn-sm">
                      <i class="fas fa-trash"></i>
                  </button></td>
      
          </tr>
  `
      );
    } else {
      document.getElementById("printerNewList").insertAdjacentHTML(
        "beforebegin",
        `
        <tr id="newPrinterCard-${newPrintersIndex}">
        <td><div class="mb-0">
          <input id="newPrinterName-${newPrintersIndex}" type="text" class="form-control" placeholder="Leave blank to grab from OctoPrint">
          <small>Example: <code>My Awesome Printer Name</code></small>
        </div></td>
        <td><div class="mb-0">
          <input id="newPrinterGroup-${newPrintersIndex}" type="text" class="form-control" placeholder="">
          <small>Example: <code>Rack 1</code></small>
        </div></td>
        <td><div class="mb-0">
          <input id="newPrinterURL-${newPrintersIndex}" type="text" class="form-control" placeholder="">
          <small>Example: <code>http://192.168.1.5:80</code></small>
        </div></td>
        <td><div class="mb-0">
          <input id="newPrinterCamURL-${newPrintersIndex}" type="text" class="form-control" placeholder="Leave blank to grab from OctoPrint">
          <small>Example: <code>http://192.168.1.5/webcam/?action=stream</code></small>
        </div></td>
        <td><div class="mb-0">
          <input id="newPrinterAPIKEY-${newPrintersIndex}" type="text" class="form-control" placeholder="">
          <small>OctoPrint Version 1.4.1+: <code>Must use generated User/Application Key</code></small>
        </div></td>
        <td><button id="saveButton-${newPrintersIndex}" type="button" class="btn btn-success btn-sm">
                <i class="fas fa-save"></i>
            </button></td>
        <td><button id="delButton-${newPrintersIndex}" type="button" class="btn btn-danger btn-sm">
                <i class="fas fa-trash"></i>
            </button></td>

    </tr>
  `
      );
    }
    let currentIndex = JSON.parse(JSON.stringify(newPrintersIndex));
    document
      .getElementById(`delButton-${newPrintersIndex}`)
      .addEventListener("click", (event) => {
        removeLine(document.getElementById(`newPrinterCard-${currentIndex}`));
        const table = document.getElementById("printerNewTable");
        if (table.rows.length === 1) {
          if (!table.classList.contains("d-none")) {
            table.classList.add("d-none");
          }
        }
      });
    document
      .getElementById(`saveButton-${newPrintersIndex}`)
      .addEventListener("click", (event) => {
        PrintersManagement.savePrinter(event.target);
      });
    const printerName = document.getElementById(
      `newPrinterName-${newPrintersIndex}`
    );
    newPrintersIndex++;
  }

  static async importPrinters() {
    return function (e) {
      const theBytes = e.target.result; // .split('base64,')[1];
      // Initial JSON validation
      if (Validate.JSON(theBytes)) {
        // If we can parse the file.

        // Grab uploaded file contents into an object
        const importPrinters = JSON.parse(theBytes);
        // Loop over import only importing printers with correct fields.
        for (let index = 0; index < importPrinters.length; index++) {
          const printer = {
            printerURL: "Key not found",
            cameraURL: "Key not found",
            name: "Key not found",
            group: "Key not found",
            apikey: "Key not found",
          };
          if (typeof importPrinters[index].name !== "undefined") {
            printer.name = importPrinters[index].name;
          }
          if (typeof importPrinters[index].printerURL !== "undefined") {
            printer.printerURL = importPrinters[index].printerURL;
          }
          if (typeof importPrinters[index].cameraURL !== "undefined") {
            printer.cameraURL = importPrinters[index].cameraURL;
          }
          if (typeof importPrinters[index].group !== "undefined") {
            printer.group = importPrinters[index].group;
          }
          if (typeof importPrinters[index].apikey !== "undefined") {
            printer.apikey = importPrinters[index].apikey;
          }
          PrintersManagement.addPrinter(printer);
        }
        UI.createAlert(
          "success",
          "Successfully imported your printer list, Please check it over and save when ready.",
          3000
        );
      } else {
        UI.createAlert(
          "error",
          "The file you have tried to upload contains json syntax errors.",
          3000
        );
      }
    };
  }

  static async deletePrinter() {
    if (deletedPrinters.length > 0) {
      const post = await OctoFarmClient.post(
        "printers/remove",
        deletedPrinters
      );
      if (post.status === 200) {
        let printersRemoved = await post.json();
        printersRemoved = printersRemoved.printersRemoved;
        printersRemoved.forEach((printer) => {
          UI.createAlert(
            "success",
            `Printer: ${printer.printerURL} has successfully been removed from the farm...`,
            1000,
            "Clicked"
          );
          document.getElementById(`printerCard-${printer.printerId}`).remove();
        });
      } else {
        UI.createAlert(
          "error",
          "Something went wrong updating the Server...",
          3000,
          "Clicked"
        );
      }
    } else {
      UI.createAlert(
        "error",
        "To delete a printer... one must first select a printer.",
        3000,
        "Clicked"
      );
    }
  }

  static async savePrinter(event) {
    // Gather the printer data...
    let newId = event.id.split("-");
    newId = newId[1];

    // Grab new printer cells...
    const printerURL = document.getElementById(`newPrinterURL-${newId}`);
    const printerCamURL = document.getElementById(`newPrinterCamURL-${newId}`);
    const printerAPIKEY = document.getElementById(`newPrinterAPIKEY-${newId}`);
    const printerGroup = document.getElementById(`newPrinterGroup-${newId}`);
    const printerName = document.getElementById(`newPrinterName-${newId}`);

    const errors = [];
    let printCheck = -1;
    if (printerURL.value !== "") {
      printCheck = _.findIndex(printerInfo, function (o) {
        return o.printerURL.includes(printerURL.value);
      });
    }
    // Check information is filled correctly...
    if (
      printerURL.value === "" ||
      printCheck > -1 ||
      printerAPIKEY.value === "" ||
      printerName.value === "" ||
      printerCamURL.value === ""
    ) {
      if (printerURL.value === "") {
        errors.push({ type: "warning", msg: "Please input your printers URL" });
      }
      if (printerAPIKEY.value === "") {
        errors.push({
          type: "warning",
          msg: "Please input your printers API Key",
        });
      }
      if (printCheck > -1) {
        errors.push({
          type: "error",
          msg: `Printer URL: ${printerURL.value} already exists on farm`,
        });
      }
    }
    if (errors.length > 0) {
      errors.forEach((error) => {
        UI.createAlert(error.type, error.msg, 3000, "clicked");
      });
    } else {
      const printers = [];
      const saveButton = document.getElementById(`saveButton-${newId}`);
      saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      saveButton.disabled = true;
      const printer = new PrintersManagement(
        printerURL.value,
        printerCamURL.value,
        printerAPIKEY.value,
        printerGroup.value,
        printerName.value
      ).build();
      printers.push(printer);
      const post = await OctoFarmClient.post("printers/add", printers);
      if (post.status === 200) {
        let printersAdded = await post.json();
        printersAdded = printersAdded.printersAdded;
        printersAdded.forEach((printer) => {
          UI.createAlert(
            "success",
            `Printer: ${printer.printerURL} has successfully been added to the farm...`,
            500,
            "Clicked"
          );
        });
        event.parentElement.parentElement.parentElement.remove();
      } else {
        UI.createAlert(
          "error",
          "Something went wrong updating the Server...",
          3000,
          "Clicked"
        );
        saveButton.innerHTML = '<i class="fas fa-save"></i>';
        saveButton.disabled = false;
      }
    }
    const table = document.getElementById("printerNewTable");
    if (table.rows.length === 1) {
      if (!table.classList.contains("d-none")) {
        table.classList.add("d-none");
      }
    }
  }
}

// Initial listeners

// class dashActions {
//   static async connectionAction(action) {
//     $("#connectionModal").modal("hide");
//     const selected = document.querySelectorAll("[id^='printerSel-']");
//     document.getElementById("connectionAction").remove();
//     if (action === "connect") {
//       for (let i = 0; i < selected.length; i++) {
//         if (selected[i].checked === true) {
//           const index = selected[i].id.replace("printerSel-", "");
//           let printerName = "";
//           if (typeof printerInfo[index].settingsAppearance !== "undefined") {
//             printerName = printerInfo[index].settingsAppearance.name;
//           }
//           let preferBaud = printerInfo[index].options.baudratePreference;
//           let preferPort = printerInfo[index].options.portPreference;
//           let preferProfile =
//             printerInfo[index].options.printerProfilePreference;
//           if (preferBaud === null) {
//             preferBaud = "115200";
//           }
//           if (preferPort === null) {
//             preferPort = printerInfo[index].options.ports[0];
//           }
//           if (preferProfile === null) {
//             preferProfile = printerInfo[index].options.printerProfiles[0];
//           }
//           const opts = {
//             command: "connect",
//             port: preferPort,
//             baudrate: parseInt(preferPort),
//             printerProfile: preferProfile,
//             save: true,
//           };
//           let post = null;
//           try {
//             post = await OctoPrintClient.post(
//               printerInfo[index],
//               "connection",
//               opts
//             );
//             if (post.status === 204) {
//               UI.createAlert(
//                 "success",
//                 `Connected: ${printerInfo[index].index}. ${printerName}`,
//                 1000,
//                 "clicked"
//               );
//             } else {
//               UI.createAlert(
//                 "error",
//                 `Couldn't Connect ${printerInfo[index].index}with Port: ${preferPort}, Baud: ${preferBaud}, Profile: ${preferProfile}`,
//                 1000,
//                 "clicked"
//               );
//             }
//           } catch (e) {
//             console.log(e);
//             UI.createAlert(
//               "error",
//               `Couldn't Connect ${printerInfo[index].index}with Port: ${preferPort}, Baud: ${preferBaud}, Profile: ${preferProfile}`,
//               1000,
//               "clicked"
//             );
//           }
//         }
//       }
//     } else if (action === "disconnect") {
//       for (let i = 0; i < selected.length; i++) {
//         if (selected[i].checked === true) {
//           const index = selected[i].id.replace("printerSel-", "");
//           let printerName = "";
//           if (typeof printerInfo[index].settingsAppearance !== "undefined") {
//             printerName = printerInfo[index].settingsAppearance.name;
//           }
//           const opts = {
//             command: "disconnect",
//           };
//           const post = await OctoPrintClient.post(
//             printerInfo[index],
//             "connection",
//             opts
//           );
//           if (post.status === 204) {
//             UI.createAlert(
//               "success",
//               `Disconnected: ${printerInfo[index].index}. ${printerName}`,
//               1000,
//               "clicked"
//             );
//           } else {
//             UI.createAlert(
//               "error",
//               `Couldn't Disconnect: ${printerInfo[index].index}. ${printerName}`,
//               1000,
//               "clicked"
//             );
//           }
//         }
//       }
//     }
//   }
//
//   static async connectAll() {
//     // Create bootbox confirmation message
//     document.getElementById("connectionActionBtn").insertAdjacentHTML(
//       "beforeBegin",
//       `
//     <button id="connectionAction" type="button" class="btn btn-success" data-dismiss="modal">
//       Connect All
//     </button>
//     `
//     );
//     const message = document.getElementById("printerConnection");
//
//     message.innerHTML =
//       "You must have at least 1 printer in the Disconnected state to use this function...";
//
//     let printersList = "";
//     printerInfo.forEach((printer) => {
//       if (printer.state === "Disconnected") {
//         let printerName = "";
//         if (typeof printer.settingsAppearance !== "undefined") {
//           printerName = printer.settingsAppearance.name;
//         }
//         const print = `
//           <div style="display:inline-block;">
//           <form class="was-validated">
//           <div class="custom-control custom-checkbox mb-3">
//             <input type="checkbox" class="custom-control-input" id="printerSel-${printer.index}" required>
//             <label class="custom-control-label" for="printerSel-${printer.index}">${printer.index}. ${printerName}</label>
//             <div class="valid-feedback">Attempt to connect</div>
//             <div class="invalid-feedback">DO NOT connect</div>
//           </div>
//         </form></div>
//           `;
//         printersList += print;
//         message.innerHTML = printersList;
//       }
//     });
//     const checkBoxes = document.querySelectorAll("[id^='printerSel-']");
//     checkBoxes.forEach((box) => {
//       box.checked = true;
//     });
//     document
//       .getElementById("connectionAction")
//       .addEventListener("click", () => {
//         dashActions.connectionAction("connect");
//       });
//   }
//
//   static async disconnectAll() {
//     // Create bootbox confirmation message
//     document.getElementById("connectionActionBtn").insertAdjacentHTML(
//       "beforeBegin",
//       `
//         <button id="connectionAction" type="button" class="btn btn-success" data-dismiss="modal">
//           Disconnect All
//         </button>
//         `
//     );
//     const message = document.getElementById("printerConnection");
//     message.innerHTML =
//       "You must have at least 1 printer in the Idle category to use this function...";
//     let printersList = "";
//     printerInfo.forEach((printer) => {
//       if (
//         printer.stateColour.category === "Idle" ||
//         printer.stateColour.category === "Complete"
//       ) {
//         let printerName = "";
//         if (typeof printer.settingsAppearance !== "undefined") {
//           printerName = printer.settingsAppearance.name;
//         }
//         const print = `
//               <div style="display:inline-block;">
//               <form class="was-validated">
//               <div class="custom-control custom-checkbox mb-3">
//                 <input type="checkbox" class="custom-control-input" id="printerSel-${printer.index}" required>
//                 <label class="custom-control-label" for="printerSel-${printer.index}">${printer.index}. ${printerName}</label>
//                 <div class="valid-feedback">Attempt to connect</div>
//                 <div class="invalid-feedback">DO NOT connect</div>
//               </div>
//             </form></div>
//               `;
//         printersList += print;
//         message.innerHTML = printersList;
//       }
//     });
//
//     const checkBoxes = document.querySelectorAll("[id^='printerSel-']");
//     checkBoxes.forEach((box) => {
//       box.checked = true;
//     });
//     document
//       .getElementById("connectionAction")
//       .addEventListener("click", () => {
//         dashActions.connectionAction("disconnect");
//       });
//   }
// }

class dashUpdate {
  static ticker(list) {
    const textList = "";
    list.forEach((e) => {
      let date = new Date(e.date);
      date = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
      if (!document.getElementById(e.id)) {
        document
          .getElementById("printerTickerMessageBox")
          .insertAdjacentHTML(
            "afterbegin",
            `<div id="${e.id}" style="width: 100%; font-size:11px;" class="text-left ${e.state} text-wrap"> ${date} | ${e.printer} | ${e.message}</div>`
          );
      }
    });
  }
  static printers(printers) {
    printers.forEach((printer) => {
      let printerName = "";
      if (typeof printer.printerState !== "undefined") {
        if (typeof printer.printerName !== "undefined") {
          printerName = printer.printerName;
        }
        const printerCard = document.getElementById(
          `printerCard-${printer._id}`
        );
        if (printerCard) {
          const printName = document.getElementById(
            `printerName-${printer._id}`
          );
          const printButton = document.getElementById(
            `printerButton-${printer._id}`
          );
          const webButton = document.getElementById(
            `printerWeb-${printer._id}`
          );
          const hostBadge = document.getElementById(`hostBadge-${printer._id}`);
          const printerBadge = document.getElementById(
            `printerBadge-${printer._id}`
          );
          const socketBadge = document.getElementById(
            `webSocketIcon-${printer._id}`
          );
          const printerOctoPrintVersion = document.getElementById(
            `printerOctoPrintVersion-${printer._id}`
          );
          const printerSortIndex = document.getElementById(
            `printerSortIndex-${printer._id}`
          );
          const printerGroup = document.getElementById(
            `printerGroup-${printer._id}`
          );

          printerGroup.innerHTML = printer.group;

          const octoPiVersioning = document.getElementById("octoPiVersioning");
          if (octoPiVersioning) {
            octoPiVersioning.innerHTML = `                 
                  <p>${printer.octoPi.version}</p>
                  <p>${printer.octoPi.model}</p>`;
          }

          printerSortIndex.innerHTML = printer.sortIndex;

          printName.innerHTML = `${printerName}`;
          if (typeof printer.corsCheck !== "undefined") {
            if (printer.corsCheck) {
              printerBadge.innerHTML = printer.printerState.state;
            } else {
              printerBadge.innerHTML = "CORS NOT ENABLED!";
            }
          } else {
            printerBadge.innerHTML = printer.printerState.state;
          }
          printerBadge.className = `tag badge badge-${printer.printerState.colour.name} badge-pill`;
          printerBadge.setAttribute("title", printer.printerState.desc);
          hostBadge.innerHTML = printer.hostState.state;
          hostBadge.setAttribute("title", printer.hostState.desc);
          hostBadge.className = `tag badge badge-${printer.hostState.colour.name} badge-pill`;
          socketBadge.className = `tag badge badge-${printer.webSocketState.colour} badge-pill`;
          socketBadge.setAttribute("title", printer.webSocketState.desc);

          if (typeof printer.updateAvailable !== "undefined") {
            let updateButton = document.getElementById(
              `octoprintUpdate-${printer._id}`
            );
            let updatePluginButton = document.getElementById(
              `octoprintPluginUpdate-${printer._id}`
            );
            if (printer.updateAvailable.octoPrintUpdate.updateAvailable) {
              if (updateButton.classList.contains("d-none")) {
                updateButton.classList.remove("d-none");
              }
              bulkOctoPrintsToUpdate = true;
            } else {
              if (!updateButton.classList.contains("d-none")) {
                updateButton.classList.add("d-none");
              }
            }
            if (printer.updateAvailable.pluginUpdates.length > 0) {
              if (updatePluginButton.classList.contains("d-none")) {
                updatePluginButton.classList.remove("d-none");
              }
              bulkPluginsToUpdate = true;
            } else {
              if (!updatePluginButton.classList.contains("d-none")) {
                updatePluginButton.classList.add("d-none");
              }
            }
            if (bulkOctoPrintsToUpdate) {
              if (bulkOctoPrintUpdateButton.classList.contains("d-none")) {
                bulkOctoPrintUpdateButton.classList.remove("d-none");
              }
            }
            if (bulkPluginsToUpdate) {
              if (bulkPluginUpdateButton.classList.contains("d-none")) {
                bulkPluginUpdateButton.classList.remove("d-none");
              }
            }
          }

          webButton.href = printer.printerURL;

          printerOctoPrintVersion.innerHTML = printer.octoPrintVersion;
          if (typeof printer.updateAvailable !== "undefined") {
            let updateButton = document.getElementById(
              `octoprintUpdate-${printer._id}`
            );
            let updatePluginButton = document.getElementById(
              `octoprintPluginUpdate-${printer._id}`
            );

            if (printer.updateAvailable.octoPrintUpdate.updateAvailable) {
            } else {
              if (!updateButton.classList.contains("d-none")) {
                updateButton.classList.add("d-none");
              }
              // if (!bulkOctoPrintUpdateButton.classList.contains("d-none")) {
              //   bulkOctoPrintUpdateButton.classList.add("d-none");
              // }
            }
            if (printer.updateAvailable.pluginUpdates.length > 0) {
            } else {
              if (!updatePluginButton.classList.contains("d-none")) {
                updatePluginButton.classList.add("d-none");
              }
              // if (!bulkPluginUpdateButton.classList.contains("d-none")) {
              //   bulkPluginUpdateButton.classList.add("d-none");
              // }
            }
          }
          if (printer.hostState.state === "Online") {
            let apiErrors = 0;
            for (const key in printer.systemChecks.scanning) {
              if (printer.systemChecks.scanning.hasOwnProperty(key)) {
                if (printer.systemChecks.scanning[key].status !== "success") {
                  apiErrors = apiErrors + 1;
                }
              }
            }
            const apiErrorTag = document.getElementById(
              `scanningIssues-${printer._id}`
            );
            if (
              apiErrors > 0 &&
              printer.printerState.colour.category !== "Offline"
            ) {
              if (!apiErrorTag.classList.contains("badge-danger")) {
                apiErrorTag.classList.add(
                  "tag",
                  "badge",
                  "badge-danger",
                  "badge-pill"
                );
                apiErrorTag.innerHTML = "API Issues Detected!";
              }
            } else {
              if (apiErrorTag.classList.contains("badge-danger")) {
                apiErrorTag.classList.remove(
                  "tag",
                  "badge",
                  "badge-danger",
                  "badge-pill"
                );
                apiErrorTag.innerHTML = "";
              }
            }
          }
          checkQuickConnectState(printer);

          printButton.disabled =
            printer.printerState.colour.category === "Offline";
        } else {
          let octoPiElement = "";
          if (typeof printer.octoPi !== "undefined") {
            octoPiElement = `
                <td id="octoPiVersioning-${printer._id}">
                  <p>${printer.octoPi.version}</p>
                  <p>${printer.octoPi.model}</p>
                </td>
            `;
            let tableRow = document.getElementById("octoPiVersions");
            if (tableRow.classList.contains("d-none")) {
              tableRow.classList.remove("d-none");
            }
          } else {
          }
          // Insert new printer addition...
          document.getElementById("printerList").insertAdjacentHTML(
            "beforeend",
            `
        <tr id="printerCard-${printer._id}">
        <th><span title="Drag and Change your Printers sorting"  id="printerSortIndex-${printer._id}"
                   class="tag btn btn-light btn-sm sortableList"
            >
    ${printer.sortIndex}
    </span></td>
        <td><div id="printerName-${printer._id}">${printerName}</div></td>
        <td id="printerActionBtns-${printer._id}"></td>
        <td>
          <button  title="Change your Printer Settings"
            id="printerSettings-${printer._id}"
                                 type="button"
                                 class="tag btn btn-secondary btn-sm bg-colour-1"
                                 data-toggle="modal"
                                 data-target="#printerSettingsModal"
            ><i class="fas fa-cog"></i>
            </button>
            <button  title="View individual Printer Logs for OctoFarm/OctoPrint"
            id="printerLog-${printer._id}"
                                 type="button"
                                 class="tag btn btn-secondary btn-sm bg-colour-2"
                                 data-toggle="modal"
                                 data-target="#printerLogsModal"
            ><i class="fas fa-file-alt"></i>
            </button>
            <button title="You have an OctoPrint update to install!" id="octoprintUpdate-${printer._id}" class='tag btn btn-secondary btn-sm bg-colour-3 d-none'><i class="fas fa-wrench"></i> Update!</button>
            <button title="You have OctoPrint plugin updates to install!" id="octoprintPluginUpdate-${printer._id}" class='tag btn btn-secondary btn-sm bg-colour-4 d-none'><i class="fas fa-plug"></i> Update!</button>
            <button title="View individual Printer Statistics"
            id="printerStatistics-${printer._id}"
                                 type="button"
                                 class="tag btn btn-secondary btn-sm bg-colour-3 d-none"
                                 data-toggle="modal"
                                 data-target="#printerStatisticsModal"
                                 disabled
            ><i class="fas fa-chart-pie"></i>
            </button>
           <button  title="Setup and track Maintenance Issues with Printers"
            id="printerMaintenance-${printer._id}"
                                 type="button"
                                 class="tag btn btn-secondary btn-sm bg-colour-4 d-none"
                                 data-toggle="modal"
                                 data-target="#printerMaintenanceModal"
                                 disabled
            ><i class="fas fa-wrench"></i>
            </button>
    </span></td>
        <td><small><span data-title="${printer.hostState.desc}" id="hostBadge-${printer._id}" class="tag badge badge-${printer.hostState.colour.name} badge-pill">
                ${printer.hostState.state}</small></span></td>
        <td><small><span data-title="${printer.printerState.desc}" id="printerBadge-${printer._id}" class="tag badge badge-${printer.printerState.colour.name} badge-pill">
                ${printer.printerState.state}</small></span><br><span data-title="Check printer settings, API issues detected..." id="scanningIssues-${printer._id}"></small></span></td>
        <td><small><span data-title="${printer.webSocketState.desc}" id="webSocketIcon-${printer._id}" class="tag badge badge-${printer.webSocketState.colour} badge-pill">
                <i  class="fas fa-plug"></i></span></td>
   
        <td><div id="printerGroup-${printer._id}" ></div></td>
        <td id="printerOctoPrintVersion-${printer._id}"></td>
        ${octoPiElement}
    </tr>
          `
          );

          actionButtonInit(printer, `printerActionBtns-${printer._id}`);
          document
            .getElementById(`octoprintUpdate-${printer._id}`)
            .addEventListener("click", async () => {
              bootbox.confirm({
                message: "This will tell OctoPrint to update, are you sure?",
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
                    const data = {
                      targets: ["octoprint"],
                      force: true,
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
                      let post = await OctoPrintClient.systemNoConfirm(
                        printer,
                        "restart"
                      );
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
                },
              });
            });
          document
            .getElementById(`octoprintPluginUpdate-${printer._id}`)
            .addEventListener("click", () => {
              let pluginsToUpdate = [];
              let autoSelect = [];
              if (printer.updateAvailable.pluginUpdates.length > 0) {
                printer.updateAvailable.pluginUpdates.forEach((plugin) => {
                  pluginsToUpdate.push({
                    text: `${plugin.displayName} - Version: ${plugin.displayVersion}`,
                    value: plugin.id,
                  });
                  autoSelect.push(plugin.id);
                });
                bootbox.prompt({
                  title: "Select the plugins you'd like to update below...",
                  inputType: "select",
                  multiple: true,
                  value: autoSelect,
                  inputOptions: pluginsToUpdate,
                  callback: async function (result) {
                    const data = {
                      targets: result,
                      force: true,
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
                      let post = await OctoPrintClient.systemNoConfirm(
                        printer,
                        "restart"
                      );
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
                  },
                });
              } else {
                UI.createAlert(
                  "info",
                  "Please rescan your device as there's no plugins actually available..."
                );
              }
            });
          document
            .getElementById(`printerButton-${printer._id}`)
            .addEventListener("click", () => {
              // eslint-disable-next-line no-underscore-dangle
              PrinterManager.init(printer._id, printerInfo, printerControlList);
            });
          document
            .getElementById(`printerSettings-${printer._id}`)
            .addEventListener("click", (e) => {
              PrinterSettings.init(
                // eslint-disable-next-line no-underscore-dangle
                printer._id,
                printerInfo,
                printerControlList
              );
            });
          document
            .getElementById(`printerLog-${printer._id}`)
            .addEventListener("click", async (e) => {
              let connectionLogs = await OctoFarmClient.get(
                "printers/connectionLogs/" + printer._id
              );
              connectionLogs = await connectionLogs.json();
              PrinterLogs.loadLogs(printer, connectionLogs);
            });
        }
      }
    });
  }
}
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
  },
});
