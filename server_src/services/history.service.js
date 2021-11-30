"use strict";

const historyModel = require("../models/History");
const {
  myCustomLabels,
  defaultPaginationOptions,
  defaultInputFilters
} = require("../constants/history-sort.constants");

/**
 * Finds the history rows in the database.
 * @param {any} input
 * @param options
 */
async function find(input = defaultInputFilters, options = defaultPaginationOptions) {
  //Merge in the custom labels used
  options = { ...options, ...{ customLabels: myCustomLabels } };
  console.log(input);
  return historyModel.paginate(input, options, function (err, result) {
    return { itemList: result.docs, pagination: result.paginator };
  });
}

/**
 * Get file specifications from a previous print job
 * @param history
 * @returns {{path: (*|string|null|string|string|string), uploadDate: (*|null), size: (*|null), lastPrintTime: (number|*|null), name, averagePrintTime: (number|*|null)}}
 */
function getFileFromHistoricJob(history) {
  const historyJob = history?.job;
  const historyJobFile = history?.job?.file;

  return {
    name: history.fileName,
    uploadDate: historyJobFile?.date || null,
    path: historyJobFile?.path || history.filePath, // TODO discuss this alternative
    size: historyJobFile?.size || null,
    averagePrintTime: historyJob?.averagePrintTime || null,
    lastPrintTime: historyJob?.lastPrintTime || null
  };
}

module.exports = {
  find,
  getFileFromHistoricJob
};
