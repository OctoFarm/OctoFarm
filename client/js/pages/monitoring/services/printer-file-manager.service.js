import Calc from "../../../utils/calc.js";
import UI from "../../../utils/ui.js";
import FileManagerService from "../../../services/file-manager.service.js";
import FileManagerSortingService from "../../../services/file-manager-sorting.service.js";
import { setupClientSwitchDropDown } from "../../../services/modal-printer-select.service";
import { allowedFileTypes } from "../../../constants/file-types.constants";
import "../../../utils/cleanup-modals.util";
import {
  setupConnectButton,
  setupConnectButtonListeners,
  updateConnectButtonState,
} from "./connect-button.service";
import { closePrinterManagerModalIfOffline } from "../../../utils/octofarm.utils";
import { ClientErrors } from "../../../exceptions/octofarm-client.exceptions";
import { ApplicationError } from "../../../exceptions/application-error.handler";
import {setupModalSwitcher} from "./modal-switcher.service";

let currentIndex = 0;
let currentPrinter = null;

export default class PrinterFileManagerService {
  static async init(index, printers, printerControlList) {
    //clear camera
    if (index !== "") {
      currentIndex = index;
      const id = _.findIndex(printers, function (o) {
        return o._id === index;
      });
      currentPrinter = printers[id];

      const changeFunction = function (value) {
        PrinterFileManagerService.init(value, printers, printerControlList);
      };

      setupClientSwitchDropDown(
        currentPrinter._id,
        printerControlList,
        changeFunction,
        true
      );

      await PrinterFileManagerService.loadPrinter(currentPrinter);
      const elements = PrinterFileManagerService.grabPage();
      await PrinterFileManagerService.applyState(currentPrinter, elements);
      PrinterFileManagerService.applyListeners(elements, printers);
    } else {
      const id = _.findIndex(printers, function (o) {
        return o._id === currentIndex;
      });
      currentPrinter = printers[id];
      const elements = PrinterFileManagerService.grabPage();
      await PrinterFileManagerService.applyState(currentPrinter, elements);
      document.getElementById("printerManagerModal").style.overflow = "auto";
    }
    return true;
  }

  static async loadPrinter(printer) {
    //Load Connection Panel
    try {
      setupConnectButton(printer);
      //Load tools
      document.getElementById("printerControls").innerHTML = `
          <div class="row bg-secondary rounded-top">
                <div class="col-12">
                     <h5 class="float-left  mb-0">
                     <span id="currentPrinter" class="d-none">${printer.printerName}</span>
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
                  <div id="fileProgress-${printer._id}" class="progress-bar progress-bar-striped bg-warning" role="progressbar" style="width: 0" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
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
                  <input id="fileUploadBtn" multiple accept="${allowedFileTypes}" type="file" class="btn btn-success float-left bg-colour-1" id="uploadFileBtn">
                  <label class="btn btn-info float-left mr-1 mb-0 bg-colour-2" for="fileUploadPrintBtn"><i class="fas fa-file-import"></i> Upload and Print</label>
                  <input id="fileUploadPrintBtn" accept="${allowedFileTypes}" type="file" class="btn btn-success float-left bg-colour-2" id="uploadFileBtn">
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
      setupModalSwitcher("file", printer);
      await FileManagerSortingService.loadSort(printer._id);
    } catch (e) {
      UI.createAlert(
        "error",
        "Something has gone wrong with loading the File Manager... Hard Failure, please submit as a bug on github: " +
          e,
        0,
        "clicked"
      );
      console.error(e);
      const errorObject = ClientErrors.SILENT_ERROR;
      errorObject.message = `Printer File Manager - ${e}`;
      throw new ApplicationError(errorObject);
    }
  }

  static applyListeners(elements) {
    const rangeSliders = document.querySelectorAll("input.octoRange");
    rangeSliders.forEach((slider) => {
      slider.addEventListener("input", (e) => {
        e.target.previousSibling.previousSibling.lastChild.innerHTML = `${e.target.value}%`;
      });
    });

    setupConnectButtonListeners(
      currentPrinter,
      elements.connectPage.connectButton
    );

    elements.fileManager.uploadFiles.addEventListener(
      "change",
      async function () {
        UI.createAlert(
          "warning",
          "Your files for Printer: " +
            currentPrinter.printerName +
            " has begun. Please do not navigate away from this page.",
          3000,
          "Clicked"
        );
        await FileManagerService.handleFiles(this?.files, currentPrinter);
      }
    );
    elements.fileManager.createFolderBtn.addEventListener("click", async () => {
      await FileManagerService.createFolder(currentPrinter);
    });
    elements.fileManager.fileSearch.addEventListener("keyup", async () => {
      await FileManagerService.search(currentPrinter._id);
    });
    elements.fileManager.uploadPrintFile.addEventListener(
      "change",
      async function () {
        await FileManagerService.handleFiles(
          this?.files,
          currentPrinter,
          "print"
        );
      }
    );
    elements.fileManager.back.addEventListener("click", async () => {
      await FileManagerService.openFolder(undefined, undefined, currentPrinter);
    });
    elements.fileManager.syncFiles.addEventListener("click", async (e) => {
      await FileManagerService.reSyncFiles(e, currentPrinter);
    });
  }

  static grabPage() {
    return {
      mainPage: {
        title: document.getElementById("printerSelection"),
        status: document.getElementById("pmStatus"),
      },
      connectPage: {
        printerPort: document.getElementById("printerPortDrop"),
        printerBaud: document.getElementById("printerBaudDrop"),
        printerProfile: document.getElementById("printerProfileDrop"),
        printerConnect: document.getElementById("printerConnect"),
        connectButton: document.getElementById("pmConnect"),
        portDropDown: document.getElementById("pmSerialPort"),
        baudDropDown: document.getElementById("pmBaudrate"),
        profileDropDown: document.getElementById("pmProfile"),
      },
      printerControls: {
        filamentDrop: document.getElementById("filamentManagerFolderSelect"),
        fileUpload: document.getElementById("printerManagerUploadBtn"),
      },
      fileManager: {
        printerStorage: document.getElementById("printerStorage"),
        fileFolderCount: document.getElementById("printerFileCount"),
        fileSearch: document.getElementById("searchFiles"),
        uploadFiles: document.getElementById("fileUploadBtn"),
        uploadPrintFile: document.getElementById("fileUploadPrintBtn"),
        syncFiles: document.getElementById("fileReSync"),
        back: document.getElementById("fileBackBtn"),
        createFolderBtn: document.getElementById("createFolderBtn"),
      },
    };
  }

  static async applyState(printer, elements) {
    closePrinterManagerModalIfOffline(printer);
    //Garbage collection for terminal
    if (typeof printer.fileList !== "undefined") {
      elements.fileManager.fileFolderCount.innerHTML = `<i class="fas fa-file"></i> ${printer.fileList.filecount} <i class="fas fa-folder"></i> ${printer.fileList.folderCount}`;
    }

    if (typeof printer.storage !== "undefined") {
      elements.fileManager.printerStorage.innerHTML = `${Calc.bytes(
        printer.storage.free
      )} / ${Calc.bytes(printer.storage.total)}`;
    } else {
      elements.fileManager.printerStorage.innerHTML = `${Calc.bytes(
        0
      )} / ${Calc.bytes(0)}`;
    }

    updateConnectButtonState(
      printer,
      elements.mainPage.status,
      elements.connectPage.connectButton,
      elements.connectPage.printerPort,
      elements.connectPage.printerBaud,
      elements.connectPage.printerProfile
    );
  }
}
