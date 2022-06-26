import OctoPrintClient from "./octoprint/octoprint-client.service";
import Queue from "./file-manager-queue.service.js";
import Calc from "../utils/calc.js";
import UI from "../utils/ui.js";
import FileManagerSortingService from "./file-manager-sorting.service.js";
import PrinterSelectionService from "../pages/printer-manager/services/printer-selection.service.js";
import OctoFarmClient from "./octofarm-client.service";
import {
  generateTableRows,
  showBulkActionsModal,
  updateBulkActionsProgress,
  updateTableRow,
} from "../pages/printer-manager/functions/bulk-actions-progress.functions";
import { allowedFileTypes } from "../constants/file-types.constants";
import { getFileRowID } from "../pages/file-manager/upload-queue.templates";
import {
  getFileTemplate,
  getFolderTemplate,
  noFilesToShow,
} from "../pages/file-manager/file.template";
import {
  generatePathList,
  getFileListElement,
} from "../pages/file-manager/file-manager.helpers";
import { ClientErrors } from "../exceptions/octofarm-client.exceptions";
import { ApplicationError } from "../exceptions/application-error.handler";

const fileUploads = new Queue();

const loadingBarWarning = "progress-bar progress-bar-striped bg-warning";
const loadingBarSuccess = "progress-bar progress-bar-striped bg-success";
const buttonSuccess = "btn btn-success mb-0";
const buttonFailed = "btn btn-danger mb-0";
const defaultReSync = "<i class=\"fas fa-sync\"></i> Re-Sync";
const defaultDeleteAll = "<i class=\"fa-solid fa-trash-can\"></i> Delete All";
const isValid = "is-valid";
const isInValid = "is-invalid";

const QUEUE_PAUSED = false;

const flashReturn = (element) => {
  element.className = buttonSuccess;
  element.innerHTML = defaultReSync;
};

const handleUploadFromQueue = async (current, index) => {
  if (!current.active) {
    fileUploads.activate(index);
    const currentDate = new Date();
    let file = await current.upload(current);

    file = JSON.parse(file);
    file.index = current.index;
    file.uploadDate = currentDate.getTime() / 1000;
    fileUploads.remove();
    await OctoFarmClient.post("printers/newFiles", file);

    const body = {
      action: "File Upload",
      opts: {
        print: !!current?.print
      },
      fullPath: file.files.local.path,
      status: 200,
    };
    await OctoFarmClient.updateUserActionsLog(current?.printerInfo?._id, body);

    if(!!current?.print){
      await OctoFarmClient.updateActiveControlUser(current?.printerInfo?._id);
    }

    const currentFolder = document.getElementById("currentFolder");
    const fileFolder = "local/" + file.files.local.path;
    const currentPrinter = document.getElementById("currentPrinter");
    const filePrinter = current.printerInfo.printerName;
    if (!!currentPrinter && !!fileFolder && !!currentFolder) {
      if (
        fileFolder.includes(currentFolder.innerHTML) &&
        currentPrinter.innerHTML.includes(filePrinter)
      ) {
        await FileManagerSortingService.loadSort(current.index);
      }
    }

    const uploadsRemaining = document.getElementById("uploadsRemaining");
    if (!!uploadsRemaining) {
      uploadsRemaining.innerHTML = `${fileUploads.size()}`;
    }
    const fileCounts = document.getElementById(`fileCounts-${current.index}`);
    if (!!fileCounts && fileCounts.innerHTML === "1") {
      fileCounts.innerHTML = "0";
    }
    if (!!uploadsRemaining && uploadsRemaining.innerHTML === "1") {
      uploadsRemaining.innerHTML = "0";
    }
  }
};

setInterval(async () => {
  const uploadQueueElement = document.getElementById("queueUploadLimitInput");
  let uploadQueueSize = 1;
  if (!!uploadQueueElement && !isNaN(parseInt(uploadQueueElement.value))) {
    uploadQueueSize = parseInt(uploadQueueElement.value);
  }

  //Auto refresh of files
  // If there are files in the queue, plow through until uploaded... currently single file at a time.
  if (fileUploads.size() > 0 && !QUEUE_PAUSED) {
    for (let ind = 1; ind <= uploadQueueSize; ind++) {
      const queueItem = fileUploads.n(ind - 1);
      if (!!queueItem) {
        await handleUploadFromQueue(queueItem, ind - 1);
      }
    }
  }
  const allUploads = fileUploads.all();
  allUploads.forEach((uploads) => {
    const currentCount = allUploads.reduce(function (n, up) {
      return n + (up.index === uploads.index);
    }, 0);
    const fileCounts = document.getElementById(`fileCounts-${uploads.index}`);

    if (fileCounts) {
      fileCounts.innerHTML = ` ${currentCount}`;
    }
  });
}, 1000);

export default class FileManagerService {
  static async handleFiles(Afiles, printerInfo, print) {
    Afiles = [...Afiles];

    for (const file of Afiles) {
      const newObject = {};
      const spinner = document.getElementById("fileUploadCountSpinner");
      if (spinner) {
        if (!spinner.classList.contains("fa-spin")) {
          spinner.className = "fas fa-spinner fa-spin";
        }
      }
      const uploadsSpinnerIcon = document.getElementById("uploadsSpinnerIcon");
      if (!!uploadsSpinnerIcon) {
        uploadsSpinnerIcon.innerHTML = "<i class='fas fa-spinner fa-spin'></i>";
      }
      newObject.file = file;
      if (typeof print !== "undefined") {
        newObject.print = true;
      }
      newObject.index = printerInfo._id;
      newObject.printerInfo = printerInfo;
      const currentFolder = document.getElementById("currentFolder");
      if (currentFolder) {
        newObject.currentFolder = currentFolder.innerHTML;
      } else {
        newObject.currentFolder = "local/";
      }
      newObject.upload = FileManagerService.fileUpload;
      fileUploads.add(newObject);
    }
  }

  static createUpload(index, fileName, loaded, total, printerName) {
    const uploadSize = fileUploads.size();
    const uploadsSpinnerIcon = document.getElementById("uploadsSpinnerIcon");
    const uploadsRemaining = document.getElementById("uploadsRemaining");
    if (uploadsRemaining) {
      uploadsRemaining.innerHTML = `${uploadSize}`;
    }

    if (!!uploadsSpinnerIcon) {
      uploadsSpinnerIcon.innerHTML = "<i class='fas fa-spinner fa-spin'></i>";
      const percentLoad = (loaded / total) * 100;
      if (isNaN(percentLoad)) {
        uploadsSpinnerIcon.innerHTML = "<i class='fas fa-spinner'></i>";
      }
    }
    const upCount = document.getElementById("fileUploadCount");
    if (upCount) {
      upCount.innerHTML = `File Queue: ${uploadSize}`;
      if (uploadSize < 1) {
        upCount.innerHTML = "File Queue: 0";
        const spinner = document.getElementById("fileUploadCountSpinner");
        if (spinner.classList.contains("fa-spin")) {
          spinner.className = "fas fa-spinner";
        }
      }
    }
    const uploadCurrentProgress = document.getElementById(
      "uploadCurrentProgress"
    );
    if (uploadCurrentProgress) {
      uploadCurrentProgress.className = loadingBarWarning;
      let percentLoad = (loaded / total) * 100;
      if (isNaN(percentLoad)) {
        percentLoad = 0;
      }
      uploadCurrentProgress.innerHTML = `${Math.floor(percentLoad)}%`;
      uploadCurrentProgress.style.width = `${percentLoad}%`;
      if (percentLoad === 100) {
        uploadCurrentProgress.className = loadingBarSuccess;
      }
    }
    const progress = document.getElementById(`fileProgress-${index}`);
    if (progress) {
      progress.className = loadingBarWarning;
      let percentLoad = (loaded / total) * 100;
      if (isNaN(percentLoad)) {
        percentLoad = 0;
      }
      progress.innerHTML = `${Math.floor(percentLoad)}%`;
      progress.style.width = `${percentLoad}%`;
      if (percentLoad === 100) {
        progress.className = loadingBarSuccess;
      }
    }
    const theFile = {
      printer: printerName,
      name: fileName,
    };
    const queueProgressBar = document.getElementById(
      `queueProgressBar-${getFileRowID(theFile)}`
    );
    if (!!queueProgressBar) {
      queueProgressBar.className = loadingBarWarning;
      let percentLoad = (loaded / total) * 100;
      if (isNaN(percentLoad)) {
        percentLoad = 0;
      }
      queueProgressBar.innerHTML = `${Math.floor(percentLoad)}%`;
      queueProgressBar.style.width = `${percentLoad}%`;
      if (percentLoad === 100) {
        queueProgressBar.className = loadingBarSuccess;
      }
    }

    const viewProgressBarWrapper = document.getElementById(
      "filesViewProgressWrapper-" + index
    );
    if (viewProgressBarWrapper) {
      if (viewProgressBarWrapper.classList.contains("d-none")) {
        viewProgressBarWrapper.classList.remove("d-none");
      }
      const viewProgressBar = document.getElementById(
        "filesViewProgressBar-" + index
      );
      viewProgressBar.className = loadingBarWarning;
      let percentLoad = (loaded / total) * 100;
      if (isNaN(percentLoad)) {
        percentLoad = 0;
      }
      viewProgressBar.innerHTML = `${Math.floor(percentLoad)}%`;
      viewProgressBar.style.width = `${percentLoad}%`;
      if (percentLoad === 100) {
        if (!viewProgressBarWrapper.classList.contains("d-none")) {
          viewProgressBarWrapper.classList.add("d-none");
        }
      }
    }
  }

  static fileUpload(file) {
    return new Promise(function (resolve) {
      FileManagerService.removeNoFiles();
      // Grab folder location
      const { currentFolder } = file;
      // Grab Client Info

      const { printerInfo } = file;

      // XHR doesn't like posting without it been a form, can't use offical octoprint api way...
      // Create form data
      const formData = new FormData();
      let path = "";
      if (currentFolder.includes("local/")) {
        path = currentFolder.replace("local/", "");
      }
      formData.append("file", file.file);
      formData.append("path", path);
      if (file.print) {
        formData.append("print", "true");
      }
      const url = `/octoprint/${printerInfo._id}/api/files/local`;
      const xhr = new XMLHttpRequest();
      file = file.file;

      const uploadsPrinterName = document.getElementById("uploadsPrinterName");
      const uploadsFileName = document.getElementById("uploadsFileName");
      if (uploadsPrinterName) {
        uploadsPrinterName.innerHTML = printerInfo.printerName;
      }
      if (uploadsFileName) {
        uploadsFileName.innerHTML = file.name;
      }

      xhr.open("POST", url);
      xhr.upload.onprogress = function (e) {
        if (e.lengthComputable) {
          FileManagerService.createUpload(
            printerInfo._id,
            file.name,
            e.loaded,
            e.total,
            printerInfo.printerName
          );
        }
      };
      xhr.setRequestHeader("X-Api-Key", printerInfo.apikey);
      xhr.onloadstart = function (e) {
        FileManagerService.createUpload(
          printerInfo._id,
          file.name,
          e.loaded,
          e.total,
          printerInfo.printerName
        );
      };
      xhr.onloadend = async function (e) {
        FileManagerService.createUpload(
          printerInfo._id,
          file.name,
          e.loaded,
          e.total,
          printerInfo.printerName
        );
        if (this.status >= 200 && this.status < 300) {
          resolve(xhr.response);
          UI.createAlert(
            "success",
            `${file.name} has finished uploading to Printer: ${printerInfo.printerName}`,
            3000,
            "clicked"
          );
          const uploadsSpinnerIcon =
            document.getElementById("uploadsSpinnerIcon");
          if (!!uploadsSpinnerIcon) {
            uploadsSpinnerIcon.innerHTML = "<i class='fas fa-spinner'></i>";
          }
        } else {
          fileUploads.remove();
          resolve(xhr.response);
          UI.createAlert(
            "error",
            `Sorry but ${file.name} could not be uploaded... is CORS enabled and OctoPrint online?`,
            3000,
            "clicked"
          );
        }
      };
      xhr.onerror = function () {
        resolve(xhr.response);
        UI.createAlert(
          "error",
          `Sorry but ${file.name} could not be uploaded... is CORS enabled and OctoPrint online?`,
          3000,
          ""
        );
        fileUploads.remove();
      };

      const fileTypes = allowedFileTypes.split(",");

      if (fileTypes.some((type) => file.name.includes(type))) {
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

  static async actionBtnGate(printer, btn) {
    const data = btn.split("*");
    const action = data[1];
    const filePath = data[2];
    if (action === "fileActionStart") {
      await FileActions.startPrint(printer, filePath);
    } else if (action === "fileActionSelect") {
      await FileActions.selectFile(printer, filePath);
    } else if (action === "fileActionUpdate") {
      await FileActions.updateFile(printer, btn, filePath);
    } else if (action === "fileActionMove") {
      await FileActions.moveFile(printer, filePath);
    } else if (action === "fileActionDelete") {
      await FileActions.deleteFile(printer, filePath);
    } else if (action === "folderActionMove") {
      await FileActions.moveFolder(printer, filePath);
    } else if (action === "folderActionDelete") {
      await FileActions.deleteFolder(printer, filePath);
    }
  }

  static async reSyncFiles(e, printer) {
    e.target.innerHTML = "<i class='fas fa-sync fa-spin'></i> Re-Syncing...";
    e.target.disabled = true;
    const how = await OctoFarmClient.post("printers/resyncFile", {
      id: printer._id,
    });

    if (how) {
      e.target.className = buttonSuccess;
    } else {
      e.target.className = buttonFailed;
    }
    e.target.innerHTML = defaultReSync;
    setTimeout(() => {
      flashReturn(e.target);
      e.target.disabled = false;
    }, 1000);
    e.target.disabled = false;
    await FileManagerSortingService.loadSort(printer._id);
  }

  static async deleteAllFiles(e, printer) {
    bootbox.confirm({
      title: "Delete everything!",
      message:
        "This will delete all files and folders on your OctoPrint instance... Are you sure?",
      callback: async function (result) {
        if (!!result) {
          e.target.innerHTML =
            "<i class='fas fa-sync fa-spin'></i> Deleting...";
          e.target.disabled = true;
          const deletedList = await OctoFarmClient.post("printers/nukeFiles", {
            id: printer._id,
          });

          const prettyFolderList = [];
          const prettyFilesList = [];
          deletedList.deletedFiles.forEach((file) => {
            prettyFilesList.push(`${file}<br>`);
          });
          deletedList.deletedFolders.forEach((folder) => {
            prettyFolderList.push(`${folder}<br>`);
          });

          setTimeout(async () => {
            e.target.className = "btn btn-outline-danger mb-0 float-right";
            e.target.innerHTML = defaultDeleteAll;
            e.target.disabled = false;
            if (deletedList.deletedFiles.length > 0) {
              UI.createAlert(
                "success",
                "Successfully deleted files: <br>" + prettyFilesList,
                5000,
                "Clicked"
              );
            }
            if (deletedList.deletedFolders.length > 0) {
              UI.createAlert(
                "success",
                "Successfully deleted folders: <br>" + prettyFolderList,
                5000,
                "Clicked"
              );
            }
            await FileManagerSortingService.loadSort(printer._id);
          }, 1000);
        }
      },
    });
  }

  static async fileHouseKeeping(e, printer, days) {
    const houseCleanFiles = await OctoFarmClient.post(
      "printers/getHouseCleanList",
      {
        id: printer._id,
        days,
      }
    );
    const prettyList = [];

    let buttons;

    if (houseCleanFiles.length === 0) {
      prettyList.push(
        "<div class=\"alert alert-danger\" role=\"alert\">No Files to Clean...</div>"
      );
      buttons = {
        cancel: {
          label: "OK",
          className: "btn-secondary",
        },
        confirm: {
          label: "OK",
          className: "btn-secondary d-none",
        },
      };
    } else {
      for (const file of houseCleanFiles) {
        prettyList.push(
          `<div class="alert alert-danger" role="alert"><i class="fas fa-file-code fa-2x"></i> ${file}</div>`
        );
      }
      buttons = {
        confirm: {
          label: "Yes",
          className: "btn-success",
        },
        cancel: {
          label: "No",
          className: "btn-danger",
        },
      };
    }

    bootbox.confirm({
      title: "Please confirm you want to delete the following files!",
      message: prettyList,
      buttons: buttons,
      scrollable: true,
      callback: async function (result) {
        if (!!result) {
          e.target.innerHTML =
            "<i class='fas fa-sync fa-spin'></i> Cleaning...";
          const deletedList = await OctoFarmClient.post(
            "printers/houseCleanFiles",
            {
              id: printer._id,
              pathList: houseCleanFiles,
            }
          );
          const prettyDelete = [];

          for (const file of deletedList) {
            prettyDelete.push(`${file} <br>`);
          }

          UI.createAlert(
            "success",
            "Deleted the following files: <br>" + prettyDelete,
            5000,
            "clicked"
          );

          setTimeout(async () => {
            e.target.innerHTML =
              "<i class=\"fa-solid fa-broom\"></i> House Keeping";
            await FileManagerSortingService.loadSort(printer._id);
          }, 500);
        }
      },
    });
  }

  static async openFolder(folder, target, printer) {
    const fileBackButtonElement = document.getElementById("fileBackBtn");
    if (typeof target !== "undefined" && target.type === "button") {
      await FileManagerSortingService.loadSort(printer._id);
      return;
    }
    if (typeof folder !== "undefined") {
      folder = folder.replace("file-", "");

      document.getElementById("currentFolder").innerHTML = `local/${folder}`;
      fileBackButtonElement.disabled = false;
    } else {
      const currentFolder = document.getElementById("currentFolder").innerHTML;
      if (currentFolder !== "local") {
        const previousFolder = currentFolder.substring(
          0,
          currentFolder.lastIndexOf("/")
        );
        document.getElementById("currentFolder").innerHTML = previousFolder;
        fileBackButtonElement.disabled = previousFolder === "local";
      } else {
        fileBackButtonElement.disabled = true;
      }
    }
    await FileManagerSortingService.loadSort(printer._id);
  }

  static async refreshFiles(printer, spinnerIcon) {
    if (fileUploads.size() <= 1) {
      for (const file of printer.fileList.fileList) {
        let currentFolder = document.getElementById("currentFolder")?.innerHTML;
        if (!!currentFolder) {
          if (currentFolder.includes("local/")) {
            currentFolder = currentFolder.replace("local/", "");
          }
          if (file.path === currentFolder) {
            if (document.getElementById(`file-${file.fullPath}`)) {
              let toolInfo = "";
              if (file.toolUnits?.length) {
                file.toolUnits.forEach((unit, index) => {
                  toolInfo += `<i class="fas fa-weight"></i> ${unit} / <i class="fas fa-dollar-sign"></i> Cost: ${file.toolCosts[index]}<br>`;
                });
              }

              let thumbnail =
                "<i class=\"fas fa-file-code fa-2x text-center\"></i>";
              if (!!file.thumbnail) {
                thumbnail = `<img alt="Gcode Thumbnail" class="text-center" src='${printer.printerURL}/${file.thumbnail}' width="100%">`;
              }

              let fileDate = new Date(file.uploadDate * 1000);
              const dateString = fileDate.toDateString();
              const timeString = fileDate.toTimeString().substring(0, 8);
              fileDate = `${dateString} ${timeString}`;
              document.getElementById(
                "fileHistoryRate-" + file.fullPath
              ).innerHTML =
                spinnerIcon +
                "<i class=\"fas fa-thumbs-up\"></i> 0 / <i class=\"fas fa-thumbs-down\"></i> 0";
              document.getElementById(
                `fileDate-${file.fullPath}`
              ).innerHTML = ` ${fileDate}`;
              document.getElementById(
                `fileSize-${file.fullPath}`
              ).innerHTML = ` ${Calc.bytes(file.fileSize)}`;
              document.getElementById(
                `fileTool-${file.fullPath}`
              ).innerHTML = ` ${toolInfo}`;
              document.getElementById(
                `fileTime-${file.fullPath}`
              ).innerHTML = ` ${Calc.generateTime(file.expectedPrintTime)}`;
              document.getElementById(`fileCost-${file.fullPath}`).innerHTML =
                " " + `Print Cost: ${file.printCost?.toFixed(2)}`;
              document.getElementById(
                `fileThumbnail-${file.fullPath}`
              ).innerHTML = ` ${thumbnail}`;
              document.getElementById(
                `fileDateClean-${file.fullPath}`
              ).innerHTML = file.uploadDate;
            }
          }
        }
      }
    }
  }

  static removeNoFiles() {
    const noFilesElement = document.getElementById("noFilesToBeShown");
    if (noFilesElement) {
      noFilesElement.remove();
    }
  }

  static updatePrinterMetrics(id, fileList, folderList) {
    let currentFolder = document.getElementById("currentFolder").innerHTML;
    if (currentFolder.includes("local/")) {
      currentFolder = currentFolder.replace("local/", "");
    }

    const printerFileCount = document.getElementById("printerFileCount");
    if (printerFileCount) {
      printerFileCount.innerHTML = `<i class="fas fa-file"></i> ${fileList.length} <i class="fas fa-folder"></i> ${folderList.length}`;
    }
    const fileCardCount = document.getElementById("fileManagerfileCount-" + id);
    if (fileCardCount) {
      fileCardCount.innerHTML = `Files: ${fileList.length}`;
    }

    const fileCardFolderCount = document.getElementById(
      "fileManagerFolderCount-" + id
    );
    if (fileCardFolderCount) {
      fileCardFolderCount.innerHTML = `Folders: ${folderList.length}`;
    }

    return currentFolder;
  }

  static updatePrinterFilesList(printer, recursive) {
    const { fileList } = printer;
    const fileElem = getFileListElement(printer._id);
    if (fileElem) {
      fileElem.innerHTML = "";
    }

    // Update page elements
    const currentFolder = FileManagerService.updatePrinterMetrics(
      printer._id,
      fileList.fileList,
      fileList.folderList
    );
    //Draw folders,
    if (!recursive) {
      FileManagerService.drawFolders(
        printer._id,
        fileList.folderList,
        currentFolder
      );
    }

    // Draw Files,
    FileManagerService.drawFiles(
      printer._id,
      fileList.fileList,
      printer.printerURL,
      currentFolder,
      recursive
    );

    // Update Listeners
    FileManagerService.updateListeners(printer);
  }

  static drawFolders(id, folderList, currentFolder) {
    // Draw sub - folders present in current folder
    const fileElem = getFileListElement(id);
    if (folderList.length > 0) {
      folderList.forEach((folder) => {
        if (folder.path === currentFolder) {
          fileElem.insertAdjacentHTML("beforeend", getFolderTemplate(folder));
        }
      });
    }
  }

  static drawFiles(id, fileList, printerURL, currentFolder, recursive) {
    const fileElem = getFileListElement(id);
    if (fileElem) {
      // Filter out files out of current folder scope
      const currentFileList = fileList.filter((f) => {
        return typeof recursive !== "undefined" || f.path === currentFolder;
      });
      // Show empty or filled list
      if (currentFileList.length > 0) {
        for(const file of currentFileList){
          fileElem.insertAdjacentHTML(
              "beforeend",
              getFileTemplate(file, printerURL, id)
          );
        }
      } else {
        fileElem.insertAdjacentHTML("beforeend", noFilesToShow());
      }
    }
  }

  static async search(id) {
    await FileActions.search(id);
  }

  static async createFolder(printer) {
    await FileActions.createFolder(printer);
  }

  static updateListeners(printer) {

    const folders = document.querySelectorAll(".folderAction");
    folders.forEach((folder) => {
      folder.addEventListener("click", async (e) => {
        const updatedPrinter = await OctoFarmClient.getPrinter(printer._id);
        await FileManagerService.openFolder(
          folder?.id,
          e.target,
          updatedPrinter
        );
      });
    });
    const fileActionBtns = document.querySelectorAll("[id*='*fileAction']");
    fileActionBtns.forEach((btn) => {
      // Gate Keeper listener for file action buttons
      btn.addEventListener("click", async () => {
        await FileManagerService.addCardListeners(printer, btn);
      });
    });
    const folderActionBtns = document.querySelectorAll("[id*='*folderAction']");
    folderActionBtns.forEach((btn) => {
      // Gate Keeper listener for file action buttons
      btn.addEventListener("click", async () => {
        await FileManagerService.addCardListeners(printer, btn);
      });
    });
  }

  static async addCardListeners(printer, btn) {
    const updatedPrinter = await OctoFarmClient.getPrinter(printer._id);
    await FileManagerService.actionBtnGate(updatedPrinter, btn.id);
  }

  static async multiUpload() {
    let selectedPrinters = null;
    let selectedFolder = "";
    let newFolder = "";
    let printAfterUpload = true;
    let selectedFile = null;
    await PrinterSelectionService.create(
      document.getElementById("multiPrinterSection")
    );

    async function chooseOrCreateFolder() {
      // Setup view

      document.getElementById("multiPrinterBtn").disabled = true;
      document.getElementById("multiFolder").disabled = false;
      document.getElementById("multiPrinterSection").classList.add("hidden");
      document.getElementById("multiFolderSection").classList.remove("hidden");

      document.getElementById("multiSelectedPrinters2").innerHTML = "";
      document.getElementById("multiFolder").disabled = false;
      document.getElementById("multiFile").disabled = true;
      document.getElementById("multiFolderSection").classList.remove("hidden");
      document.getElementById("multiFileSection").classList.add("hidden");


      const multiFolderInput = document.getElementById(
        "multi-UploadFolderSelect"
      );
      const multiNewFolderNew = document.getElementById(
        "multi-UploadNewFolderNew"
      );
      multiNewFolderNew.classList.remove(isInValid);
      multiNewFolderNew.classList.remove(isValid);
      multiFolderInput.classList.remove(isInValid);
      multiFolderInput.classList.remove(isValid);
      multiNewFolderNew.value = "";
      multiFolderInput.innerHTML = "";
      const uniqueFolderList = await OctoFarmClient.getOctoPrintUniqueFolders();
      uniqueFolderList.forEach((path) => {
        multiFolderInput.insertAdjacentHTML(
          "beforeend",
          `
          <option value=${path.replace(/ /g, "%")}>${path}</option>
        `
        );
      });

      document.getElementById("multiUploadFooter").innerHTML =
        "<button id=\"multiUpSubmitBtn\" type=\"button\" class=\"btn btn-success float-right\">Next</button>";
      document
        .getElementById("multiUpSubmitBtn")
        .addEventListener("click", async () => {
          let locationInput = multiFolderInput.value;
          newFolder = multiNewFolderNew.value;

          const printers = await OctoFarmClient.listPrinters();
          selectedPrinters.forEach((printer, index) => {
            if (printer) {
              const i = _.findIndex(printers, function (o) {
                return o._id === printer.value.toString();
              });
              const id = printers[i]._id;
              const name = printers[i].printerName;

              document
                .getElementById("multiSelectedPrinters2")
                .insertAdjacentHTML(
                  "beforeend",
                  `
            <div class="card col-2 px-1 py-1">
             <div class="card-header px-1 py-1">
               <small>${name}</small> 
              </div>
              <div class="card-body px-1 py-1" id="folderCheckBody-${id}">
                <small><i class="fas fa-spinner fa-pulse"></i> Checking Folder Exists...</small>
              </div>
            </div>
            `
                );
              selectedPrinters[index] = {
                value: printers[i]._id,
                printerInfo: printers[i],
              };
            }
          });
          if (newFolder !== "") {
            if (newFolder[0] === "/") {
             newFolder = newFolder.replace("/", "");
            }
          }
          if (locationInput[0] === "/") {
            locationInput = locationInput.replace("/", "");
          }

          selectedFolder = `${locationInput}${newFolder}`.replace(/%/g, " ");

          if (selectedFolder[selectedFolder.length-1] === "/") {
            selectedFolder = selectedFolder.replace("/", "");
          }

          const testFolderPath = selectedFolder.replace(/ /g, "%")

          const regexValidation = /\/[a-zA-Z0-9_%\/-]*[^\/]$/;
          // validate the path
          if (newFolder !== "" && !regexValidation.exec("/" + testFolderPath)) {
            multiFolderInput.classList.add(isInValid);
            multiNewFolderNew.classList.add(isInValid);
          } else {
            multiNewFolderNew.classList.remove(isInValid);
            multiNewFolderNew.classList.add(isValid);
            multiFolderInput.classList.remove(isInValid);
            multiFolderInput.classList.add(isValid);
            await checkIfPathExistsOnOctoPrint();
            await selectFilesToupload();
          }
        });
    }

    async function checkIfPathExistsOnOctoPrint() {
      for (const printer of selectedPrinters) {
        const currentPrinter = printer.printerInfo;
        const folderExists = (id) => {
          document.getElementById(
              "folderCheckBody-" + id
          ).innerHTML =
              "<i class=\"fas fa-folder-plus text-success\"></i> Folder exists!";
          currentPrinter.folderExists = true;
        }
        const folderDoesntExist = (id) => {
            document.getElementById(
                "folderCheckBody-" + id
            ).innerHTML =
                "<i class=\"fas fa-folder-minus text-warning\"></i> Folder will be created!";
          currentPrinter.folderExists = false;
        }

        if(selectedFolder === ""){
          folderExists(currentPrinter._id);
          continue;
        }

        const doesFolderExist = await OctoPrintClient.checkFile(
          currentPrinter,
          selectedFolder
        );
        if (doesFolderExist === 200) {
          folderExists(currentPrinter._id);
        }else{
          folderDoesntExist(currentPrinter._id);
        }
      }
      document.getElementById("multiFileUploadBtn").disabled = false;
      document
        .getElementById("multiFileUploadBtnLabel")
        .classList.remove("disabled");
    }

    async function selectFilesToupload() {
      const multiSelectFolderElement = document.getElementById("multiSelectedFolder")
      if(selectedFolder === ""){
        multiSelectFolderElement.innerHTML = "local/"
      }else{
        multiSelectFolderElement.innerHTML = selectedFolder.replace(/%/g, " ");
      }

      document.getElementById("multiFolder").disabled = true;
      document.getElementById("multiFile").disabled = false;
      document.getElementById("multiFileSection").classList.remove("hidden");
      document.getElementById("multiFolderSection").classList.add("hidden");

      document.getElementById("multiUploadFooter").innerHTML =
        "<button id=\"multiUpSubmitBtn\" type=\"button\" class=\"btn btn-success float-right\" data-dismiss=\"modal\">Start!</button>";
      document
        .getElementById("multiUpSubmitBtn")
        .addEventListener("click", () => {
          initiateTheUpload();
        });

      document
        .getElementById("printOnLoadBtn")
        .addEventListener("click", (e) => {
          let state = e.target.checked;
          const fileBtn = document.getElementById("multiFileUploadBtn");
          const fileBtnLabel = document.getElementById(
            "multiFileUploadBtnLabel"
          );
          if (state) {
            fileBtn.removeAttribute("multiple");
            fileBtn.setAttribute("single", "");
            fileBtnLabel.innerHTML =
              "<i class=\"fas fa-file-import\"></i> Upload File";
            printAfterUpload = true;
          } else {
            fileBtn.setAttribute("multiple", "");
            fileBtn.removeAttribute("single");
            fileBtnLabel.innerHTML =
              "<i class=\"fas fa-file-import\"></i> Upload Files";
            printAfterUpload = false;
          }
        });
      document
        .getElementById("multiFileUploadBtn")
        .addEventListener("change", function () {
          grabFiles(this.files);
        });
    }

    async function initiateTheUpload() {
      showBulkActionsModal();
      updateBulkActionsProgress(0, selectedPrinters.length);
      const printerInfo = [];
      selectedPrinters.forEach((printer) => {
        printerInfo.push(printer.printerInfo);
      });
      generateTableRows(printerInfo);
      for (let p = 0; p < selectedPrinters.length; p++) {
        const currentPrinter = selectedPrinters[p].printerInfo;
        // Make sure the folder is created...
        if (!selectedPrinters[p].folderExists) {
          const folderSplit = selectedFolder.split("/");
          let octofarmPath;
          for (let path = 0; path < folderSplit.length; path++) {
            const formData = new FormData();
            if (path === 0) {
              //First folder goes to no path
              octofarmPath = "";
              formData.append("foldername", folderSplit[path]);
              formData.append("path", "");
            } else if(path === folderSplit.length) {
              octofarmPath += `/${folderSplit[path]}`;
              formData.append("foldername", folderSplit[path]);
              formData.append("path", octofarmPath);
            } else {
              //Subsequent folders go to previous folder path... should be created!
              octofarmPath += `/${folderSplit[path - 1]}`;
              formData.append("foldername", folderSplit[path]);
              formData.append("path", octofarmPath);
            }
            const response = await FileActions.multiUploadCreateFolders(
              currentPrinter,
              octofarmPath,
              formData,
              folderSplit[path]
            );
            updateTableRow(printerInfo[p]._id, response.status, response.message);
          }
        } else {
          const response = {
            status: "skipped",
            message: "Folder exists, skipped!",
          };
          updateTableRow(printerInfo[p]._id, response.status, response.message);
        }

        selectedFile.forEach((file) => {
          const newObject = {};
          newObject.file = file;
          newObject.index = currentPrinter._id;
          newObject.printerInfo = currentPrinter;
          newObject.upload = FileManagerService.fileUpload;
          newObject.currentFolder = "local/" + selectedFolder.replace(/%/g, " ");

          if (printAfterUpload) {
            newObject.print = true;
          }

          fileUploads.add(newObject);
          const response = {
            status: "success",
            message: "Your file has been added to the upload queue",
          };
          updateTableRow(printerInfo[p]._id, response.status, response.message);
          updateBulkActionsProgress(p, selectedPrinters.length);
        });
      }
      updateBulkActionsProgress(
        selectedPrinters.length,
        selectedPrinters.length
      );
    }

    function grabFiles(Afiles) {
      Afiles = [...Afiles];
      selectedFile = Afiles;
      const multiUpload = document.getElementById("multiFileSelectedNow");
      multiUpload.innerHTML = "";
      selectedFile.forEach((file) => {
        multiUpload.insertAdjacentHTML(
          "beforeend",
          `
           <div class="card col-2 px-1 py-1">
             <div class="card-header px-1 py-1">
               <small>${file.name}</small> 
              </div>
            </div>
        `
        );
      });
    }

    const files = document.getElementById("multiFileSelectedNow");
    files.innerHTML = "";
    document.getElementById("multiPrinterBtn").disabled = false;
    document.getElementById("multiFolder").disabled = true;
    document.getElementById("multiFile").disabled = true;
    document.getElementById("multiPrinterSection").classList.remove("hidden");
    document.getElementById("multiFolderSection").classList.add("hidden");
    document.getElementById("multiFileSection").classList.add("hidden");
    document.getElementById("multiUploadFooter").innerHTML =
      "<button id=\"multiUpSubmitBtn\" type=\"button\" class=\"btn btn-warning float-right\">Next</button>";
    document
      .getElementById("multiUpSubmitBtn")
      .addEventListener("click", () => {
        selectedPrinters = PrinterSelectionService.getSelected();
        if (selectedPrinters.length < 2) {
          UI.createAlert(
            "error",
            `Please select MORE than ${selectedPrinters.length} printer(s)!`,
            2000,
            "clicked"
          );
          return;
        }
        chooseOrCreateFolder();
      });
  }
}

export class FileActions {
  static async search(id) {
    const printer = await OctoFarmClient.getPrinter(id);

    const fileList = document.getElementById(`fileList-${id}`);
    let input = document.getElementById("searchFiles").value.toUpperCase();
    input = input.replace(/ /g, "_");
    if (input === "") {
      // No search term so reset view
      document.getElementById("currentFolder").value = "local/";
      await FileManagerSortingService.loadSort(printer._id);
    } else {
      document.getElementById("currentFolder").value = "local/";
      await FileManagerSortingService.loadSort(printer._id, "recursive");
    }
    if (fileList) {
      const buttons = fileList.querySelectorAll("*[id^=\"file-\"]");

      for (const button of buttons) {
        const file = button.id.replace("file-", "");
        if (file.toUpperCase().indexOf(input) > -1) {
          button.style.display = "";
        } else {
          button.style.display = "none";
        }
      }
    }
  }

  static async createFolder(printer) {
    let currentFolder = document.getElementById("currentFolder").innerHTML;
    const formData = new FormData();

    if (currentFolder === "local") {
      currentFolder = "";
    } else if (currentFolder.includes("local/")) {
      currentFolder = currentFolder.replace("local/", "");
    }

    bootbox.prompt(
      "What would you like to name your folder?",
      async function (result) {
        if (result) {
          formData.append("foldername", result);
          formData.append("path", `${currentFolder}/`);
          const post = await OctoPrintClient.folder(printer, "local", formData);
          const { status } = post;
          if (status === 201 || status === 200) {
            const opts = {
              i: printer._id,
              foldername: result,
              path: currentFolder
            };
            await OctoFarmClient.post("printers/newFolder", opts);
            await FileManagerSortingService.loadSort(printer._id);
            UI.createAlert(
              "success",
              "Successfully created your new folder...",
              3000,
              "clicked"
            );
          } else {
            UI.createAlert(
              "error",
              "Sorry your folder couldn't be saved...",
              3000,
              "clicked"
            );
          }
        }
      }
    );
  }
  static async multiUploadCreateFolders(printer, octofarmPath, formData, currentPath) {

      const { status } = await OctoPrintClient.folder(
        printer,
        "local",
        formData
      );

      if (status === 201) {
        // Add status folder creation success and update OctoFarm with new folder...
        const opts = {
          i: printer._id,
          foldername: currentPath,
          path: octofarmPath,
        };

        await OctoFarmClient.post("printers/newFolder", opts);
        return {
          status: "success",
          message: `${currentPath}: Successfully created!`,
        };
      } else {
        // Add status folder creation great failure
        return {
          status: "error",
          message: `${currentPath}: Failed to create!!`,
        };
      }
  }

  // Needs updating when filament is brought in.
  static grabUsage(file) {
    if (typeof file.length === "undefined") {
      if (file.length === null || file.length.length === 0) {
        return "No Length";
      }
      return "No Length";
    }
    const usageArray = {
      totalLength: [],
      totalGrams: [],
      usage: [],
    };
    file.length.forEach((length) => {
      const radius = 1.75 / 2;
      const volume = (length / 1000) * Math.PI * radius * radius;
      const usage = volume * 1.24;
      usageArray.totalLength.push(length / 1000);
      usageArray.totalGrams.push(usage);
      usageArray.usage.push(
        `${(length / 1000).toFixed(2)}m / ${usage.toFixed(2)}g`
      );
    });
    usageArray.totalLength = usageArray.totalLength.reduce((a, b) => a + b, 0);
    usageArray.totalGrams = usageArray.totalGrams.reduce((a, b) => a + b, 0);
    return usageArray;
  }

  static async startPrint(printer, filePath) {
    const opts = {
      command: "start",
    };
    await OctoPrintClient.file(printer, filePath, "load", false);
    const ret = await OctoPrintClient.jobAction(printer, opts);
    if (!!ret?.status) {
      if (ret?.status === 200 || ret?.status === 201 || ret?.status === 204) {
        UI.createAlert(
          "success",
          `${printer.printerName}: Successfully started printing ${filePath}`,
          3000,
          "Clicked"
        );
      } else if (ret?.status === 409) {
        UI.createAlert(
          "warning",
          `${printer.printerName}: Could not start file... ${filePath} OctoPrint reported a conflict!`,
          3000,
          "Clicked"
        );
      } else {
        UI.createAlert(
          "error",
          `${printer.printerName}: Error occured starting: ${filePath} is your printer contactable?`,
          3000,
          "Clicked"
        );
      }
    }
  }

  static async selectFile(printer, filePath) {
    const { status } = await OctoPrintClient.file(printer, filePath, "load");
    if (status === 404) {
      UI.createAlert(
        "error",
        "We could not find the location, does it exist?",
        3000,
        "clicked"
      );
    } else if (status === 409) {
      UI.createAlert(
        "warning",
        "There was a conflict, file is in use...",
        3000,
        "clicked"
      );
    } else {
      UI.createAlert(
        "success",
        "Successfully selected your file...",
        3000,
        "clicked"
      );
    }
  }

  static async updateFile(printer, btn, fullPath) {
    const refreshBtn = document.getElementById(btn);
    refreshBtn.innerHTML = "<i class=\"fas fa-sync fa-spin\"></i> Syncing...";
    const how = await OctoFarmClient.post("printers/resyncFile", {
      id: printer._id,
      fullPath,
    });
    if (how) {
      refreshBtn.className = buttonSuccess;
      const fileElem = getFileListElement(printer._id);
      fileElem.innerHTML = "";
      await FileManagerSortingService.loadSort(printer._id);
    } else {
      refreshBtn.className = buttonFailed;
    }
    refreshBtn.innerHTML = defaultReSync;
    setTimeout(() => {
      flashReturn(refreshBtn);
    }, 500);
  }

  static moveFile(printer, fullPath) {
    const inputOptions = [];
    const loc = {
      text: "local",
      value: "/",
    };
    inputOptions.push(loc);
    printer.fileList.folderList.forEach((folder) => {
      const option = {
        text: folder.name,
        value: folder.name,
      };
      inputOptions.push(option);
    });
    bootbox.prompt({
      title: "Where would you like to move the file?",
      inputType: "select",
      inputOptions,
      async callback(result) {
        if (result) {
          const opt = {
            command: "move",
            destination: result,
          };
          const post = await OctoPrintClient.post(
            printer,
            `files/local/${fullPath}`,
            opt
          );
          const { status } = post;
          if (status === 404) {
            UI.createAlert(
              "error",
              "We could not find the location, does it exist?",
              3000,
              "clicked"
            );
          } else if (status === 409) {
            UI.createAlert(
              "warning",
              "There was a conflict, file already exists or is in use...",
              3000,
              "clicked"
            );
          } else {
            const json = await post.json();
            const opts = {
              index: printer._id,
              newPath: result,
              fileName: json.name,
              newFullPath: json.path,
            };
            await OctoFarmClient.post("printers/moveFile", opts);
            await FileManagerSortingService.loadSort(printer._id);
            UI.createAlert(
              "success",
              "Successfully moved your file...",
              3000,
              "clicked"
            );
          }
        }
      },
    });
  }

  static deleteFile(printer, fullPath) {
    bootbox.confirm({
      message: `Are you sure you want to delete ${fullPath}?`,
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
          const { status } = await OctoPrintClient.file(
            printer,
            fullPath,
            "delete"
          );
          if (status === 404) {
            UI.createAlert(
              "error",
              "We could not find the location, does it exist?",
              3000,
              "clicked"
            );
          } else if (status === 409) {
            UI.createAlert(
              "warning",
              "There was a conflict, file is in use...",
              3000,
              "clicked"
            );
          } else {
            const opt = {
              i: printer._id,
              fullPath,
            };
            await OctoFarmClient.post("printers/removefile", opt);
            document.getElementById(`file-${fullPath}`).remove();
            UI.createAlert(
              "success",
              "Successfully deleted your file...",
              3000,
              "clicked"
            );
          }
        }
      },
    });
  }

  static deleteFolder(printer, fullPath) {
    bootbox.confirm({
      message: `Are you sure you want to delete ${fullPath}?`,
      buttons: {
        cancel: {
          label: "<i class=\"fa fa-times\"></i> Cancel",
        },
        confirm: {
          label: "<i class=\"fa fa-check\"></i> Confirm",
        },
      },
      async callback(result) {
        const opts = {
          index: printer._id,
          fullPath,
        };
        if (result) {
          await OctoPrintClient.delete(printer, `files/local/${fullPath}`);
          await OctoFarmClient.post("printers/removefolder", opts);
          document.getElementById(`file-${fullPath}`).remove();
        }
      },
    });
  }

  static moveFolder(printer, fullPath) {
    const inputOptions = generatePathList(printer.fileList.folderList);
    bootbox.prompt({
      title: "Where would you like to move the folder?",
      inputType: "select",
      inputOptions,
      async callback(result) {
        if (result) {
          const opt = {
            command: "move",
            destination: result,
          };

          const post = await OctoPrintClient.post(
            printer,
            `files/local/${fullPath}`,
            opt
          );
          const { status } = post;
          if (status === 404) {
            UI.createAlert(
              "error",
              "We could not find the location, does it exist?",
              3000,
              "clicked"
            );
          } else if (status === 409) {
            UI.createAlert(
              "error",
              "There was a conflict, file already exists or is in use...",
              3000,
              "clicked"
            );
          } else {
            UI.createAlert(
              "warning",
              "Moving folder please wait...",
              3000,
              "clicked"
            );
            try {
              const json = await post.json();
              const opts = {
                index: printer._id,
                oldFolder: fullPath,
                newFullPath: result,
                folderName: json.path,
              };
              await OctoFarmClient.post("printers/moveFolder", opts);
              await FileManagerSortingService.loadSort(printer._id);
              UI.createAlert(
                "success",
                "Successfully moved your file...",
                3000,
                "clicked"
              );
            } catch (e) {
              UI.createAlert(
                "error",
                `Unable to move your file! Error ${e}`,
                0,
                "Clicked"
              );
              const errorObject = ClientErrors.SILENT_ERROR;
              errorObject.message = `Bulk Commands - ${e}`;
              throw new ApplicationError(errorObject);
            }
          }
        }
      },
    });
  }
}
