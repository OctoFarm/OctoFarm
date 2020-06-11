import OctoPrintClient from "./lib/octoprint.js";
import UI from "./lib/functions/ui.js";
import Calc from "./lib/functions/calc.js";
import currentOperations from "./lib/modules/currentOperations.js";
import PrinterManager from "./lib/modules/printerManager.js";
import doubleClickFullScreen from "./lib/functions/fullscreen.js";

import initGroupSelect from "./lib/modules/groupSelection.js";
import PowerButton from "./lib/modules/powerButton.js";
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
let groupInit = false;
let powerTimer = 20000;
let jpInit = false;
let dragDropInit = false;

let worker = null;
//Setup webWorker
if (window.Worker) {
    // Yes! Web worker support!
    try{
        if (worker === null) {
            worker = new Worker("/js/lib/modules/serverConnect.js");

            worker.onmessage = function(event){
                if (event.data !== false) {
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
                            document
                                .getElementById("printerManagerModal")
                                .classList.contains("show")
                        ) {
                            PrinterManager.init(event.data.printerInfo);
                        } else {
                            if (event.data.clientSettings.cameraView.currentOp) {
                                currentOperations(
                                    event.data.currentOperations,
                                    event.data.currentOperationsCount,
                                    event.data.printerInfo
                                );
                            }
                            printerInfo = event.data.printerInfo;
                            if(powerTimer >= 20000){
                                event.data.printerInfo.forEach(printer => {
                                    PowerButton.applyBtn(printer);
                                });
                                powerTimer = 0
                            }else{
                                powerTimer = powerTimer + 500;
                            }
                            updateState(event.data.printerInfo, event.data.clientSettings.cameraView);
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


let returnPrinterInfo = (id) => {
    if (typeof id !== "undefined") {
        let zeeIndex = _.findIndex(printerInfo, function(o) {
            return o._id == id;
        });
        return printerInfo[zeeIndex];
    } else {
        return printerInfo;
    }
};
let printerCard = document.querySelectorAll("[id^='printerButton-']");
printerCard.forEach((card) => {
    let ca = card.id.split("-");
    card.addEventListener("click", (e) => {
        let printer = returnPrinterInfo(ca[1]);
        PrinterManager.updateIndex(ca[1]);
        let printers = returnPrinterInfo();
        PrinterManager.init(printers);
    });
    document
        .getElementById("camBody-" + ca[1])
        .addEventListener("dblclick", (e) => {
            doubleClickFullScreen(e.target);
        });

    document
        .getElementById("camStart-" + ca[1])
        .addEventListener("click", async(e) => {
            let printer = returnPrinterInfo(ca[1]);
            e.target.disabled = true;
            let opts = {
                command: "start",
            };
            OctoPrintClient.jobAction(printer, opts, e);
        });
    document.getElementById("camStop-" + ca[1]).addEventListener("click", (e) => {
        let printer = returnPrinterInfo(ca[1]);
        let name = "";
        if (typeof printer.settingsAppearance != "undefined") {
            if (
                printer.settingsAppearance.name === "" ||
                printer.settingsAppearance.name === null
            ) {
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
                    label: '<i class="fa fa-times"></i> Cancel',
                },
                confirm: {
                    label: '<i class="fa fa-check"></i> Confirm',
                },
            },
            callback: function(result) {
                if (result) {
                    e.target.disabled = true;
                    let opts = {
                        command: "cancel",
                    };
                    OctoPrintClient.jobAction(printer, opts, e);
                }
            },
        });
    });
});

//Setup page listeners...
function grabElements(printer) {
    if (typeof elems[printer._id] != "undefined") {
        return elems[printer._id];
    } else {
        let printerElemens = {
            row: document.getElementById("viewPanel-" + printer._id),
            name: document.getElementById("camPrinterName-" + printer._id),
            control: document.getElementById("printerButton-" + printer._id),
            start: document.getElementById("camStart-" + printer._id),
            stop: document.getElementById("camStop-" + printer._id),
            camera: document.getElementById("cameraSRC-" + printer._id),
            currentFile: document.getElementById("camName-" + printer._id),
            camBackground: document.getElementById("camBody-" + printer._id),
            progress: document.getElementById("camProgress-" + printer._id),
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

function updateState(printers, clientSettings) {
    printers.forEach((printer) => {
        let elements = grabElements(printer);
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
        elements.camBackground.className = `card-body cameraContain ${printer.stateColour.category}`;
        if (typeof printer.job != "undefined" && printer.job.file.name != null) {
            elements.currentFile.setAttribute("title", printer.job.file.path)
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

        if (typeof printer.progress != "undefined") {
            elements.progress.innerHTML =
                Math.floor(printer.progress.completion) + "%";
            elements.progress.style.width = printer.progress.completion + "%";
            elements.progress.classList = `progress-bar progress-bar-striped bg-${printer.stateColour.name} progress`;
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

        if (clientSettings.hideClosed) {
            hideClosed = "hidden";
        }
        let dNone = ""
        if(elements.row.classList.contains("d-none")){
            dNone = "d-none"
        }
        //Set the state
        checkTemps(elements.tool0, tool0A, tool0T, printer.tempTriggers, printer.stateColour.category)
        checkTemps(elements.bed, bedA, bedT, printer.tempTriggers, printer.stateColour.category)
        if (printer.stateColour.category === "Active") {
            if (printer.camURL != "") {
                elements.row.className = `col-md-4 col-lg-${clientSettings.cameraRows} col-xl-${clientSettings.cameraRows} ${dNone}`;
            }

            elements.control.disabled = false;
            elements.start.disabled = true;
            elements.stop.disabled = false;
            elements.start.classList.add("hidden");
            elements.stop.classList.remove("hidden");
        } else if (
            printer.stateColour.category === "Idle" ||
            printer.stateColour.category === "Complete"
        ) {
            elements.control.disabled = false;
            if (printer.camURL != "") {
                elements.row.className = `col-md-4 col-lg-${clientSettings.cameraRows} col-xl-${clientSettings.cameraRows} ${dNone}`;
            }
            if (typeof printer.job != "undefined" && printer.job.file.name != null) {
                elements.start.disabled = false;
                elements.stop.disabled = true;
                elements.start.classList.remove("hidden");
                elements.stop.classList.add("hidden");
            } else {
                elements.start.disabled = true;
                elements.stop.disabled = true;
                elements.start.classList.remove("hidden");
                elements.stop.classList.add("hidden");
            }
            if (printer.stateColour.category === "Complete") {

            } else {
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
            if (printer.camURL != "") {
                elements.row.className = `col-md-4 col-lg-${clientSettings.cameraRows} col-xl-${clientSettings.cameraRows} ${hideClosed} ${dNone}`;
            }
            elements.control.disabled = false;
            elements.start.disabled = true;
            elements.stop.disabled = true;
            elements.start.classList.remove("hidden");
            elements.stop.classList.add("hidden");
        } else if (printer.stateColour.category === "Offline") {
            elements.row.className = `col-md-4 col-lg-${clientSettings.cameraRows} col-xl-${clientSettings.cameraRows} hidden ${dNone}`;
            elements.start.classList.remove("hidden");
            elements.stop.classList.add("hidden");

            elements.start.disabled = true;
            elements.stop.disabled = true;
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
