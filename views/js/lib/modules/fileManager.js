import OctoFarmClient from "../octofarm.js";
import OctoPrintClient from "../octoprint.js";
import Calc from "../functions/calc.js";
import UI from "../functions/ui.js";

let printerInfo = null;
async function init() {
  printerInfo = await OctoFarmClient.get("printers/printerInfo");
  printerInfo = await printerInfo.json();
  console.log(printerInfo);
}
init();

document.getElementById("fileReSync").addEventListener("click", e => {
  e.target.innerHTML = "<i class='fas fa-sync fa-spin'></i> Syncing";
  FileManager.reSyncFiles(e);
});

document.getElementById("fileBackBtn").addEventListener("click", e => {
  FileManager.openFolder();
});

let printers = document.querySelectorAll("[id^='printer-']");
printers.forEach(printer => {
  printer.addEventListener("click", e => {
    //Remove from UI
    FileManager.changePrinter(printer.id);
  });
});

let folders = document.querySelectorAll("[id^='folder-']");
folders.forEach(folder => {
  folder.addEventListener("click", e => {
    //Remove from UI
    FileManager.openFolder(folder.id);
  });
});

let fileActionBtns = document.querySelectorAll("[id*='*fileAction']");
fileActionBtns.forEach(btn => {
  //Gate Keeper listener for file action buttons
  btn.addEventListener("click", e => {
    FileManager.actionBtnGate(btn.id);
  });
});

export default class FileManager {
  static actionBtnGate(btn) {
    let data = btn.split("*");
    let index = data[0];
    let action = data[1];
    let filePath = data[2];

    if (action === "fileActionStart") {
      FileActions.startPrint(index, filePath);
    } else if (action === "fileActionSelect") {
      FileActions.selectFile(index, filePath);
    } else if (action === "fileActionUpdate") {
      FileActions.updateFile(index, btn, filePath);
    } else if (action === "fileActionMove") {
      FileActions.moveFile(index, filePath);
    } else if (action === "fileActionDownload") {
      FileActions.downloadFile(index, filePath);
    } else if (action === "fileActionDelete") {
      FileActions.deleteFile(index, filePath);
    }
  }
  static changePrinter(target) {
    let oldIndex = document.getElementById("currentPrinter").innerHTML;
    document.getElementById("currentFolder").innerHTML = "local";
    document.getElementById("printer-" + oldIndex).className =
      "list-group-item list-group-item-action flex-column align-items-start bg-secondary";
    let index = target.replace("printer-", "");
    let printerName = document.getElementById("printerName-" + index).innerHTML;
    document.getElementById(
      "currentPrinterBtn"
    ).innerHTML = `<i class="fas fa-print"></i> <span id="currentPrinter">${index}</span>. ${printerName}`;
    FileManager.updateFileList();
  }
  static async reSyncFiles(e) {
    let index = document.getElementById("currentPrinter").innerHTML;
    index = parseInt(index);
    let done = await OctoFarmClient.post("printers/resyncFile", {
      i: index
    });
    let how = await done.json();
    e.target.innerHTML = "<i class='fas fa-sync'></i> Re-Sync";
    let flashReturn = function() {
      e.target.classList = "btn btn-primary m-3";
    };
    if (how) {
      e.target.classList = "btn btn-success m-3";
      setTimeout(flashReturn, 500);
    } else {
      e.target.classList = "btn btn-danger m-3";
      setTimeout(flashReturn, 500);
    }
    FileManager.updateFileList();
  }
  static async updateFileList() {
    let index = document.getElementById("currentPrinter").innerHTML;
    let done = await OctoFarmClient.post("printers/fileList", {
      i: index
    });
    done = await done.json();
    FileManager.drawFiles(index, done.files);
    document.getElementById("printerStorage").innerHTML = `
    <i class="fas fa-hdd"></i> 
    ${Calc.bytes(done.storage.free)}  / 
    ${Calc.bytes(done.storage.total)}
  </button>`;
  }
  static openFolder(folder) {
    if (typeof folder != "undefined") {
      folder = folder.replace("folder-", "");
      document.getElementById("currentFolder").innerHTML = "local/" + folder;
      FileManager.updateFileList();
    } else {
      let currentFolder = document.getElementById("currentFolder").innerHTML;
      if (currentFolder != "local") {
        let previousFolder = currentFolder.substring(
          0,
          currentFolder.lastIndexOf("/")
        );
        document.getElementById("currentFolder").innerHTML = previousFolder;
        FileManager.updateFileList();
      }
    }
  }
  static drawFiles(index, fileList) {
    let fileElem = document.getElementById("fileList");
    if (fileList === "EMPTY") {
      fileElem.innerHTML = `
      <div class="noStorage  text-center"><i class="fas fa-file-code fa-5x"></i><br><h5>There are no files in local storage...</h5></div>
      `;
    } else {
      fileElem.innerHTML = "";
      let currentFolder = document.getElementById("currentFolder").innerHTML;
      if (currentFolder.includes("local/")) {
        currentFolder = currentFolder.replace("local/", "");
      }
      fileList.files.forEach(file => {
        if (file.path == currentFolder) {
          fileElem.insertAdjacentHTML(
            "beforeend",
            `
          <a
          href="#"
          class="list-group-item list-group-item-action flex-column align-items-start bg-secondary"
          style="display: block;
          padding: 0.7rem 0.1rem;"
        >
          <div class="row">
            <div
              class="col-lg-1"
              style="display:flex; justify-content:center; align-items:center;"
            >
              <center><i class="fas fa-file-code fa-2x"></i></center>
            </div>
            <div class="col-lg-11">
              <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">${file.display}</h5>
                <small>${Calc.generateTime(file.time)}</small>
              </div>
              <p class="mb-1 float-left">
                ${Calc.bytes(file.size)}
              </p>
              <button
                id="${index}*fileActionUpdate*${file.fullPath}"
                role="button"
                class="btn btn-dark"
              >
                <i class="fas fa-sync"></i> Refresh
              </button>
              <button id="${file.index}*fileActionStart*${
              file.fullPath
            }" type="button" class="btn btn-success">
                <i class="fas fa-play"></i> Start
              </button>
              <button id="${file.index}*fileActionSelect*${
              file.fullPath
            }" type="button" class="btn btn-info">
                <i class="fas fa-file-upload"></i> Select
              </button>
              <button id="${file.index}*fileActionMove*${
              file.fullPath
            }" type="button" class="btn btn-warning">
                <i class="fas fa-people-carry"></i> Move
              </button>
              <button id="${file.index}*fileActionDownload*${
              file.fullPath
            }" type="button" class="btn btn-dark">
                <i class="fas fa-download"></i> Download
              </button>
              <button id="${file.index}*fileActionDelete*${
              file.fullPath
            }" type="button" class="btn btn-danger">
                <i class="fas fa-trash-alt"></i> Delete
              </button>
              </div>
            </div>
          </div>
        </a>
        </a>
          `
          );
        }
      });
      //then draw folders
      fileList.folders.forEach(folder => {
        if (folder.path == currentFolder) {
          fileElem.insertAdjacentHTML(
            "beforeend",
            `<a
              id="folder-${folder.name}"
              href="#"
              class="list-group-item list-group-item-action flex-column align-items-start bg-dark"
              style="display: block;
                padding: 0.7rem 0.1rem;"
            >
              <div class="row">
                <div
                  class="col-lg-1"
                  style="display:flex; justify-content:center; align-items:center;"
                >
                  <center><i class="fas fa-folder fa-2x"></i></center>
                </div>
                <div class="col-lg-11">
                  <small class="float-right"
                    ><!--Display file and folder count here eventually--></small
                  >
                  <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1 float-left">
                      ${folder.name}
                    </h5>
                    <div
                      class="float-right btn-group flex-wrap btn-group-sm"
                      role="group"
                      aria-label="Basic example"
                    >
                      <button type="button" class="btn btn-warning">
                        <i class="fas fa-people-carry"></i> Move
                      </button>
                      <button type="button" class="btn btn-danger">
                        <i class="fas fa-trash-alt"></i> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </a>
         
            `
          );
        }
      });
      FileManager.updateListeners();
    }
  }
  static updateListeners() {
    let folders = document.querySelectorAll("[id^='folder-']");
    folders.forEach(folder => {
      folder.addEventListener("click", e => {
        //Remove from UI
        FileManager.openFolder(folder.id);
      });
    });
    let fileActionBtns = document.querySelectorAll("[id*='*fileAction']");
    fileActionBtns.forEach(btn => {
      //Gate Keeper listener for file action buttons
      btn.addEventListener("click", e => {
        FileManager.actionBtnGate(btn.id);
      });
    });
  }
}
export class FileActions {
  static async startPrint(i, filePath) {
    OctoPrintClient.file(printerInfo[i], filePath, "print");
  }
  static selectFile(i, filePath) {
    OctoPrintClient.file(printerInfo[i], filePath, "load");
  }
  static async updateFile(i, btn, fullPath) {
    let refreshBtn = document.getElementById(btn);
    refreshBtn.innerHTML = '<i class="fas fa-sync fa-spin"></i> Refreshing...';
    let done = await OctoFarmClient.post("printers/resyncFile", {
      i: printerInfo[i].index,
      fullPath: fullPath
    });
    let how = await done.json();
    refreshBtn.innerHTML = '<i class="fas fa-sync"></i> Refresh';
    let flashReturn = function() {
      refreshBtn.classList = "btn btn-dark";
    };
    if (how) {
      refreshBtn.classList = "btn btn-sm btn-success";
      setTimeout(flashReturn, 500);
    } else {
      refreshBtn.classList = "btn btn-sm btn-danger";
      setTimeout(flashReturn, 500);
    }
  }
  static moveFile(i, fileName) {}
  static downloadFile(i, fileName) {}
  static deleteFile(i, fileName) {
    OctoPrintClient.file(printer, fullPath, "delete", file);
  }
}
