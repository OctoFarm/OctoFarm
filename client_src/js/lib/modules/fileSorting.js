import FileManager from "./fileManager.js";

export default class FileSorting {
  static saveSort(meta, reverse) {
    localStorage.setItem("fileSort", JSON.stringify({ meta, reverse }));
  }

  static loadSort(printer, recursive) {
    const fileSortStorage = JSON.parse(localStorage.getItem("fileSort"));
    if (fileSortStorage !== null) {
      const reverse = fileSortStorage.reverse;
      if (fileSortStorage.meta === "file") {
        if (typeof recursive !== "undefined") {
          this.sortFileName(printer, reverse, recursive);
        } else {
          this.sortFileName(printer, reverse);
        }
      }
      if (fileSortStorage.meta === "date") {
        if (typeof recursive !== "undefined") {
          this.sortUploadDate(printer, reverse, recursive);
        } else {
          this.sortUploadDate(printer, reverse);
        }
      }
      if (fileSortStorage.meta === "time") {
        if (typeof recursive !== "undefined") {
          this.sortPrintTime(printer, reverse, recursive);
        } else {
          this.sortPrintTime(printer, reverse);
        }
      }
    } else {
      this.sortUploadDate(printer, true);
    }
    this.setListeners(printer);
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
        }
      ]);
      printer.fileList.folderList = _.sortBy(printer.fileList.folderList, [
        function (o) {
          return o.name;
        }
      ]);
      if (reverse) {
        printer.fileList.fileList = printer.fileList.fileList.reverse();
        printer.fileList.folderList = printer.fileList.folderList.reverse();
        sortHeader.innerHTML = '<i class="fas fa-sort-alpha-up"></i> File Name';
        this.saveSort("file", true);
      } else {
        sortHeader.innerHTML = '<i class="fas fa-sort-alpha-down"></i> File Name';
        this.saveSort("file", false);
      }
      FileManager.drawFiles(printer, true);
    }
  }

  static sortUploadDate(printer, reverse, recursive) {
    const sortHeader = document.getElementById("fileSortDropdownMenu");
    if (sortHeader) {
      printer.fileList.fileList = _.sortBy(printer.fileList.fileList, [
        function (o) {
          return o.uploadDate;
        }
      ]);
      printer.fileList.folderList = _.sortBy(printer.fileList.folderList, [
        function (o) {
          return o.name;
        }
      ]);
      if (reverse) {
        printer.fileList.fileList = printer.fileList.fileList.reverse();
        printer.fileList.folderList = printer.fileList.folderList.reverse();
        sortHeader.innerHTML = '<i class="fas fa-sort-numeric-down"></i> Upload Date';
        this.saveSort("date", true);
      } else {
        sortHeader.innerHTML = '<i class="fas fa-sort-numeric-up"></i> Upload Date';
        this.saveSort("date", false);
      }
      FileManager.drawFiles(printer, recursive);
    }
  }

  static sortPrintTime(printer, reverse, recursive) {
    const sortHeader = document.getElementById("fileSortDropdownMenu");
    if (sortHeader) {
      printer.fileList.fileList = _.sortBy(printer.fileList.fileList, [
        function (o) {
          return o.expectedPrintTime;
        }
      ]);
      printer.fileList.folderList = _.sortBy(printer.fileList.folderList, [
        function (o) {
          return o.name;
        }
      ]);
      if (reverse) {
        printer.fileList.fileList = printer.fileList.fileList.reverse();
        printer.fileList.folderList = printer.fileList.folderList.reverse();
        sortHeader.innerHTML = '<i class="fas fa-sort-numeric-up"></i> Print Time';
        this.saveSort("time", false);
      } else {
        sortHeader.innerHTML = '<i class="fas fa-sort-numeric-down"></i> Print Time';
        this.saveSort("time", true);
      }
      FileManager.drawFiles(printer, recursive);
    }
  }
}
