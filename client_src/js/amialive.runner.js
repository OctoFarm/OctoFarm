import UI from "./lib/functions/ui";
import AxiosClient from "./services/axios.service";

let interval;
let timer = 2500;
const notificationMarkReadSessionKey = "octofarm-updatemsg-read";
let pageReloadPersistedRead = false;

function checkUpdateAndNotify(updateResponse) {
  if (!!updateResponse?.update_available && !pageReloadPersistedRead) {
    // Show the notification once per page load
    pageReloadPersistedRead = true;
    // Disregard notification if it it's version is already stored
    let parsedStorageReleaseInfo;
    try {
      parsedStorageReleaseInfo = JSON.parse(localStorage.getItem(notificationMarkReadSessionKey));
    } catch (e) {
      parsedStorageReleaseInfo = null;
    }
    // If the update button is available, we are on the system page. React to available updates accordingly.
    let updateOctoFarmBtn = document.getElementById("updateOctoFarmBtn");
    if (updateOctoFarmBtn) {
      updateOctoFarmBtn.disabled = false;
    }
    // Process the full notification or a shorter reminder
    if (
      !parsedStorageReleaseInfo ||
      parsedStorageReleaseInfo?.tag_name !== updateResponse?.latestReleaseKnown?.tag_name
    ) {
      if (window.location?.href.includes("/system")) {
        return;
      }

      var n = new noty({
        type: "success",
        theme: "bootstrap-v4",
        layout: "bottomRight",
        text: updateResponse?.message,
        buttons: [
          noty.button(
            "UPDATE",
            "btn btn-success",
            function () {
              window.location = "/system";
            },
            { id: "button1", "data-status": "ok" }
          ),
          noty.button("Mark read", "btn btn-error", function () {
            // Update the stored version to become the newest
            localStorage.setItem(
              notificationMarkReadSessionKey,
              JSON.stringify(updateResponse.latestReleaseKnown)
            );
            n.close();
          }),
          noty.button("Later", "btn btn-error", function () {
            n.close();
          })
        ]
      });
      n.show();
    } else {
      UI.createAlert(
        "success",
        `A small reminder: OctoFarm update available from ${updateResponse.current_version} to ${updateResponse?.latestReleaseKnown?.tag_name} ;)`,
        1000,
        "clicked"
      );
    }
  }
}

const amialiveService = async function () {
  console.log("starting am I alive service check...");
  if (!interval) {
    interval = setInterval(async () => {
      let serviceState = await AxiosClient.serverAliveCheck();
      if (serviceState) {
        if (serviceState?.update && !serviceState.isDockerContainer) {
          try {
            checkUpdateAndNotify(serviceState.update);
          } catch (e) {
            console.warn("Could not successfully parse OctoFarm update notification");
          }
        }
      }
    }, timer);
  }
};
amialiveService().then();
