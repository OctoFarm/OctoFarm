const { getSystemChecksDefault, mapStateToColor } = require("./state.constants");

/**
 * This is a model to simplify unified printers state
 * This class is designed with serialization to network, file and possibly database in mind.
 */
class PrinterStateModel {
  #id;

  #state = "Setting Up";
  #stateColour = mapStateToColor("Offline");
  #stateDescription = "Setting up your Printer";

  #hostState = "Setting Up";
  #hostStateColour = mapStateToColor("Offline");
  #hostDescription = "Setting up your Printer";

  #sessionKey;

  #webSocket = "danger";
  #webSocketDescription = "Websocket unconnected";
  #wsClient;

  #stepRate = 10;
  #systemChecks = getSystemChecksDefault();
  #alerts = null;

  // New idea to enable/disable printers
  // enabled = false;

  constructor(id) {
    this.#id = id;
  }

  get id() {
    return this.#id;
  }

  resetConnectionState() {
    this.#state = "Searching...";
    this.#stateColour = mapStateToColor("Searching...");
    this.#stateDescription = "Re-scanning your OctoPrint Instance";

    this.#hostState = "Searching...";
    this.#hostStateColour = mapStateToColor("Searching...");
    this.#hostDescription = "Re-scanning for OctoPrint Host";

    this.#webSocket = "danger";
    this.#webSocketDescription = "Websocket closed";
  }

  resetSystemChecksState() {
    this.#systemChecks.api.status = "warning";
    this.#systemChecks.files.status = "warning";
    this.#systemChecks.state.status = "warning";
    this.#systemChecks.profile.status = "warning";
    this.#systemChecks.settings.status = "warning";
    this.#systemChecks.system.status = "warning";
  }

  setSearchingState() {
    this.#state = "Searching...";
    this.#stateColour = mapStateToColor("Searching...");
    this.#stateDescription = "Attempting to connect to OctoPrint";

    this.#hostState = "Searching...";
    this.#hostStateColour = mapStateToColor("Searching...");
    this.#hostDescription = "Attempting to connect to OctoPrint";

    this.#webSocket = "danger";
    this.#webSocketDescription = "Websocket Offline";

    this.#systemChecks.api.status = "warning";
  }

  setWebsocketTentativeState() {
    this.#webSocket = "info";
    this.#webSocketDescription = "Awaiting current websocket attempt to end...";
  }

  setApiSuccessState() {
    this.#systemChecks.api.status = "success";
    this.#systemChecks.api.date = new Date();
  }

  setApiLoginSuccessState(sessionKey) {
    this.#sessionKey = sessionKey;

    this.#hostState = "Online";
    this.#hostStateColour = mapStateToColor("Online");
    this.#hostDescription = "Host is Online";
  }

  setFilesSuccessState() {
    this.#systemChecks.files.status = "success";
    this.#systemChecks.files.date = new Date();
  }

  setSystemSuccessState(success = true) {
    this.#systemChecks.system.status = success ? "success" : "danger";
    this.#systemChecks.system.date = new Date();
  }

  attachWebsocketClient(ws) {
    this.#wsClient = ws;
  }
}

module.exports = PrinterStateModel;
