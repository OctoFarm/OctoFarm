function ensureEnvPancaked() {
  if (!process.env.npm_package_version) {
    process.env.npm_package_version = require("./package.json").version;
    process.env.PANCAKED = true;
    console.log(`Running OctoFarm version ${process.env.npm_package_version} in pan-caked mode!`);
  }
}

module.exports = {
  ensureEnvPancaked
};