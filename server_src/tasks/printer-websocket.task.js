const Logger = require("../handlers/logger");
const OctoprintRxjsWebsocketAdapter = require("../services/octoprint/octoprint-rxjs-websocket.adapter");
const DITokens = require("../container.tokens");
const { PSTATE, ERR_COUNT } = require("../constants/state.constants");
const HttpStatusCode = require("../constants/http-status-codes.constants");
const { ExternalServiceError } = require("../exceptions/runtime.exceptions");

const offlineMessage = "OctoPrint instance seems to be offline";
const noApiKeyInResponseMessage = "OctoPrint login didnt return apikey to check";
const retryingApiConnection = "OctoPrint is offline. Retry is scheduled";
const badRequestMessage = "OctoPrint login responded with bad request. This is a bug";
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

  #errorMaxThrows = 3;
  #errorModulus = 50; // After max throws, log it every x failures
  #errorCounts = {
    [ERR_COUNT.offline]: {},
    [ERR_COUNT.apiKeyNotAccepted]: {},
    [ERR_COUNT.missingApiKey]: {},
    [ERR_COUNT.apiKeyIsGlobal]: {},
    [ERR_COUNT.missingSessionKey]: {}
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
    const printerId = printerState.id;

    if (!printerState.shouldRetryConnect()) {
      return;
    }

    let errorThrown = false;
    let localError;

    const response = await this.#octoPrintService.login(loginDetails, true).catch((e) => {
      errorThrown = true;
      localError = e;
    });

    // Transport related error
    let errorCode = localError?.response?.status;
    if (errorThrown && !localError.response) {
      // Not connected or DNS issue - abort flow
      const errorCount = this.#incrementErrorCount(ERR_COUNT.offline, printerId);
      printerState.setHostState(PSTATE.Offline, offlineMessage);
      printerState.setApiAccessibility(false, true, retryingApiConnection);
      return this.handleSilencedError(errorCount, retryingApiConnection, printerName);
    } else {
      this.#resetPrinterErrorCount(ERR_COUNT.offline, printerId);
    }

    // API related errors
    if (errorCode === HttpStatusCode.BAD_REQUEST) {
      // Bug
      printerState.setHostState(PSTATE.NoAPI, badRequestMessage);
      printerState.setApiAccessibility(false, false, badRequestMessage);
      throw new ExternalServiceError(localError.response?.data);
    }
    if (errorCode === HttpStatusCode.FORBIDDEN) {
      const errorCount = this.#incrementErrorCount(ERR_COUNT.apiKeyNotAccepted, printerId);
      printerState.setHostState(PSTATE.ApiKeyRejected, apiKeyNotAccepted);
      printerState.setApiAccessibility(false, false, apiKeyNotAccepted);
      return this.handleSilencedError(errorCount, apiKeyNotAccepted, printerName);
    } else {
      this.#resetPrinterErrorCount(ERR_COUNT.apiKeyNotAccepted, printerId);
    }

    // Response related errors
    const loginResponse = response.data;
    // This is a check which is best done after checking 400 code (GlobalAPIKey or pass-thru) - possible
    if (this.checkLoginGlobal(loginResponse)) {
      const errorCount = this.#incrementErrorCount(ERR_COUNT.apiKeyIsGlobal, printerId);
      printerState.setHostState(PSTATE.GlobalAPIKey, globalAPIKeyDetectedMessage);
      printerState.setApiAccessibility(false, false, globalAPIKeyDetectedMessage);
      return this.handleSilencedError(errorCount, globalAPIKeyDetectedMessage, printerName);
    } else {
      this.#resetPrinterErrorCount(ERR_COUNT.apiKeyIsGlobal, printerId);
    }
    // Check for an apikey (defines connection state NoAPI) - happens when no apikey is sent by OF => bug
    if (!loginResponse?.apikey) {
      const errorCount = this.#incrementErrorCount(ERR_COUNT.missingApiKey, printerId);
      printerState.setHostState(PSTATE.NoAPI, noApiKeyInResponseMessage);
      printerState.setApiAccessibility(false, false, noApiKeyInResponseMessage);
      return this.handleSilencedError(errorCount, noApiKeyInResponseMessage, printerName);
    } else {
      this.#resetPrinterErrorCount(ERR_COUNT.missingApiKey, printerId);
    }
    // Sanity check for login success (alt: could also check status code) - quite rare
    if (!loginResponse?.session) {
      const errorCount = this.#incrementErrorCount(ERR_COUNT.missingSessionKey, printerId);
      printerState.setHostState(PSTATE.NoAPI, missingSessionKeyMessage);
      printerState.setApiAccessibility(false, false, noApiKeyInResponseMessage);
      return this.handleSilencedError(errorCount, missingSessionKeyMessage, printerName);
    } else {
      this.#resetPrinterErrorCount(ERR_COUNT.missingSessionKey, printerId);
    }

    printerState.setApiLoginSuccessState(loginResponse.name, loginResponse?.session);
    printerState.setApiAccessibility(true, true, null);
    printerState.resetWebSocketAdapter();
    // TODO time this (I wonder if the time spent is logging in or the binding)
    printerState.bindWebSocketAdapter(OctoprintRxjsWebsocketAdapter);

    // TODO time this
    // Delaying or staggering this will speed up startup tasks - ~90 to 150ms per printer on non-congested (W)LAN
    printerState.connectAdapter();
  }

  #incrementErrorCount(key, printerId) {
    const errorType = this.#errorCounts[key];
    if (!errorType[printerId]) {
      errorType[printerId] = 1;
    } else {
      errorType[printerId]++;
    }
    return errorType[printerId];
  }

  #resetPrinterErrorCount(key, printerId) {
    delete this.#getPrinterErrorCount(key, printerId);
  }

  #getPrinterErrorCount(key, printerId) {
    return this.#errorCounts[key][printerId] || 0;
  }

  checkLoginGlobal(octoPrintResponse) {
    // Explicit nullability check serves to let an unconnected printer fall through as well as incorrect apiKey
    // Note: 'apikey' property is conform OctoPrint response (and not OctoFarm printer model's 'apiKey')
    return !!octoPrintResponse && octoPrintResponse.apikey === null;
  }

  handleSilencedError(errorCount, taskMessage, printerName) {
    if (errorCount <= this.#errorMaxThrows) {
      throw new Error(
        `${taskMessage} (Error muted in ${this.#errorMaxThrows - errorCount} tries.)`
      );
    } else if (errorCount % this.#errorModulus === 0) {
      throw new Error(`${taskMessage} ${errorCount} times for printer '${printerName}'.`);
    }
    // Really nice for debug or dev, but not for normal usage
    // else {
    //   return this.#logger.error("Websocket connection attempt failed (silenced).");
    // }
  }
}

module.exports = PrinterWebsocketTask;
