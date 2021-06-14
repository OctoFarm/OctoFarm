"use strict";

const historyModel = require("../models/History");

/**
 * Finds the history rows in the database.
 * @param {any} input
 */
async function find(input) {
  return historyModel.find(input, null, {
    sort: { historyIndex: -1 }
  });
}

/**
 * List out all the history records in the database.
 */
async function list() {
  return await historyModel.find({});
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

/**
 * Generates an incremental index for the history object.
 */
const generateHistoryIndex = async () => {
  const existingRecords = await this.list();
  if (existingRecords.length === 0) {
    return 0;
  } else {
    return existingRecords.length + 1;
  }
};

/**
 * Generates the history state value.
 * @param {Boolean} state boolean value
 * @throws {Error} If the state is not correctly provided as a Boolean.
 */
const generateHistoryState = async (state) => {
  if (typeof state !== "boolean") throw new Error("State not a boolean value");

  return state;
};

/**
 * Generates the history reason value
 * @param {String} reason string value
 * @throws {Error} If the reason is not correctly provided as a String.
 */
const generateHistoryReason = async (reason) => {
  // No reason for success prints, returning undefined as before
  if (!reason) return reason;
  // If reason exists needs to be a string
  if (typeof reason !== "string") throw new Error("Reason is not a string");

  return reason;
};

/**
 * Generate this history file information for name, display and path
 * @param {String} type string value
 * @param {Object} payload object value
 * @throws {Error} If no type is specified or payload specified
 * @throws {Error} If payload doesn't contain required key.
 */
const generateHistoryFileInformation = async (type, payload) => {
  // Check if type is specified
  if (!type || !payload) throw new Error("No type or payload specified");

  // Check if payload key exists, apart from display as that's generated here.
  if (type !== "display")
    if (!payload.hasOwnProperty(type))
      throw new Error(`Specified type: ${type} is not an accepted value`);

  // Check if payload object has required key
  switch (type) {
    case "name":
      return payload?.name;
    case "display":
      // OctoPrint put's "_" in-place of spaces on filenames, sanitises input.
      return payload?.name.replace("_", " ");
    case "path":
      return payload?.path;
  }
};

/**
 * Generate this history file information for name, display and path
 * @param {String} type string value
 * @param {Number} date number value
 * @throws {Error} If no type or date is specified and date is not a number
 * @throws {Error} If type is not "state-date","end-date"
 */
const generateHistoryDate = async (type, date) => {
  // Check if type is specified
  if (!type || isNaN(date))
    throw new Error("No type or numeric date specified");

  const today = new Date();
  // OctoPrint time value is in ms, needs to convert to seconds to use date time.
  const printTime = new Date(date * 1000);
  // Check if payload object has required key
  switch (type) {
    case "start-date":
      let startDate = today.getTime() - printTime.getTime();
      startDate = new Date(startDate);
      const startDDMM = startDate.toLocaleDateString();
      const startTime = startDate.toLocaleTimeString();
      const startTimeFormat = startTime.substring(0, 8);
      return (startDate = `${startDDMM} - ${startTimeFormat}`);
    case "end-date":
      const endDDMM = today.toLocaleDateString();
      const endTime = today.toLocaleTimeString();
      const endTimeFormat = endTime.substring(0, 8);
      return `${endDDMM} - ${endTimeFormat}`;
    default:
      throw new Error("Unknown type specified");
  }
};
/**
 * Generates the history reason value
 * @param {Number} printTime
 * @throws {Error} If the print time is not provided
 */
const generateHistoryPrintTime = async (printTime) => {
  // Check if print time is a Number
  if (isNaN(printTime)) throw new Error("Supplied print time is not a number");

  // OctoPrint supplied printTime in seconds value, milliseconds are not relevant here.
  // Return nearest second value.
  return Math.round(printTime);
};
/**
 * Generates the resend statistics provided by OctoPrint
 * @param {Object} resendStatistics
 */
const generateHistoryResendStatistics = async (resendStatistics) => {
  // Resend Statistics is a newer OctoPrint feature that's only supplied 1.5.0+. Returns undefined as before if it doesn't exist.
  if (!resendStatistics) return resendStatistics;

  for (let key in resendStatistics) {
    if (resendStatistics.hasOwnProperty(key)) {
      // Make sure the resend value is a number, return undefined if not as it couldn't be collected.
      if (isNaN(resendStatistics[key])) return undefined;
    } else {
      // OctoPrint issue would most likely cause this, just return undefined.
      return undefined;
    }
  }
  // All well, return the object as is.
  return resendStatistics;
};
/**
 * Generates the history job object
 * @param {Object} job obeject from OctoPrint
 * @throws {Error} If the job object is missing a required key used in the printer clean functions
 * @throws {Error} If the job.file object is missing a required key used in the printer clean functions
 */
const generateHistoryJobStatistics = async (job) => {
  // OctoFarms current required keys
  const requiredJobKeys = [
    "averagePrintTime",
    "lastPrintTime",
    "file",
    "estimatedPrintTime",
    "filament"
  ];
  const requiredFileKeys = ["name", "path", "size", "date"];

  // Job object is used for deeper inspection on the history card. Throw error if not supplied.
  if (!job) throw new Error("Job object not defined");

  // Check job object has all the required keys
  for (let key in requiredJobKeys) {
    if (!job.hasOwnProperty(requiredJobKeys[key]))
      throw new Error("Job is missing required key");
  }
  // Check job.file object has all the required keys
  for (let key in requiredFileKeys) {
    if (!job.file.hasOwnProperty(requiredFileKeys[key]))
      throw new Error("File is missing required key");
  }
  return job;
};

module.exports = {
  find,
  list,
  getFileFromHistoricJob,
  generateHistoryJobStatistics,
  generateHistoryResendStatistics,
  generateHistoryPrintTime,
  generateHistoryDate,
  generateHistoryFileInformation,
  generateHistoryReason,
  generateHistoryState,
  generateHistoryIndex
};
