const fetch = require("node-fetch");
const Logger = require("../handlers/logger");
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");

const logger = new Logger(LOGGER_ROUTE_KEYS.SERVICE_GITHUB_CLIENT);

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

  return await fetch("https://api.github.com/repos/octofarm/octofarm/releases", {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  }).then(async (res) => {
    const data = await res.json();
    logger.debug(`Received ${data.length} releases from github.`);
    return data;
  });
}

module.exports = {
  getGithubReleasesPromise
};
