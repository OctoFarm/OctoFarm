import OctoFarmClient from "./services/octofarm-client.service";
import UI from "./lib/functions/ui";
import { TIMERS } from "./constants/timer.constants";

let pageReloadPersistedRead = false;
let interval;
const notificationMarkReadSessionKey = "octofarm-updatemsg-read";
const updateCheckerStartMessage = `Starting octofarm update service checking... ${
  TIMERS.UPDATECHECK / 60000
}mins`;

(async function () {
  console.log(updateCheckerStartMessage);
  const updateCheck = await OctoFarmClient.updateNotificationCheck();
  checkUpdateAndNotify(updateCheck);
  if (!interval) {
    interval = setInterval(async () => {
      const updateCheck = await OctoFarmClient.updateNotificationCheck();
      checkUpdateAndNotify(updateCheck);
    }, TIMERS.UPDATECHECK);
  }
})();

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

      let n = new noty({
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
        3000,
        "clicked"
      );
    }
  }
}
