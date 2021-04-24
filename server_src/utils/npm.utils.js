const util = require("util");
const exec = util.promisify(require("child_process").exec);

async function doWeHaveMissingPackages() {
  const { stdout, stderr } = await exec("npm outdated --production");

  if (stderr) {
    throw `Could not reliably check for outdated npm packages, is npm installed? | ${stderr}`;
  }

  if (stdout) {
    const matchMissingPackages = new RegExp("((.*?)MISSING.*)", "g");
    const missingPackages = stdout.match(matchMissingPackages);
    if (!!missingPackages) {
      return missingPackages.length > 0;
    } else {
      return false;
    }
  }
}

async function installMissingNpmDependencies() {
  const { stdout, stderr } = await exec("npm install --production");

  if (stderr) {
    throw `Could not execute npm install, is npm installed? | ${stderr}`;
  }

  if (stdout) {
    return true;
  }
}

module.exports = {
  doWeHaveMissingPackages,
  installMissingNpmDependencies,
};
