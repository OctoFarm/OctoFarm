const fetch = require("node-fetch");
let patreonData = require("../constants/patreon.constants");
const Logger = require("../handlers/logger");

const logger = new Logger("OctoFarm-Server");

function returnPatreonData() {
  return patreonData || [];
}

async function grabLatestPatreonData() {
  const latestPatreonData = await fetch("https://api.octofarm.net/statistics", {
    method: "GET"
  });
  if (latestPatreonData.status === 200) {
    const getJSON = await latestPatreonData.json();
    patreonData = getJSON.patreons.applicationPledges;

    logger.debug("Successfully grabbed remote patreon data!");
  } else {
    logger.error("Falling back to local patreon data...");
  }
}

module.exports = {
  returnPatreonData,
  grabLatestPatreonData
};
