const { systemChecks, tempTriggers } = require("./constants/printer-defaults.constants");
const { PRINTER_STATES, CATEGORIES } = require("./constants/printer-state.constants");
const { OctoprintApiClientService } = require("../octoprint/octoprint-api-client.service");
const { SettingsClean } = require("../../lib/dataFunctions/settingsClean");
const PrinterDatabaseService = require("./printer-database.service");
const { isEmpty, assign } = require("lodash");
const { checkApiStatusResponse } = require("../../utils/api.utils");
const {
  acquireWebCamData,
  acquirePrinterNameData,
  acquirePrinterFilesAndFolderData
} = require("../octoprint/utils/printer-data.utils");
const {
  testAndCollectCostPlugin,
  testAndCollectPSUControlPlugin
} = require("../octoprint/utils/octoprint-plugin.utils");
const { checkSystemInfoAPIExistance } = require("../../utils/compatibility.utils");
const softwareUpdateChecker = require("../../services/octofarm-update.service");
const WebSocketClient = require("../octoprint/octoprint-websocket-client.service");
const { handleMessage } = require("../octoprint/octoprint-websocket-message.service");
const { PrinterTicker } = require("../../runners/printerTicker");
const { FileClean } = require("../../lib/dataFunctions/fileClean");
const Logger = require("../../handlers/logger");
const { PrinterClean } = require("../../lib/dataFunctions/printerClean");
const printerModel = require("../../models/Printer");

const logger = new Logger("OctoFarm-State");

class OctoPrintPrinter {
  //OctoFarm state
  disabled = false;
  display = true;
  #retryNumber = 0;
  multiUserIssue = undefined;
  restartRequired = false;
  coolDownEvent = undefined;
  //Communications
  #api = undefined;
  #ws = undefined;
  #db = undefined;
  #apiRetry = undefined;
  timeout = undefined;
  reconnectTimeout = undefined;
  #reconnectingIn = 0;
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
  systemChecks = Object.assign({}, systemChecks);
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
  tempTriggers = Object.assign({}, tempTriggers);
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
  otherSettings = undefined;

  //Updated by API / database
  octoPi = undefined;
  costSettings = null;
  powerSettings = null;
  klipperFirmwareVersion = undefined;
  printerFirmware = undefined;
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
  octoPrintSystemInfo = undefined;

  //Processed Information from cleaners
  hostState = undefined;
  printerState = undefined;
  webSocketState = undefined;
  order = undefined;

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

    if (!!printer?._id) {
      this.#updatePrinterRecordsFromDatabase(printer);
    }

    this.#updatePrinterSettingsFromDatabase();

    this.startOctoPrintService();
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
    if (!!pluginsList) {
      this.pluginsList = pluginsList;
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
    if (!!settingsAppearance) {
      this.settingsAppearance = settingsAppearance;
    }
    if (!!disabled) {
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
          fileCount: fileList.files.length,
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
      this.settingsScripts = PrinterClean.sortGCODE(settingsScripts);
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

    this.setAllPrinterStates(PRINTER_STATES.SETTING_UP);
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

  #updatePrinterSettingsFromDatabase() {
    const { timeout } = SettingsClean.returnSystemSettings();
    this.timeout = timeout;
    this.#apiRetry = timeout.apiRetry;
    this.#retryNumber = 0;
    this.#reconnectingIn = 0;
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

  async enableClient() {}

  async disableClient() {}

  async changeURL() {}

  async changeUser() {}

  async changeAPIKey() {}

  async reConnectWebsocket() {
    this.#ws.terminate();
  }

  async throttleWebSocket(throttle) {}

  async forceAPIScan() {
    logger.info((this.printerURL = ": force API scan requested!"));
    await this.#requiredApiSequence(true);
    await this.#optionalApiSequence(true);
  }

  async updatePrinterRecord(record) {
    logger.debug(this.printerURL + ": updating printer with new record: ", record);
    this.#db.update(record);
  }

  startOctoPrintService() {
    if (!this?.disabled) {
      this.enablePrinter().then();
    } else {
      this.disablePrinter();
    }
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
      this.reconnectAPI();
      return;
    }

    this.setHostState(PRINTER_STATES.HOST_ONLINE);

    // Grab user list, current user and passively login to the client, Fail to Shutdown
    const initialApiCheck = await this.initialApiCheckSequence();

    const apiCheckFail = initialApiCheck.map((check) => {
      return check.value === 900;
    });
    // Global api heck triggered, fail with no reconnect
    if (apiCheckFail.includes(true)) {
      this.setPrinterState(PRINTER_STATES.SHUTDOWN_API_GLOBAL_FAIL);
      this.setWebsocketState(PRINTER_STATES.WS_OFFLINE);
      return;
    }

    const initialApiCheckValues = initialApiCheck.map((check) => {
      return typeof check.value === "number";
    });
    // User list fail... reconnect same as others, probably network at this stage.
    if (initialApiCheckValues.includes(true)) {
      this.reconnectAPI();
      return;
    }

    // Grab required api data, fail to shutdown... should not continue without this data...
    const requiredApiCheck = await this.#requiredApiSequence();
    const requiredApiCheckValues = requiredApiCheck.map((check) => {
      return typeof check.value === "number";
    });
    if (requiredApiCheckValues.includes(true)) {
      this.setHostState(PRINTER_STATES.SHUTDOWN_API_FAIL);
      this.setPrinterState(PRINTER_STATES.SHUTDOWN_API_FAIL);
      return;
    }

    // Get a session key
    await this.#setupWebsocket();

    // Grab optional api data
    await this.#optionalApiSequence();
  }

  async #setupWebsocket(force = false) {
    if (!this?.#ws || force) {
      if (force) {
        // If forced we allow the resetup of websocket connection
        this.killAllConnections();
        this.#ws = undefined;
      }
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
      const session = await this.acquireOctoPrintSessionKey();

      if (typeof session !== "string") {
        // Couldn't setup websocket
        this.setHostState(PRINTER_STATES.SHUTDOWN_WEBSOCKET_FAIL);
        this.setPrinterState(PRINTER_STATES.SHUTDOWN_WEBSOCKET_FAIL);
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
  }

  disablePrinter() {
    this.disabled = true;
    this.setAllPrinterStates(PRINTER_STATES.DISABLED);
    logger.debug(this.printerURL + ": client set as disabled...");
    PrinterTicker.addIssue(
      new Date(),
      this.printerURL,
      "Printer is marked as disabled. Ignoring until re-enabled...",
      "Offline",
      this._id
    );
  }

  getMessageNumber() {
    return this.#ws.getMessageNumber();
  }

  async testTheApiWaters() {
    return await this.acquireOctoPrintVersionData();
  }

  async setupClient() {
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
          logger.info("Successfully saved your new printer to database", res);
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
      this.#api = new OctoprintApiClientService(this.printerURL, this.apikey, this.timeout);
    }

    // Create database client
    if (!this?.#db) {
      logger.debug(this.printerURL + ": Creating printer database link");
      this.#db = new PrinterDatabaseService(this._id);
    }

    return true;
  }

  reconnectAPI() {
    this.setAllPrinterStates(PRINTER_STATES.SHUTDOWN);
    logger.info(
      this.printerURL + `Setting up reconnect in ${this.#apiRetry}ms retry #${this.#retryNumber}`
    );
    if (this.#retryNumber < 1) {
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

    this.reconnectTimeout = setTimeout(() => {
      this.setAllPrinterStates(PRINTER_STATES.SEARCHING);
      if (this.#retryNumber > 0) {
        const modifier = this.timeout.apiRetry * 0.1;
        this.#apiRetry = this.#apiRetry + modifier;
        logger.debug(this.printerURL + ": API modifier " + modifier);
        this.#reconnectingIn = this.#apiRetry;
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
      this.enablePrinter().then();
      this.reconnectTimeout = false;
      this.#retryNumber = this.#retryNumber + 1;
    }, this.#apiRetry);
  }

  // Base minimum viable requirements for websocket connection
  async initialApiCheckSequence() {
    logger.debug(this.printerURL + ": Gathering Initial API Data");
    this.#apiPrinterTickerWrap("Gathering Initial API Data", "Info");
    return await Promise.allSettled([this.globalAPIKeyCheck(), this.acquireOctoPrintUsersList()]);
  }

  // Only run this when we've confirmed we can at least get a session key + api responses from OctoPrint
  async #requiredApiSequence(force = false) {
    logger.info(this.printerURL + ": Gathering required API data. Forced Scan: " + force);
    this.#apiPrinterTickerWrap("Gathering required API data.", "Info", " Forced Scan: " + force);
    return await Promise.allSettled([
      this.acquireOctoPrintSettingsData(force),
      this.acquireOctoPrintSystemData(force),
      this.acquireOctoPrintProfileData(force),
      this.acquireOctoPrintStateData(force)
    ]);
  }
  async #optionalApiSequence(force = false) {
    logger.info(this.printerURL + ": Gathering optional API data. Forced Scan: " + force);
    this.#apiPrinterTickerWrap("Gathering optional API data.", "Info", " Forced Scan: " + force);

    return await Promise.allSettled([
      this.acquireOctoPrintSystemInfoData(force),
      this.acquireOctoPrintPluginsListData(force),
      this.acquireOctoPrintUpdatesData(force),
      this.acquireOctoPrintFilesData(force),
      this.acquireOctoPrintPiPluginData(force)
    ]);
  }

  async globalAPIKeyCheck() {
    // Compare entered API key to settings API Key...
    this.#apiPrinterTickerWrap("Checking API key doesn't match global API key...", "Active");
    const globalAPIKeyCheck = await this.#api.getSettings(true).catch(() => {
      return false;
    });
    const globalStatusCode = checkApiStatusResponse(globalAPIKeyCheck);
    if (globalStatusCode === 200) {
      //Safe to continue check
      const { api } = await globalAPIKeyCheck.json();

      if (!api) {
        // logger.error(`Settings json does not exist: ${this.printerURL}`);
        return false;
      }
      const keyCheck = api.key !== this.apikey;
      if (keyCheck) {
        this.#apiPrinterTickerWrap("API key is not global API", "Complete");
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
    const passiveLogin = await this.#api.login(true).catch(() => {
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

  async acquireOctoPrintUsersList(force = false) {
    this.#apiPrinterTickerWrap("Acquiring User List", "Info");
    let usersCheck = await this.#api.getUsers(true).catch(() => {
      return false;
    });

    let globalStatusCode = checkApiStatusResponse(usersCheck);

    if (globalStatusCode === 200) {
      const userJson = await usersCheck.json();

      const userList = userJson.users;

      // If we have no idea who the user is then
      if (!this?.currentUser || this.userList.length === 0 || force) {
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
          return true;
        } else {
          //If the userList isn't empty then we need to parse out the users and search for octofarm user.
          for (let u = 0; u < userList.length; u++) {
            const currentUser = userList[u];
            if (currentUser.admin) {
              // Look for OctoFarm user and break, if not use the first admin we find
              if (currentUser.name === "octofarm" || currentUser.name === "OctoFarm") {
                this.currentUser = currentUser.name;
                this.#db.update({ currentUser: this.currentUser });

                this.userList.push(currentUser.name);
                //We only break out here because it's doubtful with a successful connection we need the other users.
                break;
              }
              // If no octofarm user then collect the rest for user choice in ui.
              if (!this?.currentUser) {
                // We should not override the database value to allow users to update it.
                this.currentUser = currentUser.name;
                this.#db.update({ currentUser: this.currentUser });
              }
              this.userList.push(currentUser.name);
            }
          }
          this.#apiPrinterTickerWrap(
            "Successfully acquired " + userList.length + " users...",
            "Complete",
            "Current User: " + this.currentUser
          );
          return true;
        }
      } else {
        this.#apiPrinterTickerWrap(
          "User list acquired previously... skipping!",
          "Complete",
          "Current User: " + this.currentUser
        );
        return true;
      }
    } else {
      this.#apiPrinterTickerWrap("Failed to acquire user list...", "Offline");
      return globalStatusCode;
    }
  }

  async acquireOctoPrintVersionData() {
    logger.debug(this.printerURL + ": Acquiring OctoPrint Version.", {
      alreadyAvailable: this?.octoPrintVersion,
      currentVersion: this.octoPrintVersion
    });
    if (this.#retryNumber === 0) {
      this.#apiPrinterTickerWrap("Testing the high sea!", "Active");
    }

    let versionCheck = await this.#api.getVersion(true).catch(() => {
      return false;
    });
    const globalStatusCode = checkApiStatusResponse(versionCheck);
    if (globalStatusCode === 200) {
      const { server } = await versionCheck.json();
      this.octoPrintVersion = server;
      this.#db.update({
        octoPrintVersion: server
      });
      logger.info(this.printerURL + ": Acquired OctoPrint Version.", {
        octoPrintVersion: server
      });
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
      let piPluginCheck = await this.#api.getPluginPiSupport(true).catch(() => {
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
    if ((!this?.core && this.core.length === 0) || force) {
      let systemCheck = await this.#api.getSystemCommands(true).catch(() => {
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
        return true;
      } else {
        this.#apiPrinterTickerWrap(
          "Failed to acquire system data",
          "Offline",
          "Error Code: " + globalStatusCode
        );
        return globalStatusCode;
      }
    } else {
      this.#apiPrinterTickerWrap("System data acquired previously... skipped!", "Complete");
      // Call was skipped as we have data or not forced
      return true;
    }
  }

  async acquireOctoPrintProfileData(force = false) {
    this.#apiPrinterTickerWrap("Acquiring profile data", "Info");
    if (!this?.profiles || force) {
      let profileCheck = await this.#api.getPrinterProfiles(true).catch(() => {
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
        return true;
      } else {
        this.#apiPrinterTickerWrap(
          "Failed to acquire profile data",
          "Offline",
          "Error Code: " + globalStatusCode
        );
        return globalStatusCode;
      }
    } else {
      this.#apiPrinterTickerWrap("Profile data acquired previously... skipped!", "Complete");
      // Call was skipped as we have data or not forced
      return true;
    }
  }

  async acquireOctoPrintStateData(force = false) {
    this.#apiPrinterTickerWrap("Acquiring state data", "Info");
    if (!this?.current || !this?.options || force) {
      let stateCheck = await this.#api.getConnection(true).catch(() => {
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
        return true;
      } else {
        this.#apiPrinterTickerWrap(
          "Failed to acquire state data",
          "Offline",
          "Error Code: " + globalStatusCode
        );
        return globalStatusCode;
      }
    } else {
      this.#apiPrinterTickerWrap("State data acquired previously... skipped!", "Complete");
      // Call was skipped as we have data or not forced
      return true;
    }
  }

  async acquireOctoPrintSettingsData(force = false) {
    this.#apiPrinterTickerWrap("Acquiring settings data", "Info");
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
      let settingsCheck = await this.#api.getSettings(true).catch(() => {
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
          this.settingsAppearance = acquirePrinterNameData(this.settingsAppearance, appearance);
          this.costSettings = testAndCollectCostPlugin(this.costSettings, plugins);
          this.powerSettings = testAndCollectPSUControlPlugin(this.powerSettings, plugins);
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

        this.settingsScripts = PrinterClean.sortGCODE(scripts);
        this.otherSettings = PrinterClean.sortOtherSettings(this.tempTriggers, webcam, server);
        this.printerName = PrinterClean.grabPrinterName(appearance, this.printerURL);
        this.#apiPrinterTickerWrap("Acquired settings data!", "Complete");
        return true;
      } else {
        this.#apiPrinterTickerWrap(
          "Failed to acquire settings data",
          "Offline",
          "Error Code: " + globalStatusCode
        );
        return globalStatusCode;
      }
    } else {
      this.#apiPrinterTickerWrap("State data acquired previously... skipped!", "Complete");
      // Call was skipped as we have data or not forced
      return true;
    }
  }

  async acquireOctoPrintSystemInfoData(force = false) {
    if (!checkSystemInfoAPIExistance(this.octoPrintVersion)) return false;
    this.#apiPrinterTickerWrap("Acquiring system information plugin data", "Info");
    if (!this?.octoPrintSystemInfo || force) {
      let systemInfoCheck = await this.#api.getSystemInfo(true).catch(() => {
        return false;
      });

      const globalStatusCode = checkApiStatusResponse(systemInfoCheck);

      if (globalStatusCode === 200) {
        const { systemInfo } = await systemInfoCheck.json();
        this.octoPrintSystemInfo = systemInfo;
        this.#db.update({
          octoPrintSystemInfo: systemInfo
        });
        this.#apiPrinterTickerWrap("Acquired system information plugin data!", "Complete");
        return true;
      } else {
        this.#apiPrinterTickerWrap(
          "Failed to acquire system information plugin data",
          "Offline",
          "Error Code: " + globalStatusCode
        );
        return globalStatusCode;
      }
    } else {
      this.#apiPrinterTickerWrap(
        "System information plugin data acquired previously... skipped!",
        "Complete"
      );
      // Call was skipped as we have data or not forced
      return true;
    }
  }

  async acquireOctoPrintPluginsListData(force = true) {
    if (!!softwareUpdateChecker.getUpdateNotificationIfAny().air_gapped) return false;
    this.#apiPrinterTickerWrap("Acquiring plugin lists data", "Info");
    if (!this.pluginsList || this.pluginsList.length === 0 || force) {
      this.pluginsList = [];
      const pluginList = await this.#api.getPluginManager(true, this.octoPrintVersion).catch(() => {
        return false;
      });
      const globalStatusCode = checkApiStatusResponse(pluginList);

      if (globalStatusCode === 200) {
        const { repository } = await pluginList.json();
        this.pluginsList = repository.plugins;
        this.#db.update({
          pluginsList: repository.plugins
        });
        this.#apiPrinterTickerWrap("Acquired plugin lists data!", "Complete");
        return true;
      } else {
        this.#apiPrinterTickerWrap(
          "Failed to acquire plugin lists data",
          "Offline",
          "Error Code: " + globalStatusCode
        );
        return globalStatusCode;
      }
    } else {
      this.#apiPrinterTickerWrap("Plugin lists data acquired previously... skipped!", "Complete");
      return true;
    }
  }

  async acquireOctoPrintUpdatesData(force = false) {
    if (softwareUpdateChecker.getUpdateNotificationIfAny().air_gapped) return false;
    this.#apiPrinterTickerWrap("Acquiring OctoPrint updates data", "Info");
    if (!this?.octoPrintUpdate || !this?.octoPrintPluginUpdates || force) {
      this.octoPrintUpdate = [];
      this.octoPrintPluginUpdates = [];
      const updateCheck = this.#api.getSoftwareUpdateCheck(force, true).catch(() => {
        return false;
      });

      const globalStatusCode = checkApiStatusResponse(updateCheck);

      if (globalStatusCode === 200) {
        const { information } = await updateCheck.json();
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

        this.pluginsList = repository.plugins;
        this.#db.update({
          octoPrintUpdate: octoPrintUpdate,
          octoPrintPluginUpdates: pluginUpdates
        });
        this.#apiPrinterTickerWrap("Acquired OctoPrint updates data!", "Complete");
        return true;
      } else {
        this.#apiPrinterTickerWrap(
          "Failed to acquire OctoPrint updates data",
          "Offline",
          "Error Code: " + globalStatusCode
        );
        return globalStatusCode;
      }
    } else {
      this.#apiPrinterTickerWrap(
        "OctoPrint updates data acquired previously... skipped!",
        "Complete"
      );
      return true;
    }
  }

  async acquireOctoPrintFilesData(force = false) {
    this.#apiPrinterTickerWrap("Acquiring file list data", "Info");
    if (!this?.fileList || !this?.storage || force) {
      this.fileList = {
        files: [],
        fileCount: 0,
        folders: [],
        folderCount: 0
      };
      this.storage = {
        free: 0,
        total: 0
      };

      const filesCheck = await this.#api.getFiles(true, true).catch(() => {
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
            fileCount: printerFiles.length,
            folders: printerLocations,
            folderCount: printerLocations.length
          }
        });

        this.fileList = FileClean.generate(
          {
            files: printerFiles,
            fileCount: printerFiles.length,
            folders: printerLocations,
            folderCount: printerLocations.length
          },
          this.selectedFilament,
          this.costSettings
        );
        this.#apiPrinterTickerWrap("Acquired file list data!", "Complete");
        return true;
      } else {
        this.#apiPrinterTickerWrap(
          "Failed to acquire file list data",
          "Offline",
          "Error Code: " + globalStatusCode
        );
        return globalStatusCode;
      }
    } else {
      this.#apiPrinterTickerWrap("File list data acquired previously... skipped!", "Complete");
      return true;
    }
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
    logger.debug("Updating printer database: ", data);
    this.#db.update(data);
  }

  killApiTimeout() {
    logger.debug("Clearning API Timeout", this.reconnectTimeout);
    clearTimeout(this.reconnectTimeout);
  }

  killAllConnections() {
    this.killApiTimeout();
    if (!this?.#ws) return false;
    return this.#ws.killAllConnectionsAndListeners();
  }
}

module.exports = {
  OctoPrintPrinter
};
