const { join } = require("path");

const ROOT = "/";

const PATH_CONSTANTS = {
    IMAGES_FOLDER: join(ROOT, "images"),
    LOGS_FOLDER: join(ROOT, "logs"),
    TEMP_FOLDER: join(ROOT, "temp"),
    SERVER_FOLDER: join(ROOT, "server")
}

const SUB_PATH_CONSTANTS = {
    HISTORY_COLLECTION_FOLDER: join(PATH_CONSTANTS.IMAGES_FOLDER, "historyCollection"),
    BACKUP_FOLDER: join(PATH_CONSTANTS.TEMP_FOLDER, "backup")
}

const UPDATER_PATHS = {
    REL_UPDATE_ZIP: "../temp/octofarm-update.zip",
    REL_TEMP: "../temp",
    REL_SERVER: "../server",
    REL_BACKUP_SERVER: "../temp/backup",
    REL_UPDATED_SERVER: "../temp/server"
}

module.exports = { ROOT, PATH_CONSTANTS, SUB_PATH_CONSTANTS, UPDATER_PATHS }