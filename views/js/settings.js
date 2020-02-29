import Client from "./lib/octofarm.js";
import UI from "./lib/functions/ui.js";

//Add listeners to settings
document.getElementById("saveServerSettings").addEventListener("click", e => {
  //Validate Printer Form, then Add
  ServerSettings.update();
});

class ServerSettings {
  static init() {
    if (
      !document.getElementById("systemDropDown").classList.contains("notyet")
    ) {
      Client.get("settings/server/get")
        .then(res => {
          return res.json();
        })
        .then(res => {
          document.getElementById("onlinePollRate").value =
            res.onlinePolling.seconds;
          document.getElementById("offlinePollRate").value =
            res.offlinePolling.seconds / 1000 / 60;
          document.getElementById("offlinePoll").checked =
            res.offlinePolling.on;
        });
    }
  }
  static update() {
    let onlinePoll = document.getElementById("onlinePollRate").value;
    let offlineOn = document.getElementById("offlinePoll").checked;
    let offlinePoll =
      document.getElementById("offlinePollRate").value * 1000 * 60;
    let onlinePolling = {
      seconds: onlinePoll
    };
    let offlinePolling = {
      on: offlineOn,
      seconds: offlinePoll
    };
    document.getElementById("overlay").style.display = "block";
    UI.createAlert(
      "success",
      "Settings updated, please wait whilst the server restarts...<br> This may take some time...<br> The page will automatically refresh when complete.... ",
      10000,
      "clicked"
    );
    Client.post("settings/server/update", { onlinePolling, offlinePolling })
      .then(res => {
        return res.json();
      })
      .then(res => {
        location.reload();
      });
  }
}

//Initialise Settings
ServerSettings.init();
