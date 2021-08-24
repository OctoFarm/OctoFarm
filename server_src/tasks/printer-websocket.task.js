const Logger = require("../handlers/logger");
const OctoprintRxjsWebsocketAdapter = require("../services/octoprint/octoprint-rxjs-websocket.adapter");
const DITokens = require("../container.tokens");
const { PSTATE } = require("../constants/state.constants");
const HttpStatusCode = require("../constants/http-status-codes.constants");
const { ExternalServiceError } = require("../exceptions/runtime.exceptions");

const offlineMessage = "OctoPrint instance seems to be offline";
const noApiKeyInResponseMessage = "OctoPrint login didnt return apikey to check";
const retryingApiConnection = "Delaying retry for OctoPrint API connection as it is offline";
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

    let errorThrown = false;
    let localError;

    const response = await this.#octoPrintService.login(loginDetails, true).catch((e) => {
      errorThrown = true;
      localError = e;
    });

    // Check for rejection
    let errorCode = localError?.response?.status;
    if (errorThrown && !localError.response) {
      // Not connected or DNS issue - abort flow
      this.#errorCounts.offline++;
      printerState.setHostState(PSTATE.Offline, offlineMessage);
      printerState.setApiAccessibility(false, true, retryingApiConnection);
      this.#logger.info(
        `OctoPrint API offline. Scheduling WebSocket connection retry for '${printerName}'`
      );
      return;
    }
    if (errorCode === HttpStatusCode.BAD_REQUEST) {
      // Bug
      printerState.setHostState(PSTATE.NoAPI, badRequestMessage);
      printerState.setApiAccessibility(false, false, badRequestMessage);
      throw new ExternalServiceError(localError.response?.data);
    }
    if (errorCode === HttpStatusCode.FORBIDDEN) {
      const errorCount = this.#errorCounts.apiKeyNotAccepted++;
      printerState.setHostState(PSTATE.ApiKeyRejected, apiKeyNotAccepted);
      printerState.setApiAccessibility(false, false, apiKeyNotAccepted);
      return this.handleSilencedError(errorCount, apiKeyNotAccepted, printerName);
    }

    const loginResponse = response.data;
    // This is a check which is best done after checking 400 code (GlobalAPIKey or pass-thru) - possible
    if (this.checkLoginGlobal(loginResponse)) {
      const errorCount = this.#errorCounts.apiKeyIsGlobal++;
      printerState.setHostState(PSTATE.GlobalAPIKey, globalAPIKeyDetectedMessage);
      printerState.setApiAccessibility(false, false, globalAPIKeyDetectedMessage);
      return this.handleSilencedError(errorCount, globalAPIKeyDetectedMessage, printerName);
    } else {
      this.#errorCounts.apiKeyIsGlobal = 0;
    }
    // Check for an apikey (defines connection state NoAPI) - happens when no apikey is sent by OF => bug
    if (!loginResponse?.apikey) {
      const errorCount = this.#errorCounts.missingApiKey++;
      printerState.setHostState(PSTATE.NoAPI, noApiKeyInResponseMessage);
      printerState.setApiAccessibility(false, false, noApiKeyInResponseMessage);
      return this.handleSilencedError(errorCount, noApiKeyInResponseMessage, printerName);
    } else {
      this.#errorCounts.missingApiKey = 0;
    }
    // Sanity check for login success (alt: could also check status code) - quite rare
    if (!loginResponse?.session) {
      const errorCount = this.#errorCounts.missingSessionKey++;
      printerState.setHostState(PSTATE.NoAPI, missingSessionKeyMessage);
      printerState.setApiAccessibility(false, false, noApiKeyInResponseMessage);
      return this.handleSilencedError(errorCount, missingSessionKeyMessage, printerName);
    } else {
      this.#errorCounts.missingSessionKey = 0;
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

  checkLoginGlobal(octoPrintResponse) {
    // Explicit nullability check serves to let an unconnected printer fall through as well as incorrect apiKey
    // Note: 'apikey' property is conform OctoPrint response (and not OctoFarm printer model's 'apiKey')
    return !!octoPrintResponse && octoPrintResponse.apikey === null;
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
