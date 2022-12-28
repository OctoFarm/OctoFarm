const fetch = require("node-fetch");
const { getGithubTokenIfAvailable } = require("../../app-env")
const { downloadGitZip } = require("../../utils/download.util");
const { onlineChecker } = require("../OnlineChecker/index")
const semver = require("semver");
const marked = require("marked");
const Logger = require("../../handlers/logger");
const { AppConstants } = require("../../constants/app.constants.js");
const { LOGGER_ROUTE_KEYS } = require("../../constants/logger.constants");
const { join } = require("path");
const fs = require('fs');

const logger = new Logger(LOGGER_ROUTE_KEYS.SERVICE_GITHUB_CLIENT);

let githubReleaseCheckerCache;

class GithubReleaseChecker{
  #current_version = process.env[AppConstants.VERSION_KEY];
  #github_token = null;
  #release_url = "https://api.github.com/repos/octofarm/octofarm/releases";
  #latest_version = null;
  #latest_release_notes = null;
  #latest_asset_url = null;
  #other_relevant_release_notes = [];
  #rate_limited = false;
  #pre_release = false;
  #default_request_headers = {"Content-Type": "application/json"};
  #zip_download_path = '../updater/octofarm.zip';

  constructor(token = undefined, pre_release = undefined) {
    if(!!token){
      this.#github_token = token
      this.#default_request_headers["Authorization"] = `token ${this.#github_token}`
    }
    if(!!pre_release){
      this.#pre_release = pre_release;
    }
  }

  #checkAndParseWantedReleaseNotes(releases){
    const filteredReleaseNotes = releases.filter((release) => semver.satisfies(release.tag_name, "< " + this.#current_version.replace("-beta.10", ""), {
          includePrerelease: true
        }));
    const latestRelease = releases.find(
        (r) =>
            r.draft === false &&
            (r.prerelease === false || this.#pre_release)
    );
    this.#latest_version = latestRelease.tag_name
    this.#latest_release_notes = marked.parse(latestRelease.body);
    this.#latest_asset_url = filteredReleaseNotes[0].assets[0]?.browser_download_url;

    for (const release of filteredReleaseNotes) {
      this.#other_relevant_release_notes.push({
        name: release.name,
        body: marked.parse(release.body)
      });
    }
  }

  async #getGithubReleasesPromise() {
    return fetch(this.#release_url, {
      method: "GET",
      headers: this.#default_request_headers
    }).then(async (res) => {
      const data = await res.json();
      logger.info(`Received ${data.length} releases from github.`);
      return data;
    }).catch(e => {
      logger.error("Unable to contact github...", e.toString());
      return [];
    });
  }

  #parseLatestGithubRelease(releases) {
    if(this.#isAPILimitReached(releases)){
      logger.error("Github Api limit has been reached!")
      return;
    }
    this.#checkAndParseWantedReleaseNotes(releases)
  }

  #isAPILimitReached(releases) {
    if (!Array.isArray(releases) && releases?.message) {
      if (releases.message.includes("API rate limit")) {
        this.#rate_limited = true;
        this.#latest_version = "API Rate Limit Exceeded!"
        this.#latest_release_notes = "API Rate limit has been exceeded for your IP... unable to grab release notes."
        return true;
      }
      if (releases.message.includes("Bad credentials")) {
        this.#rate_limited = true;
        this.#latest_version = "Bad Github Token Supplied!"
        this.#latest_release_notes = "You have supplied an incorrect github token... please update with the correct one and restart."
        return true;
      }
      logger.error("Unknown github error message!", releases)
      return true;
    }
    return false;
  };

  async requestGithubReleaseData(){
    if(onlineChecker.airGapped){
      logger.error("Skipping github release check due to air gapped farm!")
      return;
    }
    this.#parseLatestGithubRelease(await this.#getGithubReleasesPromise());
  }

  get releaseInformation(){
    return {
      latest_version: this.#latest_version,
      latest_release_notes: this.#latest_release_notes,
      latest_asset_url: this.#latest_asset_url,
      other_relevant_release_notes: this.#other_relevant_release_notes
    }
  }

  async startUpdateProcess(){
    const { spawn } = require('child_process');
    const subprocess = spawn('node', [`${join(__dirname, "../../../" ,"updater", "updater.process.js")}`], {
      detached: true,
      stdio: [ 'ignore' ]
    });
    subprocess.unref();
  }

  async downloadLatestReleaseZip(){
    return this.startUpdateProcess();
    //return downloadGitZip(this.#latest_asset_url, this.#zip_download_path, { "Authorization": this.#default_request_headers["Authorization"] }, this.startUpdateProcess);
  }
}

if(!githubReleaseCheckerCache){
  githubReleaseCheckerCache = new GithubReleaseChecker(getGithubTokenIfAvailable());
}



module.exports = githubReleaseCheckerCache;
