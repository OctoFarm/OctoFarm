import OctoPrintClient from "./lib/octoprint.js";
import UI from "./lib/functions/ui.js";
import Calc from "./lib/functions/calc.js";
import currentOperations from "./lib/modules/currentOperations.js";
import PrinterManager from "./lib/modules/printerManager.js";
import doubleClickFullScreen from "./lib/functions/fullscreen.js";
import initGroupSelect from "./lib/modules/groupSelection.js";
import {returnSelected} from "./lib/modules/filamentGrab.js";
import PowerButton from "./lib/modules/powerButton.js";
import {dragAndDropEnable} from "./lib/functions/dragAndDrop.js";
import {checkTemps} from "./lib/modules/temperatureCheck.js";

let printerInfo = "";
let elems = [];
//Connect to servers socket..webSocket
let url = window.location.hostname;
let port = window.location.port;
if (port != "") {
  port = ":" + port;
}

let powerTimer = 20000;
let jpInit = false;
let dragDropInit = false;
let groupInit = false;

let worker = null;
//Setup webWorker
if (window.Worker) {
  // Yes! Web worker support!
  try{
    if (worker === null) {
      worker = new Worker("/js/lib/modules/serverConnect.js");

      worker.onmessage = function(event){
        if (event.data != false) {
            if(groupInit === false){
              initGroupSelect(event.data.printerInfo)
              groupInit = true;
            }
            if(dragDropInit === false){
              let printerList = document.querySelectorAll("[id^='viewPanel-']")
              printerList.forEach(list => {
                let ca = list.id.split("-");
                let zeeIndex = _.findIndex(event.data.printerInfo, function(o) { return o._id == ca[1]; });
                dragAndDropEnable(list, event.data.printerInfo[zeeIndex])
                dragDropInit = true;
              })
            }
            if (event.data != false) {
              if (
                  document.getElementById("printerManagerModal").classList.contains("show")
              ) {
                PrinterManager.init(event.data.printerInfo);
              } else {
                printerInfo = event.data.printerInfo;
                if(powerTimer >= 20000){
                  event.data.printerInfo.forEach(printer => {
                    PowerButton.applyBtn(printer);
                  });
                  powerTimer = 0
                }else{
                  powerTimer = powerTimer + 500;
                }
                if (event.data.clientSettings.panelView.currentOp) {
                  currentOperations(event.data.currentOperations, event.data.currentOperationsCount, event.data.printerInfo);
                }
                updateState(event.data.printerInfo, event.data.clientSettings.panelView, event.data.filamentProfiles, event.data.filamentManager);
              }
            }
        }else{
          UI.createAlert(
              "error",
              "Communication with the server has been suddenly lost, trying to re-establish connection...", 10000, "Clicked"

          );
        }

      }
    }
  }catch(e){
    console.log(e)
  }
} else {
  // Sorry! No Web Worker support..
  console.log("Web workers not available... sorry!")
}

// source.onmessage = async function(e) {
//   if (e.data != null) {
//     let res = await asyncParse(e.data);

//   }
// };
// source.onerror = function(e) {
//   UI.createAlert(
//       "error",
//       "Communication with the server has been suddenly lost, we will automatically refresh in 10 seconds..."
//   );
//   setTimeout(function() {
//     location.reload();
//   }, 10000);
// };
// source.onclose = function(e) {
// };
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
  document
      .getElementById("cameraContain-" + ca[1])
      .addEventListener("dblclick", e => {
        doubleClickFullScreen(e.target);
      });
  document
      .getElementById("panPrintStart-" + ca[1])
      .addEventListener("click", async e => {
        let printer = returnPrinterInfo(ca[1]);
        e.target.disabled = true;
        let opts = {
          command: "start"
        };
        OctoPrintClient.jobAction(printer, opts, e);
      });
  document
      .getElementById("panPrintPause-" + ca[1])
      .addEventListener("click", e => {
        let printer = returnPrinterInfo(ca[1]);
        e.target.disabled = true;
        let opts = {
          command: "pause",
          action: "pause"
        };
        OctoPrintClient.jobAction(printer, opts, e);
      });
  document
      .getElementById("panRestart-" + ca[1])
      .addEventListener("click", e => {
        e.target.disabled = true;
        let opts = {
          command: "restart"
        };
        let printer = returnPrinterInfo(ca[1]);
        OctoPrintClient.jobAction(printer, opts, e);
      });
  document
      .getElementById("panResume-" + ca[1])
      .addEventListener("click", e => {
        e.target.disabled = true;
        let opts = {
          command: "pause",
          action: "resume"
        };
        let printer = returnPrinterInfo(ca[1]);
        OctoPrintClient.jobAction(printer, opts, e);
      });
  document
      .getElementById("panStop-" + ca[1])
      .addEventListener("click", e => {
        let printer = returnPrinterInfo(ca[1]);
        let name = "";
        if (typeof printer.settingsAppearance != "undefined") {
          if (printer.settingsAppearance.name === "" || printer.settingsAppearance.name === null) {
            name = printer.printerURL;
          } else {
            name = printer.settingsAppearance.name;
          }
        } else {
          name = printer.printerURL;
        }
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
      index: document.getElementById("panIndex-" + printer._id),
      name: document.getElementById("panName-" + printer._id),
      control: document.getElementById("printerButton-" + printer._id),
      start: document.getElementById("panPrintStart-" + printer._id),
      stop: document.getElementById("panStop-" + printer._id),
      restart: document.getElementById("panRestart-" + printer._id),
      pause: document.getElementById("panPrintPause-" + printer._id),
      resume: document.getElementById("panResume-" + printer._id),
      camera: document.getElementById("panCamera" + printer._id),
      currentFile: document.getElementById("panFileName-" + printer._id),
      filament: document.getElementById("listFilament-" + printer._id),
      state: document.getElementById("panState-" + printer._id),
      progress: document.getElementById("panProgress-" + printer._id),
      tool0: document.getElementById("panE0Temp-" + printer._id),
      bed: document.getElementById("panBedTemp-" + printer._id),
      extraInfo: document.getElementById("extraInfo-" + printer._id),
      timeRemaining: document.getElementById("timeRemaining-" + printer._id),
      eta: document.getElementById("eta-" + printer._id),
    };
    elems[printer._id] = printerElemens;
    return elems[printer._id];
  }
}
function updateState(printers, clientSettings, filamentProfiles, filamentManager) {
  printers.forEach(async printer => {
    let elements = grabElements(printer);
    elements.state.innerHTML = printer.state;
    elements.state.className = `btn btn-block ${printer.stateColour.category} mb-1 mt-1`;
    if (typeof printer.settingsApperance != "undefined") {
      elements.index.innerHTML = `
      <h6 class="float-left mb-0" id="panIndex-${printer._id}">
        <button id="panName-1" type="button" class="btn btn-secondary mb-0" role="button" disabled="">
          ${printer._id} . ${printer.settingsApperance.name}
        </button>
      </h6>
      `;
    }

    if(clientSettings.extraInfo){
      if(elements.extraInfo.classList.contains("d-none")){
        elements.extraInfo.classList.remove("d-none");
      }

      if(typeof printer.progress != 'undefined' && printer.progress.printTimeLeft != 0 && printer.progress.printTimeLeft !== null){
        let currentDate = new Date();
        currentDate = currentDate.getTime();
        let futureDateString = new Date(currentDate + printer.progress.printTimeLeft * 1000).toDateString()
        let futureTimeString = new Date(currentDate + printer.progress.printTimeLeft * 1000).toTimeString()
        futureTimeString = futureTimeString.substring(0, 8);
        let dateComplete = futureDateString + ": " + futureTimeString;
        elements.timeRemaining.innerHTML = `
        ${Calc.generateTime(printer.progress.printTimeLeft)}
      `;
        elements.eta.innerHTML = dateComplete
      }else{
        elements.timeRemaining.innerHTML = `
        ${Calc.generateTime(null)}
      `;
        elements.eta.innerHTML = "N/A"
      }
    }

    if (typeof printer.job != "undefined" && printer.job.file.name != null) {
      elements.currentFile.setAttribute("title", printer.job.file.path)
      elements.currentFile.innerHTML =
          '<i class="fas fa-file-code"></i> ' + printer.job.file.name;
      let camField = document.getElementById("panCamera-"+printer._id);
      if(camField.src.includes("localhost") || camField.src.includes("none")){
        if(typeof printer.job.file.thumbnail !== 'undefined' || printer.job.file.thumbnail != null ){
          camField.src = printer.printerURL + "/" + printer.job.file.thumbnail
        }
      }

    } else {
      elements.currentFile.innerHTML =
          '<i class="fas fa-file-code"></i> ' + "No File Selected";
    }
    if (
        Array.isArray(printer.selectedFilament)
    ) {
      let spoolList = "";
      for(let i = 0; i < printer.selectedFilament.length; i++){
        if(printer.selectedFilament[i] !== null){
          spoolList += await returnSelected(printer.selectedFilament[i], filamentProfiles, filamentManager) + "<br>"
        }
      }
      elements.filament.innerHTML = spoolList;
    }else{
      elements.filament.innerHTML = ""
    }
    if (typeof printer.progress != "undefined") {
      elements.progress.innerHTML =
          Math.floor(printer.progress.completion) + "%";
      elements.progress.style.width = printer.progress.completion + "%";
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
    let dNone = ""
    if(elements.row.classList.contains("d-none")){
      dNone = "d-none"
    }
    checkTemps(elements.tool0, tool0A, tool0T, printer.tempTriggers, printer.stateColour.category)
    checkTemps(elements.bed, bedA, bedT, printer.tempTriggers, printer.stateColour.category)
    //Set the state
    if (printer.stateColour.category === "Active") {
      if (printer.camURL != "") {
        elements.row.className = "col-sm-12 col-md-4 col-lg-3 col-xl-2 " + dNone;
      }
      elements.control.disabled = false;
      elements.start.disabled = true;
      elements.stop.disabled = false;
      if (printer.state === "Pausing") {
        elements.pause.disabled = true;
        elements.resume.disabled = true;
        elements.restart.disabled = true;
        elements.start.classList.remove("hidden");
        elements.pause.classList.remove("hidden");
        elements.resume.classList.add("hidden");
        elements.restart.classList.add("hidden");
      } else if (printer.state === "Paused") {
        elements.pause.disabled = true;
        elements.resume.disabled = false;
        elements.restart.disabled = false;
        elements.start.classList.add("hidden");
        elements.pause.classList.add("hidden");
        elements.resume.classList.remove("hidden");
        elements.restart.classList.remove("hidden");
      } else {
        elements.start.classList.remove("hidden");
        elements.pause.classList.remove("hidden");
        elements.resume.classList.add("hidden");
        elements.restart.classList.add("hidden");
        elements.pause.disabled = false;
        elements.resume.disabled = true;
        elements.restart.disabled = true;
      }
    } else if (
        printer.stateColour.category === "Idle" ||
        printer.stateColour.category === "Complete"
    ) {
      if (printer.camURL != "") {
        elements.row.className = "col-sm-12 col-md-4 col-lg-3 col-xl-2 " + dNone;
      }
      elements.control.disabled = false;
      if (typeof printer.job != "undefined" && printer.job.file.name != null) {
        elements.start.disabled = false;
        elements.stop.disabled = true;
        elements.pause.disabled = true;
        elements.resume.disabled = true;
        elements.restart.disabled = true;
      } else {
        elements.start.disabled = true;
        elements.stop.disabled = true;
        elements.pause.disabled = true;
        elements.resume.disabled = true;
        elements.restart.disabled = true;
      }
      if (printer.state === "Paused") {
        elements.pause.disabled = true;
        elements.resume.disabled = false;
        elements.restart.disabled = false;
        elements.start.classList.add("hidden");
        elements.pause.classList.add("hidden");
        elements.resume.classList.remove("hidden");
        elements.restart.classList.remove("hidden");
      } else {
        elements.start.classList.remove("hidden");
        elements.pause.classList.remove("hidden");
        elements.resume.classList.add("hidden");
        elements.restart.classList.add("hidden");
        elements.pause.disabled = true;
        elements.resume.disabled = true;
        elements.restart.disabled = true;
      }
      if(printer.stateColour.category === "Complete"){

      }
    } else if (printer.state === "Disconnected") {
      if (printer.camURL != "") {
        elements.row.className =
            "col-sm-12 col-md-4 col-lg-3 col-xl-2" + " " + hideClosed + " " + dNone;
      }

      elements.control.disabled = false;
      elements.start.disabled = true;
      elements.stop.disabled = true;
      elements.pause.disabled = true;
      elements.resume.disabled = true;
      elements.restart.disabled = true;
      elements.start.classList.remove("hidden");
      elements.pause.classList.remove("hidden");
      elements.resume.classList.add("hidden");
      elements.restart.classList.add("hidden");
    } else if (printer.stateColour.category === "Offline") {
      if (printer.camURL != "") {
        elements.row.className =
            "col-sm-12 col-md-4 col-lg-3 col-xl-2" + " " + hideOffline + " " + dNone;
      }

      elements.control.disabled = true;
      elements.start.disabled = true;
      elements.stop.disabled = true;
      elements.pause.disabled = true;
      elements.resume.disabled = true;
      elements.restart.disabled = true;
      elements.start.classList.remove("hidden");
      elements.pause.classList.remove("hidden");
      elements.resume.classList.add("hidden");
      elements.restart.classList.add("hidden");
    }
  });
  if(jpInit){
    let fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;
    if(!fullscreenElement){
      jplist.refresh("printers");
    }

  }else {
    jpInit = true;
    jplist.init({
      storage: 'localStorage', //'localStorage', 'sessionStorage' or 'cookies'
      storageName: 'view-storage'
    });
  }
}

