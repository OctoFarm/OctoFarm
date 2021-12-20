const WebSocket = require("ws");

const defaultWebsocketOptions = {
  handshakeTimeout: 10000,
  followRedirects: true,
  perMessageDeflate: false,
  skipUTF8Validation: true,
}

class WebSocketClient {
    autoReconnectInterval = undefined; // ms
    pingTimeout = undefined;
    number = 0; // Message number
    url = undefined;
    constructor(
        autoReconnectInterval = 5 * 1000,
        webSocketURL
    ){
        this.autoReconnectInterval = autoReconnectInterval;
        this.url = webSocketURL;
    }

    open () {
        const that = this;
        this.instance = new WebSocket(this.url, undefined, defaultWebsocketOptions);
        this.instance.on("ping", function () {
          console.log("Received PING");
          clearTimeout(this.pingTimeout);

          // Use `WebSocket#terminate()`, which immediately destroys the connection,
          // instead of `WebSocket#close()`, which waits for the close timer.
          // Delay should be equal to the interval at which your server
          // sends out pings plus a conservative assumption of the latency.
          this.pingTimeout = setTimeout(function() {
            console.log("Disconected from server");
            this.terminate();
          }, 30000 + 1000);
        });

        this.instance.on("pong", function () {
          // this is issued if client sends ping
          console.log("Event pong");
        });

    }
}

WebSocketClient.prototype.open = function (url) {
  const that = this;

  this.url = url;
  this.instance = new WebSocket(URL, undefined, {
    handshakeTimeout: 10000
  });

  this.instance.on("ping", function () {
    console.log("Received PING");
    clearTimeout(this.pingTimeout);

    // Use `WebSocket#terminate()`, which immediately destroys the connection,
    // instead of `WebSocket#close()`, which waits for the close timer.
    // Delay should be equal to the interval at which your server
    // sends out pings plus a conservative assumption of the latency.
    this.pingTimeout = setTimeout(() => {
      console.log("Disconected from server");
      that.terminate();
    }, 30000 + 1000);
  });

  this.instance.on("pong", function () {
    // this is issued if client sends ping
    console.log("Event pong");
  });

  this.instance.on("open", function open() {
    console.log("Connected client");
    this.send(JSON.stringify([2, "message-id", "heartbeat", {}])); // ocpp heartbeat request
  });

  this.instance.on("message", function incoming(data) {
    console.log("Message received");
    console.log(data);
  });

  this.instance.on("close", function clear(code, reason) {
    console.log("Websocket closed. Code: " + code);
    switch (
      code // https://datatracker.ietf.org/doc/html/rfc6455#section-7.4.1
    ) {
      case 1000: //  1000 indicates a normal closure, meaning that the purpose for which the connection was established has been fulfilled.
        console.log("WebSocket: closed");
        break;
      case 1006: //Close Code 1006 is a special code that means the connection was closed abnormally (locally) by the browser implementation.
        console.log("WebSocket: closed abnormally");
        debugger;
        that.reconnect(code);
        break;
      default:
        // Abnormal closure
        debugger;
        console.log("WebSocket: closed unknown");
        that.reconnect(code);
        break;
    }

    clearTimeout(this.pingTimeout);
  });

  this.instance.on("error", function (e) {
    console.error(e);
    switch (e.code) {
      case "ECONNREFUSED":
        console.log("Error ECONNREFUSED. Server is not accepting connections");
        that.reconnect(e);
        break;
      default:
        console.log("UNKNOWN ERROR");
        that.onerror(e);
        break;
    }
  });
};

WebSocketClient.prototype.send = function (data, option) {
  try {
    this.instance.send(data, option);
  } catch (e) {
    this.instance.emit("error", e);
  }
};

WebSocketClient.prototype.reconnect = function (e) {
  console.log(`WebSocketClient: retry in ${this.autoReconnectInterval}ms`, e);
  this.instance.removeAllListeners();
  const that = this;
  setTimeout(function () {
    console.log("WebSocketClient: reconnecting...");
    that.open(that.url);
  }, this.autoReconnectInterval);
};

WebSocketClient.prototype.onopen = function (e) {
  console.log("WebSocketClient: open", arguments);
};
WebSocketClient.prototype.onmessage = function (data, flags, number) {
  console.log("WebSocketClient: message", arguments);
};
WebSocketClient.prototype.onerror = function (e) {
  console.log("WebSocketClient: error", arguments);
};
WebSocketClient.prototype.onclose = function (e) {
  console.log("WebSocketClient: closed", arguments);
};
