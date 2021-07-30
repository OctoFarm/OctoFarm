import OctoFarmClient from "./services/octofarm-client.service.js";
import UI from "./lib/functions/ui.js";
import Calc from "./lib/functions/calc.js";
import { ServerSettings } from "./system/server-settings";
import {localStorageKeys, serverActionsElements, serverSettingKeys} from "./system/utils/server.options";
import Script from "./services/gocde-scripts.service.js";
import OctoPrintClient from "./lib/octoprint";
import FileOperations from "./lib/functions/file.js";
import {
  setupFilamentManagerSyncBtn,
  setupFilamentManagerReSyncBtn,
  setupFilamentManagerDisableBtn,
  isFilamentManagerPluginSyncEnabled
} from "./services/filament-manager-plugin.service.js";

import ApexCharts from "apexcharts";
import { generateLogDumpFile, exportDatabases, nukeDatabases } from "./system/utils/server.actions";
import { serverBootBoxOptions } from "./system/utils/bootbox.options";
import { removeLocalStorage } from "./services/local-storage.service";

// Setup Page
  for (const key in serverSettingKeys) {
    if (serverSettingKeys.hasOwnProperty(key)) {
      document.getElementById(`nuke${serverSettingKeys[key]}`).addEventListener("click", async (e) => {
        const alert = UI.createAlert("warning", `${UI.returnSpinnerTemplate()} Deleting ${serverSettingKeys[key]} database...`)
        await nukeDatabases(`${serverSettingKeys[key]}DB`, e);
        alert.close();
      });
      if (key !== "ALL") {
        document
            .getElementById(`export${serverSettingKeys[key]}`)
            .addEventListener("click", async (e) => {
              const alert = UI.createAlert("warning", `${UI.returnSpinnerTemplate()} Preparing ${serverSettingKeys[key]} database...`)
              await exportDatabases(`${serverSettingKeys[key]}DB`, e);
              alert.close();
            });
      }
    }

serverActionsElements.OP_TIMELAPSE_SETUP
  .addEventListener("click", async (e) => {
    bootbox.confirm(serverBootBoxOptions.OP_TIMELAPSE_SETUP);
  });

serverActionsElements.LOG_DUMP_GENERATE
  .addEventListener("click", async (e) => {
    const alert = UI.createAlert(
      "warning",
      `${UI.returnSpinnerTemplate()} Generating log dump, please wait...`
    );
    await generateLogDumpFile();
    alert.close();
  });

serverActionsElements.RESET_DASHBOARD.addEventListener("click", (e) => {
  removeLocalStorage(localStorageKeys.DASHBOARD_SETTINGS)
  UI.createAlert(
      "success",
      "Dashboard data cleared from browser",
      3000,
      "clicked"
  );
});

serverActionsElements.SAVE_SERVER_SETTINGS.addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ServerSettings.updateServerSettings();
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

let oldServerSettings = {};

const optionsMemory = {
  title: {
    text: "",
    align: "center",
    margin: 1,
    offsetX: 0,
    offsetY: 0,
    floating: false,
    style: {
      fontSize: "14px",
      fontWeight: "bold",
      fontFamily: undefined,
      color: "#fff"
    }
  },
  chart: {
    type: "donut",
    height: "300px",
    animations: {
      enabled: false
    },
    background: "#303030"
  },
  theme: {
    mode: "dark"
  },
  plotOptions: {
    pie: {
      expandOnClick: true,
      dataLabels: {
        offset: 10,
        minAngleToShowLabel: 15
      }
    }
  },
  stroke: {
    show: false
  },
  tooltip: {
    y: {
      formatter(val) {
        return Calc.bytes(val);
      }
    }
  },
  noData: {
    text: "Loading..."
  },
  dataLabels: {
    enabled: false
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
      useSeriesColors: false
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
      offsetY: 0
    },
    itemMargin: {
      horizontal: 1,
      vertical: 0
    },
    onItemClick: {
      toggleDataSeries: false
    },
    onItemHover: {
      highlightDataSeries: false
    }
  }
};
const optionsCPU = {
  title: {
    text: "",
    align: "center",
    margin: 1,
    offsetX: 0,
    offsetY: 0,
    floating: false,
    style: {
      fontSize: "14px",
      fontWeight: "bold",
      fontFamily: undefined,
      color: "#fff"
    }
  },
  chart: {
    type: "donut",
    height: "300px",
    animations: {
      enabled: true
    },
    background: "#303030"
  },
  theme: {
    mode: "dark"
  },
  plotOptions: {
    pie: {
      expandOnClick: false,
      dataLabels: {
        offset: 10,
        minAngleToShowLabel: 15
      }
    }
  },
  stroke: {
    show: false
  },
  tooltip: {
    y: {
      formatter(val) {
        return `${Math.round(val * 10) / 10}%`;
      }
    }
  },
  noData: {
    text: "Loading..."
  },
  dataLabels: {
    enabled: false
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
      useSeriesColors: false
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
      offsetY: 0
    },
    itemMargin: {
      horizontal: 1,
      vertical: 0
    },
    onItemClick: {
      toggleDataSeries: false
    },
    onItemHover: {
      highlightDataSeries: false
    }
  }
};
const systemChartCPU = new ApexCharts(document.querySelector("#systemChartCPU"), optionsCPU);
systemChartCPU.render();
const systemChartMemory = new ApexCharts(
  document.querySelector("#systemChartMemory"),
  optionsMemory
);
systemChartMemory.render();
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

// Initialise Settings
