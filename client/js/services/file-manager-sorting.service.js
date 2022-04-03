import OctoFarmClient from "./octofarm-client.service";
import {
  updatePrinterFilesList
} from "../pages/file-manager/file.actions"

export default class FileManagerSortingService {
  static saveSort(meta, reverse) {
    localStorage.setItem("fileSort", JSON.stringify({ meta, reverse }));
  }

  static async loadSort(id, recursive, printer) {
    let updatedPrinter = null
    if(!!printer){
      updatedPrinter = printer;
    }else{
      updatedPrinter = await OctoFarmClient.getPrinter(id);
    }
    console.log(updatedPrinter)
    const fileSortStorage = JSON.parse(localStorage.getItem("fileSort"));
    if (fileSortStorage !== null) {
      const reverse = fileSortStorage.reverse;
      if (fileSortStorage.meta === "file") {
        if (typeof recursive !== "undefined") {
          FileManagerSortingService.sortFileName(updatedPrinter, reverse, recursive);
        } else {
          FileManagerSortingService.sortFileName(updatedPrinter, reverse);
        }
      }
      console.log(fileSortStorage.meta)
      if (fileSortStorage.meta === "date") {
        if (typeof recursive !== "undefined") {
          FileManagerSortingService.sortUploadDate(updatedPrinter, reverse, recursive);
        } else {
          FileManagerSortingService.sortUploadDate(updatedPrinter, reverse);
        }
      }
      if (fileSortStorage.meta === "time") {
        if (typeof recursive !== "undefined") {
          FileManagerSortingService.sortPrintTime(updatedPrinter, reverse, recursive);
        } else {
          FileManagerSortingService.sortPrintTime(updatedPrinter, reverse);
        }
      }
    } else {
      this.sortUploadDate(updatedPrinter, true);
    }
    FileManagerSortingService.setListeners(updatedPrinter);
  }

  static setListeners(printer) {
    const fileNameUp = document.getElementById("sortFileNameUp");
    const fileNameDown = document.getElementById("sortFileNameDown");
    const printTimeUp = document.getElementById("sortPrintTimeUp");
    const printTimeDown = document.getElementById("sortPrintTimeDown");
    const dateUp = document.getElementById("sortDateUp");
    const dateDown = document.getElementById("sortDateDown");
    if (fileNameUp) {
      fileNameUp.addEventListener("click", (e) => {
        console.log("SORTING")
        FileManagerSortingService.sortFileName(printer, true);
      });
    }
    if (fileNameDown) {
      fileNameDown.addEventListener("click", (e) => {
        FileManagerSortingService.sortFileName(printer);
      });
    }
    if (printTimeUp) {
      printTimeUp.addEventListener("click", (e) => {
        FileManagerSortingService.sortPrintTime(printer, true);
      });
    }
    if (printTimeDown) {
      printTimeDown.addEventListener("click", (e) => {
        FileManagerSortingService.sortPrintTime(printer);
      });
    }
    if (dateUp) {
      dateUp.addEventListener("click", (e) => {
        FileManagerSortingService.sortUploadDate(printer);
      });
    }
    if (dateDown) {
      dateDown.addEventListener("click", (e) => {
        FileManagerSortingService.sortUploadDate(printer, true);
      });
    }
  }

  static sortFileName(printer, reverse, recursive) {
    const sortHeader = document.getElementById("fileSortDropdownMenu");
    if (sortHeader) {
      printer.fileList.fileList = _.sortBy(printer.fileList.fileList, [
        function (o) {
          return o.display;
        },
      ]);
      printer.fileList.folderList = _.sortBy(printer.fileList.folderList, [
        function (o) {
          return o.name;
        },
      ]);
      if (reverse) {
        printer.fileList.fileList = printer.fileList.fileList.reverse();
        printer.fileList.folderList = printer.fileList.folderList.reverse();
        sortHeader.innerHTML = '<i class="fas fa-sort-alpha-up"></i> File Name';
        this.saveSort("file", true);
      } else {
        sortHeader.innerHTML =
          '<i class="fas fa-sort-alpha-down"></i> File Name';
        this.saveSort("file", false);
      }
      updatePrinterFilesList(printer, recursive);
    }
  }

  static sortUploadDate(printer, reverse, recursive) {
    const sortHeader = document.getElementById("fileSortDropdownMenu");
    if (sortHeader) {
      printer.fileList.fileList = _.sortBy(printer.fileList.fileList, [
        function (o) {
          return o.uploadDate;
        },
      ]);
      printer.fileList.folderList = _.sortBy(printer.fileList.folderList, [
        function (o) {
          return o.name;
        },
      ]);
      if (reverse) {
        printer.fileList.fileList = printer.fileList.fileList.reverse();
        printer.fileList.folderList = printer.fileList.folderList.reverse();
        sortHeader.innerHTML =
          '<i class="fas fa-sort-numeric-down"></i> Upload Date';
        this.saveSort("date", true);
      } else {
        sortHeader.innerHTML =
          '<i class="fas fa-sort-numeric-up"></i> Upload Date';
        this.saveSort("date", false);
      }
      updatePrinterFilesList(printer, recursive);
    }
  }

  static sortPrintTime(printer, reverse, recursive) {
    const sortHeader = document.getElementById("fileSortDropdownMenu");
    if (sortHeader) {
      printer.fileList.fileList = _.sortBy(printer.fileList.fileList, [
        function (o) {
          return o.expectedPrintTime;
        },
      ]);
      printer.fileList.folderList = _.sortBy(printer.fileList.folderList, [
        function (o) {
          return o.name;
        },
      ]);
      if (reverse) {
        printer.fileList.fileList = printer.fileList.fileList.reverse();
        printer.fileList.folderList = printer.fileList.folderList.reverse();
        sortHeader.innerHTML =
          '<i class="fas fa-sort-numeric-up"></i> Print Time';
        this.saveSort("time", false);
      } else {
        sortHeader.innerHTML =
          '<i class="fas fa-sort-numeric-down"></i> Print Time';
        this.saveSort("time", true);
      }
      updatePrinterFilesList(printer, recursive);
    }
  }
}
