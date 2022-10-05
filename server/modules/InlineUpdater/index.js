const githubReleaseChecker = require("./github-client.service");
const octofarmUpdateService = require("./octofarm-update.service");

/**
 * Specifically written this way to enable future support for OctoFarm V2.0...
 * @type {{octofarmUpdateService: {getUpdateNotificationIfAny: function(): boolean, checkReleaseAndLogUpdate: function(): (undefined|void), getGithubReleasesPromise: *, syncLatestOctoFarmRelease: function(*=): Promise<*|null>, getLastReleaseSyncState: function(): {airGapped: null, lastReleaseCheckFailed: null, loadedWithPrereleases: null, lastSuccessfulReleaseCheckMoment: null, latestReleaseKnown: null}}|{getGithubReleasesPromise?: *, syncLatestOctoFarmRelease?: function(*=): Promise<*|null>, getUpdateNotificationIfAny?: function(): boolean, getLastReleaseSyncState?: function(): {airGapped: null, lastReleaseCheckFailed: null, loadedWithPrereleases: null, lastSuccessfulReleaseCheckMoment: null, latestReleaseKnown: null}, checkReleaseAndLogUpdate?: function(): (undefined|void)}, githubReleaseChecker: GithubReleaseChecker}}
 */
module.exports = {
    githubService: githubReleaseChecker,
    updateService: octofarmUpdateService
}

