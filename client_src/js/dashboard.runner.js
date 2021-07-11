import "gridstack/dist/gridstack.min.css";
import "gridstack/dist/h5/gridstack-dd-native";
import OctoFarmclient from "./lib/octofarm.js";
import {
  bindGraphChangeUpdate,
  loadGrid
} from "./dashboard/grid-stack.manager";
import { ChartsManager } from "./dashboard/charts.manager";
import { createClientSSEWorker } from "./lib/client-worker.js";
import {
  getUsageWeightSeries,
  toFixedWeightGramFormatter
} from "./dashboard/utils/chart.utils";
import { DashUpdate } from "./dashboard/dashboard.updater";
import currentOperations from "./lib/modules/currentOperations";

async function updateHistoryGraphs() {
  let historyStatistics = await OctoFarmclient.getHistoryStatistics();

  let historyGraphData = historyStatistics.history.historyByDay;
  let filamentUsageByDay = historyStatistics.history.totalByDay;
  let filamentUsageOverTime = historyStatistics.history.usageOverTime;

  await ChartsManager.updateFilamentOverTimeChartSeries(filamentUsageOverTime);
  await ChartsManager.updateFilamentUsageByDayChartSeries(filamentUsageByDay);
  await ChartsManager.updatePrintCompletionByDaySeries(historyGraphData);
}

async function initNewGraphs() {
  await ChartsManager.renderDefaultCharts();

  let historyStatistics = await OctoFarmclient.getHistoryStatistics();

  let printCompletionByDay = historyStatistics.history.historyByDay;
  let filamentUsageByDay = historyStatistics.history.totalByDay;
  let filamentUsageOverTime = historyStatistics.history.usageOverTime;

  let yAxisSeries = [];
  filamentUsageOverTime.forEach((usage, index) => {
    let obj = null;
    if (index === 0) {
      obj = {
        title: {
          text: "Weight"
        },
        seriesName: filamentUsageOverTime[0]?.name,
        labels: {
          formatter: toFixedWeightGramFormatter
        }
      };
    } else {
      obj = {
        show: false,
        seriesName: filamentUsageOverTime[0]?.name,
        labels: {
          formatter: toFixedWeightGramFormatter
        }
      };
    }
    yAxisSeries.push(obj);
  });
  await ChartsManager.renderFilamentUsageOverTimeChart(
    filamentUsageOverTime,
    yAxisSeries
  );

  const yAxis = [getUsageWeightSeries("Weight", filamentUsageByDay[0]?.name)];
  await ChartsManager.renderFilamentUsageByDayChart(filamentUsageByDay, yAxis);
  await ChartsManager.renderPrintCompletionByDay(printCompletionByDay);
}

const workerURL = "/dashboardInfo/get/";

async function workerEventFunction(data) {
  if (data != false) {
    const currentOperationsData = data.currentOperations;
    const printerInfo = data.printerInformation;
    const dashboard = data.dashStatistics;
    const dashboardSettings = data.dashboardSettings;
    if (dashboardSettings.farmActivity.currentOperations) {
      currentOperations(
        currentOperationsData.operations,
        currentOperationsData.count,
        printerInfo
      );
    }

    DashUpdate.farmInformation(
      dashboard.timeEstimates,
      dashboard.utilisationGraph,
      dashboard.temperatureGraph,
      dashboardSettings
    );
    if (dashboardSettings.farmUtilisation.farmUtilisation) {
      DashUpdate.farmUtilisation(dashboard.farmUtilisation);
    }

    DashUpdate.currentStatusAndUtilisation(
      dashboard.currentStatus,
      dashboard.currentUtilisation,
      dashboardSettings.printerStates.currentStatus,
      dashboardSettings.farmUtilisation.currentUtilisation
    );

    if (dashboardSettings.printerStates.printerState) {
      DashUpdate.printerStatus(dashboard.printerHeatMaps.heatStatus);
    }

    if (dashboardSettings.printerStates.printerProgress) {
      DashUpdate.printerProgress(dashboard.printerHeatMaps.heatProgress);
    }
    if (dashboardSettings.printerStates.printerTemps) {
      DashUpdate.printerTemps(dashboard.printerHeatMaps.heatTemps);
    }
    if (dashboardSettings.printerStates.printerUtilisation) {
      DashUpdate.printerUptime(dashboard.printerHeatMaps.heatUtilisation);
    }

    if (dashboardSettings.historical.environmentalHistory) {
      await DashUpdate.environmentalData(dashboard.enviromentalData);
    }
  } else {
    UI.createAlert(
      "warning",
      "Server Events closed unexpectedly... Retying in 10 seconds",
      10000,
      "Clicked"
    );
  }
}

createClientSSEWorker(workerURL, workerEventFunction);

loadGrid()
  .then(async () => {
    await initNewGraphs();
  })
  .then(() => {
    bindGraphChangeUpdate(async function (event, items) {
      await updateHistoryGraphs();
    });
  });
