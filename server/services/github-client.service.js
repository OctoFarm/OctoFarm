const fetch = require("node-fetch");
const Logger = require("../handlers/logger");
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");
const { AppConstants } = require("../constants/app.constants");
const currentServerVersion = process.env[AppConstants.VERSION_KEY];
const marked = require("marked");

const logger = new Logger(LOGGER_ROUTE_KEYS.SERVICE_GITHUB_CLIENT);

let latestReleaseNotes = {};

async function getGithubReleasesPromise() {
  const connected = await fetch("https://github.com", {
    method: "GET",
    cache: "no-cache",
    headers: { "Content-Type": "application/json" },
    referrerPolicy: "no-referrer"
  })
    .then(() => true)
    .catch(() => false);

  if (!connected) {
    return Promise.resolve(null);
  }

  return fetch("https://api.github.com/repos/octofarm/octofarm/releases", {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  }).then(async (res) => {
    const data = await res.json();
    saveLatestReleaseNotes(data);
    logger.debug(`Received ${data.length} releases from github.`);
    return data;
  });
}

const saveLatestReleaseNotes = (releases) => {
  if (releases?.message) {
    if (releases.message.includes("API rate limit")) {
      latestReleaseNotes = {
        name: "API Rate Limit Exceeded",
        body: "API Rate limit has been exceeded for your IP... unable to grab release notes!"
      };
      return;
    }
  }

  const filteredReleaseNotes = releases.filter((release) =>
    release.tag_name.includes(currentServerVersion)
  );

  latestReleaseNotes = {
    name: filteredReleaseNotes[0].name,
    body: marked.parse(filteredReleaseNotes[0].body)
  };
};

const getLatestReleaseNotes = () => {
  return latestReleaseNotes;
};

module.exports = {
  getGithubReleasesPromise,
  getLatestReleaseNotes
};
