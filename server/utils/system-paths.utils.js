const { join } = require("path");
const systemRoot = "../";
const logFolder = "logs";
const imagesFolder = "images";

function getLogsPath() {
  return join(systemRoot, logFolder);
}

function getImagesPath() {
  return join(systemRoot, imagesFolder);
}

module.exports = { getLogsPath, systemRoot, getImagesPath };
