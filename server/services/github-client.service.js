const fetch = require("node-fetch");
const Logger = require("../handlers/logger");
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");
const { AppConstants } = require("../constants/app.constants");
const { fetchClientVersion } = require("../app-env");
const currentServerVersion = process.env[AppConstants.VERSION_KEY];
const currentClientVersion = fetchClientVersion();
const marked = require("marked");
const semver = require("semver");

const logger = new Logger(LOGGER_ROUTE_KEYS.SERVICE_GITHUB_CLIENT);

let latestReleaseNotes = {};
let futureReleaseNotes = [];

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
    saveFutureReleaseNotes(data);
    logger.debug(`Received ${data.length} releases from github.`);
    return data;
  });
}

const isAPILimitReached = (releases) => {
  if (releases?.message) {
    if (releases.message.includes("API rate limit")) {
      latestReleaseNotes = {
        name: "API Rate Limit Exceeded",
        body: "API Rate limit has been exceeded for your IP... unable to grab release notes!"
      };
      return true;
    }
  }
  return false;
};

const saveFutureReleaseNotes = (releases) => {
  if (isAPILimitReached(releases)) {
    return false;
  }
  const filteredReleaseNotes = releases.filter((release) =>
    semver.satisfies(release.tag_name, "> " + currentServerVersion)
  );

  for (const release of filteredReleaseNotes) {
    futureReleaseNotes.push({
      name: release.name,
      body: marked.parse(release.body)
    });
  }
};

const saveLatestReleaseNotes = (releases) => {
  if (isAPILimitReached(releases)) {
    return false;
  }

  const filteredReleaseNotes = releases.filter(
    (release) => release.tag_name === currentServerVersion
  );

  const clientFilteredReleaseNotes = releases.filter(
    (release) => release.tag_name === `client-${currentClientVersion}`
  );

  latestReleaseNotes = {
    client: {
      name: clientFilteredReleaseNotes[0].name,
      body: marked.parse(clientFilteredReleaseNotes[0].body)
    },
    server: {
      name: filteredReleaseNotes[0].name,
      body: marked.parse(filteredReleaseNotes[0].body)
    }

  };
};

const getLatestReleaseNotes = () => {
  return latestReleaseNotes;
};

const getFutureReleaseNote = () => {
  return futureReleaseNotes;
};

module.exports = {
  getGithubReleasesPromise,
  getLatestReleaseNotes,
  getFutureReleaseNote
};
