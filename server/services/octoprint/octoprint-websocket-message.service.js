const {
  OP_WS_MSG,
  OP_WS_PLUGIN_KEYS,
  OP_WS_MSG_KEYS,
  EVENT_TYPES
} = require("../octoprint/constants/octoprint-websocket.constants");
const { byteCount } = require("../../utils/benchmark.util");
const {
  captureTemperatureData,
  captureJobData,
  captureLogData,
  capturePrinterState,
  captureConnectedData,
  removeMultiUserFlag,
  setWebsocketAlive,
  captureResendsData,
  capturePrinterProgress,
  captureCurrentZ
} = require("./utils/octoprint-websocket-helpers.utils");
const {
  captureClientAuthed,
  captureClientClosed,
  captureClientOpened,
  captureConnected,
  captureDisconnecting,
  captureDisconnected,
  captureDwelling,
  captureError,
  captureFileAdded,
  captureFileDeselected,
  captureFileRemoved,
  captureFirmwareData,
  captureFolderAdded,
  captureFolderRemoved,
  captureHome,
  captureMetadataAnalysisFinished,
  captureMetadataAnalysisStarted,
  captureMetadataStatisticsUpdated,
  capturePositionUpdate,
  capturePrintCancelled,
  capturePrintCancelling,
  captureFinishedPrint,
  capturePrintPaused,
  capturePrintStarted,
  capturePrinterStateChanged,
  captureTransferDone,
  captureTransferStarted,
  captureUpdatedFiles,
  captureUpload,
  captureUserLoggedIn,
  captureUserLoggedOut,
  captureZChange,
  capturePrintFailed
} = require("./utils/octoprint-event.utils");
const {
  captureKlipperPluginData,
  capturePluginManagerData,
  captureThrottlePluginData,
  captureResourceMonitorData,
  captureDisplayLayerProgress,
  captureUpdatingData
} = require("./utils/octoprint-plugin.utils");

const Logger = require("../../handlers/logger");
const { mapStateToCategory } = require("../printers/utils/printer-state.utils");
const { getPrinterStoreCache } = require("../../cache/printer-store.cache");
const { LOGGER_ROUTE_KEYS } = require("../../constants/logger.constants");
const logger = new Logger(LOGGER_ROUTE_KEYS.OP_SERVICE_WEBSOCKET_MESSAGES);

const loggedMissingPlugins = {};

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

  static async handleMessage(printerID, message) {
    const OP_EM = OctoprintWebsocketMessageService;

    const { header, data } = OP_EM.parseOctoPrintWebsocketMessage(message);

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
        await OP_EM.handleEventData(printerID, data);
        break;
      case OP_WS_MSG.plugin:
        OP_EM.handlePluginData(printerID, data);
        break;
      default:
        logger.debug("No case matched... ignoring data", data);
    }
  }

  static handleConnectedData(printerID, data) {
    //updateVersionData
    //I WISH OP DIDN'T SEND THIS UNLESS AUTHED!
    captureConnectedData(printerID, data);
  }
  static handleReAuthData(printerID, data) {
    logger.warning("Re-auth required for socket!", data);
    if (!!data?.reauthRequired) {
      logger.info("Re-authenticating web socket");
      const printer = getPrinterStoreCache().getPrinter(printerID);
      printer.reConnectWebsocket();
    }
  }

  static handleCurrentData(printerID, data) {
    setWebsocketAlive(printerID);
    const { current } = data;

    capturePrinterState(printerID, current[OP_WS_MSG_KEYS.state]);

    captureTemperatureData(printerID, current[OP_WS_MSG_KEYS.temps]);

    captureJobData(printerID, current[OP_WS_MSG_KEYS.job]);
    //
    captureLogData(printerID, current[OP_WS_MSG_KEYS.logs]);
    //
    captureResendsData(printerID, current[OP_WS_MSG_KEYS.resends]);
    //
    capturePrinterProgress(printerID, current[OP_WS_MSG_KEYS.progress]);
    //
    captureCurrentZ(printerID, current[OP_WS_MSG_KEYS.currentZ]);
  }
  static handleHistoryData(printerID, data) {
    removeMultiUserFlag(printerID);
    // force update state here after connection established.
    const currentState = {
      state: "Disconnected",
      stateColour: mapStateToCategory("Disconnected"),
      stateDescription: "Websocket Connected but in Tentative state until receiving data"
    };

    getPrinterStoreCache().updatePrinterState(printerID, currentState);
  }
  static async handleEventData(printerID, data) {
    const { type, payload } = data.event;
    const debugMessage = `Detected ${type} event`;
    logger.debug(debugMessage, payload);
    switch (type) {
      case EVENT_TYPES.ClientAuthed:
        captureClientAuthed(printerID, payload);
        break;
      case EVENT_TYPES.ClientClosed:
        captureClientClosed(printerID, payload);
        break;
      case EVENT_TYPES.ClientOpened:
        captureClientOpened(printerID, payload);
        break;
      case EVENT_TYPES.Connected:
        captureConnected(printerID, payload);
        break;
      case EVENT_TYPES.Disconnecting:
        captureDisconnecting(printerID, payload);
        break;
      case EVENT_TYPES.Disconnected:
        captureDisconnected(printerID, payload);
        break;
      case EVENT_TYPES.Dwelling:
        captureDwelling(printerID, payload);
        break;
      case EVENT_TYPES.Error:
        captureError(printerID, payload);
        break;
      case EVENT_TYPES.FileAdded:
        captureFileAdded(printerID, payload);
        // Trigger resyncs
        break;
      case EVENT_TYPES.FileDeselected:
        captureFileDeselected(printerID, payload);
        break;
      case EVENT_TYPES.FileRemoved:
        captureFileRemoved(printerID, payload);
        // Trigger resyncs
        break;
      case EVENT_TYPES.FirmwareData:
        // Update firmware data rather than resyncing
        captureFirmwareData(printerID, payload);
        break;
      case EVENT_TYPES.FolderAdded:
        captureFolderAdded(printerID, payload);
        // Trigger resyncs
        break;
      case EVENT_TYPES.FolderRemoved:
        captureFolderRemoved(printerID, payload);
        // Trigger resyncs
        break;
      case EVENT_TYPES.Home:
        captureHome(printerID, payload);
        break;
      case EVENT_TYPES.MetadataAnalysisFinished:
        await captureMetadataAnalysisFinished(printerID, payload);
        // Trigger resyncs
        break;
      case EVENT_TYPES.MetadataAnalysisStarted:
        captureMetadataAnalysisStarted(printerID, payload);
        break;
      case EVENT_TYPES.MetadataStatisticsUpdated:
        captureMetadataStatisticsUpdated(printerID, payload);
        break;

      case EVENT_TYPES.PositionUpdate:
        capturePositionUpdate(printerID, payload);
        break;

      case EVENT_TYPES.PrintCancelled:
        capturePrintCancelled(printerID, payload);
        break;

      case EVENT_TYPES.PrintCancelling:
        capturePrintCancelling(printerID, payload);
        break;

      case EVENT_TYPES.PrintDone:
        captureFinishedPrint(printerID, payload, true);
        break;

      case EVENT_TYPES.PrintFailed:
        capturePrintFailed(printerID, payload, false);
        break;

      case EVENT_TYPES.PrintPaused:
        capturePrintPaused(printerID, payload);
        break;

      case EVENT_TYPES.PrintStarted:
        capturePrintStarted(printerID, payload);
        break;

      case EVENT_TYPES.PrinterStateChanged:
        capturePrinterStateChanged(printerID, payload);
        break;

      case EVENT_TYPES.TransferDone:
        captureTransferDone(printerID, payload);
        break;

      case EVENT_TYPES.TransferStarted:
        captureTransferStarted(printerID, payload);
        break;

      case EVENT_TYPES.UpdatedFiles:
        captureUpdatedFiles(printerID, payload);
        // Trigger resyncs
        break;

      case EVENT_TYPES.Upload:
        captureUpload(printerID, payload);
        break;

      case EVENT_TYPES.UserLoggedIn:
        captureUserLoggedIn(printerID, payload);
        break;

      case EVENT_TYPES.UserLoggedOut:
        captureUserLoggedOut(printerID, payload);
        break;

      case EVENT_TYPES.ZChange:
        captureZChange(printerID, payload);
        break;
    }
  }
  static handlePluginData(printerID, message) {
    const OP_EM = OctoprintWebsocketMessageService;
    const { header, data } = OP_EM.parseOctoPrintPluginMessage(message);

    const type = OP_EM.parseOctoPrintPluginType(data);

    switch (header) {
      case OP_WS_PLUGIN_KEYS.softwareupdate:
        captureUpdatingData(printerID, data);
        break;
      case OP_WS_PLUGIN_KEYS.pluginmanager:
        capturePluginManagerData(printerID, type, data);
        break;
      case OP_WS_PLUGIN_KEYS.klipper:
        captureKlipperPluginData(printerID, data);
        break;
      case OP_WS_PLUGIN_KEYS.pi_support:
        captureThrottlePluginData(printerID, data);
        break;
      case OP_WS_PLUGIN_KEYS.resource_monitor:
        captureResourceMonitorData(printerID, data);
        break;
      case OP_WS_PLUGIN_KEYS.display_layer_progress:
        // Silence the other outputs from the plugin
        break;
      case OP_WS_PLUGIN_KEYS.psucontrol:
        // silent psu control, supported an easier way
        break;
      case OP_WS_PLUGIN_KEYS.display_layer_progress_ws_payload:
        // Capture websocket data, it's all we need
        captureDisplayLayerProgress(printerID, data);
        break;
      default:
        if (!loggedMissingPlugins[header]) {
          loggedMissingPlugins[header] = true;
          logger.warning("Unknown plugin detected!", { header, type });
          logger.warning("Unknown data!", data);
          logger.info(
            "This plugin is currently un-supported, please open a discussion if you'd like it supporting in OctoFarm!"
          );
        }
    }
  }
}
module.exports = OctoprintWebsocketMessageService;
