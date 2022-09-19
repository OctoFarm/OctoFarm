import { asyncParse, debounce } from '../js/utils/sse.utils';
import { MESSAGE_TYPES } from '../../server/constants/sse.constants';
import { updateLiveFileInformation } from '../js/pages/file-manager/file-manager-sse.handler';
import currentOperationsPanelService from '../js/services/current-operations-panel.service';
import {
  triggerCountDownTimer,
  drawModal,
  setServerAlive,
  reconnectFrequency,
} from '../js/services/amialive.service';
import { ClientErrors } from '../js/exceptions/octofarm-client.exceptions';
import { ApplicationError } from '../js/exceptions/application-error.handler';
import { updateCameraImage } from '../js/services/proxy-camera.service';

// Keeping hold of this, may return a use for later...
// function checkUpdateAndNotify(updateResponse) {
//   if (!!updateResponse?.update_available && !pageReloadPersistedRead) {
//     // Show the notification once per page load
//     pageReloadPersistedRead = true;
//     // Disregard notification if it it's version is already stored
//     let parsedStorageReleaseInfo;
//     try {
//       parsedStorageReleaseInfo = JSON.parse(localStorage.getItem(notificationMarkReadSessionKey));
//     } catch (e) {
//       parsedStorageReleaseInfo = null;
//     }
//     // If the update button is available, we are on the system page. React to available updates accordingly.
//     let updateOctoFarmBtn = document.getElementById("updateOctoFarmBtn");
//     if (updateOctoFarmBtn) {
//       updateOctoFarmBtn.disabled = false;
//     }
//     // Process the full notification or a shorter reminder
//     if (
//       !parsedStorageReleaseInfo ||
//       parsedStorageReleaseInfo?.tag_name !== updateResponse?.latestReleaseKnown?.tag_name
//     ) {
//       if (window.location?.href.includes("/system")) {
//         return;
//       }
//
//       var n = new noty({
//         type: "success",
//         theme: "bootstrap-v4",
//         layout: "bottomRight",
//         text: updateResponse?.message,
//         buttons: [
//           noty.button(
//             "UPDATE",
//             "btn btn-success",
//             function () {
//               window.location = "/system";
//             },
//             { id: "button1", "data-status": "ok" }
//           ),
//           noty.button("Mark read", "btn btn-error", function () {
//             // Update the stored version to become the newest
//             localStorage.setItem(
//               notificationMarkReadSessionKey,
//               JSON.stringify(updateResponse.latestReleaseKnown)
//             );
//             n.close();
//           }),
//           noty.button("Later", "btn btn-error", function () {
//             n.close();
//           })
//         ]
//       });
//       n.show();
//     } else {
//       UI.createAlert(
//         "success",
//         `A small reminder: OctoFarm update available from ${updateResponse.current_version} to ${updateResponse?.latestReleaseKnown?.tag_name} ;)`,
//         1000,
//         "clicked"
//       );
//     }
//   }
// }
// reconnectFrequencySeconds doubles every retry

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
  evtSource = new EventSource('/events');
  evtSource.onmessage = async function (e) {
    const { type, message, id } = await asyncParse(e.data);
    if (type === MESSAGE_TYPES.AM_I_ALIVE) {
      await setServerAlive(message);
    }

    if (type === MESSAGE_TYPES.FILE_UPDATE) {
      await updateLiveFileInformation(id, message);
    }

    if (type === MESSAGE_TYPES.CURRENT_OPERATIONS) {
      const { operations, count } = message;
      await currentOperationsPanelService(operations, count);
    }

    if (type === MESSAGE_TYPES.NEW_CAMERA_IMAGE) {
      const { printerID, cameraURL } = message;
      await updateCameraImage(printerID, cameraURL);
    }
  };
  evtSource.onopen = function (e) {
    console.debug('Connected to servers event stream...');
    // Reset reconnect frequency upon successful connection
    reconnectFrequency.setSeconds = 3;
  };
  evtSource.onerror = async function (e) {
    window.serverOffline = true;
    console.debug(
      'Server connection lost! Re-connecting in... ' + reconnectFrequency.getSeconds + 's'
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
      'Server connection closed! Re-establishing...' + reconnectFrequency.getSeconds + 's'
    );
    triggerCountDownTimer(reconnectFrequency.getSeconds);
    console.warn(e);
    await drawModal();
    evtSource.close();
    reconnectFunc();
  };
}

setupEventSource();
