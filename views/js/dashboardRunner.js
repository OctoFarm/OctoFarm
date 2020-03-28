import OctoPrintClient from "./lib/octoprint.js";
import OctoFarmClient from "./lib/octofarm.js";
import UI from "./lib/functions/ui.js";
import Calc from "./lib/functions/calc.js";
import currentOperations from "./lib/modules/currentOperations.js";
import PrinterManager from "./lib/modules/printerManager.js";

let printerInfo = "";
//Connect to servers socket..webSocket
let url = window.location.hostname;
let port = window.location.port;
if (port != "") {
  port = ":" + port;
}

var source = new EventSource("/sse/printerInfo/");
source.onmessage = function(e) {
  if (e.data != null) {
    let res = JSON.parse(e.data);

    if (
      document.getElementById("printerManagerModal").classList.contains("show")
    ) {
      PrinterManager.init(res.printerInfo);
    } else {
      currentOperations(res.currentOperations, res.currentOperationsCount);
      dashUpdate.systemInformation(res.systemInfo);
      dashUpdate.printers(res.printerInfo);
      printerInfo = res.printerInfo;
      dashUpdate.farmInformation(res.farmInfo);
      dashUpdate.farmStatistics(res.octofarmStatistics);
    }
  }
};
source.onerror = function(e) {
  UI.createAlert(
    "error",
    "Communication with the server has been suddenly lost, we will automatically refresh in 10 seconds..."
  );
  setTimeout(function() {
    location.reload();
  }, 10000);
};
source.onclose = function(e) {
  UI.createAlert(
    "error",
    "Communication with the server has been suddenly lost, we will automatically refresh in 10 seconds..."
  );
  setTimeout(function() {
    location.reload();
  }, 10000);
};
//Initial listeners
document.getElementById("connectAllBtn").addEventListener("click", e => {
  dashActions.connectAll();
});
document.getElementById("disconnectAllBtn").addEventListener("click", e => {
  dashActions.disconnectAll();
});
//Setup page listeners...
let printerCard = document.querySelectorAll("[id^='printerButton-']");
printerCard.forEach(card => {
  let ca = card.id.split("-");
  card.addEventListener("click", e => {
    PrinterManager.updateIndex(parseInt(ca[1]));
    PrinterManager.init(printerInfo);
  });
});
let printerReSync = document.querySelectorAll("[id^='printerSyncButton-']");
printerReSync.forEach(card => {
  let ca = card.id.split("-");
  card.addEventListener("click", async e => {
    e.target.innerHTML = "<i class='fas fa-sync fa-spin'></i>";
    e.target.disabled = true;
    let data = {
      id: parseInt(ca[1])
    };
    let post = await OctoFarmClient.post("printers/reScanOcto", data);
    post = await post.json();
    e.target.innerHTML = "<i class='fas fa-sync'></i>";
    e.target.disabled = false;
  });
});
class dashActions {
  static async connectionAction(action) {
    $("#connectionModal").modal("hide");
    let selected = await document.querySelectorAll("[id^='printerSel-']");
    document.getElementById("connectionAction").remove();
    if (action === "connect") {
      for (let i = 0; i < selected.length; i++) {
        if (selected[i].checked === true) {
          let index = selected[i].id.replace("printerSel-", "");
          let printerName = "";
          if (typeof printerInfo[index].settingsAppearance != "undefined") {
            printerName = printerInfo[index].settingsAppearance.name;
          }
          let preferBaud = printerInfo[index].options.baudratePreference;
          let preferPort = printerInfo[index].options.portPreference;
          let preferProfile =
            printerInfo[index].options.printerProfilePreference;
          if (preferBaud === null) {
            preferBaud = "115200";
          }
          if (preferPort === null) {
            preferPort = printerInfo[index].options.ports[0];
          }
          if (preferProfile === null) {
            preferProfile = printerInfo[index].options.printerProfiles[0];
          }

          let opts = {
            command: "connect",
            port: preferPort,
            baudrate: preferBaud,
            printerProfile: preferProfile
          };
          let post = await OctoPrintClient.post(
            printerInfo[index],
            "connection",
            opts
          );
          if (post.status === 204) {
            UI.createAlert(
              "success",
              `Connected: ${printerInfo[index].index}. ${printerName}`,
              1000,
              "clicked"
            );
          } else {
            UI.createAlert(
              "error",
              `Couldn't Connect ${printerInfo[index].index}with Port: ${preferPort}, Baud: ${preferBaud}, Profile: ${preferProfile}`,
              1000,
              "clicked"
            );
          }
        }
      }
    } else if (action === "disconnect") {
      for (let i = 0; i < selected.length; i++) {
        if (selected[i].checked === true) {
          let index = selected[i].id.replace("printerSel-", "");
          let printerName = "";
          if (typeof printerInfo[index].settingsAppearance != "undefined") {
            printerName = printerInfo[index].settingsAppearance.name;
          }
          let opts = {
            command: "disconnect"
          };
          let post = await OctoPrintClient.post(
            printerInfo[index],
            "connection",
            opts
          );
          if (post.status === 204) {
            UI.createAlert(
              "success",
              `Disconnected: ${printerInfo[index].index}. ${printerName}`,
              1000,
              "clicked"
            );
          } else {
            UI.createAlert(
              "error",
              `Couldn't Disconnect: ${printerInfo[index].index}. ${printerName}`,
              1000,
              "clicked"
            );
          }
        }
      }
    }
  }
  static async connectAll() {
    //Create bootbox confirmation message
    document.getElementById("connectionActionBtn").insertAdjacentHTML(
      "beforeBegin",
      `
    <button id="connectionAction" type="button" class="btn btn-success" data-dismiss="modal">
      Connect All
    </button>
    `
    );
    let message = document.getElementById("printerConnection");

    message.innerHTML =
      "You must have at least 1 printer in the Closed state to use this function...";

    let printersList = "";
    printerInfo.forEach(printer => {
      if (printer.state === "Closed") {
        let printerName = "";
        if (typeof printer.settingsAppearance != "undefined") {
          printerName = printer.settingsAppearance.name;
        }
        let print = `
          <div style="display:inline-block;">
          <form class="was-validated">
          <div class="custom-control custom-checkbox mb-3">
            <input type="checkbox" class="custom-control-input" id="printerSel-${printer.index}" required>
            <label class="custom-control-label" for="printerSel-${printer.index}">${printer.index}. ${printerName}</label>
            <div class="valid-feedback">Attempt to connect</div>
            <div class="invalid-feedback">DO NOT connect</div>
          </div>
        </form></div>
          `;
        printersList += print;
        message.innerHTML = printersList;
      }
    });
    let checkBoxes = document.querySelectorAll("[id^='printerSel-']");
    checkBoxes.forEach(box => {
      box.checked = true;
    });
    document.getElementById("connectionAction").addEventListener("click", e => {
      dashActions.connectionAction("connect");
    });
  }
  static async disconnectAll() {
    //Create bootbox confirmation message
    document.getElementById("connectionActionBtn").insertAdjacentHTML(
      "beforeBegin",
      `
        <button id="connectionAction" type="button" class="btn btn-success" data-dismiss="modal">
          Disconnect All
        </button>
        `
    );
    let message = document.getElementById("printerConnection");
    message.innerHTML =
      "You must have at least 1 printer in the Idle category to use this function...";
    let printersList = "";
    printerInfo.forEach(printer => {
      if (
        printer.stateColour.category === "Idle" ||
        printer.stateColour.category === "Complete"
      ) {
        let printerName = "";
        if (typeof printer.settingsAppearance != "undefined") {
          printerName = printer.settingsAppearance.name;
        }
        let print = `
              <div style="display:inline-block;">
              <form class="was-validated">
              <div class="custom-control custom-checkbox mb-3">
                <input type="checkbox" class="custom-control-input" id="printerSel-${printer.index}" required>
                <label class="custom-control-label" for="printerSel-${printer.index}">${printer.index}. ${printerName}</label>
                <div class="valid-feedback">Attempt to connect</div>
                <div class="invalid-feedback">DO NOT connect</div>
              </div>
            </form></div>
              `;
        printersList += print;
        message.innerHTML = printersList;
      }
    });

    let checkBoxes = document.querySelectorAll("[id^='printerSel-']");
    checkBoxes.forEach(box => {
      box.checked = true;
    });
    document.getElementById("connectionAction").addEventListener("click", e => {
      dashActions.connectionAction("disconnect");
    });
  }
}

class dashUpdate {
  static systemInformation(systemInfo) {
    let cpuLoad = Math.round(systemInfo.cpuLoad.currentload_system * 10) / 10;
    let octoLoad = Math.round(systemInfo.sysProcess.pcpu * 10) / 10;
    let userLoad = Math.round(systemInfo.cpuLoad.currentload_user * 10) / 10;
    let remain = Math.round(cpuLoad + octoLoad + userLoad * 10) / 10;
    document.getElementById("systemUpdate").innerHTML = Calc.generateTime(
      systemInfo.sysUptime.uptime
    );
    document.getElementById("systemCPU").innerHTML = cpuLoad + "%";
    document.getElementById("octofarmCPU").innerHTML = octoLoad + "%";
    document.getElementById("userCPU").innerHTML = userLoad + "%";
    document.getElementById("systemCPUProg").style.width = cpuLoad + "%";
    document.getElementById("octofarmCPUProg").style.width = octoLoad + "%";
    document.getElementById("userCPUProg").style.width = userLoad + "%";
    document.getElementById("remainingCPUProg").style.width =
      100 - remain + "%";
    let otherRAM = Calc.bytes(
      systemInfo.memoryInfo.total - systemInfo.memoryInfo.free
    );
    let octoRAM = Calc.bytes(
      (systemInfo.memoryInfo.total / 100) * systemInfo.sysProcess.pmem
    );
    let freeRAM = Calc.bytes(systemInfo.memoryInfo.free);
    let otherPer =
      Math.round(
        (systemInfo.memoryInfo.used / systemInfo.memoryInfo.total) * 100 * 10
      ) / 10;
    let octoPer = Math.round(systemInfo.sysProcess.pmem * 10) / 10;
    let freePer =
      100 -
      Math.round(
        (systemInfo.memoryInfo.used / systemInfo.memoryInfo.total) * 100 * 10
      ) /
        10;
    document.getElementById("otherRam").innerHTML = otherRAM;
    document.getElementById("octoRam").innerHTML = octoRAM;
    document.getElementById("freeRam").innerHTML = freeRAM;
    document.getElementById("otherRamProg").style.width = otherPer + "%";
    document.getElementById("octoRamProg").style.width = octoPer + "%";
    document.getElementById("freeRamProg").style.width = freePer + "%";
  }
  static printers(printers) {
    printers.forEach((printer, index) => {
      let printerName = "";
      if (typeof printer.stateColour != "undefined") {
        if (typeof printer.settingsAppearance != "undefined") {
          printerName = printer.settingsAppearance.name;
        }
        if (document.getElementById("printerCard-" + printer.index)) {
          document.getElementById("printerBadge-" + printer.index).innerHTML =
            printer.state;
          document.getElementById(
            "printerBadge-" + printer.index
          ).className = `badge badge-${printer.stateColour.name} badge-pill`;
          document.getElementById(
            "printerName-" + printer.index
          ).innerHTML = `<i class="fas fa-print"></i> ${printer.index}. ${printerName}`;
          if (printer.state != "Offline") {
            document.getElementById(
              "printerButton-" + printer.index
            ).disabled = false;
            document.getElementById(
              "printerSyncButton-" + printer.index
            ).disabled = true;
          } else {
            document.getElementById(
              "printerButton-" + printer.index
            ).disabled = true;
            document.getElementById(
              "printerSyncButton-" + printer.index
            ).disabled = false;
          }
        } else {
          document.getElementById("printerList").insertAdjacentHTML(
            "beforeend",
            `
              <div class="list-group" id="printerCard-${printer.index}">
              <li class="list-group-item list-group-item-action flex-column align-items-start">
                <div class="d-flex w-100 justify-content-between text-white">
                  <h5 id="printerName-${printer.index}" class="mb-1 ml-1"> <i class="fas fa-print"></i>  ${printer.index}. ${printerName}</span
                    ></h5>
                  <small><span id="printerBadge-${printer.index}"
                    class="badge badge-${printer.stateColour.name} badge-pill"
                    >${printer.state}
                    </small></span>
                </div>
                <button  id="printerButton-<%= printer.index %>"
                  type="button"
                  class="btn btn-secondary btn-sm float-right"
                  data-toggle="modal"
                  data-target="#printerManagerModal"
                >
                  <i class="fas fa-cog"></i>
                </button>
                <button  id="printerSyncButton-<%= printer.index %>"
                type="button"
                class="btn btn-secondary btn-sm float-right mr-1"
              disabled>
              <i class="fas fa-sync"></i>
              </button>
                <small class="pt-2 float-left ml-1 text-white"><i class="fas fa-network-wired"></i> ${printer.ip}:${printer.port}</small>
              </li>
            </div>
          `
          );
        }
        document.getElementById(
          "printerCard-" + printer.index
        ).style.order = index;
      }
    });
  }

  static farmInformation(farmInfo) {
    document.getElementById("avgEstimatedTime").innerHTML = Calc.generateTime(
      farmInfo.avgEstimateTime
    );
    document.getElementById("avgRemaingingTime").innerHTML = Calc.generateTime(
      farmInfo.avgRemainingTime
    );
    document.getElementById("avgElapsedTime").innerHTML = Calc.generateTime(
      farmInfo.avgElapsedTime
    );
    document.getElementById("cumEstimatedTime").innerHTML = Calc.generateTime(
      farmInfo.totalEstimateTime
    );
    document.getElementById("cumRemainingTime").innerHTML = Calc.generateTime(
      farmInfo.totalRemainingTime
    );
    document.getElementById("cumElapsedTime").innerHTML = Calc.generateTime(
      farmInfo.totalElapsedTime
    );
    document.getElementById(
      "cumTool0Heat"
    ).innerHTML = `<i class="far fa-circle"></i> ${Math.round(
      farmInfo.activeToolA * 100
    ) / 100}°C <i class="fas fa-bullseye"></i> ${Math.round(
      farmInfo.activeToolT * 100
    ) / 100}°C`;
    document.getElementById(
      "cumBedHeat"
    ).innerHTML = `<i class="far fa-circle"></i> ${Math.round(
      farmInfo.activeBedA * 100
    ) / 100}°C <i class="fas fa-bullseye"></i> ${Math.round(
      farmInfo.activeBedT * 100
    ) / 100}°C`;
    document.getElementById(
      "cumPrintHeat"
    ).innerHTML = `<i class="far fa-circle"></i> ${Math.round(
      (farmInfo.activeToolA + farmInfo.activeBedA) * 100
    ) / 100}°C <i class="fas fa-bullseye"></i> ${Math.round(
      (farmInfo.activeToolT + farmInfo.activeBedT) * 100
    ) / 100}°C`;
  }
  static farmStatistics(octofarmStatistics) {
    document.getElementById("activeHours").innerHTML =
      "<i class='fas fa-square text-success'></i> <b>Active: </b>" +
      Calc.generateTime(octofarmStatistics.activeHours);
    document.getElementById("idleHours").innerHTML =
      "<i class='fas fa-square text-danger'></i> <b>Idle: </b>" +
      Calc.generateTime(octofarmStatistics.idleHours);
    let activeProgress = document.getElementById("activeProgress");
    activeProgress.innerHTML = octofarmStatistics.activePercent + "%";
    activeProgress.style.width = octofarmStatistics.activePercent + "%";

    let idleProgress = document.getElementById("idleProgress");
    idleProgress.innerHTML = 100 - octofarmStatistics.activePercent + "%";
    idleProgress.style.width = 100 - octofarmStatistics.activePercent + "%";
  }
}
