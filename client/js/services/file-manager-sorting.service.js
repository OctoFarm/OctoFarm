import FileManagerService from "./file-manager.service.js";
import OctoFarmClient from "./octofarm-client.service";

export default class FileManagerSortingService {
  static saveSort(meta, reverse) {
    localStorage.setItem("fileSort", JSON.stringify({ meta, reverse }));
  }

  static async loadSort(id, recursive) {
    const updatedPrinter = await OctoFarmClient.getPrinter(id);
    const fileSortStorage = JSON.parse(localStorage.getItem("fileSort"));
    if (fileSortStorage !== null) {
      const reverse = fileSortStorage.reverse;
      if (fileSortStorage.meta === "file") {
        if (typeof recursive !== "undefined") {
          this.sortFileName(updatedPrinter, reverse, recursive);
        } else {
          this.sortFileName(updatedPrinter, reverse);
        }
      }
      if (fileSortStorage.meta === "date") {
        if (typeof recursive !== "undefined") {
          this.sortUploadDate(updatedPrinter, reverse, recursive);
        } else {
          this.sortUploadDate(updatedPrinter, reverse);
        }
      }
      if (fileSortStorage.meta === "time") {
        if (typeof recursive !== "undefined") {
          this.sortPrintTime(updatedPrinter, reverse, recursive);
        } else {
          this.sortPrintTime(updatedPrinter, reverse);
        }
      }
    } else {
      this.sortUploadDate(updatedPrinter, true);
    }
    this.setListeners(updatedPrinter);
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
        this.sortFileName(printer, true);
      });
    }
    if (fileNameDown) {
      fileNameDown.addEventListener("click", (e) => {
        this.sortFileName(printer);
      });
    }
    if (printTimeUp) {
      printTimeUp.addEventListener("click", (e) => {
        this.sortPrintTime(printer, true);
      });
    }
    if (printTimeDown) {
      printTimeDown.addEventListener("click", (e) => {
        this.sortPrintTime(printer);
      });
    }
    if (dateUp) {
      dateUp.addEventListener("click", (e) => {
        this.sortUploadDate(printer);
      });
    }
    if (dateDown) {
      dateDown.addEventListener("click", (e) => {
        this.sortUploadDate(printer, true);
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
      FileManagerService.updatePrinterFilesList(printer, recursive);
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
      FileManagerService.updatePrinterFilesList(printer, recursive);
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
      FileManagerService.updatePrinterFilesList(printer, recursive);
    }
  }
}
