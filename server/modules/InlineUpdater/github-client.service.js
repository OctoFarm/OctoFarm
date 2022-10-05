const fetch = require("node-fetch");
const { getGithubTokenIfAvailable } = require("../../app-env")
const Logger = require("../../handlers/logger");
const { LOGGER_ROUTE_KEYS } = require("../../constants/logger.constants");

const logger = new Logger(LOGGER_ROUTE_KEYS.SERVICE_GITHUB_CLIENT);

let githubReleaseCheckerCache;

class GithubReleaseChecker{
  #github_token;
  #release_url = "https://api.github.com/repos/octofarm/octofarm/releases";
  #latest_version;
  #release_notes;

  constructor(token = undefined) {
    if(!!token){
      this.#github_token = token
    }
  }

  get releaseURL(){
    return this.#release_url
  }
}

if(!githubReleaseCheckerCache){
  githubReleaseCheckerCache = new GithubReleaseChecker(getGithubTokenIfAvailable());
}

async function getGithubReleasesPromise() {
  return await fetch(githubReleaseCheckerCache.releaseURL(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  }).then(async (res) => {
    const data = await res.json();
    console.log(data)
    logger.debug(`Received ${data.length} releases from github.`);
    return data;
  });
}

module.exports = githubReleaseCheckerCache;
