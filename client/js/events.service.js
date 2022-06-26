import { asyncParse, debounce } from "./utils/sse.utils";
import { MESSAGE_TYPES } from "../../server/constants/sse.constants";
import { updateLiveFileInformation } from "./pages/file-manager/file-manager-sse.handler";
import currentOperationsPanelService from "./services/current-operations-panel.service";
import {
  triggerCountDownTimer,
  drawModal,
  setServerAlive,
  reconnectFrequency,
} from "./services/amialive.service";
import { ClientErrors } from "./exceptions/octofarm-client.exceptions";
import { ApplicationError } from "./exceptions/application-error.handler";
import {updateCameraImage} from "./services/proxy-camera.service";

let evtSource;

const reconnectFunc = debounce(
  function () {
    setupEventSource();
    // Double every attempt to avoid overwhelming client
    reconnectFrequency.setSeconds = reconnectFrequency.getSeconds * 2;
    // Max out at ~1 minute as a compromise between user experience and server load
    if (reconnectFrequency.getSeconds >= 64) {
      reconnectFrequency.setSeconds = 64;
    }
  },
  function () {
    return reconnectFrequency.getSeconds * 1000;
  }
);

function setupEventSource() {
  evtSource = new EventSource(`/events?page=${encodeURIComponent(window.location.pathname)}`);
  evtSource.onmessage = async function (e) {
    const { type, message, id } = await asyncParse(e.data);
    if (type === MESSAGE_TYPES.AM_I_ALIVE) {
      await setServerAlive(message);
    }

    if (type === MESSAGE_TYPES.FILE_UPDATE) {
      await updateLiveFileInformation(id, message);
    }

    if (type === MESSAGE_TYPES.CURRENT_OPERATIONS){
     const { operations, count } = message;
     await currentOperationsPanelService(operations, count);
    }

    if (type === MESSAGE_TYPES.NEW_CAMERA_IMAGE){
      const { printerID, cameraURL } = message;
      await updateCameraImage(printerID, cameraURL);
    }
  };
  evtSource.onopen = function (e) {
    console.debug("Connected to servers event stream...");
    // Reset reconnect frequency upon successful connection
    reconnectFrequency.setSeconds = 3;
  };
  evtSource.onerror = async function (e) {
    window.serverOffline = true;
    console.debug(
      "Server connection lost! Re-connecting in... " +
        reconnectFrequency.getSeconds +
        "s"
    );
    triggerCountDownTimer(reconnectFrequency.getSeconds);
    console.error(e);
    await drawModal();
    evtSource.close();
    reconnectFunc();
    const errorObject = ClientErrors.SILENT_ERROR;
    errorObject.message = `Events Service - ${e.target.url}: ${e.target.readyState}`;
    throw new ApplicationError(errorObject);
  };
  evtSource.onclose = async function (e) {
    window.serverOffline = true;
    console.debug(
      "Server connection closed! Re-establishing..." +
        reconnectFrequency.getSeconds +
        "s"
    );
    triggerCountDownTimer(reconnectFrequency.getSeconds);
    console.warn(e);
    await drawModal();
    evtSource.close();
    reconnectFunc();
  };
}

setupEventSource();
