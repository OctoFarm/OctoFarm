const { systemChecks, tempTriggers } = require("./constants/printer-defaults.constants");
const { PRINTER_STATES } = require("./constants/printer-state.constants");
const { PRINTER_CATEGORIES } = require("./constants/printer-categories.constants");
const { OctoprintApiClientService } = require("../octoprint/octoprint-api-client.service");
const { SettingsClean } = require("../../lib/dataFunctions/settingsClean");

class OctoPrintPrinter {
  //OctoFarm state
  disabled = false;
  //Communications
  #api = undefined;
  #ws = undefined;
  //Required
  sortIndex = undefined;
  category = undefined;
  printerURL = undefined;
  apikey = undefined;
  webSocketURL = undefined;
  camURL = undefined;
  settingsAppearance = undefined;
  // Always database
  _id = undefined;
  // Always default
  systemChecks = systemChecks;
  //Overridden by database
  dateAdded = new Date().getTime();
  alerts = null;
  currentIdle = 0;
  currentActive = 0;
  currentOffline = 0;
  selectedFilament = [];
  tempTriggers = tempTriggers;
  feedRate = 100;
  flowRate = 100;
  group = "";
  //Live printer state data

  //Updated by API / database
  costSettings = null;
  powerSettings = null;
  klipperFirmware = undefined;
  octoPrintVersion = undefined;
  storage = undefined;
  current = undefined;
  options = undefined;
  profiles = undefined;
  pluginsList = undefined;
  octoPrintUpdate = undefined;
  octoPrintPluginUpdates = undefined;
  corsCheck = undefined;
  settingsApi = undefined;
  settingsFeature = undefined;
  settingsFolder = undefined;
  settingsPlugins = undefined;
  settingsScripts = undefined;
  settingsSerial = undefined;
  settingsServer = undefined;
  settingsSystem = undefined;
  settingsWebcam = undefined;
  core = undefined;
  constructor(printer) {
    const {
      disabled,
      dateAdded,
      alerts,
      currentIdle,
      currentActive,
      currentOffline,
      selectedFilament,
      octoPrintVersion,
      tempTriggers,
      feedRate,
      flowRate,
      group,
      costSettings,
      powerSettings,
      klipperFirmware,
      storage,
      current,
      options,
      profiles,
      pluginsList,
      octoPrintUpdate,
      octoPrintPluginUpdates,
      corsCheck,
      settingsApi,
      settingsFeature,
      settingsFolder,
      settingsPlugins,
      settingsScripts,
      settingsSerial,
      settingsServer,
      settingsSystem,
      settingsWebcam,
      core,
      _id,
      sortIndex,
      settingsAppearance,
      category,
      apikey,
      printerURL,
      webSocketURL,
      camURL
    } = printer;
    if (!_id || isNaN(sortIndex) || !apikey || !printerURL || !webSocketURL || !settingsAppearance)
      throw new Error("Missing params!");

    // Shim because categories don't exist prior to V1.2
    if (!category) {
      this.category = PRINTER_CATEGORIES.OCTOPRINT;
    }
    // Another shim for disabled prop, doesn't exist prioir to V1.2
    if (typeof disabled !== "boolean") {
      this.disabled = false;
    }

    // this = { ...PRINTER_STATES.SETTING_UP }
    this.dateAdded = dateAdded;
    this.alerts = alerts;
    this.currentIdle = currentIdle;
    this.currentActive = currentActive;
    this.currentOffline = currentOffline;
    this.selectedFilament = selectedFilament;
    this.octoPrintVersion = octoPrintVersion;
    this.tempTriggers = tempTriggers;
    this.feedRate = feedRate;
    this.flowRate = flowRate;
    this.group = group;
    this.costSettings = costSettings;
    this.powerSettings = powerSettings;
    this.klipperFirmware = klipperFirmware;
    this.octoPrintVersion = octoPrintVersion;
    this.storage = storage;
    this.current = current;
    this.options = options;
    this.profiles = profiles;
    this.pluginsList = pluginsList;
    this.octoPrintUpdate = octoPrintUpdate;
    this.octoPrintPluginUpdates = octoPrintPluginUpdates;
    this.corsCheck = corsCheck;
    this.settingsApi = settingsApi;
    this.settingsFeature = settingsFeature;
    this.settingsFolder = settingsFolder;
    this.settingsPlugins = settingsPlugins;
    this.settingsScripts = settingsScripts;
    this.settingsSerial = settingsSerial;
    this.settingsServer = settingsServer;
    this.settingsSystem = settingsSystem;
    this.settingsWebcam = settingsWebcam;
    this.core = core;
    this._id = _id;
    this.settingsAppearance = settingsAppearance;
    this.sortIndex = sortIndex;
    this.category = category;
    this.printerURL = printerURL;
    this.webSocketURL = webSocketURL;
    this.camURL = camURL;

    // console.log(this);
    console.log(SettingsClean.returnSystemSettings());
    //Create OctoPrint Client
    this.#api = new OctoprintApiClientService(printerURL, apikey);
    console.log(this.#api);
    //Create Websocket Client
    this.#ws = "";
    //Run First Scan / Update Scan

    //Connect Websocket and keep alive
  }
}

module.exports = {
  OctoPrintPrinter
};
