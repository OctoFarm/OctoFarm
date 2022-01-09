const semver = require("semver");

/**
 * OctoPrint's plugin manager has an deprecated API for semver >=1.6.0
 * @param semverString
 */
function checkPluginManagerAPIDeprecation(semverString) {
  return semver.satisfies(semver.coerce(semverString), ">=1.6.0");
}
/**
 * System info didn't exist until after version 1.4.2
 * @param semverString
 */
function checkSystemInfoAPIExistance(semverString) {
  return semver.satisfies(semver.coerce(semverString), ">1.4.2");
}
/**
 * OctoFarm does not support anything below v1.4.0. (This will always be 3 versions behind OP latest, currently 1.7.2)
 * @param semverString
 */
function checkLowestSupportedOctoPrint(semverString) {
  return semver.satisfies(semver.coerce(semverString), ">1.4.0");
}
/**
 * OctoFarm does not support anything below v1.4.0. (This will always be 3 versions behind OP latest, currently 1.7.2)
 * @param semverString
 */
function checkHighestSupportedOctoPrint(semverString) {
  return semver.satisfies(semver.coerce(semverString), ">1.7.2");
}
module.exports = {
  checkPluginManagerAPIDeprecation,
  checkSystemInfoAPIExistance,
  checkLowestSupportedOctoPrint,
  checkHighestSupportedOctoPrint
};
