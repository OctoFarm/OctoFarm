const fs = require("fs");
const path = require("path");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const Logger = require("../lib/logger.js");
const loggerScripts = new Logger("OctoFarm-Scripts");
const loggerServer = new Logger("OctoFarm-Server");
const wol = require("wake_on_lan");

function isGitSync(dir) {
  return fs.existsSync(path.join(dir, ".git"));
}

class SystemCommands {
  static async rebootOctoFarm() {
    loggerServer.info("Restart OctoFarm server requests");
    let checkForNamedService = false;
    // Bit hacky... Make sure OctoFarm has a pid under pm2.... Had to stagger the actual restart command so the return would send to client. - Open to suggestions
    try {
      //Attempts to find the named service
      const { stdout, stderr } = await exec("pm2 pid OctoFarm");
      if (isNaN(parseInt(stdout))) {
        throw "No process number returned";
      }
      checkForNamedService = true;
      // If the process had a integer pid succeeded then we are ok to restart, errors are caught by the try, catch
      exec("pm2 restart OctoFarm");
    } catch (err) {
      loggerServer.error(err);
    }
    return checkForNamedService;
  }
  // This will need changing when .deb / installation script becomes a thing. It's built to deal with the current implementation.
  static async updateOctoFarm() {
    loggerServer.info("Update OctoFarm server requests");
    let haveWeSuccessfullyUpdatedOctoFarm = false;
    let statusTypeForUser = null;
    let messageForUser = null;
    try {
      // Check to see if current dir contains a git folder... hard fail otherwise.
      let doWeHaveAGitFolder = await isGitSync("./");
      if (!doWeHaveAGitFolder) {
        let notGitRepoError = "Not a git repository, manual update required...";
        messageForUser = notGitRepoError;
        statusTypeForUser = "error";
        throw notGitRepoError;
      }

      // We are inside a folder which was created with git... okay to continue the pull
      const { stdout, stderr } = await exec("git pull");
      // Throw on any error, nobody should be editing their local github folder after this release is made. If they do, they need to manually update.
      if (stderr) {
        let manualChangesError =
          "Manual changes to local OctoFarm folder detected, manual update required...";
        messageForUser = manualChangesError;
        statusTypeForUser = "error";
        throw stderr;
      }
      // Catch if user somehow circumvents the client button checks in place.
      if (stdout.includes("Already up-to-date")) {
        let alreadyUpToDateError =
          "Already up to date! Ignoring update request...";
        statusTypeForUser = "warning";
        messageForUser = alreadyUpToDateError;
        throw alreadyUpToDateError;
      } else {
        statusTypeForUser = "success";
        messageForUser =
          "Update command has run successfully, you need to restart the OctoFarm service to activate these changes...";
      }
      haveWeSuccessfullyUpdatedOctoFarm = true;
    } catch (err) {
      loggerServer.error("OctoFarm Update Error: ", err);
    }
    return {
      haveWeSuccessfullyUpdatedOctoFarm,
      statusTypeForUser,
      messageForUser,
    };
  }
}

class Script {
  static async fire(scriptLocation, message) {
    loggerScripts.info("Script: ", scriptLocation);
    loggerScripts.info("Message: ", message);
    try {
      const { stdout, stderr } = await exec(`${scriptLocation} ${message}`);
      loggerScripts.info("stdout:", stdout);
      loggerScripts.info("stderr:", stderr);
      return scriptLocation + ": " + stdout;
    } catch (err) {
      loggerScripts.error(err);
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
        loggerScripts.error("Couldn't fire wake packet", error);
      } else {
        loggerScripts.info("Successfully fired wake packet: ", mac, opts);
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
