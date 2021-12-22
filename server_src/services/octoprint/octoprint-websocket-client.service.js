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
  #lastMessage = Date.now();
  #instance = undefined;
  systemSettings = SettingsClean.returnSystemSettings();
  autoReconnectInterval = undefined; // ms
  pingTimeout = undefined;
  number = 0; // Message number
  url = undefined;

  constructor(
    webSocketURL = undefined,
    id = undefined,
    currentUser = undefined,
    sessionKey = undefined,
    polling = undefined
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
  }

  open() {
    console.log("OPENING CONNECTION", this.url);
    this.#instance = new WebSocket(this.url, undefined, defaultWebsocketOptions);
    this.#instance.on("ping", function () {
      console.log("PING SENT");
      clearTimeout(this.pingTimeout);

      // Use `WebSocket#terminate()`, which immediately destroys the connection,
      // instead of `WebSocket#close()`, which waits for the close timer.
      // Delay should be equal to the interval at which your server
      // sends out pings plus a conservative assumption of the latency.
      this.pingTimeout = setTimeout(function () {
        console.log("TIMEOUT");
        console.log("Disconected from server");
        this.terminate();
      }, 25000 + 1000);
    });

    this.#instance.on("pong", () => {
      // this is issued if client sends ping
      console.log("Event pong");
    });

    this.#instance.on("unexpected-response", (err) => {
      console.log("Unexpected Response");
    });

    this.#instance.on("isPaused", () => {
      console.log("Paused websocket?");
    });

    this.#instance.on("open", () => {
      console.log("Connected client");
      this.send(JSON.stringify([2, "message-id", "heartbeat", {}])); // ocpp heartbeat request
      this.onopen();
    });

    // This needs overriding by message passed through
    this.#instance.on("message", (data) => {
      console.log(
        `Message #${this.#messageNumber} received, ${
          Date.now() - this.#lastMessage
        }ms since last message`
      );
      this.#messageNumber++;
      this.#lastMessage = Date.now();
      // console.log(data.toString());
    });

    this.#instance.on("close", (code, reason) => {
      console.log("Websocket closed. Code: " + code, reason);
      switch (
        code // https://datatracker.ietf.org/doc/html/rfc6455#section-7.4.1
      ) {
        case 1000: //  1000 indicates a normal closure, meaning that the purpose for which the connection was established has been fulfilled.
          console.log("WebSocket: closed");
          break;
        case 1006: //Close Code 1006 is a special code that means the connection was closed abnormally (locally) by the browser implementation.
          console.log("WebSocket: closed abnormally");
          debugger;
          this.reconnect(code);
          break;
        default:
          // Abnormal closure
          debugger;
          console.log("WebSocket: closed unknown");
          this.reconnect(code);
          break;
      }

      clearTimeout(this.pingTimeout);
    });

    this.#instance.on("error", (e) => {
      console.error(e);
      switch (e.code) {
        case "ECONNREFUSED":
          console.log("Error ECONNREFUSED. Server is not accepting connections");
          this.reconnect(e);
          break;
        default:
          console.log("UNKNOWN ERROR");
          this.onerror(e);
          break;
      }
    });
  }

  send(data, option) {
    try {
      this.#instance.send(data, option);
    } catch (e) {
      this.#instance.emit("error", e);
    }
  }
  reconnect(e) {
    console.log(`WebSocketClient: retry in ${this.autoReconnectInterval}ms`, e);
    this.#instance.removeAllListeners();
    setTimeout(() => {
      console.log("WebSocketClient: reconnecting...");
      this.open(this.url);
    }, this.autoReconnectInterval);
  }

  close() {
    this.#instance.close();
  }

  getState() {
    return {
      state: WS_STATE[this.#instance.readyState],
      desc: WS_DESC[this.#instance.readyState]
    };
  }

  onopen(e) {
    this.#instance.send(
      JSON.stringify({
        auth: `${this.currentUser}:${this.sessionKey}`
      })
    );
    this.#instance.send(
      JSON.stringify({
        throttle: (parseInt(this.polling) * 1000) / 500
      })
    );
    console.log("WebSocketClient: open", arguments);
  }
  onmessage(data, flags, number) {
    console.log("WebSocketClient: message", arguments);
  }
  onerror(e) {
    console.log("WebSocketClient: error", arguments);
  }
  onclose(e) {
    console.log("WebSocketClient: closed", arguments);
  }
}

module.exports = WebSocketClient;
