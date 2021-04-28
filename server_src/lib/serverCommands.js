const fs = require("fs");
const path = require("path");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const { isPm2 } = require("../utils/env.utils.js");
const { isNodemon } = require("../utils/env.utils.js");
const {
  doWeHaveMissingPackages,
  installMissingNpmDependencies,
} = require("../utils/npm.utils.js");
const {
  returnCurrentGitStatus,
  isBranchUpToDate,
  isBranchInfront,
  doesBranchContainModifiedFiles,
  pullLatestRepository,
  checkIfWereInAGitRepo
} = require("../utils/git.utils.js");

function isGitSync(dir) {
  return fs.existsSync(path.join(dir, ".git"));
}

class SystemCommands {
  static async rebootOctoFarm() {
    let checkForNamedService = false;

    // If we're on pm2, then restart buddy!
    if (isPm2()) {
      try {
        await exec("pm2 restart OctoFarm");
        checkForNamedService = true;
      } catch (e) {
        throw "Error with pm2 restart command: " + e;
      }
    }

    if (isNodemon()) {
      try {
        await exec("touch ./app.js");
        checkForNamedService = true;
      } catch (e) {
        throw "Error with pm2 restart command: " + e;
      }
    }

    return checkForNamedService;
  }
  // This will need changing when .deb / installation script becomes a thing. It's built to deal with the current implementation.
  static async checkIfOctoFarmNeedsUpdatingAndUpdate(serverResponse, force) {
    // Check to see if current dir contains a git folder... hard fail otherwise.
    let isThisAGitRepo = await checkIfWereInAGitRepo();
    if (!isThisAGitRepo) {
      serverResponse.message =
        "Not a git repository, user intervention required! You will have to re-download OctoFarm and re-unpack it over this directory. Make sure to backup your images folder!";
      return serverResponse;
    }

    const gitCurrentStatus = await returnCurrentGitStatus();

    // We can safely skip these checks if either of these are true as they should have been run by the time these get flagged.
    if (!force.doWeInstallPackages && !force.forcePull) {
      // Check if branch is already up to date. Nothing to do, return response to user.
      const gitBranchUpToDate = isBranchUpToDate(gitCurrentStatus);
      if (gitBranchUpToDate) {
        serverResponse.haveWeSuccessfullyUpdatedOctoFarm = false;
        serverResponse.message =
          "OctoFarm is already up to date! Your good to go!";
        serverResponse.statusTypeForUser = "success";
        return serverResponse;
      }

      //The below checks should only run if the branch is not up to date... pointless otherwise

      // Check if modified files exist and alert the user
      const gitBranchHasModifiedFiles = doesBranchContainModifiedFiles(
        gitCurrentStatus
      );
      if (gitBranchHasModifiedFiles) {
        const gitBranchInFront = isBranchInfront(gitCurrentStatus);
        if (gitBranchInFront) {
          //If the branch is not front of current branch, then we need to relay the developer message.
          serverResponse.message =
            "<span class='text-warning'>The update is failing due to local changes been detected. Seems you've committed your files, Thanks for making OctoFarm great! <br><br>" +
            "<b class='text-success'>Override:</b> Will just run a <code>git pull</code> command if you continue.<br><br>" +
            "<b class='text-danger'>Cancel:</b> This option will cancel the update process.<br><br>";
          serverResponse.statusTypeForUser = "warning";
          return serverResponse;
        } else {
          // If the branch has no commits then we can relay the user message.
          serverResponse.message =
            "<span class='text-warning'>The update is failing due to local changes been detected. Please check the file list below for what has been modified. </span><br><br>" +
            "<b class='text-success'>Override:</b> This option will ignore the local changes and run the OctoFarm Update process. (You will lose your changes with this option)<br><br>" +
            "<b class='text-danger'>Cancel:</b> This option will cancel the update process keeping your local changes. No update will run and manual intervention by the user is required. <br><br>";
          serverResponse.statusTypeForUser = "warning";

          gitBranchHasModifiedFiles.forEach((line) => {
            serverResponse.message += `<div class="alert alert-secondary m-1 p-2" role="alert"><i class="fas fa-file"></i> ${line.replace(
              "modified: ",
              ""
            )} </div>`;
          });
          return serverResponse;
        }
      }
    }

    // Branch is not up to date and we do not have any modified files... we can continue.
    await pullLatestRepository(force);

    // Check to see if npm packages are missing and if so install them...
    const missingPackages = await doWeHaveMissingPackages();

    // If we have missing packages alert the user and wait for their response, if response given then install missing deps.
    if (missingPackages) {
      if (!force?.doWeInstallPackages) {
        serverResponse.message =
          "<span class='text-warning'>You have missing dependencies that are required, Do you want to update these? </span><br><br>" +
          "<b class='text-success'>Confirm:</b> This option will install the missing local dependencies and continue the upgrade process<br><br>" +
          "<b class='text-danger'>Cancel:</b> This option will cancel the update process and not install the required dependencies. No update will run and manual intervention by the user is required. <br><br>";
        return serverResponse;
      } else {
        await installMissingNpmDependencies();
      }
    }

    // Everything went well, enjoy the tasty updates!
    serverResponse.haveWeSuccessfullyUpdatedOctoFarm = true;
    serverResponse.statusTypeForUser = "success";
    serverResponse.message =
      "Update command has run successfully, OctoFarm will restart.";
    // Local changes
    return serverResponse;
  }
}

module.exports = { SystemCommands };
