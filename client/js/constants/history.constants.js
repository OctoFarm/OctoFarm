module.exports = {
  HISTORY_CONSTANTS: {
    currentPage: "page=",
    perPage: "limit=",
    sort: "sort=",
    dateBefore: "firstDate=",
    dateAfter: "lastDate="
  },
  SORT_CONSTANTS: {
    printerNameAsc: "printer_name_asc",
    printerNameDesc: "printer_name_desc",
    fileNameAsc: "file_name_asc",
    fileNameDesc: "file_name_desc",
    startDateAsc: "start_date_asc",
    startDateDesc: "start_date_desc",
    endDateAsc: "end_date_asc",
    endDateDesc: "end_date_desc",
    durationAsc: "duration_asc",
    durationDesc: "duration_desc"
  },
  ELEMENTS: {
    historyTable: document.getElementById("historyTable"),
    historyPagination: document.getElementById("historyPagination"),
    sort: document.getElementById("sortHistoryTable"),
    dateRange: document.getElementById("historyDateRange"),
    itemsPerPage: document.getElementById("historyItemsPerPage"),
    fileFilter: document.getElementById("historyFileNames"),
    pathFilter: document.getElementById("historyFilePaths"),
    spoolManuFilter: document.getElementById("historySpoolManu"),
    spoolMatFilter: document.getElementById("historySpoolMat"),
    fileSearch: document.getElementById("historyFileSearch"),
    spoolSearch: document.getElementById("historySpoolSearch"),
    printerNamesFilter: document.getElementById("historyPrinterNames"),
    printerGroupsFilter: document.getElementById("historyPrinterGroups"),
    printerSearch: document.getElementById("historyPrinterSearch"),
    printTimeTotal: document.getElementById("totalPrintTime"),
    filamentUsageTotal: document.getElementById("totalFilament"),
    filamentCostTotal: document.getElementById("totalCost"),
    printerCostTotal: document.getElementById("printerTotalCost"),
    totalCost: document.getElementById("combinedTotalCost"),
    averageCostPerHour: document.getElementById("averageCostPerHour")
  }
};
