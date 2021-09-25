import OctoFarmClient from "../../services/octofarm-client.service";
import UI from "../../lib/functions/ui";
import Calc from "../../lib/functions/calc";
import {
  setupFilamentManagerDisableBtn,
  setupFilamentManagerReSyncBtn,
  setupFilamentManagerSyncBtn,
  isFilamentManagerPluginSyncEnabled
} from "../../services/filament-manager-plugin.service";
import OctoPrintClient from "../../services/octoprint-client.service";
import FileOperations from "../../lib/functions/file";
import { settingsElements } from "./system.constants";
import { serverBootBoxOptions } from "./utils/bootbox.options";
import { cpuChartOptions, memoryChartOptions } from "./utils/charts.options";

import ApexCharts from "apexcharts";

let systemChartCPU;
let systemChartMemory;

async function setupOPTimelapseSettings() {
  const printers = await OctoFarmClient.listPrinters();
  const alert = UI.createAlert(
    "warning",
    `${UI.returnSpinnerTemplate()} Setting up your OctoPrint settings, please wait...`
  );
  const { successfulPrinters, failedPrinters } = await OctoPrintClient.setupOctoPrintForTimelapses(
    printers
  );
  alert.close();
  bootbox.alert(successfulPrinters + failedPrinters);
}

async function generateLogDumpFile() {
  let logDumpResponse = await OctoFarmClient.generateLogDump();

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
      window.open(`/${OctoFarmClient.serverSettingsRoute}/${logDumpResponse.zipDumpPath}`);
    });
  }
}

async function nukeDatabases(database) {
  let databaseNuke;
  if (!database) {
    databaseNuke = await OctoFarmClient.get("settings/server/delete/database/" + "nukeEverything");
  } else {
    databaseNuke = await OctoFarmClient.get("settings/server/delete/database/" + database);
  }
  UI.createAlert("success", databaseNuke.message, 3000);
}

async function exportDatabases(databaseName) {
  const databaseExport = await OctoFarmClient.getDatabaseList(databaseName);

  if (databaseExport?.databases[0].length !== 0) {
    FileOperations.download(databaseName + ".json", JSON.stringify(databaseExport.databases));
  } else {
    UI.createAlert("warning", "Database is empty, will not export...", 3000, "clicked");
  }
}

async function restartOctoFarmServer() {
  let systemRestartBtn = document.getElementById("restartOctoFarmBtn");
  // Make sure the system button is disabled whilst the restart is happening.
  if (systemRestartBtn) {
    systemRestartBtn.disabled = true;
  }
  let restart = await OctoFarmClient.restartServer();
  if (restart) {
    UI.createAlert(
      "success",
      "System restart command was successful, the server will restart in 5 seconds...",
      5000,
      "clicked"
    );
  } else {
    UI.createAlert(
      "danger",
      "Service restart failed... Please check: <a href='https://docs.octofarm.net/installation/setup-service.html'> OctoFarm Service Setup </a> for more information ",
      5000,
      "clicked"
    );
  }

  setTimeout(() => {
    if (systemRestartBtn) {
      systemRestartBtn.disabled = false;
    }
  }, 5000);
}

async function checkFilamentManagerPluginState() {
  if (await isFilamentManagerPluginSyncEnabled()) {
    setupFilamentManagerReSyncBtn();
    setupFilamentManagerDisableBtn();
  } else {
    setupFilamentManagerSyncBtn();
  }
}

//TODO: Also needs cleaning up more, ie only sending changed values rather than everything. Add to a listener and grabbed changed values.
async function updateServerSettings() {
  //TODO: Reboot flag should come from server endpoint.
  let reboot = true;
  const opts = {
    onlinePolling: {
      seconds: settingsElements.onlinePolling.seconds.value
    },
    server: {
      // Deprecated
      port: settingsElements.server.port.value,
      loginRequired: settingsElements.server.loginRequired.checked,
      registration: settingsElements.server.registration.checked
    },
    timeout: {
      webSocketRetry: settingsElements.timeout.webSocketRetry.value * 1000,
      apiTimeout: settingsElements.timeout.apiTimeout.value * 1000,
      apiRetryCutoff: settingsElements.timeout.apiRetryCutoff.value * 1000,
      apiRetry: settingsElements.timeout.apiRetry.value * 1000
    },
    filament: {
      filamentCheck: settingsElements.filament.filamentCheck.checked
    },
    history: {
      snapshot: {
        onComplete: settingsElements.history.snapshot.onComplete.checked,
        onFailure: settingsElements.history.snapshot.onComplete.checked
      },
      thumbnails: {
        onComplete: settingsElements.history.thumbnails.onComplete.checked,
        onFailure: settingsElements.history.thumbnails.onComplete.checked
      },
      timelapse: {
        onComplete: settingsElements.history.timelapse.onComplete.checked,
        onFailure: settingsElements.history.timelapse.onComplete.checked,
        deleteAfter: settingsElements.history.timelapse.onComplete.checked
      }
    },
    influxExport: {
      active: settingsElements.influxExport.active.checked,
      host: settingsElements.influxExport.host.value,
      port: settingsElements.influxExport.port.value,
      database: settingsElements.influxExport.database.value,
      username: settingsElements.influxExport.username.value,
      password: settingsElements.influxExport.password.value,
      retentionPolicy: {
        duration: settingsElements.influxExport.retentionPolicy.duration.value,
        replication: settingsElements.influxExport.retentionPolicy.replication.value,
        defaultRet: settingsElements.influxExport.retentionPolicy.defaultRet.checked
      }
    }
  };
  OctoFarmClient.post("settings/server/update", opts).then((res) => {
    UI.createAlert(`${res.status}`, `${res.msg}`, 3000, "Clicked");
    if (reboot) {
      bootbox.confirm(serverBootBoxOptions.OF_SERVER_RESTART_REQUIRED);
    }
  });
}

async function updateOctoFarmCommand(doWeForcePull, doWeInstallPackages) {
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

  let updateOctoFarm = await OctoFarmClient.actionOctoFarmUpdates(updateData);

  // Local changes are detected, question whether we overwrite or cancel..
  if (
    updateOctoFarm.message.includes("The update is failing due to local changes been detected.")
  ) {
    bootbox.confirm(
      serverBootBoxOptions.OF_UPDATE_LOCAL_CHANGES(updateOctoFarmBtn, updateOctoFarm.message)
    );
    return;
  }
  // Local changes are detected, question whether we overwrite or cancel..
  if (
    updateOctoFarm.message.includes(
      "You have missing dependencies that are required, Do you want to update these?"
    )
  ) {
    bootbox.confirm();
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
    await restartOctoFarmServer();
  }
}

async function checkForOctoFarmUpdates() {
  let forceCheckForUpdatesBtn = document.getElementById("checkUpdatesForOctoFarmBtn");
  // Make sure check button is disbaled after key press
  if (forceCheckForUpdatesBtn) {
    forceCheckForUpdatesBtn.disabled = true;
  }

  let updateCheck = await OctoFarmClient.checkForOctoFarmUpdates();

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

async function grabOctoFarmLogList() {
  let logList = await OctoFarmClient.getLogsList();
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
      OctoFarmClient.downloadLogFile(logs.name);
    });
  });
}

function renderSystemCharts() {
  systemChartCPU = new ApexCharts(document.querySelector("#systemChartCPU"), cpuChartOptions);
  systemChartCPU.render();
  systemChartMemory = new ApexCharts(
    document.querySelector("#systemChartMemory"),
    memoryChartOptions
  );
  systemChartMemory.render();
}

async function renderSystemInfo() {
  const systemInfo = await OctoFarmClient.getSystemInformation();
  if (systemInfo) {
    const sysUptimeElem = document.getElementById("systemUptime");
    const procUptimeElem = document.getElementById("processUpdate");

    if (systemInfo.sysUptime?.uptime && !!sysUptimeElem) {
      sysUptimeElem.innerHTML = Calc.generateTime(systemInfo.sysUptime.uptime);
    }

    if (systemInfo.processUptime && !!sysUptimeElem) {
      procUptimeElem.innerHTML = Calc.generateTime(systemInfo.processUptime);
    }

    const currentProc = systemInfo?.currentProcess;
    const cpuLoad = systemInfo?.cpuLoad;
    if (!!cpuLoad?.currentLoadSystem && !!cpuLoad?.currentLoadUser) {
      const systemLoad = cpuLoad.currentLoadSystem;
      const userLoad = cpuLoad.currentLoadUser;
      const octoLoad = !!currentProc?.cpuu ? currentProc.cpuu : 0;
      const remain = systemLoad + octoLoad + userLoad;

      // labels: ['System', 'OctoFarm', 'User', 'Free'],
      systemChartCPU.updateSeries([systemLoad, octoLoad, userLoad, 100 - remain]);
    }

    const memoryInfo = systemInfo?.memoryInfo;
    if (!!memoryInfo) {
      const systemUsedRAM = memoryInfo.used;
      const freeRAM = memoryInfo.free;

      if (!!(currentProc?.memRss || currentProc?.mem)) {
        let octoFarmRAM = currentProc?.memRss * 1000;
        if (!currentProc.memRss || Number.isNaN(octoFarmRAM)) {
          octoFarmRAM = (memoryInfo.total / 100) * currentProc?.mem;
        }

        if (Number.isNaN(octoFarmRAM)) {
          // labels: ['System', 'OctoFarm', 'Free'],
          systemChartMemory.updateSeries([systemUsedRAM, 0, freeRAM]);
        } else {
          systemChartMemory.updateSeries([systemUsedRAM, octoFarmRAM, freeRAM]);
        }
      } else {
        systemChartMemory.updateSeries([systemUsedRAM, 0, freeRAM]);
      }
    } else {
      systemChartMemory.updateSeries([0, 0, 0]);
    }
  }
}

export {
  setupOPTimelapseSettings,
  generateLogDumpFile,
  nukeDatabases,
  exportDatabases,
  restartOctoFarmServer,
  checkFilamentManagerPluginState,
  updateServerSettings,
  updateOctoFarmCommand,
  checkForOctoFarmUpdates,
  grabOctoFarmLogList,
  renderSystemCharts,
  renderSystemInfo
};
