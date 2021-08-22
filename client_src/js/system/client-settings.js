import OctoFarmClient from "../services/octofarm-client.service";
import UI from "../lib/functions/ui";
//Going to wait till backend changes are merged before tackling this. Also want to re-enable client settings local storage.

export default class ClientSettings {
  static async init() {
    const clientSettings = await OctoFarmClient.getClientSettings();
    //// localStorage.setItem("clientSettings", JSON.stringify(res));
    document.getElementById("panelCurrentOpOn").checked = clientSettings.panelView.currentOp;
    document.getElementById("panelHideOffline").checked = clientSettings.panelView.hideOff;
    document.getElementById("panelHideClosed").checked = clientSettings.panelView.hideClosed;
    // document.getElementById("panelHideIdle").checked =
    //   res.panelView.hideIdle;
    if (clientSettings.panelView.printerRows) {
      document.getElementById("selectCameraGrid").value = clientSettings.panelView.printerRows;
    } else {
      document.getElementById("selectCameraGrid").value = 2;
    }

    if (clientSettings.dashboard) {
      document.getElementById("currentOperations").checked =
        clientSettings.dashboard.farmActivity.currentOperations;
      document.getElementById("cumulativeTimes").checked =
        clientSettings.dashboard.farmActivity.cumulativeTimes;
      document.getElementById("averageTimes").checked =
        clientSettings.dashboard.farmActivity.averageTimes;

      document.getElementById("printerState").checked =
        clientSettings.dashboard.printerStates.printerState;
      document.getElementById("printerTemps").checked =
        clientSettings.dashboard.printerStates.printerProgress;
      document.getElementById("printerUtilisation").checked =
        clientSettings.dashboard.printerStates.printerUtilisation;
      document.getElementById("printerProgress").checked =
        clientSettings.dashboard.printerStates.printerProgress;
      document.getElementById("currentStatus").checked =
        clientSettings.dashboard.printerStates.currentStatus;

      document.getElementById("currentUtilisation").checked =
        clientSettings.dashboard.farmUtilisation.currentUtilisation;
      document.getElementById("farmUtilisation").checked =
        clientSettings.dashboard.farmUtilisation.farmUtilisation;

      document.getElementById("weeklyUtilisation").checked =
        clientSettings.dashboard.historical.weeklyUtilisation;
      document.getElementById("hourlyTotalTemperatures").checked =
        clientSettings.dashboard.historical.hourlyTotalTemperatures;
      document.getElementById("environmentalHistory").checked =
        clientSettings.dashboard.historical.environmentalHistory;
      document.getElementById("filamentUsageCheck").checked =
        clientSettings.dashboard.historical.filamentUsageByDay;
      document.getElementById("printCompletionCheck").checked =
        clientSettings.dashboard.historical.historyCompletionByDay;
      document.getElementById("filamentUsageOverTimeCheck").checked =
        clientSettings.dashboard.historical.filamentUsageOverTime;
    }

    if (clientSettings.controlSettings) {
      document.getElementById("printerControlFilesFirst").checked =
        clientSettings.controlSettings.filesTop;
    }
  }

  static async update() {
    const opts = {
      panelView: {
        currentOp: document.getElementById("panelCurrentOpOn").checked,
        hideOff: document.getElementById("panelHideOffline").checked,
        hideClosed: document.getElementById("panelHideClosed").checked
        // hideIdle: document.getElementById("panelHideIdle").checked,
      },
      cameraView: {
        cameraRows: document.getElementById("selectCameraGrid").value
      },
      controlSettings: {
        filesTop: document.getElementById("printerControlFilesFirst").checked
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
          {
            x: 0,
            y: 19,
            width: 12,
            height: 8,
            id: "filamentUsageOverTime"
          },
          { x: 0, y: 19, width: 12, height: 8, id: "filamentUsageByDay" },
          {
            x: 0,
            y: 19,
            width: 12,
            height: 8,
            id: "historyCompletionByDay"
          }
        ],
        savedLayout: localStorage.getItem("dashboardConfiguration"),
        farmActivity: {
          currentOperations: document.getElementById("currentOperations").checked,
          cumulativeTimes: document.getElementById("cumulativeTimes").checked,
          averageTimes: document.getElementById("averageTimes").checked
        },
        printerStates: {
          printerState: document.getElementById("printerState").checked,
          printerTemps: document.getElementById("printerTemps").checked,
          printerUtilisation: document.getElementById("printerUtilisation").checked,
          printerProgress: document.getElementById("printerProgress").checked,
          currentStatus: document.getElementById("currentStatus").checked
        },
        farmUtilisation: {
          currentUtilisation: document.getElementById("currentUtilisation").checked,
          farmUtilisation: document.getElementById("farmUtilisation").checked
        },
        historical: {
          weeklyUtilisation: document.getElementById("weeklyUtilisation").checked,
          hourlyTotalTemperatures: document.getElementById("hourlyTotalTemperatures").checked,
          environmentalHistory: document.getElementById("environmentalHistory").checked,
          historyCompletionByDay: document.getElementById("printCompletionCheck").checked,
          filamentUsageByDay: document.getElementById("filamentUsageCheck").checked,
          filamentUsageOverTime: document.getElementById("filamentUsageOverTimeCheck").checked
        }
      }
    };
    await OctoFarmClient.updateClientSettings(opts);
    UI.createAlert("success", "Client settings updated", 3000, "clicked");
    //localStorage.setItem("clientSettings", JSON.stringify(opts));
  }
}
