const {
  systemChecks,
  quickConnectCommands,
  tempTriggersDefaults,
  ALLOWED_SYSTEM_CHECKS
} = require("./constants/printer-defaults.constants");
const { PRINTER_STATES, CATEGORIES } = require("./constants/printer-state.constants");
const { OctoprintApiClientService } = require("../octoprint/octoprint-api-client.service");
const { SettingsClean } = require("../settings-cleaner.service");
const PrinterDatabaseService = require("./printer-database.service");
const { assign, findIndex, pick } = require("lodash");
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
  createPrinterPowerURL,
  parseOctoPrintPowerResponse,
  canWeDetectPrintersPowerState
} = require("../octoprint/utils/printer-power-plugins.utils");
const { notifySubscribers } = require("../../services/server-side-events.service");
const softwareUpdateChecker = require("../../services/octofarm-update.service");
const WebSocketClient = require("../octoprint/octoprint-websocket-client.service");
const { handleMessage } = require("../octoprint/octoprint-websocket-message.service");
const { PrinterTicker } = require("../printer-connection-log.service");
const Logger = require("../../handlers/logger");
const { PrinterClean } = require("../printer-cleaner.service");
const printerModel = require("../../models/Printer");
const { FileClean } = require("../file-cleaner.service");
const { JobClean } = require("../job-cleaner.service");
const apiConfig = require("../octoprint/constants/octoprint-api-config.constants");
const { MESSAGE_TYPES } = require("../../constants/sse.constants");
const { LOGGER_ROUTE_KEYS } = require("../../constants/logger.constants");
const { FilamentClean } = require("../filament-cleaner.service");
const logger = new Logger(LOGGER_ROUTE_KEYS.SERVICE_OCTOPRINT);

class OctoPrintPrinter {
  //OctoFarm state
  disabled = false;
  display = true;
  #retryNumber = 0;
  multiUserIssue = undefined;
  restartRequired = false;
  enabling = false;
  versionNotSupported = false;
  versionNotChecked = false;
  lastConnectionStatus = {
    state: "Active",
    message: ""
  };
  healthChecksPass = true;
  onboarding = undefined;
  activeControlUser = null;
  //Communications
  #api = undefined;
  #ws = undefined;
  #db = undefined;
  #apiRetry = undefined;
  #printerStatistics = undefined;
  timeout = undefined;
  #reconnectTimeout = false;
  reconnectingIn = 0;
  //Required
  sortIndex = undefined;
  category = undefined;
  printerURL = undefined;
  apikey = undefined;
  webSocketURL = undefined;
  camURL = "";
  clientCamURL = "";
  settingsAppearance = undefined;
  // Always database
  _id = undefined;
  // Always default
  systemChecks = systemChecks();
  quickConnectSettings = quickConnectCommands();
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
  progress = {
    completion: null,
    filepos: null,
    printTime: null,
    printTimeLeft: null
  };
  resends = undefined;
  tools = null;
  currentJob = undefined;
  job = undefined;
  currentZ = undefined;
  currentProfile = undefined;
  currentConnection = undefined;
  connectionOptions = undefined;
  terminal = [];
  fileList = {
    fileList: [],
    filecount: 0,
    folderList: [],
    folderCount: 0
  };
  storage = {
    free: 0,
    total: 0
  };
  //Updated by API / database
  octoPi = undefined;
  octoResourceMonitor = undefined;
  costSettings = {
    default: true,
    powerConsumption: 0.5,
    electricityCosts: 0.15,
    purchasePrice: 500,
    estimateLifespan: 43800,
    maintenanceCosts: 0.25
  };
  printerPowerState;
  powerSettings = {
    default: true,
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
  printerFirmware = undefined;
  octoPrintVersion = undefined;
  klipperState = undefined;
  current = undefined;
  options = undefined;
  profiles = undefined;
  pluginsListEnabled = undefined;
  pluginsListDisabled = undefined;
  octoPrintUpdate = undefined;
  octoPrintPluginUpdates = undefined;
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
  websocket_throttle = 1;

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
      onboarding,
      _id,
      settingsAppearance,
      dateAdded,
      alerts,
      currentIdle,
      currentActive,
      currentOffline,
      currentUser,
      userList,
      selectedFilament,
      octoPrintVersion,
      quickConnectSettings,
      octoPi,
      tempTriggers,
      feedRate,
      flowRate,
      group,
      costSettings,
      powerSettings,
      storage,
      fileList,
      current,
      options,
      profiles,
      pluginsListEnabled,
      pluginsListDisabled,
      octoPrintUpdate,
      octoPrintPluginUpdates,
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
      printerFirmware,
      activeControlUser,
      printerName
    } = printer;
    this._id = _id.toString();
    //Only update the below if received from database, otherwise is required from scans.
    if (!!onboarding) {
      this.onboarding = onboarding;
    }

    if (!!settingsAppearance) {
      this.settingsAppearance = settingsAppearance;
    }

    if (!!currentUser) {
      this.currentUser = currentUser;
    }
    if (!!userList) {
      this.userList = userList;
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

    if (!!quickConnectSettings) {
      this.quickConnectSettings = quickConnectSettings;
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
      this.fileList = {
        fileList: fileList?.files ? fileList.files : fileList.fileList,
        filecount: fileList?.files ? fileList.files.length : fileList.fileList.length,
        folderList: fileList?.folders ? fileList.folders : fileList.folderList,
        folderCount: fileList?.folders ? fileList.folders.length : fileList.folderList.length
      };
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

    if (!!this.tempTriggers || !!this.settingsWebcam || !!this.settingsServer) {
      this.otherSettings = PrinterClean.sortOtherSettings(
        this.tempTriggers,
        this.settingsWebcam,
        this.settingsServer
      );
    }

    if (!!printerName) {
      this.printerName = printerName;
    }

    if (!!activeControlUser) {
      this.activeControlUser = activeControlUser;
    }

    this.resetJobInformation();
  }

  /*
   *@params endpoint
   */
  #apiPrinterTickerWrap(message, state, additional = "") {
    this.lastConnectionStatus = {
      state,
      message: `${message} ${additional}`
    };
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
    this.resetJobInformation();
    if (!!this?.#ws) {
      this.#ws.terminate();
      return "Successfully terminated websocket! Please wait for reconnect.";
    }
    throw new Error("No websocket to reconnect!");
  }

  throttleWebSocket(seconds) {
    this.#ws.forceUpdateThrottleRate(seconds);
  }

  async reScanAPI(force) {
    logger.info(this.printerURL + ": API scan requested! Forced:", { force });
    if (!this.disabled && this.printerState.state !== "Offline") {
      // await this.#requiredApiSequence(force);
      // await this.#optionalApiSequence(force);
      return `${this.printerName}: API Rescan was successful!`;
    } else {
      return `${this.printerName}: Skipping Re-scan as printer is disabled or offline!`;
    }
  }

  async enablePrinter(force = true) {
    this.enabling = true;
    if (this.disabled) {
      this.#db.update({ disabled: false });
    }

    await this.setupClient();
    // Test the waters call (ping to check if host state alive), Fail to Shutdown

    const { requiredApiCheckSequence, optionalApiCheckSequence } = apiConfig;
    if (this.#retryNumber === 0) {
      this.#apiPrinterTickerWrap("Testing the high sea!", "Active");
    }

    const pingTestResults = await this.#api.pingTest(this.printerURL);

    const statusCheck = this.checkStatusNumber(pingTestResults?.status);
    if (statusCheck !== true) {
      if (this.#retryNumber === 0) {
        this.#apiPrinterTickerWrap(
          "Failed to find the host on the high seas! Marking offline...",
          "Offline"
        );
      }
      const failedHighSeas = {
        hostState: "Offline",
        hostDescription: "Failed to test the waters! Cannot find host on the high seas!"
      };
      this.setAllPrinterStates(PRINTER_STATES(failedHighSeas).SHUTDOWN);
      this.reconnectAPI();
      return "Failed to test the waters! Cannot find host on the high seas!";
    }
    if (this.#retryNumber === 0) {
      this.#apiPrinterTickerWrap("Printer found on the high seas!", "Complete");
      this.#apiPrinterTickerWrap("Attempting API access", "Active");
    }

    const requiredPromises = [];
    requiredApiCheckSequence.forEach((call) => {
      requiredPromises.push(this.grabInformationFromDevice(call));
    });

    await Promise.allSettled(requiredPromises);

    //Check global API Key
    const keyCheck = this.settingsApi.key === this.apikey;
    if (keyCheck) {
      const globalAPICheck = {
        state: "Global API Fail!",
        stateDescription: "Global api key detected... please use application / user generated key!"
      };
      this.setPrinterState(PRINTER_STATES(globalAPICheck).SHUTDOWN);
      this.#apiPrinterTickerWrap(globalAPICheck.stateDescription, "Offline");
      logger.error(globalAPICheck.stateDescription);
      return globalAPICheck.stateDescription; //Global API Key fail
    }

    this.#apiPrinterTickerWrap("Passed Global API key check", "Complete");
    logger.info("Passed Global API key check!");

    // Check user and user list...
    const userListCheck = this.userList.length > 0;
    if (!userListCheck) {
      const userListKeyCheck = {
        state: "User List Fail!",
        stateDescription: "Unable to find any users for OctoPrint, please try a forced reconnect..."
      };
      this.setPrinterState(PRINTER_STATES(userListKeyCheck).SHUTDOWN);
      this.#apiPrinterTickerWrap(userListKeyCheck.stateDescription, "Offline");
      logger.error(userListKeyCheck.stateDescription);
      return userListKeyCheck.stateDescription; //Global API Key fail
    }

    this.#apiPrinterTickerWrap("Passed User List check", "Complete");
    logger.info("Passed User List check!");

    const currentUserCheck = !!this.currentUser;
    if (!currentUserCheck) {
      const currentUserKeyCheck = {
        state: "Current User Fail!",
        stateDescription:
          "Unable to grab current user from OctoPrint, please try setting a user from user list..."
      };
      this.setPrinterState(PRINTER_STATES(currentUserKeyCheck).SHUTDOWN);
      this.#apiPrinterTickerWrap(currentUserKeyCheck.stateDescription, "Offline");
      logger.error(currentUserKeyCheck.stateDescription);
      return currentUserKeyCheck.stateDescription; //Global API Key fail
    }

    //Clean settings data...
    this.cleanPrintersInformation();

    this.onboarding.fullyScanned = true;

    this.#db.update({ onboarding: this.onboarding });

    // Get a session key
    await this.#setupWebsocket();

    //Grab optional api data
    const optionalPromises = [];
    optionalApiCheckSequence.forEach((call) => {
      const thisFunction = this.grabInformationFromDevice(call);
      optionalPromises.push(thisFunction);
    });

    await Promise.allSettled(optionalPromises);

    this.#apiPrinterTickerWrap("Printer enabled!", "Complete");

    return "Successfully enabled printer...";
  }

  checkStatusNumber(status) {
    switch (status) {
      case 200:
      case 201:
        this.setHostState(PRINTER_STATES().HOST_ONLINE);
        return true;
      case 408:
        // Failed to find the printer on the high seas, fail and don't reconnect user iteraction required...
        const timeout = {
          hostState: "Timeout!",
          hostDescription: "Printer timed out, will attempt reconnection..."
        };
        this.setAllPrinterStates(PRINTER_STATES(timeout).SHUTDOWN);
        this.reconnectAPI();
        return "Failed to test the waters! Please check the connection log";
      case 503:
        const unavailable = {
          hostState: "Service Unavailable!",
          hostDescription: "Printer is unavailable, will attempt reconnection..."
        };
        this.setAllPrinterStates(PRINTER_STATES(unavailable).SHUTDOWN);
        this.reconnectAPI();
        return "Failed because of octoprint server error!";
      case 502:
        const badGateway = {
          hostState: "Bad Gateway!",
          hostDescription: "Printer is unavailable, will attempt reconnection..."
        };
        this.setAllPrinterStates(PRINTER_STATES(badGateway).SHUTDOWN);
        this.reconnectAPI();
        return "Failed because of octoprint server error!";
      case 404:
        const notFound = {
          hostState: "Not Found!",
          hostDescription:
            "Couldn't find endpoint... please check your URL! will not attempt reconnect..."
        };
        this.setAllPrinterStates(PRINTER_STATES(notFound).SHUTDOWN);
        return "Failed because octoprint is unavailable";
      case 403:
        const forbidden = {
          hostState: "Forbidden!",
          hostDescription:
            "Could not establish authentication... please check your API key and try again!"
        };
        this.setAllPrinterStates(PRINTER_STATES(forbidden).SHUTDOWN);
        return "Failed because octoprint forbid OctoFarm!";
      default:
        const unknown = {
          hostState: "Hard Fail!",
          hostDescription:
            "Something is seriously wrong... please check all settings! will not attempt reconnect..."
        };
        this.setAllPrinterStates(PRINTER_STATES(unknown).SHUTDOWN);
        return "Failed due to unknown causes";
    }
  }

  async grabInformationFromDevice({
    api = undefined,
    tickerMessage = "",
    apiCheck = undefined,
    captureDataKeys = [],
    dataRetrievalFunction = undefined
  }) {
    if (!api) {
      throw new Error("API Endpoint required!");
    }
    this.#apiPrinterTickerWrap(`Acquiring ${tickerMessage}`, "Info");

    if (!!apiCheck) {
      this.#apiChecksUpdateWrap(apiCheck, "warning");
    }

    const apiCall = await this.#api.grabInformation(api);

    if (!apiCall?.ok) {
      this.#apiPrinterTickerWrap(`Failed to acquire ${tickerMessage}`, "Offline");

      if (!!apiCheck) {
        this.#apiChecksUpdateWrap(apiCheck, "danger");
      }
      return apiCall?.status ? apiCall.status : 408;
    }

    const jsonResponse = await apiCall.json();
    // Say yes on the ticker

    // Grab the required keys
    const pickedObject = pick(jsonResponse, [...captureDataKeys.keys()]);

    const dataRetrieved = dataRetrievalFunction(pickedObject, captureDataKeys, this, this.#db);

    if (dataRetrieved) {
      this.#apiPrinterTickerWrap(`Acquired ${tickerMessage}`, "Complete");

      if (!!apiCheck) {
        this.#apiChecksUpdateWrap(apiCheck, "success");
      }
      return apiCall.status;
    }

    this.#apiPrinterTickerWrap(`Failed to acquire ${tickerMessage}`, "Offline");

    if (!!apiCheck) {
      this.#apiChecksUpdateWrap(apiCheck, "danger");
    }

    return apiCall.status;
  }

  async getSessionkey() {
    const session = await this.acquireOctoPrintSessionKey();

    if (typeof session !== "string") {
      // Couldn't setup websocket
      const sessionKeyFail = {
        state: "Offline",
        hostDescription:
          "Failed to acquire session key, if OctoPrint is online then please check your API key and try again..."
      };
      this.setAllPrinterStates(PRINTER_STATES(sessionKeyFail).SHUTDOWN);
      return false;
    }

    return session;
  }

  setupDatabase() {
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

    if (!session) {
      logger.error("No session key found!", session);
      return;
    }
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
        .then(() => logger.debug("Successfully saved enable state for printer"), {
          disabled: true
        })
        .catch((e) => logger.error("Failed saving enable state for printer", e));
    }
    this.setupDatabase();
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
    this.lastConnectionStatus = {
      state: "Offline",
      message: "Printer disabled"
    };
    return "Printer successfully disabled...";
  }

  async setupClient() {
    this.disabled = false;
    if (this.#retryNumber === 0) {
      logger.info(
        this.printerURL + ": Running setup sequence... subsequent logs will be silenced!"
      );
      this.#apiPrinterTickerWrap(
        "Starting printer setup sequence... subsequent logs will be silenced!",
        "Info"
      );
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
          logger.info("Failed to save your new printer to database", e.toString());
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
    this.setupDatabase();

    return true;
  }

  async acquireOctoPrintSessionKey() {
    this.#apiPrinterTickerWrap("Attempting passive login", "Active");
    const passiveLogin = await this.#api.login(true);
    logger.warning("Passive login results: ", passiveLogin);
    const globalStatusCode = checkApiStatusResponse(passiveLogin);
    if (globalStatusCode === 200) {
      const sessionJson = await passiveLogin.json();
      logger.warning("Session json", sessionJson);
      this.sessionKey = sessionJson.session;
      this.#apiPrinterTickerWrap("Passive login was successful!", "Complete");
      return this.sessionKey;
    } else {
      logger.http("Passive login failed..." + passiveLogin);
      logger.error("Passive login failed..." + globalStatusCode);
      this.#apiPrinterTickerWrap("Passive login failed...", "Offline", globalStatusCode);
      return globalStatusCode;
    }
  }

  async acquireOctoPrintPiPluginData(force = false) {
    this.#apiPrinterTickerWrap("Checking if RaspberryPi", "Info");
    // Would like to skip this if not a Pi, won't even fit in the retry/not retry system so call and fail for now.
    if (!this?.octoPi || force) {
      let piPluginCheck = await this.#api.getPluginPiSupport(true).catch((e) => {
        logger.http("Failed check for raspberry pi", e.toString());
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
        logger.http("Failed to acquire raspberry pi data...", piPluginCheck);
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

    if (this.onboarding.systemApi && !force) {
      this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().SYSTEM, "success", true);
      return true;
    }

    let systemCheck = await this.#api.getSystemCommands(true).catch((e) => {
      logger.http("Failed Aquire system data", e.toString());
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
      this.onboarding.systemApi = true;
      this.#db.update({ onboarding: this.onboarding });
      return true;
    } else {
      logger.http("Failed to acquire system data..." + systemCheck);
      this.#apiPrinterTickerWrap("Failed to acquire system data", "Offline", systemCheck);
      this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().SYSTEM, "danger", true);
      return globalStatusCode;
    }
  }

  async acquireOctoPrintProfileData(force = false) {
    this.#apiPrinterTickerWrap("Acquiring state data", "Info");
    this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().STATE, "warning");
    if (!force && this.onboarding.profileApi) {
      this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().PROFILE, "success", true);
      return true;
    }

    let profileCheck = await this.#api.getPrinterProfiles(true).catch((e) => {
      logger.http("Failed Acquire profile data", e.toString());
      return false;
    });
    const globalStatusCode = checkApiStatusResponse(profileCheck);
    if (globalStatusCode === 200) {
      const { profiles } = await profileCheck.json();
      this.profiles = profiles;

      this.#db.update({
        profiles: profiles
      });

      this.#apiPrinterTickerWrap("Acquired profile data!", "Complete");
      this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().PROFILE, "success", true);

      this.onboarding.profileApi = true;
      this.#db.update({ onboarding: this.onboarding });
      return true;
    } else {
      logger.http("Failed to acquire profile data..." + profileCheck);
      this.#apiPrinterTickerWrap("Failed to acquire profile data", "Offline", profileCheck);
      this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().PROFILE, "danger", true);
      return globalStatusCode;
    }
  }

  async acquireOctoPrintStateData(force = false) {
    this.#apiPrinterTickerWrap("Acquiring state data", "Info");
    this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().STATE, "warning");

    if (!force && this.onboarding.stateApi) {
      this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().STATE, "success", true);
      return false;
    }

    let stateCheck = await this.#api.getConnection(true).catch((e) => {
      logger.http("Failed Aquire state data", e.toString());
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

      if (!!this?.current) {
        this.currentConnection = PrinterClean.sortConnection(this.current);
      }

      if (!!this?.options) {
        this.connectionOptions = PrinterClean.sortOptions(this.options);
      }
      this.#apiPrinterTickerWrap("Acquired state data!", "Complete");
      this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().STATE, "success", true);

      this.onboarding.stateApi = true;
      this.#db.update({ onboarding: this.onboarding });
      return true;
    } else {
      logger.http("Failed to acquire state data..." + stateCheck);
      this.#apiPrinterTickerWrap("Failed to acquire state data", "Offline", stateCheck);
      this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().STATE, "danger", true);
      return globalStatusCode;
    }
  }

  async acquireOctoPrintSettingsData(force = false) {
    this.#apiPrinterTickerWrap("Acquiring settings data", "Info");
    this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().SETTINGS, "warning");

    if (!force && this.onboarding.settingsApi) {
      this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().SETTINGS, "success", true);
      return true;
    }

    let settingsCheck = await this.#api.getSettings(true).catch((e) => {
      logger.http("Failed Aquire settings data", e.toString());
      return false;
    });

    const globalStatusCode = checkApiStatusResponse(settingsCheck);
    if (globalStatusCode === 200) {
      const { api, feature, folder, plugins, scripts, serial, server, system, webcam, appearance } =
        await settingsCheck.json();
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
      if (this.camURL.length === 0) {
        this.camURL = acquireWebCamData(this.camURL, this.printerURL, webcam.streamUrl);
      }
      this.costSettings = testAndCollectCostPlugin(this._id, this.costSettings, plugins);
      this.powerSettings = testAndCollectPSUControlPlugin(this._id, this.powerSettings, plugins);
      if (this.settingsAppearance.name === "Grabbing from OctoPrint...") {
        this.settingsAppearance.name = PrinterClean.grabOctoPrintName(appearance, this.printerURL);
      }
      if (this.settingsAppearance.color !== appearance.color) {
        this.settingsAppearance.color = appearance.color;
      }
      this.#db.update({
        camURL: this.camURL,
        settingsAppearance: this.settingsAppearance,
        costSettings: this.costSettings,
        powerSettings: this.powerSettings,
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
      this.onboarding.settingsApi = true;
      this.#db.update({ onboarding: this.onboarding });
      return true;
    } else {
      logger.http("Failed to acquire settings data..." + settingsCheck);
      this.#apiPrinterTickerWrap("Failed to acquire settings data", "Offline", settingsCheck);
      this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().SETTINGS, "danger", true);
      return globalStatusCode;
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
      const pluginList = await this.#api.getPluginManager(this.octoPrintVersion).catch((e) => {
        logger.http("Failed Aquire plugin lists data", e.toString());
        return e;
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
        logger.http("Failed to acquire plugin data..." + pluginList);
        this.#apiPrinterTickerWrap("Failed to acquire plugin lists data", "Offline", pluginList);
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
      force ||
      !this?.octoPrintUpdate ||
      !this?.octoPrintPluginUpdates ||
      this?.octoPrintPluginUpdates.length === 0
    ) {
      const updateCheck = await this.#api.getSoftwareUpdateCheck(force, true).catch((e) => {
        logger.http("Failed Aquire updates data", e.toString());
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
        logger.http("Failed to acquire octoprint updates data..." + updateCheck);
        this.#apiPrinterTickerWrap(
          "Failed to acquire OctoPrint updates data",
          "Offline",
          updateCheck
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

  async acquireOctoPrintFileData(fullPath) {
    const filesCheck = await this.#api.getFile(fullPath, true).catch((e) => {
      logger.http("Failed Aquire file data", e.toString());
      return false;
    });
    const globalStatusCode = checkApiStatusResponse(filesCheck);

    if (globalStatusCode === 200) {
      const fileEntry = await filesCheck.json();
      let timeStat;
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
      let path;
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
        return o.fullPath === fileInformation.fullPath;
      });

      this.fileList.fileList[fileIndex] = fileInformation;

      this.#db.update({ fileList: this.fileList });

      return fileInformation;
    } else {
      logger.http("File could not be re-synced" + filesCheck);
      return false;
    }
  }

  async acquireOctoPrintFilesData(force = false, returnObject = false) {
    this.#apiPrinterTickerWrap("Acquiring file list data", "Info");
    this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().FILES, "warning");

    if (!this.onboarding.fullyScanned) {
      force = true;
    }

    if (force || this?.fileList?.fileList?.length === 0) {
      const filesCheck = await this.#api.getFiles(true, true).catch((e) => {
        logger.http("Failed Aquire files data", e.toString());
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

        this.fileList = {
          fileList: printerFiles,
          filecount: printerFiles.length,
          folderList: printerLocations,
          folderCount: printerLocations.length
        };

        this.#db.update({
          storage: this.storage,
          fileList: {
            fileList: printerFiles,
            filecount: printerFiles.length,
            folderList: printerLocations,
            folderCount: printerLocations.length
          }
        });

        this.#apiPrinterTickerWrap("Acquired file list data!", "Complete");
        this.#apiChecksUpdateWrap(ALLOWED_SYSTEM_CHECKS().FILES, "success", true);
        if (!returnObject) {
          return true;
        } else {
          return {
            fileList: printerFiles,
            filecount: printerFiles.length,
            folderList: printerLocations,
            folderCount: printerLocations.length
          };
        }
      } else {
        logger.http("Failed to acquire file list data..." + filesCheck);
        this.#apiPrinterTickerWrap("Failed to acquire file list data", "Offline", filesCheck);
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
      logger.http("Failed Aquire profile data", e.toString());
      return 900;
    });
    return checkApiStatusResponse(profilePatch);
  }

  async updateOctoPrintSettingsData(settings) {
    this.#apiPrinterTickerWrap("Updating OctoPrint settings data", "Info");
    const settingsPost = await this.#api.postSettings(settings).catch((e) => {
      logger.http("Failed Update settings data", e.toString());
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

    return this?.#db?.update(data);
  }

  updatePrinterLiveValue(object) {
    assign(this, object);
    logger.silly("Updating live printer data", object);
  }

  pushUpdatePrinterDatabase(key, data) {
    logger.silly("Push updating printer database", { key, data });
    this?.#db?.pushAndUpdate(this._id, key, data);
  }

  updatePrinterData(data) {
    logger.silly("Updating printer database: ", data);
    this.#db.update(data);
  }

  resetApiTimeout() {
    logger.debug("Clearning API Timeout");
    clearTimeout(this.#reconnectTimeout);
    this.#reconnectTimeout = false;
    const { timeout } = SettingsClean.returnSystemSettings();
    this.#apiRetry = timeout.apiRetry;
    this.reconnectingIn = 0;
    this.#retryNumber = 0;
    logger.debug("Cleared API Timeout", {
      reconnectTimeout: this.#reconnectTimeout,
      apiRetry: this.#apiRetry,
      reconnectingIn: this.reconnectingIn,
      retryNumber: this.#retryNumber
    });
  }

  async forceReconnect() {
    if (this.disabled) {
      return "Sorry, I'm disabled I cannot perform this action!";
    }
    this.setAllPrinterStates(PRINTER_STATES().SEARCHING);
    this.resetApiTimeout();
    return this.resetSocketConnection(true);
  }

  setPrinterToSearching() {
    this.setAllPrinterStates(PRINTER_STATES().SEARCHING);
  }

  resetConnectionInformation(force = true) {
    if (!!this?.#api) {
      this.#api.updateConnectionInformation(this.printerURL, this.apikey);
    }

    if (!!this?.#ws) {
      this.#ws.updateConnectionInformation(this.webSocketURL, this.currentUser);
    }

    return this.resetSocketConnection(force);
  }

  async resetSocketConnection(force = false) {
    return this.enablePrinter(force)
      .then((res) => {
        logger.debug(res);
        return res;
      })
      .catch((e) => {
        logger.error("Failed starting service", e.toString());
        return e;
      });
  }

  reconnectAPI() {
    if (this.#retryNumber < 1) {
      logger.info(
        this.printerURL +
          ` | Setting up reconnect in ${this.#apiRetry}ms retry #${this.#retryNumber}`
      );
      PrinterTicker.addIssue(
        new Date(),
        this.printerURL,
        `Setting up reconnect in ${this.#apiRetry}ms retry #${
          this.#retryNumber
        }. Subsequent logs will be silenced...`,
        "Active",
        this._id
      );
    }

    if (this.#reconnectTimeout !== false) {
      logger.warning("Ignoring Setup reconnection attempt!");
      return;
    }
    this.#retryNumber = this.#retryNumber + 1;
    this.reconnectingIn = Date.now() + this.#apiRetry;
    if (!!this.#reconnectTimeout) return; //Reconnection is planned..
    this.#reconnectTimeout = setTimeout(() => {
      this.reconnectingIn = 0;
      if (this.#retryNumber > 0) {
        const modifier = this.timeout.apiRetry * 0.1;
        this.#apiRetry = this.#apiRetry + modifier;
        logger.debug(this.printerURL + ": API modifier " + modifier);
      } else if (this.#retryNumber === 0) {
        logger.info(this.printerURL + ": Attempting to reconnect to printer!");
        PrinterTicker.addIssue(
          new Date(),
          this.printerURL,
          "Attempting to reconnect to printer! Any subsequent logs will be silenced...",
          "Active",
          this._id
        );
      }
      clearTimeout(this.#reconnectTimeout);
      this.#reconnectTimeout = false;
      this.setAllPrinterStates(PRINTER_STATES().SEARCHING);
      return this.resetSocketConnection();
    }, this.#apiRetry);
  }

  async acquireOctoPrintLatestSettings(force = false) {
    await Promise.allSettled([
      this.acquireOctoPrintStateData(force),
      this.acquireOctoPrintSystemData(force),
      this.acquireOctoPrintSettingsData(force)
    ]);
    await this.cleanPrintersInformation();
  }

  async acquirePrinterPowerState() {
    const { powerStatusURL, powerStatusCommand } = this.powerSettings;

    if (!canWeDetectPrintersPowerState(powerStatusURL)) {
      return;
    }

    const powerURL = createPrinterPowerURL(powerStatusURL);
    let powerReturnState;
    if (!!powerStatusCommand && powerStatusCommand.length === 0) {
      powerReturnState = await this.#api.getPrinterPowerState(powerURL).catch((e) => {
        logger.http("Failed Aquire profile data", e.toString());
        return 900;
      });
    } else {
      powerReturnState = await this.#api
        .postPrinterPowerState(powerURL, JSON.parse(powerStatusCommand))
        .catch((e) => {
          logger.http("Failed Aquire profile data", e.toString());
          return 900;
        });
    }

    if (powerReturnState.ok) {
      this.printerPowerState = parseOctoPrintPowerResponse(await powerReturnState.json());
    }

    return this.printerPowerState;
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
    this.#apiPrinterTickerWrap("Removing printer from database", "Active");
    return this.#db.delete();
  }

  async secondaryFileInformationUpdate(fullPath) {
    const fileInformation = await this.acquireOctoPrintFileData(fullPath);
    const fileIndex = findIndex(this.fileList.fileList, function (o) {
      return o.fullPath === fullPath;
    });
    if (fileIndex > -1 && !!fileInformation) {
      this.notifySubscribersOfFileInformationChange(fullPath, fileIndex, {
        printerID: this._id
      });
    }
  }

  async updateFileInformation(data) {
    const { result, path: fullPath } = data;
    const fileIndex = findIndex(this.fileList.fileList, function (o) {
      return o.fullPath === fullPath;
    });

    if (fileIndex > -1 && !!result) {
      logger.debug("Updating file information with generated OctoPrint data", data);
      const { estimatedPrintTime, filament } = result;

      const toolInfo = [];

      if (!!estimatedPrintTime) {
        this.fileList.fileList[fileIndex].time = estimatedPrintTime;
      }
      if (!!filament) {
        Object.keys(filament).forEach(function (item, i) {
          toolInfo[i] = filament[item].length;
        });
        this.fileList.fileList[fileIndex].length = toolInfo;
      }

      this.#db.update({ fileList: this.fileList });

      this.notifySubscribersOfFileInformationChange(fullPath, fileIndex);
      //Grab api once more after this for full update of file... including thumbnail
      setTimeout(async () => {
        await this.secondaryFileInformationUpdate(fullPath);
      }, 2000);
    } else {
      logger.error("updateFileInformation: Couldn't find file index to update!", fullPath);
    }
  }

  notifySubscribersOfFileInformationChange(fullPath, fileIndex, additionalInformation = undefined) {
    notifySubscribers(fullPath, MESSAGE_TYPES.FILE_UPDATE, {
      key: "fileInformationUpdated",
      value: FileClean.generateSingle(
        JSON.parse(JSON.stringify(this.fileList.fileList[fileIndex])),
        this.selectedFilament,
        this.costSettings
      ),
      additionalInformation
    });
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

  ping() {
    if (!!this?.#ws) {
      this.#ws.ping();
    }
  }

  resetJobInformation() {
    const job = {
      file: {
        name: null,
        path: null,
        display: null,
        origin: null,
        size: null,
        date: null
      },
      estimatedPrintTime: null,
      averagePrintTime: null,
      lastPrintTime: null,
      filament: null,
      user: null
    };

    const progress = {
      completion: 0,
      filepos: null,
      printTime: null,
      printTimeLeft: null,
      printTimeLeftOrigin: null
    };

    this.currentJob = JobClean.generate(
      job,
      this.selectedFilament,
      this.fileList,
      0,
      this.costSettings,
      progress
    );
  }

  cleanPrintersInformation() {
    this.otherSettings = PrinterClean.sortOtherSettings(
      this.tempTriggers,
      this.settingsWebcam,
      this.settingsServer
    );
    this.currentProfile = PrinterClean.sortProfile(this.profiles, this.current);

    this.currentConnection = PrinterClean.sortConnection(this.current);

    this.connectionOptions = PrinterClean.sortOptions(this.options);

    this.gcodeScripts = PrinterClean.sortGCODE(this.settingsScripts);

    this.currentJob = JobClean.generate(
      this.job,
      this.selectedFilament,
      this.fileList,
      this.currentZ,
      this.costSettings,
      this.progress
    );
  }

  async deleteAllFilesAndFolders() {
    //Clear out all files...
    const deletedFiles = [];
    const deletedFolders = [];

    const fileList = JSON.parse(JSON.stringify(this.fileList.fileList));
    const folderList = JSON.parse(JSON.stringify(this.fileList.folderList));

    for (const path of fileList) {
      logger.warning("Deleting File: ", path.fullPath);
      const pathDeleted = await this.#api.deleteFile(path.fullPath).catch((e) => {
        logger.http("Error deleting file!", e.toString());
        return false;
      });
      const globalStatusCode = checkApiStatusResponse(pathDeleted);
      if (globalStatusCode === 204) {
        const fileIndex = findIndex(this.fileList.fileList, function (o) {
          return o.fullPath === path.fullPath;
        });
        this.fileList.fileList.splice(fileIndex, 1);
        deletedFiles.push(path.fullPath);
        logger.info("Deleted: ", path.fullPath);
      } else {
        logger.error("Failed to delete file...", path.fullPath);
      }
    }

    for (const path of folderList) {
      logger.warning("Deleting Folder: ", path.name);
      const pathDeleted = await this.#api.deleteFile(`${path.name}`).catch((e) => {
        logger.http("Error deleting folder!", e.toString());
        return false;
      });
      const globalStatusCode = checkApiStatusResponse(pathDeleted);

      if (globalStatusCode === 204) {
        const folderIndex = findIndex(this.fileList.folderList, function (o) {
          return o.name === path.name;
        });

        this.fileList.folderList.splice(folderIndex, 1);
        deletedFolders.push(path.name);
        logger.info("Deleted Folder: ", path.name);
      } else {
        logger.error("Failed to delete folder...", path.name);
      }
    }

    this.fileList.filecount = 0;
    this.fileList.folderCount = 0;
    this.#db.update({ fileList: this.fileList });
    logger.info("Deleted files... ", deletedFiles);
    logger.info("Deleted folders... ", deletedFolders);
    return { deletedFiles, deletedFolders };
  }

  async houseKeepFiles(pathList) {
    const deletedList = [];
    for (const path of pathList) {
      const pathDeleted = await this.#api.deleteFile(path).catch((e) => {
        logger.http("Error deleting file!", e.toString());
        return false;
      });
      const globalStatusCode = checkApiStatusResponse(pathDeleted);

      if (globalStatusCode === 204) {
        deletedList.push(path);
        const fileIndex = findIndex(this.fileList.fileList, function (o) {
          return o.fullPath === path;
        });
        this.fileList.fileList.splice(fileIndex, 1);
      } else {
        logger.error("Failed to delete file...", path);
      }
    }

    this.fileList.filecount = this.fileList.fileList.length;
    this.fileList.folderCount = this.fileList.folderList.length;

    this.#db.update({ fileList: this.fileList });
    return deletedList;
  }

  clearSelectedSpools() {
    FilamentClean.removeSelectedSpoolsFromList(this.selectedFilament);
  }
}

module.exports = {
  OctoPrintPrinter
};
