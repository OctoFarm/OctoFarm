const {execSync} = require('child_process');
const path = require("path");

function isPm2() {
  return 'PM2_HOME' in process.env || 'PM2_JSON_PROCESSING' in process.env || 'PM2_CLI' in process.env;
}

function isNodemon() {
  return 'npm_lifecycle_script' in process.env && process.env.npm_lifecycle_script.includes('nodemon')
}

function isNode() {
  return 'NODE' in process.env;
}

function verifyPackageJsonRequirements(directoryPath) {
  const dirConts = require("fs").readdirSync(directoryPath);
  const hasPackageJson = dirConts.includes("package.json");
  if (!hasPackageJson) {
    console.error(`FAILURE. Could not find 'package.json' in root folder ${directoryPath}`);
    if (isPm2()) {
      console.warn("Removing PM2 service");
      execSync("pm2 delete OctoFarm");
    }
    return false;
  } else {
    console.info("✓ found 'package.json'");
    const packageName = require(path.join(directoryPath, "package.json")).name;
    if (!packageName) {
      console.error("X Could not find 'name' property in package.json file. Aborting OctoFarm.");
      return false;
    } else if (packageName.toLowerCase() !== "octofarm") {
      console.error(`X property 'name' in package.json file didnt equal 'octofarm' (found: ${packageName.toLowerCase()}). Aborting OctoFarm.`);
      return false;
    }
  }
  console.info("✓ Correctly validated octofarm package.json file!");
  return true;
}

module.exports = {
  isPm2,
  isNodemon,
  isNode,
  verifyPackageJsonRequirements
}