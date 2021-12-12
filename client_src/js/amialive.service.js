import { asyncParse, debounce } from "./utils/sse.utils";

const drawModal = async function () {
  $("#lostServerConnection").modal("show");
};
const closeModal = async function () {
  $("#lostServerConnection").modal("hide");
};
//
// const reloadWindow = async function () {
//   if (location.href.includes("submitEnvironment")) {
//     const hostName = window.location.protocol + "//" + window.location.host + "";
//     window.location.replace(hostName);
//     return false;
//   } else {
//     window.location.reload();
//     return false;
//   }
// };

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
let reconnectFrequencySeconds = 1;
let evtSource;

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

function setupEventSource() {
  evtSource = new EventSource("/amialive");
  evtSource.onmessage = async function (e) {
    if (e.data != null) {
      await asyncParse(e.data);
      const lostServerConnectionModal = document.getElementById("lostServerConnection");
      if (lostServerConnectionModal && lostServerConnectionModal.className.includes("show")) {
        await closeModal();
      }
    }
  };
  evtSource.onopen = function (e) {
    console.debug("Connected to servers Am I Alive stream...");
    // Reset reconnect frequency upon successful connection
    reconnectFrequencySeconds = 1;
  };
  evtSource.onerror = async function (e) {
    console.debug("Server connection lost! Re-connecting in... " + reconnectFrequencySeconds + "s");
    await drawModal();
    evtSource.close();
    reconnectFunc();
  };
  evtSource.onclose = async function () {
    console.debug("Server connection closed! Re-establishing..." + reconnectFrequencySeconds + "s");
    await drawModal();
    evtSource.close();
    reconnectFunc();
  };
}
setupEventSource();
