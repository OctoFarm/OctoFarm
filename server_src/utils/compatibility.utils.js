const semver = require("semver");

/**
 * OctoPrint's plugin manager has an deprecated API for semver >=1.6.0
 * @param semverString
 */
function checkPluginManagerAPIDeprecation(semverString) {
  return semver.satisfies(semver.coerce(semverString), ">=1.6.0");
}

function checkSystemInfoAPIExistance(semverString) {
  return semver.satisfies(semver.coerce(semverString), ">1.4.2");
}

module.exports = {
  checkPluginManagerAPIDeprecation,
  checkSystemInfoAPIExistance
};
