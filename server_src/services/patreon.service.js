const { writeFile } = require("fs");
const fetch = require("node-fetch");
let patreonData = require("../patreon.constants");

function returnPatreonData() {
  return patreonData;
}

async function grabLatestPatreonData() {
  const latestPatreonData = await fetch("https://api.octofarm.net/statistics", {
    method: "GET"
  });
  if (latestPatreonData.status === 200) {
    const getJSON = latestPatreonData.json();
    patreonData = getJSON.patreons.applicationPledges;
  } else {
    console.log("FAILED TO CHECK SERVER FOR PATREON DATA");
  }
}

module.exports = {
  returnPatreonData,
  grabLatestPatreonData
};
