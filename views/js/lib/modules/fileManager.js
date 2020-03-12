import OctoFarmClient from "../octofarm.js";
import OctoPrintClient from "../octoprint.js";
import Queue from "../modules/clientQueue.js";
import Calc from "../functions/calc.js";
import UI from "../functions/ui.js";

let printerInfo = null;
let fileUploads = new Queue();

let printers = document.querySelectorAll("[id^='printer-']");
printers.forEach((printer, index) => {
  if (index === 0) {
    printer.classList.add("bg-dark");
    printer.classList.remove("bg-secondary");
    let first = printer.id.replace("printer-", "");
    document.getElementById("currentPrinter").innerHTML = first;
    init();
  }
  printer.addEventListener("click", e => {
    //Remove from UI
    FileManager.changePrinter(printer.id);
  });
});
setInterval(async () => {
  //If there are files in the queue, plow through until uploaded... currently single file at a time.
  if (fileUploads.size() > 0) {
    let current = fileUploads.first();
    if (!current.active) {
      fileUploads.activate(0);
      let file = await current.upload(current);
      file = JSON.parse(file);
      file.index = current.index;
      let post = await OctoFarmClient.post("printers/newFiles", file);
      let update = await FileManager.updateFileList();
      fileUploads.remove();
    }
  }
}, 1000);

async function init() {
  printerInfo = await OctoFarmClient.get("printers/printerInfo");
  printerInfo = await printerInfo.json();
  FileManager.updateFileList();
}

document.getElementById("fileReSync").addEventListener("click", e => {
  e.target.innerHTML = "<i class='fas fa-sync fa-spin'></i> Syncing";
  FileManager.reSyncFiles(e);
});

document.getElementById("searchFiles").addEventListener("keyup", e => {
  FileActions.search();
});
document.getElementById("multUploadBtn").addEventListener("click", e => {
  FileManager.multiUpload();
});
document
  .getElementById("createFolderBtn")
  .addEventListener("click", function() {
    FileActions.createFolder();
  });

document.getElementById("fileUploadBtn").addEventListener("change", function() {
  FileManager.handleFiles(this.files);
});

document.getElementById("fileBackBtn").addEventListener("click", e => {
  FileManager.openFolder();
});

let folders = document.querySelectorAll("a.folderAction");
folders.forEach(folder => {
  folder.addEventListener("click", e => {
    //Remove from UI
    FileManager.openFolder(folder.id, e.target);
  });
});

let fileActionBtns = document.querySelectorAll("[id*='*fileAction']");
fileActionBtns.forEach(btn => {
  //Gate Keeper listener for file action buttons
  btn.addEventListener("click", e => {
    FileManager.actionBtnGate(btn.id);
  });
});
let folderActionBtns = document.querySelectorAll("[id*='*folderAction']");
folderActionBtns.forEach(btn => {
  //Gate Keeper listener for file action buttons
  btn.addEventListener("click", e => {
    FileManager.actionBtnGate(btn.id);
  });
});
export default class FileManager {
  static async handleFiles(Afiles) {
    Afiles = [...Afiles];
    for (let i = 0; i < Afiles.length; i++) {
      let newObject = {};
      let spinner = document.getElementById("fileUploadCountSpinner");
      if (spinner.classList.contains("fa-spin")) {
      } else {
        spinner.classList = "fas fa-spinner fa-spin";
      }
      newObject.file = Afiles[i];
      newObject.index = document.getElementById("currentPrinter").innerHTML;
      newObject.currentFolder = document.getElementById(
        "currentFolder"
      ).innerHTML;
      newObject.upload = FileManager.fileUpload;
      fileUploads.add(newObject);
      let fileCounts = document.getElementById("fileCounts-" + newObject.index);
      let amount = parseInt(fileCounts.innerHTML);
      amount = amount + 1;
      fileCounts.innerHTML = " " + amount;
    }
  }
  static createUpload(index, fileName, loaded, total) {
    let uploadSize = fileUploads.size();

    let upCount = document.getElementById("fileUploadCount");
    upCount.innerHTML = "File Queue: " + uploadSize;
    if (uploadSize < 1) {
      upCount.innerHTML = "File Queue: 0";
      let spinner = document.getElementById("fileUploadCountSpinner");
      if (spinner.classList.contains("fa-spin")) {
        spinner.classList = "fas fa-spinner";
      }
    }

    let progress = document.getElementById("fileProgress-" + index);
    progress.classList = "progress-bar progress-bar-striped bg-warning";
    let percentLoad = (loaded / total) * 100;
    if (isNaN(percentLoad)) {
      percentLoad = 0;
    }
    progress.innerHTML = Math.floor(percentLoad) + "%";
    progress.style.width = percentLoad + "%";
    if (percentLoad == 100) {
      progress.classList = "progress-bar progress-bar-striped bg-success";
    }
  }

  static fileUpload(file) {
    return new Promise(function(resolve, reject) {
      //Grab folder location
      let currentFolder = file.currentFolder;
      //Grab Client Info

      let index = file.index;
      index = parseInt(index);

      let fileCounts = document.getElementById("fileCounts-" + index);
      //XHR doesn't like posting without it been a form, can't use offical octoprint api way...
      //Create form data
      let formData = new FormData();
      let path = "";
      if (currentFolder.includes("local/")) {
        path = currentFolder.replace("local/", "");
      }

      formData.append("file", file.file);
      formData.append("path", path);
      if (file.print) {
        formData.append("print", true);
      }
      let url =
        "http://" +
        printerInfo[index].ip +
        ":" +
        printerInfo[index].port +
        "/api/files/local";
      var xhr = new XMLHttpRequest();
      file = file.file;
      xhr.open("POST", url);
      xhr.upload.onprogress = function(e) {
        if (e.lengthComputable) {
          FileManager.createUpload(
            printerInfo[index].index,
            file.name,
            e.loaded,
            e.total
          );
        }
      };

      //xhr.setRequestHeader("Content-Type", "multipart/form-data");
      xhr.setRequestHeader("X-Api-Key", printerInfo[index].apikey);
      xhr.onloadstart = function(e) {
        FileManager.createUpload(
          printerInfo[index].index,
          file.name,
          e.loaded,
          e.total
        );
      };
      xhr.onloadend = function(e) {
        FileManager.createUpload(
          printerInfo[index].index,
          file.name,
          e.loaded,
          e.total
        );
        fileCounts.innerHTML = " " + (parseInt(fileCounts.innerHTML) - 1);
        let spinner = document.getElementById("fileUploadCountSpinner");
        UI.createAlert(
          "success",
          file.name + " has finished uploading to Printer " + index,
          3000,
          "clicked"
        );
        setTimeout(() => {
          FileManager.createUpload(
            printerInfo[index].index,
            file.name,
            e.loaded,
            e.total
          );
        }, 5000);
        if (this.status >= 200 && this.status < 300) {
          resolve(xhr.response);
        } else {
          reject({
            status: this.status,
            statusText: xhr.statusText
          });
        }
      };
      xhr.onerror = function() {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      };
      if (file.name.includes(".gcode")) {
        xhr.send(formData);
      } else {
        UI.createAlert(
          "error",
          `Sorry but ${file.name} is not a gcode file, not uploading.`,
          3000,
          ""
        );
      }
    });
  }
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
    } else if (action === "fileActionDelete") {
      FileActions.deleteFile(index, filePath);
    } else if (action === "folderActionMove") {
      FileActions.moveFolder(index, filePath);
    } else if (action === "folderActionDelete") {
      FileActions.deleteFolder(index, filePath);
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

    document.getElementById(
      "currentPrinterBtn"
    ).innerHTML = `<i class="fas fa-print"></i> <span id="currentPrinter">${index}</span>. ${printerInfo[index].settingsAppearance.name}`;
    FileManager.drawFiles(index, done.files);
    document.getElementById("printerStorage").innerHTML = `
    <i class="fas fa-hdd"></i> 
    ${Calc.bytes(done.storage.free)}  / 
    ${Calc.bytes(done.storage.total)}
  </button>`;
    return "done";
  }
  static openFolder(folder, target) {
    if (typeof target != "undefined" && target.type === "button") {
      return;
    }
    if (typeof folder != "undefined") {
      folder = folder.replace("file-", "");
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
  static drawFiles(index, fileList, recursive) {
    let fileElem = document.getElementById("fileList");
    if (fileList === "EMPTY") {
      fileElem.innerHTML = `
      <div class="noStorage  text-center"><i class="fas fa-file-code fa-5x"></i><br><h5>There are no files in local storage...</h5></div>
      `;
    } else {
      fileList.files = _.sortBy(fileList.files, [
        function(o) {
          return o.display;
        }
      ]);
      fileElem.innerHTML = "";
      let currentFolder = document.getElementById("currentFolder").innerHTML;
      if (currentFolder.includes("local/")) {
        currentFolder = currentFolder.replace("local/", "");
      }
      fileList.files.forEach(file => {
        if (typeof recursive != "undefined") {
          fileElem.insertAdjacentHTML(
            "beforeend",
            `
          <a
          id="file-${file.fullPath}"
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
            <small><i class="fas fa-stopwatch"></i>  ${Calc.generateTime(
              file.time
            )}</small>
          </div>
          <p class="mb-1 float-left">
          <i class="fas fa-hdd"></i> ${Calc.bytes(file.size)}
          </p>
              <div
              class="float-right btn-group flex-wrap btn-group-sm"
              role="group"
              aria-label="Basic example"
            >
              <button
                id="${index}*fileActionUpdate*${file.fullPath}"
                role="button"
                class="btn btn-dark"
              >
                <i class="fas fa-sync"></i> Refresh
              </button>
              <button id="${index}*fileActionStart*${
              file.fullPath
            }" type="button" class="btn btn-success">
                <i class="fas fa-play"></i> Start
              </button>
              <button id="${index}*fileActionSelect*${
              file.fullPath
            }" type="button" class="btn btn-info">
                <i class="fas fa-file-upload"></i> Select
              </button>
              <button id="${index}*fileActionMove*${
              file.fullPath
            }" type="button" class="btn btn-warning">
                <i class="fas fa-people-carry"></i> Move
              </button>
              <button onclick="window.open('http://${printerInfo[index].ip}:${
              printerInfo[index].port
            }/downloads/files/local/${
              file.fullPath
            }')" type="button" class="btn btn-dark">
                <i class="fas fa-download"></i> Download
              </button>
              <button id="${index}*fileActionDelete*${
              file.fullPath
            }" type="button" class="btn btn-danger">
                <i class="fas fa-trash-alt"></i> Delete
              </button>
              </div>
              </div>
            </div>
          </div>
        </a>
        </a>
          `
          );
        } else if (file.path == currentFolder) {
          fileElem.insertAdjacentHTML(
            "beforeend",
            `
          <a
          id="file-${file.fullPath}"
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
            <small><i class="fas fa-stopwatch"></i>  ${Calc.generateTime(
              file.time
            )}</small>
          </div>
          <p class="mb-1 float-left">
          <i class="fas fa-hdd"></i> ${Calc.bytes(file.size)}
          </p>
              <div
              class="float-right btn-group flex-wrap btn-group-sm"
              role="group"
              aria-label="Basic example"
            >
              <button
                id="${index}*fileActionUpdate*${file.fullPath}"
                role="button"
                class="btn btn-dark"
              >
                <i class="fas fa-sync"></i> Refresh
              </button>
              <button id="${index}*fileActionStart*${
              file.fullPath
            }" type="button" class="btn btn-success">
                <i class="fas fa-play"></i> Start
              </button>
              <button id="${index}*fileActionSelect*${
              file.fullPath
            }" type="button" class="btn btn-info">
                <i class="fas fa-file-upload"></i> Select
              </button>
              <button id="${index}*fileActionMove*${
              file.fullPath
            }" type="button" class="btn btn-warning">
                <i class="fas fa-people-carry"></i> Move
              </button>
              <button onclick="window.open('http://${printerInfo[index].ip}:${
              printerInfo[index].port
            }/downloads/files/local/${
              file.fullPath
            }')" type="button" class="btn btn-dark">
                <i class="fas fa-download"></i> Download
              </button>
              <button id="${index}*fileActionDelete*${
              file.fullPath
            }" type="button" class="btn btn-danger">
                <i class="fas fa-trash-alt"></i> Delete
              </button>
              </div>
              </div>
            </div>
          </div>
        </a>
        </a>
          `
          );
        }
      });
      fileList.folders = _.sortBy(fileList.folders, [
        function(o) {
          return o.display;
        }
      ]);
      //then draw folders
      fileList.folders.forEach(folder => {
        if (folder.path == currentFolder) {
          fileElem.insertAdjacentHTML(
            "beforeend",
            `<a
              id="file-${folder.name}"
              href="#"
              class="list-group-item list-group-item-action flex-column align-items-start bg-dark folderAction"
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
                      <button id="${index}*folderActionMove*${folder.name}" type="button" class="btn btn-warning">
                        <i class="fas fa-people-carry"></i> Move
                      </button>
                      <button id="${index}*folderActionDelete*${folder.name}" type="button" class="btn btn-danger">
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
    let folders = document.querySelectorAll(".folderAction");
    folders.forEach(folder => {
      folder.addEventListener("click", e => {
        //Remove from UI
        FileManager.openFolder(folder.id, e.target);
      });
    });
    let fileActionBtns = document.querySelectorAll("[id*='*fileAction']");
    fileActionBtns.forEach(btn => {
      //Gate Keeper listener for file action buttons
      btn.addEventListener("click", e => {
        FileManager.actionBtnGate(btn.id);
      });
    });
    let folderActionBtns = document.querySelectorAll("[id*='*folderAction']");
    folderActionBtns.forEach(btn => {
      //Gate Keeper listener for file action buttons
      btn.addEventListener("click", e => {
        FileManager.actionBtnGate(btn.id);
      });
    });
  }
  static async multiUpload() {
    let selectedPrinters = null;
    let selectedFolder = "";
    let printAfterUpload = false;
    let selectedFile = null;

    function first() {
      // let boxs = document.querySelectorAll('*[id^="multiUpPrinters-"]');
      // selectedPrinters = [].filter.call(boxs, function(el) {
      //   return el.checked;
      // });

      // if (selectedPrinters.length < 2) {
      //   UI.createAlert(
      //     "error",
      //     "Please select MORE than " + selectedPrinters.length + " printer(s)!",
      //     2000,
      //     "clicked"
      //   );
      //   return;
      // }
      document.getElementById("multiPrinterBtn").disabled = true;
      document.getElementById("multiFolder").disabled = false;
      document.getElementById("multiPrintersSection").classList.add("hidden");
      document.getElementById("multiFolderSection").classList.remove("hidden");
      document.getElementById("multiUploadFooter").innerHTML =
        '<button id="multiUpSubmitBtn" type="button" class="btn btn-warning float-right">Next</button>';
      document
        .getElementById("multiUpSubmitBtn")
        .addEventListener("click", e => {
          second();
        });
      document.getElementById("multiSelectedPrinters").innerHTML = "";
      selectedPrinters.forEach((printer, index) => {
        if (printer)
          document.getElementById("multiSelectedPrinters").insertAdjacentHTML(
            "beforeend",
            `
              [<span class="MultiSelected">${printer.value}</span>]
            `
          );
      });
    }

    function second() {
      //DELETE WHEN FOLDERS WORKING
      let boxs = document.querySelectorAll('*[id^="multiUpPrinters-"]');
      selectedPrinters = [].filter.call(boxs, function(el) {
        return el.checked;
      });

      if (selectedPrinters.length < 2) {
        UI.createAlert(
          "error",
          "Please select MORE than " + selectedPrinters.length + " printer(s)!",
          2000,
          "clicked"
        );
        return;
      }

      document.getElementById("multiPrinterBtn").disabled = true;
      document.getElementById("multiFolder").disabled = false;
      document.getElementById("multiPrintersSection").classList.add("hidden");
      document.getElementById("multiFolderSection").classList.remove("hidden");
      document.getElementById("multiUploadFooter").innerHTML =
        '<button id="multiUpSubmitBtn" type="button" class="btn btn-warning float-right">Next</button>';
      document
        .getElementById("multiUpSubmitBtn")
        .addEventListener("click", e => {
          second();
        });

      document.getElementById("multiSelectedPrinters2").innerHTML = "";
      selectedPrinters.forEach((printer, index) => {
        if (printer)
          document.getElementById("multiSelectedPrinters2").insertAdjacentHTML(
            "beforeend",
            `
            [<span class="MultiSelected">${printer.value}</span>]
            `
          );
      });
      document.getElementById("multiFolder").disabled = true;
      document.getElementById("multiFile").disabled = false;
      document.getElementById("multiFileSection").classList.remove("hidden");
      document.getElementById("multiFolderSection").classList.add("hidden");
      document.getElementById("multiUploadFooter").innerHTML =
        '<button id="multiUpSubmitBtn" type="button" class="btn btn-success float-right" data-dismiss="modal">Start!</button>';
      document
        .getElementById("multiUpSubmitBtn")
        .addEventListener("click", e => {
          third();
        });
      selectedFolder = document.getElementById("multiNewFolder").value;
      if (selectedFolder != "") {
        selectedFolder = selectedFolder + "";
      }
      document.getElementById("printOnLoadBtn").addEventListener("click", e => {
        let state = null;
        state = e.target.checked;
        let fileBtn = document.getElementById("multiFileUploadBtn");
        let fileBtnLabel = document.getElementById("multiFileUploadBtnLabel");
        if (state) {
          fileBtn.removeAttribute("multiple", "");
          fileBtn.setAttribute("single", "");
          fileBtnLabel.innerHTML =
            '<i class="fas fa-file-import"></i> Upload File';
          printAfterUpload = true;
        } else {
          fileBtn.setAttribute("multiple", "");
          fileBtn.removeAttribute("single", "");
          fileBtnLabel.innerHTML =
            '<i class="fas fa-file-import"></i> Upload Files';
          printAfterUpload = false;
        }
      });
      document
        .getElementById("multiFileUploadBtn")
        .addEventListener("change", function() {
          grabFiles(this.files);
        });
    }
    function third() {
      if (selectedFolder == "") {
        selectedFolder = "local";
      }

      selectedPrinters.forEach(printer => {
        let spinner = document.getElementById("fileUploadCountSpinner");
        if (spinner.classList.contains("fa-spin")) {
        } else {
          spinner.classList = "fas fa-spinner fa-spin";
        }
        selectedFile.forEach(file => {
          let newObject = {};
          const num = printer.value;
          newObject.file = file;
          newObject.index = num;
          newObject.upload = FileManager.fileUpload;
          newObject.currentFolder = selectedFolder;

          if (printAfterUpload) {
            newObject.print = true;
          }
          fileUploads.add(newObject);
          let fileCounts = document.getElementById(
            "fileCounts-" + printer.value
          );
          let amount = parseInt(fileCounts.innerHTML);
          amount = amount + 1;
          fileCounts.innerHTML = " " + amount;
        });
      });
    }

    function grabFiles(Afiles) {
      Afiles = [...Afiles];
      selectedFile = Afiles;
      let files = document.getElementById("multiFileSelectedNow");
      files.innerHTML = "";
      selectedFile.forEach(file => {
        files.insertAdjacentHTML(
          "beforeend",
          `
          <li>${file.name}</li>
        `
        );
      });
    }
    let files = document.getElementById("multiFileSelectedNow");
    files.innerHTML = "";
    document.getElementById("multiPrinterBtn").disabled = false;
    document.getElementById("multiFolder").disabled = true;
    document.getElementById("multiFile").disabled = true;
    document.getElementById("multiPrintersSection").classList.remove("hidden");
    document.getElementById("multiFolderSection").classList.add("hidden");
    document.getElementById("multiFileSection").classList.add("hidden");
    document.getElementById("multiUploadFooter").innerHTML =
      '<button id="multiUpSubmitBtn" type="button" class="btn btn-warning float-right">Next</button>';
    document.getElementById("multiUpSubmitBtn").addEventListener("click", e => {
      second();
    });
  }
}
export class FileActions {
  static search() {
    let index = document.getElementById("currentPrinter").innerHTML;
    let fileList = document.getElementById("fileList");
    let input = document.getElementById("searchFiles").value.toUpperCase();
    fileList.innerHTML = "";

    if (input.value === "") {
      //No search term so reset view
      document.getElementById("currentFolder").value = "local";
      FileManager.drawFiles(index, printerInfo[index].filesList, "Recursive");
    } else {
      fileList.innerHTML = "";
      document.getElementById("currentFolder").value = "local";
      FileManager.drawFiles(index, printerInfo[index].filesList, "Recursive");
    }
    console.log(printerInfo[index].filesList);
    let button = fileList.querySelectorAll('*[id^="file-"]');
    for (let i = 0; i < button.length; i++) {
      let file = button[i].id.replace("file-", "");
      if (file.toUpperCase().indexOf(input) > -1) {
        button[i].style.display = "";
      } else {
        button[i].style.display = "none";
      }
    }
  }
  static async createFolder() {
    let index = document.getElementById("currentPrinter").innerHTML;
    let currentFolder = document.getElementById("currentFolder").innerHTML;
    let formData = new FormData();

    if (currentFolder === "local") {
      currentFolder = "";
    } else if (currentFolder.includes("local/")) {
      currentFolder = currentFolder.replace("local/", "");
    }
    bootbox.prompt("What would you like to name your folder?", async function(
      result
    ) {
      if (result) {
        formData.append("foldername", result);
        formData.append("path", currentFolder + "/");
        let post = await OctoPrintClient.folder(
          printerInfo[index],
          "local",
          formData
        );
        if (post.status === 201 || post.status === 200) {
          let opts = {
            i: index,
            foldername: result,
            path: currentFolder
          };
          let update = await OctoFarmClient.post("printers/newFolder", opts);
          UI.createAlert(
            "success",
            "Successfully created your new folder...",
            3000,
            "clicked"
          );
          FileManager.updateFileList();
        } else {
          UI.createAlert(
            "error",
            "Sorry your folder couldn't be saved...",
            3000,
            "clicked"
          );
        }
      }
    });
  }
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
    FileManager.updateFileList();
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
  static moveFile(i, fullPath) {
    let inputOptions = [];
    let loc = {
      text: "local",
      value: "/"
    };
    inputOptions.push(loc);
    printerInfo[i].filesList.folders.forEach(folder => {
      let option = {
        text: folder.name,
        value: folder.name
      };
      inputOptions.push(option);
    });
    bootbox.prompt({
      title: "Where would you like to move the file?",
      inputType: "select",
      inputOptions: inputOptions,
      callback: async function(result) {
        if (result) {
          let opt = {
            command: "move",
            destination: result
          };
          let post = await OctoPrintClient.post(
            printerInfo[i],
            "files/local/" + fullPath,
            opt
          );
          if (post.status === 404) {
            UI.createAlert(
              "error",
              `We could not find the location, does it exist?`,
              3000,
              "clicked"
            );
          } else if (post.status === 409) {
            UI.createAlert(
              "error",
              `There was a conflic, file already exists or is in use...`,
              3000,
              "clicked"
            );
          } else {
            let json = await post.json();
            let opts = {
              index: i,
              newPath: result,
              fileName: json.name,
              newFullPath: json.path
            };
            let updateFarm = await OctoFarmClient.post(
              "printers/moveFile",
              opts
            );
            FileManager.updateFileList();
            UI.createAlert(
              "success",
              `Successfully moved your file...`,
              3000,
              "clicked"
            );
          }
        }
      }
    });
  }
  static deleteFile(i, fullPath) {
    bootbox.confirm({
      message: "Are you sure you want to delete " + fullPath + "?",
      buttons: {
        cancel: {
          label: '<i class="fa fa-times"></i> Cancel'
        },
        confirm: {
          label: '<i class="fa fa-check"></i> Confirm'
        }
      },
      callback: function(result) {
        if (result) {
          OctoPrintClient.file(printerInfo[i], fullPath, "delete");
        }
      }
    });
  }
  static deleteFolder(i, fullPath) {
    bootbox.confirm({
      message: "Are you sure you want to delete " + fullPath + "?",
      buttons: {
        cancel: {
          label: '<i class="fa fa-times"></i> Cancel'
        },
        confirm: {
          label: '<i class="fa fa-check"></i> Confirm'
        }
      },
      callback: async function(result) {
        let opts = {
          index: i,
          fullPath: fullPath
        };
        if (result) {
          let post = await OctoPrintClient.delete(
            printerInfo[i],
            "files/local/" + fullPath
          );
          let del = await OctoFarmClient.post("printers/removefolder", opts);
          document.getElementById("file-" + fullPath).remove();
        }
      }
    });
  }
  static moveFolder(i, fullPath) {
    let inputOptions = [];
    let loc = {
      text: "local",
      value: "/"
    };
    inputOptions.push(loc);
    printerInfo[i].filesList.folders.forEach(folder => {
      let option = {
        text: folder.name,
        value: folder.name
      };
      inputOptions.push(option);
    });
    bootbox.prompt({
      title: "Where would you like to move the file?",
      inputType: "select",
      inputOptions: inputOptions,
      callback: async function(result) {
        if (result) {
          let opt = {
            command: "move",
            destination: result
          };
          let post = await OctoPrintClient.post(
            printerInfo[i],
            "files/local/" + fullPath,
            opt
          );
          if (post.status === 404) {
            UI.createAlert(
              "error",
              `We could not find the location, does it exist?`,
              3000,
              "clicked"
            );
          } else if (post.status === 409) {
            UI.createAlert(
              "error",
              `There was a conflic, file already exists or is in use...`,
              3000,
              "clicked"
            );
          } else {
            let json = await post.json();
            let opts = {
              index: i,
              oldFolder: fullPath,
              newFullPath: result,
              folderName: json.path
            };
            let updateFarm = await OctoFarmClient.post(
              "printers/moveFolder",
              opts
            );
            FileManager.updateFileList();
            UI.createAlert(
              "success",
              `Successfully moved your folder...`,
              3000,
              "clicked"
            );
          }
        }
      }
    });
  }
}
