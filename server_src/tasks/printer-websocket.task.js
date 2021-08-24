const Logger = require("../handlers/logger");
const OctoprintRxjsWebsocketAdapter = require("../services/octoprint/octoprint-rxjs-websocket.adapter");
const DITokens = require("../container.tokens");
const { PSTATE } = require("../constants/state.constants");

const offlineMessage = "OctoPrint instance seems to be offline";
const noApiKeyInResponseMessage = "OctoPrint login didnt return apikey to check";
const apiKeyNotAccepted = "OctoPrint apiKey was rejected.";
const globalAPIKeyDetectedMessage =
  "Global API Key was detected (apikey was null indicating global API key)";
const missingSessionKeyMessage = "Missing session key in login response";

class PrinterWebsocketTask {
  #printersStore;
  #settingsStore;
  #octoPrintService;
  #taskManagerService;

  #logger = new Logger("Printer-Websocket-Task");

  #errorMaxThrows = 5;
  #errorModulus = 10; // After max throws, log it every 10 failures
  #errorCounts = {
    offline: 0,
    apiKeyNotAccepted: 0,
    missingApiKey: 0,
    apiKeyIsGlobal: 0,
    missingSessionKey: 0
  };

  constructor({
    printersStore,
    octoPrintApiService,
    settingsStore,
    taskManagerService,
    printerSystemTask // Just to make sure it can resolve
  }) {
    this.#printersStore = printersStore;
    this.#settingsStore = settingsStore;
    this.#octoPrintService = octoPrintApiService;
    this.#taskManagerService = taskManagerService;
  }

  getRetriedPrinters() {
    return this.#printersStore.listPrinterStates().filter((p) => p.shouldRetryConnect());
  }

  async run() {
    const startTime = Date.now();

    const printerStates = this.getRetriedPrinters();
    for (let printerState of printerStates) {
      try {
        // Pooling these promises with Promises.all or race is probably much faster
        await this.setupPrinterConnection(printerState);
      } catch (e) {
        this.#logger.error(`WebSocket task failed for '${printerState.getName()}'`, e.stack);
      }
    }

    const newPrinterStates = this.getRetriedPrinters();

    const duration = Date.now() - startTime;
    if (newPrinterStates.length !== printerStates.length) {
      this.#logger.info(
        `Attempted websocket connections taking ${duration}ms. ${newPrinterStates.length} adapters need retry (before: ${printerStates.length}).`
      );
    }

    // Continue with delegate tasks
    const taskName = DITokens.printerSystemTask;
    if (this.#taskManagerService.isTaskDisabled(taskName)) {
      this.#logger.info(`Triggered conditional task '${taskName}' to run`);
      this.#taskManagerService.scheduleDisabledJob(taskName);
    }
  }

  async setupPrinterConnection(printerState) {
    const loginDetails = printerState.getLoginDetails();
    const printerName = printerState.getName();

    if (!printerState.shouldRetryConnect()) {
      return;
    }
    this.#logger.info(`Trying WebSocket connection for '${printerName}'`);

    let errorThrown = false;
    let localError;
    let code;
    const loginResponse = await this.#octoPrintService
      .login(loginDetails, true)
      .then((r) => r.json())
      .catch((e) => {
        errorThrown = true;
        if (!e.response) {
          // Not connected or DNS issue - abort flow
          this.#errorCounts.offline++;
          printerState.setHostState(PSTATE.Offline, offlineMessage);
          throw e;
        }
        code = e.response.status;
        localError = e;
      });

    if (code === 400) {
      const errorCount = this.#errorCounts.apiKeyNotAccepted++;
      printerState.setHostState(PSTATE.ApiKeyRejected, apiKeyNotAccepted);
      return this.handleSilencedError(errorCount, apiKeyNotAccepted, printerName);
    }
    // This is a check which is best done after checking 400 code (GlobalAPIKey or pass-thru)
    if (this.checkLoginGlobal(loginResponse)) {
      const errorCount = this.#errorCounts.apiKeyIsGlobal++;
      printerState.setHostState(PSTATE.GlobalAPIKey, globalAPIKeyDetectedMessage);
      return this.handleSilencedError(errorCount, globalAPIKeyDetectedMessage, printerName);
    } else {
      this.#errorCounts.apiKeyIsGlobal = 0;
    }
    // Check for an apikey (defines connection state Connected/Disconnected)
    if (!loginResponse?.apikey) {
      const errorCount = this.#errorCounts.missingApiKey++;
      printerState.setHostState(PSTATE.NoAPI, noApiKeyInResponseMessage);
      return this.handleSilencedError(errorCount, noApiKeyInResponseMessage, printerName);
    } else {
      this.#errorCounts.missingApiKey = 0;
    }
    // Sanity check for login success (alt: could also check status code)
    if (!loginResponse?.session) {
      const errorCount = this.#errorCounts.missingSessionKey++;
      printerState.setHostState(PSTATE.NoAPI, missingSessionKeyMessage);
      return this.handleSilencedError(errorCount, missingSessionKeyMessage, printerName);
    } else {
      this.#errorCounts.missingSessionKey = 0;
    }

    printerState.setApiLoginSuccessState(loginResponse.name, loginResponse?.session);
    printerState.resetWebSocketAdapter();
    // TODO time this (I wonder if the time spent is logging in or the binding)
    printerState.bindWebSocketAdapter(OctoprintRxjsWebsocketAdapter);

    // TODO time this
    // Delaying or staggering this will speed up startup tasks - ~90 to 150ms per printer on uncongested (W)LAN
    printerState.connectAdapter();
  }

  checkLoginGlobal(octoprintResponse) {
    // Explicit nullability check serves to let an unconnected printer fall through as well as incorrect apiKey
    // Note: 'apikey' property is conform OctoPrint response (and not OctoFarm printer model's 'apiKey')
    return !!octoprintResponse && octoprintResponse.apikey === null;
  }

  handleSilencedError(prop, taskMessage, printerName) {
    if (prop <= this.#errorMaxThrows - 1) {
      throw new Error(taskMessage);
    } else if (prop % this.#errorModulus === 0) {
      throw new Error(`${taskMessage} ${prop} times for printer '${printerName}'.`);
    } else {
      return this.#logger.error("Websocket connection attempt failed (silenced).");
    }
  }
}

module.exports = PrinterWebsocketTask;
