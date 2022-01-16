const { getFileListDefault } = require("./service.constants");

function getJobCacheDefault() {
  return {
    job: undefined,
    progress: undefined,
    currentZ: undefined
  };
}

function getFileCacheDefault() {
  return {
    fileList: getFileListDefault(),
    storage: undefined
  };
}

module.exports = {
  getJobCacheDefault,
  getFileCacheDefault
};
