const fetch = require("node-fetch");

const Logger = require("../handlers/logger");
const logger = new Logger("OctoFarm-Server");

const DEFAULT_PLUGIN_REPOSITORY = "https://plugins.octoprint.org/plugins.json";
const DEFAULT_PLUGIN_NOTICES = "https://plugins.octoprint.org/notices.json";

let octoPrintPluginList = [];
let octoPrintPluginNoticesList = [];

const updatePluginStore = async function () {
  const latestPluginCall = await fetch(DEFAULT_PLUGIN_REPOSITORY, {
    method: "GET"
  });
  if (latestPluginCall.status === 200) {
    octoPrintPluginList = await latestPluginCall.json();
    logger.debug("Successfully grabbed remote patreon data!");
  } else {
    logger.error("Falling back to local patreon data...");
  }
};

const updatePluginNoticesStore = async function () {
  const latestNoticesCall = await fetch(DEFAULT_PLUGIN_NOTICES, {
    method: "GET"
  });
  if (latestNoticesCall.status === 200) {
    octoPrintPluginNoticesList = await latestNoticesCall.json();
    logger.debug("Successfully grabbed remote patreon data!");
  } else {
    logger.error("Falling back to local patreon data...");
  }
};

const getPluginList = function () {
  return octoPrintPluginList;
};

const getPluginNoticesList = function () {
  return octoPrintPluginNoticesList;
};

module.exports = {
  updatePluginStore,
  updatePluginNoticesStore,
  getPluginNoticesList,
  getPluginList
};
