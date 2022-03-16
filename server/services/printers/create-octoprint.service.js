const {
  systemChecks,
  tempTriggersDefaults,
  ALLOWED_SYSTEM_CHECKS
} = require("./constants/printer-defaults.constants");
const { PRINTER_STATES, CATEGORIES } = require("./constants/printer-state.constants");
const { OctoprintApiClientService } = require("../octoprint/octoprint-api-client.service");
const { SettingsClean } = require("../settings-cleaner.service");
const PrinterDatabaseService = require("./printer-database.service");
const { isEmpty, assign, findIndex } = require("lodash");
const { checkApiStatusResponse } = require("../../utils/api.utils");
const {
  acquireWebCamData,
  acquirePrinterFilesAndFolderData
} = require("../octoprint/utils/printer-data.utils");
const {
  testAndCollectCostPlugin,
  testAndCollectPSUControlPlugin
} = require("../octoprint/utils/octoprint-plugin.utils");
const {
  checkSystemInfoAPIExistance,
  checkHighestSupportedOctoPrint,
  checkLowestSupportedOctoPrint
} = require("../../utils/compatibility.utils");
const softwareUpdateChecker = require("../../services/octofarm-update.service");
const WebSocketClient = require("../octoprint/octoprint-websocket-client.service");
const { handleMessage } = require("../octoprint/octoprint-websocket-message.service");
const { PrinterTicker } = require("../printer-connection-log.service");
const { FileClean } = require("../file-cleaner.service");
const Logger = require("../../handlers/logger");
const { PrinterClean } = require("../printer-cleaner.service");
const printerModel = require("../../models/Printer");
const { join } = require("path");
const { statSync } = require("fs");

const logger = new Logger("OctoFarm-State");

class OctoPrintPrinter {
  //OctoFarm state
  disabled = false;
  display = true;
  #retryNumber = 0;
  multiUserIssue = undefined;
  restartRequired = false;
  coolDownEvent = undefined;
  versionNotSupported = false;
  versionNotChecked = false;
  healthChecksPass = true;
  //Communications
  #api = undefined;
  #ws = undefined;
  #db = undefined;
  #apiRetry = undefined;
  #printerStatistics = undefined;
  timeout = undefined;
  #reconnectTimeout = undefined;
  reconnectingIn = 0;
  websocketReconnectingIn = 0;
  //Required
  sortIndex = undefined;
  category = undefined;
  printerURL = undefined;
  apikey = undefined;
  webSocketURL = undefined;
  camURL = "";
  settingsAppearance = undefined;
  // Always database
  _id = undefined;
  // Always default
  systemChecks = systemChecks();
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
  tempTriggers = tempTriggersDefaults();
  feedRate = 100;
  flowRate = 100;
  stepRate = 10;
  group = "";
  printerName = undefined;
  //Live printer state data
  layerData = undefined;
  resends = undefined;
  tools = undefined;
  currentJob = undefined;
  currentZ = undefined;
  currentProfile = undefined;
  currentConnection = undefined;
  connectionOptions = undefined;
  terminal = [];

  //Updated by API / database
  octoPi = undefined;
  costSettings = {
    powerConsumption: 0.5,
    electricityCosts: 0.15,
    purchasePrice: 500,
    estimateLifespan: 43800,
    maintenanceCosts: 0.25
  };
  powerSettings = {
    powerOnCommand: "",
    powerOnURL: "",
    powerOffCommand: "",
    powerOffURL: "",
    powerToggleCommand: "",
    powerToggleURL: "",
    powerStatusCommand: "",
    powerStatusURL: "",
    wol: {
      enabled: false,
      ip: "255.255.255.0",
      packets: "3",
      port: "9",
      interval: "100",
      MAC: ""
    }
  };
  klipperFirmwareVersion = undefined;
  printerFirmware = undefined;
  octoPrintVersion = undefined;
  storage = undefined;
  current = undefined;
  options = undefined;
  profiles = undefined;
  pluginListEnabled = undefined;
  pluginsListDisabled = undefined;
  octoPrintUpdate = undefined;
  octoPrintPluginUpdates = undefined;
  corsCheck = true;
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
  octoPrintSystemInfo = undefined;

  //Processed Information from cleaners
  hostState = undefined;
  printerState = undefined;
  webSocketState = undefined;
  order = undefined;
  gcodeScripts = undefined;
  otherSettings = PrinterClean.sortOtherSettings(
    this.tempTriggers,
    this.settingsWebcam,
    this.settingsServer
  );

  constructor(printer) {
    if (
      Number.isNaN(printer?.sortIndex) ||
      !printer?.apikey ||
      !printer?.printerURL ||
      !printer?.webSocketURL ||
      !printer?.settingsAppearance
    )
      throw new Error(
        "Missing params! params:" +
          JSON.stringify({
            sortIndex: printer?.sortIndex,
            apikey: printer?.apikey,
            printerURL: printer?.printerURL,
            webSocketURL: printer?.webSocketURL,
            settingsAppearance: printer?.settingsAppearance
          })
      );
    this.sortIndex = printer.sortIndex;
    // Old cleaner patching
    this.order = printer.sortIndex;
    this.apikey = printer.apikey;
    this.printerURL = printer.printerURL;
    this.webSocketURL = printer.webSocketURL;
    this.camURL = printer.camURL;
    this.category = printer.category;
    this.group = printer.group;
    this.settingsAppearance = printer.settingsAppearance;
    if (!!printer?._id) {
      this.#updatePrinterRecordsFromDatabase(printer);
    }
    this.setAllPrinterStates(PRINTER_STATES().SETTING_UP);
    this.#updatePrinterSettingsFromDatabase();
  }

  #updatePrinterRecordsFromDatabase(printer) {
    const {
      disabled,
      _id,
      settingsAppearance,
      dateAdded,
      alerts,
      currentIdle,
      currentActive,
      currentOffline,
      currentUser,
      selectedFilament,
      octoPrintVersion,
      octoPi,
      tempTriggers,
      feedRate,
      flowRate,
      group,
      costSettings,
      powerSettings,
      klipperFirmwareVersion,
      storage,
      fileList,
      current,
      options,
      profiles,
      pluginsListEnabled,
      pluginsListDisabled,
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
      octoPrintSystemInfo,
      printerFirmware
    } = printer;
    this._id = _id.toString();
    //Only update the below if received from database, otherwise is required from scans.
    if (!!currentUser) {
      this.currentUser = currentUser;
    }
    if (!!dateAdded) {
      this.dateAdded = dateAdded;
    }
    if (!!alerts) {
      this.alerts = alerts;
    }
    if (!!currentIdle) {
      this.currentIdle = currentIdle;
    }
    if (!!currentActive) {
      this.currentActive = currentActive;
    }
    if (!!currentOffline) {
      this.currentOffline = currentOffline;
    }
    if (!!selectedFilament) {
      this.selectedFilament = selectedFilament;
    }
    if (!!octoPrintVersion) {
      this.octoPrintVersion = octoPrintVersion;
    }
    if (!!tempTriggers) {
      this.tempTriggers = tempTriggers;
    }
    if (!!feedRate) {
      this.feedRate = feedRate;
    }
    if (!!flowRate) {
      this.flowRate = flowRate;
    }
    if (!!group) {
      this.group = group;
    }
    if (!!costSettings) {
      this.costSettings = costSettings;
    }
    if (!!powerSettings) {
      this.powerSettings = powerSettings;
    }
    if (!!klipperFirmwareVersion) {
      this.klipperFirmwareVersion = klipperFirmwareVersion;
    }
    if (!!storage) {
      this.storage = storage;
    }
    if (!!current) {
      this.current = current;
    }
    if (!!options) {
      this.options = options;
    }
    if (!!profiles) {
      this.profiles = profiles;
    }
    if (!!pluginsListEnabled) {
      this.pluginsListEnabled = pluginsListEnabled;
    }
    if (!!pluginsListDisabled) {
      this.pluginsListDisabled = pluginsListDisabled;
    }

    if (!!octoPrintUpdate) {
      this.octoPrintUpdate = octoPrintUpdate;
    }
    if (!!octoPrintPluginUpdates) {
      this.octoPrintPluginUpdates = octoPrintPluginUpdates;
    }
    if (!!corsCheck) {
      this.corsCheck = corsCheck;
    }
    if (!!settingsApi) {
      this.settingsApi = settingsApi;
    }
    if (!!settingsFeature) {
      this.settingsFeature = settingsFeature;
    }
    if (!!settingsFolder) {
      this.settingsFolder = settingsFolder;
    }
    if (!!settingsPlugins) {
      this.settingsPlugins = settingsPlugins;
    }
    if (!!settingsScripts) {
      this.settingsScripts = settingsScripts;
    }
    if (!!settingsSerial) {
      this.settingsSerial = settingsSerial;
    }
    if (!!settingsServer) {
      this.settingsServer = settingsServer;
    }
    if (!!settingsSystem) {
      this.settingsSystem = settingsSystem;
    }
    if (!!settingsWebcam) {
      this.settingsWebcam = settingsWebcam;
    }
    if (!!settingsSerial) {
      this.settingsSerial = settingsSerial;
    }
    if (!!core) {
      this.core = core;
    }
    if (typeof disabled === "boolean") {
      this.disabled = disabled;
    }
    if (!!octoPi) {
      this.octoPi = octoPi;
    }

    if (!!octoPrintSystemInfo) {
      this.octoPrintSystemInfo = octoPrintSystemInfo;
    }

    if (!!printerFirmware) {
      this.printerFirmware = printerFirmware;
    }
    if (!!fileList) {
      this.fileList = FileClean.generate(
        {
          files: fileList.files,
          filecount: fileList.files.length,
          folders: fileList.folders,
          folderCount: fileList.folders.length
        },
        this.selectedFilament,
        this.costSettings
      );
    }

    if (!!profiles && !!current) {
      this.currentProfile = PrinterClean.sortProfile(profiles, current);
    }

    if (!!current) {
      this.currentConnection = PrinterClean.sortConnection(current);
    }

    if (!!options) {
      this.connectionOptions = PrinterClean.sortOptions(options);
    }

    if (!!settingsScripts) {
      this.gcodeScripts = PrinterClean.sortGCODE(settingsScripts);
    }

    if (!!tempTriggers && !!settingsWebcam && !!settingsServer) {
      this.otherSettings = PrinterClean.sortOtherSettings(
        tempTriggers,
        settingsWebcam,
        settingsServer
      );
    }

    if (!!settingsAppearance) {
      this.printerName = PrinterClean.grabPrinterName(settingsAppearance, this.printerURL);
    }
  }

  /*
   *@params endpoint
   */
  #apiPrinterTickerWrap(message, state, additional = "") {
    PrinterTicker.addIssue(
      new Date(),
      this.printerURL,
      `${message} ${additional}`,
      state,
      this._id
    );
  }

  #apiChecksUpdateWrap(apiCall, status, dateUpdate = false) {
    this.systemChecks.scanning[apiCall].status = status;
    // Only update dates on calls made, unless date is currently null...
    if (dateUpdate || this.systemChecks.scanning[apiCall].date === null) {
      this.systemChecks.scanning[apiCall].date = new Date();
    }
  }

  #updatePrinterSettingsFromDatabase() {
    const { timeout } = SettingsClean.returnSystemSettings();
    this.timeout = timeout;
    this.#apiRetry = timeout.apiRetry;
    this.#retryNumber = 0;
    this.reconnectingIn = 0;
  }

  setAllPrinterStates(state) {
    this.setPrinterState(state);
    this.setHostState(state);
    this.setWebsocketState(state);
  }

  setHostState(state) {
    if (!state?.hostState || !state?.hostStateColour || !state?.hostDescription)
      throw new Error("Missing keys required! " + JSON.stringify(state));
    this.hostState = {
      state: state.hostState,
      colour: state.hostStateColour,
      desc: state.hostDescription
    };
  }

  setPrinterState(state) {
    if (!state?.state || !state?.stateColour || !state?.stateDescription)
      throw new Error("Missing keys required!" + JSON.stringify(state));
    this.printerState = {
      state: state.state,
      colour: state.stateColour,
      desc: state.stateDescription
    };
  }

  setWebsocketState(state) {
    if (!state?.webSocket || !state?.webSocketDescription)
      throw new Error("Missing keys required!" + JSON.stringify(state));
    this.webSocketState = {
      colour: state.webSocket,
      desc: state.webSocketDescription
    };
  }

  reConnectWebsocket() {
    if (!!this?.#ws) {
      this.#ws.terminate();
      return "Successfully terminated websocket! Please wait for reconnect.";
    }
    throw new Error("No websocket to reconnect!");
  }

  async throttleWebSocket(seconds) {
    this.#ws.throttle(seconds);
  }

  async reScanAPI(force) {
    logger.info(this.printerURL + ": API scan requested! Forced:", { force });
    if (this.printerState.state !== "Offline") {
      await this.#requiredApiSequence(force);
      await this.#optionalApiSequence(force);
    }
  }

  async updatePrinterRecord(record) {
    logger.debug(this.printerURL + ": updating printer with new record: ", record);
    this.#db.update(record);
  }

  async enablePrinter() {
    // Setup initial client stuff, database, api
    await this.setupClient();
    // Test the waters call (ping to check if host state alive), Fail to Shutdown
    const testingTheWaters = await this.testTheApiWaters();
    // Check testingTheWatersResponse... needs to react to status codes...
    logger.debug(this.printerURL + ": Tested the high seas with a value of - ", testingTheWaters);
    // testing the waters responded with status code, setup for reconnect...
    if (typeof testingTheWaters === "number") {
      if (testingTheWaters === 408) {
        // Failed to find the printer on the high seas, fail and don't reconnect user iteraction required...
        const timeout = {
          hostState: "Timeout!",
          hostDescription: "Printer timed out, will attempt reconnection..."
        };
        this.setAllPrinterStates(PRINTER_STATES(timeout).SHUTDOWN);
        return "Failed due to timeout!";
      } else if (testingTheWaters === 503 || testingTheWaters === 502) {
        const unavailable = {
          hostState: "Unavailable!",
          hostDescription: "Printer is unavailable, will attempt reconnection..."
        };
        this.setAllPrinterStates(PRINTER_STATES(unavailable).SHUTDOWN);
        return "Failed because of octoprint server error!";
      } else if (testingTheWaters === 404) {
        const unavailable = {
          hostState: "Not Found!",
          hostDescription:
            "Couldn't find endpoint... please check your URL! will not attempt reconnect..."
        };
        this.setAllPrinterStates(PRINTER_STATES(unavailable).SHUTDOWN);
        return "Failed because octoprint is unavailable";
      } else if (testingTheWaters === 403) {
        const unavailable = {
          hostState: "Forbidden!",
          hostDescription:
            "Could not establish authentication... please check your API key and try again!"
        };
        this.setAllPrinterStates(PRINTER_STATES(unavailable).SHUTDOWN);
        return "Failed because octoprint forbid OctoFarm!";
      } else {
        const unavailable = {
          hostState: "Hard Fail!",
          hostDescription:
            "Something is seriously wrong... please check all settings! will not attempt reconnect..."
        };
        this.setAllPrinterStates(PRINTER_STATES(unavailable).SHUTDOWN);
        return "Failed due to unknown causes";
      }
    }
    this.setHostState(PRINTER_STATES().HOST_ONLINE);

    // Grab user list, current user and passively login to the client, Fail to Shutdown
    const initialApiCheck = await this.initialApiCheckSequence();

    const apiCheckFail = initialApiCheck.map((check) => {
      return check.value === 900;
    });
    // Global api heck triggered, fail with no reconnect
    if (apiCheckFail[0]) {
      const globalAPICheck = {
        state: "Global API Fail!",
        stateDescription:
          "Global api key detected... please use application / user generated key! Please correct to reconnect..."
      };
      this.setPrinterState(PRINTER_STATES(globalAPICheck).SHUTDOWN);
      return "Failed due to Global API key detection triggering!";
    }

    if (apiCheckFail[1]) {
      const globalAPICheck = {
        state: "User Fail",
        stateDescription:
          "Failed to collect user information! Please check all settings and correct to reconnect..."
      };
      this.setPrinterState(PRINTER_STATES(globalAPICheck).SHUTDOWN);
      return "Failed because of inability to collect user information!";
    }

    const initialApiCheckValues = initialApiCheck.map((check) => {
      return typeof check.value === "number";
    });
    // User list fail... reconnect same as others, probably network at this stage.
    if (initialApiCheckValues.includes(true)) {
      this.setPrinterState(PRINTER_STATES().SHUTDOWN);
      return "Failed due to possible network issues...";
    }

    // Grab required api data, fail to shutdown... should not continue without this data...
    const requiredApiCheck = await this.#requiredApiSequence();
    const requiredApiCheckValues = requiredApiCheck.map((check) => {
      return typeof check.value === "number";
    });
    if (requiredApiCheckValues.includes(true)) {
      const requiredAPIFail = {
        state: "API Fail!",
        stateDescription: "Required API Checks have failed... attempting reconnect..."
      };
      this.setPrinterState(PRINTER_STATES(requiredAPIFail).SHUTDOWN);
      return "Failed due to missing required values!";
    }

    // Get a session key
    await this.#setupWebsocket();

    // Grab optional api data
    await this.#optionalApiSequence();

    return "Successfully enabled printer...";
  }

  async getSessionkey() {
    const session = await this.acquireOctoPrintSessionKey();

    if (typeof session !== "string") {
      // Couldn't setup websocket
      const sessionKeyFail = {
        state: "Session Fail!",
        stateDescription:
          "Failed to acquire session key, please check your API key and try again..."
      };
      this.setPrinterState(PRINTER_STATES(sessionKeyFail).SHUTDOWN);
      return false;
    }

    return session;
  }

  async #setupWebsocket() {
    if (!this?.#ws) {
      logger.debug(
        this.printerURL + ": Grabbing session key for websocket auth with user: ",
        this.currentUser
      );
      PrinterTicker.addIssue(
        new Date(),
        this.printerURL,
        "Grabbing session key for websocket auth with user: " + this.currentUser,
        "Active",
        this._id
      );
    } else {
      this.killAllConnections();
      this.#ws = undefined;
    }

    const session = await this.getSessionkey();

    if (!session) return;

    this.#ws = new WebSocketClient(
      this.webSocketURL,
      this._id,
      this.currentUser,
      session,
      handleMessage
    );
  }

  disablePrinter() {
    if (this.disabled === false) {
      this.disabled = true;
      printerModel
        .findOneAndUpdate({ _id: this._id }, { disabled: true })
        .then(() => logger.warning("Successfully saved enable state for printer"), {
          disabled: true
        })
        .catch((e) => logger.warning("Failed saving enable state for printer", e));
    }
    this.setAllPrinterStates(PRINTER_STATES().DISABLED);
    this.killAllConnections();
    logger.debug(this.printerURL + ": client set as disabled...");
    PrinterTicker.addIssue(
      new Date(),
      this.printerURL,
      "Printer is marked as disabled. Ignoring until re-enabled...",
      "Offline",
      this._id
    );
    return "Printer successfully disabled...";
  }

  getMessageNumber() {
    return this.#ws.getMessageNumber();
  }

  async testTheApiWaters() {
    return this.acquireOctoPrintVersionData();
  }

  async setupClient() {
    this.disabled = false;
    if (this.#retryNumber === 0) {
      logger.info(this.printerURL + ": Running setup sequence.");
      this.#apiPrinterTickerWrap("Starting printer setup sequence", "Info");
    } else {
      logger.info(this.printerURL + ": Re-running setup sequence");
    }

    // If printer ID doesn't exist, we need to create the database record
    if (!this?._id) {
      const newPrinter = new printerModel(this);
      this._id = newPrinter._id.toString();
      await newPrinter
        .save()
        .then((res) => {
          logger.info("Successfully saved your new printer to database", this._id);
          return res;
        })
        .catch((e) => {
          logger.info("Failed to save your new printer to database", e);
          return e;
        });
    }

    //Create OctoPrint Client
    if (!this?.#api) {
      logger.debug(this.printerURL + ": Creating octoprint api client");
      const timeoutSettings = Object.assign({}, this.timeout);
      this.#api = new OctoprintApiClientService(this.printerURL, this.apikey, timeoutSettings);
    }

    // Create database client
    if (!this?.#db) {
      logger.debug(this.printerURL + ": Creating printer database link");
      this.#db = new PrinterDatabaseService(this._id);
      this.#db.update({
        disabled: this.disabled,
        sortIndex: this.sortIndex,
        group: this.group,
        apikey: this.apikey,
        printerURL: this.printerURL,
        webSocketURL: this.webSocketURL,
        settingsAppearance: this.settingsAppearance
      });
    }

    return true;
  }

  // Base minimum viable requirements for websocket connection
  async initialApiCheckSequence() {
    logger.info(this.printerURL + ": Gathering Initial API Data");
    this.#apiPrinterTickerWrap("Gathering Initial API Data", "Info");
    return Promise.allSettled([this.globalAPIKeyCheck(), this.acquireOctoPrintUsersList()]);
  }

  // Only run this when we've confirmed we can at least get a session key + api responses from OctoPrint
  async #requiredApiSequence(force = false) {
    logger.info(this.printerURL + ": Gathering required API data. Forced Scan: " + force);
    this.#apiPrinterTickerWrap("Gathering required API data.", "Info", " Forced Scan: " + force);
    return Promise.allSettled([
      this.acquireOctoPrintSettingsData(force),
      this.acquireOctoPrintSystemData(force),
      this.acquireOctoPrintProfileData(force),
      this.acquireOctoPrintStateData(force)
    ]);
  }
  async #optionalApiSequence(force = false) {
    logger.info(this.printerURL + ": Gathering optional API data. Forced Scan: " + force);
    this.#apiPrinterTickerWrap("Gathering optional API data.", "Info", " Forced Scan: " + force);

    return Promise.allSettled([
      this.acquireOctoPrintSystemInfoData(force),
      this.acquireOctoPrintUpdatesData(force),
      this.acquireOctoPrintFilesData(force),
      this.acquireOctoPrintPiPluginData(force),
      this.acquireOctoPrintPluginsListData(force)
    ]);
  }

  async globalAPIKeyCheck() {
    // Compare entered API key to settings API Key...
    this.#apiPrinterTickerWrap("Checking API key doesn't match global API key...", "Active");
    const globalAPIKeyCheck = await this.#api.getSettings(true).catch((e) => {
      logger.error("Failed global API Key check", e);
      return false;
    });
    const globalStatusCode = checkApiStatusResponse(globalAPIKeyCheck);
    if (globalStatusCode === 200) {
      //Safe to continue check
      const { api } = await globalAPIKeyCheck.json();

      if (!api) {
        logger.error(`Settings json does not exist: ${this.printerURL}`);
        return false;
      }
      const keyCheck = api.key !== this.apikey;
      if (keyCheck) {
        this.#apiPrinterTickerWrap("Passed Global API key check", "Complete");
        return keyCheck;
      } else {
        this.#apiPrinterTickerWrap("Failed global API key check", "Offline");
        return 900; //Global API Key fail
      }
    } else {
      // Hard failure as can't setup websocket
      this.#apiPrinterTickerWrap("API key is global API key", "Offline");
      return false;
    }
  }

  async acquireOctoPrintSessionKey() {
    this.#apiPrinterTickerWrap("Attempting passive login", "Active");
    const passiveLogin = await this.#api.login(true).catch((e) => {
      logger.error("Failed passive login", e);
      return false;
    });

    const globalStatusCode = checkApiStatusResponse(passiveLogin);
    if (globalStatusCode === 200) {
      const sessionJson = await passiveLogin.json();

      this.sessionKey = sessionJson.session;
      this.#apiPrinterTickerWrap("Passive login was successful!", "Complete");
      return this.sessionKey;
    } else {
      this.#apiPrinterTickerWrap(
        "Passive login failed...",
        "Offline",
        "Error Code: " + globalStatusCode
      );
      return globalStatusCode;
    }
  }

  async acquireOctoPrintUsersList(force = true) {
    this.#apiPrinterTickerWrap("Acquiring User List", "Info");
    this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().API, "warning");
    let usersCheck = await this.#api.getUsers(true).catch((e) => {
      logger.error("Failed to acuire user list", e);
      return false;
    });

    let globalStatusCode = checkApiStatusResponse(usersCheck);

    if (globalStatusCode === 200) {
      const userJson = await usersCheck.json();

      const userList = userJson.users;
      // Always forced... may change in future
      if (force) {
        if (isEmpty(userList)) {
          //If user list is empty then we can assume that an admin user is only one available.
          //Only relevant for OctoPrint < 1.4.2.
          this.currentUser = "admin";
          this.userList.push(this.currentUser);
          this.#db.update({ currentUser: this.currentUser });
          this.#apiPrinterTickerWrap(
            "Acquired a single admin user!",
            "Complete",
            "Current User: " + this.currentUser
          );
          this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().API, "success", true);
          return true;
        } else {
          //If the userList isn't empty then we need to parse out the users and search for octofarm user.
          for (let currentUser of userList) {
            if (!!currentUser.admin) {
              this.userList.push(currentUser.name);
              // Look for OctoFarm user and skip the rest, if not use the first admin we find
              if (currentUser.name === "octofarm" || currentUser.name === "OctoFarm") {
                this.currentUser = currentUser.name;
                this.#db.update({ currentUser: this.currentUser });
                // Continue to collect the rest of the users...
                continue;
              }
              // If no octofarm user then collect the rest for user choice in ui.
              if (!this?.currentUser) {
                // We should not override the database value to allow users to update it.
                this.currentUser = currentUser.name;
                this.#db.update({ currentUser: this.currentUser });
              }
            }
          }
          this.#apiPrinterTickerWrap(
            "Successfully acquired " + userList.length + " users...",
            "Complete",
            "Current User: " + this.currentUser
          );
          this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().API, "success", true);
          return true;
        }
      } else {
        this.#apiPrinterTickerWrap(
          "User list acquired previously... skipping!",
          "Complete",
          "Current User: " + this.currentUser
        );
        this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().API, "success");
        return true;
      }
    } else {
      this.#apiPrinterTickerWrap(
        "Failed to acquire user list...",
        "Offline",
        "Status Code: " + globalStatusCode
      );
      this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().API, "danger", true);
      return globalStatusCode;
    }
  }

  async acquireOctoPrintVersionData() {
    logger.warning(this.printerURL + ": Acquiring OctoPrint Version.", {
      alreadyAvailable: this?.octoPrintVersion,
      currentVersion: this.octoPrintVersion
    });
    if (this.#retryNumber === 0) {
      this.#apiPrinterTickerWrap("Testing the high sea!", "Active");
    }

    let versionCheck = await this.#api.getVersion(true).catch((e) => {
      logger.error("Failed OctoPrint version data", e);
      return {
        status: e
      };
    });

    const globalStatusCode = checkApiStatusResponse(versionCheck);
    if (globalStatusCode === 200) {
      let server = undefined;
      try {
        server = await versionCheck.json();
      } catch (e) {
        logger.error("Failed version check", e);
        return 999;
      }

      this.octoPrintVersion = server.server;
      this.#db.update({
        octoPrintVersion: server.server
      });
      logger.info(this.printerURL + ": Acquired OctoPrint Version.", {
        octoPrintVersion: server.server
      });

      this.versionNotChecked = checkHighestSupportedOctoPrint(this.octoPrintVersion);
      this.versionNotSupported = checkLowestSupportedOctoPrint(this.octoPrintPluginUpdates);

      this.#apiPrinterTickerWrap("Successfully found printer on the high sea!", "Complete");
      return true;
    } else {
      if (this.#retryNumber === 0) {
        this.#apiPrinterTickerWrap(
          "Failed to find printer on the high sea! marking offline...",
          "Offline",
          "Error Code: " + globalStatusCode
        );
      }

      return globalStatusCode;
    }
  }

  async acquireOctoPrintPiPluginData(force = false) {
    this.#apiPrinterTickerWrap("Checking if RaspberryPi", "Info");
    // Would like to skip this if not a Pi, won't even fit in the retry/not retry system so call and fail for now.
    if (!this?.octoPi || force) {
      let piPluginCheck = await this.#api.getPluginPiSupport(true).catch((e) => {
        logger.error("Failed check for raspberry pi", e);
        return false;
      });

      const globalStatusCode = checkApiStatusResponse(piPluginCheck);
      if (globalStatusCode === 200) {
        const octoPi = await piPluginCheck.json();
        this.#db.update({
          octoPi: octoPi
        });
        this.octoPi = octoPi;
        this.#apiPrinterTickerWrap("Detected a RaspberryPi installation", "Complete");
        return true;
      } else {
        this.octoPi = {};
        this.#db.update({
          octoPi: this.octoPi
        });
        this.#apiPrinterTickerWrap("Couldn't detect RaspberryPi", "Offline");
        return globalStatusCode;
      }
    } else {
      this.#apiPrinterTickerWrap("RaspberryPi data acquired previously... skipping!", "Complete");
      // Call was skipped as we have data or not forced
      return true;
    }
  }

  async acquireOctoPrintSystemData(force = false) {
    this.#apiPrinterTickerWrap("Acquiring system data", "Info");
    this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().SYSTEM, "warning");

    if (!this?.core || this.core.length === 0 || force) {
      let systemCheck = await this.#api.getSystemCommands(true).catch((e) => {
        logger.error("Failed Aquire system data", e);
        return false;
      });

      let globalStatusCode = checkApiStatusResponse(systemCheck);
      if (globalStatusCode === 200) {
        const systemJson = await systemCheck.json();

        this.core = systemJson.core;
        this.#db.update({
          core: systemJson.core
        });

        this.#apiPrinterTickerWrap("Acquired system data!", "Complete");
        this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().SYSTEM, "success", true);
        return true;
      } else {
        this.#apiPrinterTickerWrap(
          "Failed to acquire system data",
          "Offline",
          "Error Code: " + globalStatusCode
        );
        this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().SYSTEM, "danger", true);
        return globalStatusCode;
      }
    } else {
      this.#apiPrinterTickerWrap("System data acquired previously... skipped!", "Complete");
      this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().SYSTEM, "success");
      // Call was skipped as we have data or not forced
      return true;
    }
  }

  async acquireOctoPrintProfileData(force = false) {
    this.#apiPrinterTickerWrap("Acquiring profile data", "Info");
    this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().PROFILE, "warning");
    if (!this?.profiles || force) {
      let profileCheck = await this.#api.getPrinterProfiles(true).catch((e) => {
        logger.error("Failed Aquire profile data", e);
        return false;
      });
      const globalStatusCode = checkApiStatusResponse(profileCheck);
      if (globalStatusCode === 200) {
        const { profiles } = await profileCheck.json();
        this.profiles = profiles;
        this.#db.update({
          profiles: profiles
        });
        if (!!this?.profiles && !!this?.current) {
          this.currentProfile = PrinterClean.sortProfile(this.profiles, this.current);
        }
        this.#apiPrinterTickerWrap("Acquired profile data!", "Complete");
        this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().PROFILE, "success", true);
        return true;
      } else {
        this.#apiPrinterTickerWrap(
          "Failed to acquire profile data",
          "Offline",
          "Error Code: " + globalStatusCode
        );
        this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().PROFILE, "danger", true);
        return globalStatusCode;
      }
    } else {
      this.#apiPrinterTickerWrap("Profile data acquired previously... skipped!", "Complete");
      this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().PROFILE, "success");
      // Call was skipped as we have data or not forced
      return true;
    }
  }

  async acquireOctoPrintStateData(force = false) {
    this.#apiPrinterTickerWrap("Acquiring state data", "Info");
    this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().STATE, "warning");
    if (!this?.current || !this?.options || force) {
      let stateCheck = await this.#api.getConnection(true).catch((e) => {
        logger.error("Failed Aquire state data", e);
        return false;
      });

      const globalStatusCode = checkApiStatusResponse(stateCheck);

      if (globalStatusCode === 200) {
        const { current, options } = await stateCheck.json();
        this.current = current;
        this.options = options;
        this.#db.update({
          current: current,
          options: options
        });

        if (!!this?.profiles && !!this?.current) {
          this.currentProfile = PrinterClean.sortProfile(this.profiles, this.current);
        }

        if (!!this?.current) {
          this.currentConnection = PrinterClean.sortConnection(this.current);
        }

        if (!!this?.options) {
          this.connectionOptions = PrinterClean.sortOptions(this.options);
        }
        this.#apiPrinterTickerWrap("Acquired state data!", "Complete");
        this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().STATE, "success", true);
        return true;
      } else {
        this.#apiPrinterTickerWrap(
          "Failed to acquire state data",
          "Offline",
          "Error Code: " + globalStatusCode
        );
        this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().STATE, "danger", true);
        return globalStatusCode;
      }
    } else {
      this.#apiPrinterTickerWrap("State data acquired previously... skipped!", "Complete");
      this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().STATE, "success");
      // Call was skipped as we have data or not forced
      return true;
    }
  }

  async acquireOctoPrintSettingsData(force = false) {
    this.#apiPrinterTickerWrap("Acquiring settings data", "Info");
    this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().SETTINGS, "warning");
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
      !this?.settingsAppearance ||
      force
    ) {
      let settingsCheck = await this.#api.getSettings(true).catch((e) => {
        logger.error("Failed Aquire settings data", e);
        return false;
      });

      const globalStatusCode = checkApiStatusResponse(settingsCheck);

      if (globalStatusCode === 200) {
        const {
          api,
          feature,
          folder,
          plugins,
          scripts,
          serial,
          server,
          system,
          webcam,
          appearance
        } = await settingsCheck.json();
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

        //These should not run ever again if this endpoint is forcibly updated. They are for initial scan only.
        if (!force) {
          this.camURL = acquireWebCamData(this.camURL, this.printerURL, webcam.streamUrl);
          this.costSettings = testAndCollectCostPlugin(this.costSettings, plugins);
          this.powerSettings = testAndCollectPSUControlPlugin(this.powerSettings, plugins);
        }
        this.printerName = PrinterClean.grabPrinterName(appearance, this.printerURL);
        if (this.settingsAppearance.color !== appearance.color) {
          this.settingsAppearance.color = appearance.color;
        }
        this.#db.update({
          camURL: this.camURL,
          settingsAppearance: this.settingsAppearance,
          costSettings: this.costSettings,
          powerSettings: this.powerSettings,
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

        this.gcodeScripts = PrinterClean.sortGCODE(scripts);
        this.otherSettings = PrinterClean.sortOtherSettings(this.tempTriggers, webcam, server);
        this.#apiPrinterTickerWrap("Acquired settings data!", "Complete");
        this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().SETTINGS, "success", true);
        return true;
      } else {
        this.#apiPrinterTickerWrap(
          "Failed to acquire settings data",
          "Offline",
          "Error Code: " + globalStatusCode
        );
        this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().SETTINGS, "danger", true);
        return globalStatusCode;
      }
    } else {
      this.#apiPrinterTickerWrap("State data acquired previously... skipped!", "Complete");
      this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().SETTINGS, "success");
      // Call was skipped as we have data or not forced
      return true;
    }
  }

  async acquireOctoPrintSystemInfoData(force = false) {
    if (!checkSystemInfoAPIExistance(this.octoPrintVersion)) {
      this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().SYSTEM_INFO, "success", true);
      return false;
    }
    this.#apiPrinterTickerWrap("Acquiring system information data", "Info");
    this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().SYSTEM_INFO, "warning");

    if (!this?.octoPrintSystemInfo || force) {
      let systemInfoCheck = await this.#api.getSystemInfo(true).catch((e) => {
        logger.error("Failed Aquire System Info data", e);
        return false;
      });

      const globalStatusCode = checkApiStatusResponse(systemInfoCheck);

      if (globalStatusCode === 200) {
        const { systeminfo } = await systemInfoCheck.json();
        this.octoPrintSystemInfo = systeminfo;
        this.#db.update({
          octoPrintSystemInfo: systeminfo
        });
        this.#apiPrinterTickerWrap("Acquired system information data!", "Complete");
        this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().SYSTEM_INFO, "success", true);
        return true;
      } else {
        this.#apiPrinterTickerWrap(
          "Failed to acquire system information plugin data",
          "Offline",
          "Error Code: " + globalStatusCode
        );
        this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().SYSTEM_INFO, "danger", true);
        return globalStatusCode;
      }
    } else {
      this.#apiPrinterTickerWrap(
        "System information data acquired previously... skipped!",
        "Complete"
      );
      this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().SYSTEM_INFO, "success");
      // Call was skipped as we have data or not forced
      return true;
    }
  }

  async acquireOctoPrintPluginsListData(force = true) {
    if (!!softwareUpdateChecker.getUpdateNotificationIfAny().air_gapped) {
      this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().PLUGINS, "danger");
      return false;
    }
    this.#apiPrinterTickerWrap("Acquiring plugin lists data", "Info");
    this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().PLUGINS, "warning");
    if (!this?.pluginsList || this.pluginsList.length === 0 || force) {
      this.pluginsList = [];
      const pluginList = await this.#api
        .getPluginManager(true, this.octoPrintVersion)
        .catch((e) => {
          logger.error("Failed Aquire plugin lists data", e);
          return false;
        });
      const globalStatusCode = checkApiStatusResponse(pluginList);

      if (globalStatusCode === 200) {
        const { plugins } = await pluginList.json();
        this.pluginsListEnabled = plugins.filter(function (plugin) {
          return plugin.enabled;
        });
        this.pluginsListDisabled = plugins.filter(function (plugin) {
          return !plugin.enabled;
        });

        this.#db.update({
          pluginsListEnabled: this.pluginsListEnabled,
          pluginsListDisabled: this.pluginsListDisabled
        });
        this.#apiPrinterTickerWrap("Acquired plugin lists data!", "Complete");
        this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().PLUGINS, "success", true);
        return true;
      } else {
        this.#apiPrinterTickerWrap(
          "Failed to acquire plugin lists data",
          "Offline",
          "Error Code: " + globalStatusCode
        );
        this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().PLUGINS, "danger", true);
        return globalStatusCode;
      }
    } else {
      this.#apiPrinterTickerWrap("Plugin lists data acquired previously... skipped!", "Complete");
      this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().PLUGINS, "success");
      return true;
    }
  }

  async acquireOctoPrintUpdatesData(force = false) {
    if (softwareUpdateChecker.getUpdateNotificationIfAny().air_gapped) return false;
    this.#apiPrinterTickerWrap("Acquiring OctoPrint updates data", "Info");
    this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().UPDATES, "warning");
    if (
      !this?.octoPrintUpdate ||
      !this?.octoPrintPluginUpdates ||
      this?.octoPrintPluginUpdates.length === 0 ||
      force
    ) {
      const updateCheck = await this.#api.getSoftwareUpdateCheck(force, true).catch((e) => {
        logger.error("Failed Aquire updates data", e);
        return false;
      });
      const globalStatusCode = checkApiStatusResponse(updateCheck);

      if (globalStatusCode === 200) {
        const { information } = await updateCheck.json();

        this.octoPrintUpdate = [];
        this.octoPrintPluginUpdates = [];

        let octoPrintUpdate = false;
        const pluginUpdates = [];

        for (const key in information) {
          if (information.hasOwnProperty(key)) {
            if (information[key].updateAvailable) {
              if (key === "octoprint") {
                octoPrintUpdate = {
                  id: key,
                  displayName: information[key].displayName,
                  displayVersion: information[key].displayVersion,
                  updateAvailable: information[key].updateAvailable,
                  releaseNotesURL: information[key].releaseNotes
                };
              } else {
                pluginUpdates.push({
                  id: key,
                  displayName: information[key].displayName,
                  displayVersion: information[key].displayVersion,
                  updateAvailable: information[key].updateAvailable,
                  releaseNotesURL: information[key].releaseNotes
                });
              }
            }
          }
        }
        this.octoPrintUpdate = octoPrintUpdate;
        this.octoPrintPluginUpdates = pluginUpdates;
        this.#db.update({
          octoPrintUpdate: octoPrintUpdate,
          octoPrintPluginUpdates: pluginUpdates
        });
        this.#apiPrinterTickerWrap("Acquired OctoPrint updates data!", "Complete");
        this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().UPDATES, "success", true);

        return true;
      } else {
        this.#apiPrinterTickerWrap(
          "Failed to acquire OctoPrint updates data",
          "Offline",
          "Error Code: " + globalStatusCode
        );
        this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().UPDATES, "danger", true);
        return globalStatusCode;
      }
    } else {
      this.#apiPrinterTickerWrap(
        "OctoPrint updates data acquired previously... skipped!",
        "Complete"
      );
      this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().UPDATES, "success");
      return true;
    }
  }

  async acquireOctoPrintFileData(fullPath, generate = false) {
    const filesCheck = await this.#api.getFile(fullPath, true).catch((e) => {
      logger.error("Failed Aquire file data", e);
      return false;
    });

    const globalStatusCode = checkApiStatusResponse(filesCheck);

    if (globalStatusCode === 200) {
      const fileEntry = await filesCheck.json();

      let timeStat = null;
      let filament = [];
      if (typeof fileEntry.gcodeAnalysis !== "undefined") {
        if (typeof fileEntry.gcodeAnalysis.estimatedPrintTime !== "undefined") {
          timeStat = fileEntry.gcodeAnalysis.estimatedPrintTime;
          // Start collecting multiple tool lengths and information from files....
          Object.keys(fileEntry.gcodeAnalysis.filament).forEach(function (item, i) {
            filament[i] = fileEntry.gcodeAnalysis.filament[item].length;
          });
        } else {
          timeStat = "No Time Estimate";
          filament = null;
        }
      } else {
        timeStat = "No Time Estimate";
        filament = null;
      }
      let path = null;
      if (fileEntry.path.indexOf("/") > -1) {
        path = fileEntry.path.substr(0, fileEntry.path.lastIndexOf("/"));
      } else {
        path = "local";
      }
      let thumbnail = null;

      if (typeof fileEntry.thumbnail !== "undefined") {
        thumbnail = fileEntry.thumbnail;
      }

      let success = 0;
      let failed = 0;
      let last = null;

      if (typeof fileEntry.prints !== "undefined") {
        success = fileEntry.prints.success;
        failed = fileEntry.prints.failure;
        last = fileEntry.prints.last.success;
      }
      if (generate) {
        const fileInformation = {
          path,
          fullPath: fileEntry.path,
          display: fileEntry.display,
          length: filament,
          name: fileEntry.name,
          size: fileEntry.size,
          time: timeStat,
          date: fileEntry.date,
          thumbnail,
          success: success,
          failed: failed,
          last: last
        };
        const fileIndex = findIndex(this.fileList.fileList, function (o) {
          return o.display === fileInformation.display;
        });

        this.fileList.fileList[fileIndex] = FileClean.generateSingle(
          fileInformation,
          this.selectedFilament,
          this.costSettings
        );
        return this.fileList.fileList[fileIndex];
      } else {
        return {
          path,
          fullPath: fileEntry.path,
          display: fileEntry.display,
          length: filament,
          name: fileEntry.name,
          size: fileEntry.size,
          time: timeStat,
          date: fileEntry.date,
          thumbnail,
          success: success,
          failed: failed,
          last: last
        };
      }
    } else {
      return false;
    }
  }

  async acquireOctoPrintFilesData(force = false, returnObject = false) {
    this.#apiPrinterTickerWrap("Acquiring file list data", "Info");
    this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().FILES, "warning");
    if (!this?.fileList || !this?.storage || force) {
      this.fileList = {
        files: [],
        filecount: 0,
        folders: [],
        folderCount: 0
      };
      this.storage = {
        free: 0,
        total: 0
      };

      const filesCheck = await this.#api.getFiles(true, true).catch((e) => {
        logger.error("Failed Aquire files data", e);
        return false;
      });

      const globalStatusCode = checkApiStatusResponse(filesCheck);

      if (globalStatusCode === 200) {
        const { free, total, files } = await filesCheck.json();

        this.storage = {
          free: free,
          total: total
        };
        const { printerFiles, printerLocations } = acquirePrinterFilesAndFolderData(files);

        this.#db.update({
          storage: this.storage,
          fileList: {
            files: printerFiles,
            filecount: printerFiles.length,
            folders: printerLocations,
            folderCount: printerLocations.length
          }
        });

        this.fileList = FileClean.generate(
          {
            files: printerFiles,
            filecount: printerFiles.length,
            folders: printerLocations,
            folderCount: printerLocations.length
          },
          this.selectedFilament,
          this.costSettings
        );
        this.#apiPrinterTickerWrap("Acquired file list data!", "Complete");
        this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().FILES, "success", true);
        if (!returnObject) {
          return true;
        } else {
          return FileClean.generate(
            {
              files: printerFiles,
              filecount: printerFiles.length,
              folders: printerLocations,
              folderCount: printerLocations.length
            },
            this.selectedFilament,
            this.costSettings
          );
        }
      } else {
        this.#apiPrinterTickerWrap(
          "Failed to acquire file list data",
          "Offline",
          "Error Code: " + globalStatusCode
        );
        this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().FILES, "danger", true);
        return globalStatusCode;
      }
    } else {
      this.#apiPrinterTickerWrap("File list data acquired previously... skipped!", "Complete");
      this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().FILES, "success");
      return true;
    }
  }

  async updateOctoPrintProfileData(profile, profileID) {
    this.#apiPrinterTickerWrap("Updating OctoPrint profile data", "Info");
    const profilePatch = await this.#api.patchProfile(profile, profileID).catch((e) => {
      logger.error("Failed Aquire profile data", e);
      return 900;
    });
    return checkApiStatusResponse(profilePatch);
  }

  async updateOctoPrintSettingsData(settings) {
    this.#apiPrinterTickerWrap("Updating OctoPrint settings data", "Info");
    const settingsPost = await this.#api.postSettings(settings).catch((e) => {
      logger.error("Failed Update settings data", e);
      return 900;
    });
    return checkApiStatusResponse(settingsPost);
  }

  updateStateTrackingCounters(counter, value) {
    const allowedCounters = [CATEGORIES.IDLE, CATEGORIES.ACTIVE, CATEGORIES.OFFLINE];

    if (!allowedCounters.includes(counter))
      throw new Error("Don't know what counter that is! " + counter);
    if (Number.isNaN(value)) {
      throw new Error("Value is not a number!");
    }

    const data = {
      ["current" + counter]: value
    };
    logger.debug(this.printerURL + " Updating printer counters", data);

    return this.#db.update(data);
  }

  updatePrinterLiveValue(object) {
    assign(this, object);
    logger.silly("Updating live printer data", object);
  }

  updatePrinterData(data) {
    logger.silly("Updating printer database: ", data);
    this.#db.update(data);
  }

  resetConnectionInformation() {
    if (!!this?.#api) {
      this.#api.updateConnectionInformation(this.printerURL, this.apikey);
    }

    if (!!this?.#ws) {
      this.#ws.updateConnectionInformation(this.webSocketURL, this.currentUser);
    }

    this.resetSocketConnection().then();
  }

  async resetSocketConnection() {
    return this.enablePrinter()
      .then((res) => {
        logger.warning(res);
      })
      .catch((e) => {
        logger.error("Failed starting service", e);
      });
  }

  async acquireOctoPrintLatestSettings(force = false) {
    await Promise.allSettled([
      this.acquireOctoPrintStateData(force),
      this.acquireOctoPrintSystemData(force),
      this.acquireOctoPrintSettingsData(force)
    ]);
  }

  killApiTimeout() {
    logger.debug("Clearning API Timeout");
    clearTimeout(this.#reconnectTimeout);
    this.reconnectingIn = 0;
  }

  killAllConnections() {
    this.killApiTimeout();
    if (!this?.#ws) {
      return false;
    }

    return this.#ws.killAllConnectionsAndListeners();
  }

  deleteFromDataBase() {
    return this.#db.delete();
  }

  async updateFileInformation(data) {
    console.log(data);

    const { name, result } = data;

    const databaseRecord = await this.#db.get();
    console.log(databaseRecord.fileList);
    const fileIndex = findIndex(databaseRecord.fileList.files, function (o) {
      return o.name === name;
    });

    if (!!fileIndex) {
      logger.warning("Updating file information with generated OctoPrint data", data);
      const { estimatedPrintTime, filament } = result;

      databaseRecord.fileList.files[fileIndex] = {
        ...estimatedPrintTime,
        ...filament
      };

      this.#db.update(this._id, { fileList: databaseRecord.fileList });

      this.cleanPrintersInformation(databaseRecord);
    } else {
      logger.error("Couldn't find file index to update!", name);
    }
  }

  updatePrinterStatistics(statistics) {
    this.#printerStatistics = statistics;
  }

  getPrinterStatistics() {
    return this.#printerStatistics;
  }

  sendThrottle(seconds) {
    if (!!this?.#ws) {
      this.#ws.sendThrottle(seconds);
    }
  }

  cleanPrintersInformation(databaseRecord) {
    this.otherSettings = PrinterClean.sortOtherSettings(
      this.tempTriggers,
      this.settingsWebcam,
      this.settingsServer
    );
    this.currentProfile = PrinterClean.sortProfile(this.profiles, this.current);

    this.currentConnection = PrinterClean.sortConnection(this.current);

    this.connectionOptions = PrinterClean.sortOptions(this.options);

    this.gcodeScripts = PrinterClean.sortGCODE(this.settingsScripts);

    this.printerName = PrinterClean.grabPrinterName(this.settingsAppearance, this.printerURL);

    this.currentProfile = PrinterClean.sortProfile(this.profiles, this.current);

    if (!!databaseRecord) {
      this.fileList = FileClean.generate(
        {
          files: databaseRecord.fileList.files,
          filecount: databaseRecord.fileList.files.length,
          folders: databaseRecord.fileList.folders,
          folderCount: databaseRecord.fileList.folders.length
        },
        this.selectedFilament,
        this.costSettings
      );
    }
  }

  async houseKeepFiles(days) {
    // get todays date
    const now = new Date();
    // get past date
    const past = now.setDate(now.getDate() - days);
    for (const folder of folderContents) {
      const logFilePath = join(logFolder, folder);
      const stats = statSync(logFilePath);
      const endTime = new Date(stats.birthtime).getTime() + 3600000;
      if (yesterday > endTime) {
        Logs.deleteLogByName(logFilePath);
        deletedFiles.push(logFilePath);
      }
    }
  }
}

module.exports = {
  OctoPrintPrinter
};
