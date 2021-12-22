const WebSocket = require("ws");

const { SettingsClean } = require("../../lib/dataFunctions/settingsClean");
const { WS_STATE, WS_DESC } = require("../printers/constants/websocket-constants");
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
  autoReconnectInterval = undefined; // ms
  heartbeatInterval = undefined;
  heartbeatTimeout = undefined;
  reconnectTimeout = undefined;
  number = 0; // Message number
  systemSettings = SettingsClean.returnSystemSettings();
  url = undefined;

  constructor(
    webSocketURL = undefined,
    id = undefined,
    currentUser = undefined,
    sessionKey = undefined
  ) {
    if (!webSocketURL || !id || !currentUser || !sessionKey)
      throw new Error("Missing required keys");

    this.autoReconnectInterval = this.systemSettings.timeout.webSocketRetry;
    this.polling = this.systemSettings.onlinePolling.seconds;
    this._id = id;
    this.url = webSocketURL + ENDPOINT;
    this.currentUser = currentUser;
    this.sessionKey = sessionKey;

    this.open();
    this.heartBeat();
  }

  heartBeat() {
    if (!this.heartbeatInterval) {
      this.heartbeatInterval = setInterval(() => {
        this.ping();
      }, 5000);
    }
  }

  open() {
    console.log("OPENING CONNECTION", this.url);
    this.#instance = new WebSocket(this.url, undefined, defaultWebsocketOptions);

    this.#instance.on("ping", () => {
      console.log("PONG RECEIVED");
    });

    this.#instance.on("pong", () => {
      // this is issued if client sends ping
      console.log(this.url + " Event pong");
      clearTimeout(this.heartbeatTimeout);

      // Use `WebSocket#terminate()`, which immediately destroys the connection,
      // instead of `WebSocket#close()`, which waits for the close timer.
      // Delay should be equal to the interval at which your server
      // sends out pings plus a conservative assumption of the latency.
      this.heartbeatTimeout = setTimeout(() => {
        console.log("Disconected from server");
        this.terminate();
      }, 5000 + 1000);
    });

    this.#instance.on("unexpected-response", (err) => {
      console.log("Unexpected Response");
    });

    this.#instance.on("isPaused", () => {
      console.log("Paused websocket?");
    });

    this.#instance.on("open", () => {
      this.#retryNumber = 0;
      this.sendAuth();
      this.sendThrottle();
    });

    // This needs overriding by message passed through
    this.#instance.on("message", (data, isBinary) => {
      console.log("MESSAGE IS BINARY", isBinary);
      console.log(
        `${this.url}: Message #${this.#messageNumber} received, ${
          Date.now() - this.#lastMessage
        }ms since last message`
      );

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
          this.reconnect(code);
          debugger;
          break;
        default:
          // Abnormal closure
          debugger;
          console.log("WebSocket: closed unknown");
          this.reconnect(code);
          break;
      }
    });

    this.#instance.on("error", (e) => {
      switch (e.code) {
        case "ECONNREFUSED":
          console.log("Error ECONNREFUSED. Server is not accepting connections");

          break;
        default:
          console.error("UNKNOWN ERROR");
          break;
      }
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
    console.log(`${this.url} WebSocketClient: retry in ${this.autoReconnectInterval}ms`, e);
    console.log("Retry Number", this.#retryNumber);
    this.#instance.removeAllListeners();
    this.#retryNumber = this.#retryNumber + 1;
    setTimeout(() => {
      console.log("WebSocketClient: reconnecting...");
      this.open(this.url);
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
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
