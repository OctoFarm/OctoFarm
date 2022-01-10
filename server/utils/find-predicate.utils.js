const { findIndex } = require("lodash");

const findFileIndex = (fileList, fullPath) => {
  return findIndex(fileList.files, function (o) {
    return o.fullPath == fullPath;
  });
};

module.exports = {
  findFileIndex
};
