const WebSocket = require("ws");

const { SettingsClean } = require("../../lib/dataFunctions/settingsClean");
const { WS_STATE, WS_DESC, WS_ERRORS } = require("../printers/constants/websocket-constants");
const { OF_WS_DESC, OF_C_DESC } = require("../printers/constants/printer-state.constants");
const { PrinterTicker } = require("../../runners/printerTicker");
const Logger = require("../../handlers/logger");
const ConnectionMonitorService = require("../../services/connection-monitor.service");
const { REQUEST_TYPE, REQUEST_KEYS } = require("../../constants/connection-monitor.constants");

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
  #onMessage = undefined;
  autoReconnectInterval = undefined; // ms
  heartbeatInterval = undefined;
  heartbeatTimeout = undefined;
  reconnectTimeout = undefined;
  // pingPongTimer = 20000;
  systemSettings = SettingsClean.returnSystemSettings();
  url = undefined;
  id = undefined;
  polling = undefined;
  currentUser = undefined;
  sessionKey = undefined;
  startTime = undefined;
  endTime = undefined;

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
  // TODO maybe move to task manager again - required as OP doesn't seem to send ping/pong itself... Doesn't seem to be required anymore -_-
  // heartBeat() {
  //   if (!this.heartbeatInterval) {
  //     this.heartbeatInterval = setInterval(() => {
  //       console.log("heartbeat running");
  //       if (this.#instance.readyState === 1) {
  //         this.ping();
  //       }
  //     }, this.pingPongTimer);
  //   }
  // }

  open() {
    logger.debug(`${this.url}: ${OF_WS_DESC.SETTING_UP}`);
    PrinterTicker.addIssue(new Date(), this.url, `${OF_WS_DESC.SETTING_UP}`, "Active", this.id);
    this.#instance = new WebSocket(this.url, undefined, defaultWebsocketOptions);
    this.#instance.on("ping", () => {
      // console.log("PING RECEIVED");
    });

    this.#instance.on("pong", () => {
      // // this is issued if server sends ping
      // console.log(this.url + " Event pong");
      // clearTimeout(this.heartbeatTimeout);-
      //
      // // Use `WebSocket#terminate()`, which immediately destroys the connection,
      // // instead of `WebSocket#close()`, which waits for the close timer.
      // // Delay should be equal to the interval at which your server
      // // sends out pings plus a conservative assumption of the latency.
      // this.heartbeatTimeout = setTimeout(() => {
      //   console.log("Disconected from server");
      //   this.terminate();
      // }, this.pingPongTimer + 1000);
    });

    this.#instance.on("unexpected-response", (err) => {
      logger.error(`${this.url}: Unexpected Response!`, err);
    });

    // this.#instance.on("isPaused", () => {
    //   console.log("Paused websocket?");
    // });

    this.#instance.on("open", () => {
      logger.debug(`${this.url}: Websocket has been opened!`);
      PrinterTicker.addIssue(
        new Date(),
        this.url,
        "Opened OctoPrint websocket for user:" + this.currentUser,
        "Complete",
        this.id
      );
      // this.heartBeat();
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
      logger.debug(`${timeDifference - this.#lastMessage}ms since last message`);
      ConnectionMonitorService.updateOrAddResponse(
        this.url,
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
          break;
        case 1006: //Close Code 1006 is a special code that means the connection was closed abnormally (locally) by the browser implementation.
          PrinterTicker.addIssue(
            new Date(),
            this.url,
            `${OF_WS_DESC.SHUTDOWN_RECONNECT} Error: ${code} - ${reason}`,
            "Offline",
            this.id
          );
          clearInterval(this.heartbeatInterval);
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
          clearInterval(this.heartbeatInterval);
          this.reconnect(code);
          break;
      }
    });

    this.#instance.on("error", (e) => {
      logger.error(`${this.url}: Websocket Error!`, e);
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
      clearInterval(this.heartbeatInterval);
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

  sendThrottle() {
    const throttle = (this.polling * 1000) / 500;
    logger.info("Throttling websocket connection to: " + this.polling + " seconds");
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

  ping() {
    this.#instance.ping();
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
    logger.debug(
      `${this.url} Setting up reconnect in ${this.autoReconnectInterval}ms retry #${
        this.#retryNumber
      }`
    );
    ConnectionMonitorService.updateOrAddResponse(
      this.url,
      REQUEST_TYPE.WEBSOCKET,
      REQUEST_KEYS.RETRY_REQUESTED
    );
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
      this.open(this.url);
      this.reconnectTimeout = false;
      this.#retryNumber = this.#retryNumber + 1;
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
    logger.debug("Clearning heartbeat timeout", this.heartbeatTimeout);
    clearTimeout(this.heartbeatTimeout);
    logger.debug("Clearning reconnect timeout", this.reconnectTimeout);
    clearTimeout(this.reconnectTimeout);
    logger.debug("Clearning heartbeat interval", this.heartbeatInterval);
    clearInterval(this.heartbeatInterval);
    logger.debug("Removing all listeners", this.reconnectTimeout);
    this.#instance.removeAllListeners();
    return true;
  }
}

module.exports = WebSocketClient;
