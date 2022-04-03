import {getFileTemplate, getFolderTemplate, noFilesToShow} from "./file.template";
import {dragAndDropEnableMultiplePrinters} from "../../utils/dragAndDrop";
import OctoFarmClient from "../../services/octofarm-client.service";
import FileManagerSortingService from "../../services/file-manager-sorting.service";
import FileManagerService from "../../services/file-manager.service";

export const generatePathList = (folderList) => {
  const options = [];
  const loc = {
    text: "local",
    value: "/",
  };
  options.push(loc);
  folderList.forEach((folder) => {
    const option = {
      text: folder.name,
      value: folder.name,
    };
    options.push(option);
  });
  return options;
};
export const getCurrentUploadLimit = () => {};
export const setCurrentUploadLimit = () => {};
export const getFileListElement = (id) => {
  return document.getElementById(`fileList-${id}`);
};


export const drawFolders = (id, folderList, currentFolder) => {
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

export const drawFiles = (id, fileList, printerURL, currentFolder, recursive) => {
  const fileElem = getFileListElement(id);
  if (fileElem) {
    // Filter out files out of current folder scope
    const currentFileList = fileList.filter((f) => {
      return typeof recursive !== "undefined" || f.path === currentFolder;
    });
    // Show empty or filled list
    if (currentFileList.length > 0) {
      currentFileList.forEach((file) => {
        fileElem.insertAdjacentHTML(
            "beforeend",
            getFileTemplate(file, printerURL, id)
        );
      });
    } else {
      fileElem.insertAdjacentHTML("beforeend", noFilesToShow());
    }
  }
}

export const updatePrinterMetrics = (id, fileList, folderList) => {
  let currentFolder = document.getElementById("currentFolder").innerHTML;
  if (currentFolder.includes("local/")) {
    currentFolder = currentFolder.replace("local/", "");
  }

  const printerFileCount = document.getElementById("printerFileCount");
  if (printerFileCount) {
    printerFileCount.innerHTML = `<i class="fas fa-file"></i> ${fileList.length} <i class="fas fa-folder"></i> ${folderList.length}`;
  }
  const fileCardCount = document.getElementById("fileManagerFileCount-" + id);
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

export const updateListeners = (printer) => {
  const fileElem = document.getElementById(`fileList-${printer._id}`);
  dragAndDropEnableMultiplePrinters(fileElem, printer);
  const folders = document.querySelectorAll(".folderAction");
  folders.forEach((folder) => {
    folder.addEventListener("click", async (e) => {
      const updatedPrinter = await OctoFarmClient.getPrinter(printer._id);
      await openFolder(
          folder.id,
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

export const openFolder = async (folder, target, printer) => {
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