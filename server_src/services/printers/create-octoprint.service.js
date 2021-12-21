const { systemChecks, tempTriggers } = require("./constants/printer-defaults.constants");
const { PRINTER_STATES } = require("./constants/printer-state.constants");
const { PRINTER_CATEGORIES } = require("./constants/printer-categories.constants");
const { OctoprintApiClientService } = require("../octoprint/octoprint-api-client.service");
const { SettingsClean } = require("../../lib/dataFunctions/settingsClean");
const PrinterDatabaseService = require("./printer-database.service");
const { isEmpty } = require("lodash");
const { checkApiStatusResponse } = require("../../utils/api.utils");
const { acquireWebCamDataFromOP } = require("./utils/printer-data.utils");
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
  // Always OP
  sessionKey = undefined;
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

    //Gather API data...D
    this.initialApiCheckSequence()
      .then((res) => {
        if (!res[0].value) {
          throw new Error(this.printerURL + " Failed global API Key Check");
        }
        if (!res[1].value) {
          throw new Error(this.printerURL + "Failed to acquire user list");
        }
        if (!res[2].value) {
          throw new Error(this.printerURL + "Failed to acquire version data");
        }
      })
      .then(async () => {
        const session = await this.acquireOctoPrintSessionKey();
        if (!session) {
          throw new Error(this.printerURL + " We could not get a session key from OctoPrint!");
        }
        return session;
      })
      .then(async (res) => {
        const fullApiCheck = await this.secondaryApiCheckSequence();
        console.log(fullApiCheck);
      })
      .catch((e) => {
        // Can't auth, printer considered offline!
        console.error(e);
      });
  }

  async initialApiCheckSequence() {
    return await Promise.allSettled([
      this.globalAPIKeyCheck(),
      this.acquireOctoPrintUsersList(),
      this.acquireOctoPrintVersionData()
    ]);
  }

  // Only run this when we've confirmed we can at least get a session key + api responses from OctoPrint
  async secondaryApiCheckSequence() {
    return await Promise.allSettled([
      this.acquireOctoPrintSystemData(),
      this.acquireOctoPrintProfileData(),
      this.acquireOctoPrintStateData(),
      this.acquireOctoPrintSettingsData(),
      this.acquireOctoPrintSystemInfoData(),
      this.acquireOctoPrintPluginsListData(),
      this.acquireOctoPrintUpdatesData(),
      this.acquireOctoPrintFilesData()
    ]);
  }

  async globalAPIKeyCheck() {
    // Compare entered API key to settings API Key...
    const globalAPIKeyCheck = await this.#api.getSettings(true);

    const globalStatusCode = checkApiStatusResponse(globalAPIKeyCheck);

    if (globalStatusCode === 200) {
      //Safe to continue check
      const { api } = await globalAPIKeyCheck.json();

      if (!api) {
        // logger.error(`Settings json does not exist: ${this.printerURL}`);
        return false;
      }
      return api.key !== this.apikey;
    } else {
      // Hard failure as can't contact api
      return false;
    }
  }

  async acquireOctoPrintSessionKey() {
    const passiveLogin = await this.#api.login(true);

    const globalStatusCode = checkApiStatusResponse(passiveLogin);

    if (globalStatusCode === 200) {
      const sessionJson = await passiveLogin.json();

      this.sessionKey = sessionJson.session;

      return this.sessionKey;
    }
  }

  async acquireOctoPrintUsersList(force = false) {
    let usersCheck = await this.#api.getUsers(true);

    const globalStatusCode = checkApiStatusResponse(usersCheck);

    if (globalStatusCode === 200) {
      const userJson = await usersCheck.json();

      const userList = userJson.users;

      // If we have no idea who the user is then
      if (!this?.currentUser || force) {
        if (isEmpty(userList)) {
          //If user list is empty then we can assume that an admin user is only one available.
          //Only relevant for OctoPrint < 1.4.2.
          this.currentUser = "admin";
          this.userList.push(this.currentUser);
          this.#db.update({ currentUser: this.currentUser });
          return true;
        } else {
          //If the userList isn't empty then we need to parse out the users and search for octofarm user.
          for (let u = 0; u < userList.length; u++) {
            const currentUser = userList[u];
            if (currentUser.admin) {
              // Look for OctoFarm user and break, if not use the first admin we find
              if (currentUser.name === "octofarm" || currentUser.name === "OctoFarm") {
                this.currentUser = currentUser.name;
                this.userList.push(currentUser.name);
                this.#db.update({ currentUser: this.currentUser });
                //We only break out here because it's doubtful with a successful connection we need the other users.
                break;
              }
              // If no octofarm user then collect the rest for user choice in ui.
              this.currentUser = currentUser.name;
              this.#db.update({ currentUser: this.currentUser });
              this.userList.push(currentUser.name);
            }
          }
          return true;
        }
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  async acquireOctoPrintVersionData(force = false) {
    if (!this?.octoPrintVersion || force) {
      let versionCheck = await this.#api.getVersion(true);

      const globalStatusCode = checkApiStatusResponse(versionCheck);
      if (globalStatusCode === 200) {
        const { server } = await versionCheck.json();
        this.octoPrintVersion = server;
        this.#db.update({
          octoPrintVersion: server
        });
        return true;
      } else {
        return false;
      }
    } else {
      // Call was skipped as we have data or not forced
      return true;
    }
  }

  async acquireOctoPrintSystemData(force = false) {
    if ((!this?.core && this.core.length === 0) || force) {
      let systemCheck = await this.#api.getSystemCommands(true);

      const globalStatusCode = checkApiStatusResponse(systemCheck);

      if (globalStatusCode === 200) {
        const systemJson = await systemCheck.json();

        this.core = systemJson.core;
        this.#db.update({
          core: systemJson.core
        });

        return true;
      } else {
        return false;
      }
    } else {
      // Call was skipped as we have data or not forced
      return true;
    }
  }

  async acquireOctoPrintProfileData(force = false) {
    if (!this?.profiles || force) {
      let profileCheck = await this.#api.getPrinterProfiles(true);

      const globalStatusCode = checkApiStatusResponse(profileCheck);

      if (globalStatusCode === 200) {
        const { profiles } = await profileCheck.json();
        this.profiles = profiles;
        this.#db.update({
          profiles: profiles
        });
        return true;
      } else {
        return false;
      }
    } else {
      // Call was skipped as we have data or not forced
      return true;
    }
  }

  async acquireOctoPrintStateData(force = false) {
    if (!this?.current || !this?.options || force) {
      let stateCheck = await this.#api.getConnection(true);

      const globalStatusCode = checkApiStatusResponse(stateCheck);

      if (globalStatusCode === 200) {
        const { current, options } = await stateCheck.json();
        this.current = current;
        this.options = options;
        this.#db.update({
          current: current,
          options: options
        });
        return true;
      } else {
        return false;
      }
    } else {
      // Call was skipped as we have data or not forced
      return true;
    }
  }

  async acquireOctoPrintSettingsData(force = true) {
    if (
      !this?.corsCheck ||
      !this?.settingsApi ||
      !this?.settingsFeature ||
      !this?.settingsFolder ||
      !this?.settingsPlugins ||
      !this?.settingsScripts ||
      !this?.settingsSerial ||
      !this?.settingsServer ||
      !this?.settingsSystem ||
      !this?.settingsWebcam ||
      force
    ) {
      let settingsCheck = await this.#api.getSettings(true);

      const globalStatusCode = checkApiStatusResponse(settingsCheck);

      if (globalStatusCode === 200) {
        const { api, feature, folder, plugins, scripts, serial, server, system, webcam } =
          await settingsCheck.json();
        this.corsCheck = api.allowCrossOrigin;
        this.settingsApi = api;
        this.settingsFeature = feature;
        this.settingsFolder = folder;
        this.settingsPlugins = plugins;
        this.settingsScripts = scripts;
        this.settingsSerial = serial;
        this.settingsServer = server;
        this.settingsSystem = system;
        this.settingsWebcam = webcam;

        this.camURL = acquireWebCamDataFromOP(this.camURL, this.printerURL, webcam.streamUrl);

        this.#db.update({
          camURL: this.camURL,
          corsCheck: api.allowCrossOrigin,
          settingsApi: api,
          settingsFeature: feature,
          settingsFolder: folder,
          settingsPlugins: plugins,
          settingsScripts: scripts,
          settingsSerial: serial,
          settingsServer: server,
          settingsSystem: system,
          settingsWebcam: webcam
        });

        //parse webcam check

        return true;
      } else {
        return false;
      }
    } else {
      // Call was skipped as we have data or not forced
      return true;
    }
  }

  async acquireOctoPrintSystemInfoData(force = false) {}

  async acquireOctoPrintPluginsListData(force = false) {}

  async acquireOctoPrintUpdatesData(force = false) {}

  async acquireOctoPrintFilesData(force = false) {}
}

module.exports = {
  OctoPrintPrinter
};
