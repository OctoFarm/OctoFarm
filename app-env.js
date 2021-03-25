function ensureEnvPancaked() {
  if (!process.env.npm_package_version) {
    process.env.npm_package_version = require("./package.json").version;
    process.env.PANCAKED = true;
    console.log(`Running OctoFarm version ${process.env.npm_package_version} in non-NPM mode!`);
  }
  else {
    console.log(`Running OctoFarm version ${process.env.npm_package_version} in NPM mode!`);
  }
}

module.exports = {
  ensureEnvPancaked
};