import "gridstack/dist/gridstack.min.css";
import "gridstack/dist/h5/gridstack-dd-native";
import OctoFarmClient from "./services/octofarm-client.service";
import { bindGraphChangeUpdate, loadGrid } from "./pages/dashboard/grid-stack.manager";
import { ChartsManager } from "./pages/dashboard/charts.manager";
import { createClientSSEWorker } from "./services/client-worker.service.js";
import {
  getUsageWeightSeries,
  toFixedWeightGramFormatter
} from "./pages/dashboard/utils/chart.utils";
import { dashboardSSEventHandler, workerURL } from "./pages/dashboard/dashboard-sse.handler";

async function updateHistoryGraphs() {
  let historyStatistics = await OctoFarmClient.getHistoryStatistics();

  let historyGraphData = historyStatistics.history.historyByDay;
  let filamentUsageByDay = historyStatistics.history.totalByDay;
  let filamentUsageOverTime = historyStatistics.history.usageOverTime;

  await ChartsManager.updateFilamentOverTimeChartSeries(filamentUsageOverTime);
  await ChartsManager.updateFilamentUsageByDayChartSeries(filamentUsageByDay);
  await ChartsManager.updatePrintCompletionByDaySeries(historyGraphData);
}

async function initNewGraphs() {
  await ChartsManager.renderDefaultCharts();

  let historyStatistics = await OctoFarmClient.getHistoryStatistics();

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
  await ChartsManager.renderFilamentUsageOverTimeChart(filamentUsageOverTime, yAxisSeries);

  const yAxis = [getUsageWeightSeries("Weight", filamentUsageByDay[0]?.name)];
  await ChartsManager.renderFilamentUsageByDayChart(filamentUsageByDay, yAxis);
  await ChartsManager.renderPrintCompletionByDay(printCompletionByDay);
}

createClientSSEWorker(workerURL, dashboardSSEventHandler);

loadGrid()
  .then(async () => {
    await initNewGraphs();
  })
  .then(() => {
    bindGraphChangeUpdate(async function (event, items) {
      await updateHistoryGraphs();
    });
  });
