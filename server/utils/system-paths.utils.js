const { join } = require("path");
const systemRoot = "../";
const logFolder = "logs";
const imagesFolder = "images";
const tempFolder = "temp";

function getLogsPath() {
  return join(systemRoot, logFolder);
}

function getImagesPath() {
  return join(systemRoot, imagesFolder);
}

function getTempPath(){
  return join(systemRoot, tempFolder);
}

module.exports = { getLogsPath, systemRoot, getImagesPath, getTempPath };
