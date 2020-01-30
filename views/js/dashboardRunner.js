import Client from "./lib/octofarm.js";
import UI from "./lib/functions/ui.js";
import Calc from "./lib/functions/calc.js";

setInterval(function() {
  Client.get("client/dash/get")
    .then(res => {
      return res.json();
    })
    .then(res => {
      if(res.printers.length === 0){

      }else{
        let farmInfo = res.farmStats.farmInfo;
        let octofarmStatistics = res.farmStats.octofarmStatistics;
        let printStatistics = res.farmStats.printStatistics;
        let printers = res.printers;
        let systemInfo = res.systemInfo;
  
        dashUpdate.systemInformation(systemInfo);
        dashUpdate.printers(printers);
        dashUpdate.currentOperations(farmInfo);
      }
    })
    .catch(err => {
      console.log(err);
      UI.createAlert(
        "error",
        "There was trouble updating page, please check logs",
        4000,
        "clicked"
      );
    });
}, 5000);

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
    printers.forEach(printer => {
      document.getElementById("printerBadge-" + printer.index).innerHTML =
        printer.current.state;
      document.getElementById(
        "printerBadge-" + printer.index
      ).className = `badge badge-${printer.stateColour.name} badge-pill`;
      if (printer.current.state != "Offline") {
        document.getElementById("printerName-" + printer.index).innerHTML =
          "<i class='fas fa-print'></i> " +
          printer.index +
          ". " +
          printer.settingsApperance.name;
      } else {
        document.getElementById("printerName-" + printer.index).innerHTML =
          "<i class='fas fa-print'></i> " +
          printer.index +
          ". " +
          printer.action;
      }
    });
  }
  static currentOperations(farmInfo) {
    document.getElementById("completeCount").innerHTML =
      "Complete: " + farmInfo.complete;
    document.getElementById("idleCount").innerHTML = "Idle: " + farmInfo.idle;
    document.getElementById("activeCount").innerHTML =
      "Active: " + farmInfo.active;
    document.getElementById("offlineCount").innerHTML =
      "Offline: " + farmInfo.offline;
    farmInfo.currentOperations = _.orderBy(
      farmInfo.currentOperations,
      ["progress"],
      ["desc"]
    );
    farmInfo.currentOperations.forEach((current, index) => {
      //check if exists, create if not....
      if (document.getElementById("currentOpCard-" + current.index)) {
        let progress = document.getElementById(
          "currentProgress-" + current.index
        );
        progress.style.width = current.progress;
        progress.innerHTML = current.progress + "%";
        progress.className = `progress-bar progress-bar-striped bg-${current.progressColour}`;
      } else {
        document.getElementById("currentOperationsBody").insertAdjacentHTML(
          "beforeend",
          `
                <div id="currentOpCard-${current.index}"
                class="card card-block text-white bg-secondary d-inline-block"
                style="min-width: 200px; height:65px;"
              >
                  <div class="card-header pb-1 pt-1 pl-2 pr-2">${current.index}. ${current.name}</div>
                  <div class="card-body  pb-0 pt-2 pl-2 pr-2">
                    <div class="progress">
                      <div id="currentProgress-${current.index}"
                        class="progress-bar progress-bar-striped bg-${current.progressColour}"
                        role="progressbar"
                        style="width: ${current.progress}%"
                        aria-valuenow="${current.progress}"
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                      ${current.progress}%
                      </div>
                    </div>
                  </div>
                </div>
                `
        );
      }
      document.getElementById(
        "currentOpCard-" + current.index
      ).style.order = index;
    });
  }
}
