import Calc from "../../utils/calc";

const getSpinnerElement = () => {
  return "<i class=\"fa-solid fa-circle-notch fa-spin\"></i>";
};

export const getFolderTemplate = (folder, id) => {
  return `
    <a
      id="file-${folder.name}"
      href="#"
      class="list-group-item list-group-item-action flex-column align-items-start bg-dark folderAction"
      style="display: block; padding: 0.7rem 0.1rem;"
    >
      <div class="row">
        <div
          class="col-lg-1"
          style="display:flex; justify-content:center; align-items:center;"
        >
          <i class="fas fa-folder fa-2x"></i>
        </div>
          <div class="col-lg-11">
                  <small class="float-right"></small>
                  <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1 float-left">
                      ${folder.display.replace(/_/g, " ")}
                    </h5>
                    <div
                      class="float-right btn-group flex-wrap btn-group-sm"
                      role="group"
                      aria-label="Basic example"
                    >
                      <button id="${id}*folderActionMove*${
    folder.name
  }" type="button" class="btn btn-warning">
                        <i class="fas fa-people-carry"></i> Move
                      </button>
                      <button id="${id}*folderActionDelete*${
    folder.name
  }" type="button" class="btn btn-danger">
                        <i class="fas fa-trash-alt"></i> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </a>
    `;
};

export const getFileTemplate = (file, printerURL, id) => {
  let toolInfo = "";
  if (file.toolUnits.length === 0) {
    toolInfo = getSpinnerElement();
  } else {
    file.toolUnits.forEach((unit, index) => {
      toolInfo += `<i class="fas fa-weight"></i> ${unit} / <i class="fas fa-dollar-sign"></i> Cost: ${file.toolCosts[index]}<br>`;
    });
  }

  let thumbnail =
    "<span class=\"text-center\"><i class=\"fas fa-file-code fa-2x\"></i></span>";
  if (typeof file.thumbnail !== "undefined" && file.thumbnail !== null) {
    const thumbnailURL = `/octoprint/${id}/${file.thumbnail}`;
    thumbnail = `<span class="text-center"><img src='${thumbnailURL}' width="100%" alt="thumbnail"></span>`;
  }
  let fileDate = new Date(file.uploadDate * 1000);
  const dateString = fileDate.toDateString();
  const timeString = fileDate.toTimeString().substring(0, 8);
  let bgColour = "bg-secondary";
  if (file.last === true) {
    bgColour = "bg-dark-success";
  } else if (file.last === false) {
    bgColour = "bg-dark-failed";
  }

  return `
    <div
      id="file-${file.fullPath}"
      href="#"
          class="list-group-item list-group-item-action flex-column align-items-start ${bgColour}"
            style="display: block;
            padding: 0.7rem 0.1rem;"
            >
            <div class="row">
                <div
                            id="fileThumbnail-${file.fullPath}"
          class="col-lg-2"
            style="display:flex; justify-content:center; align-items:center;"
                >
                ${thumbnail}
                </div>
                <div class="col-lg-10">
                <div class="row">
                <div class="col-12">
                <h5 class="mb-1 name">${file.display}</h5>         
                <small class="mb-1 name">${file.fullPath}</small>         
                </div>
                </div>
                <div class="row">
                <div class="col-12">
                <p class="mb-1 float-right">
                <span title="File specific success / failure rate from OctoPrint" id="fileHistoryRate-${
                  file.fullPath
                }"><i class="fas fa-thumbs-up"></i> ${
    file.success
  } / <i class="fas fa-thumbs-down"></i> ${file.failed}</span><br>
                <i class="fas fa-stopwatch"></i> 
                <span class="time" id="fileTime-${file.fullPath}">
                    ${Calc.generateTime(file.expectedPrintTime)}</span> <br> 
                <i class="fas fa-dollar-sign"></i> 
                <span title="Expected Printer Cost" class="cost" id="fileCost-${
                  file.fullPath
                }"> Printer Cost: ${
    !!file.printCost ? file.printCost.toFixed(2) : getSpinnerElement()
  } </span>    <br> 
                <i class="fa-solid fa-bolt"></i> 
                <span title="Expected Electricity Cost" class="cost" id="fileElectricityCost-${
                  file.fullPath
                }">
               
                Electricity Cost: ${
                  typeof file?.electricityCosts !== "undefined"
                    ? file.electricityCosts.toFixed(2)
                    : getSpinnerElement()
                } </span>    <br> 
                <i class="fa-solid fa-wrench"></i>
                <span title="Expected Maintainence Cost" class="cost" id="fileMaintainenceCost-${
                  file.fullPath
                }"> 
               
                Maintainence Cost: ${
                  typeof file?.maintenanceCosts !== "undefined"
                    ? file.maintenanceCosts.toFixed(2)
                    : getSpinnerElement()
                } </span>    <br> 
                <span title="Expected Filament Cost"> </span>

                </p>
                <p class="mb-1 float-left">
                <i class="fas fa-clock"></i><span id="fileDateClean-${
                  file.fullPath
                }" class="date d-none"> ${
    file.uploadDate
  }</span><span id="fileDate-${
    file.fullPath
  }"> ${dateString} ${timeString}</span><br>
                <span class="size" id="fileSize-${file.fullPath}">${
    !!file?.fileSize ? Calc.bytes(file.fileSize) : getSpinnerElement()
  }</span> <br>
            <span class="usage" title="Expected Filament Usage/Cost" id="fileTool-${
              file.fullPath
            }"> ${toolInfo} </span>

                </p> 
                </div>
                </div>
                </div>
                <div class="col-lg-12">
                <div
          class="d-flex btn-group flex-wrap btn-group-sm"
            role="group"
            aria-label="Basic example"
                >
                <button
            title="Re-Sync File"
            id="${id}*fileActionUpdate*${file.fullPath}"
            role="button"
          class="btn btn-dark"
                >
                <i class="fas fa-sync"></i> Re-Sync
                </button>
                <button           title="Start printing file"
            id="${id}*fileActionStart*${
    file.fullPath
  }" type="button" class="btn btn-success">
          <i class="fas fa-play"></i> Start
              </button>
              <button  title="Select file" id="${id}*fileActionSelect*${
    file.fullPath
  }" type="button" class="btn btn-info">
        <i class="fas fa-file-upload"></i> Select
            </button>
            <button          title="Move file" id="${id}*fileActionMove*${
    file.fullPath
  }" type="button" class="btn btn-warning">
      <i class="fas fa-people-carry"></i> Move
          </button>
          <button          title="Download file" onclick="window.open('${printerURL}/downloads/files/local/${encodeURI(
    file.fullPath
  )}')" type="button" class="btn btn-dark">
    <i class="fas fa-download"></i> Download
        </button>
        <button title="Delete file" id="${printerURL}*fileActionDelete*${
    file.fullPath
  }" type="button" class="btn btn-danger">
  <i class="fas fa-trash-alt"></i> Delete
      </button>
      </div>
      </div>
      </div>
      </div>
  </div>
  `;
};
export const noFilesToShow = () => {
  return `
       <div
          id="noFilesToBeShown"
          href="#"
          class="list-group-item list-group-item-action flex-column align-items-start bg-secondary"
          style="display: block;
          padding: 0.7rem 0.1rem;"
          >
          <div class="row">
            <div class="col-lg-12">
              <div class="row">
                <div class="col-12">
                    <h5 class="mb-1 name">No files available...</h5>         
                </div>
              </div>
            </div>
          </div>
      </div> 
    `;
};

export const printerProfileTemplate = (printer) => {
    let defaultProfileString = "<i class=\"fas fa-cube\"></i> Couldn't find profile";

    const { currentProfile } = printer;

    if(!!currentProfile){
        defaultProfileString = `<b>H:</b> ${printer.currentProfile.volume.height}mm x <b>W:</b> ${printer.currentProfile.volume.width}mm x <b>D:</b> ${printer.currentProfile.volume.depth}mm`
    }

    return `
    <small class="pt-2 float-left">
        ${defaultProfileString}
    </small>
    <br><!--Fix for firefox-->
    <small class="pt-2 pb-2 float-left"><i class="fas fa-pen"></i> <b>Extruders:</b>
       ${printer.currentProfile.extruder.count}
       <b>Nozzle Size:</b> 
       ${printer.currentProfile.extruder.nozzleDiameter}mm
    </small>
    `
}

export const printerTemplate = (printer, storageWarning, extruderList) => {
  return `
          <a
            data-jplist-item
            id="fileManagerPrinter-${printer._id}"
            class="list-group-item list-group-item-action flex-column align-items-start bg-secondary"
            style="display: block;
            padding: 0.7rem 0.1rem;"
          >
            <div class="row">
              <div
                class="col-lg-2"
                style="display:flex; justify-content:center; align-items:center;"
              >
                  
                  <small class="text-center">
                    <p><i class="fas fa-print fa-2x" style="color:${printer.settingsAppearance.color}"></i></p>
                      <span title="${printer.printerState.desc}" id="printerBadge-${printer._id}" class="tag badge badge-${printer.printerState.colour.name} badge-pill ${printer.printerState.colour.category} text-center">
                         ${printer.printerState.state}
                      </span>
                      <span id="fileManagerfileCount-${printer._id}" class="badge badge-secondary badge-pill text-center">
                       Files: ${printer.fileList.fileList.length}
                    </span>
                    <span id="fileManagerFolderCount-${printer._id}" class="badge badge-secondary badge-pill text-center">
                       Folders: ${printer.fileList.folderList.length}
                    </span>
                  </small>
              </div>
              <div class="col-lg-10">
                <button type="button" class="btn btn-secondary text-left" style="background-color: Transparent; border: 0; pointer-events: none" id="printerName-${printer._id}" disabled>${printer.printerName}</button>
                ${storageWarning}
                <div class="row">

                </div>
                ${printerProfileTemplate(printer)}
                ${extruderList}
              </div>
            </div>
          </a>
    `;
};
