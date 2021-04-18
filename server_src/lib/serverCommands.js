const fs = require("fs");
const path = require("path");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const { isPm2 } = require("../utils/env.utils.js");
const { isNodemon } = require("../utils/env.utils.js");

function isGitSync(dir) {
  return fs.existsSync(path.join(dir, ".git"));
}

class SystemCommands {
  static rebootOctoFarm() {
    let checkForNamedService = false;
    // If we're on pm2, then restart buddy!
    if (isPm2()) {
      exec("pm2 restart OctoFarm").catch((stderr) => {
        throw "Error with pm2 restart command: " + stderr;
      });
      checkForNamedService = true;
    }
    if (isNodemon()) {
      exec("touch ./app.js").catch((stderr) => {
        throw "Error with nodemon restart command: " + stderr;
      });
      checkForNamedService = true;
    }

    return checkForNamedService;
  }
  // This will need changing when .deb / installation script becomes a thing. It's built to deal with the current implementation.
  static async updateOctoFarm(force) {
    let serverResponse = {
      haveWeSuccessfullyUpdatedOctoFarm: false,
      statusTypeForUser: "error",
      message: null,
    };

    if (!force || typeof force?.forceCheck !== "boolean") {
      serverResponse.message = "Force boolean not supplied!";
      throw serverResponse;
    }

    // Check to see if current dir contains a git folder... hard fail otherwise.
    let doWeHaveAGitFolder = await isGitSync("./");
    if (!doWeHaveAGitFolder) {
      serverResponse.message =
        "Not a git repository, manual update required...";
      throw serverResponse;
    }

    const { stdout, stderr } = await exec("git status");

    if (stderr) {
      serverResponse.message = `Git returned an error, user intervention required | Error: ${stderr}`;
      throw serverResponse;
    }

    if (stdout) {
      // Check if branch has local changes. Return response to user, ask if they'd like to force overwrite the local changes, check for force flag and overwrite local changes..
      if (
        stdout.includes("Your branch is ahead of") ||
        stdout.includes("Changes not staged for commit")
      ) {
        if (stdout.includes("nothing to commit, working tree clean")) {
          serverResponse.message =
            "<span class='text-warning'>The update is failing due to local changes been detected. Seems you've committed your files, Thanks for making OctoFarm great! <br><br>" +
            "<b class='text-success'>Override:</b> Will just run a <code>git pull</code> command if you continue.<br><br>" +
            "<b class='text-danger'>Cancel:</b> This option will cancel the update process.<br><br>";
          serverResponse.statusTypeForUser = "warning";
          return serverResponse;
        }
        if (!force?.forceCheck) {
          // Default case without forcing the update
          serverResponse.message =
            "<span class='text-warning'>The update is failing due to local changes been detected. Please check the file list below for what has been modified. </span><br><br>" +
            "<b class='text-success'>Override:</b> This option will ignore the local changes and run the OctoFarm Update process. (You will lose your changes with this option)<br><br>" +
            "<b class='text-danger'>Cancel:</b> This option will cancel the update process keeping your local changes. No update will run and manual intervention by the user is required. <br><br>";
          serverResponse.statusTypeForUser = "warning";
          const matchChangedFilesRegex = new RegExp("(modified:.*)", "g");
          const changedFilesList = [...stdout.match(matchChangedFilesRegex)];

          changedFilesList.forEach((line) => {
            serverResponse.message += `<div class="alert alert-secondary m-1 p-2" role="alert"><i class="fas fa-file"></i>${line.replace(
              "modified: ",
              ""
            )} </div>`;
          });

          return serverResponse;
        } else if (force?.forceCheck) {
          // User wants to force the update
          await exec("git reset --hard");
        }
      }
      
      // Check if branch is already up to date. Nothing to do, return response to user.
      if (
        stdout.includes("Your branch is up-to-date with") ||
        stdout.includes("Your branch is up to date with")
      )
      {
        serverResponse.haveWeSuccessfullyUpdatedOctoFarm = false;
        serverResponse.message =
          "OctoFarm is already up to date! Your good to go!";
        serverResponse.statusTypeForUser = "success";
        return serverResponse;
      }
      // All been well, let's pull the update!
      await exec("git pull");
      // Everything went well, enjoy the tasty updates!
      serverResponse.haveWeSuccessfullyUpdatedOctoFarm = true;
      serverResponse.statusTypeForUser = "success";
      serverResponse.message =
        "Update command has run successfully, OctoFarm will restart.";

      return {
        serverResponse,
      };
    }
  }
}

module.exports = { SystemCommands };
