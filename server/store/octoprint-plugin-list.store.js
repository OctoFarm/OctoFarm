const fetch = require('node-fetch');
const { LOGGER_ROUTE_KEYS } = require('../constants/logger.constants');
const Logger = require('../handlers/logger');
const logger = new Logger(LOGGER_ROUTE_KEYS.OP_STORE_PLUGIN_LIST);

const DEFAULT_PLUGIN_REPOSITORY = 'https://plugins.octoprint.org/plugins.json';
const DEFAULT_PLUGIN_NOTICES = 'https://plugins.octoprint.org/notices.json';

let octoPrintPluginList = [];
let octoPrintPluginNoticesList = [];

const updatePluginStore = async function () {
  const latestPluginCall = await fetch(DEFAULT_PLUGIN_REPOSITORY, {
    method: 'GET',
  });
  if (latestPluginCall.status === 200) {
    octoPrintPluginList = await latestPluginCall.json();
    logger.debug('Successfully plugin data from OctoPrint.org!');
  } else {
    logger.error('Failed to grab plugin data from OctoPrint.org! Disabling');
  }
};

const updatePluginNoticesStore = async function () {
  const latestNoticesCall = await fetch(DEFAULT_PLUGIN_NOTICES, {
    method: 'GET',
  });
  if (latestNoticesCall.status === 200) {
    octoPrintPluginNoticesList = await latestNoticesCall.json();
    logger.debug('Successfully notices data from OctoPrint.org!');
  } else {
    logger.error('Failed to grab notices data from OctoPrint.org! Disabling');
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
  getPluginList,
};
