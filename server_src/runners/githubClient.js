const fetch = require("node-fetch");

async function getGithubReleasesPromise() {
  const connected = await fetch("https://google.com", {
    method: "FET",
    cache: "no-cache",
    headers: {"Content-Type": "application/json"},
    referrerPolicy: "no-referrer",
  })
    .then(() => true)
    .catch(() => false);

  if (!connected) {
    return Promise.resolve(null);
  }

  return await fetch(
    "https://api.github.com/repos/octofarm/octofarm/releases",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
    .then((res) => res.json());
}

module.exports = {
  getGithubReleasesPromise
};