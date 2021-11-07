import OctoFarmClient from "../services/octofarm-client.service";
import UI from "../lib/functions/ui";
import Calc from "../lib/functions/calc";
import FileOperations from "../lib/functions/file";
import { setupOctoPrintForTimelapses } from "../octoprint/octoprint-settings.actions";
import {
  isFilamentManagerPluginSyncEnabled,
  setupFilamentManagerDisableBtn,
  setupFilamentManagerReSyncBtn,
  setupFilamentManagerSyncBtn
} from "../services/filament-manager-plugin.service";
import { returnSaveBtn, settingsElements, userActionElements } from "./server.options";
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
  const { successfulPrinters, failedPrinters } = await setupOctoPrintForTimelapses(printers);
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
      window.open(
        `${OctoFarmClient.logsRoute.replace("/logs", "")}/${logDumpResponse.zipDumpPath}`
      );
    });
  }
}

async function nukeDatabases(database) {
  let databaseNuke;
  if (!database) {
    databaseNuke = await OctoFarmClient.get("settings/server/delete/database");
  } else {
    databaseNuke = await OctoFarmClient.get("settings/server/delete/database/" + database);
  }
  UI.createAlert("success", databaseNuke.message, 3000);
}

async function exportDatabases(database) {
  const databaseExport = await OctoFarmClient.get("settings/server/get/database/" + database);

  if (databaseExport?.databases[0].length !== 0) {
    FileOperations.download(database + ".json", JSON.stringify(databaseExport.databases));
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
      // Deprecated Port
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
    },
    monitoringViews: {
      panel: settingsElements.monitoringViews.panel.checked,
      list: settingsElements.monitoringViews.list.checked,
      camera: settingsElements.monitoringViews.camera.checked,
      group: settingsElements.monitoringViews.group.checked,
      currentOperations: settingsElements.monitoringViews.currentOperations.checked,
      combined: settingsElements.monitoringViews.combined.checked
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

  let updateOctoFarm = await OctoFarmClient.post("settings/server/update/octofarm", updateData);

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

async function grabOctoFarmLogList() {
  let logList = await OctoFarmClient.get(OctoFarmClient.logsRoute);
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
      window.open(`${OctoFarmClient.logsRoute}/${logs.name}`);
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

//TODO: Move over to SSE
function startUpdatePageRunner() {
  setInterval(async function updateStatus() {
    const systemInfo = await OctoFarmClient.get("system/info");
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
  }, 5000);
}

async function createNewUser() {
  userActionElements.userCreateMessage.innerHTML = "";
  const newUser = {
    name: userActionElements.createName.value,
    username: userActionElements.createUserName.value,
    group: userActionElements.createGroup.value,
    password: userActionElements.createPassword.value,
    password2: userActionElements.createPassword2.value
  };
  const createNewUser = await OctoFarmClient.createNewUser(newUser);

  if (createNewUser.errors.length > 0) {
    createNewUser.errors.forEach((error) => {
      userActionElements.userCreateMessage.insertAdjacentHTML(
        "beforeend",
        `
        <div class="alert alert-warning text-dark" role="alert">
          <i class="fas fa-exclamation-triangle"></i> ${error.msg}
        </div>
        `
      );
    });
  } else {
    const createdUser = createNewUser.createdNewUser;
    userActionElements.userTableContent.insertAdjacentHTML(
      "beforeend",
      ` 
                <tr id="userRow-${createdUser._id}">
                        <th scope="row">${createdUser.name}</th>
                        <td>${createdUser.username}</td>
                        <td>${createdUser.group}</td>
                        <td>${new Date(createdUser.date).toLocaleDateString()}</td>
                        <td>
                            <button id="resetPasswordBtn-${
                              createdUser._id
                            }" type="button" class="btn btn-warning text-dark btn-sm" data-toggle="modal" data-target="#usersResetPasswordModal"><i class="fas fa-user-shield"></i> Reset Password</button>
                            <button id="editUserBtn-${
                              createdUser._id
                            }" type="button" class="btn btn-info btn-sm" data-toggle="modal" data-target="#userEditModal"><i class="fas fa-user-edit"></i> Edit</button>
                            <button id="deleteUserBtn-${
                              createdUser._id
                            }" type="button" class="btn btn-danger btn-sm"><i class="fas fa-user-minus"></i> Delete</button>
                        </td>
                    </tr>           
            `
    );
    userActionElements.createName.value = "";
    userActionElements.createUserName.value = "";
    userActionElements.createGroup.value = "User";
    userActionElements.createPassword.value = "";
    userActionElements.createPassword2.value = "";
    $("#userCreateModal").modal("hide");
    document.getElementById(`deleteUserBtn-${createdUser._id}`).addEventListener("click", (e) => {
      deleteUser(createdUser._id);
    });
    document
      .getElementById(`resetPasswordBtn-${createdUser._id}`)
      .addEventListener("click", (e) => {
        userActionElements.resetPasswordFooter.innerHTML = `
        ${returnSaveBtn()}
        `;
        const userActionSave = document.getElementById("userActionSave");
        userActionSave.addEventListener("click", async () => {
          await resetUserPassword(createdUser._id);
        });
      });
    document
      .getElementById(`editUserBtn-${createdUser._id}`)
      .addEventListener("click", async (e) => {
        userActionElements.editUserFooter.innerHTML = `
        ${returnSaveBtn()}
        `;
        await fillInEditInformation(createdUser._id);
        const userActionSave = document.getElementById("userActionSave");
        userActionSave.addEventListener("click", async () => {
          await editUser(createdUser._id);
        });
      });
    UI.createAlert("success", "Successfully created your user!", 3000, "clicked");
  }
}

async function fillInEditInformation(id) {
  let editInformation = await OctoFarmClient.getUser(id);
  userActionElements.editName.value = editInformation.name;
  userActionElements.editUserName.value = editInformation.username;
  userActionElements.editGroup.value = editInformation.group;
}

async function editUser(id) {
  userActionElements.userEditMessage.innerHTML = "";
  const newUserInfo = {
    name: userActionElements.editName.value,
    username: userActionElements.editUserName.value,
    group: userActionElements.editGroup.value
  };
  const editedUser = await OctoFarmClient.editUser(id, newUserInfo);
  if (editedUser.errors.length > 0) {
    editedUser.errors.forEach((error) => {
      userActionElements.userCreateMessage.insertAdjacentHTML(
        "beforeend",
        `
        <div class="alert alert-warning text-dark" role="alert">
          <i class="fas fa-exclamation-triangle"></i> ${error.msg}
        </div>
        `
      );
    });
  } else {
    UI.createAlert("success", "Successfully updated your user!", 3000, "clicked");
    userActionElements.editName.value = "";
    userActionElements.editUserName.value = "";
    userActionElements.editGroup.value = "User";
    $("#userEditModal").modal("hide");
  }
}

function deleteUser(id) {
  bootbox.confirm({
    message: "This action is unrecoverable, are you sure?",
    buttons: {
      confirm: {
        label: "Yes",
        className: "btn-success"
      },
      cancel: {
        label: "No",
        className: "btn-danger"
      }
    },
    callback: async function (result) {
      if (result) {
        const deletedUser = await OctoFarmClient.deleteUser(id);
        document.getElementById(`userRow-${deletedUser._id}`).remove();
        UI.createAlert("success", "Successfully deleted your user!", 3000, "clicked");
      }
    }
  });
}

async function resetUserPassword(id) {
  userActionElements.userResetMessage.innerHTML = "";
  const newPassword = {
    password: userActionElements.resetPassword.value,
    password2: userActionElements.resetPassword2.value
  };
  let resetPassword = await OctoFarmClient.resetUserPassword(id, newPassword);
  if (resetPassword.errors.length > 0) {
    resetPassword.errors.forEach((error) => {
      userActionElements.userResetMessage.insertAdjacentHTML(
        "beforeend",
        `
        <div class="alert alert-warning text-dark" role="alert">
          <i class="fas fa-exclamation-triangle"></i> ${error.msg}
        </div>
        `
      );
    });
  } else {
    UI.createAlert("success", "Successfully reset your users password!", 3000, "clicked");
    userActionElements.resetPassword.value = "";
    userActionElements.resetPassword2.value = "";
    $("#usersResetPasswordModal").modal("hide");
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
  startUpdatePageRunner,
  createNewUser,
  editUser,
  deleteUser,
  resetUserPassword,
  fillInEditInformation
};
