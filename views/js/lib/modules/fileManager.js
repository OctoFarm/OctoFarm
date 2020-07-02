import OctoFarmClient from "../octofarm.js";
import OctoPrintClient from "../octoprint.js";
import Queue from "../modules/clientQueue.js";
import Calc from "../functions/calc.js";
import UI from "../functions/ui.js";
import {dragAndDropEnable} from "../functions/dragAndDrop.js";

let fileUploads = new Queue();

let fileSortInit = false;

setInterval(async () => {
  //If there are files in the queue, plow through until uploaded... currently single file at a time.
  if (fileUploads.size() > 0) {
    let current = fileUploads.first();
    if (!current.active) {
      fileUploads.activate(0);
      let currentDate = new Date()
      let file = await current.upload(current);
      file = JSON.parse(file);
      file.index = current.index;
      file.date = currentDate.getTime() / 1000;
      let post = await OctoFarmClient.post("printers/newFiles", file);
      let update = await FileManager.updateFileList(file.index);
      fileUploads.remove();
      let fileCounts = document.getElementById("fileCounts-" + current.index);
      if(fileCounts && fileCounts.innerHTML == 1){
          fileCounts.innerHTML = " " +0;
      }
    }
  }
  let allUploads = fileUploads.all();
  allUploads.forEach(uploads => {
    let currentCount = allUploads.reduce(function (n, up) {
      return n + (up.index == uploads.index);
    }, 0)
    let fileCounts = document.getElementById("fileCounts-" + uploads.index);
    if(fileCounts){
      fileCounts.innerHTML = " " + currentCount;
    }
  })

}, 1000);

export default class FileManager {
  static grabName(printer){
    let name = "";
    if (typeof printer.settingsAppearance != "undefined") {
      if (printer.settingsAppearance.name === "" || printer.settingsAppearance.name === null) {
        name = printer.printerURL;
      } else {
        name = printer.settingsAppearance.name;
      }
    } else {
      name = printer.printerURL;
    }
    return name;
  }
  static async handleFiles(Afiles, printerInfo, print) {
    Afiles = [...Afiles];
    for (let i = 0; i < Afiles.length; i++) {
      let newObject = {};
      let spinner = document.getElementById("fileUploadCountSpinner");
      if(spinner){
        if(spinner.classList.contains("fa-spin")) {
        } else {
          spinner.classList = "fas fa-spinner fa-spin";
        }
      }

      newObject.file = Afiles[i];
      if(typeof print !== 'undefined'){
        newObject.print = true;
      }
      newObject.index = printerInfo._id;
      newObject.printerInfo = printerInfo;
      let currentFolder = document.getElementById(
          "currentFolder"
      );
      if(currentFolder){
        newObject.currentFolder = currentFolder.innerHTML;
      }else{
        newObject.currentFolder = "local/"
      }
      newObject.upload = FileManager.fileUpload;
      fileUploads.add(newObject);


    }
  }
  static createUpload(index, fileName, loaded, total) {
    let uploadSize = fileUploads.size();
    let upCount = document.getElementById("fileUploadCount");
    if(upCount){
      upCount.innerHTML = "File Queue: " + uploadSize;
      if (uploadSize < 1) {
        upCount.innerHTML = "File Queue: 0";
        let spinner = document.getElementById("fileUploadCountSpinner");
        if (spinner.classList.contains("fa-spin")) {
          spinner.classList = "fas fa-spinner";
        }
      }
    }

    let progress = document.getElementById("fileProgress-" + index);
    if(progress){
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

  }

  static fileUpload(file) {
    return new Promise(function(resolve, reject) {
      //Grab folder location
      let currentFolder = file.currentFolder;
      //Grab Client Info

      let index = file.index;
      let printerInfo = file.printerInfo;


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
      let url = printerInfo.printerURL+"/api/files/local";
      var xhr = new XMLHttpRequest();
      file = file.file;
      xhr.open("POST", url);
      xhr.upload.onprogress = function(e) {
        if (e.lengthComputable) {
          FileManager.createUpload(
              printerInfo._id,
              file.name,
              e.loaded,
              e.total
          );
        }
      };

      //xhr.setRequestHeader("Content-Type", "multipart/form-data");
      xhr.setRequestHeader("X-Api-Key", printerInfo.apikey);
      xhr.onloadstart = function(e) {
        FileManager.createUpload(
            printerInfo._id,
            file.name,
            e.loaded,
            e.total
        );
      };
      xhr.onloadend = function(e) {
        FileManager.createUpload(
            printerInfo._id,
            file.name,
            e.loaded,
            e.total
        );
        setTimeout(() => {
          FileManager.createUpload(
              printerInfo._id,
              file.name,
              e.loaded,
              e.total
          );
        }, 5000);
        if (this.status >= 200 && this.status < 300) {
          resolve(xhr.response);
          UI.createAlert(
              "success",
              file.name + " has finished uploading to Printer: " + FileManager.grabName(printerInfo),
              3000,
              "clicked"
          );
        } else {
          fileUploads.remove();
          let fileCounts = document.getElementById("fileCounts-" + index);
          if(fileCounts && fileCounts.innerHTML == 1){
            fileCounts.innerHTML = " " +0;
          }
          resolve(xhr.response);
          UI.createAlert(
              "error",
              `Sorry but ${file.name} could not be uploaded... is CORS enabled and OctoPrint online?`,
              3000,
              "clicked"
          );
        }
      };
      xhr.onerror = function() {
        resolve(xhr.response);
        UI.createAlert(
            "error",
            `Sorry but ${file.name} could not be uploaded... is CORS enabled and OctoPrint online?`,
            3000,
            ""
        );
      };
      if (file.name.includes(".gcode")) {
        xhr.send(formData);
      } else {
        UI.createAlert(
            "error",
            `Sorry but ${file.name} is not a gcode file, could not be uploading.`,
            3000,
            ""
        );
      }
    });
  }
  static actionBtnGate(printer, btn) {
    let data = btn.split("*");
    let action = data[1];
    let filePath = data[2];
    if (action === "fileActionStart") {
      FileActions.startPrint(printer, filePath);
    } else if (action === "fileActionSelect") {
      FileActions.selectFile(printer, filePath);
    } else if (action === "fileActionUpdate") {
      FileActions.updateFile(printer, btn, filePath);
    } else if (action === "fileActionMove") {
      FileActions.moveFile(printer, filePath);
    } else if (action === "fileActionDownload") {
    } else if (action === "fileActionDelete") {
      FileActions.deleteFile(printer, filePath);
    } else if (action === "folderActionMove") {
      FileActions.moveFolder(printer, filePath);
    } else if (action === "folderActionDelete") {
      FileActions.deleteFolder(printer, filePath);
    }
  }

  static async reSyncFiles(e, printer) {
    e.target.innerHTML = "<i class='fas fa-sync fa-spin'></i> Re-Syncing...";
    let done = await OctoFarmClient.post("printers/resyncFile", {
      i: printer._id
    });
    let how = await done.json();

    let flashReturn = function() {
      e.target.classList = "btn btn-primary mb-0";
      e.target.innerHTML = "<i class='fas fa-sync'></i> Re-Sync";
    };
    if (how) {
      e.target.classList = "btn btn-primary mb-0";
      e.target.innerHTML = "<i class='fas fa-sync'></i> Re-Sync";
      setTimeout(flashReturn, 500);
    } else {
      e.target.classList = "btn btn-primary mb-0";
      e.target.innerHTML = "<i class='fas fa-sync'></i> Re-Sync";
      setTimeout(flashReturn, 500);
    }
    FileManager.updateFileList(printer._id);
  }
  static async updateFileList(index) {
    let printer = await OctoFarmClient.post("printers/printerInfo", {
      i: index
    });
    printer = await printer.json();
    FileManager.drawFiles(printer);
    let printerStorage = document.getElementById("printerStorage");
    if(printerStorage){
      printerStorage.innerHTML = `
          <i class="fas fa-hdd"></i> 
          ${Calc.bytes(printer.storage.free)}  / 
          ${Calc.bytes(printer.storage.total)}
        </button>`;
            document.getElementById("printerFileCount").innerHTML = `
          <i class="fas fa-file"></i> ${printer.filesList.fileCount} <i class="fas fa-folder"></i> ${printer.filesList.folderCount}
          `
      return "done";
    }else{
      return "done";
    }
  }
  static openFolder(folder, target, printer) {
    if (typeof target != "undefined" && target.type === "button") {
      return;
    }
    if (typeof folder != "undefined") {
      folder = folder.replace("file-", "");

      document.getElementById("currentFolder").innerHTML = "local/" + folder;
      FileManager.updateFileList(printer._id);
    } else {
      let currentFolder = document.getElementById("currentFolder").innerHTML;
      if (currentFolder != "local") {
        let previousFolder = currentFolder.substring(
            0,
            currentFolder.lastIndexOf("/")
        );
        document.getElementById("currentFolder").innerHTML = previousFolder;
        FileManager.updateFileList(printer._id);
      }
    }
  }
  static drawFiles(printer, recursive) {
    let fileElem = document.getElementById("fileList-"+printer._id);
    if(fileElem){
      let fileList = printer.filesList;

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
          let thumbnail = "<center><i class=\"fas fa-file-code fa-2x\"></i></center>";
          if(typeof file.thumbnail !== 'undefined' && file.thumbnail !== null ){
            thumbnail = `<center><img src='${printer.printerURL}/${file.thumbnail}' width="100%"></center>`;
          }
          let fileDate = new Date(file.date*1000);
          let dateString = fileDate.toDateString();
          let timeString = fileDate.toTimeString().substring(0, 8);
          let getUsage = FileActions.grabUsage(file);
          let usageElement = getUsage.split(" / ").pop();
          let printCost = (parseFloat(Calc.returnFilamentCost(printer.selectedFilament, usageElement)) + parseFloat(Calc.returnPrintCost(printer.costSettings, file.time))).toFixed(2);
            if(isNaN(printCost)){
              printCost = "Unable to calculate";
            }

          fileDate = dateString + " " + timeString;

          if (typeof recursive != "undefined") {
            fileElem.insertAdjacentHTML(
                "beforeend",
                `
          <a
          data-jplist-item
          id="file-${file.fullPath}"
          href="#"
          class="list-group-item list-group-item-action flex-column align-items-start bg-secondary "
          style="display: block;
          padding: 0.7rem 0.1rem;"
        >
          <div class="row">
            <div
              class="col-lg-2"
              style="display:flex; justify-content:center; align-items:center;"
            >
       ${thumbnail}
            </div>
            <div class="col-lg-10">
            <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1 name">${file.display}</h5>
    <small><i class="fas fa-stopwatch"></i> <span class="time">${Calc.generateTime(
                    file.time
                )}</span> <br> <i class="fas fa-dollar-sign"></i> <span class="cost"> ${printCost} </span> </small>


          </div>
          <p class="mb-1 float-left">
          <i class="fas fa-clock"></i><span class="date"> ${fileDate}</span><br>
          <i class="fas fa-hdd"></i><span class="size"> ${Calc.bytes(file.size)}</span> <br>
          <i class="fas fa-weight"></i><span class="usage"> ${getUsage}</span>
          
          </p>
              <div
              class="float-right btn-group flex-wrap btn-group-sm"
              role="group"
              aria-label="Basic example"
            >
              <button
                id="${printer._id}*fileActionUpdate*${file.fullPath}"
                role="button"
                class="btn btn-dark"
              >
                <i class="fas fa-sync"></i> Refresh
              </button>
              <button id="${printer._id}*fileActionStart*${
                    file.fullPath
                }" type="button" class="btn btn-success">
                <i class="fas fa-play"></i> Start
              </button>
              <button id="${printer._id}*fileActionSelect*${
                    file.fullPath
                }" type="button" class="btn btn-info">
                <i class="fas fa-file-upload"></i> Select
              </button>
              <button id="${printer._id}*fileActionMove*${
                    file.fullPath
                }" type="button" class="btn btn-warning">
                <i class="fas fa-people-carry"></i> Move
              </button>
              <button onclick="window.open('${printer.printerURL}/downloads/files/local/${
                    file.fullPath
                }')" type="button" class="btn btn-dark">
                <i class="fas fa-download"></i> Download
              </button>
              <button id="${printer._id}*fileActionDelete*${
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
          data-jplist-item
          id="file-${file.fullPath}"
          href="#"
          class="list-group-item list-group-item-action flex-column align-items-start bg-secondary"
          style="display: block;
          padding: 0.7rem 0.1rem;"
        >
          <div class="row">
            <div
              class="col-lg-2"
              style="display:flex; justify-content:center; align-items:center;"
            >
                   ${thumbnail}
            </div>
            <div class="col-lg-10">
            <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1 name">${file.display}</h5>         
            <small><i class="fas fa-stopwatch"></i> <span class="time">${Calc.generateTime(
                    file.time
                )}</span> <br> <i class="fas fa-dollar-sign"></i> <span class="cost"> ${printCost} </span> </small>

          </div>
          <p class="mb-1 float-left">
          <i class="fas fa-clock"></i><span class="date"> ${fileDate}</span><br>
          <i class="fas fa-hdd"></i><span class="size"> ${Calc.bytes(file.size)}</span> <br>
          <i class="fas fa-weight"></i><span class="usage"> ${getUsage}</span>
          
          </p>
              <div
              class="float-right btn-group flex-wrap btn-group-sm"
              role="group"
              aria-label="Basic example"
            >
              <button
                id="${printer._id}*fileActionUpdate*${file.fullPath}"
                role="button"
                class="btn btn-dark"
              >
                <i class="fas fa-sync"></i> Refresh
              </button>
              <button id="${printer._id}*fileActionStart*${
                    file.fullPath
                }" type="button" class="btn btn-success">
                <i class="fas fa-play"></i> Start
              </button>
              <button id="${printer._id}*fileActionSelect*${
                    file.fullPath
                }" type="button" class="btn btn-info">
                <i class="fas fa-file-upload"></i> Select
              </button>
              <button id="${printer._id}*fileActionMove*${
                    file.fullPath
                }" type="button" class="btn btn-warning">
                <i class="fas fa-people-carry"></i> Move
              </button>
              <button onclick="window.open('${printer.printerURL}/downloads/files/local/${
                    file.fullPath
                }')" type="button" class="btn btn-dark">
                <i class="fas fa-download"></i> Download
              </button>
              <button id="${printer.printerURL}*fileActionDelete*${
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
                      <button id="${printer._id}*folderActionMove*${folder.name}" type="button" class="btn btn-warning">
                        <i class="fas fa-people-carry"></i> Move
                      </button>
                      <button id="${printer._id}*folderActionDelete*${folder.name}" type="button" class="btn btn-danger">
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
        FileManager.updateListeners(printer);
      }
    }
    if(fileSortInit){
      jplist.refresh();
    }else{
      jplist.init({
        storage: 'localStorage', //'localStorage', 'sessionStorage' or 'cookies'
        storageName: 'file-sorting' //the same storage name can be used to share storage between multiple pages
      });
    }

  }
  static search(id){
    FileActions.search(id);
  }
  static createFolder(printer){
    FileActions.createFolder(printer);
  }
  static updateListeners(printer) {
    let fileElem = document.getElementById("fileList-"+printer._id)
    dragAndDropEnable(fileElem, printer);
    let folders = document.querySelectorAll(".folderAction");
    folders.forEach(folder => {
      folder.addEventListener("click", e => {
        //Remove from UI
        FileManager.openFolder(folder.id, e.target, printer);
      });
    });
    let fileActionBtns = document.querySelectorAll("[id*='*fileAction']");
    fileActionBtns.forEach(btn => {
      //Gate Keeper listener for file action buttons
      btn.addEventListener("click", e => {
        FileManager.actionBtnGate(printer, btn.id);
      });
    });
    let folderActionBtns = document.querySelectorAll("[id*='*folderAction']");
    folderActionBtns.forEach(btn => {
      //Gate Keeper listener for file action buttons
      btn.addEventListener("click", e => {
        FileManager.actionBtnGate(printer, btn.id);
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
    }

    async function second() {
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
      let printers = await OctoFarmClient.post("printers/printerInfo", {
        i: null
      });
      printers = await printers.json()

      selectedPrinters.forEach((printer, index) => {
        if (printer) {
          let i = _.findIndex(printers, function (o) {
            return o._id == printer.value.toString();
          });

          let name = "";
          if (typeof printers[i].settingsAppearance != "undefined") {
            if (printers[i].settingsAppearance.name === "" || printers[i].settingsAppearance.name === null) {
              name = printers[i].printerURL;
            } else {
              name = printers[i].settingsAppearance.name;
            }
          } else {
            name = printers[i].printerURL;
          }

          document.getElementById("multiSelectedPrinters2").insertAdjacentHTML(
              "beforeend",
              `
            [<span class="MultiSelected">${name}</span>]
            `
          );
          selectedPrinters[index] = {
            value: printers[i]._id,
            printerInfo: printers[i]
          }
        }
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
          newObject.printerInfo = printer.printerInfo;
          newObject.upload = FileManager.fileUpload;
          newObject.currentFolder = selectedFolder;

          if (printAfterUpload) {
            newObject.print = true;
          }

          fileUploads.add(newObject);

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
  static async search(id) {
    let printer = await OctoFarmClient.post("printers/printerInfo", {
      i: id
    });
    printer = await printer.json()

    let fileList = document.getElementById("fileList-"+id);
    let input = document.getElementById("searchFiles").value.toUpperCase();

    input = input.replace(/ /g,"_");
    if (input.value === "") {
      //No search term so reset view
      document.getElementById("currentFolder").value = "local";
      FileManager.drawFiles(printer, "Recursive");
    } else {
      document.getElementById("currentFolder").value = "local";
      FileManager.drawFiles(printer, "Recursive");
    }
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
  static async createFolder(printer) {
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
            printer,
            "local",
            formData
        );
        if (post.status === 201 || post.status === 200) {
          let opts = {
            i: printer._id,
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
          FileManager.updateFileList(printer._id);
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
  //Needs updating when filament is brought in.
  static grabUsage(file){
    if(typeof file.length === 'undefined' || file.length === null){
      return "No Length"
    }
    let radius = parseFloat(1.75) / 2
    let volume = ((file.length /1000) * 3.1415926535 * radius * radius)
    let usage = volume * parseFloat(1.24)
    return (file.length /1000).toFixed(2) + "m / " + usage.toFixed(2) + "g";
  }
  static async startPrint(printer, filePath) {
    OctoPrintClient.file(printer, filePath, "print");
  }
  static selectFile(printer, filePath) {
    OctoPrintClient.file(printer, filePath, "load");
  }
  static async updateFile(printer, btn, fullPath) {
    let refreshBtn = document.getElementById(btn);
    let btnName = null;
    refreshBtn.innerHTML = `<i class="fas fa-sync fa-spin"></i> Refreshing...`;
    let done = await OctoFarmClient.post("printers/resyncFile", {
      i: printer._id,
      fullPath: fullPath
    });
    let how = await done.json();
    FileManager.updateFileList(printer._id);
    refreshBtn.innerHTML = `<i class="fas fa-sync"></i> Refresh`;
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
  static moveFile(printer, fullPath) {
    let inputOptions = [];
    let loc = {
      text: "local",
      value: "/"
    };
    inputOptions.push(loc);
    printer.filesList.folders.forEach(folder => {
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
              printer,
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
                `There was a conflict, file already exists or is in use...`,
                3000,
                "clicked"
            );
          } else {
            let json = await post.json();
            let opts = {
              index: printer._id,
              newPath: result,
              fileName: json.name,
              newFullPath: json.path
            };
            let updateFarm = await OctoFarmClient.post(
                "printers/moveFile",
                opts
            );
            FileManager.updateFileList(printer._id);
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
  static deleteFile(printer, fullPath) {
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
        if (result) {
          await OctoPrintClient.file(printer, fullPath, "delete");
          jplist.resetContent(function(){
            //remove element with id = el1
            document.getElementById("file-" + fullPath).remove();
          });
        }
      }
    });
  }
  static deleteFolder(printer, fullPath) {
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
          index: printer._id,
          fullPath: fullPath
        };
        if (result) {

          let post = await OctoPrintClient.delete(
              printer,
              "files/local/" + fullPath
          );
          let del = await OctoFarmClient.post("printers/removefolder", opts);
          jplist.resetContent(function(){
            //remove element with id = el1
            document.getElementById("file-" + fullPath).remove();
          });
        }
      }
    });
  }
  static moveFolder(printer, fullPath) {
    let inputOptions = [];
    let loc = {
      text: "local",
      value: "/"
    };
    inputOptions.push(loc);
    printer.filesList.folders.forEach(folder => {
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
              printer,
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
                `There was a conflict, file already exists or is in use...`,
                3000,
                "clicked"
            );
          } else {
            let json = await post.json();
            let opts = {
              index: printer._id,
              oldFolder: fullPath,
              newFullPath: result,
              folderName: json.path
            };
            let updateFarm = await OctoFarmClient.post(
                "printers/moveFolder",
                opts
            );
            await FileManager.updateFileList(printer._id);

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
