const { join } = require("path");
const { ROOT, PATH_CONSTANTS, SUB_PATH_CONSTANTS, UPDATER_PATHS } = require("../constants/path.constants")
const { existsSync, mkdirSync } = require("fs");


const systemRoot = ROOT;

function getLogsPath() {
  return join(ROOT, PATH_CONSTANTS.LOGS_FOLDER);
}

function getImagesPath() {
  return join(ROOT, PATH_CONSTANTS.IMAGES_FOLDER);
}

function getTempPath(){
  return join(ROOT, PATH_CONSTANTS.TEMP_FOLDER);
}

const createMissingSystemPaths = () => {
  const pathList = [getLogsPath(), getImagesPath(), getTempPath(), SUB_PATH_CONSTANTS.BACKUP_FOLDER, SUB_PATH_CONSTANTS.HISTORY_COLLECTION_FOLDER]

  for(const path of pathList){
    const checkPath = "../" + path;
    if(!existsSync(checkPath)){
      mkdirSync(checkPath, {recursive: true})
    }
  }
}

module.exports = { getLogsPath, systemRoot, getImagesPath, getTempPath, createMissingSystemPaths };
