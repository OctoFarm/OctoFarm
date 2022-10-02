import {imageOrCamera} from "./octofarm.utils";
import UI from "./ui";
import Calc from "./calc"
import {checkTemps} from "./temperature-check.util";
import {returnMiniFilamentSelectorTemplate} from "../services/printer-filament-selector.service";

const wrapperElement = document.getElementById("fullScreenDisplayElementWrapper")
const htmlElement = document.getElementById("octofarm_html")
const fullScreenCameraFileName = document.getElementById("fullScreenCameraFileName")
const fullScreenCameraTools = document.getElementById("fullScreenCameraTools")
const fullScreenCameraBedChamber = document.getElementById("fullScreenCameraBedChamber")
const fullScreenCameraPrintTimeElapsed = document.getElementById("fullScreenCameraPrintTimeElapsed")
const fullScreenCameraPrintTimeLeft = document.getElementById("fullScreenCameraPrintTimeLeft")
const fullScreenCameraPrintProgress = document.getElementById("fullScreenCameraPrintProgress")
const hideClass = "d-none"
let currentPrinterID = null


export const activateFullScreenView = (printer) => {
  currentPrinterID = printer._id
  let imageOrCameraElement = imageOrCamera(printer);

  let drawCameraWrapper = document.getElementById("drawCameraWrapper")
  let toolList = '';
  let environment = '';
  if (!!printer.currentProfile) {
    for (let e = 0; e < printer.currentProfile.extruder.count; e++) {
      toolList += `
        <b>Tool ${e}: </b><span id="fullScreen-${printer._id}-temperature-${e}">
                    <i class="far fa-circle "></i> 0°C <i class="fas fa-bullseye"></i> 0°C</span><br>
      `
    }

    if (printer.currentProfile.heatedBed) {
      environment += `
          <b>Bed: </b><span id="fullScreen-badTemp-${printer._id}"><i class="far fa-circle "></i> 0°C <i class="fas fa-bullseye"></i> 0°C</span><br>
        `;
    }
    if (printer.currentProfile.heatedChamber) {
      environment += `
         <b>Chamber: </b><span id="fullScreen-chamberTemp-${printer._id}"><i class="far fa-circle "></i> 0°C <i class="fas fa-bullseye"></i> 0°C</span>
        `;
    }
  }
  fullScreenCameraTools.innerHTML = toolList;
  fullScreenCameraBedChamber.innerHTML = environment;

  updateFullScreenCameraInfo(printer);

  drawCameraWrapper.innerHTML = imageOrCameraElement;


  if(!wrapperElement.classList.contains(`${hideClass}`)){
    wrapperElement.classList.add(`${hideClass}`)
    htmlElement.classList.remove("overflow-hidden")
  }else{
    wrapperElement.classList.remove(`${hideClass}`)
    htmlElement.classList.add("overflow-hidden")
  }
}

export function updateFullScreenCameraInfo(printer) {
  if (!wrapperElement.classList.contains(`${hideClass}`) && printer._id === currentPrinterID) {
    if (typeof printer.currentJob !== 'undefined') {
      let progress = 0;
      if (typeof printer.currentJob.progress === 'number') {
        progress = printer.currentJob.progress;
      }
      UI.doesElementNeedUpdating(progress + '%', fullScreenCameraPrintProgress, 'innerHTML');
      fullScreenCameraPrintProgress.style.width = progress + '%';
      fullScreenCameraFileName.setAttribute('title', printer.currentJob.filePath);
      fullScreenCameraFileName.innerHTML = printer.currentJob.fileDisplay;
      let printTimeElapsedFormat = `${Calc.generateTime(printer.currentJob.printTimeElapsed)}`;
      let remainingPrintTimeFormat = `${Calc.generateTime(printer.currentJob.printTimeRemaining)}`;
      if (printer.printerState.colour.category === 'Active') {
         // Active Job
        UI.doesElementNeedUpdating(printTimeElapsedFormat, fullScreenCameraPrintTimeElapsed, 'innerHTML');
        UI.doesElementNeedUpdating(remainingPrintTimeFormat, fullScreenCameraPrintTimeLeft, 'innerHTML');
        fullScreenCameraPrintProgress.classList.add("bg-warning")
        fullScreenCameraPrintProgress.classList.remove("bg-success")
      } else if (printer.printerState.colour.category === 'Complete') {
        UI.doesElementNeedUpdating(100 + '%', fullScreenCameraPrintProgress, 'innerHTML');
        fullScreenCameraPrintProgress.style.width = 100 + '%';
        fullScreenCameraPrintProgress.classList.remove("bg-warning")
        fullScreenCameraPrintProgress.classList.add("bg-success")
          UI.doesElementNeedUpdating(printTimeElapsedFormat, fullScreenCameraPrintTimeElapsed, 'innerHTML');
          UI.doesElementNeedUpdating(remainingPrintTimeFormat, fullScreenCameraPrintTimeLeft, 'innerHTML');
      } else {
      // Finished Job
        UI.doesElementNeedUpdating("No Active Print", fullScreenCameraPrintTimeElapsed, 'innerHTML');
        UI.doesElementNeedUpdating("No Active Print", fullScreenCameraPrintTimeLeft, 'innerHTML');
      }
    } else {
      fullScreenCameraPrintProgress.style.width = 0 + '%';
      fullScreenCameraFileName.innerHTML = 'No File Selected';
      fullScreenCameraFileName.setAttribute('title', 'No File Selected');
      UI.doesElementNeedUpdating("No Active Print", fullScreenCameraPrintTimeElapsed, 'innerHTML');
      UI.doesElementNeedUpdating("No Active Print", fullScreenCameraPrintTimeLeft, 'innerHTML');
    }
    if (!!printer.tools) {
      const toolKeys = Object.keys(printer.tools[0]);
      for (const element of toolKeys) {
        if (element.includes('tool')) {
          const toolNumber = element.replace('tool', '');
          if (document.getElementById("fullScreen-"+ printer._id + '-temperature-' + toolNumber)) {
            checkTemps(
                document.getElementById("fullScreen-"+ printer._id + '-temperature-' + toolNumber),
                printer.tools[0][element].actual,
                printer.tools[0][element].target,
                printer.otherSettings.temperatureTriggers,
                printer.printerState.colour.category
            );
          } else {
            checkTemps(
                document.getElementById("fullScreen-"+ printer._id + '-temperature-' + toolNumber),
                0,
                0,
                printer.otherSettings.temperatureTriggers,
                printer.printerState.colour.category
            );
          }
        } else if (element.includes('bed')) {
          if (document.getElementById(`fullScreen-badTemp-${printer._id}`)) {
            checkTemps(
                document.getElementById(`fullScreen-badTemp-${printer._id}`),
                printer.tools[0][element].actual,
                printer.tools[0][element].target,
                printer.otherSettings.temperatureTriggers,
                printer.printerState.colour.category
            );
          }
        } else if (element.includes('chamber')) {
          if (document.getElementById(`fullScreen-chamberTemp-${printer._id}`)) {
            checkTemps(
                document.getElementById(`fullScreen-chamberTemp-${printer._id}`),
                printer.tools[0][element].actual,
                printer.tools[0][element].target,
                printer.otherSettings.temperatureTriggers,
                printer.printerState.colour.category
            );
          }
        }
      }
    }
  }
}


(function() {
  wrapperElement.addEventListener('dblclick', () => {
    if(!wrapperElement.classList.contains(`${hideClass}`)){
      wrapperElement.classList.add(`${hideClass}`)
      htmlElement.classList.remove("overflow-hidden")
    }else{
      wrapperElement.classList.remove(`${hideClass}`)
      htmlElement.classList.add("overflow-hidden")
    }
  })

})();