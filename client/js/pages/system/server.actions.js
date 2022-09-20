import OctoFarmClient from '../../services/octofarm-client.service';
import UI from '../../utils/ui';
import Calc from '../../utils/calc';
import FileOperations from '../../utils/file';
import { setupOctoPrintForTimelapses } from '../../services/octoprint/octoprint-settings.actions';
import {
  returnSaveBtn,
  serverActionsElements,
  settingsElements,
  userActionElements,
} from './server.options';
import { serverBootBoxOptions } from './utils/bootbox.options';
import ApexCharts from 'apexcharts';
import { activeUserListRowTemplate } from './system.templates';
import { ClientErrors } from '../../exceptions/octofarm-client.exceptions';
import { ApplicationError } from '../../exceptions/application-error.handler';

let historicUsageGraph;
let cpuUsageDonut;
let memoryUsageDonut;

const LOADING_DATA = 'Loading Data...';

const options = {
  series: [],
  chart: {
    id: 'realtime',
    height: 300,
    type: 'line',
    background: '#303030',
    animations: {
      enabled: true,
      easing: 'linear',
      dynamicAnimation: {
        speed: 1000,
      },
    },
    toolbar: {
      show: false,
    },
    zoom: {
      enabled: false,
    },
  },
  dataLabels: {
    enabled: false,
  },
  theme: {
    mode: 'dark',
  },
  noData: {
    text: LOADING_DATA,
  },
  stroke: {
    curve: 'smooth',
  },
  title: {
    text: 'System CPU and Memory Usage History',
    align: 'center',
  },
  markers: {
    size: 0,
  },
  xaxis: {
    type: 'datetime',
  },
  yaxis: {
    max: 100,
  },
  legend: {
    show: true,
    showForSingleSeries: false,
    showForNullSeries: true,
    showForZeroSeries: true,
    position: 'bottom',
    horizontalAlign: 'center',
    floating: false,
    fontSize: '14px',
    fontFamily: 'Helvetica, Arial',
    fontWeight: 400,
    formatter: undefined,
    inverseOrder: false,
    width: undefined,
    height: undefined,
    tooltipHoverFormatter: undefined,
    customLegendItems: [],
    offsetX: 0,
    offsetY: 0,
    labels: {
      colors: undefined,
      useSeriesColors: false,
    },
    markers: {
      width: 12,
      height: 12,
      strokeWidth: 0,
      strokeColor: '#fff',
      fillColors: undefined,
      radius: 12,
      customHTML: undefined,
      onClick: undefined,
      offsetX: 0,
      offsetY: 0,
    },
    itemMargin: {
      horizontal: 5,
      vertical: 0,
    },
    onItemClick: {
      toggleDataSeries: true,
    },
    onItemHover: {
      highlightDataSeries: true,
    },
  },
};
const cpuOptions = {
  chart: {
    height: 350,
    type: 'radialBar',
    background: '#303030',
    animations: {
      enabled: true,
      easing: 'linear',
      dynamicAnimation: {
        speed: 1000,
      },
    },
  },
  title: {
    text: 'Current System CPU Usage (%)',
    align: 'center',
  },
  theme: {
    mode: 'dark',
  },
  noData: {
    text: LOADING_DATA,
  },
  series: [],
  labels: ['CPU (%)'],
};
const memoryOptions = {
  chart: {
    height: 350,
    type: 'radialBar',
    background: '#303030',
    animations: {
      enabled: true,
      easing: 'linear',
      dynamicAnimation: {
        speed: 1000,
      },
    },
  },
  title: {
    text: 'Current System Memory Usage (%)',
    align: 'center',
  },
  theme: {
    mode: 'dark',
  },
  noData: {
    text: LOADING_DATA,
  },
  series: [],
  labels: ['Memory (%)'],
};

async function setupOPTimelapseSettings(timelapseSettings) {
  const printers = await OctoFarmClient.listPrinters();
  const alert = UI.createAlert(
    'warning',
    `${UI.returnSpinnerTemplate()} Setting up your OctoPrint settings, please wait...`
  );
  const { successfulPrinters, failedPrinters } = await setupOctoPrintForTimelapses(
    printers,
    timelapseSettings
  );
  alert.close();
  bootbox.alert(successfulPrinters + failedPrinters);
}

async function generateLogDumpFile() {
  const logDumpResponse = await OctoFarmClient.generateLogDump();

  if (!logDumpResponse?.status || !logDumpResponse?.msg || !logDumpResponse?.zipDumpPath) {
    UI.createAlert(
      'error',
      'There was an issue with the servers response, please check your logs',
      0,
      'clicked'
    );
    return;
  }

  UI.createAlert(logDumpResponse.status, logDumpResponse.msg, 5000, 'clicked');

  // Error detected so no need to create button.
  if (logDumpResponse.status === 'error') {
    return;
  }

  const logDumpDownloadBtn = document.getElementById('logDumpDownloadBtn');

  if (logDumpDownloadBtn) {
    logDumpDownloadBtn.classList.remove('d-none');
    logDumpDownloadBtn.addEventListener('click', () => {
      setTimeout(() => {
        logDumpDownloadBtn.classList.add('d-none');
      }, 5000);
      window.open(`${OctoFarmClient.logsRoute}/${logDumpResponse.zipDumpPath}`);
    });
  }
}

async function nukeDatabases(database) {
  let databaseNuke;
  if (!database) {
    databaseNuke = await OctoFarmClient.get('settings/server/delete/database');
  } else {
    databaseNuke = await OctoFarmClient.get('settings/server/delete/database/' + database);
  }
  UI.createAlert('success', databaseNuke.message, 3000);
}

async function exportDatabases(database) {
  const databaseExport = await OctoFarmClient.get('settings/server/get/database/' + database);

  if (databaseExport?.databases[0].length !== 0) {
    FileOperations.download(database + '.json', JSON.stringify(databaseExport.databases));
  } else {
    UI.createAlert('warning', 'Database is empty, will not export...', 3000, 'clicked');
  }
}

async function restartOctoFarmServer() {
  const systemRestartBtn = document.getElementById('restartOctoFarmBtn');
  // Make sure the system button is disabled whilst the restart is happening.
  if (systemRestartBtn) {
    systemRestartBtn.disabled = true;
  }
  const restart = await OctoFarmClient.restartServer();
  if (restart) {
    UI.createAlert(
      'success',
      'System restart command was successful, the server will restart in 5 seconds...',
      5000,
      'clicked'
    );
  } else {
    UI.createAlert(
      'error',
      'Service restart failed... ' +
        'Please check: ' +
        "<a type=”noopener” href='https://docs.octofarm.net/installation/setup-service.html'> " +
        'OctoFarm Service Setup </a> for more information ',
      5000,
      'clicked'
    );
  }

  setTimeout(() => {
    if (systemRestartBtn) {
      systemRestartBtn.disabled = false;
    }
  }, 5000);
}

async function updateServerSettings() {
  const opts = {
    server: {
      loginRequired: settingsElements.server.loginRequired.checked,
      registration: settingsElements.server.registration.checked,
    },
    timeout: {
      webSocketRetry: settingsElements.timeout.webSocketRetry.value * 1000,
      apiRetry: settingsElements.timeout.apiRetry.value * 1000,
    },
    filament: {
      filamentCheck: settingsElements.filament.filamentCheck.checked,
      hideEmpty: settingsElements.filament.hideEmpty.checked,
      downDateFailed: settingsElements.filament.downDateFailed.checked,
      downDateSuccess: settingsElements.filament.downDateSuccess.checked,
      allowMultiSelect: settingsElements.filament.allowMultiSelect.checked,
    },
    history: {
      snapshot: {
        onComplete: settingsElements.history.snapshot.onComplete.checked,
        onFailure: settingsElements.history.snapshot.onComplete.checked,
      },
      thumbnails: {
        onComplete: settingsElements.history.thumbnails.onComplete.checked,
        onFailure: settingsElements.history.thumbnails.onComplete.checked,
      },
      timelapse: {
        onComplete: settingsElements.history.timelapse.onComplete.checked,
        onFailure: settingsElements.history.timelapse.onComplete.checked,
        deleteAfter: settingsElements.history.timelapse.onComplete.checked,
      },
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
        defaultRet: settingsElements.influxExport.retentionPolicy.defaultRet.checked,
      },
    },
    monitoringViews: {
      panel: settingsElements.monitoringViews.panel.checked,
      list: settingsElements.monitoringViews.list.checked,
      camera: settingsElements.monitoringViews.camera.checked,
      group: settingsElements.monitoringViews.group.checked,
      currentOperations: settingsElements.monitoringViews.currentOperations.checked,
      combined: settingsElements.monitoringViews.combined.checked,
    },
    cameras: {
      aspectRatio: settingsElements.cameras.aspectRatio.value,
      proxyEnabled: settingsElements.cameras.proxyEnabled.checked,
      updateInterval: settingsElements.cameras.updateInterval.value * 1000,
    },
  };
  const previousSettings = await OctoFarmClient.get('settings/server/get');
  if (
    previousSettings.filament.allowMultiSelect === true &&
    settingsElements.filament.allowMultiSelect.checked === false
  ) {
    bootbox.confirm({
      message:
        'You are turning off Mutli-Select, this will remove all your current assignments... are you sure?',
      buttons: {
        confirm: {
          label: 'Yes',
          className: 'btn-success',
        },
        cancel: {
          label: 'No',
          className: 'btn-danger',
        },
      },
      callback: function (result) {
        if (result) {
          OctoFarmClient.post('settings/server/update', opts).then((res) => {
            bootboxRestartRequired(res);
          });
        } else {
          settingsElements.filament.allowMultiSelect.checked = true;
        }
      },
    });
  } else {
    OctoFarmClient.post('settings/server/update', opts).then((res) => {
      bootboxRestartRequired(res);
    });
  }
}

function bootboxRestartRequired(res) {
  UI.createAlert(`${res.status}`, `${res.msg}`, 3000, 'Clicked');
  if (res.restartRequired) {
    bootbox.confirm(serverBootBoxOptions.OF_SERVER_RESTART_REQUIRED);
  }
}

async function updateOctoFarmCommand(doWeForcePull, doWeInstallPackages) {
  const updateOctoFarmBtn = document.getElementById('updateOctoFarmBtn');
  // Make sure the update OctoFarm button is disabled after keypress
  if (updateOctoFarmBtn) {
    updateOctoFarmBtn.disabled = true;
    UI.addLoaderToElementsInnerHTML(updateOctoFarmBtn);
  }
  const updateData = {
    forcePull: false,
    doWeInstallPackages: false,
  };
  if (doWeForcePull) {
    updateData.forcePull = true;
  }
  if (doWeInstallPackages) {
    updateData.doWeInstallPackages = true;
  }

  const updateOctoFarm = await OctoFarmClient.post('settings/server/update/octofarm', updateData);
  // Local changes are detected, question whether we overwrite or cancel..
  if (
    updateOctoFarm.message.includes('The update is failing due to local changes been detected.')
  ) {
    bootbox.confirm(
      serverBootBoxOptions.OF_UPDATE_LOCAL_CHANGES(updateOctoFarmBtn, updateOctoFarm.message)
    );
    return;
  }

  if (updateOctoFarm?.haveWeSuccessfullyUpdatedOctoFarm) {
    UI.createAlert(
      'success',
      'We have successfully updated... OctoFarm will restart now.',
      0,
      'Clicked'
    );
    await restartOctoFarmServer();
    return;
  }

  UI.createAlert(
    `${updateOctoFarm?.statusTypeForUser}`,
    `${updateOctoFarm?.message}`,
    0,
    'clicked'
  );
  UI.removeLoaderFromElementInnerHTML(updateOctoFarmBtn);
}

async function checkForOctoFarmUpdates() {
  const forceCheckForUpdatesBtn = document.getElementById('checkUpdatesForOctoFarmBtn');
  // Make sure check button is disbaled after key press
  if (forceCheckForUpdatesBtn) {
    forceCheckForUpdatesBtn.disabled = true;
  }

  const updateCheck = await OctoFarmClient.get('settings/server/update/check');

  if (updateCheck?.air_gapped) {
    UI.createAlert(
      'error',
      'Your farm has no internet connection, this function requires an active connection to check for releases...',
      5000,
      'Clicked'
    );
    return;
  }
  if (updateCheck?.update_available) {
    UI.createAlert(
      'success',
      'We found a new update, please use the update button to action!',
      5000,
      'Clicked'
    );
    document.getElementById('updateOctoFarmBtn').disabled = false;
  } else {
    UI.createAlert('warning', 'Sorry there are no new updates available!', 5000, 'Clicked');
  }

  setTimeout(() => {
    if (forceCheckForUpdatesBtn) {
      forceCheckForUpdatesBtn.disabled = false;
    }
  }, 5000);
}

async function grabOctoFarmLogList() {
  const logList = await OctoFarmClient.get(OctoFarmClient.logsRoute);
  const logTable = document.getElementById('serverLogs');
  logList.forEach((logs) => {
    logTable.insertAdjacentHTML(
      'beforeend',
      `
            <tr id="log-${logs.name}">
                <td>${logs.name}</td>
                <td>${new Date(logs.created).toString().substring(0, 21)}</td>
                <td>${new Date(logs.modified).toString().substring(0, 21)}</td>
                <td>${Calc.bytes(logs.size)}</td>
                <td>
                <button id="${
                  logs.name
                }-download" type="button" class="btn btn-sm btn-primary"><i class="fas fa-download"></i></button>
                <button id="${
                  logs.name
                }-delete" type="button" class="btn btn-sm btn-danger"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `
    );
    document.getElementById(logs.name + '-download').addEventListener('click', () => {
      window.open(`${OctoFarmClient.logsRoute}/${logs.name}`);
    });
    document.getElementById(logs.name + '-delete').addEventListener('click', async (event) => {
      event.target.disabled = true;
      try {
        await OctoFarmClient.deleteLogFile(logs.name);
        const logLine = document.getElementById(`log-${logs.name}`);
        logLine.remove();
        UI.createAlert('success', `Successfully deleted ${logs.name}!`, 3000, 'clicked');
      } catch (e) {
        event.target.disabled = false;
        UI.createAlert('error', `Failed to delete ${logs.name}!`, 3000, 'clicked');
      }
    });
  });
}

async function clearOldLogs() {
  try {
    bootbox.confirm({
      message: 'Logs older than 5 days will be removed, Are you sure?',
      buttons: {
        confirm: {
          label: 'Yes',
          className: 'btn-success',
        },
        cancel: {
          label: 'No',
          className: 'btn-danger',
        },
      },
      callback: async function (result) {
        if (!!result) {
          const deletedLogs = await OctoFarmClient.clearOldLogs();
          if (deletedLogs.length === 0) {
            UI.createAlert('warning', 'No logs older than 5 day to delete!', 3000, 'clicked');
          } else {
            let message = '';

            deletedLogs.forEach((log) => {
              message += `${log}<br>`;
              const logLine = document.getElementById(`log-${log}`);
              if (!!logLine) {
                logLine.remove();
              }
            });

            UI.createAlert(
              'success',
              'Successfully cleaned house! <br>' + message,
              3000,
              'clicked'
            );
          }
        }
      },
    });
  } catch (e) {
    UI.createAlert('error', 'Failed to house keep logs! ' + e, 3000, 'clicked');
    const errorObject = ClientErrors.SILENT_ERROR;
    errorObject.message = `Bulk Commands - ${e}`;
    throw new ApplicationError(errorObject);
  }
}

async function renderSystemCharts() {
  historicUsageGraph = new ApexCharts(document.querySelector('#historicUsageGraph'), options);
  await historicUsageGraph.render();
  cpuUsageDonut = new ApexCharts(document.querySelector('#cpuUsageDonut'), cpuOptions);
  await cpuUsageDonut.render();
  memoryUsageDonut = new ApexCharts(document.querySelector('#memoryUsageDonut'), memoryOptions);
  await memoryUsageDonut.render();
}

async function updateCurrentActiveUsers() {
  const activeUserList = await OctoFarmClient.get('settings/system/activeUsers');
  if (!activeUserList) {
    return;
  }
  const activeUserListContainer = document.getElementById('activeUserListContainer');
  const activeUserCount = document.getElementById('activeUserCount');
  if (!!activeUserCount) {
    activeUserCount.innerHTML = activeUserList.length;
  }

  if (!!activeUserListContainer) {
    activeUserListContainer.innerHTML = '';
    activeUserList.forEach((user) => {
      activeUserListContainer.insertAdjacentHTML('beforeend', activeUserListRowTemplate(user));
    });
  }
}

async function updateLiveSystemInformation() {
  const initialChartOptions = {
    noData: {
      text: 'No data to display yet!',
    },
  };
  const systemInformation = await OctoFarmClient.get('settings/system/info');
  const sysUptimeElem = document.getElementById('systemUptime');
  const procUptimeElem = document.getElementById('processUpdate');

  if (!systemInformation) {
    return;
  }

  if (systemInformation?.uptime && !!procUptimeElem) {
    procUptimeElem.innerHTML = Calc.generateTime(systemInformation.uptime);
  }

  if (systemInformation?.osUptime && !!sysUptimeElem) {
    sysUptimeElem.innerHTML = Calc.generateTime(systemInformation.osUptime);
  }

  if (!!systemInformation?.memoryLoadHistory && systemInformation.memoryLoadHistory.length > 0) {
    await memoryUsageDonut.updateSeries([
      systemInformation.memoryLoadHistory[systemInformation.memoryLoadHistory.length - 1].y,
    ]);
  } else {
    await historicUsageGraph.updateOptions(initialChartOptions);
  }

  if (!!systemInformation?.cpuLoadHistory && systemInformation.cpuLoadHistory.length > 0) {
    await cpuUsageDonut.updateSeries([
      systemInformation.cpuLoadHistory[systemInformation.cpuLoadHistory.length - 1].y,
    ]);
  } else {
    await historicUsageGraph.updateOptions(initialChartOptions);
  }

  if (systemInformation.memoryLoadHistory.length > 5) {
    const dataSeriesForCharts = [
      {
        name: 'Memory',
        data: systemInformation.memoryLoadHistory,
      },
      {
        name: 'CPU',
        data: systemInformation.cpuLoadHistory,
      },
    ];
    await historicUsageGraph.updateSeries(dataSeriesForCharts);
  } else {
    await historicUsageGraph.updateOptions(initialChartOptions);
  }
}

async function startUpdateInfoRunner() {
  await updateLiveSystemInformation();
  if (!!serverActionsElements.ACTIVE_USERS_ROW) {
    await updateCurrentActiveUsers();
  }
  setInterval(async () => {
    await updateLiveSystemInformation();
    if (!!serverActionsElements.ACTIVE_USERS_ROW) {
      await updateCurrentActiveUsers();
    }
  }, 5000);
}

// REFACTOR utilise the events server for this...
function startUpdateTasksRunner() {
  setInterval(async function updateStatus() {
    const taskManagerState = await OctoFarmClient.get('settings/system/tasks');

    for (const task in taskManagerState) {
      const theTask = taskManagerState[task];

      UI.doesElementNeedUpdating(
        theTask.firstCompletion
          ? new Date(theTask.firstCompletion).toLocaleString().replace(',', ': ')
          : 'Not Started',
        document.getElementById('firstExecution-' + task),
        'innerHTML'
      );

      UI.doesElementNeedUpdating(
        theTask.lastExecuted
          ? new Date(theTask.lastExecuted).toLocaleString().replace(',', ': ')
          : 'Not Finished',
        document.getElementById('lastExecution-' + task),
        'innerHTML'
      );

      UI.doesElementNeedUpdating(
        theTask.duration
          ? UI.generateMilisecondsTime(theTask.duration)
          : theTask.nextRun
          ? '<1ms'
          : 'Not Run Yet',
        document.getElementById('duration-' + task),
        'innerHTML'
      );

      UI.doesElementNeedUpdating(
        theTask.nextRun
          ? new Date(theTask.nextRun).toLocaleString().replace(',', ': ')
          : 'First Not Completed',
        document.getElementById('next-' + task),
        'innerHTML'
      );
    }
  }, 1500);
}

function displayUserErrors(errors) {
  errors.forEach((error) => {
    userActionElements.userCreateMessage.insertAdjacentHTML(
      'beforeend',
      `
        <div class="alert alert-warning text-dark" role="alert">
          <i class="fas fa-exclamation-triangle"></i> ${error.msg}
        </div>
        `
    );
  });
}

async function createNewUser() {
  userActionElements.userCreateMessage.innerHTML = '';
  const newUser = {
    name: userActionElements.createName.value,
    username: userActionElements.createUserName.value,
    group: userActionElements.createGroup.value,
    password: userActionElements.createPassword.value,
    password2: userActionElements.createPassword2.value,
  };
  const newCreatedUser = await OctoFarmClient.createNewUser(newUser);

  if (newCreatedUser.errors.length > 0) {
    displayUserErrors(newCreatedUser.errors);
  } else {
    const createdUser = newCreatedUser.createdNewUser;
    userActionElements.userTableContent.insertAdjacentHTML(
      'beforeend',
      ` 
                <tr id="userRow-${createdUser._id}">
                        <th scope="row">${createdUser.name}</th>
                        <td>${createdUser.username}</td>
                        <td>${createdUser.group}</td>
                        <td>${new Date(createdUser.date).toLocaleDateString()}</td>
                        <td>
                            <button id="resetPasswordBtn-${createdUser._id}" type="button" 
                            class="btn btn-warning text-dark btn-sm" 
                            data-toggle="modal" 
                            data-target="#usersResetPasswordModal"><i class="fas fa-user-shield"></i> Reset Password</button>
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
    userActionElements.createName.value = '';
    userActionElements.createUserName.value = '';
    userActionElements.createGroup.value = 'User';
    userActionElements.createPassword.value = '';
    userActionElements.createPassword2.value = '';
    $('#userCreateModal').modal('hide');
    document.getElementById(`deleteUserBtn-${createdUser._id}`).addEventListener('click', () => {
      deleteUser(createdUser._id);
    });
    document.getElementById(`resetPasswordBtn-${createdUser._id}`).addEventListener('click', () => {
      userActionElements.resetPasswordFooter.innerHTML = `
        ${returnSaveBtn()}
        `;
      const userActionSave = document.getElementById('userActionSave');
      userActionSave.addEventListener('click', async () => {
        await resetUserPassword(createdUser._id);
      });
    });
    document
      .getElementById(`editUserBtn-${createdUser._id}`)
      .addEventListener('click', async () => {
        userActionElements.editUserFooter.innerHTML = `
        ${returnSaveBtn()}
        `;
        await fillInEditInformation(createdUser._id);
        const userActionSave = document.getElementById('userActionSave');
        userActionSave.addEventListener('click', async () => {
          await editUser(createdUser._id);
        });
      });
    UI.createAlert('success', 'Successfully created your user!', 3000, 'clicked');
  }
}

async function fillInEditInformation(id) {
  const editInformation = await OctoFarmClient.getUser(id);
  userActionElements.editName.value = editInformation.name;
  userActionElements.editUserName.value = editInformation.username;
  userActionElements.editGroup.value = editInformation.group;
}

async function editUser(id) {
  userActionElements.userEditMessage.innerHTML = '';
  const newUserInfo = {
    name: userActionElements.editName.value,
    username: userActionElements.editUserName.value,
    group: userActionElements.editGroup.value,
  };
  const editedUser = await OctoFarmClient.editUser(id, newUserInfo);
  if (editedUser.errors.length > 0) {
    displayUserErrors(editedUser.errors);
  } else {
    UI.createAlert('success', 'Successfully updated your user!', 3000, 'clicked');
    userActionElements.editName.value = '';
    userActionElements.editUserName.value = '';
    userActionElements.editGroup.value = 'User';
    $('#userEditModal').modal('hide');
    if (!!editedUser?.user) {
      const { user } = editedUser;
      document.getElementById('userRowName-' + user._id).innerHTML = user.name;
      document.getElementById('userRowUserName-' + user._id).innerHTML = user.username;
      document.getElementById('userRowUserGroup-' + user._id).innerHTML = user.group;
    }
  }
}

function deleteUser(id) {
  bootbox.confirm({
    message: 'This action is unrecoverable, are you sure?',
    buttons: {
      confirm: {
        label: 'Yes',
        className: 'btn-success',
      },
      cancel: {
        label: 'No',
        className: 'btn-danger',
      },
    },
    callback: async function (result) {
      if (result) {
        const deletedUser = await OctoFarmClient.deleteUser(id);
        if (deletedUser.errors.length > 0) {
          deletedUser.errors.forEach((error) => {
            UI.createAlert('error', error.msg, 3000, 'clicked');
          });
        } else {
          document.getElementById(`userRow-${deletedUser.userDeleted._id}`).remove();
          UI.createAlert('success', 'Successfully deleted your user!', 3000, 'clicked');
        }
      }
    },
  });
}

async function resetUserPassword(id) {
  userActionElements.userResetMessage.innerHTML = '';
  const newPassword = {
    password: userActionElements.resetPassword.value,
    password2: userActionElements.resetPassword2.value,
  };
  const resetPassword = await OctoFarmClient.resetUserPassword(id, newPassword);
  if (resetPassword.errors.length > 0) {
    resetPassword.errors.forEach((error) => {
      userActionElements.userResetMessage.insertAdjacentHTML(
        'beforeend',
        `
        <div class="alert alert-warning text-dark" role="alert">
          <i class="fas fa-exclamation-triangle"></i> ${error.msg}
        </div>
        `
      );
    });
  } else {
    UI.createAlert('success', 'Successfully reset your users password!', 3000, 'clicked');
    userActionElements.resetPassword.value = '';
    userActionElements.resetPassword2.value = '';
    $('#usersResetPasswordModal').modal('hide');
  }
}

export {
  setupOPTimelapseSettings,
  generateLogDumpFile,
  nukeDatabases,
  exportDatabases,
  restartOctoFarmServer,
  updateServerSettings,
  updateOctoFarmCommand,
  checkForOctoFarmUpdates,
  grabOctoFarmLogList,
  renderSystemCharts,
  startUpdateTasksRunner,
  startUpdateInfoRunner,
  createNewUser,
  editUser,
  deleteUser,
  resetUserPassword,
  fillInEditInformation,
  clearOldLogs,
};
