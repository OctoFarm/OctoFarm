const { OP_WS_MSG } = require("../octoprint/constants/octoprint-websocket.constants");

class OctoprintWebsocketMessage {
  static parseData(data) {
    return JSON.parse(data);
  }

  static handleMessage(data) {
    const OP_EM = OctoprintWebsocketMessage;

    const parsedData = OP_EM.parseData(data);

    if (parsedData[OP_WS_MSG.connected]) {
      OP_EM.handleConnectedData(data);
    }

    if (parsedData[OP_WS_MSG.reauthRequired]) {
      OP_EM.handleReAuthData(data);
    }

    if (parsedData[OP_WS_MSG.current]) {
      OP_EM.handleCurrentData(data);
    }

    if (parsedData[OP_WS_MSG.history]) {
      OP_EM.handleHistoryData(data);
    }

    if (parsedData[OP_WS_MSG.event]) {
      OP_EM.handleEventData(data);
    }

    if (parsedData[OP_WS_MSG.plugin]) {
      OP_EM.handlePluginData(data);
    }

    if (parsedData[OP_WS_MSG.timelapse]) {
      OP_EM.handleTimelapseData(data);
    }

    if (parsedData[OP_WS_MSG.slicingProgress]) {
      OP_EM.handleSlicingData(data);
    }
  }

  static handleConnectedData(data) {}
  static handleReAuthData(data) {}
  static handleCurrentData(data) {}
  static handleHistoryData(data) {}
  static handleEventData(data) {}
  static handlePluginData(data) {}
  static handleTimelapseData(data) {}
  static handleSlicingData(data) {}
}
module.exports = OctoprintWebsocketMessage;
