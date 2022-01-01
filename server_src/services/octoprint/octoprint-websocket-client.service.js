const WebSocket = require("ws");

const { SettingsClean } = require("../../lib/dataFunctions/settingsClean");
const { WS_STATE, WS_DESC, WS_ERRORS } = require("../printers/constants/websocket-constants");
const {
  OF_WS_DESC,
  OF_C_DESC,
  PRINTER_STATES
} = require("../printers/constants/printer-state.constants");
const { PrinterTicker } = require("../../runners/printerTicker");
const Logger = require("../../handlers/logger");
const ConnectionMonitorService = require("../../services/connection-monitor.service");
const { REQUEST_TYPE, REQUEST_KEYS } = require("../../constants/connection-monitor.constants");
const { getPrinterStoreCache } = require("../../cache/printer-store.cache");

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
  #pingPongTimer = 20000;
  #heartbeatTerminate = undefined;
  #heartbeatPing = undefined;
  #onMessage = undefined;
  autoReconnectInterval = undefined; // ms
  reconnectTimeout = undefined;
  systemSettings = SettingsClean.returnSystemSettings();
  url = undefined;
  id = undefined;
  polling = undefined;
  currentUser = undefined;
  sessionKey = undefined;

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
    this.polling = this.systemSettings.onlinePolling.seconds;
    this.id = id;
    this.url = webSocketURL + ENDPOINT;
    this.currentUser = currentUser;
    this.sessionKey = sessionKey;
    this.#onMessage = onMessageFunction;

    this.open();
  }

  open() {
    logger.debug(`${this.url}: ${OF_WS_DESC.SETTING_UP}`);
    PrinterTicker.addIssue(new Date(), this.url, `${OF_WS_DESC.SETTING_UP}`, "Active", this.id);
    this.#instance = new WebSocket(this.url, undefined, defaultWebsocketOptions);
    this.#instance.on("ping", () => {
      logger.error("PING RECEIVED");
    });

    this.#instance.on("pong", () => {
      getPrinterStoreCache().updateWebsocketState(this.id, PRINTER_STATES().WS_ONLINE);
      logger.debug(this.url + " received pong message from server");
      clearTimeout(this.#heartbeatTerminate);
      clearTimeout(this.#heartbeatPing);

      this.#heartbeatTerminate = setTimeout(() => {
        logger.info(this.url + ": Didn't receive a pong from client, reconnecting!");
        PrinterTicker.addIssue(
          new Date(),
          this.url,
          "Didn't receive a pong from client, reconnecting!",
          "Offline",
          this.id
        );
        ConnectionMonitorService.updateOrAddResponse(
          this.url + ENDPOINT,
          REQUEST_TYPE.WEBSOCKET,
          REQUEST_KEYS.TOTAL_PING_PONG
        );
        this.terminate();
      }, this.#pingPongTimer + 1000);
      logger.debug(this.url + " terminate timeout set", this.#pingPongTimer + 1000);
      this.#heartbeatPing = setTimeout(() => {
        getPrinterStoreCache().updateWebsocketState(this.id, PRINTER_STATES().WS_PONGING);
        logger.debug(this.url + ": Pinging client");
        this.#instance.ping();
      }, this.#pingPongTimer - 1000);
      logger.debug(this.url + " ping timout set", this.#pingPongTimer - 1000);
    });

    this.#instance.on("unexpected-response", (err) => {
      logger.error(`${this.url}: Unexpected Response!`, err);
    });

    // this.#instance.on("isPaused", () => {
    //   console.log("Paused websocket?");
    // });

    this.#instance.on("open", () => {
      ConnectionMonitorService.updateOrAddResponse(
        this.url + ENDPOINT,
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
      // this.heartBeat();
      this.#retryNumber = 0;
      this.autoReconnectInterval = this.systemSettings.timeout.webSocketRetry;
      this.sendAuth();
      this.sendThrottle();
      this.#instance.ping();
    });

    // This needs overriding by message passed through
    this.#instance.on("message", (data) => {
      const timeDifference = ConnectionMonitorService.stopTimer();
      logger.silly(
        `${this.url}: Message #${this.#messageNumber} received, ${
          timeDifference - this.#lastMessage
        }ms since last message`
      );
      logger.debug(`${timeDifference - this.#lastMessage}ms since last message`);
      ConnectionMonitorService.updateOrAddResponse(
        this.url + ENDPOINT,
        REQUEST_TYPE.WEBSOCKET,
        REQUEST_KEYS.LAST_RESPONSE,
        ConnectionMonitorService.calculateTimer(this.#lastMessage, timeDifference)
      );

      this.#onMessage(this.id, data);

      this.#messageNumber++;
      this.#lastMessage = ConnectionMonitorService.startTimer();
    });

    this.#instance.on("close", (code, reason) => {
      logger.error(`${this.url}: Websocket Closed!`, { code, reason });
      ConnectionMonitorService.updateOrAddResponse(
        this.url + ENDPOINT,
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
          break;
        case 1006: //Close Code 1006 is a special code that means the connection was closed abnormally (locally) by the server implementation.
          PrinterTicker.addIssue(
            new Date(),
            this.url,
            `${OF_WS_DESC.SHUTDOWN_RECONNECT} Error: ${code} - ${reason}`,
            "Offline",
            this.id
          );
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
          debugger;
          this.reconnect(code);
          break;
      }
    });

    this.#instance.on("error", (e) => {
      logger.error(`${this.url}: Websocket Error!`, e);
      ConnectionMonitorService.updateOrAddResponse(
        this.url + ENDPOINT,
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
    logger.debug("Authenticating the websocket for user:" + this.currentUser);
    PrinterTicker.addIssue(
      new Date(),
      this.url,
      "Authenticating the websocket for user:" + this.currentUser,
      "Active",
      this.id
    );
    this.send(
      JSON.stringify({
        auth: `${this.currentUser}:${this.sessionKey}`
      })
    );
  }

  sendThrottle(seconds = undefined) {
    let throttle = (this.polling * 1000) / 500;
    if (!!seconds) {
      throttle = (seconds * 1000) / 500;
    }
    logger.debug("Throttling websocket connection to: " + this.polling + " seconds");
    PrinterTicker.addIssue(
      new Date(),
      this.url,
      "Throttling websocket connection to: " + this.polling + " seconds",
      "Active",
      this.id
    );
    this.send(
      JSON.stringify({
        throttle: throttle
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
        }. Subsequent logs will be silenced...`,
        "Active",
        this.id
      );
    }
    logger.info(
      `${this.url} Setting up reconnect in ${this.autoReconnectInterval}ms retry #${
        this.#retryNumber
      }`
    );
    ConnectionMonitorService.updateOrAddResponse(
      this.url,
      REQUEST_TYPE.WEBSOCKET,
      REQUEST_KEYS.RETRY_REQUESTED
    );
    clearTimeout(this.#heartbeatTerminate);
    clearTimeout(this.#heartbeatPing);
    this.#instance.removeAllListeners();
    this.reconnectTimeout = setTimeout(() => {
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
      this.open();
      this.#retryNumber = this.#retryNumber + 1;
      clearTimeout(this.reconnectTimeout);
    }, this.autoReconnectInterval);
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

  resetSocketConnection(newURL, newSession) {
    this.url = newURL;
    this.sessionKey = newSession;
    this.terminate();
  }
}

module.exports = WebSocketClient;
