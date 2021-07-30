import OctoFarmClient from "../services/octofarm-client.service";
import UI from "../lib/functions/ui";
import FileOperations from "../lib/functions/file";
import {
  isFilamentManagerPluginSyncEnabled,
  setupFilamentManagerDisableBtn,
  setupFilamentManagerReSyncBtn,
  setupFilamentManagerSyncBtn
} from "../services/filament-manager-plugin.service";
import Calc from "../lib/functions/calc";
import Script from "../services/gocde-scripts.service";
import { serverSettingKeys } from "./utils/server-database.options";

function setupDatabaseActionBtns() {
  for (const key in serverSettingKeys) {
    if (serverSettingKeys.hasOwnProperty(key)) {
      document.getElementById(`nuke${serverSettingKeys[key]}`).addEventListener("click", (e) => {
        ServerSettings.nukeDatabases(`${serverSettingKeys[key]}DB`, e);
      });
      if (key !== "ALL") {
        document
          .getElementById(`export${serverSettingKeys[key]}`)
          .addEventListener("click", (e) => {
            ServerSettings.exportDatabases(`${serverSettingKeys[key]}DB`, e);
          });
      }
    }
  }
}

document.getElementById("saveServerSettings").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ServerSettings.update();
});
document.getElementById("restartOctoFarmBtn").addEventListener("click", (e) => {
  ServerSettings.serviceRestart();
});
document.getElementById("updateOctoFarmBtn").addEventListener("click", (e) => {
  ServerSettings.updateOctoFarmCommand(false);
});
document.getElementById("checkUpdatesForOctoFarmBtn").addEventListener("click", (e) => {
  ServerSettings.checkForOctoFarmUpdates();
});

class ServerSettings {
  static async nukeDatabases(database) {
    let databaseNuke;
    if (!database) {
      databaseNuke = await OctoFarmClient.get("settings/server/delete/database");
    } else {
      databaseNuke = await OctoFarmClient.get("settings/server/delete/database/" + database);
    }
    UI.createAlert("success", databaseNuke.message, 3000);
  }

  static async exportDatabases(database, event) {
    UI.addLoaderToElementsInnerHTML(event.target);
    const databaseExport = await OctoFarmClient.get("settings/server/get/database/" + database);

    if (databaseExport?.databases[0].length !== 0) {
      FileOperations.download(database + ".json", JSON.stringify(databaseExport.databases));
    } else {
      UI.createAlert("warning", "Database is empty, will not export...", 3000, "clicked");
    }
    UI.removeLoaderFromElementInnerHTML(event.target);
  }

  static async init() {
    if (await isFilamentManagerPluginSyncEnabled()) {
      setupFilamentManagerReSyncBtn();
      setupFilamentManagerDisableBtn();
    } else {
      setupFilamentManagerSyncBtn();
    }

    await ServerSettings.enableOctoFarmLogsList();
  }
  static async enableOctoFarmLogsList() {
    let logList = await OctoFarmClient.get("settings/server/logs");
    const logTable = document.getElementById("serverLogs");
    logList.forEach((logs) => {
      logTable.insertAdjacentHTML(
        "beforeend",
        `
            <tr>
                <td>${logs.name}</td>
                <td>${new Date(logs.modified).toString().substring(0, 21)}</td>
                <td>${Calc.bytes(logs.size)}</td>
                <td><button id="${
                  logs.name
                }" type="button" class="btn btn-sm btn-primary"><i class="fas fa-download"></i></button></td>
            </tr>
        `
      );
      document.getElementById(logs.name).addEventListener("click", async (event) => {
        window.open(`/settings/server/logs/${logs.name}`);
      });
    });
  }

  static async serviceRestart() {
    let systemRestartBtn = document.getElementById("restartOctoFarmBtn");
    // Make sure the system button is disabled whilst the restart is happening.
    if (systemRestartBtn) {
      systemRestartBtn.disabled = true;
    }
    await OctoFarmClient.post("settings/server/restart");
    UI.createAlert(
      "success",
      "System restart command was successful, the server will restart in 5 seconds...",
      5000,
      "clicked"
    );
    setTimeout(() => {
      if (systemRestartBtn) {
        systemRestartBtn.disabled = false;
      }
    }, 5000);
  }

  static async updateOctoFarmCommand(doWeForcePull, doWeInstallPackages) {
    let updateOctoFarmBtn = document.getElementById("updateOctoFarmBtn");
    // Make sure the update OctoFarm button is disabled after keypress
    if (updateOctoFarmBtn) {
      updateOctoFarmBtn.disabled = true;
      UI.addLoaderToElementsInnerHTML(updateOctoFarmBtn);
    }
    let updateData = {
      forcePull: false,
      doWeInstallPackages: false
    };
    if (doWeForcePull) {
      updateData.forcePull = true;
    }
    if (doWeInstallPackages) {
      updateData.doWeInstallPackages = true;
    }

    let updateOctoFarm = await OctoFarmClient.post("settings/server/update/octofarm", updateData);

    // Local changes are detected, question whether we overwrite or cancel..
    if (
      updateOctoFarm.message.includes("The update is failing due to local changes been detected.")
    ) {
      bootbox.confirm({
        title: '<span class="text-warning">Local file changes detected!</span>',
        message: updateOctoFarm?.message,
        buttons: {
          cancel: {
            className: "btn-danger",
            label: '<i class="fa fa-times"></i> Cancel'
          },
          confirm: {
            className: "btn-success",
            label: '<i class="fa fa-check"></i> Override'
          }
        },
        callback: function (result) {
          if (result) {
            ServerSettings.updateOctoFarmCommand(true);
          } else {
            if (updateOctoFarmBtn) {
              updateOctoFarmBtn.innerHTML = '<i class="fas fa-thumbs-up"></i> Update OctoFarm';
              updateOctoFarmBtn.disabled = false;
            }
          }
        }
      });
      return;
    }
    // Local changes are detected, question whether we overwrite or cancel..
    if (
      updateOctoFarm.message.includes(
        "You have missing dependencies that are required, Do you want to update these?"
      )
    ) {
      bootbox.confirm({
        title: '<span class="text-warning">Missing dependencies detected!</span>',
        message: updateOctoFarm?.message,
        buttons: {
          cancel: {
            className: "btn-danger",
            label: '<i class="fa fa-times"></i> Cancel'
          },
          confirm: {
            className: "btn-success",
            label: '<i class="fa fa-check"></i> Confirm'
          }
        },
        callback: function (result) {
          if (result) {
            ServerSettings.updateOctoFarmCommand(false, true);
          } else {
            if (updateOctoFarmBtn) {
              updateOctoFarmBtn.innerHTML = '<i class="fas fa-thumbs-up"></i> Update OctoFarm';
              updateOctoFarmBtn.disabled = false;
            }
          }
        }
      });
      return;
    }

    UI.createAlert(
      `${updateOctoFarm?.statusTypeForUser}`,
      `${updateOctoFarm?.message}`,
      0,
      "clicked"
    );
    UI.removeLoaderFromElementInnerHTML(updateOctoFarmBtn);

    if (updateOctoFarm?.haveWeSuccessfullyUpdatedOctoFarm) {
      UI.createAlert(
        "success",
        "We have successfully updated... OctoFarm will restart now.",
        0,
        "Clicked"
      );
      this.serviceRestart();
    }
  }
  static async checkForOctoFarmUpdates() {
    let forceCheckForUpdatesBtn = document.getElementById("checkUpdatesForOctoFarmBtn");
    // Make sure check button is disbaled after key press
    if (forceCheckForUpdatesBtn) {
      forceCheckForUpdatesBtn.disabled = true;
    }

    let updateCheck = await OctoFarmClient.get("settings/server/update/octofarm");

    if (updateCheck?.air_gapped) {
      UI.createAlert(
        "error",
        "Your farm has no internet connection, this function requires an active connection to check for releases...",
        5000,
        "Clicked"
      );
      return;
    }
    if (updateCheck?.update_available) {
      UI.createAlert(
        "success",
        "We found a new update, please use the update button to action!",
        5000,
        "Clicked"
      );
    } else {
      UI.createAlert("warning", "Sorry there are no new updates available!", 5000, "Clicked");
    }

    setTimeout(() => {
      if (forceCheckForUpdatesBtn) {
        forceCheckForUpdatesBtn.disabled = false;
      }
    }, 5000);
  }
  static update() {
    let reboot = false;
    const onlinePoll = document.getElementById("webSocketThrottle").value;
    const onlinePolling = {
      seconds: onlinePoll
    };
    const server = {
      port: parseInt(document.getElementById("serverPortNo").value),
      loginRequired: document.getElementById("requireLogin").checked,
      registration: document.getElementById("requireRegistration").checked
    };
    const timeout = {
      webSocketRetry: document.getElementById("webSocketRetry").value * 1000,
      apiTimeout: document.getElementById("APITimeout").value * 1000,
      apiRetryCutoff: document.getElementById("APIRetryTimeout").value * 1000,
      apiRetry: document.getElementById("APIRetry").value * 1000
    };
    const filament = {
      filamentCheck: document.getElementById("checkFilament").checked
    };
    const history = {
      snapshot: {
        onComplete: document.getElementById("snapOnComplete").checked,
        onFailure: document.getElementById("snapOnFailure").checked
      },
      thumbnails: {
        onComplete: document.getElementById("thumbOnComplete").checked,
        onFailure: document.getElementById("thumbOnFailure").checked
      },
      timelapse: {
        onComplete: document.getElementById("timelapseOnComplete").checked,
        onFailure: document.getElementById("timelapseOnFailure").checked,
        deleteAfter: document.getElementById("timelapseDelete").checked
      }
    };
    const influxExport = {
      active: document.getElementById("infActivateInfluxExport").checked,
      host: document.getElementById("infHostIP").value,
      port: document.getElementById("infHostPort").value,
      database: document.getElementById("infDatabase").value,
      username: document.getElementById("infUsername").value,
      password: document.getElementById("infPassword").value,
      retentionPolicy: {
        duration: document.getElementById("infDuration").value,
        replication: document.getElementById("infReplication").value,
        defaultRet: document.getElementById("infRetention").checked
      }
    };
    if (
      oldServerSettings.server.port !== server.port ||
      oldServerSettings.server.loginRequired !== server.loginRequired ||
      oldServerSettings.server.registration !== server.registration ||
      oldServerSettings.timeout.webSocketRetry !== timeout.webSocketRetry ||
      oldServerSettings.timeout.apiTimeout !== timeout.apiTimeout ||
      oldServerSettings.timeout.apiRetryCutoff !== timeout.apiRetryCutoff ||
      oldServerSettings.timeout.apiRetry !== timeout.apiRetry ||
      oldServerSettings.influxExport.active !== influxExport.active ||
      oldServerSettings.influxExport.host !== influxExport.host ||
      oldServerSettings.influxExport.port !== influxExport.port ||
      oldServerSettings.influxExport.database !== influxExport.database ||
      oldServerSettings.influxExport.username !== influxExport.username ||
      oldServerSettings.influxExport.password !== influxExport.password ||
      oldServerSettings.influxExport.retentionPolicy.duration !==
        influxExport.retentionPolicy.duration ||
      oldServerSettings.influxExport.retentionPolicy.replication !==
        influxExport.retentionPolicy.replication ||
      oldServerSettings.influxExport.retentionPolicy.defaultRet !==
        influxExport.retentionPolicy.defaultRet
    ) {
      reboot = true;
    }
    OctoFarmClient.post("settings/server/update", {
      onlinePolling,
      server,
      timeout,
      filament,
      history,
      influxExport
    }).then((res) => {
      UI.createAlert(`${res.status}`, `${res.msg}`, 3000, "Clicked");
      if (reboot) {
        bootbox.confirm({
          message: "Your settings changes require a restart, would you like to do this now?",
          buttons: {
            cancel: {
              label: '<i class="fa fa-times"></i> Cancel'
            },
            confirm: {
              label: '<i class="fa fa-check"></i> Confirm'
            }
          },
          callback(result) {
            if (result) {
              ServerSettings.serviceRestart();
            }
          }
        });
      }
    });
  }
  static async generateLogFileDump() {
    const spinner = document.getElementById("logDumpSpinner");
    if (spinner) {
      spinner.classList.remove("d-none");
    }
    let logDumpResponse = await OctoFarmClient.post("settings/server/logs/generateLogDump", {});
    // Safely assume the spinner is done with here after response from server...
    if (spinner) {
      spinner.classList.add("d-none");
    }
    if (!logDumpResponse?.status || !logDumpResponse?.msg || !logDumpResponse?.zipDumpPath) {
      UI.createAlert(
        "error",
        "There was an issue with the servers response, please check your logs",
        0,
        "clicked"
      );
      return;
    }

    UI.createAlert(logDumpResponse.status, logDumpResponse.msg, 5000, "clicked");

    // Error detected so no need to create button.
    if (logDumpResponse.status === "error") {
      return;
    }

    const logDumpDownloadBtn = document.getElementById("logDumpDownloadBtn");

    if (logDumpDownloadBtn) {
      logDumpDownloadBtn.classList.remove("d-none");
      logDumpDownloadBtn.addEventListener("click", (e) => {
        setTimeout(() => {
          logDumpDownloadBtn.classList.add("d-none");
        }, 5000);
        window.open(`/settings/server/${logDumpResponse.zipDumpPath}`);
      });
    }
  }
}

ServerSettings.init();
Script.get();

export { setupDatabaseActionBtns };
