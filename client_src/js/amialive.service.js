import { parse } from "flatted";

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
let source = null;

async function asyncParse(str) {
  try {
    return parse(str);
  } catch (e) {
    return false;
  }
}

export function createNewEventSource() {
  const url = "/amialive";
  source = new EventSource(url);
  source.onmessage = async function (e) {
    if (e.data != null) {
      await asyncParse(e.data);
      const lostServerConnectionModal = document.getElementById("lostServerConnection");
      if (lostServerConnectionModal.className.includes("show")) {
        await closeModal();
      }
    }
  };
  source.onerror = async function () {
    await drawModal();
  };
  source.onclose = async function () {
    await drawModal();
  };
}

createNewEventSource();
