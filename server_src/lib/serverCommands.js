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

function isGitSync(dir) {
  return fs.existsSync(path.join(dir, ".git"));
}

class SystemCommands {
  static async rebootOctoFarm() {
    let checkForNamedService = false;

    // If we're on pm2, then restart buddy!
    if (isPm2()) {
      try{
        await exec("pm2 restart OctoFarm")
        checkForNamedService = true;
      }catch (e){
        throw "Error with pm2 restart command: " + e;
      }
    }

    if (isNodemon()) {
      try{
        await exec("touch ./app.js")
        checkForNamedService = true;
      }catch(e){
        throw "Error with pm2 restart command: " + e;
      }
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

    // Check to see if current dir contains a git folder... hard fail otherwise.
    let doWeHaveAGitFolder = await isGitSync("./");
    if (!doWeHaveAGitFolder) {
      serverResponse.message =
        "Not a git repository, user intervention required! You will have to re-download OctoFarm and re-unpack it over this directory. Make sure to backup your images folder!";
      throw serverResponse;
    }

    const { stdout, stderr } = await exec("git status");

    if (stderr) {
      serverResponse.message = `Git returned an error, user intervention required | Error: ${stderr}`;
      throw serverResponse;
    }

    if (stdout) {
      // Check if branch has local changes. Return response to user, ask if they'd like to force overwrite the local changes, check for force flag and overwrite local changes..
      // Needs to be skipped when installing packages as git stuff already ran already ran
      if (!force?.doWeInstallPackages) {
        if (!force?.forcePull) {
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
          }
          // Check if branch is already up to date. Nothing to do, return response to user.
          if (
            stdout.includes("Your branch is up-to-date with") ||
            stdout.includes("Your branch is up to date with")
          ) {
            serverResponse.haveWeSuccessfullyUpdatedOctoFarm = false;
            serverResponse.message =
              "OctoFarm is already up to date! Your good to go!";
            serverResponse.statusTypeForUser = "success";
            return serverResponse;
          }
        }
        if (force?.forcePull) {
          // User wants to force the update
          try{
            await exec("git reset --hard")
          }catch(e){
            serverResponse.message = `Could not reset the current repository, user intervention required | Error: ${stderr}`;
            throw serverResponse;
          }
        }
        // All been well, let's pull the update!
        try{
          await exec("git pull")
        }catch(e){
          serverResponse.message = `Could not pull the latest files, user intervention required | Error: ${stderr}`;
          throw serverResponse;
        }
      }

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

      return serverResponse;
    }
  }
}

module.exports = { SystemCommands };
