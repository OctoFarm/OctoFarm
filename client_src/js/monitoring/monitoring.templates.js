import { sortAlphaNum } from "../system/utils/array.utils";
//TODO move this out to sevice
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
//TODO move this out to sevice
function isHidden(state, clientSettings) {
  let hidden = "";
  if (state === "Offline" && clientSettings.views.showOffline) {
    hidden = "hidden";
  } else if (state === "Disconnected" && clientSettings.views.showDisconnected) {
    hidden = "hidden";
  }
  return hidden;
}
//TODO move this out to sevice
function checkPrinterRows(clientSettings) {
  if (clientSettings) {
    return clientSettings.views.cameraColumns;
  } else {
    return 2;
  }
}
function checkGroupColumns(clientSettings) {
  if (clientSettings) {
    return clientSettings.views.groupColumns;
  } else {
    return 2;
  }
}
//TODO move this out to sevice
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

//TODO move this out to sevice
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

export function drawListView(printer, clientSettings) {
  const hidden = isHidden(printer, clientSettings);
  const name = printer.printerName;
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
          <td class="py-auto">
                                    <button
                            title="Select and Manager your printers files"
                            id="printerFilesBtn-${printer._id}"
                            type="button"
                            class="tag btn btn-outline-warning mt-1 mb-1 btn-sm"
                            role="button"
                            data-toggle="modal"
                            data-target="#printerManagerModal"
                          >
                            <i class="fas fa-file-code"></i>
                          </button>
                          <button
                                  title="Control your printer"
                            id="printerButton-${printer._id}"
                            type="button"
                            class="tag btn btn-outline-success mt-1 mb-1 btn-sm"
                            role="button"
                            data-toggle="modal"
                            data-target="#printerManagerModal"
                          >
                            <i class="fas fa-print"></i>
                          </button>
                          <button  
                           title="Printers Terminal"
                           id="printerTerminalButton-${printer._id}"
                           type="button"
                           class="tag btn btn-outline-info btn-sm"
                           data-toggle="modal"
                           data-target="#printerManagerModal"
                           >
                              <i class="fas fa-terminal"></i>
                        </button>
          </td>
          <td class="py-auto">
                    <button
                            title="Start your currently selected print"
                            id="play-${printer._id}"
                            type="button"
                            class="tag btn btn-success mt-1 mb-1 btn-sm"
                            role="button"
                            disabled
                          >
                            <i class="fas fa-play-circle"></i>
                          </button>
                          <button
                                  title="Pause your current print"
                            id="pause-${printer._id}"
                            type="button"
                            class="tag btn btn-light mt-1 mb-1 btn-sm"
                            role="button"
                            disabled
                          >
                            <i class="fas fa-pause"></i>
                          </button>
                          <button
                            title="Restart your current print"
                            id="restart-${printer._id}"
                            type="button"
                            class="tag btn btn-danger mt-1 mb-1 hidden btn-sm"
                            role="button"
                            disabled
                          >
                            <i class="fas fa-undo"></i>
                          </button>
                          <button
                                  title="Resume your current print"
                            id="resume-${printer._id}"
                            type="button"
                            class="tag btn btn-success mt-1 mb-1 hidden btn-sm"
                            role="button"
                            disabled
                          >
                            <i class="fas fa-redo"></i>
                          </button>
                          <button
                                  title="Stop your current print"
                            id="cancel-${printer._id}"
                            type="button"
                            class="tag btn btn-danger mt-1 mb-1 btn-sm"
                            role="button"
                            disabled
                          >
                            <i class="fas fa-square"></i>
                          </button>
          </td>
            <td id="printerActionBtns-${printer._id}" class="py-auto">

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

export function drawPanelView(printer, clientSettings) {
  const hidden = isHidden(printer, clientSettings);
  const name = printer.printerName;
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
                            <i class="fas fa-play-circle"></i> Print
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
                          </button> <br>
                          <button
                            title="Select and Manager your printers files"
                            id="printerFilesBtn-${printer._id}"
                            type="button"
                            class="tag btn btn-outline-warning mt-1 mb-1 btn-sm"
                            role="button"
                            data-toggle="modal"
                            data-target="#printerManagerModal"
                          >
                            <i class="fas fa-file-code"></i> Files
                          </button>
                          <button
                                  title="Control your printer"
                            id="printerButton-${printer._id}"
                            type="button"
                            class="tag btn btn-outline-success mt-1 mb-1 btn-sm"
                            role="button"
                            data-toggle="modal"
                            data-target="#printerManagerModal"
                          >
                            <i class="fas fa-print"></i> Control
                          </button>
                          <button  
                           title="Printers Terminal"
                           id="printerTerminalButton-${printer._id}"
                           type="button"
                           class="tag btn btn-outline-info btn-sm"
                           data-toggle="modal"
                           data-target="#printerManagerModal"
                           >
                              <i class="fas fa-terminal"></i> Terminal
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

export function drawCameraView(printer, clientSettings) {
  let hidden = isHidden(printer, clientSettings);
  if (printer.cameraURL === "") {
    hidden = "hidden";
  }
  const name = printer.printerName;

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
          <div class="row">
            <div class="col-lg-12 camButtons">
                        <small class="float-right pr-2">
                         <button
                            title="Start your currently selected print"
                            id="play-${printer._id}"
                            type="button"
                            class="tag btn btn-outline-success mt-1 mb-1 btn-sm"
                            role="button"
                            disabled
                          >
                            <i class="fas fa-play-circle"></i>
                          </button>
                          <button
                                  title="Pause your current print"
                            id="pause-${printer._id}"
                            type="button"
                            class="tag btn btn-outline-light mt-1 mb-1 hidden btn-sm"
                            role="button"
                            disabled
                          >
                            <i class="fas fa-pause"></i>
                          </button>
                          <button
                            title="Restart your current print"
                            id="restart-${printer._id}"
                            type="button"
                            class="tag btn btn-outline-danger mt-1 mb-1 hidden btn-sm"
                            role="button"
                            disabled
                          >
                            <i class="fas fa-undo"></i>
                          </button>
                          <button
                                  title="Resume your current print"
                            id="resume-${printer._id}"
                            type="button"
                            class="tag btn btn-outline-success mt-1 mb-1 hidden btn-sm"
                            role="button"
                            disabled
                          >
                            <i class="fas fa-redo"></i>
                          </button>
                          <button
                                  title="Stop your current print"
                            id="cancel-${printer._id}"
                            type="button"
                            class="tag btn btn-outline-danger mt-1 mb-1 btn-sm"
                            role="button"
                            disabled
                          >
                            <i class="fas fa-square"></i>
                          </button>
                          
                         </small>
                          <small class="float-left">
                          <button
                            title="Select and Manager your printers files"
                            id="printerFilesBtn-${printer._id}"
                            type="button"
                            class="tag btn btn-outline-warning mt-1 mb-1 btn-sm"
                            role="button"
                            data-toggle="modal"
                            data-target="#printerManagerModal"
                          >
                            <i class="fas fa-file-code"></i>
                          </button>
                          <button
                                  title="Control your printer"
                            id="printerButton-${printer._id}"
                            type="button"
                            class="tag btn btn-outline-success mt-1 mb-1 btn-sm"
                            role="button"
                            data-toggle="modal"
                            data-target="#printerManagerModal"
                          >
                            <i class="fas fa-print"></i>
                          </button>
                          <button  
                           title="Printers Terminal"
                           id="printerTerminalButton-${printer._id}"
                           type="button"
                           class="tag btn btn-outline-info btn-sm"
                           data-toggle="modal"
                           data-target="#printerManagerModal"
                           >
                              <i class="fas fa-terminal"></i>
                        </button>
   
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}

export function drawCombinedView(printer, clientSettings) {
  const hidden = isHidden(printer, clientSettings);
  const name = printer.printerName;
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
                        <div class="col-sm-12 col-md-12 col-lg-6">
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
                        <div class="col-sm-6 col-md-6 col-lg-4">
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
                        <div class="col-sm-6 col-md-6 col-lg-2">
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
                      <div class="col-sm-12 col-md-12 col-lg-8">
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
                        <div class="col-sm-12 col-md-6 col-lg-6 text-center">
                          <button
                            title="Start your currently selected print"
                            id="play-${printer._id}"
                            type="button"
                            class="tag btn btn-success mt-1 mb-1 btn-sm"
                            role="button"
                            disabled
                          >
                            <i class="fas fa-play-circle"></i> Print
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
                          </button> <br>
                          <button
                            title="Select and Manager your printers files"
                            id="printerFilesBtn-${printer._id}"
                            type="button"
                            class="tag btn btn-outline-warning mt-1 mb-1 btn-sm"
                            role="button"
                            data-toggle="modal"
                            data-target="#printerManagerModal"
                          >
                            <i class="fas fa-file-code"></i> Files
                          </button>
                          <button
                                  title="Control your printer"
                            id="printerButton-${printer._id}"
                            type="button"
                            class="tag btn btn-outline-success mt-1 mb-1 btn-sm"
                            role="button"
                            data-toggle="modal"
                            data-target="#printerManagerModal"
                          >
                            <i class="fas fa-print"></i> Control
                          </button>
                          <button  
                           title="Printers Terminal"
                           id="printerTerminalButton-${printer._id}"
                           type="button"
                           class="tag btn btn-outline-info btn-sm"
                           data-toggle="modal"
                           data-target="#printerManagerModal"
                           >
                              <i class="fas fa-terminal"></i> Terminal
                        </button>
                        </div>
                        <div class="col-sm-12 col-md-6 col-lg-6 text-center">
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
                        </div>  
                        </div>
                      </div>
                      <div class="col-sm-12 col-md-12 col-lg-4">
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

export function drawGroupViewContainers(printers, printerArea, clientSettings) {
  const uniqueGroupList = [...new Set(printers.map((printer) => printer.group))];
  const sortedUniqueGroupList = uniqueGroupList.sort(sortAlphaNum);
  const groupColumns = checkGroupColumns(clientSettings);
  sortedUniqueGroupList.forEach((group) => {
    const cleanGroup = encodeURIComponent(group);
    const skipElement = document.getElementById(`Group-${cleanGroup}`);
    if (!skipElement) {
      printerArea.insertAdjacentHTML(
        "beforeend",
        `
            <div id="dropPanel-${cleanGroup}" class="col-sm-12 col-lg-${groupColumns}">
              <div class="card">
                <div class="card-header dashHeader">
                  ${group}
                  <small class="float-right" id="printerActionBtns-${cleanGroup}">

                  </small>
                </div>
                <div class="row">
                    <div class="col-lg-12 py-0 px-0 my-0 mx-0">
                     <div class="progress">
                        <div class="d-none percent">Loading...</div>
                        <div
                          id="progress-${groupColumns}"
                          class="progress-bar progress-bar-striped percent"
                          role="progressbar"
                          style="width: 0%"
                          aria-valuenow="10"
                          aria-valuemin="0"
                          aria-valuemax="100"
                        >
                        0%
                        </div>
                      </div>        
                    </div>
                </div>
           
                <div class="row">
                    <div class="col-12 text-center">   
                      <button
                            title="Start your currently selected print"
                            id="play-${cleanGroup}"
                            type="button"
                            class="tag btn btn-success mt-1 mb-1 btn-sm"
                            role="button"
                            disabled
                          >
                            <i class="fas fa-play-circle"></i> Print
                          </button>
                      <button
                                  title="Pause your current print"
                            id="pause-${cleanGroup}"
                            type="button"
                            class="tag btn btn-light mt-1 mb-1 btn-sm"
                            role="button"
                            disabled
                          >
                            <i class="fas fa-pause"></i> Pause
                          </button>
                      <button
                          title="Restart your current print"
                          id="restart-${cleanGroup}"
                          type="button"
                          class="tag btn btn-danger mt-1 mb-1 hidden btn-sm"
                          role="button"
                          disabled
                        >
                          <i class="fas fa-undo"></i> Restart
                        </button>
                      <button
                                title="Resume your current print"
                          id="resume-${cleanGroup}"
                          type="button"
                          class="tag btn btn-success mt-1 mb-1 hidden btn-sm"
                          role="button"
                          disabled
                        >
                          <i class="fas fa-redo"></i> Resume
                        </button>
                      <button
                                title="Stop your current print"
                          id="cancel-${cleanGroup}"
                          type="button"
                          class="tag btn btn-danger mt-1 mb-1 btn-sm"
                          role="button"
                          disabled
                        >
                          <i class="fas fa-square"></i> Cancel
                        </button>
                    </div>
                </div>
                <div class="row" id="Group-${cleanGroup}">
      
                </div>
              </div> 
            </div>
    `
      );
    }
  });
}

export function drawGroupViewPrinters(printer, clientSettings) {
  printer.forEach((printer) => {
    const cleanGroup = encodeURIComponent(printer.group);
    const groupContainer = document.getElementById(`Group-${cleanGroup}`);
    const skipElement = document.getElementById(`panel-${printer._id}`);
    const groupColumns = checkGroupColumns(clientSettings);
    let panelColumns = 12;
    switch (groupColumns) {
      case 12:
        panelColumns = 2;
        break;
      case 6:
        panelColumns = 4;
        break;
      case 4:
        panelColumns = 6;
        break;
      case 3:
        panelColumns = 6;
        break;
      case 5:
        panelColumns = 2;
        break;
      case 2:
        panelColumns = 12;
        break;
      default:
        panelColumns = 6;
    }
    if (!skipElement) {
      groupContainer.insertAdjacentHTML(
        "beforeend",
        `
        <div class="col-sm-12 col-md-6 col-lg-${panelColumns}">
          <div id="panel-${printer._id}" class="card text-white bg-dark">
            <div class="card-header dashHeader">
                <span id="name-${printer._id}" class="badge badge-secondary float-left ml-1 py-1">${printer.printerName}</span><br>
                <span id="state-${printer._id}" class="w-100 badge ${printer.printerState.colour.category} pl-0 text-wrap"> ${printer.printerState.state}</span>
            </div>
          </div>
        </div>
    `
      );
    }
  });
}
