const Logger = require("../lib/logger.js");
const {getGithubReleasesPromise} = require("./githubClient");

const logger = new Logger("OctoFarm-SoftwareUpdateChecker");
let lastSuccessfulReleaseCheckMoment = null;
let latestReleaseKnown = null;
let lastReleaseCheckFailed = null;
let lastReleaseCheckError = null;
let airGapped = null;
let loadedWithPrereleases = null;
let installedReleaseFound = null;
let notificationReady = false;

/**
 * Connection-safe acquire data about the installed and latest released OctoFarm versions.
 * @param includePrereleases
 * @returns {Promise<*|null>}
 */
async function syncLatestOctoFarmRelease(includePrereleases = false) {
  await getGithubReleasesPromise()
    .then((githubReleases) => {
      airGapped = !githubReleases;
      if (!githubReleases) {
        return Promise.resolve(null);
      } else {
        if (!!githubReleases && githubReleases.length > 0) {
          const latestRelease = githubReleases.find(
            (r) =>
              r.draft === false &&
              (r.prerelease === false || includePrereleases)
          );
          // Whether the package version exists at all - developer at work if not!
          installedReleaseFound = !!githubReleases.find((r) => r.tag_name === process.env.npm_package_version);
          if (!!latestRelease && !!latestRelease.tag_name) {
            delete latestRelease.body;
            delete latestRelease.author;
            loadedWithPrereleases = includePrereleases;
            lastSuccessfulReleaseCheckMoment = new Date();
            lastReleaseCheckFailed = false;
            latestReleaseKnown = latestRelease;
            notificationReady =
              latestRelease.tag_name !== process.env.npm_package_version && !!installedReleaseFound;
          } else if (!latestRelease.tag_name) {
            // Falsy tag_name is very unlikely - probably tests only
            lastReleaseCheckFailed = false;
            notificationReady = false;
          } else {
            lastReleaseCheckFailed = true;
          }
        } else {
          lastReleaseCheckFailed = true;
        }
      }
    })
    .catch((e) => {
      lastReleaseCheckError = e;
      lastReleaseCheckFailed = true;
    });
}

/**
 * Get state of this runner
 * @returns {{airGapped: null, lastReleaseCheckFailed: null, loadedWithPrereleases: null, lastSuccessfulReleaseCheckMoment: null, latestReleaseKnown: null}}
 */
function getLastReleaseSyncState() {
  return {
    latestReleaseKnown,
    lastSuccessfulReleaseCheckMoment,
    lastReleaseCheckFailed,
    loadedWithPrereleases,
    airGapped,
    ...(lastReleaseCheckFailed && {lastReleaseCheckError}),
  };
}

/**
 * Returns a notification message ready to be alerted on frontend, but does not fail without such information.
 * @returns {boolean}
 */
function getUpdateNotificationIfAny() {
  if (notificationReady === true && airGapped !== true) {
    const latestReleaseCheckState = getLastReleaseSyncState();
    return {
      update_available: true,
      installed_release_found: installedReleaseFound,
      message:
        "You can update OctoFarm to the latest version available: " +
        latestReleaseCheckState.latestReleaseKnown.tag_name,
      current_version: process.env.npm_package_version,
      ...latestReleaseCheckState
    };
  } else {
    return {
      update_available: false,
      installed_release_found: installedReleaseFound,
      air_gapped: airGapped,
      current_version: process.env.npm_package_version
    };
  }
}

/**
 * Logs whether a firmware update is ready
 */
function checkReleaseAndLogUpdate() {
  if (!!lastReleaseCheckFailed) {
    logger.error(
      "Cant check release as it was not fetched yet or the last fetch failed. Call and await 'syncLatestOctoFarmRelease' first."
    );
    return;
  }
  const latestRelease = getLastReleaseSyncState().latestReleaseKnown;
  if (!latestRelease || !latestRelease.tag_name) {
    // Tests only, silence it
    return;
  }

  const latestReleaseTag = latestRelease.tag_name;
  if (!installedReleaseFound) {
    console.warn(
      `\x1b[36mAre you a god? A new release ey? Bloody terrific mate!\x1b[0m
    Here's github's latest released: \x1b[32m${latestReleaseTag}\x1b[0m
    Here's your release tag: \x1b[32m${process.env.npm_package_version}\x1b[0m
    Appreciate the hard work, you rock!`
    );
    return;
  }

  if (
    !!process.env.npm_package_version &&
    process.env.npm_package_version !== latestReleaseTag
  ) {
    if (!!airGapped) {
      logger.warn(
        `Installed release: ${process.env.npm_package_version}. Skipping update check (air-gapped/disconnected from internet)`
      );
    } else {
      logger.info(
        `Update available! New version: ${latestReleaseTag} (prerelease: ${latestRelease.prerelease})`
      );
      console.log(
        `Installed release: ${process.env.npm_package_version}. Update available!
      New version: ${latestReleaseTag} (prerelease: ${latestRelease.prerelease})
      Release page: ${latestRelease.html_url}`
      );
    }
  } else if (!process.env.npm_package_version) {
    return logger.error(
      "Cant check release as 'npm_package_version' environment variable is not set. Make sure OctoFarm is run from a 'package.json' or NPM context."
    );
  } else {
    console.log(
      `Installed release: ${process.env.npm_package_version}. You are up to date!`
    );
    return logger.info(
      `Installed release: ${process.env.npm_package_version}. You are up to date!`
    );
  }
}

module.exports = {
  getGithubReleasesPromise,
  syncLatestOctoFarmRelease,
  getUpdateNotificationIfAny,
  getLastReleaseSyncState,
  checkReleaseAndLogUpdate
};
