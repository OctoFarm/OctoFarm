import Client from "./lib/octofarm.js";
import UI from "./lib/functions/ui.js";
import Calc from "./lib/functions/calc.js";
import currentOperations from "./lib/modules/currentOperations.js";
import PrinterManager from "./lib/modules/printerManager.js";

let printerInfo = "";

//Close modal event listeners...
$("#printerManagerModal").on("hidden.bs.modal", function(e) {
  //Fix for mjpeg stream not ending when element removed...
  document.getElementById("printerControlCamera").src = "";
})


//Update page variables
Client.get("client/dash/get")
    .then(res => {
      return res.json();
    })
    .then(res => {
      if(res.printerInfo.length === 0){

      }else{
        printerInfo = res.printerInfo;
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

//Setup page listeners... 
let printerCard = document.querySelectorAll("[id^='printerButton-']");
  printerCard.forEach(card => {
    let ca = card.id.split("-");
    card.addEventListener("click", e=> {
      PrinterManager.updateIndex(parseInt(ca[1]));
      PrinterManager.init(printerInfo);
    })
  })

setInterval(function() {
  Client.get("client/dash/get")
    .then(res => {
      return res.json();
    })
    .then(res => {
      if(res.printerInfo.length === 0){

      }else{
        currentOperations(res.currentOperations, res.currentOperationsCount);
        dashUpdate.systemInformation(res.systemInfo);
        dashUpdate.printers(res.printerInfo);
        printerInfo = res.printerInfo;
        dashUpdate.farmInformation(res.farmInfo)
        dashUpdate.farmStatistics(res.octofarmStatistics)
        if(document.getElementById("printerManagerModal").classList.contains("show")){
          PrinterManager.init(res.printerInfo);
        }
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
}, 1000);

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
      if(typeof printer.settingsAppearance != 'undefined'){
        printerName = printer.settingsAppearance.name;
      }
      if(document.getElementById("printerCard-"+printer.index)){
          document.getElementById("printerBadge-" + printer.index).innerHTML =
          printer.state;
        document.getElementById(
          "printerBadge-" + printer.index
        ).className = `badge badge-${printer.stateColour.name} badge-pill`;
        document.getElementById("printerName-"+printer.index).innerHTML = `<i class="fas fa-print"></i> ${printer.index}. ${printerName}`;
        if(printer.state != "Offline"){
          document.getElementById("printerButton-"+printer.index).disabled = false;
        }
   
      }else{
        document.getElementById("printerList").insertAdjacentHTML('beforeend',`
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
              <small class="pt-2 float-left ml-1 text-white"><i class="fas fa-network-wired"></i> ${printer.ip}:${printer.port}</small>
            </li>
          </div>
        `
      );
      }
      document.getElementById(
        "printerCard-" + printer.index
      ).style.order = index;
    });
  }

  static farmInformation(farmInfo){
        document.getElementById("avgEstimatedTime").innerHTML = Calc.generateTime(farmInfo.avgEstimateTime) ;
        document.getElementById("avgRemaingingTime").innerHTML = Calc.generateTime(farmInfo.avgRemainingTime);
         document.getElementById("avgElapsedTime").innerHTML = Calc.generateTime(farmInfo.avgElapsedTime);
         document.getElementById("cumEstimatedTime").innerHTML = Calc.generateTime(farmInfo.totalEstimateTime);
         document.getElementById("cumRemainingTime").innerHTML = Calc.generateTime(farmInfo.totalRemainingTime);
         document.getElementById("cumElapsedTime").innerHTML = Calc.generateTime(farmInfo.totalElapsedTime);
         document.getElementById("cumTool0Heat").innerHTML = `<i class="far fa-circle"></i> ${Math.round((farmInfo.activeToolA) * 100) / 100}°C <i class="fas fa-bullseye"></i> ${Math.round((farmInfo.activeToolT) * 100) / 100}°C`;
         document.getElementById("cumBedHeat").innerHTML = `<i class="far fa-circle"></i> ${Math.round((farmInfo.activeBedA) * 100) / 100}°C <i class="fas fa-bullseye"></i> ${Math.round((farmInfo.activeBedT) * 100) / 100}°C`;
         document.getElementById("cumPrintHeat").innerHTML = `<i class="far fa-circle"></i> ${Math.round((farmInfo.activeToolA + farmInfo.activeBedA) * 100) / 100}°C <i class="fas fa-bullseye"></i> ${Math.round((farmInfo.activeToolT + farmInfo.activeBedT) * 100) / 100}°C`;

  }
  static farmStatistics(octofarmStatistics){
    document.getElementById("activeHours").innerHTML = "<i class='fas fa-square text-success'></i> <b>Active: </b>" + Calc.generateTime(octofarmStatistics.activeHours);
    document.getElementById("idleHours").innerHTML =  "<i class='fas fa-square text-danger'></i> <b>Idle: </b>" + Calc.generateTime(octofarmStatistics.idleHours);
    let activeProgress = document.getElementById("activeProgress");
    activeProgress.innerHTML = octofarmStatistics.activePercent + "%"
    activeProgress.style.width = octofarmStatistics.activePercent + "%"

    let idleProgress = document.getElementById("idleProgress");
    idleProgress.innerHTML = 100 - octofarmStatistics.activePercent + "%"
    idleProgress.style.width = 100 - octofarmStatistics.activePercent + "%"
}
}
