import OctoPrintClient from "../octoprint";
import OctoFarmClient from "../../services/octofarm-client.service";
import Calc from "../functions/calc.js";
import UI from "../functions/ui.js";
import FileManager from "./fileManager.js";
import { returnDropDown, selectFilament } from "../../services/filament-manager-plugin.service";
import FileSorting from "../modules/fileSorting.js";
import CustomGenerator from "./customScripts.js";

let currentIndex = 0;

let controlDropDown = false;

let currentPrinter = null;

let filamentManager = false;

$("#connectionModal").on("hidden.bs.modal", function (e) {
  if (document.getElementById("connectionAction")) {
    document.getElementById("connectionAction").remove();
  }
});

export default class PrinterFileManager {
  static async init(index, printers, printerControlList) {
    //clear camera
    if (index !== "") {
      currentIndex = index;
      const id = _.findIndex(printers, function (o) {
        return o._id == index;
      });
      currentPrinter = printers[id];
      //Load the printer dropdown
      if (!controlDropDown) {
        const printerDrop = document.getElementById("printerSelection");
        printerDrop.innerHTML = "";
        printerControlList.forEach((list) => {
          if (list.state.category !== "Offline") {
            printerDrop.insertAdjacentHTML(
              "beforeend",
              `
                  <option value="${list.printerID}" selected>${list.printerName}</option>
              `
            );
          }
        });
        printerDrop.value = currentPrinter._id;
        printerDrop.addEventListener("change", (event) => {
          if (document.getElementById("printerControls")) {
            document.getElementById("printerControls").innerHTML = "";
          }
          document.getElementById("pmStatus").innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
          document.getElementById("pmStatus").className = "btn btn-secondary mb-2";
          //Load Connection Panel
          document.getElementById("printerPortDrop").innerHTML = "";
          document.getElementById("printerBaudDrop").innerHTML = "";
          document.getElementById("printerProfileDrop").innerHTML = "";
          document.getElementById("printerConnect").innerHTML = "";
          PrinterFileManager.init(event.target.value, printers, printerControlList);
        });
        controlDropDown = true;
      }
      const filamentDropDown = await returnDropDown();
      const done = await PrinterFileManager.loadPrinter(
        currentPrinter,
        printerControlList,
        filamentDropDown
      );
      const elements = PrinterFileManager.grabPage();
      PrinterFileManager.applyState(currentPrinter, elements);
      PrinterFileManager.applyListeners(elements, printers, filamentDropDown);
    } else {
      const id = _.findIndex(printers, function (o) {
        return o._id == currentIndex;
      });
      currentPrinter = printers[id];
      const printerDrop = document.getElementById("printerSelection");
      printerDrop.innerHTML = "";
      printerControlList.forEach((list) => {
        if (list.state.category !== "Offline") {
          printerDrop.insertAdjacentHTML(
            "beforeend",
            `
                  <option value="${list.printerID}" selected>${list.printerName}</option>
              `
          );
        }
      });
      printerDrop.value = currentPrinter._id;

      const elements = await PrinterFileManager.grabPage();
      PrinterFileManager.applyState(currentPrinter, elements);
      document.getElementById("printerManagerModal").style.overflow = "auto";
    }
    return true;
  }

  static async loadPrinter(printer, printerControlList, filamentDropDown) {
    //Load Connection Panel
    try {
      const printerPort = document.getElementById("printerPortDrop");
      const printerBaud = document.getElementById("printerBaudDrop");
      const printerProfile = document.getElementById("printerProfileDrop");
      const printerConnect = document.getElementById("printerConnect");

      printerPort.innerHTML = `
    <div class="input-group mb-1"> <div class="input-group-prepend"> <label class="input-group-text bg-secondary text-light" for="dashboardSerialPort">Port:</label> </div> <select class="custom-select bg-secondary text-light" id="pmSerialPort"></select></div>
    `;
      printerBaud.innerHTML = `
    <div class="input-group mb-1"> <div class="input-group-prepend"> <label class="input-group-text bg-secondary text-light" for="dashboardBaudrate">Baudrate:</label> </div> <select class="custom-select bg-secondary text-light" id="pmBaudrate"></select></div>
    `;
      printerProfile.innerHTML = `
    <div class="input-group mb-1"> <div class="input-group-prepend"> <label class="input-group-text bg-secondary text-light" for="dashboardPrinterProfile">Profile:</label> </div> <select class="custom-select bg-secondary text-light" id="pmProfile"></select></div>
    `;
      printer.connectionOptions.baudrates.forEach((baud) => {
        if (baud !== 0) {
          document
            .getElementById("pmBaudrate")
            .insertAdjacentHTML("beforeend", `<option value="${baud}">${baud}</option>`);
        } else {
          document
            .getElementById("pmBaudrate")
            .insertAdjacentHTML("beforeend", `<option value="${baud}">AUTO</option>`);
        }
      });
      if (printer.connectionOptions.baudratePreference != null) {
        document.getElementById("pmBaudrate").value = printer.connectionOptions.baudratePreference;
      }
      printer.connectionOptions.ports.forEach((port) => {
        document
          .getElementById("pmSerialPort")
          .insertAdjacentHTML("beforeend", `<option value="${port}">${port}</option>`);
      });
      if (printer.connectionOptions.portPreference != null) {
        document.getElementById("pmSerialPort").value = printer.connectionOptions.portPreference;
      }
      printer.connectionOptions.printerProfiles.forEach((profile) => {
        document
          .getElementById("pmProfile")
          .insertAdjacentHTML(
            "beforeend",
            `<option value="${profile.id}">${profile.name}</option>`
          );
      });
      if (printer.connectionOptions.printerProfilePreference != null) {
        document.getElementById("pmProfile").value =
          printer.connectionOptions.printerProfilePreference;
      }
      if (
        printer.printerState.state === "Disconnected" ||
        printer.printerState.state === "Error!"
      ) {
        printerConnect.innerHTML =
          '<center> <button id="pmConnect" class="btn btn-success inline" value="connect">Connect</button><a title="Open your Printers Web Interface" id="pmWebBtn" type="button" class="tag btn btn-info ml-1" target="_blank" href="' +
          printer.printerURL +
          '" role="button"><i class="fas fa-globe-europe"></i></a><div id="powerBtn-' +
          printer._id +
          '" class="btn-group ml-1"></div></center>';
        document.getElementById("pmSerialPort").disabled = false;
        document.getElementById("pmBaudrate").disabled = false;
        document.getElementById("pmProfile").disabled = false;
      } else {
        printerConnect.innerHTML =
          '<center> <button id="pmConnect" class="btn btn-danger inline" value="disconnect">Disconnect</button><a title="Open your Printers Web Interface" id="pmWebBtn" type="button" class="tag btn btn-info ml-1" target="_blank" href="' +
          printer.printerURL +
          '" role="button"><i class="fas fa-globe-europe"></i></a><div id="pmPowerBtn-' +
          printer._id +
          '" class="btn-group ml-1"></div></center>';
        document.getElementById("pmSerialPort").disabled = true;
        document.getElementById("pmBaudrate").disabled = true;
        document.getElementById("pmProfile").disabled = true;
      }
      //Load tools
      document.getElementById("printerControls").innerHTML = `
          <div class="row">
            <div id="customGcodeCommandsArea" class="col-lg-12"></div>
          </div>
          <div class="row bg-secondary rounded-top">
                <div class="col-12">
                     <h5 class="float-left  mb-0">
                      <button id="printerFileCount" type="button" class="btn btn-secondary float-right d-block" href="#" aria-expanded="false" disabled="">
                        <i class="fas fa-file"></i> Loading... <i class="fas fa-folder"></i> Loading...
                      </button>
                      <button id="printerStorage" type="button" class="btn btn-secondary float-right d-block" href="#" aria-expanded="false" disabled="">
  
                        <i class="fas fa-hdd"></i> Loading...
                      </button>
                    </h5>
                    <h5 class="float-left mb-0">
                      <button type="button" class="btn btn-secondary float-right d-block" href="#" aria-expanded="false" disabled="">
                        <i class="fas fa-file-code"></i> Files: <span id="currentFolder">local</span>/
                      </button>
                    </h5>
                    <div class="btn btn-secondary form-group float-right  mb-0">
                      <form class="form-inline">
                        <div class="form-group">
                          <label for="searchFiles">
                            <i class="fas fa-search pr-1"></i>
                          </label>
                          <input id="searchFiles" type="text" placeholder="File Search..." class="search-control search-control-underlined">
                        </div>
                      </form>
                    </div>
                   </div>
                  </div>
          <div class="row bg-secondary rounded-bottom">
              <div class="col-lg-2">
                <i class="fas fa-file-upload ml-2 mb-1"></i><span id="fileCounts-${printer._id}"> 0 </span>
              </div>
              <div class="col-lg-10">
                <div class="progress">
                  <div id="fileProgress-${printer._id}" class="progress-bar progress-bar-striped bg-warning" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                    0%
                  </div>
                </div>
              </div>
            </div>
          <div class="row mb-1">
                <div class="col-12">
                 <button id="fileBackBtn" type="button" class="btn btn-success float-right">
                  <i class="fas fa-chevron-left"></i> Back
                </button>
                <!-- Split dropright button -->
                <div class="float-right mr-3 btn-group">
                    <div id="fileSortDropdownMenu" class="btn bg-secondary">Sort</div>
                    <button type="button" class="btn btn-secondary dropdown-toggle dropdown-toggle-split" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                      <span class="sr-only">Toggle Dropdown</span>
                    </button>
                    <div class="dropdown-menu">
                      
                 <a class="dropdown-item" id="sortFileNameDown"><i class="fas fa-sort-alpha-down"></i> File Name</a>

                <a class="dropdown-item" id="sortFileNameUp"><i class="fas fa-sort-alpha-up"></i> File Name</a>
                       <div class="dropdown-divider"></div>
                <a class="dropdown-item" id="sortPrintTimeDown"><i class="fas fa-sort-numeric-down"></i> Print Time</a>

                <a class="dropdown-item" id="sortPrintTimeUp"><i class="fas fa-sort-numeric-up"></i> Print Time</a>
                       <div class="dropdown-divider"></div>
                <a class="dropdown-item" id="sortDateDown"><i class="fas fa-sort-numeric-down"></i> Upload Date</a>

                <a class="dropdown-item" id="sortDateUp"><i class="fas fa-sort-numeric-up"></i> Upload Date</a>
                    </div>
                  </div>
                  <label class="btn btn-success float-left mr-1 mb-0 bg-colour-1" for="fileUploadBtn"><i class="fas fa-file-import"></i> Upload File(s)</label>
                  <input id="fileUploadBtn" multiple accept=".gcode,.gco,.g" type="file" class="btn btn-success float-left bg-colour-1" id="uploadFileBtn">
                  <label class="btn btn-info float-left mr-1 mb-0 bg-colour-2" for="fileUploadPrintBtn"><i class="fas fa-file-import"></i> Upload and Print</label>
                  <input id="fileUploadPrintBtn" accept=".gcode,.gco,.g" type="file" class="btn btn-success float-left bg-colour-2" id="uploadFileBtn">
                <button
                  id="createFolderBtn"
                  type="button"
                  class="btn btn-warning float-left mr-1 mb-0 bg-colour-3"
                  data-toggle="collapse"
                  href="#createFolder"
                  role="button"
                  aria-expanded="false"
                  aria-controls="createFolder"
                >
                  <i class="fas fa-folder-plus"></i> Create Folder
                </button>
                <button id="fileReSync" type="button" class="btn btn-primary mb-0 bg-colour-4">
                  <i class="fas fa-sync"></i> Re-Sync
                </button>
                </div>

            </div>
          <div id="fileList-${printer._id}" class="list-group" style="height:500px; min-height:500px;max-height:500px; overflow-y:scroll;">

          </div>
            `;
      FileSorting.loadSort(printer);

      CustomGenerator.generateButtons(printer);
    } catch (e) {
      UI.createAlert(
        "error",
        "Something has gone wrong with loading the File Manager... Hard Failure, please submit as a bug on github: " +
          e,
        0,
        "clicked"
      );
      console.error(e);
    }
  }

  static applyListeners(elements, printers, filamentDropDown) {
    const rangeSliders = document.querySelectorAll("input.octoRange");
    rangeSliders.forEach((slider) => {
      slider.addEventListener("input", (e) => {
        e.target.previousSibling.previousSibling.lastChild.innerHTML = `${e.target.value}%`;
      });
    });
    if (currentPrinter.state != "Disconnected") {
      elements.connectPage.connectButton.addEventListener("click", (e) => {
        elements.connectPage.connectButton.disabled = true;
        OctoPrintClient.connect(elements.connectPage.connectButton.value, currentPrinter);
      });
    } else {
      elements.connectPage.connectButton.addEventListener("click", (e) => {
        elements.connectPage.connectButton.disabled = true;
        OctoPrintClient.connect(elements.connectPage.connectButton.value, currentPrinter);
      });
    }

    elements.fileManager.uploadFiles.addEventListener("change", function () {
      UI.createAlert(
        "warning",
        "Your files for Printer: " +
          currentPrinter.printerName +
          " has begun. Please do not navigate away from this page.",
        3000,
        "Clicked"
      );
      FileManager.handleFiles(this.files, currentPrinter);
    });
    elements.fileManager.createFolderBtn.addEventListener("click", (e) => {
      FileManager.createFolder(currentPrinter);
    });
    elements.fileManager.fileSearch.addEventListener("keyup", (e) => {
      FileManager.search(currentPrinter._id);
    });
    elements.fileManager.uploadPrintFile.addEventListener("change", function () {
      FileManager.handleFiles(this.files, currentPrinter, "print");
    });
    elements.fileManager.back.addEventListener("click", (e) => {
      FileManager.openFolder(undefined, undefined, currentPrinter);
    });
    elements.fileManager.syncFiles.addEventListener("click", (e) => {
      FileManager.reSyncFiles(e, currentPrinter);
    });
  }

  static grabPage() {
    const printerManager = {
      mainPage: {
        title: document.getElementById("printerSelection"),
        status: document.getElementById("pmStatus")
      },
      connectPage: {
        printerPort: document.getElementById("printerPortDrop"),
        printerBaud: document.getElementById("printerBaudDrop"),
        printerProfile: document.getElementById("printerProfileDrop"),
        printerConnect: document.getElementById("printerConnect"),
        connectButton: document.getElementById("pmConnect"),
        portDropDown: document.getElementById("pmSerialPort"),
        baudDropDown: document.getElementById("pmBaudrate"),
        profileDropDown: document.getElementById("pmProfile")
      },
      printerControls: {
        filamentDrop: document.getElementById("filamentManagerFolderSelect"),
        fileUpload: document.getElementById("printerManagerUploadBtn")
      },
      fileManager: {
        printerStorage: document.getElementById("printerStorage"),
        fileFolderCount: document.getElementById("printerFileCount"),
        fileSearch: document.getElementById("searchFiles"),
        uploadFiles: document.getElementById("fileUploadBtn"),
        uploadPrintFile: document.getElementById("fileUploadPrintBtn"),
        syncFiles: document.getElementById("fileReSync"),
        back: document.getElementById("fileBackBtn"),
        createFolderBtn: document.getElementById("createFolderBtn")
      }
    };

    return printerManager;
  }

  static async applyState(printer, elements) {
    //Garbage collection for terminal
    if (typeof printer.fileList !== "undefined") {
      elements.fileManager.fileFolderCount.innerHTML = `<i class="fas fa-file"></i> ${printer.fileList.filecount} <i class="fas fa-folder"></i> ${printer.fileList.folderCount}`;
    }

    if (typeof printer.storage !== "undefined") {
      elements.fileManager.printerStorage.innerHTML = `<i class="fas fa-hdd"></i> ${Calc.bytes(
        printer.storage.free
      )} / ${Calc.bytes(printer.storage.total)}`;
    } else {
      elements.fileManager.printerStorage.innerHTML = `<i class="fas fa-hdd"></i> ${Calc.bytes(
        0
      )} / ${Calc.bytes(0)}`;
    }

    elements.mainPage.status.innerHTML = printer.printerState.state;
    elements.mainPage.status.className = `btn btn-${printer.printerState.colour.name} mb-2`;
  }
}
