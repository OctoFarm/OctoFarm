import 'gridstack/dist/gridstack.css';
import OctoFarmClient from '../js/services/octofarm-client.service';
import { bindGraphChangeUpdate, loadGrid } from '../js/pages/dashboard/grid-stack.manager';
import { ChartsManager } from '../js/pages/charts/charts.manager';
import { createClientSSEWorker } from '../js/services/client-worker.service.js';
import { getUsageWeightSeries, toFixedWeightGramFormatter } from '../js/pages/charts/chart.utils';
import { dashboardSSEventHandler, workerURL } from '../js/pages/dashboard/dashboard-sse.handler';

async function updateHistoryGraphs() {
  let historyStatistics = await OctoFarmClient.getHistoryStatistics();

  let historyGraphData = historyStatistics?.history?.historyByDay;
  let filamentUsageByDay = historyStatistics?.history?.totalByDay;
  let filamentUsageOverTime = historyStatistics?.history?.usageOverTime;

  if (!!historyGraphData) {
    await ChartsManager.updatePrintCompletionByDaySeries(historyGraphData);
  }

  if (!!filamentUsageByDay) {
    await ChartsManager.updateFilamentUsageByDayChartSeries(filamentUsageByDay);
  }

  if (!!filamentUsageOverTime) {
    await ChartsManager.updateFilamentOverTimeChartSeries(filamentUsageOverTime);
  }
}

async function initNewGraphs() {
  await ChartsManager.renderDefaultCharts();

  let historyStatistics = await OctoFarmClient.getHistoryStatistics();
  let printCompletionByDay = historyStatistics?.history?.historyByDay;
  let filamentUsageByDay = historyStatistics?.history?.totalByDay;
  let filamentUsageOverTime = historyStatistics?.history?.usageOverTime;

  let yAxisSeries = [];

  if (!!filamentUsageOverTime) {
    filamentUsageOverTime.forEach((_usage, index) => {
      let obj = null;
      if (index === 0) {
        obj = {
          title: {
            text: 'Weight',
          },
          seriesName: filamentUsageOverTime[0]?.name,
          labels: {
            formatter: toFixedWeightGramFormatter,
          },
        };
      } else {
        obj = {
          show: false,
          seriesName: filamentUsageOverTime[0]?.name,
          labels: {
            formatter: toFixedWeightGramFormatter,
          },
        };
      }
      yAxisSeries.push(obj);
    });
    await ChartsManager.renderFilamentUsageOverTimeChart(filamentUsageOverTime, yAxisSeries);
  }

  if (!!filamentUsageByDay) {
    const yAxis = [getUsageWeightSeries('Weight', filamentUsageByDay[0]?.name)];
    await ChartsManager.renderFilamentUsageByDayChart(filamentUsageByDay, yAxis);
  }

  if (!!printCompletionByDay) {
    await ChartsManager.renderPrintCompletionByDay(printCompletionByDay);
  }
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
