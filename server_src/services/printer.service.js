"use strict";

const { OctoprintApiClientService } = require("../services/octoprint/octoprint-api-client.service");
const { SettingsClean } = require("../lib/dataFunctions/settingsClean");
const {
  defaultPrinterState,
  defaultApiChecksState
} = require("../constants/printer-states.constants");
const { PrinterTicker } = require("../runners/printerTicker");
const { CATEGORY } = require("../constants/state.constants");

class Printer {
  constructor(printer) {
    const { printerURL, camURL, apikey, group, webSocketURL, _id } = printer;
    this.disabled = false;
    this.ready = false;
    this._id = _id.toString();
    this.printerURL = printerURL;
    this.camURL = camURL;
    this.apikey = apikey;
    this.group = group;
    this.webSockerURL = webSocketURL;
    this.api = this.createApiService();
    this.apiTimeoutTriggered = false;
    this.apiChecks = defaultApiChecksState();
    this.printerData = defaultPrinterState();
    //this.websocket = new OctoPrintWebsocketService();
  }

  createApiService() {
    PrinterTicker.addIssue(
      new Date(),
      this.printerURL,
      "Initiating Printer...",
      CATEGORY.Active,
      this._id
    );
    return new OctoprintApiClientService(SettingsClean.returnTimeoutSettings(), {
      printerURL: this.printerURL,
      apikey: this.apikey
    });
  }

  runApiChecks() {
    // Update state to searching...
    // Collate data from OctoPrint if required...
  }

  setupWebsocketService() {}
}

module.exports = {
  Printer
};
