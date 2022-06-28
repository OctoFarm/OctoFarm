import PrinterPowerService from "./printer-power.service.js";
import UI from "../utils/ui";
import OctoFarmClient from "./octofarm-client.service";
import {
  printerIsDisconnectedOrError,
  printerIsIdle,
  printerIsOnline,
  printerIsPrinting,
} from "../utils/octofarm.utils";
import {
  printerEmergencyStop,
  printerHomeAllAxis,
  printerTurnOffHeaters,
} from "./octoprint/octoprint-printer-commands.actions";
import {connectPrinterSequence, disconnectPrinterSequenceNoConfirm} from "./octoprint/octoprint-helpers.service";

function returnActionBtnTemplate(id, webURL, disableWeb = false) {
  let disabledWebButton;
  if(disableWeb){
    disabledWebButton = "d-none"
  }
  return `
      <div class="btn-group dropright">
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
               class="tag btn btn-info btn-sm ${disabledWebButton}"
               target="_blank"
               href="${webURL}" role="button"><i class="fas fa-globe-europe "></i> </a>   
        <button id="printerManageDropDown-${id}" type="button" class="btn btn-primary btn-sm dropdown-toggle dropdown-toggle-split" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
         <i class="fas fa-bars"></i>
        </button>
        <div class="dropdown-menu">
          <h6 id="printerActionsHeader-${id}" class="dropdown-header"><i class="fas fa-print"></i>Printer Commands</h6>
          <button
             title="Homes your printers X,Y and Z"
             id="printerHome-${id}"
             type="button"
             class="dropdown-item"
          >
            <i class="fa-solid fa-house-flag text-success"></i> Home
          </button> 
          <button
             title="Sets all heater targets to 0"
             id="printerHeatersOff-${id}"
             type="button"
             class="dropdown-item"
          >
            <i class="fa-solid fa-temperature-arrow-down text-info"></i> Turn Off Heaters
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
          <button id="printerPowerOn-${id}" title="Turn on your printer" class="dropdown-item d-none" href="#" disabled><i class="text-success fas fa-power-off"></i> Power On Printer</button>
          <button id="printerPowerOff-${id}" title="Turn off your printer" class="dropdown-item d-none" href="#" disabled><i class="text-danger fas fa-power-off"></i> Power Off Printer</button>
          <hr class="d-none">
          <h6 class="dropdown-header d-none"><i class="fa-solid fa-compress"></i> Actions</h6>
          <button  
           title="Runs a pre-configured gcode sequence so you can detect which printer this is."
           id="printerFindMe-${id}"
           type="button"
           class="dropdown-item d-none"
            disabled
        >
            <i class="fas fa-search text-info"></i> Find Printer!
          </button> 
          <hr>
          <h6 id="octoPrintHeader-${id}" class="dropdown-header d-none"><i class="fab fa-octopus-deploy"></i> OctoPrint</h6>
          <button
             title="Terminate and reconnect OctoPrints Socket connection."
             id="printerSyncButton-${id}"
             type="button"
             class="dropdown-item"
          >
              <i class="fas fa-sync text-warning"></i> Re-Connect Socket
          </button>   
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
  connectBtn.title = "Quickly take your printer offline! Disconnect -> Power Off";
}
function printerQuickDisconnected(id) {
  let connectBtn = document.getElementById("printerQuickConnect-" + id);
  connectBtn.innerHTML = "<i class=\"fas fa-toggle-off\"></i>";
  connectBtn.classList.remove("btn-success");
  connectBtn.classList.add("btn-danger");
  connectBtn.title ="Quickly bring your printer online! Power -> Connect";
    ;
}

function groupInit(printers) {
  const uniqueGroupList = [
    ...new Set(printers.map((printer) => printer.group)),
  ];
  uniqueGroupList.forEach((group) => {
    const cleanGroup = encodeURIComponent(group);
    const skipElement = document.getElementById(
        `printerQuickConnect-${cleanGroup}`
    );
    const groupContainer = document.getElementById(
        `printerActionBtns-${cleanGroup}`
    );
    if (!skipElement) {
      groupContainer.innerHTML = `
        ${returnActionBtnTemplate(`${cleanGroup}`, "", true)}
      `;
    }
    const filteredGroupPrinterList = printers.filter((printer) => {
      if (encodeURIComponent(printer.group) === cleanGroup){
        return printer;
      }
    });

    checkGroupQuickConnectState(filteredGroupPrinterList, cleanGroup);
    addGroupEventListeners(filteredGroupPrinterList, cleanGroup);
  })
}

function addGroupEventListeners(printers, group) {
  //Quick Connect
  document
    .getElementById(`printerQuickConnect-${group}`)
    .addEventListener("click", async (e) => {
      e.disabled = true;
      if (
        document
          .getElementById("printerQuickConnect-" + group)
          .classList.contains("btn-danger")
      ) {
        for (const printer of printers) {
          const status = await connectPrinterSequence(printer);
          if (typeof status !== "undefined") {
            if (status === 204) {
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
              for (const printer of printers) {
                const status = await disconnectPrinterSequenceNoConfirm(printer);
                if (typeof status !== "undefined") {
                  if (status === 204) {
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
    .getElementById(`printerSyncButton-${group}`)
    .addEventListener("click", async (e) => {
      e.target.disabled = true;
      for (const printer of printers) {
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
            printer.printerName + ": " + post.msg,
            3000,
            "clicked"
          );
        } else {
          UI.createAlert(
            "error",
            printer.printerName + ": " + post.msg,
            3000,
            "clicked"
          );
        }
      }
      e.target.disabled = false;
    });

  // Emergency Stop
  document
      .getElementById(`printerEmergency-${group}`)
      .addEventListener("click", async (e) => {
        e.target.disabled = true;
        bootbox.confirm(
            "You are about to send \"M112\" to your printers, this will cause an emergency stop! Are you sure?",
            async function (result) {
              if (result) {
                for (const printer of printers){
                  const { status, message } = await printerEmergencyStop(printer);
                  UI.createAlert(status, message, 3000, "Clicked");
                }
                e.target.disabled = false;
              }
            }
        );
      });
  document
      .getElementById(`printerHome-${group}`)
      .addEventListener("click", async (e) => {
        e.target.disabled = true;
        for (const printer of printers){
          const { status, message } = await printerHomeAllAxis(printer);
          UI.createAlert(status, message, 3000, "Clicked");
        }
        e.target.disabled = false;
      });

  document
      .getElementById(`printerHeatersOff-${group}`)
      .addEventListener("click", async (e) => {
        e.target.disabled = true;
        for (const printer of printers){
          const { status, message } = await printerTurnOffHeaters(printer);
          UI.createAlert(status, message, 3000, "Clicked");
        }
        e.target.disabled = false;
      });

}

function init(printer, element) {
  document.getElementById(element).innerHTML = `
    ${returnActionBtnTemplate(printer._id, printer.printerURL)}
  `;
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
        // Connect Printer Sequence
        const status = await connectPrinterSequence(printer);
        if (typeof status !== "undefined") {
          if (status === 204) {
            UI.createAlert(
                "success",
                `${printer.printerName}: Brought online`,
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
      }else{
        // Disconnect Printer Sequence
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
            if(result){
              const status = await disconnectPrinterSequenceNoConfirm(printer);
              if (!!status) {
                if (status === 204) {
                  UI.createAlert(
                      "success",
                      `${printer.printerName}: Disconnected!`,
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
  document
    .getElementById(`printerEmergency-${printer._id}`)
    .addEventListener("click", async (e) => {
      e.target.disabled = true;
      bootbox.confirm(
        "You are about to send \"M112\" to your printer, this will cause an emergency stop! Are you sure?",
        async function (result) {
          if (result) {
            const { status, message } = await printerEmergencyStop(printer);
            UI.createAlert(status, message, 3000, "Clicked");
            e.target.disabled = false;
          }
        }
      );
    });
  document
    .getElementById(`printerHome-${printer._id}`)
    .addEventListener("click", async (e) => {
      e.target.disabled = true;
      const { status, message } = await printerHomeAllAxis(printer);
      UI.createAlert(status, message, 3000, "Clicked");
      e.target.disabled = false;
    });

  document
    .getElementById(`printerHeatersOff-${printer._id}`)
    .addEventListener("click", async (e) => {
      e.target.disabled = true;
      const { status, message } = await printerTurnOffHeaters(printer);
      UI.createAlert(status, message, 3000, "Clicked");
      e.target.disabled = false;
    });

  PrinterPowerService.setupEventListeners(printer);
}

function checkQuickConnectState(printer) {
  const isOnline = printerIsOnline(printer);
  const isPrinting = printerIsPrinting(printer);

  //printerActionsHeader
  document.getElementById("printerSyncButton-" + printer._id).disabled =
    !isOnline;
  document.getElementById("printerQuickConnect-" + printer._id).disabled =
    !isOnline;
  document.getElementById("printerManageDropDown-" + printer._id).disabled =
    !isOnline;
  document.getElementById("printerHome-" + printer._id).disabled =
    !printerIsIdle(printer);
  document.getElementById("printerEmergency-" + printer._id).disabled =
    !isPrinting;
  document.getElementById("printerHeatersOff-" + printer._id).disabled =
    !printerIsIdle(printer);

  PrinterPowerService.revealPowerButtons(printer).catch((e) => {
    console.error(e);
  });

  if (typeof printer.connectionOptions !== "undefined") {
    if (
      printer.connectionOptions?.portPreference === null ||
      printer.connectionOptions?.baudratePreference === null ||
      printer.connectionOptions?.printerProfilePreference === null
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

  if (!isOnline) {
    printerQuickDisconnected(printer._id);
    return;
  }

  if (printerIsDisconnectedOrError(printer)) {
    printerQuickDisconnected(printer._id);
    return;
  }

  printerQuickConnected(printer._id);
}

function checkGroupQuickConnectState(printers, group) {
  const printersAllOnline = printers.filter(
      (printer) => printerIsOnline(printer)
  ).length;
  const printersAllIdle = printers.filter(
      (printer) => printerIsIdle(printer)
  ).length;
  const printersAllPrinting = printers.filter(
      (printer) => printerIsPrinting(printer)
  ).length;
  const printersAllDisconnectedOrError = printers.filter(
      (printer) => printerIsDisconnectedOrError(printer)
  ).length;
  document.getElementById("printerSyncButton-" + group).disabled =
      !printersAllOnline > 0;
  document.getElementById("printerQuickConnect-" + group).disabled =
      !printersAllOnline > 0;
  document.getElementById("printerManageDropDown-" + group).disabled =
      !printersAllOnline > 0;
  document.getElementById("printerHome-" + group).disabled =
      !printersAllIdle;
  document.getElementById("printerEmergency-" + group).disabled =
      !printersAllPrinting;
  document.getElementById("printerHeatersOff-" + group).disabled =
      !printersAllIdle;
  const noConnectionOptions = printers.filter(
    (obj) =>
      obj?.connectionOptions?.portPreference === null ||
      obj?.connectionOptions?.baudratePreference === null ||
      obj?.connectionOptions?.printerProfilePreference === null
  ).length;
  if (noConnectionOptions > 0) {
    document.getElementById(
      "printerQuickConnect-" + group
    ).disabled = true;
  }
  if (printersAllDisconnectedOrError > 0) {
    printerQuickDisconnected(group);
  } else if (printersAllDisconnectedOrError === 0) {
    printerQuickConnected(group);
  } else {
    printerQuickDisconnected(group);
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
