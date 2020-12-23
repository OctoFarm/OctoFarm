import Client from "./lib/octofarm.js";
import UI from "./lib/functions/ui.js";
import Calc from "./lib/functions/calc.js";
import OctoFarmclient from "./lib/octofarm.js";
import Script from "./lib/modules/scriptCheck.js";
import OctoPrintClient from "./lib/octoprint";
// Add listeners to settings
document.getElementById("saveServerSettings").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ServerSettings.update();
});
document.getElementById("saveSettings").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ClientSettings.update();
});
document.getElementById("nukeEverything").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ServerSettings.nukeDatabases("nukeEverything");
});
document.getElementById("nukeAlerts").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ServerSettings.nukeDatabases("AlertsDB");
});
document.getElementById("nukeClientSettings").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ServerSettings.nukeDatabases("ClientSettingsDB");
});
document.getElementById("nukeFilament").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ServerSettings.nukeDatabases("FilamentDB");
});
document.getElementById("nukeHistory").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ServerSettings.nukeDatabases("HistoryDB");
});
document.getElementById("nukePrinters").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ServerSettings.nukeDatabases("PrinterDB");
});
document.getElementById("nukeRoomData").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ServerSettings.nukeDatabases("roomDataDB");
});
document.getElementById("nukeServerSettings").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ServerSettings.nukeDatabases("ServerSettingsDB");
});
document.getElementById("nukeUsers").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ServerSettings.nukeDatabases("UserDB");
});
document
  .getElementById("setupTimelapseOctoPrint")
  .addEventListener("click", (e) => {
    setupOctoPrintClientsforTimelapse();
  });

async function setupOctoPrintClientsforTimelapse() {
  let printers = await OctoFarmclient.post("printers/printerInfo");

  if (printers.status === 200) {
    printers = await printers.json();
    bootbox.confirm({
      title: "Are you sure?",
      message:
        "If you press yes below your timelapse settings will automatically be updated to work with OctoFarms setup. The script will update any online instances and there shouldn't be a restart necassary. It does however presume you have your ffmpeg path setup with your snapshot URL inputted into OctoPrint.",
      buttons: {
        confirm: {
          label: "Yes",
          className: "btn-success",
        },
        cancel: {
          label: "No",
          className: "btn-danger",
        },
      },
      callback: async function (result) {
        if (result) {
          let settings = {
            webcam: {
              ffmpegVideoCodec: "libx264",
              webcamEnabled: true,
            },
          };
          let timelapse = {
            type: "zchange",
          };
          for (let i = 0; i < printers.length; i++) {
            if (printers[i].printerState.colour.category !== "Offline") {
              let sett = await OctoPrintClient.post(
                printers[i],
                "settings",
                settings
              );
              if (sett.status === 200) {
                UI.createAlert(
                  "success",
                  printers[i].printerName +
                    ": Updated your web camera settings!",
                  1000,
                  "Clicked"
                );
              } else {
                UI.createAlert(
                  "danger",
                  printers[i].printerName + ": Failed to update the settings!",
                  1000,
                  "Clicked"
                );
              }
              let time = await OctoPrintClient.post(
                printers[i],
                "timelapse",
                timelapse
              );
              if (time.status === 200) {
                UI.createAlert(
                  "success",
                  printers[i].printerName +
                    ": Updated your timelapse settings!",
                  1000,
                  "Clicked"
                );
              } else {
                UI.createAlert(
                  "danger",
                  printers[i].printerName + ": Failed to timelapse settings!",
                  1000,
                  "Clicked"
                );
              }
            } else {
              //Printer offline skipping...
            }
          }
        }
      },
    });
  } else {
    UI.createAlert(
      "error",
      "Sorry OctoFarm is not responding...",
      3000,
      "Clicked"
    );
  }
  OctoPrintClient.post;
}

document.getElementById("resetDashboardBtn").addEventListener("click", (e) => {
  const dashData = localStorage.getItem("dashboardConfiguration");
  const serializedData = JSON.parse(dashData);
  if (serializedData !== null && serializedData.length !== 0) {
    localStorage.removeItem("dashboardConfiguration");
  }
  UI.createAlert(
    "success",
    "Dashboard data cleared from browser",
    3000,
    "clicked"
  );
});

let oldServerSettings = {};

const optionsMemory = {
  title: {
    text: "Memory",
    align: "center",
    margin: 1,
    offsetX: 0,
    offsetY: 0,
    floating: false,
    style: {
      fontSize: "14px",
      fontWeight: "bold",
      fontFamily: undefined,
      color: "#fff",
    },
  },
  chart: {
    type: "donut",
    height: "100%",
    width: "100%",
    animations: {
      enabled: false,
    },
    background: "#303030",
  },
  theme: {
    mode: "dark",
  },
  plotOptions: {
    pie: {
      expandOnClick: true,
      dataLabels: {
        offset: 10,
        minAngleToShowLabel: 15,
      },
    },
  },
  stroke: {
    show: false,
  },
  tooltip: {
    y: {
      formatter(val) {
        return Calc.bytes(val);
      },
    },
  },
  noData: {
    text: "Loading...",
  },
  dataLabels: {
    enabled: false,
  },
  series: [],
  labels: ["Other", "OctoFarm", "Free"],
  colors: ["#f39c12", "#3498db", "#00bc8c"],
  legend: {
    show: true,
    showForSingleSeries: false,
    showForNullSeries: true,
    showForZeroSeries: true,
    position: "bottom",
    horizontalAlign: "center",
    floating: false,
    fontSize: "11px",
    fontFamily: "Helvetica, Arial",
    fontWeight: 400,
    formatter: undefined,
    inverseOrder: false,
    width: undefined,
    height: undefined,
    tooltipHoverFormatter: undefined,
    offsetX: -25,
    offsetY: 0,
    labels: {
      colors: undefined,
      useSeriesColors: false,
    },
    markers: {
      width: 9,
      height: 9,
      strokeWidth: 0,
      strokeColor: "#fff",
      fillColors: undefined,
      radius: 1,
      customHTML: undefined,
      onClick: undefined,
      offsetX: 0,
      offsetY: 0,
    },
    itemMargin: {
      horizontal: 1,
      vertical: 0,
    },
    onItemClick: {
      toggleDataSeries: false,
    },
    onItemHover: {
      highlightDataSeries: false,
    },
  },
};
const optionsCPU = {
  title: {
    text: "CPU",
    align: "center",
    margin: 1,
    offsetX: 0,
    offsetY: 0,
    floating: false,
    style: {
      fontSize: "14px",
      fontWeight: "bold",
      fontFamily: undefined,
      color: "#fff",
    },
  },
  chart: {
    type: "donut",
    height: "100%",
    width: "100%",
    animations: {
      enabled: true,
    },
    background: "#303030",
  },
  theme: {
    mode: "dark",
  },
  plotOptions: {
    pie: {
      expandOnClick: false,
      dataLabels: {
        offset: 10,
        minAngleToShowLabel: 15,
      },
    },
  },
  stroke: {
    show: false,
  },
  tooltip: {
    y: {
      formatter(val) {
        return `${Math.round(val * 10) / 10}%`;
      },
    },
  },
  noData: {
    text: "Loading...",
  },
  dataLabels: {
    enabled: false,
  },
  series: [],
  labels: ["System", "OctoFarm", "User", "Free"],
  colors: ["#f39c12", "#3498db", "#375a7f", "#00bc8c"],
  legend: {
    show: true,
    showForSingleSeries: false,
    showForNullSeries: true,
    showForZeroSeries: true,
    position: "bottom",
    horizontalAlign: "center",
    floating: false,
    fontSize: "11px",
    fontFamily: "Helvetica, Arial",
    fontWeight: 400,
    formatter: undefined,
    inverseOrder: false,
    width: undefined,
    height: undefined,
    tooltipHoverFormatter: undefined,
    offsetX: -25,
    offsetY: 0,
    labels: {
      colors: undefined,
      useSeriesColors: false,
    },
    markers: {
      width: 9,
      height: 9,
      strokeWidth: 0,
      strokeColor: "#fff",
      fillColors: undefined,
      radius: 1,
      customHTML: undefined,
      onClick: undefined,
      offsetX: 0,
      offsetY: 0,
    },
    itemMargin: {
      horizontal: 1,
      vertical: 0,
    },
    onItemClick: {
      toggleDataSeries: false,
    },
    onItemHover: {
      highlightDataSeries: false,
    },
  },
};
const systemChartCPU = new ApexCharts(
  document.querySelector("#systemChartCPU"),
  optionsCPU
);
systemChartCPU.render();
const systemChartMemory = new ApexCharts(
  document.querySelector("#systemChartMemory"),
  optionsMemory
);
systemChartMemory.render();
setInterval(async function updateStatus() {
  let systemInfo = await Client.get("settings/sysInfo");

  systemInfo = await systemInfo.json();

  if (
    Object.keys(systemInfo).length === 0 &&
    systemInfo.constructor === Object
  ) {
  } else {
    document.getElementById("systemUptime").innerHTML = Calc.generateTime(
      systemInfo.sysUptime.uptime
    );

    document.getElementById("processUpdate").innerHTML = Calc.generateTime(
      systemInfo.processUptime
    );
    // labels: ['System', 'OctoFarm', 'User', 'Free'],
    const cpuLoad = systemInfo.cpuLoad.currentload_system;
    const octoLoad = systemInfo.sysProcess.pcpu;
    const userLoad = systemInfo.cpuLoad.currentload_user;
    const remain = cpuLoad + octoLoad + userLoad;
    systemChartCPU.updateSeries([cpuLoad, octoLoad, userLoad, 100 - remain]);

    const otherRAM = systemInfo.memoryInfo.total - systemInfo.memoryInfo.free;
    const octoRAM =
      (systemInfo.memoryInfo.total / 100) * systemInfo.sysProcess.pmem;
    const freeRAM = systemInfo.memoryInfo.free;

    systemChartMemory.updateSeries([otherRAM, octoRAM, freeRAM]);
  }
}, 5000);

class ClientSettings {
  static init() {
    Client.get("settings/client/get")
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        // localStorage.setItem("clientSettings", JSON.stringify(res));
        document.getElementById("panelCurrentOpOn").checked =
          res.panelView.currentOp;
        document.getElementById("panelHideOffline").checked =
          res.panelView.hideOff;
        document.getElementById("panelHideClosed").checked =
          res.panelView.hideClosed;
        // document.getElementById("panelHideIdle").checked =
        //   res.panelView.hideIdle;
        if (res.panelView.printerRows) {
          document.getElementById("selectCameraGrid").value =
            res.panelView.printerRows;
        } else {
          document.getElementById("selectCameraGrid").value = 2;
        }

        if (typeof res.dashboard !== "undefined") {
          document.getElementById("currentOperations").checked =
            res.dashboard.farmActivity.currentOperations;
          document.getElementById("cumulativeTimes").checked =
            res.dashboard.farmActivity.cumulativeTimes;
          document.getElementById("averageTimes").checked =
            res.dashboard.farmActivity.averageTimes;

          document.getElementById("printerState").checked =
            res.dashboard.printerStates.printerState;
          document.getElementById("printerTemps").checked =
            res.dashboard.printerStates.printerProgress;
          document.getElementById("printerUtilisation").checked =
            res.dashboard.printerStates.printerUtilisation;
          document.getElementById("printerProgress").checked =
            res.dashboard.printerStates.printerProgress;
          document.getElementById("currentStatus").checked =
            res.dashboard.printerStates.currentStatus;

          document.getElementById("currentUtilisation").checked =
            res.dashboard.farmUtilisation.currentUtilisation;
          document.getElementById("farmUtilisation").checked =
            res.dashboard.farmUtilisation.farmUtilisation;

          document.getElementById("weeklyUtilisation").checked =
            res.dashboard.historical.weeklyUtilisation;
          document.getElementById("hourlyTotalTemperatures").checked =
            res.dashboard.historical.hourlyTotalTemperatures;
          document.getElementById("environmentalHistory").checked =
            res.dashboard.historical.environmentalHistory;
        }
      });
  }

  static async update() {
    const opts = {
      panelView: {
        currentOp: document.getElementById("panelCurrentOpOn").checked,
        hideOff: document.getElementById("panelHideOffline").checked,
        hideClosed: document.getElementById("panelHideClosed").checked,
        // hideIdle: document.getElementById("panelHideIdle").checked,
      },
      cameraView: {
        cameraRows: document.getElementById("selectCameraGrid").value,
      },
      dashboard: {
        defaultLayout: [
          { x: 0, y: 0, width: 2, height: 5, id: "currentUtil" },
          { x: 5, y: 0, width: 3, height: 5, id: "farmUtil" },
          { x: 8, y: 0, width: 2, height: 5, id: "averageTimes" },
          { x: 10, y: 0, width: 2, height: 5, id: "cumulativeTimes" },
          { x: 2, y: 0, width: 3, height: 5, id: "currentStat" },
          { x: 6, y: 5, width: 3, height: 5, id: "printerTemps" },
          { x: 9, y: 5, width: 3, height: 5, id: "printerUtilisation" },
          { x: 0, y: 5, width: 3, height: 5, id: "printerStatus" },
          { x: 3, y: 5, width: 3, height: 5, id: "printerProgress" },
          { x: 6, y: 10, width: 6, height: 9, id: "hourlyTemper" },
          { x: 0, y: 10, width: 6, height: 9, id: "weeklyUtil" },
          { x: 0, y: 19, width: 12, height: 8, id: "enviroData" },
        ],
        savedLayout: localStorage.getItem("dashboardConfiguration"),
        farmActivity: {
          currentOperations: document.getElementById("currentOperations")
            .checked,
          cumulativeTimes: document.getElementById("cumulativeTimes").checked,
          averageTimes: document.getElementById("averageTimes").checked,
        },
        printerStates: {
          printerState: document.getElementById("printerState").checked,
          printerTemps: document.getElementById("printerTemps").checked,
          printerUtilisation: document.getElementById("printerUtilisation")
            .checked,
          printerProgress: document.getElementById("printerProgress").checked,
          currentStatus: document.getElementById("currentStatus").checked,
        },
        farmUtilisation: {
          currentUtilisation: document.getElementById("currentUtilisation")
            .checked,
          farmUtilisation: document.getElementById("farmUtilisation").checked,
        },
        historical: {
          weeklyUtilisation: document.getElementById("weeklyUtilisation")
            .checked,
          hourlyTotalTemperatures: document.getElementById(
            "hourlyTotalTemperatures"
          ).checked,
          environmentalHistory: document.getElementById("environmentalHistory")
            .checked,
        },
      },
    };
    await Client.post("settings/client/update", opts);
    localStorage.setItem("clientSettings", JSON.stringify(opts));
    UI.createAlert("success", "Client settings updated", 3000, "clicked");
  }

  static get() {
    // return JSON.parse(localStorage.getItem("clientSettings"));
  }
}
class ServerSettings {
  static nukeDatabases(database) {
    Client.get("settings/server/delete/database/" + database)
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        UI.createAlert("success", res.message, 3000);
      });
  }
  static async init() {
    Client.get("settings/server/get")
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        oldServerSettings = res;
        document.getElementById("webSocketThrottle").value =
          res.onlinePolling.seconds;
        document.getElementById("serverPortNo").value = res.server.port;
        document.getElementById("requireLogin").checked =
          res.server.loginRequired;
        document.getElementById("requireRegistration").checked =
          res.server.registration;

        document.getElementById("webSocketRetry").value =
          res.timeout.webSocketRetry / 1000;
        document.getElementById("APITimeout").value =
          res.timeout.apiTimeout / 1000;
        document.getElementById("APIRetryTimeout").value =
          res.timeout.apiRetryCutoff / 1000;
        document.getElementById("APIRetry").value = res.timeout.apiRetry / 1000;
        if (typeof res.filament !== "undefined") {
          document.getElementById("checkFilament").checked =
            res.filament.filamentCheck;
        }

        if (!res.filamentManager) {
          const filManager = document.getElementById("filamentManagerSyncBtn");
          filManager.addEventListener("click", async (event) => {
            filManager.innerHTML =
              '<i class="fas fa-sync fa-spin"></i> <br> Syncing <br> Please Wait...';
            let post = await OctoFarmclient.post(
              "filament/filamentManagerSync",
              { activate: true }
            );
            post = await post.json();
            if (post.status) {
              filManager.innerHTML =
                '<i class="fas fa-sync"></i> <br> Sync Filament Manager';
              filManager.disabled = true;
              UI.createAlert(
                "success",
                "Filament Manager Plugin successfully synced",
                3000
              );
            } else {
              filManager.innerHTML =
                '<i class="fas fa-sync"></i> <br> Sync Filament Manager';
              filManager.disabled = false;
              UI.createAlert(
                "error",
                "Something went wrong, please check the filament manager logs.",
                3000
              );
            }
          });
        } else if (res.filamentManager) {
          const filManager = document.getElementById("resync-FilamentManager");
          filManager.addEventListener("click", async (event) => {
            filManager.disabled = true;
            filManager.innerHTML =
              '<i class="fas fa-sync fa-spin"></i> <br> Syncing... <br> Please Wait...';
            let post = await OctoFarmclient.post(
              "filament/filamentManagerReSync"
            );
            post = await post.json();
            if (post.status) {
              filManager.innerHTML =
                '<i class="fas fa-sync"></i> <br> Re-Sync Database';
              filManager.disabled = false;
            } else {
              filManager.innerHTML =
                '<i class="fas fa-sync"></i> <br> Re-Sync Database';
              filManager.disabled = false;
            }
          });
          const disableFilManager = document.getElementById(
            "disable-FilamentManager"
          );
          disableFilManager.addEventListener("click", async (event) => {
            let post = await OctoFarmclient.post(
              "filament/disableFilamentPlugin",
              { activate: true }
            );
            post = await post.json();
          });
        }
        if (typeof res.history !== "undefined") {
          document.getElementById("thumbOnComplete").checked =
            res.history.thumbnails.onComplete;
          document.getElementById("thumbOnFailure").checked =
            res.history.thumbnails.onFailure;
          document.getElementById("snapOnComplete").checked =
            res.history.snapshot.onComplete;
          document.getElementById("snapOnFailure").checked =
            res.history.snapshot.onFailure;
          if (typeof res.history.timelapse !== "undefined") {
            document.getElementById("timelapseOnComplete").checked =
              res.history.timelapse.onComplete;
            document.getElementById("timelapseOnFailure").checked =
              res.history.timelapse.onFailure;
            document.getElementById("timelapseDelete").checked =
              res.history.timelapse.deleteAfter;
          }
        } else {
          document.getElementById("thumbOnComplete").checked = true;
          document.getElementById("thumbOnFailure").checked = true;
          document.getElementById("snapOnComplete").checked = true;
          document.getElementById("snapOnFailure").checked = true;
        }
        if (typeof res.influxExport !== "undefined") {
          document.getElementById("infActivateInfluxExport").checked =
            res.influxExport.active;
          if (res.influxExport.host !== null) {
            document.getElementById("infHostIP").value = res.influxExport.host;
          }
          if (res.influxExport.username !== null) {
            document.getElementById("infUsername").value =
              res.influxExport.username;
          }
          if (res.influxExport.password !== null) {
            document.getElementById("infPassword").value =
              res.influxExport.password;
          }
          if (res.influxExport.database !== null) {
            document.getElementById("infDatabase").value =
              res.influxExport.database;
          }
          document.getElementById("infHostPort").value = res.influxExport.port;

          document.getElementById("infDuration").value =
            res.influxExport.retentionPolicy.duration;
          document.getElementById("infReplication").value =
            res.influxExport.retentionPolicy.replication;
          document.getElementById("infRetention").checked =
            res.influxExport.retentionPolicy.defaultRet;
        } else {
          document.getElementById("infRetention").checked = true;
          oldServerSettings.influxExport = {
            active: false,
            host: null,
            port: 8086,
            database: "OctoFarmExport",
            username: null,
            password: null,
            retentionPolicy: {
              duration: "365d",
              replication: 1,
              defaultRet: true,
            },
          };
        }
      });
    let logList = await Client.get("settings/server/get/logs");
    logList = await logList.json();
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
      document
        .getElementById(logs.name)
        .addEventListener("click", async (event) => {
          const body = {
            logName: logs.name,
          };
          window.open(`/settings/server/download/logs/${logs.name}`);
        });
    });
  }

  static update() {
    let reboot = false;
    const onlinePoll = document.getElementById("webSocketThrottle").value;
    const onlinePolling = {
      seconds: onlinePoll,
    };
    const server = {
      port: parseInt(document.getElementById("serverPortNo").value),
      loginRequired: document.getElementById("requireLogin").checked,
      registration: document.getElementById("requireRegistration").checked,
    };
    const timeout = {
      webSocketRetry: document.getElementById("webSocketRetry").value * 1000,
      apiTimeout: document.getElementById("APITimeout").value * 1000,
      apiRetryCutoff: document.getElementById("APIRetryTimeout").value * 1000,
      apiRetry: document.getElementById("APIRetry").value * 1000,
    };
    const filament = {
      filamentCheck: document.getElementById("checkFilament").checked,
    };
    const history = {
      snapshot: {
        onComplete: document.getElementById("snapOnComplete").checked,
        onFailure: document.getElementById("snapOnFailure").checked,
      },
      thumbnails: {
        onComplete: document.getElementById("thumbOnComplete").checked,
        onFailure: document.getElementById("thumbOnFailure").checked,
      },
      timelapse: {
        onComplete: document.getElementById("timelapseOnComplete").checked,
        onFailure: document.getElementById("timelapseOnFailure").checked,
        deleteAfter: document.getElementById("timelapseDelete").checked,
      },
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
        defaultRet: document.getElementById("infRetention").checked,
      },
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
    Client.post("settings/server/update", {
      onlinePolling,
      server,
      timeout,
      filament,
      history,
      influxExport,
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        UI.createAlert(`${res.status}`, `${res.msg}`, 3000, "Clicked");
        if (reboot) {
          bootbox.confirm({
            message:
              "Your settings changes require a restart, would you like to do this now?",
            buttons: {
              cancel: {
                label: '<i class="fa fa-times"></i> Cancel',
              },
              confirm: {
                label: '<i class="fa fa-check"></i> Confirm',
              },
            },
            callback(result) {
              if (result) {
                OctoFarmclient.get("settings/server/restart");
                UI.createAlert(
                  "warning",
                  "Performing a server restart, please wait for it to come back online.",
                  6000,
                  "Clicked"
                );
              }
            },
          });
        }
      });
  }
}

// Initialise Settings
ServerSettings.init();
ClientSettings.init();
Script.get();

const grid = GridStack.init({
  animate: true,
  cellHeight: 30,
  draggable: {
    handle: ".tag",
  },
  float: true,
});
function saveGrid() {
  const serializedData = [];
  grid.engine.nodes.forEach(function (node) {
    serializedData.push({
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      id: node.id,
    });
  });
  localStorage.setItem(
    "dashboardConfiguration",
    JSON.stringify(serializedData)
  );
  // console.log(JSON.stringify(serializedData, null, '  '))
}
function loadGrid() {
  const dashData = localStorage.getItem("dashboardConfiguration");
  const serializedData = JSON.parse(dashData);
  if (serializedData !== null && serializedData.length !== 0) {
    const items = GridStack.Utils.sort(serializedData);
    grid.batchUpdate();

    // else update existing nodes (instead of calling grid.removeAll())
    grid.engine.nodes.forEach(function (node) {
      const item = items.find(function (e) {
        return e.id === node.id;
      });
      if (typeof item !== "undefined") {
        grid.update(node.el, item.x, item.y, item.width, item.height);
      }
    });
    grid.commit();
  }
}

loadGrid();

grid.on("change", function (event, items) {
  saveGrid();
});
