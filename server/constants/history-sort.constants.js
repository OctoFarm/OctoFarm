const { getFirstDayOfLastMonth } = require("../utils/date.utils");
const myCustomLabels = {
  totalDocs: "itemCount",
  docs: "docs",
  limit: "perPage",
  page: "currentPage",
  nextPage: "next",
  prevPage: "prev",
  totalPages: "pageCount",
  meta: "paginator"
};

const defaultPaginationOptions = {
  page: 1,
  limit: 100,
  sort: { _id: -1 }
};

const defaultInputFilters = {
  "printHistory.endDate": { $gte: getFirstDayOfLastMonth(), $lte: new Date() }
};

const sortOptions = {
  index_asc: { "printHistory.historyIndex": -1 },
  index_desc: { "printHistory.historyIndex": 1 },
  printer_name_asc: { "printHistory.printerName": -1 },
  printer_name_desc: { "printHistory.printerName": 1 },
  file_name_asc: { "printHistory.fileName": -1 },
  file_name_desc: { "printHistory.fileName": 1 },
  start_date_asc: { "printHistory.startDate": -1 },
  start_date_desc: { "printHistory.startDate": 1 },
  end_date_asc: { "printHistory.endDate": -1 },
  end_date_desc: { "printHistory.endDate": 1 },
  duration_asc: { "printHistory.printTime": -1 },
  duration_desc: { "printHistory.printTime": 1 }
  // Below are calulations, need to check how to do these. Maybe run migrator and create information??
  // cost_asc: { "printHistory.historyIndex": -1 },
  // cost_desc: { "printHistory.historyIndex": 1 },
  // spool_usage_asc: { "printHistory.historyIndex": -1 },
  // spool_usage_desc: { "printHistory.historyIndex": 1 }
};

const filterOptions = {
  printer_name: "printHistory.printerName",
  spool_type: "",
  spool_name: "",
  file_name: "printerHistory.fileName",
  file_path: "printerHistory.filePath"
};

module.exports = {
  myCustomLabels,
  defaultPaginationOptions,
  sortOptions,
  defaultInputFilters
};
