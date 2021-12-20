const { systemChecks, tempTriggers } = require("./constants/printer-defaults.constants");
const { PRINTER_STATES } = require("./constants/printer-state.constants");
const { PRINTER_CATEGORIES } = require("./constants/printer-categories.constants");
const { OctoprintApiClientService } = require("../octoprint/octoprint-api-client.service");
const { SettingsClean } = require("../../lib/dataFunctions/settingsClean");
const PrinterDatabaseService = require("./printer-database.service");
const { isEmpty } = require("lodash");

class OctoPrintPrinter {
  //OctoFarm state
  disabled = false;
  //Communications
  #api = undefined;
  #ws = undefined;
  #db = undefined;
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
  userList = [];
  currentUser = null;
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
      _id,
      sortIndex,
      settingsAppearance,
      category,
      apikey,
      printerURL,
      webSocketURL,
      camURL,
      dateAdded,
      alerts,
      currentIdle,
      currentActive,
      currentOffline,
      currentUser,
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
      core
    } = printer;
    if (!_id || isNaN(sortIndex) || !apikey || !printerURL || !webSocketURL || !settingsAppearance)
      throw new Error("Missing params!");

    // Shim because categories don't exist prior to V1.2
    if (!category) {
      this.category = PRINTER_CATEGORIES.OCTOPRINT;
    }
    // Another shim for disabled prop, doesn't exist prior to V1.2
    if (typeof disabled !== "boolean") {
      this.disabled = false;
    }

    // this = { ...PRINTER_STATES.SETTING_UP }
    this.currentUser = currentUser;
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
    this._id = _id.toString();
    this.settingsAppearance = settingsAppearance;
    this.sortIndex = sortIndex;
    this.category = category;
    this.printerURL = printerURL;
    this.webSocketURL = webSocketURL;
    this.camURL = camURL;
    const { timeout } = SettingsClean.returnSystemSettings();

    //Create OctoPrint Client
    this.#api = new OctoprintApiClientService(printerURL, apikey, timeout);

    //Create Websocket Client
    this.#ws = "";

    this.#db = new PrinterDatabaseService(this._id);

    //Gather API data...
    this.apiConnectionSequence().then(res => {
      console.log(res)
    }).catch(e => {
      // Can't auth, printer considered offline!
      console.error(e)
    })
    //Check we have correct API Key

    //Connect Websocket and keep alive
  }

  createPrinterDatabaseRecord() {

  }

  async apiConnectionSequence(){
    return await Promise.allSettled([this.globalAPIKeyCheck(), this.acquireOctoPrintUsersList()]);
  }

  async authenticateOctoPrintsWebsocket(){
    return true
  }

  async acquireOctoPrintUsersList (force = false){
    let usersCheck = await this.#api.getUsers(true);

    const globalStatusCode = usersCheck?.status
        ? usersCheck?.status
        : " Connection timeout reached...";

    if(globalStatusCode === 200){
      const userJson = await usersCheck.json();
      const userList = userJson.users;

        // If we have no idea who the user is then
        if(this.currentUser === null || force){
          if (isEmpty(userList)) {
            //If user list is empty then we can assume that an admin user is only one available.
            //Only relevant for OctoPrint < 1.4.2.
            this.currentUser = "admin";
            this.userList.push(this.currentUser);
            this.#db.update({currentUser: this.currentUser});
          }else{
            //If the userList isn't empty then we need to parse out the users and search for octofarm user.
            for(let u = 0; u < userList.length; u++){
              const currentUser = userList[u];
              if(currentUser.admin) {
                // Look for OctoFarm user and break, if not use the first admin we find
                if (currentUser.name === "octofarm" || currentUser.name === "OctoFarm") {
                  this.currentUser = currentUser.name;
                  this.userList.push(currentUser.name);
                  this.#db.update({currentUser: this.currentUser});
                  //We only break out here because it's doubtful with a successful connection we need the other users.
                  break;
                }
                // If no octofarm user then collect the rest for user choice in ui.
                this.currentUser = currentUser.name;
                this.#db.update({currentUser: this.currentUser});
                this.userList.push(currentUser.name);
              }
            }
          }
      }else{
        return true
      }
    }else{
      return false;
    }
  }

  async globalAPIKeyCheck() {
    // Compare entered API key to settings API Key...
    const globalAPIKeyCheck = await this.#api.getSettings(true);

    const globalStatusCode = globalAPIKeyCheck?.status
        ? globalAPIKeyCheck?.status
        : " Connection timeout reached...";

    if (globalStatusCode === 200) {
      //Safe to continue check
      const settingsData = await globalAPIKeyCheck.json();

      if (!settingsData) {
        // logger.error(`Settings json does not exist: ${this.printerURL}`);
        return false;
      }
      if (!settingsData.api) {
        // logger.error(`API key does not exist: ${this.printerURL}`);
        return false;
      }
      if (settingsData.api.key === this.apikey) {
        // logger.error(`API Key matched global API key: ${this.printerURL}`);
        return false;
      }

      return true;
    } else {
      // Hard failure as can't contact api
      return false;
    }
  }
}

module.exports = {
  OctoPrintPrinter
};
