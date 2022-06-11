const { readdirSync, statSync, unlinkSync } = require("fs");
const { join } = require("path");

const { createZipFile } = require("../utils/zip.utils.js");
const { getLogsPath } = require("../utils/system-paths.utils.js");
const {
  generateOctoFarmSystemInformationTxt
} = require("./system-information-text-generator.service.js");
const { generateTodayTextString } = require("../utils/date.utils");
const Logger = require("../handlers/logger");
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");
const logger = new Logger(LOGGER_ROUTE_KEYS.SERVICE_SERVER_LOGS);

const logFolder = getLogsPath();

// Grab Logs
class Logs {
  static async grabLogs() {
    const fileArray = [];
    const folderContents = readdirSync(logFolder);
    for (const folder of folderContents) {
      const logFilePath = join(logFolder, folder);
      const stats = statSync(logFilePath);
      const logFile = {
        name: folder,
        path: logFilePath,
        size: stats?.size,
        modified: stats?.mtime,
        created: stats?.birthtime
      };
      fileArray.push(logFile);
    }
    return fileArray;
  }

  /**
   * Deletes a log file by name
   * @param name
   * @returns Boolean
   */
  static deleteLogByName(name = undefined) {
    if (!name) {
      return false;
    }
    const logFilePath = join(logFolder, name);
    logger.debug("Deleting log file: " + logFilePath);
    unlinkSync(logFilePath);
    return true;
  }

  /**
   * Clears old log files older than the number of days supplied.
   * @param days
   * @returns {*[]}
   */
  static clearLogsOlderThan(days = 1) {
    const deletedFiles = [];
    const folderContents = readdirSync(logFolder);
    const now = new Date();
    const yesterday = now.setDate(now.getDate() - days);
    for (const folder of folderContents) {
      const logFilePath = join(logFolder, folder);
      const stats = statSync(logFilePath);
      const endTime = new Date(stats.birthtime).getTime() + 3600000;
      if (yesterday > endTime) {
        Logs.deleteLogByName(logFilePath);
        deletedFiles.push(logFilePath);
      }
    }
    return deletedFiles;
  }

  /**
   * Generates a downloadable "*.zip" file containing all system  logs.
   * @returns {Promise<string>}
   */
  static async generateOctoFarmLogDump() {
    const fileList = [];

    // Generate nice text file of system information
    const octofarmInformationTxt = await generateOctoFarmSystemInformationTxt();
    if (!octofarmInformationTxt) {
      throw new Error("Couldn't generate octofarms_information.txt file...");
    }

    fileList.push(octofarmInformationTxt);

    // Collect all latest log files
    const currentLogFiles = await this.grabLogs();

    // Let me know if there's a better way here. Just always used forEach.
    currentLogFiles.forEach((logPath) => {
      if (logPath?.name.includes(".log")) {
        const logFile = {
          name: logPath?.name,
          path: logPath?.path
        };
        fileList.push(logFile);
      }
    });
    // Create the zip file and return the path.
    return createZipFile(`octofarm_dump-${generateTodayTextString()}.zip`, fileList);
  }
}

module.exports = { Logs };
