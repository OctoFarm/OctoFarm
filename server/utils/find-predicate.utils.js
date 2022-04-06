const { findIndex } = require("lodash");
const { parseOutIPAddress } = require("./url.utils");
const { AppConstants } = require("../constants/app.constants");

const findFileIndex = (fileList, fullPath) => {
  return findIndex(fileList.files, function (o) {
    return o.fullPath === fullPath;
  });
};

const matchRemoteAddressToOctoFarm = (networkIpAddresses, remoteAddress) => {
  if (networkIpAddresses.includes(parseOutIPAddress(remoteAddress))) {
    return process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY];
  }
  if (!!remoteAddress) {
    return parseOutIPAddress(remoteAddress);
  }

  return "Unknown IP";
};

module.exports = {
  findFileIndex,
  matchRemoteAddressToOctoFarm
};
