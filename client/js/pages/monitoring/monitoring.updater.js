import {
  dragAndDropEnable,
  dragAndDropGroupEnable,
  dragCheck,
} from "../../utils/dragAndDrop.js";
import PrinterControlManagerService from "./services/printer-control-manager.service.js";
import PrinterFileManagerService from "./services/printer-file-manager.service.js";
import UI from "../../utils/ui.js";
import Calc from "../../utils/calc.js";
import {
  checkGroupQuickConnectState,
  checkQuickConnectState,
  groupInit as actionButtonGroupInit,
  init as actionButtonInit,
} from "../../services/printer-action-buttons.service.js";
import OctoPrintClient from "../../services/octoprint/octoprint-client.service.js";
import { checkTemps } from "../../utils/temperature-check.util.js";
import doubleClickFullScreen from "../../utils/fullscreen.js";
import OctoFarmClient from "../../services/octofarm-client.service";
import { getControlList, getPrinterInfo } from "./monitoring-view.state";
import {
  drawCameraView,
  drawCombinedView,
  drawGroupViewContainers,
  drawGroupViewPrinters,
  drawListView,
  drawPanelView,
} from "./monitoring.templates";
import PrinterTerminalManagerService from "./services/printer-terminal-manager.service";
import { groupBy, mapValues } from "lodash";
import { printActionStatusResponse } from "../../services/octoprint/octoprint.helpers-commands.actions";
import {
  printerIsAvailableToView,
  printerIsOnline,
  printerIsPrintingOrComplete,
} from "../../utils/octofarm.utils";
import { initialiseCurrentJobPopover } from "./services/printer-current-job.service";
import { returnMinimalLayerDataDisplay } from "../../services/octoprint/octoprint-display-layer-plugin.service";
import { ClientErrors } from "../../exceptions/octofarm-client.exceptions";
import { ApplicationError } from "../../exceptions/application-error.handler";
import {
  fillMiniFilamentDropDownList,
  findMiniFilamentDropDownsSelect, returnDropDownList,
} from "../../services/printer-filament-selector.service";
import {checkKlipperState} from "../../services/octoprint/checkKlipperState.actions";

let elems = [];
let groupElems = [];
let printerManagerModal = document.getElementById("printerManagerModal");
const currentOpenModal = document.getElementById("printerManagerModalTitle");
let printerArea = document.getElementById("printerArea");
let actionButtonsInitialised;

let spoolDropDownList;

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
      return o._id === id;
    });
    return statePrinterInfo[zeeIndex];
  } else {
    return statePrinterInfo;
  }
};

async function addListeners(printer) {
  //For now Control has to be seperated
  document
    .getElementById(`printerInfoButton-${printer._id}`)
    .addEventListener("click", async () => {
      currentOpenModal.innerHTML = "Printer Job Status: ";
      const printerInfo = getPrinterInfo();
      const controlList = getControlList();
      await initialiseCurrentJobPopover(printer._id, printerInfo, controlList);
    });
  document
    .getElementById(`printerButton-${printer._id}`)
    .addEventListener("click", async () => {
      currentOpenModal.innerHTML = "Printer Control: ";
      const printerInfo = getPrinterInfo();
      const controlList = getControlList();
      await PrinterControlManagerService.init(
        printer._id,
        printerInfo,
        controlList
      );
    });
  document
    .getElementById(`printerFilesBtn-${printer._id}`)
    .addEventListener("click", async () => {
      currentOpenModal.innerHTML = "Printer Files: ";
      const printerInfo = getPrinterInfo();
      const controlList = getControlList();
      await PrinterFileManagerService.init(
        printer._id,
        printerInfo,
        controlList
      );
    });
  document
    .getElementById(`printerTerminalButton-${printer._id}`)
    .addEventListener("click", async () => {
      currentOpenModal.innerHTML = "Printer Terminal: ";
      const printerInfo = getPrinterInfo();
      const controlList = getControlList();
      await PrinterTerminalManagerService.init(
        printer._id,
        printerInfo,
        controlList
      );
    });

  //Play button listeners
  let playBtn = document.getElementById("play-" + printer._id);
  if (playBtn) {
    playBtn.addEventListener("click", async (e) => {
      e.target.disabled = true;
      const opts = {
        command: "start",
      };
      const print = returnPrinterInfo(printer._id);
      const octoPrintCall = await OctoPrintClient.jobAction(print, opts, e);
      if (!!octoPrintCall?.status) {
        printActionStatusResponse(octoPrintCall?.status, "print");
      }
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
            label: "<i class=\"fa fa-times\"></i> Cancel",
          },
          confirm: {
            label: "<i class=\"fa fa-check\"></i> Confirm",
          },
        },
        async callback(result) {
          if (result) {
            e.target.disabled = true;
            const opts = {
              command: "cancel",
            };
            const { status } = await OctoPrintClient.jobAction(print, opts, e);
            printActionStatusResponse(status, "cancel");
          }
        },
      });
    });
  }
  let restartBtn = document.getElementById("restart-" + printer._id);
  if (restartBtn) {
    restartBtn.addEventListener("click", async (e) => {
      e.target.disabled = true;
      const opts = {
        command: "restart",
      };
      const print = returnPrinterInfo(printer._id);
      const { status } = await OctoPrintClient.jobAction(print, opts, e);
      printActionStatusResponse(status, "restart");
    });
  }
  let pauseBtn = document.getElementById("pause-" + printer._id);
  if (pauseBtn) {
    pauseBtn.addEventListener("click", async (e) => {
      e.target.disabled = true;
      const opts = {
        command: "pause",
        action: "pause",
      };
      const print = returnPrinterInfo(printer._id);
      const { status } = await OctoPrintClient.jobAction(print, opts, e);
      printActionStatusResponse(status, "pause");
    });
  }
  let resumeBtn = document.getElementById("resume-" + printer._id);
  if (resumeBtn) {
    resumeBtn.addEventListener("click", async (e) => {
      e.target.disabled = true;
      const opts = {
        command: "pause",
        action: "resume",
      };
      const print = returnPrinterInfo(printer._id);
      const { status } = await OctoPrintClient.jobAction(print, opts, e);
      printActionStatusResponse(status, "resume");
    });
  }
  let cameraContain = document.getElementById("cameraContain-" + printer._id);
  if (cameraContain) {
    cameraContain.addEventListener("dblclick", (e) => {
      doubleClickFullScreen(e.target);
    });
  }

  if (!!printer?.currentProfile) {
    for (let i = 0; i < printer.currentProfile?.extruder?.count; i++) {
      const miniFilamentDropdownSelect = findMiniFilamentDropDownsSelect(
        printer._id,
        i
      );
      await fillMiniFilamentDropDownList(
        miniFilamentDropdownSelect,
        printer,
        i,
        spoolDropDownList
      );
    }
  }

  return "done";
}

function drawGroupFiles(fileList) {
  try {
    const fileElem = document.getElementById("printFilesList");
    fileElem.innerHTML = "";
    if (fileElem) {
      // Filter out files out of current folder scope
      const currentFileList = fileList;
      // Show empty or filled list
      if (currentFileList.length > 0) {
        fileElem.innerHTML = "<select id=\"groupFilesList\" class=\"custom-select\"></select>"
        const groupFileList = document.getElementById("groupFilesList");

        currentFileList.forEach((file) => {
          groupFileList.insertAdjacentHTML("beforeend",  `<option value="${file.fullPath.replace(/%/g, "_")}"> ${file.fullPath} </option>`)
        });

        fileElem.insertAdjacentHTML("beforeend",   "<button id=\"groupFileActionButton\" type=\"button\" class=\"mt-5 btn btn-success\">Start Prints!</button>")
      } else {
        fileElem.innerHTML =
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
            `;
      }
    }
  } catch (e) {
    console.error(e);
  }
}

function addGroupListeners(printers) {
  const groupedPrinters = mapValues(groupBy(printers, "group"));
  for (const key in groupedPrinters) {
    if (groupedPrinters.hasOwnProperty(key)) {
      const currentGroupEncoded = encodeURIComponent(key);
      //Play button listeners
      let playBtn = document.getElementById("play-" + currentGroupEncoded);
      if (playBtn) {
        playBtn.addEventListener("click", async (e) => {
          e.target.disabled = true;
          for (const printer of groupedPrinters[key]) {
            const opts = {
              command: "start",
            };
            const print = returnPrinterInfo(printer._id);
            const { status } = await OctoPrintClient.jobAction(print, opts, e);
            printActionStatusResponse(status, "print");
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
                label: "<i class=\"fa fa-times\"></i> Cancel",
              },
              confirm: {
                label: "<i class=\"fa fa-check\"></i> Confirm",
              },
            },
            async callback(result) {
              if (result) {
                e.target.disabled = true;
                for (const printer of groupedPrinters[key]) {
                  const print = returnPrinterInfo(printer._id);
                  const opts = {
                    command: "cancel",
                  };
                  const { status } = await OctoPrintClient.jobAction(
                    print,
                    opts,
                    e
                  );
                  printActionStatusResponse(status, "cancel");
                }
              }
            },
          });
        });
      }
      let restartBtn = document.getElementById(
        "restart-" + currentGroupEncoded
      );
      if (restartBtn) {
        restartBtn.addEventListener("click", async (e) => {
          e.target.disabled = true;
          for (const printer of groupedPrinters[key]) {
            const opts = {
              command: "restart",
            };
            const print = returnPrinterInfo(printer._id);
            const { status } = await OctoPrintClient.jobAction(print, opts, e);
            printActionStatusResponse(status, "restart");
          }
        });
      }
      let pauseBtn = document.getElementById("pause-" + currentGroupEncoded);
      if (pauseBtn) {
        pauseBtn.addEventListener("click", async (e) => {
          e.target.disabled = true;
          for (const printer of groupedPrinters[key]) {
            const opts = {
              command: "pause",
              action: "pause",
            };
            const print = returnPrinterInfo(printer._id);
            const { status } = await OctoPrintClient.jobAction(print, opts, e);
            printActionStatusResponse(status, "pause");
          }
        });
      }
      let resumeBtn = document.getElementById("resume-" + currentGroupEncoded);
      if (resumeBtn) {
        resumeBtn.addEventListener("click", async (e) => {
          e.target.disabled = true;
          for (const printer of groupedPrinters[key]) {
            const opts = {
              command: "pause",
              action: "resume",
            };
            const print = returnPrinterInfo(printer._id);
            const { status } = await OctoPrintClient.jobAction(print, opts, e);
            printActionStatusResponse(status, "resume");
          }
        });
      }
      let filesBtn = document.getElementById(
        "unifiedFiles-" + currentGroupEncoded
      );
      if (filesBtn) {
        filesBtn.addEventListener("click", async () => {
          const idList = [];
          for (const printer of groupedPrinters[key]) {
            idList.push(printer._id);
          }
          const fileList = await OctoFarmClient.get(
            "printers/listUnifiedFiles/" + JSON.stringify(idList)
          );
          drawGroupFiles(fileList);
        });
      }
    }
  }

  return "done";
}

function grabElements(printer) {
  const { _id } = printer;
  if (typeof elems[_id] !== "undefined") {
    return elems[_id];
  } else {
    elems[_id] = {
      row: document.getElementById("panel-" + _id),
      name: document.getElementById("name-" + _id),
      control: document.getElementById("printerButton-" + _id),
      files: document.getElementById("printerFilesBtn-" + _id),
      terminal: document.getElementById("printerTerminalButton-" + _id),
      job: document.getElementById("printerInfoButton-" + _id),
      connect: document.getElementById("printerQuickConnect-" + _id),
      start: document.getElementById("play-" + _id),
      stop: document.getElementById("cancel-" + _id),
      pause: document.getElementById("pause-" + _id),
      restart: document.getElementById("restart-" + _id),
      resume: document.getElementById("resume-" + _id),
      camera: document.getElementById("camera-" + _id),
      currentFile: document.getElementById("currentFile-" + _id),
      currentFilament: document.getElementById("currentFilament-" + _id),
      state: document.getElementById("state-" + _id),
      layerData: document.getElementById("displayLayerProgressData-" + _id),
      printTimeElapsed: document.getElementById("printTimeElapsed-" + _id),
      remainingPrintTime: document.getElementById("remainingTime-" + _id),
      cameraContain: document.getElementById("cameraContain-" + _id),
      progress: document.getElementById("progress-" + _id),
      bed: document.getElementById("badTemp-" + _id),
      chamber: document.getElementById("chamberTemp-" + _id),
    };
    return elems[_id];
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
      unifiedFiles: document.getElementById("unifiedFiles-" + group),
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
  checkKlipperState(printer);
  const isOffline = !printerIsOnline(printer);
  const isPrintingOrComplete = printerIsPrintingOrComplete(printer);

  elements.control.disabled = isOffline;
  elements.files.disabled = isOffline;
  elements.terminal.disabled = isOffline;
  elements.job.disabled = !isPrintingOrComplete;

  UI.doesElementNeedUpdating(
    printer.printerState.state,
    elements.state,
    "innerHTML"
  );

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
      "<i class=\"fas fa-file-code\"></i> " + printer.currentJob.fileDisplay;
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
            <i class="fas fa-clock"></i> ${Calc.generateTime(
              printer.currentJob.expectedPrintTime
            )}
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
        <i class="fas fa-calendar-alt"></i> ${
          printer.currentJob.expectedCompletionDate
        }
        </small>
      `;
      UI.doesElementNeedUpdating(
        printTimeElapsedFormat,
        elements.printTimeElapsed,
        "innerHTML"
      );
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
            <i class="fas fa-clock"></i> ${Calc.generateTime(
              printer.currentJob.expectedPrintTime
            )}
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
      UI.doesElementNeedUpdating(
        printTimeElapsedFormat,
        elements.printTimeElapsed,
        "innerHTML"
      );
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
      UI.doesElementNeedUpdating(
        printTimeElapsedFormat,
        elements.printTimeElapsed,
        "innerHTML"
      );
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
    UI.doesElementNeedUpdating(
      printTimeElapsedFormat,
      elements.printTimeElapsed,
      "innerHTML"
    );
    UI.doesElementNeedUpdating(
      remainingPrintTimeFormat,
      elements.remainingPrintTime,
      "innerHTML"
    );
    elements.currentFile.setAttribute("title", "No File Selected");
    elements.currentFile.innerHTML =
      "<i class=\"fas fa-file-code\"></i> " + "No File Selected";
  }
  if (!!printer?.layerData) {
    UI.doesElementNeedUpdating(
      returnMinimalLayerDataDisplay(printer.layerData),
      elements.layerData,
      "innerHTML"
    );
  }
  if (!!printer.tools) {
    const toolKeys = Object.keys(printer.tools[0]);
    for (const element of toolKeys) {
      if (element.includes("tool")) {
        const toolNumber = element.replace("tool", "");
        if (
          document.getElementById(printer._id + "-temperature-" + toolNumber)
        ) {
          checkTemps(
            document.getElementById(printer._id + "-temperature-" + toolNumber),
            printer.tools[0][element].actual,
            printer.tools[0][element].target,
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
      } else if (element.includes("bed")) {
        if (elements.bed) {
          checkTemps(
            elements.bed,
            printer.tools[0][element].actual,
            printer.tools[0][element].target,
            printer.otherSettings.temperatureTriggers,
            printer.printerState.colour.category
          );
        }
      } else if (element.includes("chamber")) {
        if (elements.chamber) {
          checkTemps(
            elements.chamber,
            printer.tools[0][element].actual,
            printer.tools[0][element].target,
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

    if (
      printer.printerState.state === "Pausing" ||
      printer.printerState.state === "Cancelling"
    ) {
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
    if (
      !!printer.currentJob &&
      printer.currentJob.fileName !== "No File Selected"
    ) {
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
    } else {
      elements.row.classList.remove("hidden");
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
  const uniqueGroupList = [
    ...new Set(printers.map((printer) => printer.group)),
  ];
  uniqueGroupList.forEach((group) => {
    const cleanGroup = encodeURIComponent(group);
    const filteredGroupPrinterList = printers.filter((printer) => {
      if (encodeURIComponent(printer.group) === cleanGroup){
        return printer;
      }
    });
    checkGroupQuickConnectState(filteredGroupPrinterList, cleanGroup);
  })
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
      UI.doesElementNeedUpdating(
        printer.printerName,
        elements.name,
        "innerHTML"
      );
      UI.doesElementNeedUpdating(
        printer.printerState.state,
        elements.state,
        "innerHTML"
      );
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
          (obj) =>
            obj.printerState.state === "Pausing" ||
            obj.printerState.state === "Cancelling"
        ).length;
        const filesSelected = groupedPrinters[key].filter(
          (obj) => obj?.currentJob?.fileName !== "No File Selected"
        ).length;

        let combinedProgress = groupedPrinters[key].reduce(function (a, b) {
          return a + b?.["currentJob"]?.["progress"];
        }, 0);

        const actualProgress = combinedProgress / groupedPrinters[key].length;
        UI.doesElementNeedUpdating(
          actualProgress.toFixed(0) + "%",
          elements.progress,
          "innerHTML"
        );
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
        await PrinterFileManagerService.init("", printers, getControlList());
      } else if (currentOpenModal.innerHTML.includes("Control")) {
        await PrinterControlManagerService.init("", printers, getControlList());
      } else if (currentOpenModal.innerHTML.includes("Terminal")) {
        await PrinterTerminalManagerService.init(
          "",
          printers,
          getControlList()
        );
      } else if (currentOpenModal.innerHTML.includes("Job")) {
        await initialiseCurrentJobPopover("", printers, getControlList());
      }
      break;
    case false:
      // initialise or start the information updating..
      if (view === "group") {
        const groupViewPrinterList = printers.filter((printer) => {
          if (printerIsAvailableToView(printer) && printer.group.length !== 0){
            return printer;
          }
        });
        if (!actionButtonsInitialised) {
              drawGroupViewContainers(groupViewPrinterList, printerArea, clientSettings);
              drawGroupViewPrinters(groupViewPrinterList, clientSettings);
              //Setup Action Buttons
              await actionButtonGroupInit(groupViewPrinterList);

              addGroupListeners(groupViewPrinterList);
              await dragAndDropGroupEnable(groupViewPrinterList);
              actionButtonsInitialised = true;
        }else{
          await updateGroupState(groupViewPrinterList, clientSettings, view);
        }
        return;
      }
      for (let p = 0; p < printers.length; p++) {
        if (printerIsAvailableToView(printers[p])) {
          let printerPanel = document.getElementById(
            "panel-" + printers[p]._id
          );
          if (!printerPanel) {
            if(!spoolDropDownList){
              spoolDropDownList = await returnDropDownList()
            }
            if (view === "panel") {
              let printerHTML = drawPanelView(printers[p], clientSettings);
              printerArea.insertAdjacentHTML("beforeend", printerHTML);
            } else if (view === "list") {
              let printerHTML = drawListView(printers[p], clientSettings);
              printerArea.insertAdjacentHTML("beforeend", printerHTML);
            } else if (view === "camera") {
              let printerHTML = drawCameraView(printers[p], clientSettings);
              printerArea.insertAdjacentHTML("beforeend", printerHTML);
            } else if (view === "combined") {
              let printerHTML = drawCombinedView(printers[p], clientSettings);
              printerArea.insertAdjacentHTML("beforeend", printerHTML);
            } else {
              console.error(
                "printerPanel could not determine view type to update",
                view
              );
              const errorObject = ClientErrors.SILENT_ERROR;
              errorObject.message = `Monitoring Updater - ${e}`;
              throw new ApplicationError(errorObject);
            }
            printerPanel = document.getElementById(
                "panel-" + printers[p]._id
            );
            //Setup Action Buttons
            await actionButtonInit(
                printers[p],
                `printerActionBtns-${printers[p]._id}`
            );
            //Add page listeners
            await addListeners(printers[p]);
            //Grab elements
            await grabElements(printers[p]);
            //Initialise Drag and Drop
            await dragAndDropEnable(printerPanel, printers[p]);

          } else {
            if (!dragCheck()) {
                await updateState(printers[p], clientSettings, view, p);
            }
          }
        }
      }
      break;
  }
}
