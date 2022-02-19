import {asyncParse, debounce} from "./utils/sse.utils";
import {MESSAGE_TYPES} from "../../server/constants/sse.constants"


const reloadWindow = async function () {
  if (location.href.includes("submitEnvironment")) {
    const hostName = window.location.protocol + "//" + window.location.host + "";
    window.location.replace(hostName);
    return false;
  } else {
    window.location.reload();
    return false;
  }
};

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
let reconnectFrequencySeconds = 3;
let evtSource;
let countDownInterval = false;
let triggerTimeout = false;
let countDownSeconds = 0;
let reloadListenerAdded = false;

const reconnectFunc = debounce(
  function () {
    setupEventSource();
    // Double every attempt to avoid overwhelming server

    reconnectFrequencySeconds *= 2;
    // Max out at ~1 minute as a compromise between user experience and server load
    if (reconnectFrequencySeconds >= 64) {
      reconnectFrequencySeconds = 64;
    }
  },
  function () {
    return reconnectFrequencySeconds * 1000;
  }
);

function triggerCountDownTimer(seconds){
  countDownSeconds = seconds;
  if(!countDownInterval){
    countDownInterval = setInterval(() => {
      if(reconnectFrequencySeconds <= 1){
        //reset the counter
        clearInterval(countDownInterval)
        countDownInterval = false;
      }else{
        countDownSeconds = countDownSeconds - 1
        document.getElementById("lostServerConnectionTimer").innerHTML = countDownSeconds;
      }
    },1000)
  }
}

function setupEventSource() {
  evtSource = new EventSource("/events");
  evtSource.onmessage = async function (e) {
    const { type, message } = await asyncParse(e.data);
    if(type === MESSAGE_TYPES.AM_I_ALIVE){
        window.serverOffline = false;
        const lostServerConnectionModal = document.getElementById("lostServerConnection");
        if (lostServerConnectionModal && lostServerConnectionModal.className.includes("show")) {
          // If user has login enabled then we need to refresh the session...
          if(!!message?.loginRequired){
            await reloadWindow();
          }else{
            await closeModal();
          }

        }
    }
  };
  evtSource.onopen = function (e) {
    console.debug("Connected to servers Am I Alive stream...");
    // Reset reconnect frequency upon successful connection
    reconnectFrequencySeconds = 3;
  };
  evtSource.onerror = async function (e) {
    window.serverOffline = true;
    console.debug("Server connection lost! Re-connecting in... " + reconnectFrequencySeconds + "s");
    triggerCountDownTimer(reconnectFrequencySeconds)
    console.error(e);
    await drawModal();
    evtSource.close();
    reconnectFunc();
  };
  evtSource.onclose = async function (e) {
    window.serverOffline = true;
    console.debug("Server connection closed! Re-establishing..." + reconnectFrequencySeconds + "s");
    triggerCountDownTimer(reconnectFrequencySeconds)
    console.warn(e);
    await drawModal();
    evtSource.close();
    reconnectFunc();
  };

}

const drawModal = async function () {
  if(!reloadListenerAdded){
    document.getElementById("forceRefreshPageButton").addEventListener("click", () => {
      reloadWindow();
    })
  }

  if(!triggerTimeout){
    triggerTimeout = setTimeout(() => {
      $("#lostServerConnection").modal("show");
      triggerTimeout = false;
    },2000)
  }
};
const closeModal = async function () {
  $("#lostServerConnection").modal("hide");
};

setupEventSource();
