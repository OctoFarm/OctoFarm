import { dragAndDropEnable, dragCheck } from "../lib/functions/dragAndDrop.js";
import PrinterManager from "../lib/modules/printerManager.js";
import PrinterFileManager from "../lib/modules/printerFileManager.js";
import PowerButton from "../lib/modules/powerButton.js";
import UI from "../lib/functions/ui.js";
import Calc from "../lib/functions/calc.js";
import {
  checkQuickConnectState,
  init as actionButtonInit
} from "../lib/modules/Printers/actionButtons.js";
import OctoPrintClient from "../lib/octoprint.js";
import { checkTemps } from "../lib/modules/temperatureCheck.js";
import { checkFilamentManager } from "../services/filament-manager-plugin.service";
import doubleClickFullScreen from "../lib/functions/fullscreen.js";
import OctoFarmClient from "../services/octofarm-client.service";
import { getControlList, getPrinterInfo } from "./monitoring-view.state";

const elems = [];
let powerTimer = 20000;
let printerManagerModal = document.getElementById("printerManagerModal");
const currentOpenModal = document.getElementById("printerManagerModalTitle");
let printerArea = document.getElementById("printerArea");

document.getElementById("filterStates").addEventListener("change", (e) => {
  OctoFarmClient.get("client/updateFilter/" + e.target.value);
});
document.getElementById("sortStates").addEventListener("change", (e) => {
  OctoFarmClient.get("client/updateSorting/" + e.target.value);
});

const returnPrinterInfo = (id) => {
  const statePrinterInfo = getPrinterInfo();
  if (typeof id !== "undefined") {
    const zeeIndex = _.findIndex(statePrinterInfo, function (o) {
      return o._id == id;
    });
    return statePrinterInfo[zeeIndex];
  } else {
    return statePrinterInfo;
  }
};

function isHidden(state, clientSettings) {
  let hidden = "";
  if (state === "Offline" && clientSettings.views.showOffline) {
    hidden = "hidden";
  } else if (state === "Disconnected" && clientSettings.views.showDisonnected) {
    hidden = "hidden";
  }
  return hidden;
}

function isRotated(otherSettings) {
  let flipH = "";
  let flipV = "";
  let rotate90 = "";

  if (otherSettings.webCamSettings !== null) {
    if (otherSettings.webCamSettings.flipH) {
      flipH = "rotateY(180deg)";
    }
    if (otherSettings.webCamSettings.flipV) {
      flipV = "rotateX(180deg)";
    }
    if (otherSettings.webCamSettings.rotate90) {
      rotate90 = "rotate(90deg)";
    }
  }
  return { flipH, flipV, rotate90 };
}

function cleanName(printerName) {
  let name = printerName;
  if (name.includes("http://")) {
    name = name.replace("http://", "");
  } else if (name.includes("https://")) {
    name = name.replace("https://", "");
  }
  return name;
}

function checkPrinterRows(clientSettings) {
  if (!clientSettings) {
    return clientSettings.views.cameraColumns;
  } else {
    return 2;
  }
}

function imageOrCamera(printer) {
  let drawCamera = ({ url, flipV, flipH, rotate90 }) => {
    return `<img
        loading="lazy"
        class="camImg"
        id="camera-${printer._id}"
        width="100%"
        style="transform: ${flipH} ${flipV} ${rotate90}";
        src="${url}"
     alt=""/>`;
  };
  const flip = isRotated(printer.otherSettings);
  const { flipH, flipV, rotate90 } = flip;

  //Is octoprints camera settings enabled?
  if (
    printer.otherSettings !== null &&
    printer.otherSettings.webCamSettings !== null &&
    printer.otherSettings.webCamSettings.webcamEnabled
  ) {
    //Check if URL actually exists...
    if (printer.cameraURL !== "") {
      return drawCamera({
        url: printer.cameraURL,
        flipV,
        flipH,
        rotate90
      });
    } else {
      if (typeof printer.currentJob !== "undefined" && printer.currentJob.thumbnail != null) {
        return drawCamera({
          url: printer.printerURL + "/" + printer.currentJob.thumbnail,
          flipV,
          flipH,
          rotate90
        });
      } else {
        return drawCamera({
          url: "../images/noCamera.jpg",
          flipV,
          flipH,
          rotate90
        });
      }
    }
  } else {
    if (typeof printer.currentJob !== "undefined" && printer.currentJob.thumbnail != null) {
      return drawCamera({
        url: printer.printerURL + "/" + printer.currentJob.thumbnail,
        flipV,
        flipH,
        rotate90
      });
    } else {
      return drawCamera({ url: "", flipV, flipH, rotate90 });
    }
  }
}

function checkCameraState(printer) {
  const flip = isRotated(printer.otherSettings);
  const { flipH, flipV, rotate90 } = flip;

  //Is octoprints camera settings enabled?
  if (
    printer.otherSettings !== null &&
    printer.otherSettings.webCamSettings !== null &&
    printer.otherSettings.webCamSettings.webcamEnabled
  ) {
    //Check if URL actually exists...
    if (printer.cameraURL !== "") {
      return true;
    } else {
      return typeof printer.currentJob !== "undefined" && printer.currentJob.thumbnail != null;
    }
  } else {
    return typeof printer.currentJob !== "undefined" && printer.currentJob.thumbnail != null;
  }
}

function drawListView(printer, clientSettings) {
  const hidden = isHidden(printer, clientSettings);
  const name = cleanName(printer.printerName);
  let toolList = "";
  let environment = "";

  if (printer.currentProfile !== null) {
    for (let e = 0; e < printer.currentProfile.extruder.count; e++) {
      toolList += '<div class="btn-group btn-block m-0" role="group" aria-label="Basic example">';
      toolList += `<button type="button" class="btn btn-secondary btn-sm" disabled><b>Tool ${e} </b></button><button disabled id="${printer._id}-spool-${e}" type="button" class="btn btn-secondary  btn-sm"> No Spool </button><button id="${printer._id}-temperature-${e}" type="button" class="btn btn-secondary btn-sm" disabled><i class="far fa-circle "></i> 0°C <i class="fas fa-bullseye"></i> 0°C</button>`;
      toolList += "</div>";
    }
    if (printer.currentProfile.heatedBed && printer.currentProfile.heatedChamber) {
      environment = `<small
      id="bedTemp-${printer._id}"
    class="mb-0 float-right"

          </small><br><small
      id="chamberTemp-${printer._id}"
    class="mb-0 float-right"

          </small>`;
    } else if (printer.currentProfile.heatedBed) {
      environment = `<div
      id="badTemp-${printer._id}"
    class="mb-0 float-left"
          >
          </div>`;
    } else if (printer.currentProfile.heatedChamber) {
      environment = `<div
      id="chamberTemp-${printer._id}"
    class="mb-0 float-right"
        >
          </div>`;
    }
  }
  let stateCategory = printer.printerState.colour.category;
  if (stateCategory === "Error!") {
    stateCategory = "Offline";
  }
  return `
        <tr
          class="p-0 ${stateCategory} ${hidden}"
          id="panel-${printer._id}">
          <td id="name-${printer._id}" class="py-auto">
            ${name}
          </td>
          <td id="state-${printer._id}" class="py-auto">
           ${printer.printerState.state}
          </td>
          <td id="printerActionBtns-${printer._id}" class="py-auto">

          </td>
          <td class="py-auto">
            <button title="Start your current selected file"
              id="play-${printer._id}"
              type="button"
              class="tag btn btn-success btn-sm"
              disabled
            >
              <i class="fas fa-play"></i>
            </button>
            <button title="Cancel your current print"
              id="cancel-${printer._id}"
              type="button"
              class="tag btn btn-danger btn-sm"
              disabled
            >
              <i class="fas fa-square"></i>
            </button>
          </td>
          <td class="py-auto">
          <p id="currentFile-${printer._id}" title="Loading..." class="mb-1 tag">
            <i class="fas fa-file-code"></i> No File Selected </p>
          </td>
          <td class="p-1">
          <span id="printTimeElapsed-${printer._id}">Loading...</span>
          </td>
          <td class="py-auto">
            <div class="progress m-0 p-0">
              <div id="progress-${printer._id}" class="progress-bar progress-bar-striped bg-secondary percent" role="progressbar progress-bar-striped" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
            </div>
            <small id="displayLayerProgressData-${printer._id}"></small>
          </td>
          <td class="p-1">
          <span id="remainingTime-${printer._id}">
                Loading...
            </span>
          </td>
          <td class="py-auto">
           ${toolList}
          </td>
          <td class="py-auto">
            ${environment}
          </td>
        </tr>
    `;
}

function drawPanelView(printer, clientSettings) {
  const hidden = isHidden(printer, clientSettings);
  const name = cleanName(printer.printerName);
  const printerRows = checkPrinterRows(clientSettings);
  let cameraElement = imageOrCamera(printer);
  let toolList = "";
  let environment = "";
  if (printer.currentProfile !== null) {
    for (let e = 0; e < printer.currentProfile.extruder.count; e++) {
      toolList += '<div class="btn-group btn-block m-0" role="group" aria-label="Basic example">';
      toolList += `<button type="button" class="btn btn-secondary btn-sm" disabled><b>Tool ${e} </b></button><button disabled id="${printer._id}-spool-${e}" type="button" class="btn btn-secondary  btn-sm"> No Spool </button><button id="${printer._id}-temperature-${e}" type="button" class="btn btn-secondary btn-sm" disabled><i class="far fa-circle "></i> 0°C <i class="fas fa-bullseye"></i> 0°C</button>`;
      toolList += "</div>";
    }

    if (printer.currentProfile.heatedBed) {
      environment += `<small
    class="mb-0 float-left"
          ><b>Bed: </b><span id="badTemp-${printer._id}"><i class="far fa-circle "></i> 0°C <i class="fas fa-bullseye"></i> 0°C</span>
          </small>`;
    }
    if (printer.currentProfile.heatedChamber) {
      environment += `<small
    class="mb-0 float-right"
        ><b>Chamber: </b><span  id="chamberTemp-${printer._id}"><i class="far fa-circle "></i> 0°C <i class="fas fa-bullseye"></i> 0°C</span>
          </small>`;
    }
  }

  return `
        <div class="col-sm-12 col-md-4 col-lg-3 col-xl-2 ${hidden}" id="panel-${printer._id}">
        <div class="card mt-1 mb-1 ml-1 mr-1 text-center">
          <div class="card-header dashHeader">
           <button
                id="name-${printer._id}"
                type="button"
                class="btn btn-secondary mb-0 btn-sm float-left"
                role="button"
                disabled
              >
                ${name}
              </button>
          <small class="float-right" id="printerActionBtns-${printer._id}">

          </small>
          </div>
          <div class="card-body pt-1 pb-0 pl-2 pr-2">
            <div class="d-none index">${printer.sortIndex}</div>
            <button
                    id="currentFile-${printer._id}"
                    type="button"
                    class="tag btn btn-block btn-secondary mb-0 text-truncate btn-sm"
                    role="button"
                    title="Loading..."
                    disabled
            >
                <i class="fas fa-file-code" ></i> No File Selected
            </button>
            <div id="cameraContain-${printer._id}" class="noBlue">
                ${cameraElement}
            </div>
            <div class="progress">
              <div
                id="progress-${printer._id}"
                class="progress-bar progress-bar-striped bg-${printer.printerState.colour.name} percent"
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
              id="state-${printer._id}"
              type="button"
              class="btn btn-block mb-1 mt-1 btn-sm ${printer.printerState.colour.category}"
              role="button"
              disabled
            >
              ${printer.printerState.state}
            </button>
            <center>
              <button
                title="Start your currently selected print"
                id="play-${printer._id}"
                type="button"
                class="tag btn btn-success mt-1 mb-1 btn-sm"
                role="button"
                disabled
              >
                <i class="fas fa-print"></i> Print
              </button>
              <button
                      title="Pause your current print"
                id="pause-${printer._id}"
                type="button"
                class="tag btn btn-light mt-1 mb-1 btn-sm"
                role="button"
                disabled
              >
                <i class="fas fa-pause"></i> Pause
              </button>
              <button
                title="Restart your current print"
                id="restart-${printer._id}"
                type="button"
                class="tag btn btn-danger mt-1 mb-1 hidden btn-sm"
                role="button"
                disabled
              >
                <i class="fas fa-undo"></i> Restart
              </button>
              <button
                      title="Resume your current print"
                id="resume-${printer._id}"
                type="button"
                class="tag btn btn-success mt-1 mb-1 hidden btn-sm"
                role="button"
                disabled
              >
                <i class="fas fa-redo"></i> Resume
              </button>
              <button
                      title="Stop your current print"
                id="cancel-${printer._id}"
                type="button"
                class="tag btn btn-danger mt-1 mb-1 btn-sm"
                role="button"
                disabled
              >
                <i class="fas fa-square"></i> Cancel
              </button>
            </center>
          </div>
          <div class="row">
           <div class="col-12">
                <small id="displayLayerProgressData-${printer._id}"></small>
            </div>
            <div class="col-6">
                <span id="printTimeElapsed-${printer._id}">Loading...</span>
            </div>
            <div class="col-6">
                      <span id="remainingTime-${printer._id}">
                Loading...
            </span>
            </div> 

          </div>
          <div
            id="listFilament-${printer._id}" disabled
            class="bg-dark"
          >
           ${toolList}
          </div>

          <div class="card-footer text-muted dashFooter">
                ${environment}
          </div>
        </div>
      </div>
    `;
}

function drawCameraView(printer, clientSettings) {
  let hidden = isHidden(printer, clientSettings);
  if (printer.cameraURL === "") {
    hidden = "hidden";
  }
  const name = cleanName(printer.printerName);
  const printerRows = checkPrinterRows(clientSettings);
  let cameraElement = imageOrCamera(printer);

  let toolList = "";
  let environment = "";
  if (printer.currentProfile !== null) {
    for (let e = 0; e < printer.currentProfile.extruder.count; e++) {
      toolList += `<span><b>Tool ${e} </b></span> | <span id="${printer._id}-spool-${e}"> No Spool </span> | <span id="${printer._id}-temperature-${e}" ><i class="far fa-circle "></i> 0°C <i class="fas fa-bullseye"></i> 0°C</span><br>`;
    }

    if (printer.currentProfile.heatedBed) {
      environment += `
          <b>Bed: </b><span id="badTemp-${printer._id}"><i class="far fa-circle "></i> 0°C <i class="fas fa-bullseye"></i> 0°C</span><br>
`;
    }
    if (printer.currentProfile.heatedChamber) {
      environment += `
    class="mb-0"
        <b>Chamber: </b><span id="chamberTemp-${printer._id}"><i class="far fa-circle "></i> 0°C <i class="fas fa-bullseye"></i> 0°C</span><br>
 `;
    }
  }

  return `
  <div
      id="panel-${printer._id}"
      class="col-md-4 col-lg-${printerRows} col-xl-${printerRows} ${hidden}"
    >
      <div class="card text-center mb-0 mt-0 ml-0 mr-0">
        <div
          class="card-header dashHeader p-0"
          id="camHeader-${printer._id}"
        >
            <button
              id="name-${printer._id}"
              type="button"
              class="btn btn-secondary float-left p-0 pl-2 pt-1"
              data-toggle="modal"
              data-target="#printerManagerModal"
              disabled
            >
                ${name}
            </button>
          <small id="printerActionBtns-${printer._id}" class="float-right">
          </small>
        </div>
        <div
          class="card-body cameraContain text-truncate noBlue"
          id="cameraContain-${printer._id}"
        >
          <div class="camName">
            <small
              class="mb-0 text-center"
              id="currentFile-${printer._id}"
            >
              <i class="fas fa-file-code"></i> Loading... 
            </small><br>
          </div>
          
          <div class="camExtra">
            <div class=" row">
              <div class="col-6">
                 <span class="mb-0 text-center" id="printTimeElapsed-${printer._id}"></span>
              </div>
              <div class="col-6">
                <span class="mb-0 text-center" id="remainingTime-${printer._id}"></span>
              </div>
            </div>
          </div>
          
          ${cameraElement}
          
          <div class="camTemps">
            <small id="displayLayerProgressData-${printer._id}"></small><br>
            <small
              id="toolTemps-${printer._id}"
              class="mb-0 text-center"
            >
             ${toolList}
             ${environment}
            </small>
          </div>
          <div class="progress camProgress">
            <div class="d-none percent">Loading...</div>
            <div
              id="progress-${printer._id}"
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
              id="play-${printer._id}"
            >
              Start
            </button>
            <button
              title="Stop your current selected print"
              class="tag btn btn-danger camButtons btn-sm"
              id="cancel-${printer._id}"
            >
              Cancel
            </button>
          </small>
        </div>
      </div>
    </div>
  `;
}

function drawCombinedView(printer, clientSettings) {
  const hidden = isHidden(printer, clientSettings);
  const name = cleanName(printer.printerName);
  let cameraElement = imageOrCamera(printer);
  let toolList = "";
  let environment = "";
  if (printer.currentProfile !== null) {
    for (let e = 0; e < printer.currentProfile.extruder.count; e++) {
      toolList += '<div class="btn-group btn-block mb-1" role="group" aria-label="Basic example">';
      toolList += `<button type="button" class="btn btn-secondary btn-sm" disabled><b>Tool ${e} </b></button><button disabled id="${printer._id}-spool-${e}" type="button" class="btn btn-secondary  btn-sm"> No Spool </button><button id="${printer._id}-temperature-${e}" type="button" class="btn btn-secondary btn-sm" disabled><i class="far fa-circle "></i> 0°C <i class="fas fa-bullseye"></i> 0°C</button>`;
      toolList += "</div>";
    }

    if (printer.currentProfile.heatedBed) {
      environment +=
        '<div class="btn-group btn-block mb-1" role="group" aria-label="Basic example">';
      environment += `<button type="button" class="btn btn-secondary btn-sm" disabled><b>Bed: </b></button><button type="button" class="btn btn-secondary btn-sm" disabled><span id="badTemp-${printer._id}"><i class="far fa-circle "></i> 0°C <i class="fas fa-bullseye"></i> 0°C</span></button>`;
      environment += "</div>";
    }
    if (printer.currentProfile.heatedChamber) {
      environment +=
        '<div class="btn-group btn-block mb-1" role="group" aria-label="Basic example">';
      environment += `<button type="button" class="btn btn-secondary btn-sm" disabled><b>Chamber: </b></button><button type="button" class="btn btn-secondary btn-sm" disabled><span  id="chamberTemp-${printer._id}"><i class="far fa-circle "></i> 0°C <i class="fas fa-bullseye"></i> 0°C</span></button>`;
      environment += "</div>";
    }
  }

  const cameraCheck = checkCameraState(printer);

  const columns = {
    cameraColumn: "col-sm-12 col-md-5 col-lg-4 col-xl-3",
    mainColumn: "col-sm-12 col-md-7 col-lg-8 col-xl-9"
  };
  if (!cameraCheck) {
    columns.cameraColumn = "d-none";
    columns.mainColumn = "col-12";
  }

  return `
     <div class="card ${hidden}" id="panel-${printer._id}">
        <div class="d-none index">${printer.sortIndex}</div>
        <div class="col-12">
            <div class="row">
                
                <div class="${columns.cameraColumn}">
                   <div id="cameraContain-${printer._id}" class="noBlue">
                        ${cameraElement}
                    </div>
                </div>
                <div class="${columns.mainColumn}">
     
                   <div class="row">
                        <div class="col-sm-6 col-md-8 col-lg-6">
                          <button
                            id="name-${printer._id}"
                            type="button"
                            class="btn btn-block btn-secondary btn-sm text-left"
                            role="button"
                            disabled
                          >
                            ${name}
                          </button>
                        </div>
                        <div class="col-sm-6 col-md-1 col-lg-4">
                          <button
                            id="state-${printer._id}"
                            type="button"
                            class="btn btn-block btn-sm ${printer.printerState.colour.category}"
                            role="button"
                            disabled
                          >
                            ${printer.printerState.state}
                          </button>
                        </div>
                        <div class="col-sm-6 col-md-3 col-lg-2">
                         <small class="float-right" id="printerActionBtns-${printer._id}">

                          </small>
                        </div>
                    </div>
            
                   <div class="row">
                     <div class="col-12">
                        <div class="progress">
                        <div
                          id="progress-${printer._id}"
                          class="progress-bar progress-bar-striped bg-${printer.printerState.colour.name} percent"
                          role="progressbar progress-bar-striped"
                          style="width: 0%"
                          aria-valuenow="0"
                          aria-valuemin="0"
                          aria-valuemax="100"
                        >
                          0%
                        </div>
                      </div>
                     </div> 
                   </div> 
                   <div class="row">
                      <div class="col-sm-12 col-md-4 col-lg-6">
                        <button
                                id="currentFile-${printer._id}"
                                type="button"
                                class="btn btn-block btn-secondary text-truncate btn-sm"
                                role="button"
                                title="Loading..."
                                disabled
                        >
                            <i class="fas fa-file-code" ></i> No File Selected
                        </button>
                        <div class="row">
                        <div class="col-sm-12 text-center">
                          <button
                            title="Load a file ready to print"
                            id="load-${printer._id}"
                            type="button"
                            class="tag btn btn-info mt-1 mb-1 btn-sm"
                            role="button"
                            disabled
                          >
                            <i class="fas fa-file-upload"></i> Load
                          </button>
                          <button
                            title="Start your currently selected print"
                            id="play-${printer._id}"
                            type="button"
                            class="tag btn btn-success mt-1 mb-1 btn-sm"
                            role="button"
                            disabled
                          >
                            <i class="fas fa-print"></i> Print
                          </button>
                          <button
                                  title="Pause your current print"
                            id="pause-${printer._id}"
                            type="button"
                            class="tag btn btn-light mt-1 mb-1 btn-sm"
                            role="button"
                            disabled
                          >
                            <i class="fas fa-pause"></i> Pause
                          </button>
                          <button
                            title="Restart your current print"
                            id="restart-${printer._id}"
                            type="button"
                            class="tag btn btn-danger mt-1 mb-1 hidden btn-sm"
                            role="button"
                            disabled
                          >
                            <i class="fas fa-undo"></i> Restart
                          </button>
                          <button
                                  title="Resume your current print"
                            id="resume-${printer._id}"
                            type="button"
                            class="tag btn btn-success mt-1 mb-1 hidden btn-sm"
                            role="button"
                            disabled
                          >
                            <i class="fas fa-redo"></i> Resume
                          </button>
                          <button
                                  title="Stop your current print"
                            id="cancel-${printer._id}"
                            type="button"
                            class="tag btn btn-danger mt-1 mb-1 btn-sm"
                            role="button"
                            disabled
                          >
                            <i class="fas fa-square"></i> Cancel
                          </button>
                        </div>
                    </div>
                        <div class="row text-center">
                          <div class="col-12">
                              <small id="displayLayerProgressData-${printer._id}"></small>
                          </div>
                          <div class="col-6">
                              <span id="printTimeElapsed-${printer._id}">Loading...</span>
                          </div>
                          <div class="col-6">
                                    <span id="remainingTime-${printer._id}">
                              Loading...
                          </span>
                          </div> 
                        </div>
                      </div>
                      <div class="col-sm-12 col-md-8 col-lg-6">
                        <div
                          id="listFilament-${printer._id}" disabled
                          class="bg-dark"
                        >
                          ${toolList}
                        </div>
                        <div>
                          ${environment}
                        </div>
                      </div>
                    </div>
                </div>
            </div>
        </div>
     </div>   
    `;
}

function addListeners(printer) {
  //For now Control has to be seperated
  document.getElementById(`printerButton-${printer._id}`).addEventListener("click", async () => {
    currentOpenModal.innerHTML = "Printer Control: ";
    const printerInfo = getPrinterInfo();
    const controlList = getControlList();
    await PrinterManager.init(printer._id, printerInfo, controlList);
  });
  document.getElementById(`printerFilesBtn-${printer._id}`).addEventListener("click", async () => {
    currentOpenModal.innerHTML = "Printer Files: ";
    const printerInfo = getPrinterInfo();
    const controlList = getControlList();
    await PrinterFileManager.init(printer._id, printerInfo, controlList);
  });

  //Play button listeners
  let playBtn = document.getElementById("play-" + printer._id);
  if (playBtn) {
    playBtn.addEventListener("click", (e) => {
      e.target.disabled = true;
      const opts = {
        command: "start"
      };
      const print = returnPrinterInfo(printer._id);
      OctoPrintClient.jobAction(print, opts, e);
    });
  }
  let cancelBtn = document.getElementById("cancel-" + printer._id);
  if (cancelBtn) {
    cancelBtn.addEventListener("click", (e) => {
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
        callback(result) {
          if (result) {
            e.target.disabled = true;
            const opts = {
              command: "cancel"
            };
            OctoPrintClient.jobAction(print, opts, e);
          }
        }
      });
    });
  }
  let restartBtn = document.getElementById("restart-" + printer._id);
  if (restartBtn) {
    restartBtn.addEventListener("click", (e) => {
      e.target.disabled = true;
      const opts = {
        command: "restart"
      };
      const print = returnPrinterInfo(printer._id);
      OctoPrintClient.jobAction(print, opts, e);
    });
  }
  let pauseBtn = document.getElementById("pause-" + printer._id);
  if (pauseBtn) {
    pauseBtn.addEventListener("click", (e) => {
      e.target.disabled = true;
      const opts = {
        command: "pause",
        action: "pause"
      };
      const print = returnPrinterInfo(printer._id);
      OctoPrintClient.jobAction(print, opts, e);
    });
  }
  let resumeBtn = document.getElementById("resume-" + printer._id);
  if (resumeBtn) {
    resumeBtn.addEventListener("click", (e) => {
      e.target.disabled = true;
      const opts = {
        command: "pause",
        action: "resume"
      };
      const print = returnPrinterInfo(printer._id);
      OctoPrintClient.jobAction(print, opts, e);
    });
  }
  let cameraContain = document.getElementById("cameraContain-" + printer._id);
  if (cameraContain) {
    cameraContain.addEventListener("dblclick", (e) => {
      doubleClickFullScreen(e.target);
    });
  }

  return "done";
}

function grabElements(printer) {
  if (typeof elems[printer._id] !== "undefined") {
    return elems[printer._id];
  } else {
    elems[printer._id] = {
      row: document.getElementById("panel-" + printer._id),
      name: document.getElementById("name-" + printer._id),
      control: document.getElementById("printerButton-" + printer._id),
      files: document.getElementById("printerFilesBtn-" + printer._id),
      connect: document.getElementById("printerQuickConnect-" + printer._id),
      start: document.getElementById("play-" + printer._id),
      stop: document.getElementById("cancel-" + printer._id),
      pause: document.getElementById("pause-" + printer._id),
      restart: document.getElementById("restart-" + printer._id),
      resume: document.getElementById("resume-" + printer._id),
      camera: document.getElementById("camera-" + printer._id),
      currentFile: document.getElementById("currentFile-" + printer._id),
      currentFilament: document.getElementById("currentFilament-" + printer._id),
      state: document.getElementById("state-" + printer._id),
      layerData: document.getElementById("displayLayerProgressData-" + printer._id),
      printTimeElapsed: document.getElementById("printTimeElapsed-" + printer._id),
      remainingPrintTime: document.getElementById("remainingTime-" + printer._id),
      cameraContain: document.getElementById("cameraContain-" + printer._id),
      progress: document.getElementById("progress-" + printer._id),
      bed: document.getElementById("badTemp-" + printer._id),
      chamber: document.getElementById("chamberTemp-" + printer._id)
    };
    return elems[printer._id];
  }
}

async function updateState(printer, clientSettings, view, index) {
  //Grab elements on page
  const elements = grabElements(printer);
  if (typeof elements.row === "undefined") return; //Doesn't exist can skip updating

  //Check sorting order and update if required...

  elements.row.style.order = index;

  //Check display and skip if not displayed...
  if (printer.display) {
    if (elements.row.style.display === "none") {
      switch (view) {
        case "list":
          elements.row.style.display = "table";
          break;
        case "panel":
          elements.row.style.display = "block";
          break;
        case "camera":
          elements.row.style.display = "block";
          break;
      }
    }
  } else {
    if (elements.row.style.display !== "none") {
      elements.row.style.display = "none";
    }
    return;
  }

  //Printer
  checkQuickConnectState(printer);
  elements.control.disabled = printer.printerState.colour.category === "Offline";
  elements.files.disabled = printer.printerState.colour.category === "Offline";
  UI.doesElementNeedUpdating(printer.printerState.state, elements.state, "innerHTML");

  let stateCategory = printer.printerState.colour.category;
  if (stateCategory === "Error!") {
    stateCategory = "Offline";
  }
  UI.doesElementNeedUpdating(cleanName(printer.printerName), elements.name, "innerHTML");

  switch (view) {
    case "list":
      UI.doesElementNeedUpdating(stateCategory, elements.row, "classList");
      break;
    case "panel":
      UI.doesElementNeedUpdating(
        `btn btn-block ${stateCategory} mb-1 mt-1`,
        elements.state,
        "classList"
      );
      break;
    case "camera":
      UI.doesElementNeedUpdating(
        `card-body cameraContain text-truncate noBlue ${stateCategory}`,
        elements.cameraContain,
        "classList"
      );
      break;
  }

  //Progress
  UI.doesElementNeedUpdating(
    `progress-bar progress-bar-striped bg-${printer.printerState.colour.name}`,
    elements.progress,
    "classList"
  );
  if (typeof printer.currentJob !== "undefined") {
    let progress = 0;
    if (typeof printer.currentJob.progress === "number") {
      progress = printer.currentJob.progress;
    }
    UI.doesElementNeedUpdating(progress + "%", elements.progress, "innerHTML");
    elements.progress.style.width = progress + "%";
    elements.currentFile.setAttribute("title", printer.currentJob.filePath);
    elements.currentFile.innerHTML =
      '<i class="fas fa-file-code"></i> ' + printer.currentJob.fileDisplay;
    if (printer.printerState.colour.category === "Active") {
      // Active Job
      let printTimeElapsedFormat = `
        <small title="Print Time Elapsed">
            <i class="fas fa-hourglass-start"></i> ${Calc.generateTime(
              printer.currentJob.printTimeElapsed
            )}
        </small>
        <br>
        <small title="Expected Print Time">
            <i class="fas fa-clock"></i> ${Calc.generateTime(printer.currentJob.expectedPrintTime)}
        </small>
      `;
      let remainingPrintTimeFormat = `
        <small title="Print Time Remaining">
            <i class="fas fa-hourglass-end"></i> ${Calc.generateTime(
              printer.currentJob.printTimeRemaining
            )}
        </small>
        <br>
        <small title="Estimated Time of Arrival">
        <i class="fas fa-calendar-alt"></i> ${printer.currentJob.expectedCompletionDate}
        </small>
      `;
      UI.doesElementNeedUpdating(printTimeElapsedFormat, elements.printTimeElapsed, "innerHTML");
      UI.doesElementNeedUpdating(
        remainingPrintTimeFormat,
        elements.remainingPrintTime,
        "innerHTML"
      );
    } else if (printer.printerState.colour.category === "Complete") {
      let printTimeElapsedFormat = `
        <small title="Print Time Elapsed">
            <i class="fas fa-hourglass-start"></i> ${Calc.generateTime(
              printer.currentJob.printTimeElapsed
            )}
        </small>
        <br>
        <small title="Expected Print Time">
            <i class="fas fa-clock"></i> ${Calc.generateTime(printer.currentJob.expectedPrintTime)}
        </small>
      `;
      let remainingPrintTimeFormat = `
        <small title="Print Time Remaining">
            <i class="fas fa-hourglass-end"></i> 0
        </small>
        <br>
        <small title="Estimated Time of Arrival">
        <i class="fas fa-calendar-alt"></i> Complete!
        </small>
      `;
      UI.doesElementNeedUpdating(printTimeElapsedFormat, elements.printTimeElapsed, "innerHTML");
      UI.doesElementNeedUpdating(
        remainingPrintTimeFormat,
        elements.remainingPrintTime,
        "innerHTML"
      );
    } else {
      let printTimeElapsedFormat = `
        <small title="Print Time Elapsed">
            <i class="fas fa-hourglass-start"></i> No Active Print
        </small>
        <br>
        <small title="Expected Print Time">
            <i class="fas fa-clock"></i> No Active Print
        </small>
      `;
      let remainingPrintTimeFormat = `
        <small title="Print Time Remaining">
            <i class="fas fa-hourglass-end"></i> No Active Print
        </small>
        <br>
        <small title="Estimated Time of Arrival">
        <i class="fas fa-calendar-alt"></i> No Active Print
        </small>
      `;
      UI.doesElementNeedUpdating(printTimeElapsedFormat, elements.printTimeElapsed, "innerHTML");
      UI.doesElementNeedUpdating(
        remainingPrintTimeFormat,
        elements.remainingPrintTime,
        "innerHTML"
      );
    }
  } else {
    let printTimeElapsedFormat = `
        <small title="Print Time Elapsed">
            <i class="fas fa-hourglass-start"></i> No Active Print
        </small>
        <br>
        <small title="Expected Print Time">
            <i class="fas fa-clock"></i> No Active Print
        </small>
      `;
    let remainingPrintTimeFormat = `
        <small title="Print Time Remaining">
            <i class="fas fa-hourglass-end"></i> No Active Print
        </small>
        <br>
        <small title="Estimated Time of Arrival">
        <i class="fas fa-calendar-alt"></i> No Active Print
        </small>
      `;
    //No Job reset
    UI.doesElementNeedUpdating(0 + "%", elements.progress, "innerHTML");
    elements.progress.style.width = 0 + "%";
    UI.doesElementNeedUpdating(printTimeElapsedFormat, elements.printTimeElapsed, "innerHTML");
    UI.doesElementNeedUpdating(remainingPrintTimeFormat, elements.remainingPrintTime, "innerHTML");
    elements.currentFile.setAttribute("title", "No File Selected");
    elements.currentFile.innerHTML = '<i class="fas fa-file-code"></i> ' + "No File Selected";
  }

  if (printer?.layerData) {
    const formatLayerData = `<i class="fas fa-layer-group"></i> ${printer.layerData.currentLayer} / ${printer.layerData.totalLayers} (${printer.layerData.percentComplete}%)`;
    UI.doesElementNeedUpdating(formatLayerData, elements.layerData, "innerHTML");
  }

  if (printer.tools !== null) {
    const toolKeys = Object.keys(printer.tools[0]);
    for (let t = 0; t < toolKeys.length; t++) {
      if (toolKeys[t].includes("tool")) {
        const toolNumber = toolKeys[t].replace("tool", "");
        if (document.getElementById(printer._id + "-temperature-" + toolNumber)) {
          checkTemps(
            document.getElementById(printer._id + "-temperature-" + toolNumber),
            printer.tools[0][toolKeys[t]].actual,
            printer.tools[0][toolKeys[t]].target,
            printer.otherSettings.temperatureTriggers,
            printer.printerState.colour.category
          );
        } else {
          checkTemps(
            document.getElementById(printer._id + "-temperature-" + toolNumber),
            0,
            0,
            printer.otherSettings.temperatureTriggers,
            printer.printerState.colour.category
          );
        }
      } else if (toolKeys[t].includes("bed")) {
        if (elements.bed) {
          checkTemps(
            elements.bed,
            printer.tools[0][toolKeys[t]].actual,
            printer.tools[0][toolKeys[t]].target,
            printer.otherSettings.temperatureTriggers,
            printer.printerState.colour.category
          );
        }
      } else if (toolKeys[t].includes("chamber")) {
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
    for (let i = 0; i < printer.selectedFilament.length; i++) {
      const tool = document.getElementById(`${printer._id}-spool-${i}`);
      if (printer.selectedFilament[i] !== null) {
        const filamentManager = await checkFilamentManager();
        if (tool) {
          tool.innerHTML = `${printer.selectedFilament[i].spools.material}`;
        }
      } else {
        if (tool) {
          tool.innerHTML = "No Spool";
        }
      }
    }
  }

  let hideClosed = "";
  let hideOffline = "";

  if (
    typeof clientSettings.views.showOffline !== "undefined" &&
    clientSettings.views.showDisonnected
  ) {
    hideOffline = "hidden";
  }
  if (
    typeof clientSettings.views.showOffline !== "undefined" &&
    clientSettings.views.showDisonnected
  ) {
    hideClosed = "hidden";
  }

  if (printer.printerState.colour.category === "Active") {
    // Set the state
    if (elements.row.classList.contains(hideClosed)) {
      elements.row.classList.remove(hideClosed);
    }
    if (elements.row.classList.contains(hideOffline)) {
      elements.row.classList.remove(hideOffline);
    }
    //Set the buttons
    if (elements.start) {
      elements.start.disabled = true;
      if (view === "camera") {
        elements.start.classList.add("hidden");
        elements.stop.classList.remove("hidden");
      }
    }
    if (elements.stop) {
      elements.stop.disabled = false;
    }

    if (printer.printerState.state === "Pausing") {
      if (elements.start) {
        if (view === "panel") {
          elements.start.classList.remove("hidden");
        }
      }
      if (elements.stop) {
        elements.stop.disabled = false;
      }
      if (elements.resume) {
        if (view === "panel") {
          elements.resume.classList.add("hidden");
        }
      }
      if (elements.pause) {
        elements.pause.disabled = true;
        elements.pause.classList.remove("hidden");
      }
      if (elements.restart) {
        elements.restart.disabled = true;
        elements.restart.classList.add("hidden");
      }
    } else if (printer.printerState.state === "Paused") {
      if (elements.start) {
        if (view === "panel") {
          elements.start.classList.add("hidden");
        }
      }
      if (elements.resume) {
        elements.resume.disabled = false;
        elements.resume.classList.remove("hidden");
      }
      if (elements.pause) {
        elements.pause.disabled = true;
        elements.pause.classList.add("hidden");
      }
      if (elements.restart) {
        elements.restart.disabled = false;

        elements.restart.classList.remove("hidden");
      }
    } else {
      if (elements.start) {
        if (view === "panel" && view === "camera") {
          elements.start.classList.remove("hidden");
        }
      }

      if (elements.resume) {
        elements.resume.disabled = true;
        elements.resume.classList.add("hidden");
      }
      if (elements.pause) {
        elements.pause.disabled = false;
        elements.pause.classList.remove("hidden");
      }
      if (elements.restart) {
        elements.restart.disabled = true;
        elements.restart.classList.add("hidden");
      }
    }
  } else if (
    printer.printerState.colour.category === "Idle" ||
    printer.printerState.colour.category === "Complete"
  ) {
    if (elements.row.classList.contains(hideClosed)) {
      elements.row.classList.remove(hideClosed);
    }
    if (elements.row.classList.contains(hideOffline)) {
      elements.row.classList.remove(hideOffline);
    }
    if (printer.currentJob !== null && printer.currentJob.fileName !== "No File Selected") {
      if (view === "camera") {
        elements.start.classList.remove("hidden");
        elements.stop.classList.add("hidden");
      }
      if (elements.start) {
        elements.start.disabled = false;
      }
      if (elements.stop) {
        elements.stop.disabled = true;
      }
      if (elements.resume) {
        elements.resume.disabled = true;
      }
      if (elements.pause) {
        elements.pause.disabled = true;
      }
      if (elements.restart) {
        elements.restart.disabled = true;
      }
    } else {
      if (elements.start) {
        elements.start.disabled = true;
      }
      if (elements.stop) {
        elements.stop.disabled = true;
      }
      if (elements.resume) {
        elements.resume.disabled = true;
      }
      if (elements.pause) {
        elements.pause.disabled = true;
      }
      if (elements.restart) {
        elements.restart.disabled = true;
      }
    }
    if (printer.printerState.state === "Paused") {
      if (elements.start) {
        if (view === "panel") {
          elements.start.classList.add("hidden");
        }
      }
      if (elements.stop) {
        elements.stop.disabled = false;
      }
      if (elements.resume) {
        elements.resume.disabled = false;
        elements.resume.classList.remove("hidden");
      }
      if (elements.pause) {
        elements.pause.disabled = true;
        elements.pause.classList.add("hidden");
      }
      if (elements.restart) {
        elements.restart.disabled = false;
        elements.restart.classList.remove("hidden");
      }
    } else {
      if (elements.start) {
        if (view === "panel") {
          elements.start.classList.remove("hidden");
        }
      }
      if (elements.resume) {
        elements.resume.disabled = true;
        elements.resume.classList.add("hidden");
      }
      if (elements.pause) {
        elements.pause.disabled = true;
        elements.pause.classList.remove("hidden");
      }
      if (elements.restart) {
        elements.restart.disabled = true;
        elements.restart.classList.add("hidden");
      }
    }
  } else if (printer.printerState.state === "Disconnected") {
    if (view === "camera") {
      elements.start.classList.remove("hidden");
      elements.stop.classList.add("hidden");
    }
    if (hideClosed !== "") {
      elements.row.classList.add(hideClosed);
    }
    if (elements.start) {
      elements.start.disabled = true;
      if (view === "panel") {
        elements.start.classList.remove("hidden");
      }
    }
    if (elements.stop) {
      elements.stop.disabled = true;
    }
    if (elements.resume) {
      elements.resume.disabled = true;
      elements.resume.classList.add("hidden");
    }
    if (elements.pause) {
      elements.pause.disabled = true;
      elements.pause.classList.remove("hidden");
    }
    if (elements.restart) {
      elements.restart.disabled = true;
      elements.restart.classList.add("hidden");
    }
  } else if (printer.printerState.colour.category === "Offline") {
    if (view === "camera") {
      elements.start.classList.remove("hidden");
      elements.stop.classList.add("hidden");
    }
    if (hideOffline !== "") {
      elements.row.classList.add(hideOffline);
    }
    if (elements.start) {
      elements.start.disabled = true;
      if (view === "panel") {
        elements.start.classList.remove("hidden");
      }
    }
    if (elements.stop) {
      elements.stop.disabled = true;
    }
    if (elements.resume) {
      elements.resume.disabled = true;
      elements.resume.classList.add("hidden");
    }
    if (elements.pause) {
      elements.pause.disabled = true;
      elements.pause.classList.remove("hidden");
    }
    if (elements.restart) {
      elements.restart.disabled = true;
      elements.restart.classList.add("hidden");
    }
  }
}

export async function initMonitoring(printers, clientSettings, view) {
  // Check if printer manager modal is opened
  switch (printerManagerModal.classList.contains("show")) {
    case true:
      // Run printer manager updater
      if (currentOpenModal.innerHTML.includes("Files")) {
        PrinterFileManager.init("", printers, getControlList());
      } else if (currentOpenModal.innerHTML.includes("Control")) {
        PrinterManager.init("", printers, getControlList());
      } else if (currentOpenModal.innerHTML.includes("Terminal")) {
      }
      break;
    case false:
      // initialise or start the information updating..
      for (let p = 0; p < printers.length; p++) {
        let printerPanel = document.getElementById("panel-" + printers[p]._id);
        if (!printerPanel) {
          if (view === "panel") {
            let printerHTML = await drawPanelView(printers[p], clientSettings, view);
            printerArea.insertAdjacentHTML("beforeend", printerHTML);
          } else if (view === "list") {
            let printerHTML = await drawListView(printers[p], clientSettings, view);
            printerArea.insertAdjacentHTML("beforeend", printerHTML);
          } else if (view === "camera") {
            let printerHTML = await drawCameraView(printers[p], clientSettings, view);
            printerArea.insertAdjacentHTML("beforeend", printerHTML);
          } else if (view === "group") {
            console.log("GROUP VIEW TODO");
            // let printerHTML = await drawCameraView(printers[p], clientSettings, view);
            // printerArea.insertAdjacentHTML("beforeend", printerHTML);
          } else if (view === "combined") {
            let printerHTML = await drawCombinedView(printers[p], clientSettings, view);
            printerArea.insertAdjacentHTML("beforeend", printerHTML);
          } else {
            console.error("printerPanel could not determine view type to update", view);
          }

          //Update the printer panel to the actual one
          printerPanel = document.getElementById("panel-" + printers[p]._id);
          //Setup Action Buttons
          await actionButtonInit(printers[p], `printerActionBtns-${printers[p]._id}`);
          //Add page listeners
          addListeners(printers[p]);
          //Grab elements
          await grabElements(printers[p]);
          //Initialise Drag and Drop
          await dragAndDropEnable(printerPanel, printers[p]);
        } else {
          if (!printerManagerModal.classList.contains("show")) {
            if (!dragCheck()) {
              await updateState(printers[p], clientSettings, view, p);
            }
            if (powerTimer >= 20000) {
              await PowerButton.applyBtn(printers[p]);
              powerTimer = 0;
            } else {
              powerTimer += 500;
            }
          }
        }
      }
      break;
  }
}
