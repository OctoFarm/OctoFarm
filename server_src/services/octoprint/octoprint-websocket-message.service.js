const {
  OP_WS_MSG,
  OP_WS_PLUGIN_KEYS
} = require("../octoprint/constants/octoprint-websocket.constants");
const { byteCount } = require("../../utils/benchmark.util");
const {
  captureTemperatureData,
  captureJobData,
  captureLogData,
  capturePrinterState
} = require("./utils/octoprint-websocket-helpers.utils");
const { captureKlipperPluginData } = require("./utils/octoprint-plugin.utils");
const Logger = require("../../handlers/logger");
const logger = new Logger("OctoFarm-State");

class OctoprintWebsocketMessageService {
  static parseOctoPrintWebsocketMessage = (message) => {
    const packet = JSON.parse(message);
    const header = Object.keys(packet)[0];

    logger.silly(`DEBUG WS ['${header}', ${byteCount(message)} bytes]`);

    return {
      header,
      data: packet
    };
  };

  static parseOctoPrintPluginMessage = (message) => {
    const header = Object.values(message.plugin)[0];

    logger.silly(`DEBUG WS ['${header}', ${byteCount(message)} bytes]`);

    return {
      header,
      data: message.plugin.data
    };
  };

  static parseOctoPrintPluginType = (message) => {
    const type = Object.values(message)[0];

    logger.silly(`DEBUG WS ['${type}', ${byteCount(message)} bytes]`);

    return type;
  };

  static handleMessage(printerID, message) {
    const OP_EM = OctoprintWebsocketMessageService;

    const { header, data } = OP_EM.parseOctoPrintWebsocketMessage(message);
    //TODO convert to switch
    switch (header) {
      case OP_WS_MSG.connected:
        OP_EM.handleConnectedData(printerID, data);
        break;
      case OP_WS_MSG.reauthRequired:
        OP_EM.handleReAuthData(printerID, data);
        break;
      case OP_WS_MSG.current:
        OP_EM.handleCurrentData(printerID, data);
        break;
      case OP_WS_MSG.history:
        OP_EM.handleHistoryData(printerID, data);
        break;
      case OP_WS_MSG.event:
        OP_EM.handleEventData(printerID, data);
        break;
      case OP_WS_MSG.plugin:
        OP_EM.handlePluginData(printerID, data);
        break;
      case OP_WS_MSG.timelapse:
        OP_EM.handleTimelapseData(printerID, data);
        break;
      case OP_WS_MSG.slicingProgress:
        OP_EM.handleSlicingData(printerID, data);
        break;
    }
  }

  static handleConnectedData(printerID, data) {}
  static handleReAuthData(printerID, data) {}
  static handleCurrentData(printerID, data) {
    capturePrinterState(printerID, data);
    captureTemperatureData(printerID, data);
    captureJobData(printerID, data);
    captureLogData(printerID, data);
  }
  static handleHistoryData(printerID, data) {}
  static handleEventData(printerID, data) {}
  static handlePluginData(printerID, message) {
    const OP_EM = OctoprintWebsocketMessageService;
    const { header, data } = OP_EM.parseOctoPrintPluginMessage(message);

    const type = OP_EM.parseOctoPrintPluginType(data);

    switch (header) {
      case OP_WS_PLUGIN_KEYS.pluginmanager:
        console.log(type);
        break;
      case OP_WS_PLUGIN_KEYS.klipper:
        console.log(type);
        //captureKlipperPluginData(printerID, data);
        break;
    }
  }
  static handleTimelapseData(printerID, data) {}
  static handleSlicingData(printerID, data) {}
}
module.exports = OctoprintWebsocketMessageService;
