import OctoPrintClient from './lib/octoprint.js';
import UI from './lib/functions/ui.js';
import Calc from './lib/functions/calc.js';
import currentOperations from './lib/modules/currentOperations.js';
import PrinterManager from './lib/modules/printerManager.js';
import PowerButton from './lib/modules/powerButton.js';
import initGroupSelect from './lib/modules/groupSelection.js';
import { dragAndDropEnable, dragCheck } from './lib/functions/dragAndDrop.js';
import { checkTemps } from './lib/modules/temperatureCheck.js';
import { checkFilamentManager } from './lib/modules/filamentGrab.js';

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
                            init(
                                event.data.printersInformation,
                                event.data.clientSettings.listView,
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
                            if (event.data.clientSettings.listView.currentOp) {
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
    } else {
        return printerInfo;
    }
};

function grabElements (printer) {
    if (typeof elems[printer._id] !== 'undefined') {
        return elems[printer._id];
    } else {
        const printerElemens = {
            row: document.getElementById('viewPanel-' + printer._id),
            index: document.getElementById('listIndex-' + printer._id),
            name: document.getElementById('listName-' + printer._id),
            control: document.getElementById('printerButton-' + printer._id),
            start: document.getElementById('listPlay-' + printer._id),
            stop: document.getElementById('listCancel-' + printer._id),
            pause: document.getElementById('listCancel-' + printer._id),
            restart: document.getElementById('listCancel-' + printer._id),
            resume: document.getElementById('listCancel-' + printer._id),
            currentFile: document.getElementById('listFile-' + printer._id),
            filament: document.getElementById('listFilament-' + printer._id),
            state: document.getElementById('listState-' + printer._id),
            printTime: document.getElementById('listPrintTime-' + printer._id),
            tool0: document.getElementById('listE0Temp-' + printer._id),
            bed: document.getElementById('listBedTemp-' + printer._id),
            progress: document.getElementById('listProgress-' + printer._id),
            extraInfoCol: document.getElementById('extraInfoCol-' + printer._id),
            extraInfoPercentCol: document.getElementById(
                'extraInfoColPercent-' + printer._id
            ),
            extraInfoPercent: document.getElementById('extraInfoPercent'),
            extraInfoTitle: document.getElementById('extraInfoTitle'),
            eta: document.getElementById('eta-' + printer._id),
            percent: document.getElementById('percent-' + printer._id)
        };
        elems[printer._id] = printerElemens;
        return elems[printer._id];
    }
}
async function updateState (printer, clientSettings) {
    if (printer.printerState.colour.category !== 'Offline') {
        const elements = grabElements(printer);
        elements.state.innerHTML = printer.printerState.state;
        elements.state.classList = printer.printerState.colour.category;
        elements.name.innerHTML = printer.printerName;
        elements.row.classList = printer.printerState.colour.category;

        if (clientSettings.extraInfo) {
            elements.progress.classList = `progress-bar progress-bar-striped bg-${printer.printerState.colour.name}`;
            if (elements.extraInfoCol.classList.contains('d-none')) {
                elements.extraInfoCol.classList.remove('d-none');
            }
            if (elements.extraInfoPercentCol.classList.contains('d-none')) {
                elements.extraInfoPercentCol.classList.remove('d-none');
            }
            if (elements.extraInfoPercent.classList.contains('d-none')) {
                elements.extraInfoPercent.classList.remove('d-none');
            }
            if (elements.extraInfoTitle.classList.contains('d-none')) {
                elements.extraInfoTitle.classList.remove('d-none');
            }
        }
        if (typeof printer.currentJob !== 'undefined') {
            elements.percent.innerHTML = Math.floor(printer.currentJob.progress) + '%';

            elements.progress.style.width = printer.currentJob.progress + '%';
        } else {
            elements.percent.innerHTML = 0 + '%';

            elements.progress.style.width = 0 + '%';
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
            const dateComplete = futureDateString + ': ' + futureTimeString;
            elements.printTime.innerHTML = `
          ${Calc.generateTime(printer.currentJob.printTimeRemaining)}
        `;
            elements.eta.innerHTML = dateComplete;
        } else {
            elements.printTime.innerHTML = `
          ${Calc.generateTime(null)}
        `;
            elements.eta.innerHTML = 'N/A';
        }
        if (typeof printer.currentJob !== 'undefined') {
            elements.currentFile.setAttribute('title', printer.currentJob.filePath);
            elements.currentFile.innerHTML =
      '<i class="fas fa-file-code"></i> ' + printer.currentJob.filePath;
        }

        let hideClosed = '';
        let hideOffline = '';
        if (clientSettings.hideOff) {
            hideOffline = 'hidden';
        }
        if (clientSettings.hideClosed) {
            hideClosed = 'hidden';
        }
        let dNone = '';
        if (elements.row.classList.contains('d-none')) {
            dNone = 'd-none';
        }
        if (printer.tools !== null) {
            const toolKeys = Object.keys(printer.tools[0]);
            for (let t = 0; t < toolKeys.length; t++) {
                if (toolKeys[t].includes('tool')) {
                    const toolNumber = toolKeys[t].replace('tool', '');
                    if (
                        document.getElementById(printer._id + '-temperature-' + toolNumber)
                    ) {
                        checkTemps(
                            document.getElementById(printer._id + '-temperature-' + toolNumber),
                            printer.tools[0][toolKeys[t]].actual,
                            printer.tools[0][toolKeys[t]].target,
                            printer.otherSettings.temperatureTriggers,
                            printer.printerState.colour.category
                        );
                    } else {
                        checkTemps(
                            document.getElementById(printer._id + '-temperature-' + toolNumber),
                            0,
                            0,
                            printer.otherSettings.temperatureTriggers,
                            printer.printerState.colour.category
                        );
                    }
                } else if (toolKeys[t].includes('bed')) {
                    if (elements.bed) {
                        checkTemps(
                            elements.bed,
                            printer.tools[0][toolKeys[t]].actual,
                            printer.tools[0][toolKeys[t]].target,
                            printer.otherSettings.temperatureTriggers,
                            printer.printerState.colour.category
                        );
                    }
                } else if (toolKeys[t].includes('chamber')) {
                    if (elements.chamber) {
                        checkTemps(
                            elements.chamber,
                            printer.tools[0][toolKeys[t]].actual,
                            printer.tools[0][toolKeys[t]].target,
                            printer.otherSettings.temperatureTriggers,
                            printer.printerState.colour.category
                        );
                    }
                }
            }
        }
        if (Array.isArray(printer.selectedFilament)) {
            const spoolList = '';
            for (let i = 0; i < printer.selectedFilament.length; i++) {
                const tool = document.getElementById(`${printer._id}-spool-${i}`);
                if (printer.selectedFilament[i] !== null) {
                    const filamentManager = await checkFilamentManager();
                    if (filamentManager) {
                        tool.innerHTML = `${printer.selectedFilament[i].spools.material}`;
                    } else {
                        tool.innerHTML = `${printer.selectedFilament[i].spools.material}`;
                    }
                } else {
                    tool.innerHTML = 'No Spool';
                }
            }
        } else {
        }
        if (printer.printerState.colour.category === 'Active') {
            // Set the state
            if (elements.row.classList.contains(hideClosed)) {
                elements.row.classList.remove(hideClosed);
            }
            if (elements.row.classList.contains(hideOffline)) {
                elements.row.classList.remove(hideOffline);
            }

            elements.control.disabled = false;
            elements.start.disabled = true;
            elements.stop.disabled = false;
        } else if (
            printer.printerState.colour.category === 'Idle' ||
    printer.printerState.colour.category === 'Complete'
        ) {
            if (elements.row.classList.contains(hideClosed)) {
                elements.row.classList.remove(hideClosed);
            }
            if (elements.row.classList.contains(hideOffline)) {
                elements.row.classList.remove(hideOffline);
            }
            elements.control.disabled = false;
            if (
                printer.currentJob !== null &&
      printer.currentJob.fileName !== 'No File Selected'
            ) {
                elements.start.disabled = false;
                elements.stop.disabled = true;
            } else {
                elements.start.disabled = true;
                elements.stop.disabled = true;
            }
        } else if (printer.printerState.state === 'Disconnected') {
            if (hideClosed != '') {
                elements.row.classList.add(hideClosed);
            }
            elements.control.disabled = false;
            elements.start.disabled = true;
            elements.stop.disabled = true;
        } else if (printer.printerState.colour.category === 'Offline') {
            if (hideOffline != '') {
                elements.row.classList.add(hideOffline);
            }
            elements.control.disabled = true;
            elements.start.disabled = true;
            elements.stop.disabled = true;
        }
    }
    // if (jpInit) {
    //   jplist.refresh();
    // } else {
    //   jpInit = true;
    //   jplist.init({
    //     storage: "localStorage", //'localStorage', 'sessionStorage' or 'cookies'
    //     storageName: "view-storage",
    //   });
    // }
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
    console.log(hidden);
    let flipH = '';
    let flipV = '';
    let rotate90 = '';
    if (printer.otherSettings.webCamSettings !== null) {
        if (printer.otherSettings.webCamSettings.flipH) {
            flipH = 'rotateY(180deg)';
        } else if (printer.otherSettings.webCamSettings.flipV) {
            flipV = 'rotateX(180deg)';
        } else if (printer.otherSettings.webCamSettings.rotate90) {
            rotate90 = 'rotate(90deg)';
        }
    }

    let name = printer.printerName;
    if (name.includes('http://')) {
        name = name.replace('http://', '');
    } else if (name.includes('https://')) {
        name = name.replace('https://', '');
    }

    let toolList = '';
    let enviroment = '';
    if (printer.currentProfile !== null) {
        for (let e = 0; e < printer.currentProfile.extruder.count; e++) {
            toolList += '<div class="btn-group btn-block m-0" role="group" aria-label="Basic example">';
            toolList += `<button type="button" class="btn btn-secondary btn-sm" disabled><b>Tool ${e} </b></button><button disabled id="${printer._id}-spool-${e}" type="button" class="btn btn-secondary  btn-sm"> No Spool </button><button id="${printer._id}-temperature-${e}" type="button" class="btn btn-secondary btn-sm" disabled><i class="far fa-circle "></i> 0°C <i class="fas fa-bullseye"></i> 0°C</button>`;
            toolList += '</div>';
        }
        if (printer.currentProfile.heatedBed) {
            enviroment += `<small
      id="panBedTemp-${printer._id}"
    class="mb-0 float-left"
          >
          </small>`;
        }
        if (printer.currentProfile.heatedChamber) {
            enviroment += `<small
      id="panChamberTemp-${printer._id}"
    class="mb-0 float-right"

          </small>`;
        }
    }

    const printerHTML = `
        <tr
          class="p-0 ${printer.printerState.colour.category} ${hidden}"
          id="viewPanel-${printer._id}"
          data-jplist-item>
          <td id="listSortIndex-${printer._id}" class="index">
            ${printer.sortIndex}
          </td>
          <td id="listName-${printer._id}" class="${printer.group.replace(
    / /g,
    '_'
)}">
            ${printer.printerName}
          </td>
          <td>
                <button title="Control Your Printer"
                        id="printerButton-${printer._id}"
                        type="button"
                        class="tag btn btn-primary btn-sm"
                        data-toggle="modal"
                        data-target="#printerManagerModal" disabled
                >
                  <i class="fas fa-print"></i>
                </button>
                <a title="Open your Printers Web Interface"
                        id="printerWeb-${printer._id}"
                   type="button"
                   class="tag btn btn-info btn-sm"
                   target="_blank" href="${printer.printerURL}"
                   role="button">
                  <i class="fas fa-globe-europe"></i>
                </a>
                <div id="powerBtn-${printer._id}" class="btn-group">
        
                </div>
          </td>
          <td>
            <button title="Start your current selected file"
              id="listPlay-${printer._id}"
              type="button"
              class="tag btn btn-success btn-sm"
              disabled
            >
              <i class="fas fa-play"></i>
            </button>
            <button title="Cancel your current print"
              id="listCancel-${printer._id}"
              type="button"
              class="tag btn btn-danger btn-sm"
              disabled
            >
              <i class="fas fa-square"></i>
            </button>
          </td>
          <td>
               <p id="listFile-${
    printer._id
}" title="Loading..." class="mb-1 tag">
            <i class="fas fa-file-code"></i> No File Selected <p>
          </td>
          <td id="listState-${printer._id}" class="${
    printer.printerState.colour.category
}">
           ${printer.printerState.state}
          </td>
          <td id="listPrintTime-${printer._id}" class="time">
               Loading...
          </td>
          <td id="extraInfoColPercent-${printer._id}" class="d-none">
            <p class="mb-0 percent" id="percent-${printer._id}">Loading...</p>
            <div class="progress m-0 p-0">
              <div id="listProgress-${
    printer._id
}" class="progress-bar progress-bar-striped bg-secondary percent" role="progressbar progress-bar-striped" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </td>
          <td id="extraInfoCol-${printer._id}" class="d-none">
            <p class="mb-0" id="eta-${printer._id}">Loading...</p>
          </td>
          <td id="listE0Temp-${printer._id}">
           ${toolList}
          </td>
          <td id="listBedTemp-${printer._id}">
            ${enviroment}
          </td>
        </tr>
    `;
    document
        .getElementById('listViewTable')
        .insertAdjacentHTML('beforeend', printerHTML);
    // Setup page listeners...
    // Setup page listeners...
    const printerCard = document.getElementById(`viewPanel-${printer._id}`);
    printerCard.addEventListener('click', (e) => {
        const printerInfo = returnPrinterInfo();
        // eslint-disable-next-line no-underscore-dangle
        PrinterManager.init(printer._id, printerInfo, printerControlList);
    });
    document
        .getElementById('listPlay-' + printer._id)
        .addEventListener('click', (e) => {
            e.target.disabled = true;
            const opts = {
                command: 'start'
            };
            const print = returnPrinterInfo(printer._id);
            OctoPrintClient.jobAction(print, opts, e);
        });
    document
        .getElementById('listCancel-' + printer._id)
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
        if (!document.getElementById('viewPanel-' + printers[p]._id)) {
            if (!jpInit) {
                drawPrinter(printers[p], clientSettings);
            }
        } else {
            updateState(printers[p], clientSettings);
        }
    }
    if (jpInit) {
        jplist.refresh();
    } else {
        jpInit = true;
        await jplist.init({
            storage: 'localStorage', // 'localStorage', 'sessionStorage' or 'cookies'
            storageName: 'view-storage'
        });
    }
}
