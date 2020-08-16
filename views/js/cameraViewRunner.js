import OctoPrintClient from './lib/octoprint.js';
import UI from './lib/functions/ui.js';
import Calc from './lib/functions/calc.js';
import currentOperations from './lib/modules/currentOperations.js';
import PrinterManager from './lib/modules/printerManager.js';
import doubleClickFullScreen from './lib/functions/fullscreen.js';

import initGroupSelect from './lib/modules/groupSelection.js';
import PowerButton from './lib/modules/powerButton.js';
import { dragAndDropEnable, dragCheck } from './lib/functions/dragAndDrop.js';
import { checkTemps } from './lib/modules/temperatureCheck.js';

let powerTimer = 20000;
let jpInit = false;
let dragDropInit = false;
let groupInit = false;
let printerControlList = null;
let printerInfo = '';
const elems = [];

let worker = null;
// Setup webWorker
if (window.Worker) {
    // Yes! Web worker support!
    try {
        if (worker === null) {
            worker = new Worker('/js/lib/modules/workers/monitoringViewsWorker.js');
            worker.onmessage = async function (event) {
                if (event.data != false) {
                    printerInfo = event.data.printersInformation;
                    printerControlList = event.data.printerControlList;
                    if (groupInit === false) {
                        initGroupSelect(event.data.printersInformation);
                        groupInit = true;
                    }
                    if (dragDropInit === false) {
                        const printerList = document.querySelectorAll("[id^='viewPanel-']");
                        printerList.forEach((list) => {
                            const ca = list.id.split('-');
                            const zeeIndex = _.findIndex(printerInfo, function (o) {
                                return o._id == ca[1];
                            });
                            dragAndDropEnable(list, event.data.printersInformation[zeeIndex]);
                            dragDropInit = true;
                        });
                    }
                    if (event.data != false) {
                        if (!(await dragCheck())) {
                            // eslint-disable-next-line no-use-before-define
                            init(
                                event.data.printersInformation,
                                event.data.clientSettings.cameraView,
                                event.data.printerControlList
                            );
                        }
                        if (
                            document
                                .getElementById('printerManagerModal')
                                .classList.contains('show')
                        ) {
                            PrinterManager.init(
                                '',
                                event.data.printersInformation,
                                event.data.printerControlList
                            );
                        } else {
                            printerInfo = event.data.printersInformation;
                            if (powerTimer >= 20000) {
                                event.data.printersInformation.forEach((printer) => {
                                    PowerButton.applyBtn(printer, 'powerBtn-');
                                });
                                powerTimer = 0;
                            } else {
                                powerTimer += 500;
                            }
                            if (event.data.clientSettings.cameraView.currentOp) {
                                currentOperations(
                                    event.data.currentOperations.operations,
                                    event.data.currentOperations.count,
                                    printerInfo
                                );
                            }
                        }
                    }
                }
            };
        }
    } catch (e) {
        console.log(e);
    }
} else {
    // Sorry! No Web Worker support..
    console.log('Web workers not available... sorry!');
}

const returnPrinterInfo = (id) => {
    if (typeof id !== 'undefined') {
        const zeeIndex = _.findIndex(printerInfo, function (o) {
            return o._id == id;
        });
        return printerInfo[zeeIndex];
    }
    return printerInfo;
};

// Setup page listeners...
function grabElements (printer) {
    if (typeof elems[printer._id] !== 'undefined') {
        return elems[printer._id];
    }
    const printerElemens = {
        row: document.getElementById(`viewPanel-${printer._id}`),
        name: document.getElementById(`camPrinterName-${printer._id}`),
        control: document.getElementById(`printerButton-${printer._id}`),
        start: document.getElementById(`camStart-${printer._id}`),
        stop: document.getElementById(`camStop-${printer._id}`),
        camera: document.getElementById(`cameraSRC-${printer._id}`),
        currentFile: document.getElementById(`camName-${printer._id}`),
        camBackground: document.getElementById(`camBody-${printer._id}`),
        progress: document.getElementById(`camProgress-${printer._id}`),
        tools: document.getElementById(`Tools-${printer._id}`),
        enviro: document.getElementById(`Enviro-${printer._id}`),
        extraInfo: document.getElementById(`extraInfo-${printer._id}`),
        timeRemaining: document.getElementById(`timeRemaining-${printer._id}`),
        eta: document.getElementById(`eta-${printer._id}`)
    };
    elems[printer._id] = printerElemens;
    return elems[printer._id];
}

function updateState (printer, clientSettings) {
    const elements = grabElements(printer);
    if (clientSettings.extraInfo) {
        if (elements.extraInfo.classList.contains('d-none')) {
            elements.extraInfo.classList.remove('d-none');
        }

        if (
            typeof printer.currentJob !== 'undefined' &&
      printer.currentJob.printTimeRemaining !== null
        ) {
            let currentDate = new Date();
            currentDate = currentDate.getTime();
            const futureDateString = new Date(
                currentDate + printer.currentJob.printTimeRemaining * 1000
            ).toDateString();
            let futureTimeString = new Date(
                currentDate + printer.currentJob.printTimeRemaining * 1000
            ).toTimeString();
            futureTimeString = futureTimeString.substring(0, 8);
            const dateComplete = `${futureDateString}: ${futureTimeString}`;
            elements.timeRemaining.innerHTML = `
          ${Calc.generateTime(printer.currentJob.printTimeRemaining)}
        `;
            elements.eta.innerHTML = dateComplete;
        } else {
            elements.timeRemaining.innerHTML = `
          ${Calc.generateTime(null)}
        `;
            elements.eta.innerHTML = 'N/A';
        }
    }else{
        document.getElementById("timeOption").disabled = true;
        document.getElementById("timeOption").title = "Only available when Extra Information is activated in System -> Client Settings -> Panel View";
    }
    if (typeof printer.currentJob !== 'undefined') {
        elements.currentFile.setAttribute('title', printer.currentJob.filePath);
        elements.currentFile.innerHTML = `<i class="fas fa-file-code"></i> ${printer.currentJob.filePath}`;
    }

    if (typeof printer.currentJob !== 'undefined') {
        elements.progress.innerHTML = `${Math.floor(printer.currentJob.progress)}%`;
        elements.progress.style.width = `${printer.currentJob.progress}%`;
        elements.progress.classList = `progress-bar progress-bar-striped bg-${printer.printerState.colour.name} percent`;
    } else {
        elements.progress.innerHTML = `${0}%`;
        elements.progress.style.width = `${0}%`;
        elements.progress.classList =
      'progress-bar progress-bar-striped bg-dark percent';
    }
    elements.camBackground.className = `card-body cameraContain ${printer.printerState.colour.category}`;

    let hideClosed = '';

    if (clientSettings.hideClosed) {
        hideClosed = 'hidden';
    }
    let dNone = '';
    if (elements.row.classList.contains('d-none')) {
        dNone = 'd-none';
    }

    let toolTempsActual = 0;
    let toolTempsTarget = 0;
    let enviromentTempsActual = 0;
    let enviromentTempsTarget = 0;

    if (printer.tools !== null) {
        const toolKeys = Object.keys(printer.tools[0]);
        for (let t = 0; t < toolKeys.length; t++) {
            if (toolKeys[t].includes('tool')) {
                if (elements.tools) {
                    toolTempsActual += printer.tools[0][toolKeys[t]].actual;
                    toolTempsTarget += printer.tools[0][toolKeys[t]].target;
                }
            } else if (toolKeys[t].includes('bed')) {
                enviromentTempsActual += printer.tools[0][toolKeys[t]].actual;
                enviromentTempsTarget += printer.tools[0][toolKeys[t]].target;
            } else if (toolKeys[t].includes('chamber')) {
                enviromentTempsActual += printer.tools[0][toolKeys[t]].actual;
                enviromentTempsTarget += printer.tools[0][toolKeys[t]].target;
            }
        }
    }

    if(!isNaN(toolTempsActual)){
        toolTempsActual = toolTempsActual.toFixed(1);
    }
    if(!isNaN(toolTempsTarget)){
        toolTempsTarget = toolTempsTarget.toFixed(1);
    }
    if(!isNaN(enviromentTempsActual)){
        enviromentTempsActual = enviromentTempsActual.toFixed(1);
    }
    if(!isNaN(enviromentTempsTarget)){
        enviromentTempsTarget = enviromentTempsTarget.toFixed(1);
    }
    checkTemps(
        elements.tools,
        toolTempsActual,
        toolTempsTarget,
        printer.otherSettings.temperatureTriggers,
        printer.printerState.colour.category
    );
    checkTemps(
        elements.enviro,
        enviromentTempsActual,
        enviromentTempsTarget,
        printer.otherSettings.temperatureTriggers,
        printer.printerState.colour.category
    );
    if (printer.printerState.colour.category === 'Active') {
        if (printer.camURL != '') {
            elements.row.className = `col-md-4 col-lg-${clientSettings.cameraRows} col-xl-${clientSettings.cameraRows} ${dNone}`;
        }

        elements.control.disabled = false;
        elements.start.disabled = true;
        elements.stop.disabled = false;
        elements.start.classList.add('hidden');
        elements.stop.classList.remove('hidden');
    } else if (
        printer.printerState.colour.category === 'Idle' ||
    printer.printerState.colour.category === 'Complete'
    ) {
        elements.control.disabled = false;
        if (printer.camURL != '') {
            elements.row.className = `col-md-4 col-lg-${clientSettings.cameraRows} col-xl-${clientSettings.cameraRows} ${dNone}`;
        }
        if (
            printer.currentJob !== null &&
      printer.currentJob.fileName !== 'No File Selected'
        ) {
            elements.start.disabled = false;
            elements.stop.disabled = true;
            elements.start.classList.remove('hidden');
            elements.stop.classList.add('hidden');
        } else {
            elements.start.disabled = true;
            elements.stop.disabled = true;
            elements.start.classList.remove('hidden');
            elements.stop.classList.add('hidden');
        }
        if (printer.printerState.colour.category === 'Complete') {
        } else {
        }
    } else if (printer.printerState.state === 'Disconnected') {
        if (printer.camURL != '') {
            elements.row.className = `col-md-4 col-lg-${clientSettings.cameraRows} col-xl-${clientSettings.cameraRows} ${hideClosed} ${dNone}`;
        }
        elements.control.disabled = false;
        elements.start.disabled = true;
        elements.stop.disabled = true;
        elements.start.classList.remove('hidden');
        elements.stop.classList.add('hidden');
    } else if (printer.printerState.colour.category === 'Offline') {
        elements.row.className = `col-md-4 col-lg-${clientSettings.cameraRows} col-xl-${clientSettings.cameraRows} hidden ${dNone}`;
        elements.start.classList.remove('hidden');
        elements.stop.classList.add('hidden');
        elements.start.disabled = true;
        elements.stop.disabled = true;
    }
}
function drawPrinter (printer, clientSettings) {
    let hidden = '';
    if (
        printer.printerState.colour.category === 'Offline' &&
    clientSettings.hideOff
    ) {
        hidden = 'hidden';
    } else if (
        printer.printerState.colour.category === 'Disconnected' &&
    clientSettings.hideClosed
    ) {
        hidden = 'hidden';
    }
    let flipH = "";
    let flipV = "";
    let rotate90 = "";
    if (printer.otherSettings !== null && printer.otherSettings.webCamSettings !== null) {
        if (printer.otherSettings.webCamSettings.flipH) {
            flipH = "rotateY(180deg)";
        }
        if (printer.otherSettings.webCamSettings.flipV) {
            flipV = "rotateX(180deg)";
        }
        if (printer.otherSettings.webCamSettings.rotate90) {
            rotate90 = "rotate(90deg)";
        }
    }

    let name = printer.printerName;
    if (name.includes('http://')) {
        name = name.replace('http://', '');
    } else if (name.includes('https://')) {
        name = name.replace('https://', '');
    }
    let cameraBlock = '';
    if (
        printer.otherSettings.webCamSettings !== null &&
    printer.otherSettings.webCamSettings.webcamEnabled
    ) {
        if (
            typeof printer.cameraURL !== 'undefined' &&
      printer.cameraURL !== null &&
      printer.cameraURL !== ''
        ) {
            cameraBlock = `
      <img
      loading="lazy"
      id="panCamera-${printer._id}"
      width="100%"
      style="transform: ${flipH} ${flipV} ${rotate90}; pointer-events: none;"
      src="${printer.cameraURL}"
      />
  `;
        } else if (
            typeof printer.currentJob !== 'undefined' &&
      printer.currentJob.thumbnail !== null
        ) {
            cameraBlock = `
      <img
      loading="lazy"
      id="panCamera-${printer._id}"
      width="100%"
      style="transform: ${flipH} ${flipV} ${rotate90}; pointer-events: none;"
      src="${printer.printerURL}/${printer.currentJob.thumbnail}"
      />
  `;
        }
    } else if (
        typeof printer.currentJob !== 'undefined' &&
    printer.currentJob.thumbnail !== null
    ) {
        cameraBlock = `
      <img
      loading="lazy"
      id="panCamera-${printer._id}"
      width="100%"
      style="transform: ${flipH} ${flipV} ${rotate90}; pointer-events: none;"
      src="${printer.printerURL}/${printer.currentJob.thumbnail}"
      />
  `;
    }
    let toolList = '';
    let enviroment = '';
    if (printer.currentProfile !== null) {
        for (let e = 0; e < printer.currentProfile.extruder.count; e++) {
            toolList = `<b>Tools: </b><small id="Tools-${printer._id}"><i class="far fa-circle "></i> 0°C <i class="fas fa-bullseye"></i> 0°C</small><br>`;
        }
        let enviromentText = 'Bed';
        if (printer.currentProfile.heatedChamber) {
            enviromentText += ' / Chamber';
        }

        if (printer.currentProfile.heatedBed) {
            enviroment += `<b>${enviromentText} </b><span id="Enviro-${printer._id}"><i class="far fa-circle "></i> 0°C <i class="fas fa-bullseye"></i> 0°C</span>`;
        }
    }
    const printerHTML = `
       <div
      id="viewPanel-${printer._id}"
      class="col-md-4 col-lg-${clientSettings.cameraRows} col-xl-${clientSettings.cameraRows} ${hidden}"  data-jplist-item
    >
      <div class="card text-center mb-0 mt-0 ml-0 mr-0">
        <div
          class="card-header dashHeader"
          id="camHeader-${printer._id}"
        >
          <small
            class="float-left"
            id="camPrinterName-${printer._id}"
            ><button
              type="button"
              class="btn btn-secondary float-right btn-sm"
              data-toggle="modal"
              data-target="#printerManagerModal"
              disabled
            >
                ${printer.printerName}
            </button></small>

          <small>
   
                <div id="powerBtn-${printer._id}" class="btn-group float-right">

                </div>
            <a
              title="Open your Printers Web Interface"
              id="printerWeb-${printer._id}"
              type="button"
              class="tag btn btn-info btn-sm float-right mr-1"
              target="_blank"
              href="${printer.printerURL}"
              role="button"
            >
              <i class="fas fa-globe-europe"></i>
            </a>
            <button
              title="Control Your Printer"
              id="printerButton-${printer._id}"
              type="button"
              class="tag btn btn-primary float-right btn-sm mr-1"
              data-toggle="modal"
              data-target="#printerManagerModal"
              disabled
            >
              <i class="fas fa-print"></i>
            </button>
          </small>
        </div>
        <div
          class="card-body cameraContain text-truncate"
          id="camBody-${printer._id}"
        >
          <div class="d-none index">${printer.sortIndex}</div>
          <div class="camName">
            <small
              class="mb-0 text-center"
              id="camName-${printer._id}"
            >
              <i class="fas fa-file-code"></i> Loading... 
            </small>
          </div>
          <div id="extraInfo-${printer._id}" class="camExtra row d-none">
            <div class="col-6 p-0">
            <small class="text-wrap time" id="timeRemaining-${printer._id}">Loading...</small>
            </div>
            <div class="col-6 p-0 text-wrap">
              <small class="text-wrap" id="eta-${printer._id}">Loading...</small>
            </div>
          </div>
          <img
            loading="lazy"
            id="cameraSRC-${printer._id}"
            width="100%"
            style="transform: ${flipH} ${flipV} ${rotate90}"
            src="${printer.cameraURL}"
            style="pointer-events: none;"
          />
          <div class="camTemps">
            <small
              id="toolTemps-${printer._id}"
              class="mb-0 float-left"
            >
             ${toolList}
            </small>
            <small
              id="enviromentTemps-${printer._id}"
              class="mb-0 float-right"
            >
           ${enviroment}
            </small>
          </div>
          <div class="progress camProgress">

            <div class="d-none percent">Loading...</div>
            <div
              id="camProgress-${printer._id}"
              class="progress-bar progress-bar-striped bg-${printer.printerState.colour.category} percent"
              role="progressbar"
              style="width: 0%"
              aria-valuenow="10"
              aria-valuemin="0"
              aria-valuemax="100"
            >
            0%
            </div>
          </div>
          <small>
            <button
              title="Start your current selected print"
              class="tag btn btn-success camButtons hidden btn-sm"
              id="camStart-${printer._id}"
            >
              Start
            </button>
            <button
              title="Stop your current selected print"
              class="tag btn btn-danger camButtons btn-sm"
              id="camStop-${printer._id}"
            >
              Cancel
            </button>
          </small>
        </div>
      </div>
    </div>
    `;
    document
        .getElementById('camView')
        .insertAdjacentHTML('beforeend', printerHTML);

    const printerCard = document.getElementById(`viewPanel-${printer._id}`);
    printerCard.addEventListener('click', (e) => {
        const printerInfo = returnPrinterInfo();
        // eslint-disable-next-line no-underscore-dangle
        PrinterManager.init(printer._id, printerInfo, printerControlList);
    });
    document
        .getElementById(`camBody-${printer._id}`)
        .addEventListener('dblclick', (e) => {
            doubleClickFullScreen(e.target);
        });

    document
        .getElementById(`camStart-${printer._id}`)
        .addEventListener('click', async (e) => {
            e.target.disabled = true;
            const opts = {
                command: 'start'
            };
            const print = returnPrinterInfo(printer._id);
            OctoPrintClient.jobAction(print, opts, e);
        });
    document
        .getElementById(`camStop-${printer._id}`)
        .addEventListener('click', (e) => {
            const print = returnPrinterInfo(printer._id);
            const name = printer.printerName;
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
                callback (result) {
                    if (result) {
                        e.target.disabled = true;
                        const opts = {
                            command: 'cancel'
                        };
                        OctoPrintClient.jobAction(print, opts, e);
                    }
                }
            });
        });
    return 'done';
}

async function init (printers, clientSettings) {
    for (let p = 0; p < printers.length; p++) {
        if (!document.getElementById(`viewPanel-${printers[p]._id}`)) {
            if (!jpInit) {
                if (
                    printers[p].cameraURL !== '' &&
          printers[p].printerState.colour.category !== 'Offline'
                ) {
                    drawPrinter(printers[p], clientSettings);
                }
            }
        } else {
            updateState(printers[p], clientSettings);
        }
    }
    if (jpInit) {
        const fullscreenElement =
      document.fullscreenElement ||
      document.mozFullScreenElement ||
      document.webkitFullscreenElement;
        if (!fullscreenElement) {
            jplist.refresh();
        }
    } else {
        jpInit = true;
        await jplist.init({
            storage: 'localStorage', // 'localStorage', 'sessionStorage' or 'cookies'
            storageName: 'view-storage'
        });
    }
}
