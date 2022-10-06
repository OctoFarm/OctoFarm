const fetch = require("node-fetch");
const { getGithubTokenIfAvailable } = require("../../app-env")
const { onlineChecker } = require("../OnlineChecker/index")
const semver = require("semver");
const Logger = require("../../handlers/logger");
const { LOGGER_ROUTE_KEYS } = require("../../constants/logger.constants");

const logger = new Logger(LOGGER_ROUTE_KEYS.SERVICE_GITHUB_CLIENT);

let githubReleaseCheckerCache;

class GithubReleaseChecker{
  #github_token = null;
  #release_url = "https://api.github.com/repos/octofarm/octofarm/releases";
  #latest_version = null;
  #latest_release_notes = [];
  #latest_asset_url = null;
  #other_relevant_release_notes = [];
  #rate_limited = false;
  #pre_release = false;

  constructor(token = undefined) {
    if(!!token){
      this.#github_token = token
    }
  }

  #checkReleaseNoteVersionsAreWanted(releases){

  }

  async #getGithubReleasesPromise() {
    //TODO add in token usage if exists
    return fetch(this.#release_url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
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
    this.#checkReleaseNoteVersionsAreWanted(releases)
    const latestRelease = releases.find(
        (r) =>
            r.draft === false &&
            (r.prerelease === false || this.#pre_release)
    );
    this.#latest_version = latestRelease.tag_name
    this.#latest_release_notes = latestRelease.body;

  }

  async requestGithubReleaseData(){
    if(onlineChecker.airGapped){
      logger.error("Skipping github release check due to air gapped farm!")
      return;
    }
    const releaseData = await this.#getGithubReleasesPromise();
    this.#parseLatestGithubRelease(releaseData);


  }

  get releaseURL(){
    return this.#release_url
  }

  get releaseInformation(){
    return {
      latest_version: this.#latest_version,
      latest_release_notes: this.#latest_release_notes,
      latest_asset_url: this.#latest_asset_url,
      other_relevant_release_notes: this.#other_relevant_release_notes
    }
  }
}

if(!githubReleaseCheckerCache){
  githubReleaseCheckerCache = new GithubReleaseChecker(getGithubTokenIfAvailable());
}



module.exports = githubReleaseCheckerCache;
