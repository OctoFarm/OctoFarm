import OctoPrintClient from './lib/octoprint.js'
import UI from './lib/functions/ui.js'
import Calc from './lib/functions/calc.js'
import currentOperations from './lib/modules/currentOperations.js'
import PrinterManager from './lib/modules/printerManager.js'
import doubleClickFullScreen from './lib/functions/fullscreen.js'
import initGroupSelect from './lib/modules/groupSelection.js'
import PowerButton from './lib/modules/powerButton.js'
import { dragAndDropEnable, dragCheck } from './lib/functions/dragAndDrop.js'
import { checkTemps } from './lib/modules/temperatureCheck.js'
import { checkFilamentManager } from './lib/modules/filamentGrab.js'

let powerTimer = 20000
let jpInit = false
let dragDropInit = false
let groupInit = false
let printerControlList = null
let printerInfo = ''
const elems = []

let worker = null
// Setup webWorker
if (window.Worker) {
  // Yes! Web worker support!
  try {
    if (worker === null) {
      worker = new Worker('/js/lib/modules/workers/monitoringViewsWorker.js')
      worker.onmessage = async function (event) {
        if (event.data != false) {
          printerInfo = event.data.printersInformation
          printerControlList = event.data.printerControlList
          if (groupInit === false) {
            initGroupSelect(event.data.printersInformation)
            groupInit = true
          }
          if (dragDropInit === false) {
            const printerList = document.querySelectorAll("[id^='viewPanel-']")
            printerList.forEach((list) => {
              const ca = list.id.split('-')
              const zeeIndex = _.findIndex(printerInfo, function (o) {
                return o._id == ca[1]
              })
              dragAndDropEnable(list, event.data.printersInformation[zeeIndex])
              dragDropInit = true
            })
          }
          if (event.data != false) {
            if (
              document
                .getElementById('printerManagerModal')
                .classList.contains('show')
            ) {
              PrinterManager.init(
                '',
                event.data.printersInformation,
                event.data.printerControlList
              )
            } else {
              printerInfo = event.data.printersInformation
              if (powerTimer >= 20000) {
                event.data.printersInformation.forEach((printer) => {
                  PowerButton.applyBtn(printer)
                })
                powerTimer = 0
              } else {
                powerTimer += 500
              }
              if (event.data.clientSettings.panelView.currentOp) {
                currentOperations(
                  event.data.currentOperations.operations,
                  event.data.currentOperations.count,
                  printerInfo
                )
              }
              if (!(await dragCheck())) {
                init(
                  event.data.printersInformation,
                  event.data.clientSettings.panelView,
                  event.data.printerControlList
                )
              }
            }
          }
        } else {
          UI.createAlert(
            'error',
            'Communication with the server has been suddenly lost, trying to re-establish connection...',
            10000,
            'Clicked'
          )
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
} else {
  // Sorry! No Web Worker support..
  console.log('Web workers not available... sorry!')
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
const returnPrinterInfo = (id) => {
  if (typeof id !== 'undefined') {
    const zeeIndex = _.findIndex(printerInfo, function (o) {
      return o._id == id
    })
    return printerInfo[zeeIndex]
  } else {
    return printerInfo
  }
}

function grabElements (printer) {
  if (typeof elems[printer._id] !== 'undefined') {
    return elems[printer._id]
  } else {
    const printerElemens = {
      row: document.getElementById('viewPanel-' + printer._id),
      index: document.getElementById('panIndex-' + printer._id),
      name: document.getElementById('panName-' + printer._id),
      control: document.getElementById('printerButton-' + printer._id),
      start: document.getElementById('panPrintStart-' + printer._id),
      stop: document.getElementById('panStop-' + printer._id),
      restart: document.getElementById('panRestart-' + printer._id),
      pause: document.getElementById('panPrintPause-' + printer._id),
      resume: document.getElementById('panResume-' + printer._id),
      camera: document.getElementById('panCamera' + printer._id),
      currentFile: document.getElementById('panFileName-' + printer._id),
      filament: document.getElementById('listFilament-' + printer._id),
      state: document.getElementById('panState-' + printer._id),
      progress: document.getElementById('panProgress-' + printer._id),
      bed: document.getElementById('panBedTemp-' + printer._id),
      chamber: document.getElementById('panChamberTemp-' + printer._id),
      extraInfo: document.getElementById('extraInfo-' + printer._id),
      timeRemaining: document.getElementById('timeRemaining-' + printer._id),
      eta: document.getElementById('eta-' + printer._id)
    }
    elems[printer._id] = printerElemens
    return elems[printer._id]
  }
}
async function updateState (printer, clientSettings) {
  const elements = grabElements(printer)
  elements.state.innerHTML = printer.printerState.state
  elements.state.className = `btn btn-block ${printer.printerState.colour.category} mb-1 mt-1`
  elements.index.innerHTML = `
        <h6 class="float-left mb-0" id="panIndex-${printer._id}">
          <button id="panName-1" type="button" class="btn btn-secondary mb-0" role="button" disabled="">
            ${printer.printerName}
          </button>
        </h6>
        `
  if (clientSettings.extraInfo) {
    if (elements.extraInfo.classList.contains('d-none')) {
      elements.extraInfo.classList.remove('d-none')
    }

    if (
      typeof printer.currentJob !== 'undefined' &&
      printer.currentJob.printTimeRemaining !== null
    ) {
      let currentDate = new Date()
      currentDate = currentDate.getTime()
      const futureDateString = new Date(
        currentDate + printer.currentJob.printTimeRemaining * 1000
      ).toDateString()
      let futureTimeString = new Date(
        currentDate + printer.currentJob.printTimeRemaining * 1000
      ).toTimeString()
      futureTimeString = futureTimeString.substring(0, 8)
      const dateComplete = futureDateString + ': ' + futureTimeString
      elements.timeRemaining.innerHTML = `
          ${Calc.generateTime(printer.currentJob.printTimeRemaining)}
        `
      elements.eta.innerHTML = dateComplete
    } else {
      elements.timeRemaining.innerHTML = `
          ${Calc.generateTime(null)}
        `
      elements.eta.innerHTML = 'N/A'
    }
  }

  if (typeof printer.currentJob !== 'undefined') {
    elements.currentFile.setAttribute('title', printer.currentJob.filePath)
    elements.currentFile.innerHTML =
      '<i class="fas fa-file-code"></i> ' + printer.currentJob.filePath
  }

  if (typeof printer.currentJob !== 'undefined') {
    elements.progress.innerHTML = Math.floor(printer.currentJob.progress) + '%'
    elements.progress.style.width = printer.currentJob.progress + '%'
    elements.progress.classList = `progress-bar progress-bar-striped bg-${printer.printerState.colour.name} percent`
  } else {
    elements.progress.innerHTML = 0 + '%'
    elements.progress.style.width = 0 + '%'
    elements.progress.classList = 'progress-bar progress-bar-striped bg-dark percent'
  }

  let hideClosed = ''
  let hideOffline = ''
  if (clientSettings.hideOff) {
    hideOffline = 'hidden'
  }
  if (clientSettings.hideClosed) {
    hideClosed = 'hidden'
  }
  let dNone = ''
  if (elements.row.classList.contains('d-none')) {
    dNone = 'd-none'
  }
  if (printer.tools !== null) {
    const toolKeys = Object.keys(printer.tools[0])
    for (let t = 0; t < toolKeys.length; t++) {
      if (toolKeys[t].includes('tool')) {
        const toolNumber = toolKeys[t].replace('tool', '')
        if (
          document.getElementById(printer._id + '-temperature-' + toolNumber)
        ) {
          checkTemps(
            document.getElementById(printer._id + '-temperature-' + toolNumber),
            printer.tools[0][toolKeys[t]].actual,
            printer.tools[0][toolKeys[t]].target,
            printer.otherSettings.temperatureTriggers,
            printer.printerState.colour.category
          )
        } else {
          checkTemps(
            document.getElementById(printer._id + '-temperature-' + toolNumber),
            0,
            0,
            printer.otherSettings.temperatureTriggers,
            printer.printerState.colour.category
          )
        }
      } else if (toolKeys[t].includes('bed')) {
        if (elements.bed) {
          checkTemps(
            elements.bed,
            printer.tools[0][toolKeys[t]].actual,
            printer.tools[0][toolKeys[t]].target,
            printer.otherSettings.temperatureTriggers,
            printer.printerState.colour.category
          )
        }
      } else if (toolKeys[t].includes('chamber')) {
        if (elements.chamber) {
          checkTemps(
            elements.chamber,
            printer.tools[0][toolKeys[t]].actual,
            printer.tools[0][toolKeys[t]].target,
            printer.otherSettings.temperatureTriggers,
            printer.printerState.colour.category
          )
        }
      }
    }
  }
  if (Array.isArray(printer.selectedFilament)) {
    const spoolList = ''
    for (let i = 0; i < printer.selectedFilament.length; i++) {
      const tool = document.getElementById(`${printer._id}-spool-${i}`)
      if (tool) {
        if (printer.selectedFilament[i] !== null) {
          const filamentManager = await checkFilamentManager()
          if (filamentManager) {
            tool.innerHTML = `${printer.selectedFilament[i].spools.material}`
          } else {
            tool.innerHTML = `${printer.selectedFilament[i].spools.material}`
          }
        } else {
          tool.innerHTML = 'No Spool'
        }
      }
    }
  } else {
  }
  // Set the state
  if (printer.printerState.colour.category === 'Active') {
    if (printer.camURL != '') {
      elements.row.className = 'col-sm-12 col-md-4 col-lg-3 col-xl-2 ' + dNone
    }
    elements.control.disabled = false
    elements.start.disabled = true
    elements.stop.disabled = false
    if (printer.printerState.state === 'Pausing') {
      elements.pause.disabled = true
      elements.resume.disabled = true
      elements.restart.disabled = true
      elements.start.classList.remove('hidden')
      elements.pause.classList.remove('hidden')
      elements.resume.classList.add('hidden')
      elements.restart.classList.add('hidden')
    } else if (printer.printerState.state === 'Paused') {
      elements.pause.disabled = true
      elements.resume.disabled = false
      elements.restart.disabled = false
      elements.start.classList.add('hidden')
      elements.pause.classList.add('hidden')
      elements.resume.classList.remove('hidden')
      elements.restart.classList.remove('hidden')
    } else {
      elements.start.classList.remove('hidden')
      elements.pause.classList.remove('hidden')
      elements.resume.classList.add('hidden')
      elements.restart.classList.add('hidden')
      elements.pause.disabled = false
      elements.resume.disabled = true
      elements.restart.disabled = true
    }
  } else if (
    printer.printerState.colour.category === 'Idle' ||
    printer.printerState.colour.category === 'Complete'
  ) {
    if (printer.camURL != '') {
      elements.row.className = 'col-sm-12 col-md-4 col-lg-3 col-xl-2 ' + dNone
    }
    elements.control.disabled = false
    if (
      printer.currentJob !== null &&
      printer.currentJob.fileName !== 'No File Selected'
    ) {
      elements.start.disabled = false
      elements.stop.disabled = true
      elements.pause.disabled = true
      elements.resume.disabled = true
      elements.restart.disabled = true
    } else {
      elements.start.disabled = true
      elements.stop.disabled = true
      elements.pause.disabled = true
      elements.resume.disabled = true
      elements.restart.disabled = true
    }
    if (printer.printerState.state === 'Paused') {
      elements.pause.disabled = true
      elements.resume.disabled = false
      elements.restart.disabled = false
      elements.start.classList.add('hidden')
      elements.pause.classList.add('hidden')
      elements.resume.classList.remove('hidden')
      elements.restart.classList.remove('hidden')
    } else {
      elements.start.classList.remove('hidden')
      elements.pause.classList.remove('hidden')
      elements.resume.classList.add('hidden')
      elements.restart.classList.add('hidden')
      elements.pause.disabled = true
      elements.resume.disabled = true
      elements.restart.disabled = true
    }
    if (printer.printerState.colour.category === 'Complete') {
    }
  } else if (printer.printerState.state === 'Disconnected') {
    if (printer.camURL != '') {
      elements.row.className =
        'col-sm-12 col-md-4 col-lg-3 col-xl-2' + ' ' + hideClosed + ' ' + dNone
    }

    elements.control.disabled = false
    elements.start.disabled = true
    elements.stop.disabled = true
    elements.pause.disabled = true
    elements.resume.disabled = true
    elements.restart.disabled = true
    elements.start.classList.remove('hidden')
    elements.pause.classList.remove('hidden')
    elements.resume.classList.add('hidden')
    elements.restart.classList.add('hidden')
  } else if (printer.printerState.colour.category === 'Offline') {
    if (printer.camURL != '') {
      elements.row.className =
        'col-sm-12 col-md-4 col-lg-3 col-xl-2' +
        ' ' +
        hideOffline +
        ' ' +
        dNone
    }

    elements.control.disabled = true
    elements.start.disabled = true
    elements.stop.disabled = true
    elements.pause.disabled = true
    elements.resume.disabled = true
    elements.restart.disabled = true
    elements.start.classList.remove('hidden')
    elements.pause.classList.remove('hidden')
    elements.resume.classList.add('hidden')
    elements.restart.classList.add('hidden')
  }
}
function drawPrinter (printer, clientSettings) {
  let hidden = ''
  if (
    printer.printerState.colour.category === 'Offline' &&
    clientSettings.hideOff
  ) {
    hidden = 'hidden'
  } else if (
    printer.printerState.colour.category === 'Disconnected' &&
    clientSettings.hideClosed
  ) {
    hidden = 'hidden'
  }
  let flipH = ''
  let flipV = ''
  let rotate90 = ''
  if (printer.otherSettings.webCamSettings !== null) {
    if (printer.otherSettings.webCamSettings.flipH) {
      flipH = 'rotateY(180deg)'
    } else if (printer.otherSettings.webCamSettings.flipV) {
      flipV = 'rotateX(180deg)'
    } else if (printer.otherSettings.webCamSettings.rotate90) {
      rotate90 = 'rotate(90deg)'
    }
  }

  let name = printer.printerName
  if (name.includes('http://')) {
    name = name.replace('http://', '')
  } else if (name.includes('https://')) {
    name = name.replace('https://', '')
  }
  let cameraBlock = ''
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
  `
    } else {
      if (
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
  `
      }
    }
  } else {
    if (
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
  `
    }
  }
  let toolList = ''
  let enviroment = ''
  if (printer.currentProfile !== null) {
    for (let e = 0; e < printer.currentProfile.extruder.count; e++) {
      toolList += '<div class="btn-group btn-block m-0" role="group" aria-label="Basic example">'
      toolList += `<button type="button" class="btn btn-secondary btn-sm" disabled><b>Tool ${e} </b></button><button disabled id="${printer._id}-spool-${e}" type="button" class="btn btn-secondary  btn-sm"> No Spool </button><button id="${printer._id}-temperature-${e}" type="button" class="btn btn-secondary btn-sm" disabled><i class="far fa-circle "></i> 0°C <i class="fas fa-bullseye"></i> 0°C</button>`
      toolList += '</div>'
    }

    if (printer.currentProfile.heatedBed) {
      enviroment += `<small
    class="mb-0 float-left"
          ><b>Bed: </b><span id="panBedTemp-${printer._id}"><i class="far fa-circle "></i> 0°C <i class="fas fa-bullseye"></i> 0°C</span>
          </small>`
    }
    if (printer.currentProfile.heatedChamber) {
      enviroment += `<small
    class="mb-0 float-right"
        ><b>Chamber: </b><span  id="panChamberTemp-${printer._id}"><i class="far fa-circle "></i> 0°C <i class="fas fa-bullseye"></i> 0°C</span>
          </small>`
    }
  }

  const printerHTML = `
        <div class="col-sm-12 col-md-4 col-lg-3 col-xl-2" id="viewPanel-${
          printer._id
        }"  data-jplist-item>
        <div class="card mt-1 mb-1 ml-1 mr-1 text-center ${printer.group.replace(
          '/_/g',
          ' '
        )}">
          <div class="card-header dashHeader">
            <h6
              class="float-left mb-0"
              id="panIndex-${printer._id}"
            >
              <button
                id="panName-${printer._id}"
                type="button"
                class="btn btn-secondary mb-0 btn-sm"
                role="button"
                disabled
              >
                ${name}
              </button>
            </h6>
              <div id="powerBtn-${printer._id}" class="btn-group float-right">

              </div>
              <a title="Open your Printers Web Interface"
                 id="printerWeb-${printer._id}"
                 type="button"
                 class="tag btn btn-info btn-sm float-right mr-1"
                 target="_blank" href="${printer.printerURL}"
                 role="button">
                <i class="fas fa-globe-europe"></i>
              </a>
              <button
                      title="Control Your Printer"
                      id="printerButton-${printer._id}"
                      type="button"
                      class="tag btn btn-primary float-right btn-sm mr-1"
                      data-toggle="modal"
                      data-target="#printerManagerModal" disabled
              >
                <i class="fas fa-print"></i>
              </button>
          </div>
          <div class="card-body pt-1 pb-0 pl-2 pr-2">
            <div class="d-none index">${printer.sortIndex}</div>
            <button
                    id="panFileName-${printer._id}"
                    type="button"
                    class="tag btn btn-block btn-secondary mb-0 text-truncate btn-sm"
                    role="button"
                    title="Loading..."
                    disabled
            >
                <i class="fas fa-file-code" ></i> No File Selected
            </button>
            <div
              id="cameraContain-${printer._id}"
              class="cameraContain"
            >
                ${cameraBlock}
            </div>
            <div class="progress">
              <div
                id="panProgress-${printer._id}"
                class="progress-bar progress-bar-striped bg-${
                  printer.printerState.colour.name
                } percent"
                role="progressbar progress-bar-striped"
                style="width: 0%"
                aria-valuenow="0"
                aria-valuemin="0"
                aria-valuemax="100"
              >
                0%
              </div>
            </div>
            <button
              id="panState-${printer._id}"
              type="button"
              class="btn btn-block ${
                printer.printerState.colour.category
              } mb-1 mt-1 btn-sm"
              role="button"
              disabled
            >
              ${printer.printerState.state}
            </button>
            <center>
              <button
                title="Start your currently selected print"
                id="panPrintStart-${printer._id}"
                type="button"
                class="tag btn btn-success mt-1 mb-1 btn-sm"
                role="button"
                disabled
              >
                <i class="fas fa-print"></i> Print
              </button>
              <button
                      title="Pause your current print"
                id="panPrintPause-${printer._id}"
                type="button"
                class="tag btn btn-light mt-1 mb-1 btn-sm"
                role="button"
                disabled
              >
                <i class="fas fa-pause"></i> Pause
              </button>
              <button
                title="Restart your current print"
                id="panRestart-${printer._id}"
                type="button"
                class="tag btn btn-danger mt-1 mb-1 hidden btn-sm"
                role="button"
                disabled
              >
                <i class="fas fa-undo"></i> Restart
              </button>
              <button
                      title="Resume your current print"
                id="panResume-${printer._id}"
                type="button"
                class="tag btn btn-success mt-1 mb-1 hidden btn-sm"
                role="button"
                disabled
              >
                <i class="fas fa-redo"></i> Resume
              </button>
              <button
                      title="Stop your current print"
                id="panStop-${printer._id}"
                type="button"
                class="tag btn btn-danger mt-1 mb-1 btn-sm"
                role="button"
                disabled
              >
                <i class="fas fa-square"></i> Cancel
              </button>
            </center>
          </div>
          <div id="extraInfo-${printer._id}" class="row d-none">
              <div class="col-6">
                <h5 class="mb-0"><small>Time Remaining</small></h5>
                <p class="mb-0"><small class="time" id="timeRemaining-${
                  printer._id
                }">Loading...</small></p>
              </div>
              <div class="col-6">
                <h5 class="mb-0"><small>ETA</small></h5>
                <p class="mb-0"><small id="eta-${
                  printer._id
                }">Loading...</small></p>
              </div>



          </div>


          <div
            id="listFilament-${printer._id}" disabled
            class="bg-dark"
          >
           ${toolList}
          </div>

          <div class="card-footer text-muted dashFooter">
                ${enviroment}
          </div>
        </div>
      </div>
    `
  document
    .getElementById('listView')
    .insertAdjacentHTML('beforeend', printerHTML)
  // Setup page listeners...
  const printerCard = document.getElementById('viewPanel-' + printer._id)
  printerCard.addEventListener('click', (e) => {
    const printerInfo = returnPrinterInfo()
    // eslint-disable-next-line no-underscore-dangle
    PrinterManager.init(printer._id, printerInfo, printerControlList)
  })
  document
    .getElementById('cameraContain-' + printer._id)
    .addEventListener('dblclick', (e) => {
      doubleClickFullScreen(e.target)
    })
  document
    .getElementById('panPrintStart-' + printer._id)
    .addEventListener('click', async (e) => {
      e.target.disabled = true
      const opts = {
        command: 'start'
      }
      const print = returnPrinterInfo(printer._id)
      OctoPrintClient.jobAction(print, opts, e)
    })
  document
    .getElementById('panPrintPause-' + printer._id)
    .addEventListener('click', (e) => {
      e.target.disabled = true
      const opts = {
        command: 'pause',
        action: 'pause'
      }
      const print = returnPrinterInfo(printer._id)
      OctoPrintClient.jobAction(print, opts, e)
    })
  document
    .getElementById('panRestart-' + printer._id)
    .addEventListener('click', (e) => {
      e.target.disabled = true
      const opts = {
        command: 'restart'
      }
      const print = returnPrinterInfo(printer._id)
      OctoPrintClient.jobAction(print, opts, e)
    })
  document
    .getElementById('panResume-' + printer._id)
    .addEventListener('click', (e) => {
      e.target.disabled = true
      const opts = {
        command: 'pause',
        action: 'resume'
      }
      const print = returnPrinterInfo(printer._id)
      OctoPrintClient.jobAction(print, opts, e)
    })
  document
    .getElementById('panStop-' + printer._id)
    .addEventListener('click', (e) => {
      const print = returnPrinterInfo(printer._id)
      const name = printer.printerName
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
            e.target.disabled = true
            const opts = {
              command: 'cancel'
            }
            OctoPrintClient.jobAction(print, opts, e)
          }
        }
      })
    })
  return 'done'
}
async function init (printers, clientSettings) {
  for (let p = 0; p < printers.length; p++) {
    if (!document.getElementById('viewPanel-' + printers[p]._id)) {
      if (!jpInit) {
        drawPrinter(printers[p], clientSettings)
      }
    } else {
      updateState(printers[p], clientSettings)
    }
  }
  if (jpInit) {
    const fullscreenElement =
      document.fullscreenElement ||
      document.mozFullScreenElement ||
      document.webkitFullscreenElement
    if (!fullscreenElement) {
      jplist.refresh()
    }
  } else {
    jpInit = true
    await jplist.init({
      storage: 'localStorage', // 'localStorage', 'sessionStorage' or 'cookies'
      storageName: 'view-storage'
    })
  }
}
