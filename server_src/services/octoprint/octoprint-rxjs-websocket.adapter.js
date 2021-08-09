const WebSocket = require("ws");
const { throwError, catchError, map, filter, switchMap, share } = require("rxjs/operators");
const { default: makeWebSocketObservable, normalClosureMessage } = require("rxjs-websockets");
const GenericWebsocketAdapter = require("../../handlers/generic-websocket.adapter");
const QueueingSubject = require("../../handlers/queued-subject");
const { PEVENTS } = require("../../constants/event.constants");
const { parseOctoPrintWebsocketMessage } = require("./utils/websocket.utils");
const {
  PSTATE,
  OP_STATE,
  mapStateToColor,
  remapOctoPrintState
} = require("../../constants/state.constants");
const {
  OP_WS_SKIP,
  OP_WS_MSG,
  getDefaultPrinterState,
  getDefaultCurrentState,
  WS_STATE
} = require("./constants/octoprint-websocket.constants");

const _OctoPrintWebSocketRoute = "/sockjs/websocket";

module.exports = class OctoprintRxjsWebsocketAdapter extends GenericWebsocketAdapter {
  // Required data to setup OctoPrint WS connection
  #currentUser;
  #sessionKey;
  #throttle;
  #debug = false;

  #socket$;
  #messageInputSubject;
  #messageOutput$;

  // Current causes this
  #printerState = getDefaultPrinterState();
  // History and current update this
  #currentState = getDefaultCurrentState();
  // Feel free to add in stuff like branch, permissions, plugin_hash and config_hash
  #octoPrintMeta = {};
  #webSocketState = WS_STATE.unopened;

  constructor({ id, webSocketURL, currentUser, sessionKey, throttle, debug = false }) {
    super({ id: id.toString(), webSocketURL });

    this.#currentUser = currentUser;
    this.#sessionKey = sessionKey;
    this.#throttle = throttle;
    this.#debug = debug;

    this.#constructClient();
    this.#messageInputSubject = new QueueingSubject();
  }

  #constructClient() {
    const options = {
      makeWebSocket: (url, protocols) => new WebSocket(url, protocols)
    };

    // create the websocket observable, does *not* open the websocket connection
    const constructedUrl = new URL(_OctoPrintWebSocketRoute, this.webSocketURL);
    this.#socket$ = makeWebSocketObservable(constructedUrl.href, options);

    // setup the transform pipeline
    this.#messageOutput$ = this.#socket$.pipe(
      switchMap((getResponses) => {
        this.#setWebSocketState(WS_STATE.opening);
        this.#sendSetupData();
        this.#setWebSocketState(WS_STATE.connected);
        return getResponses(this.#messageInputSubject);
      }),
      share(), // share the websocket connection across subscribers
      map((r) => {
        this.#setWebSocketState(WS_STATE.authed);
        return parseOctoPrintWebsocketMessage(r);
      }),
      filter((msg) => !OP_WS_SKIP.includes(msg.header)),
      map((msg) => {
        return this.#transformStatefulMessage(msg);
      }),
      catchError((error) => {
        const { message } = error;
        this.resetPrinterState();
        if (message === normalClosureMessage) {
          console.log("Server closed the websocket connection normally.");
          this.#setWebSocketState(WS_STATE.closed);
        } else {
          console.log("WebSocket threw error:", error.stack);
          // TODO an error does not immediately mean its closed
          this.#setWebSocketState(WS_STATE.closed);
          throwError(error);
        }
      })
    );
  }

  #sendSetupData() {
    const data = { auth: `${this.#currentUser}:${this.#sessionKey}` };
    this.#sendMessage(data);

    if (this.#throttle) {
      const throtleSettings = { throttle: this.#throttle };
      this.#sendMessage(throtleSettings);
    }
  }

  #transformStatefulMessage(parsedMessage) {
    if (!parsedMessage?.header) {
      throw new Error("Parsed OP message didnt contain 'header'.");
    }

    // This is a initial setup for an event bus implementation
    const octoFarmEvents = [];

    const { header, data } = parsedMessage;
    switch (header) {
      case OP_WS_MSG.connected:
        this.#octoPrintMeta = {
          octoPrintVersion: data.version,
          config_hash: data.config_hash,
          plugin_hash: data.plugin_hash
        };
        this.#setPrinterState({ state: PSTATE.Offline, desc: "Awaiting printer state messages" });
        break;
      case OP_WS_MSG.history:
        this.#handleCurrentStateData(data);
        octoFarmEvents.push({ type: PEVENTS.init, data });
        break;
      case OP_WS_MSG.current:
        this.#handleCurrentStateData(data);
        octoFarmEvents.push({ type: PEVENTS.current, data });
        break;
      case OP_WS_MSG.event:
        octoFarmEvents.push({ type: PEVENTS.event, data });
        break;
      default:
        console.log("unhandled message", header);
    }

    return octoFarmEvents;
  }

  #handleCurrentStateData(data) {
    // Basically buffer the last state for ease of access - might be removed
    this.#saveSubStateData("resends", data);
    this.#saveSubStateData("progress", data);
    this.#saveSubStateData("job", data);
    this.#saveSubStateData("currentZ", data);

    const octoFarmMappedState = remapOctoPrintState(data.state);
    this.#setPrinterState(octoFarmMappedState);
  }

  #saveSubStateData(subState, data) {
    if (data.hasOwnProperty(subState)) {
      this.#currentState[subState] = data[subState];
    } else {
      console.warn(`Received OP substate ${subState} was not initialized and thus not recognized.`);
    }
  }

  getCurrentStateData() {
    return this.#currentState;
  }

  #sendMessage(message) {
    this.#messageInputSubject.next(JSON.stringify(message));
  }

  #setWebSocketState(newState) {
    if (newState !== this.#webSocketState && this.#debug) {
      console.log(`ws changing state ${newState}`);
    }
    this.#webSocketState = newState;
  }

  getOctoPrintMeta() {
    return this.#octoPrintMeta;
  }

  /**
   * Pass the current job state upward
   * @returns {{file: undefined, lastPrintTime: undefined, estimatedPrintTime: undefined, averagePrintTime: undefined, filament: undefined, user: undefined}}
   */
  getPrinterJob() {
    return this.#currentState?.job;
  }

  getPrinterState() {
    return this.#printerState;
  }

  resetPrinterState() {
    this.#printerState = getDefaultPrinterState();
  }

  getWebSocketState() {
    return this.#webSocketState;
  }

  getMessages$() {
    return this.#messageOutput$;
  }

  close() {
    this.#messageInputSubject.complete();
    this.resetPrinterState();
  }

  #setPrinterState({ state, desc, flags }) {
    if (this.#printerState.state !== state && this.#debug) {
      console.log(`changing OP printer state ${state}`);
    }
    this.#printerState = {
      state,
      flags,
      colour: mapStateToColor(state),
      desc
    };
  }
};
