import OctoPrintClient from "./lib/octoprint.js";
import UI from "./lib/functions/ui.js";
import Calc from "./lib/functions/calc.js";
import currentOperations from "./lib/modules/currentOperations.js";
import PrinterManager from "./lib/modules/printerManager.js";
import {parse} from "./vendor/flatted.js";
import tableSort from "./lib/functions/tablesort.js";
window.onload = function () {tableSort.makeAllSortable();};
import Validate from "./lib/functions/validate.js";
import PowerButton from "./lib/modules/powerButton.js";
import initGroupSelect from "./lib/modules/groupSelection.js";
import {returnSelected} from "./lib/modules/filamentGrab.js";
import {dragAndDropEnable} from "./lib/functions/dragAndDrop.js";
import {checkTemps} from "./lib/modules/temperatureCheck.js";

let printerInfo = [];
let elems = [];
//Connect to servers socket..webSocket
let url = window.location.hostname;
let port = window.location.port;
if (port != "") {
  port = ":" + port;
}
let jpInit = false;
async function asyncParse(str) {
  try{
    let info = parse(str)
    return info;
  }catch(e){
    console.log(e)
    return false;
  }
}
let groupInit = false;
let powerTimer = 20000;
let dragDropInit = false;

var source = new EventSource("/sse/monitoringInfo/");
source.onmessage = async function(e) {
  if (e.data != null) {
    let res = await asyncParse(e.data);
    if(groupInit === false){
      groupInit = true;
      initGroupSelect(res.printerInfo)
    }
    if(dragDropInit === false){
      let printerList = document.querySelectorAll("[id^='viewPanel-']")
      printerList.forEach(list => {
        let ca = list.id.split("-");
        let zeeIndex = _.findIndex(res.printerInfo, function(o) { return o._id == ca[1]; });
        dragAndDropEnable(list, res.printerInfo[zeeIndex])
        dragDropInit = true;
      })
    }
    if (res != false) {
      if (
          document.getElementById("printerManagerModal").classList.contains("show")
      ) {
        PrinterManager.init(res.printerInfo);
      } else {
        printerInfo = res.printerInfo;
        if(powerTimer >= 20000){
          res.printerInfo.forEach(printer => {
            PowerButton.applyBtn(printer);
          });
          powerTimer = 0
        }else{
          powerTimer = powerTimer + 500;
        }
        if (res.clientSettings.listView.currentOp) {
          currentOperations(res.currentOperations, res.currentOperationsCount, res.printerInfo);
        }
        updateState(res.printerInfo, res.clientSettings.listView, res.filamentProfiles, res.filamentManager);
      }
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

};
let returnPrinterInfo = (id) => {
  if(typeof id !== 'undefined'){
    let zeeIndex = _.findIndex(printerInfo, function(o) { return o._id == id; });
    return printerInfo[zeeIndex];
  }else{
    return printerInfo;
  }
}
//Setup page listeners...
let printerCard = document.querySelectorAll("[id^='printerButton-']");
printerCard.forEach(card => {
  let ca = card.id.split("-");
  card.addEventListener("click", e => {
    let printer = returnPrinterInfo(ca[1]);
    PrinterManager.updateIndex(ca[1]);
    let printers = returnPrinterInfo()
    PrinterManager.init(printers);
  });
  document.getElementById("listPlay-" + ca[1]).addEventListener("click", e => {
    let printer = returnPrinterInfo(ca[1]);
    e.target.disabled = true;
    let opts = {
      command: "start"
    };
    OctoPrintClient.jobAction(printer, opts, e);
  });
  document
      .getElementById("listCancel-" + ca[1])
      .addEventListener("click", e => {
        let printer = returnPrinterInfo(ca[1]);
        let name = Validate.getName(printer)
        bootbox.confirm({
          message: `${name}: <br>Are you sure you want to cancel the ongoing print?`,
          buttons: {
            cancel: {
              label: '<i class="fa fa-times"></i> Cancel'
            },
            confirm: {
              label: '<i class="fa fa-check"></i> Confirm'
            }
          },
          callback: function(result) {
            if (result) {
              e.target.disabled = true;
              let opts = {
                command: "cancel"
              };
              OctoPrintClient.jobAction(printer, opts, e);
            }
          }
        });
      });
});

function grabElements(printer) {
  if (typeof elems[printer._id] != "undefined") {
    return elems[printer._id];
  } else {
    let printerElemens = {
      row: document.getElementById("viewPanel-" + printer._id),
      index: document.getElementById("listIndex-" + printer._id),
      name: document.getElementById("listName-" + printer._id),
      control: document.getElementById("printerButton-" + printer._id),
      start: document.getElementById("listPlay-" + printer._id),
      stop: document.getElementById("listCancel-" + printer._id),
      pause: document.getElementById("listCancel-" + printer._id),
      restart: document.getElementById("listCancel-" + printer._id),
      resume: document.getElementById("listCancel-" + printer._id),
      currentFile: document.getElementById("listFile-" + printer._id),
      filament: document.getElementById("listFilament-" + printer._id),
      state: document.getElementById("listState-" + printer._id),
      printTime: document.getElementById("listPrintTime-" + printer._id),
      tool0: document.getElementById("listE0Temp-" + printer._id),
      bed: document.getElementById("listBedTemp-" + printer._id),
      extraInfoCol: document.getElementById("extraInfoCol-" + printer._id),
      extraInfoPercentCol: document.getElementById("extraInfoColPercent-"+printer._id),
      extraInfoPercent: document.getElementById("extraInfoPercent"),
      extraInfoTitle: document.getElementById("extraInfoTitle"),
      eta: document.getElementById("eta-" + printer._id),
      percent: document.getElementById("percent-" + printer._id)
    };
    elems[printer._id] = printerElemens;
    return elems[printer._id];
  }
}
function updateState(printers, clientSettings, filamentProfiles, filamentManager) {
  printers.forEach(async printer => {
    let elements = grabElements(printer);
    //Set the data
    if(clientSettings.extraInfo){
      if(elements.extraInfoCol.classList.contains("d-none")){
        elements.extraInfoCol.classList.remove("d-none");
        elements.extraInfoTitle.classList.remove("d-none");
        elements.extraInfoPercentCol.classList.remove("d-none");
        elements.extraInfoPercent.classList.remove("d-none");
      }

      if(typeof printer.progress != 'undefined'){
        if(printer.progress.printTimeLeft === null || printer.progress.printTimeLeft === 0){
          elements.eta.innerHTML = "Done"
        }else{
          let currentDate = new Date();
          currentDate = currentDate.getTime();
          let futureDateString = new Date(currentDate + printer.progress.printTimeLeft * 1000).toDateString()
          let futureTimeString = new Date(currentDate + printer.progress.printTimeLeft * 1000).toTimeString()
          futureTimeString = futureTimeString.substring(0, 8);
          let dateComplete = futureDateString + ": " + futureTimeString;
          elements.eta.innerHTML = dateComplete
        }
        if(printer.progress.printTimeLeft === null || printer.progress.printTimeLeft === 0){
          elements.percent.innerHTML = "0%"
        }else{
          elements.percent.innerHTML = printer.progress.completion.toFixed(0)+"%"
        }


      }else{
        elements.eta.innerHTML = "N/A"
        elements.percent.innerHTML = "0%"
      }
    }

    if (typeof printer.job != "undefined" && printer.job.file.name != null) {
      elements.currentFile.setAttribute('title', printer.job.file.path)
      let fileName = printer.job.file.display;
      if (fileName.length > 49) {
        fileName = fileName.substring(0, 49) + "...";
      }
      elements.currentFile.innerHTML =
          '<i class="fas fa-file-code"></i> ' + fileName;
    } else {
      elements.currentFile.innerHTML =
          '<i class="fas fa-file-code"></i> ' + "No File Selected";
    }
    if (
        printer.selectedFilament !== null
    ) {
      elements.filament.innerHTML = await returnSelected(printer.selectedFilament, filamentProfiles, filamentManager)
    }else{
      elements.filament.innerHTML = ""
    }
    elements.state.innerHTML = printer.state;
    elements.state.className = printer.stateColour.category;

    if (typeof printer.progress != "undefined") {
      elements.printTime.innerHTML = Calc.generateTime(
          printer.progress.printTimeLeft
      );
    }
    let tool0A = 0;
    let tool0T = 0;
    let bedA = 0;
    let bedT = 0;
    if (typeof printer.temps != "undefined") {
      if (typeof printer.temps[0].tool0 != "undefined") {
        tool0A = printer.temps[0].tool0.actual;
        tool0T = printer.temps[0].tool0.target;
        bedA = printer.temps[0].bed.actual;
        bedT = printer.temps[0].bed.target;
      } else {
        tool0A = 0;
        tool0T = 0;
        bedA = 0;
        bedT = 0;
      }
    }
    let hideClosed = "";
    let hideOffline = "";

    if (clientSettings.hideOff) {
      hideOffline = "hidden";
    }
    if (clientSettings.hideClosed) {
      hideClosed = "hidden";
    }
    elements.row.style.backgroundColor = printer.stateColour.hex;
    checkTemps(elements.tool0, tool0A, tool0T, printer.tempTriggers, printer.stateColour.category)
    checkTemps(elements.bed, bedA, bedT, printer.tempTriggers, printer.stateColour.category)
    if (printer.stateColour.category === "Active") {

      //Set the state
      if(elements.row.classList.contains(hideClosed)){
        elements.row.classList.remove(hideClosed);
      }
      if(elements.row.classList.contains(hideOffline)){
        elements.row.classList.remove(hideOffline);
      }

      elements.control.disabled = false;
      elements.start.disabled = true;
      elements.stop.disabled = false;
    } else if (
        printer.stateColour.category === "Idle" ||
        printer.stateColour.category === "Complete"
    ) {
      if(elements.row.classList.contains(hideClosed)){
        elements.row.classList.remove(hideClosed);
      }
      if(elements.row.classList.contains(hideOffline)){
        elements.row.classList.remove(hideOffline);
      }
      elements.control.disabled = false;
      if (typeof printer.job != "undefined" && printer.job.file.name != null) {
        elements.start.disabled = false;
        elements.stop.disabled = true;
      } else {
        elements.start.disabled = true;
        elements.stop.disabled = true;
      }
    } else if (printer.state === "Disconnected") {

      if(hideClosed != ""){
        elements.row.classList.add(hideClosed);
      }
      elements.control.disabled = false;
      elements.start.disabled = true;
      elements.stop.disabled = true;
    } else if (printer.stateColour.category === "Offline") {

      if(hideOffline != ""){
        elements.row.classList.add(hideOffline);
      }
      elements.control.disabled = true;
      elements.start.disabled = true;
      elements.stop.disabled = true;
    }
  });
  if(jpInit){
    jplist.refresh();
  }else{
    jpInit = true;
    jplist.init({
      storage: 'localStorage', //'localStorage', 'sessionStorage' or 'cookies'
      storageName: 'view-storage'
    });
  }

}

