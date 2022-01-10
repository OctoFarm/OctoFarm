import {dragAndDropEnable, dragAndDropGroupEnable, dragCheck} from "../../lib/functions/dragAndDrop.js";
import PrinterManager from "../../lib/modules/printerManager.js";
import PrinterFileManager from "../../lib/modules/printerFileManager.js";
import UI from "../../lib/functions/ui.js";
import Calc from "../../lib/functions/calc.js";
import {
    checkGroupQuickConnectState,
    checkQuickConnectState,
    groupInit as actionButtonGroupInit,
    init as actionButtonInit
} from "../../lib/modules/Printers/actionButtons.js";
import OctoPrintClient from "../../lib/octoprint.js";
import {checkTemps} from "../../lib/modules/temperatureCheck.js";
import doubleClickFullScreen from "../../lib/functions/fullscreen.js";
import OctoFarmClient from "../../services/octofarm-client.service";
import {getControlList, getPrinterInfo} from "./monitoring-view.state";
import {
    drawCameraView,
    drawCombinedView,
    drawGroupViewContainers,
    drawGroupViewPrinters,
    drawListView,
    drawPanelView
} from "./monitoring.templates";
import PrinterTerminalManager from "../../lib/modules/printerTerminalManager";
import {groupBy, mapValues} from "lodash";
import {FileActions} from "../../lib/modules/fileManager";

let elems = [];
let groupElems = [];
let powerTimer = 20000;
let printerManagerModal = document.getElementById("printerManagerModal");
const currentOpenModal = document.getElementById("printerManagerModalTitle");
let printerArea = document.getElementById("printerArea");
let actionButtonsInitialised;

document.getElementById("filterStates").addEventListener("change", (e) => {
  printerArea.innerHTML = "";
  elems = [];
  groupElems = [];
  actionButtonsInitialised = false;
  OctoFarmClient.get("client/updateFilter/" + e.target.value);
});
document.getElementById("sortStates").addEventListener("change", (e) => {
  printerArea.innerHTML = "";
  elems = [];
  groupElems = [];
  actionButtonsInitialised = false;
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
  document
    .getElementById(`printerTerminalButton-${printer._id}`)
    .addEventListener("click", async () => {
      currentOpenModal.innerHTML = "Printer Terminal: ";
      const printerInfo = getPrinterInfo();
      const controlList = getControlList();
      await PrinterTerminalManager.init(printer._id, printerInfo, controlList);
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
function updateGroupFileListeners(printers) {
  const fileActionBtns = document.querySelectorAll("[id*='*fileAction']");
  fileActionBtns.forEach((btn) => {
    // Gate Keeper listener for file action buttons
    const button = btn;
    btn.addEventListener("click", async function (e) {
      printers.forEach((printer) => {
        const data = button.id.split("*");
        const action = data[1];
        const filePath = data[2];
        if (action === "fileActionStart") {
          FileActions.startPrint(printer, filePath, true);
          UI.createAlert(
            "success",
            filePath + " has started to print on all printers!",
            3000,
            "clicked"
          );
        } else if (action === "fileActionSelect") {
          FileActions.selectFile(printer, filePath, true);
          UI.createAlert(
            "success",
            filePath + " has been selected on all printers!",
            3000,
            "clicked"
          );
        }
      });
    });
  });
}
function drawGroupFiles(fileList, currentGroupEncoded, printers) {
  try {
    const fileElem = document.getElementById("printFilesList");
    fileElem.innerHTML = "";
    if (fileElem) {
      // Filter out files out of current folder scope
      const currentFileList = fileList;
      // Show empty or filled list
      if (currentFileList.length > 0) {
        currentFileList.forEach((file) => {
          let toolInfo = "";
          file.toolUnits.forEach((unit, index) => {
            toolInfo += `<i class="fas fa-weight"></i> ${unit} / <i class="fas fa-dollar-sign"></i> Cost: ${file.toolCosts[index]}<br>`;
          });
          let thumbnail = '<center><i class="fas fa-file-code fa-2x"></i></center>';
          if (typeof file.thumbnail !== "undefined" && file.thumbnail !== null) {
            thumbnail = `<center><img src='${printers[0].printerURL}/${file.thumbnail}' width="100%"></center>`;
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
          const f = ` <div
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
                <h5 class="mb-1 name">${file.fullPath}</h5>              
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
                }" class="date d-none"> ${file.uploadDate}</span><span id="fileDate-${
            file.fullPath
          }"> ${fileDate}</span><br>
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
                <button           title="Start printing file"
            id="${currentGroupEncoded._id}*fileActionStart*${
            file.fullPath
          }" type="button" class="btn btn-success">
          <i class="fas fa-play"></i> Start
              </button>
              <button  title="Select file" id="${currentGroupEncoded._id}*fileActionSelect*${
            file.fullPath
          }" type="button" class="btn btn-info">
        <i class="fas fa-file-upload"></i> Select
            </button>
      </div>
      </div>
      </div>
      </div>
      </div>`;
          fileElem.insertAdjacentHTML("beforeend", f);
        });
      } else {
        fileElem.insertAdjacentHTML(
          "beforeend",
          `
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
            
            `
        );
      }
    }
  } catch (e) {
    console.log(e);
  }
  updateGroupFileListeners(printers);
}

function addGroupListeners(printers) {
  const groupedPrinters = mapValues(groupBy(printers, "group"));
  for (const key in groupedPrinters) {
    if (groupedPrinters.hasOwnProperty(key)) {
      const currentGroupEncoded = encodeURIComponent(key);
      //Play button listeners
      let playBtn = document.getElementById("play-" + currentGroupEncoded);
      if (playBtn) {
        playBtn.addEventListener("click", (e) => {
          e.target.disabled = true;
          for (let p = 0; p < groupedPrinters[key].length; p++) {
            const printer = groupedPrinters[key][p];
            const opts = {
              command: "start"
            };
            const print = returnPrinterInfo(printer._id);
            OctoPrintClient.jobAction(print, opts, e);
          }
        });
      }
      let cancelBtn = document.getElementById("cancel-" + currentGroupEncoded);
      if (cancelBtn) {
        cancelBtn.addEventListener("click", (e) => {
          bootbox.confirm({
            message: "Are you sure you want to cancel the ongoing prints?",
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
                for (let p = 0; p < groupedPrinters[key].length; p++) {
                  const printer = groupedPrinters[key][p];
                  const print = returnPrinterInfo(printer._id);
                  const opts = {
                    command: "cancel"
                  };
                  OctoPrintClient.jobAction(print, opts, e);
                }
              }
            }
          });
        });
      }
      let restartBtn = document.getElementById("restart-" + currentGroupEncoded);
      if (restartBtn) {
        restartBtn.addEventListener("click", (e) => {
          e.target.disabled = true;
          for (let p = 0; p < groupedPrinters[key].length; p++) {
            const printer = groupedPrinters[key][p];
            const opts = {
              command: "restart"
            };
            const print = returnPrinterInfo(printer._id);
            OctoPrintClient.jobAction(print, opts, e);
          }
        });
      }
      let pauseBtn = document.getElementById("pause-" + currentGroupEncoded);
      if (pauseBtn) {
        pauseBtn.addEventListener("click", (e) => {
          e.target.disabled = true;
          for (let p = 0; p < groupedPrinters[key].length; p++) {
            const printer = groupedPrinters[key][p];
            const opts = {
              command: "pause",
              action: "pause"
            };
            const print = returnPrinterInfo(printer._id);
            OctoPrintClient.jobAction(print, opts, e);
          }
        });
      }
      let resumeBtn = document.getElementById("resume-" + currentGroupEncoded);
      if (resumeBtn) {
        resumeBtn.addEventListener("click", (e) => {
          e.target.disabled = true;
          for (let p = 0; p < groupedPrinters[key].length; p++) {
            const printer = groupedPrinters[key][p];
            const opts = {
              command: "pause",
              action: "resume"
            };
            const print = returnPrinterInfo(printer._id);
            OctoPrintClient.jobAction(print, opts, e);
          }
        });
      }
      let filesBtn = document.getElementById("unifiedFiles-" + currentGroupEncoded);
      if (filesBtn) {
        filesBtn.addEventListener("click", async (e) => {
          const idList = [];
          for (let p = 0; p < groupedPrinters[key].length; p++) {
            const printer = groupedPrinters[key][p];
            idList.push(printer._id);
          }
          const fileList = await OctoFarmClient.get(
            "printers/listUnifiedFiles/" + JSON.stringify(idList)
          );
          drawGroupFiles(fileList, currentGroupEncoded, groupedPrinters[key]);
        });
      }
    }
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
      terminal: document.getElementById("printerTerminalButton-" + printer._id),
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
function grabGroupElements(group) {
  if (typeof groupElems[group] !== "undefined") {
    return groupElems[group];
  } else {
    groupElems[group] = {
      name: document.getElementById("name-" + group),
      start: document.getElementById("play-" + group),
      stop: document.getElementById("cancel-" + group),
      pause: document.getElementById("pause-" + group),
      restart: document.getElementById("restart-" + group),
      resume: document.getElementById("resume-" + group),
      state: document.getElementById("state-" + group),
      progress: document.getElementById("progress-" + group),
      unifiedFiles: document.getElementById("unifiedFiles-" + group)
    };
    return groupElems[group];
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
  const isOffline = printer.printerState.colour.category === "Offline";

  elements.control.disabled = isOffline;
  elements.files.disabled = isOffline;
  elements.terminal.disabled = isOffline;

  UI.doesElementNeedUpdating(printer.printerState.state, elements.state, "innerHTML");

  let stateCategory = printer.printerState.colour.category;
  if (stateCategory === "Error!") {
    stateCategory = "Offline";
  }
  UI.doesElementNeedUpdating(printer.printerName, elements.name, "innerHTML");

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

  if (!!printer?.layerData) {
    const formatLayerData = `<i class="fas fa-layer-group"></i> ${printer.layerData.currentLayer} / ${printer.layerData.totalLayers} (${printer.layerData.percentComplete}%)`;
    UI.doesElementNeedUpdating(formatLayerData, elements.layerData, "innerHTML");
  }
  if (!!printer.tools) {
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
        if (tool) {
          tool.innerHTML = `${printer.selectedFilament[i]?.spools?.profile?.material}`;
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

  if (!clientSettings?.views?.showDisconnected) {
    hideClosed = "hidden";
  }
  if (!clientSettings?.views?.showOffline) {
    hideOffline = "hidden";
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
    }
    if (elements.stop) {
      elements.stop.disabled = false;
    }

    if (printer.printerState.state === "Pausing") {
      if (elements.start) {
        elements.start.classList.remove("hidden");
      }
      if (elements.stop) {
        elements.stop.disabled = false;
      }
      if (elements.resume) {
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
    } else if (printer.printerState.state === "Paused") {
      if (elements.start) {
        elements.start.classList.add("hidden");
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
        elements.start.classList.remove("hidden");
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
    if (!!printer.currentJob && printer.currentJob.fileName !== "No File Selected") {
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
        elements.start.classList.add("hidden");
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
        elements.start.classList.remove("hidden");
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
    if (hideClosed !== "") {
      elements.row.classList.add(hideClosed);
    }
    if (elements.start) {
      elements.start.disabled = true;
      elements.start.classList.remove("hidden");
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
    if (hideOffline !== "") {
      elements.row.classList.add(hideOffline);
    }
    if (elements.start) {
      elements.start.disabled = true;
      elements.start.classList.remove("hidden");
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

async function updateGroupState(printers, clientSettings, view) {
  checkGroupQuickConnectState(printers);
  printers.forEach((printer, index) => {
    if (printer.group !== "" || !printer.disabled) {
      const elements = grabElements(printer);
      if (!elements?.row) return;
      elements.row.style.order = index;
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
            case "group":
              elements.row.style.display = "flex";
              break;
            case "combined":
              elements.row.style.display = "flex";
              break;
          }
        }
      } else {
        if (elements.row.style.display !== "none") {
          elements.row.style.display = "none";
        }
        return;
      }

      let hideOffline = "";
      let hideClosed = "";

      if (!clientSettings?.views?.showDisconnected) {
        hideClosed = "hidden";
      }
      if (!clientSettings?.views?.showOffline) {
        hideOffline = "hidden";
      }

      if (printer.printerState.colour.category === "Active") {
        // Set the state
        if (elements.row.classList.contains(hideClosed)) {
          elements.row.classList.remove(hideClosed);
        }
        if (elements.row.classList.contains(hideOffline)) {
          elements.row.classList.remove(hideOffline);
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
      } else if (printer.printerState.state === "Disconnected") {
        if (hideClosed !== "") {
          elements.row.classList.add(hideClosed);
        }
      } else if (printer.printerState.colour.category === "Offline") {
        if (hideOffline !== "") {
          elements.row.classList.add(hideOffline);
        }
      }
      UI.doesElementNeedUpdating(printer.printerName, elements.name, "innerHTML");
      UI.doesElementNeedUpdating(printer.printerState.state, elements.state, "innerHTML");
      UI.doesElementNeedUpdating(
        `w-100 badge ${printer.printerState.colour.category}`,
        elements.state,
        "classList"
      );
    }
  });
  const groupedPrinters = mapValues(groupBy(printers, "group"));
  for (const key in groupedPrinters) {
    if (groupedPrinters.hasOwnProperty(key)) {
      if (key !== "") {
        const currentGroupEncoded = encodeURIComponent(key);
        const elements = grabGroupElements(currentGroupEncoded);
        const offlinePrinters = groupedPrinters[key].filter(
          (obj) => obj.printerState.colour.category === "Offline"
        ).length;
        const disconnectedPrinters = groupedPrinters[key].filter(
          (obj) => obj.printerState.state === "Disconnected"
        ).length;
        const idlePrinters = groupedPrinters[key].filter(
          (obj) => obj.printerState.colour.category === "Idle"
        ).length;
        const completePrinters = groupedPrinters[key].filter(
          (obj) => obj.printerState.colour.category === "Complete"
        ).length;
        const activePrinters = groupedPrinters[key].filter(
          (obj) => obj.printerState.colour.category === "Active"
        ).length;
        const pausedPrinters = groupedPrinters[key].filter(
          (obj) => obj.printerState.state === "Paused"
        ).length;
        const pausingPrinters = groupedPrinters[key].filter(
          (obj) => obj.printerState.state === "Pausing"
        ).length;
        const filesSelected = groupedPrinters[key].filter(
          (obj) => obj?.currentJob?.fileName !== "No File Selected"
        ).length;

        let combinedProgress = groupedPrinters[key].reduce(function (a, b) {
          return a + b?.["currentJob"]?.["progress"];
        }, 0);

        const actualProgress = combinedProgress / groupedPrinters[key].length;
        UI.doesElementNeedUpdating(actualProgress.toFixed(0) + "%", elements.progress, "innerHTML");
        elements.progress.style.width = actualProgress + "%";

        if (actualProgress < 100) {
          UI.doesElementNeedUpdating(
            "progress-bar progress-bar-striped bg-warning",
            elements.progress,
            "classList"
          );
        } else if (actualProgress === 100) {
          UI.doesElementNeedUpdating(
            "progress-bar progress-bar-striped bg-success",
            elements.progress,
            "classList"
          );
        }

        if (activePrinters === groupedPrinters[key].length) {
          //Set the buttons
          if (elements.start) {
            elements.start.disabled = true;
          }
          if (elements.stop) {
            elements.stop.disabled = false;
          }

          if (pausingPrinters === groupedPrinters[key].length) {
            if (elements.start) {
              elements.start.classList.remove("hidden");
            }
            if (elements.stop) {
              elements.stop.disabled = false;
            }
            if (elements.resume) {
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
          } else if (pausedPrinters === groupedPrinters[key].length) {
            if (elements.start) {
              elements.start.classList.add("hidden");
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
              elements.start.classList.remove("hidden");
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
          idlePrinters === groupedPrinters[key].length ||
          completePrinters === groupedPrinters[key].length
        ) {
          if (filesSelected === groupedPrinters[key].length) {
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
          if (pausedPrinters === groupedPrinters[key].length) {
            if (elements.start) {
              elements.start.classList.add("hidden");
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
              elements.start.classList.remove("hidden");
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
        } else if (disconnectedPrinters === groupedPrinters[key].length) {
          if (elements.start) {
            elements.start.disabled = true;
            elements.start.classList.remove("hidden");
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
        } else if (offlinePrinters === groupedPrinters[key].length) {
          if (elements.start) {
            elements.start.disabled = true;
            elements.start.classList.remove("hidden");
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
    }
  }
}

export async function initMonitoring(printers, clientSettings, view) {
  // Check if printer manager modal is opened
  switch (printerManagerModal.classList.contains("show")) {
    case true:
      // Run printer manager updater
      if (currentOpenModal.innerHTML.includes("Files")) {
        await PrinterFileManager.init("", printers, getControlList());
      } else if (currentOpenModal.innerHTML.includes("Control")) {
        await PrinterManager.init("", printers, getControlList());
      } else if (currentOpenModal.innerHTML.includes("Terminal")) {
        await PrinterTerminalManager.init("", printers, getControlList());
      }
      break;
    case false:
      // initialise or start the information updating..
      for (let p = 0; p < printers.length; p++) {
        if (!printers[p].disabled) {
          let printerPanel = document.getElementById("panel-" + printers[p]._id);
          if (!printerPanel) {
            if (view === "panel") {
              let printerHTML = drawPanelView(printers[p], clientSettings);
              printerArea.insertAdjacentHTML("beforeend", printerHTML);
            } else if (view === "list") {
              let printerHTML = drawListView(printers[p], clientSettings);
              printerArea.insertAdjacentHTML("beforeend", printerHTML);
            } else if (view === "camera") {
              let printerHTML = drawCameraView(printers[p], clientSettings);
              printerArea.insertAdjacentHTML("beforeend", printerHTML);
            } else if (view === "group") {
              drawGroupViewContainers(printers, printerArea, clientSettings);
              drawGroupViewPrinters(printers, clientSettings);
            } else if (view === "combined") {
              let printerHTML = drawCombinedView(printers[p], clientSettings);
              printerArea.insertAdjacentHTML("beforeend", printerHTML);
            } else {
              console.error("printerPanel could not determine view type to update", view);
            }

            if (view !== "group") {
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
              if (!actionButtonsInitialised) {
                //Setup Action Buttons
                await actionButtonGroupInit(printers);

                addGroupListeners(printers);
                await dragAndDropGroupEnable(printers);
                actionButtonsInitialised = true;
              }
            }
          } else {
            if (!printerManagerModal.classList.contains("show")) {
              if (!dragCheck()) {
                if (view !== "group") {
                  await updateState(printers[p], clientSettings, view, p);
                }
              }
              if (powerTimer >= 20000) {
                //await PowerButton.applyBtn(printers[p]);
                powerTimer = 0;
              } else {
                powerTimer += 500;
              }
            }
          }
        }
      }
      if (view === "group") {
        await updateGroupState(printers, clientSettings, view);
      }
      break;
  }
}
