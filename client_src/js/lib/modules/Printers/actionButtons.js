import PowerButton from "../powerButton.js";
import UI from "../../functions/ui";
import OctoPrintClient from "../../octoprint";
import OctoFarmClient from "../../../services/octofarm-client.service";

function returnActionBtnTemplate(id) {
  return `
      <button  
         title="Quickly connect/disconnect your printer"
         id="printerQuickConnect-${id}"
         type="button"
         class="tag btn btn-danger btn-sm"
         >
            <i class="fas fa-toggle-off"></i>
      </button>
      <button  
         title="Re-Sync your printers connection"
         id="printerSyncButton-${id}"
         type="button"
         class="tag btn btn-success btn-sm"
      >
          <i class="fas fa-sync"></i>
      </button> 
      <div class="btn-group">
        <button title="Toggle your printers power"
              id="printerPowerToggle-${id}"
              class="btn btn-outline-danger btn-sm d-none" type="button"  data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" disabled>
          <i id="printerStatus-${id}" class="fas fa-power-off" style="color: black;"></i>
        </button>
        <button type="button" class="btn btn-danger dropdown-toggle dropdown-toggle-split btn-sm d-none" id="dropdownMenuReference" data-toggle="dropdown" aria-expanded="false" data-reference="parent">
          <span class="sr-only">Toggle Dropdown</span>
        </button>
        <div class="dropdown-menu" aria-labelledby="dropdownMenuReference">
            <a id="printerPowerOn-${id}" title="Turn on your printer" class="dropdown-item d-none" href="#"><i class="text-success fas fa-power-off"></i> Power On Printer</a>
            <a id="printerPowerOff-${id}" title="Turn off your printer" class="dropdown-item d-none" href="#"><i class="text-danger fas fa-power-off"></i> Power Off Printer</a>
            <div id="printerDropDownMaker-${id}" class="dropdown-divider d-none"></div>
            <a id="printerRestartOctoPrint-${id}" title="Restart OctoPrint Service" class="dropdown-item d-none" href="#"><i class="text-warning fas fa-redo"></i> Restart OctoPrint</a>
            <a id="printerRestartHost-${id}" title="Reboot OctoPrint Host" class="dropdown-item d-none" href="#"><i class="text-warning fas fa-sync-alt"></i> Reboot Host</a>
            <a id="printerWakeHost-${id}" title="Wake up OctoPrint Host" class="dropdown-item d-none" href="#"><i class="text-success fas fa-power-off"></i> Wake Host</a>
            <a id="printerShutdownHost-${id}" title="Shutdown OctoPrint Host" class="dropdown-item d-none" href="#"><i class="text-danger fas fa-power-off"></i> Shutdown Host</a>

        </div>
      </div>   
  `;
}

export function printerWebBtn(id, webURL) {
  return `
            <a title="Open OctoPrint"
               id="printerWeb-${id}"
               type="button"
               class="tag btn btn-info btn-sm"
               target="_blank"
               href="${webURL}" role="button"><i class="fas fa-globe-europe"></i></a>
    `;
}

function printerQuickConnected(id) {
  let connectBtn = document.getElementById("printerQuickConnect-" + id);
  connectBtn.innerHTML = '<i class="fas fa-toggle-on"></i>';
  connectBtn.classList.remove("btn-danger");
  connectBtn.classList.add("btn-success");
  connectBtn.title = "Press to connect your printer!";
}
function printerQuickDisconnected(id) {
  let connectBtn = document.getElementById("printerQuickConnect-" + id);
  connectBtn.innerHTML = '<i class="fas fa-toggle-off"></i>';
  connectBtn.classList.remove("btn-success");
  connectBtn.classList.add("btn-danger");
  connectBtn.title = "Press to connect your printer!";
}

function init(printer, element) {
  document.getElementById(element).innerHTML = `
    ${printerWebBtn(printer._id, printer.printerURL)}
    ${returnActionBtnTemplate(printer._id)}
  `;
  PowerButton.applyBtn(printer);
  if (
    printer.currentConnection != null &&
    printer.currentConnection.port != null &&
    printer.printerState.colour.category != "Offline"
  ) {
    printerQuickConnected(printer._id);
  } else {
    printerQuickDisconnected(printer._id);
  }
  document.getElementById("printerQuickConnect-" + printer._id).disabled =
    printer.printerState.colour.category === "Offline";

  document.getElementById("printerWeb-" + printer._id).href = printer.printerURL;

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
            printerProfile: printer.connectionOptions.printerProfilePreference
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
              className: "btn-success"
            },
            cancel: {
              label: "No",
              className: "btn-danger"
            }
          },
          callback: async function (result) {
            if (result) {
              let data = {
                command: "disconnect"
              };
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
            }
          }
        });
      }
    });
  //Re-Sync printer
  document
    .getElementById(`printerSyncButton-${printer._id}`)
    .addEventListener("click", async (e) => {
      e.target.innerHTML = "<i class='fas fa-sync fa-spin'></i>";
      e.target.disabled = true;
      const data = {
        id: printer._id
      };
      let post = await OctoFarmClient.post("printers/reScanOcto", data);
      if (post.msg.status !== "error") {
        UI.createAlert("success", post.msg.msg, 3000, "clicked");
      } else {
        UI.createAlert("error", post.msg.msg, 3000, "clicked");
      }

      e.target.innerHTML = "<i class='fas fa-sync'></i>";
      e.target.disabled = false;
    });
}

function checkQuickConnectState(printer) {
  document.getElementById("printerQuickConnect-" + printer._id).disabled =
    printer.printerState.colour.category === "Offline";
  if (typeof printer.connectionOptions !== "undefined") {
    if (
      printer.connectionOptions.portPreference === null ||
      printer.connectionOptions.baudratePreference === null ||
      printer.connectionOptions.printerProfilePreference === null
    ) {
      document.getElementById("printerQuickConnect-" + printer._id).disabled = true;
    }
  } else {
    document.getElementById("printerQuickConnect-" + printer._id).disabled = true;
  }

  if (
    (printer.printerState.colour.category !== "Offline" &&
      printer.printerState.colour.category === "Disconnected") ||
    printer.printerState.colour.category === "Error!"
  ) {
    printerQuickDisconnected(printer._id);
  } else if (
    printer.printerState.colour.category !== "Offline" &&
    printer.printerState.colour.category !== "Disconnected" &&
    !printer.printerState.colour.category !== "Error!"
  ) {
    printerQuickConnected(printer._id);
  } else {
    printerQuickDisconnected(printer._id);
  }
}

export { init, printerQuickConnected, printerQuickDisconnected, checkQuickConnectState };
