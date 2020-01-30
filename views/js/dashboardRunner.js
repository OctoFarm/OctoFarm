import Client from "./lib/octofarm.js";
import UI from "./lib/functions/ui.js";
import Calc from "./lib/functions/calc.js";
import currentOperations from "./lib/modules/currentOperations.js";

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
        currentOperations(farmInfo);
        dashUpdate.farmInformation(farmInfo);
        //dashUpdate.FarmStatistics
        //dashUpdate.PrintStatistics
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
}
