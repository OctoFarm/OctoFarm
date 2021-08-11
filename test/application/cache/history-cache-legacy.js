/**
 * Unit under test and under conversion
 * @param history
 * @returns {{path: null, uploadDate: null, size: null, lastPrintTime: null, name: *, averagePrintTime: null}}
 */
function legacyGetFile(history) {
  const file = {
    name: history.fileName,
    uploadDate: null,
    path: null,
    size: null,
    averagePrintTime: null,
    lastPrintTime: null
  };
  if (typeof history.job !== "undefined" && typeof history.job.file) {
    file.uploadDate = history.job.file.date;
    file.path = history.job.file.path;
    file.size = history.job.file.size;
    file.averagePrintTime = history.job.averagePrintTime;
    file.lastPrintTime = history.job.lastPrintTime;
  } else {
    file.path = history.filePath;
  }
  return file;
}

module.exports = {
  legacyGetFile
};
