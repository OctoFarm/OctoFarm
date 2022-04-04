import Calc from "../../utils/calc";

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
  file.toolUnits.forEach((unit, index) => {
    toolInfo += `<i class="fas fa-weight"></i> ${unit} / <i class="fas fa-dollar-sign"></i> Cost: ${file.toolCosts[index]}<br>`;
  });
  let thumbnail =
    "<span class=\"text-center\"><i class=\"fas fa-file-code fa-2x\"></i></span>";
  if (typeof file.thumbnail !== "undefined" && file.thumbnail !== null) {
    thumbnail = `<span class="text-center"><img src='${printerURL}/${file.thumbnail}' width="100%" alt="thumbnail"></span>`;
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
  fileDate = `${dateString} ${timeString}`;
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
                }"> Print Cost: ${file.printCost?.toFixed(2)} </span>    <br> 
            <span title="Expected Filament Cost"> </span>

                </p>
                <p class="mb-1 float-left">
                <i class="fas fa-clock"></i><span id="fileDateClean-${
                  file.fullPath
                }" class="date d-none"> ${
    file.uploadDate
  }</span><span id="fileDate-${file.fullPath}"> ${fileDate}</span><br>
                <i class="fas fa-hdd"></i><span class="size" id="fileSize-${
                  file.fullPath
                }"> ${Calc.bytes(file.fileSize)}</span> <br>
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
      encodeURIComponent(file.fullPath)
  }" type="button" class="btn btn-success">
          <i class="fas fa-play"></i> Start
              </button>
              <button  title="Select file" id="${
                id
              }*fileActionSelect*${
      encodeURIComponent(file.fullPath)
  }" type="button" class="btn btn-info">
        <i class="fas fa-file-upload"></i> Select
            </button>
            <button          title="Move file" id="${
              id
            }*fileActionMove*${
      encodeURIComponent(file.fullPath)
  }" type="button" class="btn btn-warning">
      <i class="fas fa-people-carry"></i> Move
          </button>
          <button          title="Download file" onclick="window.open('${printerURL}/downloads/files/local/${
      encodeURIComponent(file.fullPath)
  }')" type="button" class="btn btn-dark">
    <i class="fas fa-download"></i> Download
        </button>
        <button title="Delete file" id="${printerURL}*fileActionDelete*${
      encodeURIComponent(file.fullPath)
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
