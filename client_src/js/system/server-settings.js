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
import { serverSettingKeys, settingsElements } from "./utils/server.options";
import { serverBootBoxOptions } from "./utils/bootbox.options";
import { generateLogDumpFile } from "./utils/server.actions";

export class ServerSettings {
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
  static updateServerSettings() {
    let reboot = false;

    if (
      oldServerSettings.server.port !== settingsElements.server.port.value ||
      oldServerSettings.server.loginRequired !== settingsElements.server.loginRequired ||
      oldServerSettings.server.registration !== settingsElements.server.registration ||
      oldServerSettings.timeout.webSocketRetry !== settingsElements.timeout.webSocketRetry ||
      oldServerSettings.timeout.apiTimeout !== settingsElements.timeout.apiTimeout ||
      oldServerSettings.timeout.apiRetryCutoff !== settingsElements.timeout.apiRetryCutoff ||
      oldServerSettings.timeout.apiRetry !== settingsElements.timeout.apiRetry ||
      oldServerSettings.influxExport.active !== settingsElements.influxExport.active ||
      oldServerSettings.influxExport.host !== settingsElements.influxExport.host ||
      oldServerSettings.influxExport.port !== settingsElements.influxExport.port ||
      oldServerSettings.influxExport.database !== settingsElements.influxExport.database ||
      oldServerSettings.influxExport.username !== settingsElements.influxExport.username ||
      oldServerSettings.influxExport.password !== settingsElements.influxExport.password ||
      oldServerSettings.influxExport.retentionPolicy.duration !==
        settingsElements.influxExport.retentionPolicy.duration ||
      oldServerSettings.influxExport.retentionPolicy.replication !==
        settingsElements.influxExport.retentionPolicy.replication ||
      oldServerSettings.influxExport.retentionPolicy.defaultRet !==
        settingsElements.influxExport.retentionPolicy.defaultRet
    ) {
      reboot = true;
    }
    OctoFarmClient.post("settings/server/update", {}).then((res) => {
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
}

ServerSettings.init();
Script.get();
