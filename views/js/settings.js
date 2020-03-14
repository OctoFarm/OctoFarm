import Client from "./lib/octofarm.js";
import UI from "./lib/functions/ui.js";

//Add listeners to settings
// document.getElementById("saveServerSettings").addEventListener("click", e => {
//   //Validate Printer Form, then Add
//   ServerSettings.update();
// });
document.getElementById("saveSettings").addEventListener("click", e => {
  //Validate Printer Form, then Add
  ClientSettings.update();
});

class ClientSettings {
  static init() {
    if (
      !document.getElementById("systemDropDown").classList.contains("notyet")
    ) {
      Client.get("settings/client/get")
        .then(res => {
          return res.json();
        })
        .then(res => {
          localStorage.setItem("clientSettings", JSON.stringify(res));
          if (res.backgroundURL != null) {
            document.getElementById("clientBackground").value =
              res.backgroundURL;
          }
          //document.getElementById("currentTheme").value =  res.currentTheme;
          
          document.getElementById("panelCurrentOpOn").checked =
            res.panelView.currentOp;
          document.getElementById("panelHideOffline").checked =
            res.panelView.hideOff;
          document.getElementById("panelHideClosed").checked =
            res.panelView.hideClosed;

          document.getElementById("cameraCurrentOpOn").checked =
            res.cameraView.currentOp;
          document.getElementById("selectCameraGrid").value =
            res.cameraView.cameraRows;
          document.getElementById("cameraHideClosed").checked =
            res.cameraView.hideClosed;

          document.getElementById("listCurrentOpOn").checked =
            res.listView.currentOp;
          document.getElementById("listHideOffline").checked =
            res.listView.hideOff;
          document.getElementById("listHideClosed").checked =
            res.listView.hideClosed;
        });
    }
  }
  static async update() {
    let opts = {
      settings: {
        backgroundURL: document.getElementById("clientBackground").value
        //currentTheme: document.getElementById("currentTheme").value
      },
      panelView: {
        currentOp: document.getElementById("panelCurrentOpOn").checked,
        hideOff: document.getElementById("panelHideOffline").checked,
        hideClosed: document.getElementById("panelHideClosed").checked
      },
      listView: {
        currentOp: document.getElementById("listCurrentOpOn").checked,
        hideOff: document.getElementById("listHideOffline").checked,
        hideClosed: document.getElementById("listHideClosed").checked
      },
      cameraView: {
        currentOp: document.getElementById("cameraCurrentOpOn").checked,
        cameraRows: document.getElementById("selectCameraGrid").value,
        hideClosed: document.getElementById("cameraHideClosed").checked
      }
    };

    let post = await Client.post("settings/client/update", opts);
    localStorage.setItem("clientSettings", JSON.stringify(opts));
    UI.createAlert("success", "Client settings updated", 3000, "clicked");
    location.reload();
  }
  static get() {
    return JSON.parse(localStorage.getItem("clientSettings"));
  }
}

// class ServerSettings {
//   static init() {
//     if (
//       !document.getElementById("systemDropDown").classList.contains("notyet")
//     ) {
//       Client.get("settings/server/get")
//         .then(res => {
//           return res.json();
//         })
//         .then(res => {
//           document.getElementById("onlinePollRate").value =
//             res.onlinePolling.seconds;
//           document.getElementById("offlinePollRate").value =
//             res.offlinePolling.seconds / 1000 / 60;
//           document.getElementById("offlinePoll").checked =
//             res.offlinePolling.on;
//         });
//     }
//   }
//   static update() {
//     let onlinePoll = document.getElementById("onlinePollRate").value;
//     let offlineOn = document.getElementById("offlinePoll").checked;
//     let offlinePoll =
//       document.getElementById("offlinePollRate").value * 1000 * 60;
//     let onlinePolling = {
//       seconds: onlinePoll
//     };
//     let offlinePolling = {
//       on: offlineOn,
//       seconds: offlinePoll
//     };
//     document.getElementById("overlay").style.display = "block";
//     UI.createAlert(
//       "success",
//       "Settings updated, please wait whilst the server restarts...<br> This may take some time...<br> The page will automatically refresh when complete.... ",
//       10000,
//       "clicked"
//     );
//     Client.post("settings/server/update", { onlinePolling, offlinePolling })
//       .then(res => {
//         return res.json();
//       })
//       .then(res => {
//         location.reload();
//       });
//   }
// }

//Initialise Settings
// ServerSettings.init();
ClientSettings.init();
