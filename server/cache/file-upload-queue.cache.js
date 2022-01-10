const FileUploadQueue = require("../store/file-upload-queue.store");

let fileManagerQueueState = undefined;

function getFileUploadQueueCache() {
  if (!!fileManagerQueueState) {
    return fileManagerQueueState;
  } else {
    fileManagerQueueState = new FileUploadQueue();
    return fileManagerQueueState;
  }
}

module.exports = { getFileUploadQueueCache };
