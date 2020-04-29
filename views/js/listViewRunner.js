import OctoPrintClient from "./lib/octoprint.js";
import UI from "./lib/functions/ui.js";
import Calc from "./lib/functions/calc.js";
import currentOperations from "./lib/modules/currentOperations.js";
import PrinterManager from "./lib/modules/printerManager.js";

let printerInfo = [];
let elems = [];

//Connect to servers socket..webSocket
let url = window.location.hostname;
let port = window.location.port;
if (port != "") {
  port = ":" + port;
}
async function asyncParse(str) {
  try{
    let info = JSON.parse(str)
    return info;
  }catch(e){
    console.log(e)
    return false;
  }
}
var source = new EventSource("/sse/monitoringInfo/");
source.onmessage = async function(e) {
  if (e.data != null) {
    let res = await asyncParse(e.data);
    if (res != false) {
      if (
          document.getElementById("printerManagerModal").classList.contains("show")
      ) {
        PrinterManager.init(res.printerInfo);
      } else {
        printerInfo = res.printerInfo;
        if (res.clientSettings.listView.currentOp) {
          currentOperations(res.currentOperations, res.currentOperationsCount, res.printerInfo);
        }
        updateState(res.printerInfo, res.clientSettings.listView);
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
      row: document.getElementById("listRow-" + printer._id),
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
      iconBedT: document.getElementById("bedT-" + printer._id),
      iconBedA: document.getElementById("bedA-" + printer._id),
      iconTool0A: document.getElementById("tool0A-" + printer._id),
      iconTool0T: document.getElementById("tool0T-" + printer._id)
    };
    elems[printer._id] = printerElemens;
    return elems[printer._id];
  }
}
function updateState(printers, clientSettings) {
  printers.forEach(printer => {
    let elements = grabElements(printer);
    //Set the data


    if (typeof printer.job != "undefined" && printer.job.file.name != null) {
      elements.currentFile.innerHTML =
        '<i class="fas fa-file-code"></i> ' + printer.job.file.display;
    } else {
      elements.currentFile.innerHTML =
        '<i class="fas fa-file-code"></i> ' + "No File Selected";
    }
    if (
      typeof printer.selectedFilament != "undefined" &&
      printer.selectedFilament != null &&
      printer.selectedFilament.name != null
    ) {
      elements.filament.innerHTML =
        printer.selectedFilament.name +
        " " +
        "[" +
        printer.selectedFilament.colour +
        " / " +
        printer.selectedFilament.type[1] +
        "]";
    }
    elements.state.innerHTML = printer.state;
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
    if (printer.stateColour.category === "Active") {
      //Set the state
      elements.row.className = printer.stateColour.category;
      elements.control.disabled = false;
      elements.start.disabled = true;
      elements.stop.disabled = false;

      if (tool0A > tool0T - parseInt(printer.tempTriggers.heatingVariation) && tool0A < tool0T + parseInt(printer.tempTriggers.heatingVariation)) {
        elements.tool0.innerHTML =
            ' <i id="tool0A-' +
            printer._id +
            '" class="far fa-circle toolOn"></i> ' +
            tool0A +
            "°C" +
            " " +
            ' <i id="tool0T-' +
            printer._id +
            '" class="fas fa-bullseye toolOn"></i> ' +
            tool0T +
            "°C";
      } else if (tool0A < parseInt(printer.tempTriggers.heatingVariation)) {
        elements.tool0.innerHTML =
            ' <i id="tool0A-' +
            printer._id +
            '" class="far fa-circle"></i> ' +
            tool0A +
            "°C" +
            " " +
            ' <i id="tool0T-' +
            printer._id +
            '" class="fas fa-bullseye"></i> ' +
            tool0T +
            "°C";
      } else {
        elements.tool0.innerHTML =
            ' <i id="tool0A-' +
            printer._id +
            '" class="far fa-circle toolOut"></i> ' +
            tool0A +
            "°C" +
            ' <i id="tool0T-' +
            printer._id +
            '" class="fas fa-bullseye toolOut"></i> ' +
            tool0T +
            "°C";
      }
      if (bedA > bedT - parseInt(printer.tempTriggers.heatingVariation) && bedA < bedT + parseInt(printer.tempTriggers.heatingVariation)) {
        elements.bed.innerHTML =
            ' <i id="bedA-' +
            printer._id +
            '" class="far fa-circle toolOn"></i> ' +
            bedA +
            "°C" +
            " " +
            ' <i id="bedT-' +
            printer._id +
            '" class="fas fa-bullseye toolOn"></i> ' +
            bedT +
            "°C";
      } else if (bedA < parseInt(printer.tempTriggers.heatingVariation)) {
        elements.bed.innerHTML =
            ' <i id="bedA-' +
            printer._id +
            '" class="far fa-circle"></i> ' +
            bedA +
            "°C" +
            " " +
            ' <i id="bedT-' +
            printer._id +
            '" class="fas fa-bullseye"></i> ' +
            bedT +
            "°C";
      } else {
        elements.bed.innerHTML =
            ' <i id="bedA-' +
            printer._id +
            '" class="far fa-circle toolOut"></i> ' +
            bedA +
            "°C" +
            ' <i id="bedT-' +
            printer._id +
            '" class="fas fa-bullseye toolOut"></i> ' +
            bedT +
            "°C";
      }
    } else if (
      printer.stateColour.category === "Idle" ||
      printer.stateColour.category === "Complete"
    ) {
      elements.row.className = printer.stateColour.category;
      elements.control.disabled = false;
      if (typeof printer.job != "undefined" && printer.job.file.name != null) {
        elements.start.disabled = false;
        elements.stop.disabled = true;
      } else {
        elements.start.disabled = true;
        elements.stop.disabled = true;
      }
      if(printer.stateColour.category === "Complete"){
        if (tool0A > parseInt(printer.tempTriggers.coolDown)) {
          elements.tool0.innerHTML =
              ' <i id="tool0A-' +
              printer._id +
              '" class="far fa-circle"></i> ' +
              tool0A +
              "°C" +
              " " +
              ' <i id="tool0T-' +
              printer._id +
              '" class="fas fa-bullseye"></i> ' +
              tool0T +
              "°C";
        } else {
          elements.tool0.innerHTML =
              ' <i id="tool0A-' +
              printer._id +
              '" class="far fa-circle toolUnder"></i> ' +
              tool0A +
              "°C" +
              ' <i id="tool0T-' +
              printer._id +
              '" class="fas fa-bullseye toolUnder"></i> ' +
              tool0T +
              "°C";
        }
        if (bedA > parseInt(printer.tempTriggers.coolDown)) {
          elements.bed.innerHTML =
              ' <i id="bedA-' +
              printer._id +
              '" class="far fa-circle"></i> ' +
              bedA +
              "°C" +
              " " +
              ' <i id="bedT-' +
              printer._id +
              '" class="fas fa-bullseye"></i> ' +
              bedT +
              "°C";
        } else {
          elements.bed.innerHTML =
              ' <i id="bedA-' +
              printer._id +
              '" class="far fa-circle toolUnder"></i> ' +
              bedA +
              "°C" +
              ' <i id="bedT-' +
              printer._id +
              '" class="fas fa-bullseye toolUnder"></i> ' +
              bedT +
              "°C";
        }
      }else{
        elements.tool0.innerHTML =
            ' <i id="tool0A-' +
            printer._id +
            '" class="far fa-circle"></i> ' +
            tool0A +
            "°C" +
            " " +
            ' <i id="tool0T-' +
            printer._id +
            '" class="fas fa-bullseye"></i> ' +
            tool0T +
            "°C";
        elements.bed.innerHTML =
            ' <i id="bedA-' +
            printer._id +
            '" class="far fa-circle"></i> ' +
            bedA +
            "°C" +
            " " +
            ' <i id="bedT-' +
            printer._id +
            '" class="fas fa-bullseye"></i> ' +
            bedT +
            "°C";
      }

    } else if (printer.state === "Disconnected") {
      elements.row.className = printer.stateColour.category + " " + hideClosed;
      elements.control.disabled = false;
      elements.start.disabled = true;
      elements.stop.disabled = true;
    } else if (printer.stateColour.category === "Offline") {
      elements.row.className = printer.stateColour.category + " " + hideOffline;
      elements.control.disabled = true;
      elements.start.disabled = true;
      elements.stop.disabled = true;
    }
  });
}
