const WebSocket = require("ws");

const { SettingsClean } = require("../settings-cleaner.service");
const { WS_STATE, WS_DESC, WS_ERRORS } = require("../printers/constants/websocket-constants");
const {
  OF_WS_DESC,
  OF_C_DESC,
  PRINTER_STATES
} = require("../printers/constants/printer-state.constants");
const { PrinterTicker } = require("../printer-connection-log.service");
const Logger = require("../../handlers/logger");
const ConnectionMonitorService = require("../../services/connection-monitor.service");
const { REQUEST_TYPE, REQUEST_KEYS } = require("../../constants/connection-monitor.constants");
const { getPrinterStoreCache } = require("../../cache/printer-store.cache");
const { mapStateToCategory } = require("../printers/utils/printer-state.utils");
const { averageMeanOfArray } = require("../../utils/math.utils.js");

const logger = new Logger("OctoFarm-State");

const ENDPOINT = "/sockjs/websocket";

const defaultWebsocketOptions = {
  handshakeTimeout: 10000,
  followRedirects: true,
  perMessageDeflate: false,
  skipUTF8Validation: true
};

class WebSocketClient {
  #messageNumber = 0;
  #retryNumber = 0;
  #lastMessage = Date.now();
  #instance = undefined;
  #pingPongTimer = 60000;
  #heartbeatTerminate = undefined;
  #heartbeatPing = undefined;
  #onMessage = undefined;
  autoReconnectInterval = undefined; // ms
  reconnectTimeout = false;
  systemSettings = SettingsClean.returnSystemSettings();
  url = undefined;
  id = undefined;
  polling = undefined;
  currentUser = undefined;
  sessionKey = undefined;
  reconnectingIn = 0;
  currentThrottleRate = 1;
  throttleRateMeasurements = [];
  throttleRateMeasurementsSize = 20;
  throttleBase = 500;
  throttleMargin = 150;

  constructor(
    webSocketURL = undefined,
    id = undefined,
    currentUser = undefined,
    sessionKey = undefined,
    onMessageFunction = undefined
  ) {
    if (
      !webSocketURL ||
      !id ||
      !currentUser ||
      !sessionKey ||
      !onMessageFunction ||
      typeof onMessageFunction !== "function"
    )
      throw new Error("Missing required keys");

    this.autoReconnectInterval = this.systemSettings.timeout.webSocketRetry;
    this.id = id;
    this.url = webSocketURL + ENDPOINT;
    this.currentUser = currentUser;
    this.sessionKey = sessionKey;
    this.#onMessage = onMessageFunction;

    this.open();
  }

  open() {
    logger.debug(`${this.url}: Opening websocket connection...`);
    PrinterTicker.addIssue(
      new Date(),
      this.url,
      "Opening websocket connection...",
      "Active",
      this.id
    );
    this.#instance = new WebSocket(this.url, undefined, defaultWebsocketOptions);

    getPrinterStoreCache().updateHostState(this.id, {
      hostState: "Online",
      hostStateColour: mapStateToCategory("Online"),
      hostDescription: "OctoPrint API is Online"
    });

    this.#instance.on("pong", () => {
      getPrinterStoreCache().updateWebsocketState(this.id, PRINTER_STATES().WS_ONLINE);
      logger.debug(this.url + " received pong message from server");
      clearTimeout(this.#heartbeatTerminate);
      clearTimeout(this.#heartbeatPing);

      logger.debug(this.url + " ping timout set", this.#pingPongTimer);

      this.#heartbeatTerminate = setTimeout(() => {
        logger.http(this.url + ": Didn't receive a pong from client, reconnecting!");
        PrinterTicker.addIssue(
          new Date(),
          this.url,
          "Didn't receive a pong from client, reconnecting!",
          "Offline",
          this.id
        );
        ConnectionMonitorService.updateOrAddResponse(
          this.url,
          REQUEST_TYPE.WEBSOCKET,
          REQUEST_KEYS.TOTAL_PING_PONG
        );
        this.terminate();
        // consider a minute without response a dead connection! Should cover WiFi devices better.
      }, this.#pingPongTimer + 10000);
      logger.debug(this.url + " terminate timeout set", this.#pingPongTimer + 10000);
    });

    this.#instance.on("unexpected-response", (err) => {
      logger.error(`${this.url}: Unexpected Response!`, JSON.stringify(err));
    });

    // this.#instance.on("isPaused", () => {
    //   console.log("Paused websocket?");
    // });

    this.#instance.on("open", () => {
      ConnectionMonitorService.updateOrAddResponse(
        this.url,
        REQUEST_TYPE.WEBSOCKET,
        REQUEST_KEYS.SUCCESS_RESPONSE
      );
      logger.debug(`${this.url}: Websocket has been opened!`);
      PrinterTicker.addIssue(
        new Date(),
        this.url,
        "Opened OctoPrint websocket for user:" + this.currentUser,
        "Complete",
        this.id
      );
      // These will get overridden.
      getPrinterStoreCache().updatePrinterState(this.id, PRINTER_STATES().PRINTER_TENTATIVE);
      this.#retryNumber = 0;
      this.autoReconnectInterval = this.systemSettings.timeout.webSocketRetry;
      this.sendAuth();
      this.sendThrottle();
    });

    // This needs overriding by message passed through
    this.#instance.on("message", (data) => {
      const timeDifference = ConnectionMonitorService.stopTimer();
      logger.silly(
        `${this.url}: Message #${this.#messageNumber} received, ${
          timeDifference - this.#lastMessage
        }ms since last message`
      );
      ConnectionMonitorService.updateOrAddResponse(
        this.url,
        REQUEST_TYPE.WEBSOCKET,
        REQUEST_KEYS.LAST_RESPONSE,
        ConnectionMonitorService.calculateTimer(this.#lastMessage, timeDifference)
      );

      this.checkMessageSpeed(timeDifference - this.#lastMessage);

      this.#onMessage(this.id, data);

      this.#messageNumber++;
      this.#lastMessage = ConnectionMonitorService.startTimer();
    });

    this.#instance.on("close", (code, reason) => {
      logger.error(`${this.url}: Websocket Closed!`, { code, reason });
      getPrinterStoreCache().updateWebsocketState(this.id, {
        webSocket: "danger",
        webSocketDescription: "Socket connection error! Reconnecting...."
      });
      ConnectionMonitorService.updateOrAddResponse(
        this.url,
        REQUEST_TYPE.WEBSOCKET,
        REQUEST_KEYS.FAILED_RESPONSE
      );
      switch (
        code // https://datatracker.ietf.org/doc/html/rfc6455#section-7.4.1
      ) {
        case 1000: //  1000 indicates a normal closure, meaning that the purpose for which the connection was established has been fulfilled.
          PrinterTicker.addIssue(
            new Date(),
            this.url,
            `${OF_C_DESC.RE_SYNC} Error: ${code} - ${reason}`,
            "Offline",
            this.id
          );
          getPrinterStoreCache().updatePrinterState(this.id, {
            state: "Socket Closed!",
            stateColour: mapStateToCategory("Offline"),
            stateDescription: "Printer connection was closed. Will not reconnect automatically!"
          });
          break;
        case 1006: //Close Code 1006 is a special code that means the connection was closed abnormally (locally) by the server implementation.
          PrinterTicker.addIssue(
            new Date(),
            this.url,
            `${OF_WS_DESC.SHUTDOWN_RECONNECT} Error: ${code} - ${reason}`,
            "Offline",
            this.id
          );
          getPrinterStoreCache().updatePrinterState(this.id, {
            state: "Socket Closed!",
            stateColour: mapStateToCategory("Offline"),
            stateDescription: "Printer connection was closed. Will reconnect shortly!"
          });
          this.reconnect(code);
          debugger;
          break;
        default:
          // Abnormal closure
          PrinterTicker.addIssue(
            new Date(),
            this.url,
            `${OF_WS_DESC.SHUTDOWN_RECONNECT} Error: ${code} - ${reason}`,
            "Offline",
            this.id
          );
          getPrinterStoreCache().updatePrinterState(this.id, {
            state: "Socket Closed!",
            stateColour: mapStateToCategory("Offline"),
            stateDescription: "Printer connection was closed. Will reconnect shortly!"
          });
          debugger;
          this.reconnect(code);
          break;
      }
    });

    this.#instance.on("error", (e) => {
      logger.error(`${this.url}: Websocket Error!`, e);
      getPrinterStoreCache().updatePrinterState(this.id, {
        state: "Connection Error!",
        stateColour: mapStateToCategory("Offline"),
        stateDescription: "Printer connection detected an Error, reconnecting shortly!"
      });
      getPrinterStoreCache().updateWebsocketState(this.id, {
        webSocket: "danger",
        webSocketDescription: "Socket connection error! Reconnecting...."
      });
      ConnectionMonitorService.updateOrAddResponse(
        this.url,
        REQUEST_TYPE.WEBSOCKET,
        REQUEST_KEYS.FAILED_RESPONSE
      );
      switch (e.code) {
        case WS_ERRORS.ECONNREFUSED:
          PrinterTicker.addIssue(
            new Date(),
            this.url,
            `Error ${WS_ERRORS.ECONNREFUSED}. Server is not accepting connections`,
            "Offline",
            this.id
          );
          break;
        case WS_ERRORS.ECONNRESET:
          PrinterTicker.addIssue(
            new Date(),
            this.url,
            `Error ${WS_ERRORS.ECONNRESET}. Server reset the connection!`,
            "Offline",
            this.id
          );
          break;
        case WS_ERRORS.EHOSTUNREACH:
          PrinterTicker.addIssue(
            new Date(),
            this.url,
            `Error ${WS_ERRORS.EHOSTUNREACH}. Server is not reachable!`,
            "Offline",
            this.id
          );
          break;
        case WS_ERRORS.ENOTFOUND:
          PrinterTicker.addIssue(
            new Date(),
            this.url,
            `Error ${WS_ERRORS.ENOTFOUND}. Server cannot be found!`,
            "Offline",
            this.id
          );
          break;
        default:
          PrinterTicker.addIssue(
            new Date(),
            this.url,
            `Error UNKNOWN. Server is not reachable! ${JSON.stringify(e)}`,
            "Offline",
            this.id
          );
          break;
      }
      this.reconnect(e);
    });
  }

  sendAuth() {
    logger.debug("Authenticating the websocket for user: " + this.currentUser);
    PrinterTicker.addIssue(
      new Date(),
      this.url,
      "Authenticating the websocket for user: " + this.currentUser,
      "Active",
      this.id
    );
    this.send(
      JSON.stringify({
        auth: `${this.currentUser}:${this.sessionKey}`
      })
    );
  }

  checkMessageSpeed(ms) {
    if (this.throttleRateMeasurements.length >= this.throttleRateMeasurementsSize) {
      this.throttleRateMeasurements.shift();
    }
    this.throttleRateMeasurements.push(ms);
    const currentAverage = averageMeanOfArray(this.throttleRateMeasurements);

    const throttleLimit = this.currentThrottleRate * this.throttleBase;

    if (ms > throttleLimit + this.throttleMargin) {
      logger.warning(`Messages coming in slow at: ${ms}ms throttling connection speed...`);
      this.increaseMessageThrottle();
    } else if (this.currentThrottleRate > 1) {
      const maxProcessingLimit = Math.max.apply(null, this.throttleRateMeasurements);
      const lowerProcessingLimit =
        (this.currentThrottleRate - 1) * (currentAverage + this.throttleMargin);
      if (maxProcessingLimit < lowerProcessingLimit) {
        logger.warning(`Messages speed normalising at: ${ms}ms throttling connection speed...`);
        this.decreaseMessageThrottle();
      }
    }
  }

  increaseMessageThrottle() {
    this.currentThrottleRate++;
    this.sendThrottle();
    logger.warning(this.id + "Increasing websocket throttle time...", {
      throttleRate: this.currentThrottleRate / 2
    });
  }

  decreaseMessageThrottle() {
    this.currentThrottleRate--;
    this.sendThrottle();
    logger.warning(this.id + " Decreasing websocket throttle time...", {
      throttleRate: this.currentThrottleRate / 2
    });
  }

  sendThrottle() {
    this.send(
      JSON.stringify({
        throttle: this.currentThrottleRate
      })
    );
  }

  send(data, option) {
    try {
      this.#instance.send(data, option);
    } catch (e) {
      this.#instance.emit("error", e);
    }
  }

  reconnect(e) {
    if (this.#retryNumber < 1) {
      PrinterTicker.addIssue(
        new Date(),
        this.url,
        `Setting up reconnect in ${this.autoReconnectInterval}ms retry #${
          this.#retryNumber
        }. Subsequent logs will be silenced... Error:${e}`,
        "Active",
        this.id
      );
      logger.info(
        `${this.url} Setting up reconnect in ${this.autoReconnectInterval}ms retry #${
          this.#retryNumber
        }`,
        e
      );
    }
    ConnectionMonitorService.updateOrAddResponse(
      this.url,
      REQUEST_TYPE.WEBSOCKET,
      REQUEST_KEYS.RETRY_REQUESTED
    );

    if (this.reconnectTimeout !== false) {
      logger.warning("Ignoring Websocket reconnection attempt!");
      return;
    }
    clearTimeout(this.#heartbeatTerminate);
    clearTimeout(this.reconnectTimeout);
    this.#instance.removeAllListeners();
    this.reconnectingIn = Date.now() + this.autoReconnectInterval;
    this.#retryNumber = this.#retryNumber + 1;
    getPrinterStoreCache().updatePrinterLiveValue(this.id, {
      websocketReconnectingIn: this.reconnectingIn
    });
    this.reconnectTimeout = setTimeout(async () => {
      this.reconnectingIn = 0;
      getPrinterStoreCache().updatePrinterLiveValue(this.id, {
        websocketReconnectingIn: this.reconnectingIn
      });
      getPrinterStoreCache().updateHostState(this.id, {
        hostState: "Searching...",
        hostStateColour: mapStateToCategory("Searching..."),
        hostDescription: "Searching for websocket connection!"
      });
      getPrinterStoreCache().updatePrinterState(this.id, {
        state: "Searching...",
        stateColour: mapStateToCategory("Searching..."),
        stateDescription: "Searching for websocket connection!"
      });
      getPrinterStoreCache().updateWebsocketState(this.id, {
        webSocket: "info",
        webSocketDescription: "Searching for a printer connection!"
      });

      if (this.#retryNumber > 0) {
        const modifier = this.systemSettings.timeout.webSocketRetry * 0.1;
        this.autoReconnectInterval = this.autoReconnectInterval + modifier;
        logger.debug(`${this.url} retry modifier ${modifier}`);
      } else if (this.#retryNumber === 0) {
        PrinterTicker.addIssue(
          new Date(),
          this.url,
          "Re-Opening websocket! Subsequent logs will be silenced.",
          "Active",
          this.id
        );
      }

      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = false;
      this.sessionKey = await getPrinterStoreCache().getNewSessionKey(this.id);
      if (!this?.sessionKey) {
        this.reconnect("No session key!");
        return;
      }
      this.open();
    }, this.autoReconnectInterval);
  }

  ping() {
    getPrinterStoreCache().updateWebsocketState(this.id, PRINTER_STATES().WS_PONGING);
    logger.debug(this.url + ": Pinging client");
    this.pongTimer = Date.now();
    this.#instance.ping();
  }

  close() {
    logger.debug(`${this.url} requested to close the websocket...`);
    this.#instance.close();
  }

  terminate() {
    logger.debug(`${this.url} requested to terminate the websocket...`);
    this.#instance.terminate();
  }

  getState() {
    return {
      state: WS_STATE[this.#instance.readyState],
      desc: WS_DESC[this.#instance.readyState]
    };
  }

  killAllConnectionsAndListeners() {
    this.reconnectingIn = 0;
    getPrinterStoreCache().updatePrinterLiveValue(this.id, {
      websocketReconnectingIn: this.reconnectingIn
    });
    logger.info(`${this.url} Killing all listeners`);
    logger.debug("Force terminating websocket connection");
    this.terminate();
    clearTimeout(this.#heartbeatPing);
    logger.debug(this.url + " Cleared heartbeat ping timeout");
    clearTimeout(this.#heartbeatTerminate);
    logger.debug(this.url + " Cleared heartbeat terminate timeout");
    clearTimeout(this.reconnectTimeout);
    logger.debug(this.url + " Cleared reconnect timeout");
    logger.debug(this.url + " Removing all listeners");
    this.#instance.removeAllListeners();
    return true;
  }

  resetSocketConnection(newURL, newSession, currentUser) {
    this.url = newURL;
    this.sessionKey = newSession;
    this.currentUser = currentUser;
    this.terminate();
  }

  updateConnectionInformation(webSocketURL, currentUser) {
    this.url = webSocketURL + ENDPOINT;
    this.currentUser = currentUser;
  }
}

module.exports = WebSocketClient;
