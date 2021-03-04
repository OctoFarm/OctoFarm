const fs = require("fs");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const Logger = require("../lib/logger.js");
const logger = new Logger("OctoFarm-Scripts");
var wol = require("wake_on_lan");

class SystemCommands {
  static async rebootOctoFarm() {
    logger.info("Restart OctoFarm server requests");
    let checkForNamedService = false;
    //Bit hacky, open to suggestions... the restart command fired here would not notify the user it was successful. The catch successfully captures any errors, and the server does restart...
    try {
      //Attempts to stop the named OctoFarm service...
      const { stdoutList, stderrList } = await exec("pm2 stop OctoFarm");
      logger.info("stdout:", stdoutList);
      checkForNamedService = true;
      // If the stop succeeded then we are ok to restart.
      const { stdoutRestart, stderrRestart } = exec("pm2 restart OctoFarm");
      logger.info("stdout:", stdoutRestart);
    } catch (err) {
      logger.error(err);
    }
    return checkForNamedService;
  }
  static async checkOctoFarmIsNamedService() {
    logger.info("Checking OctoFarm Named Service...");
    let areWeUnderPm2NamedService = false;
    try {
      const { stdout, stderr } = await exec("pm2 restart OctoFarm");
      logger.info("stdout:", stdout);
      // Unneeded
      // logger.info("stderr:", stderr);
      areWeUnderPm2NamedService = true;
    } catch (err) {
      logger.error(err);
    }
    return areWeUnderPm2NamedService;
  }
}

class Script {
  static async fire(scriptLocation, message) {
    logger.info("Script: ", scriptLocation);
    logger.info("Message: ", message);
    try {
      const { stdout, stderr } = await exec(`${scriptLocation} ${message}`);
      logger.info("stdout:", stdout);
      logger.info("stderr:", stderr);
      return scriptLocation + ": " + stdout;
    } catch (err) {
      logger.error(err);
      return err;
    }
  }

  static async wol(wolSettings) {
    const opts = {
      address: wolSettings.ip,
      num_packets: wolSettings.count,
      interval: wolSettings.interval,
      port: wolSettings.port,
    };
    const mac = wolSettings.MAC;

    wol.wake(mac, function (error) {
      if (error) {
        logger.error("Couldn't fire wake packet", error);
      } else {
        logger.info("Successfully fired wake packet: ", mac, opts);
      }
    });
  }
}

// Grab Logs
class Logs {
  static async grabLogs() {
    const fileArray = [];
    const testFolder = "./logs/";
    const folderContents = await fs.readdirSync(testFolder);
    for (let i = 0; i < folderContents.length; i++) {
      const stats = await fs.statSync(testFolder + folderContents[i]);
      const logFile = {};
      logFile.name = folderContents[i];
      logFile.size = stats.size;
      logFile.modified = stats.mtime;
      logFile.created = stats.birthtime;
      fileArray.push(logFile);
    }
    return fileArray;
  }
}

module.exports = { Logs, SystemCommands, Script };
