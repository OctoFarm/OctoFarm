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
    // Bit hacky... Make sure OctoFarm has a pid under pm2.... Had to stagger the actual restart command so the return would send to client. - Open to suggestions
    try {
      //Attempts to find the named service
      const { stdout, stderr } = await exec("pm2 pid OctoFarm");
      if (isNaN(parseInt(stdout))) {
        throw "No process number returned";
      }
      logger.info("stdout:", stdout);
      checkForNamedService = true;
      // If the process had a integer pid succeeded then we are ok to restart, errors are caught by the try, catch
      exec("pm2 restart OctoFarm");
    } catch (err) {
      logger.error(err);
    }
    return checkForNamedService;
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
