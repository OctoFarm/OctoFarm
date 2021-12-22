const WebSocket = require("ws");

const { SettingsClean } = require("../../lib/dataFunctions/settingsClean");
const { WS_STATE, WS_DESC, WS_ERRORS } = require("../printers/constants/websocket-constants");
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
  number = 0; // Message number
  pingPongTimer = 20000;
  systemSettings = SettingsClean.returnSystemSettings();
  url = undefined;

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
    this._id = id;
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
    console.log("OPENING CONNECTION", this.url);
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
      console.log("Unexpected Response");
    });

    this.#instance.on("isPaused", () => {
      console.log("Paused websocket?");
    });

    this.#instance.on("open", () => {
      // this.heartBeat();
      this.#retryNumber = 0;
      this.autoReconnectInterval = this.systemSettings.timeout.webSocketRetry;
      this.sendAuth();
      this.sendThrottle();
    });

    // This needs overriding by message passed through
    this.#instance.on("message", (data) => {
      console.debug(
        `${this.url}: Message #${this.#messageNumber} received, ${
          Date.now() - this.#lastMessage
        }ms since last message`
      );

      this.#onMessage(data);

      this.#messageNumber++;
      this.#lastMessage = Date.now();
    });

    this.#instance.on("close", (code, reason) => {
      console.log("Websocket closed. Code: " + code, reason.toString());
      switch (
        code // https://datatracker.ietf.org/doc/html/rfc6455#section-7.4.1
      ) {
        case 1000: //  1000 indicates a normal closure, meaning that the purpose for which the connection was established has been fulfilled.
          console.log("WebSocket: closed");
          break;
        case 1006: //Close Code 1006 is a special code that means the connection was closed abnormally (locally) by the browser implementation.
          console.log("WebSocket: closed abnormally");
          clearInterval(this.heartbeatInterval);
          this.reconnect(code);
          debugger;
          break;
        default:
          // Abnormal closure
          debugger;
          console.log("WebSocket: closed unknown");
          clearInterval(this.heartbeatInterval);
          this.reconnect(code);
          break;
      }
    });

    this.#instance.on("error", (e) => {
      switch (e.code) {
        case WS_ERRORS.ECONNREFUSED:
          console.log(`Error ${WS_ERRORS.ECONNREFUSED}. Server is not accepting connections`);
          break;
        case WS_ERRORS.ECONNRESET:
          console.log(`Error ${WS_ERRORS.ECONNRESET}. Server reset the connection!`);
          break;
        case WS_ERRORS.EHOSTUNREACH:
          console.log(`Error ${WS_ERRORS.EHOSTUNREACH}. Server is not reachable!`);
          break;
        case WS_ERRORS.ENOTFOUND:
          console.log(`Error ${WS_ERRORS.ENOTFOUND}. Server cannot be found!`);
          break;
        default:
          console.error("UNKNOWN ERROR");
          break;
      }
      clearInterval(this.heartbeatInterval);
      this.reconnect(e);
    });
  }

  sendAuth() {
    this.send(
      JSON.stringify({
        auth: `${this.currentUser}:${this.sessionKey}`
      })
    );
  }

  sendThrottle() {
    this.send(
      JSON.stringify({
        throttle: (this.polling * 1000) / 500
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
    console.log(
      `${this.url} WebSocketClient: retry in ${this.autoReconnectInterval}ms retry #${
        this.#retryNumber
      }`,
      e
    );
    this.#instance.removeAllListeners();
    this.reconnectTimeout = setTimeout(() => {
      console.log("WebSocketClient: reconnecting...");
      if (this.#retryNumber > 0) {
        const modifier = this.systemSettings.timeout.webSocketRetry * 0.1;
        this.autoReconnectInterval = this.autoReconnectInterval + modifier;
      }
      this.open(this.url);
      this.reconnectTimeout = false;
      this.#retryNumber = this.#retryNumber + 1;
    }, this.autoReconnectInterval);
  }

  close() {
    console.log("CLOSING WEBSOCKET");
    this.#instance.close();
  }

  terminate() {
    this.#instance.terminate();
  }

  getState() {
    return {
      state: WS_STATE[this.#instance.readyState],
      desc: WS_DESC[this.#instance.readyState]
    };
  }

  killAllConnectionsAndListeners() {
    clearTimeout(this.heartbeatTimeout);
    clearTimeout(this.reconnectTimeout);
    clearInterval(this.heartbeatInterval);
    this.terminate();
  }
}

module.exports = WebSocketClient;
