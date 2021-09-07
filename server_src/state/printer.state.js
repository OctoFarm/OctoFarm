const JobsCache = require("./data/jobs.cache");
const {
  getCurrentProfileDefault
} = require("../services/octoprint/constants/octoprint-service.constants");
const { PEVENTS } = require("../constants/event.constants");
const {
  getDefaultPrinterState,
  WS_STATE,
  EVENT_TYPES
} = require("../services/octoprint/constants/octoprint-websocket.constants");
const {
  getSystemChecksDefault,
  mapStateToColor,
  PSTATE,
  SYSTEM_CHECKS,
  MESSAGE
} = require("../constants/state.constants");
const Logger = require("../handlers/logger.js");

/**
 * This is a model to simplify unified printers state
 * This class is designed with serialization to network, file and possibly database in mind.
 */
class PrinterState {
  #id;

  #hostState = {
    state: PSTATE.Offline,
    colour: mapStateToColor(PSTATE.Offline),
    desc: "Setting up your Printer"
  };

  #websocketAdapter;
  #messageStream;
  #messageSubscription;
  #websocketAdapterType;
  #sessionUser;
  #sessionKey;

  #stepSize = 10; // 0.1, 1, 10 or 100
  #systemChecks = getSystemChecksDefault();
  #alerts = null;

  #entityData;

  // We could split this off to a substate cache container as this data is hot from OP
  #gcodeScripts;
  #octoPrintVersion;
  #octoPrintSystemInfo = {};
  #currentProfile = getCurrentProfileDefault();
  #octoPi;

  #markedForRemoval = false;
  #apiAccessibility = {
    accessible: true,
    retryable: true,
    reason: null
  };

  #logger = new Logger("Printer-State");
  #eventEmitter2;
  #currentOperationsCache;
  #jobsCache;
  #fileCache;

  constructor({ eventEmitter2, currentOperationsCache, jobsCache, fileCache }) {
    this.#eventEmitter2 = eventEmitter2;
    this.#jobsCache = jobsCache;
    this.#fileCache = fileCache;
    this.#currentOperationsCache = currentOperationsCache;
  }

  get id() {
    return this.#id;
  }

  get markForRemoval() {
    return this.#markedForRemoval;
  }

  async setup(printerDocument) {
    this.#id = printerDocument._id.toString();
    this.updateEntityData(printerDocument, true);
  }

  async tearDown() {
    this.resetWebSocketAdapter();
    this.#markedForRemoval = true;
    this.#fileCache.purgePrinterId(this.#id);
    this.#jobsCache.purgePrinterId(this.#id);
  }

  /**
   * Update the in-memory copy of the document
   * @param printerDocument the database model to freeze
   * @param reconnect if true this will reconnect the client and WebSocket connection
   */
  updateEntityData(printerDocument, reconnect = false) {
    // TODO compare old and new for checking if a reconnect is in order
    // const { printerURL, webSocketURL } = this?.#entityData;

    this.#entityData = Object.freeze({
      ...printerDocument._doc
    });

    // We could compare previous and new data to check whether a reset is necessary
    if (reconnect) {
      this.resetConnectionState();
    }
  }

  toFlat() {
    const convertedWSState = this.getWebSocketState();
    const opMeta = this.#websocketAdapter?.getOctoPrintMeta();

    // This fetches the job saved by this instance
    let flatJob = this.#jobsCache.getPrinterJobFlat(this.#id);
    // This is formed this way to move this calculation client side
    const costSettings = this.#entityData.costSettings;
    if (flatJob) {
      flatJob.expectedFilamentCosts = [
        {
          toolName: "Tool ABC",
          spoolName: null,
          spoolId: null,
          volume: null,
          length: null,
          weight: null,
          cost: null,
          type: null
        }
      ];
      flatJob.expectedTotals = {
        totalCost: 0,
        totalVolume: 0,
        totalLength: 0,
        totalWeight: 0,
        spoolCost: 0
      };
    }

    // SelectedFilament => go to filament store or filament cache
    // TODO selectedFilament should not be passed, instead the result of getSpool should be passed to this function as argument
    // flatJob.expectedFilamentCosts = getSpool(
    //   selectedFilament,
    //   printerJob,
    //   true,
    //   printerJob.estimatedPrintTime
    // );

    flatJob = JobsCache.postProcessJob(flatJob, costSettings);
    const fileList = this.#fileCache.getPrinterFiles(this.#id);
    // TODO call files store for thumb
    // const foundFile = _.find(printerState.getFileList().files, (o) => {
    //   return o.name === printerJob.file.name;
    // });
    // if (!!foundFile) {
    //   currentJob.thumbnail = foundFile.thumbnail;
    // }

    return Object.freeze({
      _id: this.#id, //! yup were going back
      printerState: this.getPrinterState(),
      hostState: this.#hostState,
      webSocketState: convertedWSState,

      // ...
      costSettings: { ...this.#entityData.costSettings },

      // Caches
      currentJob: flatJob,
      fileList,

      // Hot OP data
      connectionOptions: {
        baudrates: [115200],
        baudratePreference: 115200,
        ports: [],
        portPreference: "VIRTUAL",
        printerProfiles: [],
        printerProfilePreference: "_default"
      },
      // TODO this should not decide client 'Printer' column (octoPrintSystemInfo)
      // TODO this crashes mon
      currentProfile: this.#currentProfile,
      octoPrintSystemInfo: this.#octoPrintSystemInfo,
      corsCheck: true,
      // Placeholder? https://github.com/OctoFarm/OctoFarm/blob/7fed18b1b3036cfb77f1a0d8d51be1e14fbcb541/server_src/lib/dataFunctions/printerClean.js#L374
      display: true, // TODO causes monitoring to show it. But it is not a proper place
      stepSize: this.#stepSize,
      systemChecks: this.#systemChecks, // TODO remove
      alerts: this.#alerts,
      otherSettings: {
        temperatureTriggers: this.#entityData.tempTriggers,
        system: {
          commands: {}
        },
        webCamSettings: {}
      }, //? temperatureTriggers + webcamSettings
      octoPi: {
        version: "sure",
        model: "American Pi"
      },
      tools: [
        {
          time: 0,
          bed: {
            actual: 0
          },
          chamber: {
            actual: 0
          }
        }
      ],

      // Related document query - cached from db
      groups: [],

      // Unmapped data - comes from database model so would be nicer to make a child object
      gcodeScripts: {},
      octoPrintVersion: this.getOctoPrintVersion(),
      selectedFilament: this.#entityData.selectedFilament,
      enabled: this.#entityData.enabled,
      sortIndex: this.#entityData.sortIndex,
      printerName: this.#entityData.settingsAppearance?.name,
      webSocketURL: this.#websocketAdapter?.webSocketURL || this.#entityData.webSocketURL,
      camURL: this.#entityData.camURL,
      apiKey: this.#entityData.apiKey,
      printerURL: this.#entityData.printerURL,
      group: this.#entityData.group
    });
  }

  /**
   * Reset the API state and dispose any websocket related data
   */
  resetConnectionState() {
    if (this.#entityData.enabled) {
      this.setHostState(PSTATE.Searching, "Attempting to connect to OctoPrint");
      this.resetApiAccessibility();
    } else {
      this.setHostState(PSTATE.Disabled, "Printer was disabled in OctoFarm");
      this.setApiAccessibility(false, false, MESSAGE.disabled);
    }
    this.resetWebSocketAdapter();
  }

  /**
   * Another entity passes the acquired system info with handy metadata
   */
  updateSystemInfo(systemInfo) {
    this.#octoPrintSystemInfo = systemInfo;
  }

  updateStepSize(stepSize) {
    this.#stepSize = stepSize;
  }

  getSortIndex() {
    return this.#entityData.sortIndex;
  }

  getWebSocketState() {
    // Translate the adapter state to something the client knows
    const adapterState = this.getAdapterState();
    switch (adapterState.toString()) {
      case WS_STATE.connected:
        return {
          colour: "success",
          desc: "Connection tentative"
        };
      case WS_STATE.errored:
        return {
          colour: "warning",
          desc: adapterState
        };
      case WS_STATE.authed:
        return {
          colour: "success",
          desc: adapterState
        };
      default:
      case WS_STATE.unopened:
        return {
          colour: "danger",
          desc: adapterState
        };
    }
  }

  getStateCategory() {
    const pState = this.getPrinterState();
    return pState.colour.category;
  }

  getPrinterState() {
    if (!this.#websocketAdapter) {
      return getDefaultPrinterState();
    }
    return this.#websocketAdapter.getPrinterState();
  }

  getURL() {
    return this.#entityData.printerURL;
  }

  getName() {
    return this.#entityData?.settingsAppearance?.name || this.#entityData.printerURL;
  }

  getOctoPrintVersion() {
    const opMeta = this.#websocketAdapter?.getOctoPrintMeta();
    const dbVersion = this.#entityData.octoPrintVersion;
    if (!opMeta) {
      return dbVersion;
    } else {
      if (dbVersion !== opMeta.octoPrintVersion && !!opMeta.octoPrintVersion) {
        // TODO prevent this in an earlier stage (like a websocket connect message)
        // TODO do something with this? This is a change of version.
      }
      return opMeta.octoPrintVersion;
    }
  }

  getLoginDetails() {
    return {
      printerURL: this.#entityData.printerURL,
      apiKey: this.#entityData.apiKey
    };
  }

  bindWebSocketAdapter(adapterType) {
    if (!!this.#websocketAdapter) {
      throw new Error(
        `This websocket adapter was already bound with type '${
          this.#websocketAdapterType
        }'. Please reset it first with 'resetWebSocketAdapter' if you're switching over dynamically.`
      );
    }
    if (!this.#sessionUser || !this.#sessionKey) {
      throw new Error(
        "Printer State 'bindWebSocketAdapter' was called without 'sessionUser' or 'sessionKey' set-up correctly."
      );
    }

    this.#websocketAdapterType = adapterType?.name;
    this.#websocketAdapter = new adapterType({
      id: this.id,
      webSocketURL: this.#entityData.webSocketURL,
      currentUser: this.#sessionUser,
      sessionKey: this.#sessionKey,
      throttle: 2
    });

    this.#messageStream = this.#websocketAdapter.getMessages$();
  }

  /**
   * Connect the adapter to the configured transport using the constructor printer document and the bindWebSocketAdapter calls
   */
  connectAdapter() {
    if (!this.#websocketAdapter) {
      throw new Error(
        `The websocket adapter was not provided. Please reset it first with 'bindWebSocketAdapter' to connect to it.`
      );
    }
    this.#messageSubscription = this.#messageStream.subscribe(
      (r) => {
        r.forEach((event) => this.#processEvent(event));
      },
      (e) => {
        console.log("WS message stream error.");
      },
      (c) => {
        console.log("RxJS Subject WS complete");
      }
    );
  }

  setFirmwareState(name) {
    this.#octoPrintSystemInfo["printer.firmware"] = name;
  }

  #processEvent(event) {
    event.data.printerID = this.#id;
    // Other interested parties
    this.#eventEmitter2.emit(event.type, event.data);

    if (event.type === PEVENTS.event) {
      const data = event.data;
      if (data.type === EVENT_TYPES.FirmwareData) {
        // We can update Firmware from here
        this.setFirmwareState(data.payload.name);
      } else if (data.type === EVENT_TYPES.Disconnecting) {
        this.setFirmwareState("Disconnecting...");
      } else if (data.type === EVENT_TYPES.Disconnected) {
        this.setFirmwareState("-");
      }
    }
    if (event.type === PEVENTS.init) {
      this.#jobsCache.savePrinterJob(this.#id, event.data);
      this.#currentOperationsCache.generateCurrentOperations();
    }
    if (event.type === PEVENTS.current) {
      this.#jobsCache.updatePrinterJob(this.#id, event.data);
      this.#currentOperationsCache.generateCurrentOperations();
    }
  }

  getAdapterState() {
    if (!this.#websocketAdapter) {
      return WS_STATE.unopened;
    }
    return this.#websocketAdapter.getWebSocketState();
  }

  shouldRetryConnect() {
    if (this.markForRemoval || !this.isApiRetryable()) {
      return false;
    }

    return [WS_STATE.unopened, WS_STATE.closed].includes(this.getAdapterState());
  }

  /**
   * Reset the type of adapter provided, saving/sending state, disposing and closing the sockets.
   */
  resetWebSocketAdapter() {
    // Call any closing message handlers now
    // ...
    if (this.#messageSubscription) {
      this.#messageSubscription.unsubscribe();
    }

    if (this.#websocketAdapter) {
      this.#websocketAdapter.close();
      // We nullify the adapter here for ease, but we should aim not to
      this.#websocketAdapter = null;

      this.#logger.warning("Reset printer websocket adapter.");
    }
  }

  getSystemChecks() {
    // Rare case
    if (!this.#systemChecks)
      throw new Error("systemChecks property was undefined, something which is unexpected.");

    return this.#systemChecks;
  }

  resetSystemChecksState() {
    // TODO this also resets cleaner state... we should move that state elsewhere
    this.#systemChecks = getSystemChecksDefault();
  }

  setApiLoginSuccessState(sessionUser, sessionKey) {
    this.#sessionUser = sessionUser;
    this.#sessionKey = sessionKey;

    this.setHostState(PSTATE.Online, "Printer device is Online");
  }

  setHostState(state, description) {
    this.#hostState = {
      state,
      colour: mapStateToColor(state),
      desc: description
    };
  }

  // Tracking for API failures like GlobalAPIKey, ApiKey rejected which can only be fixed by OctoFarm
  setApiAccessibility(accessible, retryable, reason) {
    if (!accessible) {
      if (!retryable) {
        this.#logger.warning(
          `Printer API '${this.getName()}' was marked as inaccessible. Reason: '${reason}'. Please check connection settings.`
        );
      }
    }
    this.#apiAccessibility = {
      accessible,
      retryable,
      reason
    };
  }

  getApiAccessibility() {
    return Object.freeze(this.#apiAccessibility);
  }

  /**
   * Determines whether API was marked accessible - whether it should be skipped or not.
   * @returns {boolean}
   */
  isApiAccessible() {
    return this.#apiAccessibility.accessible;
  }

  isApiRetryable() {
    return this.isApiAccessible() || this.#apiAccessibility.retryable;
  }

  resetApiAccessibility() {
    this.setApiAccessibility(true, true, null);
  }

  setApiSuccessState(success = true) {
    this.setSystemCheck(SYSTEM_CHECKS.api, success);
  }

  setFilesSuccessState(success = true) {
    this.setSystemCheck(SYSTEM_CHECKS.files, success);
  }

  setSystemSuccessState(success = true) {
    this.setSystemCheck(SYSTEM_CHECKS.system, success);
  }

  resetSystemCheck(name) {
    this.#systemChecks[name].status = "warning";
    this.#systemChecks[name].date = null;
  }

  setSystemCheck(name, success) {
    this.#systemChecks[name].status = success ? "success" : "danger";
    this.#systemChecks[name].date = new Date();
  }
}

module.exports = PrinterState;

// From printerclean
//       groups: [], // TODO unfinished feature
//       systemChecks: farmPrinter.systemChecks,
//       corsCheck: farmPrinter.corsCheck,
//       octoPrintUpdate: farmPrinter.octoPrintUpdate,
//       octoPrintPluginUpdates: farmPrinter.octoPrintPluginUpdates,
//       display: true,
//       order: farmPrinter.sortIndex,
//     if (!farmPrinter.resends) {
//       sortedPrinter.resends = farmPrinter.resends;
//     }
//     sortedPrinter.tools = PrinterClean.sortTemps(farmPrinter.temps);
//     sortedPrinter.currentJob = JobClean.getCleanJobAtIndex(farmPrinter.sortIndex);
//     sortedPrinter.selectedFilament = farmPrinter.selectedFilament;
//
//     sortedPrinter.fileList = FileClean.returnFiles(farmPrinter.sortIndex);
//     sortedPrinter.currentProfile = PrinterClean.sortProfile(
//       farmPrinter.profiles,
//       farmPrinter.current
//     );
//     sortedPrinter.currentConnection = PrinterClean.sortConnection(farmPrinter.current);
//     sortedPrinter.connectionOptions = farmPrinter.options;
//     if (
//       !!sortedPrinter?.connectionOptions?.ports &&
//       !sortedPrinter.connectionOptions.ports.includes("AUTO")
//     ) {
//       sortedPrinter.connectionOptions.baudrates.unshift(0);
//       sortedPrinter.connectionOptions.ports.unshift("AUTO");
//     }
//     sortedPrinter.terminal = PrinterClean.sortTerminal(farmPrinter.sortIndex, farmPrinter.logs);
//     sortedPrinter.costSettings = farmPrinter.costSettings;
//     sortedPrinter.powerSettings = farmPrinter.powerSettings;
//     sortedPrinter.gcodeScripts = PrinterClean.sortGCODE(farmPrinter.settingsScripts);
//     sortedPrinter.otherSettings = PrinterClean.sortOtherSettings(
//       farmPrinter.tempTriggers,
//       farmPrinter.settingsWebcam,
//       farmPrinter.settingsServer
//     );
//     sortedPrinter.printerName = PrinterClean.grabPrinterName(farmPrinter);
//     sortedPrinter.storage = farmPrinter.storage;
//     sortedPrinter.tempHistory = farmPrinter.tempHistory;
//
//     if (typeof farmPrinter.octoPi !== "undefined") {
//       sortedPrinter.octoPi = farmPrinter.octoPi;
//     }
//     sortedPrinter.connectionLog = this.#printerConnectionLogs[farmPrinter.sortIndex];
//     if (typeof farmPrinter.klipperFirmwareVersion !== "undefined") {
//       sortedPrinter.klipperFirmwareVersion = farmPrinter.klipperFirmwareVersion.substring(0, 6);
//     }

// async sortConnection(current) {
//   if (!current) return null;
//   return {
//     baudrate: current.baudrate,
//     port: current.port,
//     printerProfile: current.printerProfile
//   };
// }

// static sortOtherSettings(temp, webcam, system) {
//   const otherSettings = {
//     temperatureTriggers: null,
//     webCamSettings: null
//   };
//   if (typeof temp !== "undefined") {
//     otherSettings.temperatureTriggers = temp;
//   }
//   if (typeof webcam !== "undefined") {
//     otherSettings.webCamSettings = webcam;
//   }
//   if (typeof system !== "undefined") {
//     otherSettings.system = system;
//   }
//
//   return otherSettings;
// }
