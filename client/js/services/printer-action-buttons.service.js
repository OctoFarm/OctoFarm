import PrinterPowerService from "./printer-power.service.js";
import UI from "../utils/ui";
import OctoPrintClient from "./octoprint-client.service";
import OctoFarmClient from "./octofarm-client.service";
import { groupBy, mapValues } from "lodash";
import {printerIsDisconnectedOrError, printerIsOnline, printerIsPrinting} from "../utils/octofarm.utils";
import {printerEmergencyStop} from "./octoprint/octoprint-printer-commands";

function returnActionBtnTemplate(id, webURL) {
  return `
      <div id="printerManageDropDown-${id}" class="btn-group dropright">
         <button  
           title="Quickly bring your printer online! Power -> Connect"
           id="printerQuickConnect-${id}"
           type="button"
           class="tag btn btn-danger btn-sm"
           >
              <i class="fas fa-toggle-off"></i>
        </button>
        <a title="Open OctoPrint"
               id="printerWeb-${id}"
               type="button"
               class="tag btn btn-info btn-sm"
               target="_blank"
               href="${webURL}" role="button"><i class="fas fa-globe-europe "></i> </a>
        <button type="button" class="btn btn-primary btn-sm dropdown-toggle dropdown-toggle-split" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
         <i class="fas fa-bars"></i>
        </button>
        <div class="dropdown-menu">
          <h6 id="printerActionsHeader-${id}" class="dropdown-header"><i class="fas fa-print"></i> Printer</h6>
          <button
             title="Uses the values from your selected filament and pre-heats to those values."
             id="printerHome-${id}"
             type="button"
             class="dropdown-item"
          >
            <i class="fa-solid fa-house-flag text-success"></i> Home
          </button> 
          <button
             title="Uses the values from your selected filament and pre-heats to those values."
             id="printerPreHeat-${id}"
             type="button"
             class="dropdown-item d-none"
          >
            <i class="fas fa-fire text-warning"></i> Pre-Heat
          </button> 
          <button
             title="Fires an M112 command to the printer!"
             id="printerEmergency-${id}"
             type="button"
             class="dropdown-item"
          >
            <i class="fa-solid fa-ban text-danger"></i> Emergency Stop
          </button> 
          <h6 class="dropdown-header"><i class="fas fa-cogs"></i> Manage</h6>
            <button
               title="Terminate and reconnect OctoPrints Socket connection."
               id="printerSyncButton-${id}"
               type="button"
               class="dropdown-item"
            >
                <i class="fas fa-sync text-warning"></i> Re-Connect Socket
            </button> 
            <button  
             title="Runs a pre-configured gcode sequence so you can detect which printer this is."
             id="printerFindMe-${id}"
             type="button"
             class="dropdown-item d-none"
              disabled
          >
              <i class="fas fa-search text-info"></i> Find Printer!
          </button> 
          <button id="printerPowerOn-${id}" title="Turn on your printer" class="dropdown-item d-none" href="#" disabled><i class="text-success fas fa-power-off"></i> Power On Printer</button>
          <button id="printerPowerOff-${id}" title="Turn off your printer" class="dropdown-item d-none" href="#" disabled><i class="text-danger fas fa-power-off"></i> Power Off Printer</button>
          <h6 id="octoPrintPowerDivider" class="dropdown-header"><i class="fab fa-octopus-deploy" disabled></i> OctoPrint</h6>
          <button id="printerRestartOctoPrint-${id}" title="Restart OctoPrint Service" class="dropdown-item d-none" href="#"  disabled><i class="text-warning fas fa-redo"></i> Restart OctoPrint</button>
          <button id="printerRestartHost-${id}" title="Reboot OctoPrint Host" class="dropdown-item d-none" href="#" disabled><i class="text-warning fas fa-sync-alt"></i> Reboot Host</button>
          <button id="printerWakeHost-${id}" title="Wake up OctoPrint Host" class="dropdown-item d-none" href="#" disabled><i class="text-success fas fa-power-off"></i> Wake Host</button>
          <button id="printerShutdownHost-${id}" title="Shutdown OctoPrint Host" class="dropdown-item d-none" href="#" disabled><i class="text-danger fas fa-power-off"></i> Shutdown Host</button>

        </div>
      </div>
  `;
}

function printerQuickConnected(id) {
  let connectBtn = document.getElementById("printerQuickConnect-" + id);
  connectBtn.innerHTML = "<i class=\"fas fa-toggle-on\"></i>";
  connectBtn.classList.remove("btn-danger");
  connectBtn.classList.add("btn-success");
  connectBtn.title = "Quickly bring your printer online! Power -> Connect";
}
function printerQuickDisconnected(id) {
  let connectBtn = document.getElementById("printerQuickConnect-" + id);
  connectBtn.innerHTML = "<i class=\"fas fa-toggle-off\"></i>";
  connectBtn.classList.remove("btn-success");
  connectBtn.classList.add("btn-danger");
  connectBtn.title = "Quickly take your printer offline! Disconnect -> Power Off";
}

function groupInit(printers) {
  printers.forEach((printer) => {
    if (printer.group !== "") {
      const cleanGroup = encodeURIComponent(printer.group);
      const groupContainer = document.getElementById(
        `printerActionBtns-${cleanGroup}`
      );
      const skipElement = document.getElementById(
        `printerQuickConnect-${cleanGroup}`
      );
      if (!skipElement) {
        groupContainer.innerHTML = `
        ${returnActionBtnTemplate(`${cleanGroup}`)}
      `;
      }
      if (
        printer.currentConnection !== null &&
        printer.currentConnection.port !== null &&
        printer.printerState.colour.category !== "Offline" && printer.printerState.colour.category !== "Searching"
      ) {
        printerQuickConnected(cleanGroup);
      } else {
        printerQuickDisconnected(cleanGroup);
      }
      document.getElementById("printerQuickConnect-" + cleanGroup).disabled =
        printer.printerState.colour.category === "Offline";
    }
  });
  // PrinterPowerService.applyBtn(groupId);
  addGroupEventListeners(printers);
}

function addGroupEventListeners(printers) {
  //Group the prints via there respective groups
  const groupedPrinters = mapValues(groupBy(printers, "group"));
  for (const key in groupedPrinters) {
    if (groupedPrinters.hasOwnProperty(key)) {
      if (key !== "") {
        const currentGroupEncoded = encodeURIComponent(key);
        //Quick Connect
        document
          .getElementById(`printerQuickConnect-${currentGroupEncoded}`)
          .addEventListener("click", async (e) => {
            e.disabled = true;
            if (
              document
                .getElementById("printerQuickConnect-" + currentGroupEncoded)
                .classList.contains("btn-danger")
            ) {
              for (const printer of groupedPrinters[key]) {
                let data = {};
                if (typeof printer.connectionOptions !== "undefined") {
                  data = {
                    command: "connect",
                    port: printer.connectionOptions.portPreference,
                    baudrate: parseInt(
                      printer.connectionOptions.baudratePreference
                    ),
                    printerProfile:
                      printer.connectionOptions.printerProfilePreference,
                  };
                } else {
                  UI.createAlert(
                    "warning",
                    `${printer.printerName} has no preferences saved, defaulting to AUTO... OctoFarm has saved these connection preferences as default for you...`,
                    10000,
                    "Clicked"
                  );
                  data.command = "connect";
                  data.port = "AUTO";
                  data.baudrate = 0;
                  data.printerProfile = "_default";
                }
                let post = await OctoPrintClient.post(
                  printer,
                  "connection",
                  data
                );
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
              }
            } else {
              bootbox.confirm({
                message: "Are you sure you want to disconnect your printers?",
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
                    for (const printer of groupedPrinters[key]) {
                      let data = {
                        command: "disconnect",
                      };
                      let post = await OctoPrintClient.post(
                        printer,
                        "connection",
                        data
                      );
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
                    }
                  }
                },
              });
            }
          });

        //Re-Sync printer
        document
          .getElementById(`printerSyncButton-${currentGroupEncoded}`)
          .addEventListener("click", async (e) => {
            e.target.disabled = true;
            for (const printer of groupedPrinters[key]) {
              const data = {
                id: printer._id,
              };
              let post = await OctoFarmClient.post(
                "printers/reSyncSockets",
                data
              );
              if (post.msg.status !== "error") {
                UI.createAlert(
                  "success",
                  printer.printerName + ": " + post.msg.msg,
                  3000,
                  "clicked"
                );
              } else {
                UI.createAlert(
                  "error",
                  printer.printerName + ": " + post.msg.msg,
                  3000,
                  "clicked"
                );
              }
            }
            e.target.disabled = false;
          });
      }
    }
  }
}

function init(printer, element) {
  document.getElementById(element).innerHTML = `
    ${returnActionBtnTemplate(printer._id, printer.printerURL)}
  `;
  // PrinterPowerService.applyBtn(printer);
  checkQuickConnectState(printer);

  addEventListeners(printer);
}

function addEventListeners(printer) {
  //Quick Connect
  document
    .getElementById(`printerQuickConnect-${printer._id}`)
    .addEventListener("click", async (e) => {
      e.disabled = true;
      if (
        document
          .getElementById("printerQuickConnect-" + printer._id)
          .classList.contains("btn-danger")
      ) {
        let data = {};
        if (typeof printer.connectionOptions !== "undefined") {
          data = {
            command: "connect",
            port: printer.connectionOptions.portPreference,
            baudrate: parseInt(printer.connectionOptions.baudratePreference),
            printerProfile: printer.connectionOptions.printerProfilePreference,
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
        }
        let post = await OctoPrintClient.post(printer, "connection", data);
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
        bootbox.confirm({
          message: "Are you sure you want to disconnect your printer?",
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
              let data = {
                command: "disconnect",
              };
              let post = await OctoPrintClient.post(
                printer,
                "connection",
                data
              );
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
            }
          },
        });
      }
    });
  //Re-Sync printer
  document
    .getElementById(`printerSyncButton-${printer._id}`)
    .addEventListener("click", async (e) => {
      e.target.disabled = true;
      const data = {
        id: printer._id,
      };
      let post = await OctoFarmClient.post("printers/reSyncSockets", data);
      if (post.status !== "error") {
        UI.createAlert("success", post.msg, 3000, "clicked");
      } else {
        UI.createAlert("error", post.msg, 3000, "clicked");
      }
      e.target.disabled = false;
    });
  // Emergency Stop
  document.getElementById(`printerEmergency-${printer._id}`).addEventListener("click", async (e) => {
    e.target.disabled = true;
    bootbox.confirm("You are about to send \"M112\" to your printer, this will cause an emergency stop! Are you sure?", async function(result){
      if(result){
        const {status, message} = await printerEmergencyStop(printer);
        UI.createAlert(status, message, 3000, "Clicked")
        e.target.disabled = false;
      }
    });
  })
}

function checkQuickConnectState(printer) {
  const isOnline = printerIsOnline(printer);
  const isDisconnectedOrError = printerIsDisconnectedOrError(printer);
  const isPrinting = printerIsPrinting(printer);
  document.getElementById("printerSyncButton-"+printer._id).disabled = !isOnline;
  document.getElementById("printerQuickConnect-" + printer._id).disabled = !isOnline;
  document.getElementById("printerManageDropDown-" + printer._id).disabled = !isOnline;
  document.getElementById("printerHome-"+printer._id).disabled = isPrinting || isDisconnectedOrError;
  document.getElementById("printerEmergency-"+printer._id).disabled = !isPrinting;
  if (typeof printer.connectionOptions !== "undefined") {
    if (
      printer.connectionOptions.portPreference === null ||
      printer.connectionOptions.baudratePreference === null ||
      printer.connectionOptions.printerProfilePreference === null
    ) {
      document.getElementById(
        "printerQuickConnect-" + printer._id
      ).disabled = true;
    }
  } else {
    document.getElementById(
      "printerQuickConnect-" + printer._id
    ).disabled = true;
  }

  if(!isOnline){
    printerQuickDisconnected(printer._id);
    return;
  }

  if(printerIsDisconnectedOrError(printer)) {
    printerQuickDisconnected(printer._id);
    return;
  }

  printerQuickConnected(printer._id);
}

function checkGroupQuickConnectState(printers) {
  const groupedPrinters = mapValues(groupBy(printers, "group"));
  for (const key in groupedPrinters) {
    if (groupedPrinters.hasOwnProperty(key)) {
      if (key !== "") {
        const currentGroupEncoded = encodeURIComponent(key);
        const offlinePrinters = groupedPrinters[key].filter(
          (obj) => obj.printerState.colour.category === "Offline"
        ).length;
        if (offlinePrinters > 0) {
          document.getElementById(
            "printerQuickConnect-" + currentGroupEncoded
          ).disabled = true;
        }
        const noConnectionOptions = groupedPrinters[key].filter(
          (obj) =>
            obj?.connectionOptions?.portPreference === null ||
            obj?.connectionOptions?.baudratePreference === null ||
            obj?.connectionOptions?.printerProfilePreference === null
        ).length;
        if (noConnectionOptions > 0) {
          document.getElementById(
            "printerQuickConnect-" + currentGroupEncoded
          ).disabled = true;
        }
        const disconnectedOrError = groupedPrinters[key].filter(
          (obj) =>
            (obj.printerState.colour.category !== "Offline" &&
              obj.printerState.colour.category === "Disconnected") ||
            obj.printerState.colour.category === "Error!"
        ).length;
        const offlineDisconnectedAndError = groupedPrinters[key].filter(
          (obj) =>
            obj.printerState.colour.category !== "Offline" &&
            obj.printerState.colour.category !== "Disconnected" &&
            obj.printerState.colour.category !== "Error!"
        ).length;
        if (disconnectedOrError > 0) {
          printerQuickDisconnected(currentGroupEncoded);
        } else if (offlineDisconnectedAndError > 0) {
          printerQuickConnected(currentGroupEncoded);
        } else {
          printerQuickDisconnected(currentGroupEncoded);
        }
      }
    }
  }
}

export {
  init,
  groupInit,
  printerQuickConnected,
  printerQuickDisconnected,
  checkQuickConnectState,
  checkGroupQuickConnectState,
};
