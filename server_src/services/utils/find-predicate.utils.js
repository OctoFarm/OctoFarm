const _ = require("lodash");

const findFileIndex = (fileList, fullPath) => {
  return _.findIndex(fileList.files, function (o) {
    return o.fullPath == fullPath;
  });
};

module.exports = {
  findFileIndex
};
