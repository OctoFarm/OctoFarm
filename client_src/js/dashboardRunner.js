import "@babel/polyfill";
import Calc from "./lib/functions/calc.js";
import currentOperations from "./lib/modules/currentOperations.js";
import UI from "./lib/functions/ui.js";
import OctoFarmclient from "./lib/octofarm.js";

//On Load API call for new graphs
let enviromentalData,
  systemFarmTemp,
  activityHeatChart,
  currentActivityChart,
  currentUtilisation,
  usageOverFilamentTime,
  historyGraph,
  filamentUsage;

let initNewGraphs = async function () {
  //Load Graph
  let today = new Date();
  today = new Date(today);

  let lastThirtyDays = [];
  for (let i = 0; i < 30; i++) {
    let day = (i + 1) * 1000;
    let previousDay = new Date(today - day * 60 * 60 * 24 * 2);
    previousDay = await previousDay;
    // previousDay = previousDay.split("/");
    // lastThirtyDays.push(
    //   `${previousDay[0]}/${previousDay[1]}/${previousDay[2]}`
    // );
    lastThirtyDays.push(previousDay);
  }

  lastThirtyDays.sort();
  let lastThirtyDaysText = [];
  lastThirtyDays.forEach((day) => {
    lastThirtyDaysText.push(day.getTime());
  });

  let historyStatistics = await OctoFarmclient.get("history/statisticsData");
  historyStatistics = await historyStatistics.json();

  let historyGraphData = historyStatistics.history.historyByDay;
  let usageByDay = historyStatistics.history.totalByDay;
  let usageOverTime = historyStatistics.history.usageOverTime;

  let yAxisSeries = [];
  usageOverTime.forEach((usage, index) => {
    let obj = null;
    if (index === 0) {
      obj = {
        title: {
          text: "Weight",
        },
        seriesName: usageOverTime[0]?.name,
        labels: {
          formatter: function (val) {
            if (val !== null) {
              return val.toFixed(2) + "g";
            }
          },
        },
      };
    } else {
      obj = {
        show: false,
        seriesName: usageOverTime[0]?.name,
        labels: {
          formatter: function (val) {
            if (val !== null) {
              return val.toFixed(2) + "g";
            }
          },
        },
      };
    }

    yAxisSeries.push(obj);
  });

  const usageOverTimeOptions = {
    chart: {
      type: "bar",
      width: "100%",
      height: "250px",
      stacked: true,
      stroke: {
        show: true,
        curve: "smooth",
        lineCap: "butt",
        width: 1,
        dashArray: 0,
      },
      animations: {
        enabled: true,
      },
      plotOptions: {
        bar: {
          horizontal: false,
        },
      },
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      background: "#303030",
    },
    dataLabels: {
      enabled: false,
      background: {
        enabled: true,
        foreColor: "#000",
        padding: 1,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: "#fff",
        opacity: 0.9,
      },
      formatter: function (val, opts) {
        if (val !== null) {
          return val.toFixed(0) + "g";
        }
      },
    },
    colors: [
      "#ff0000",
      "#ff8400",
      "#ffd500",
      "#88ff00",
      "#00ff88",
      "#00b7ff",
      "#4400ff",
      "#8000ff",
      "#ff00f2",
    ],
    toolbar: {
      show: false,
    },
    theme: {
      mode: "dark",
    },
    noData: {
      text: "Loading...",
    },
    series: [],
    yaxis: [
      {
        title: {
          text: "Weight",
        },
        seriesName: usageOverTime[0]?.name,
        labels: {
          formatter: function (val) {
            if (val !== null) {
              return val.toFixed(0) + "g";
            }
          },
        },
      },
    ],
    xaxis: {
      type: "category",
      categories: lastThirtyDaysText,
      tickAmount: 15,
      labels: {
        formatter: function (value, timestamp) {
          let dae = new Date(value).toLocaleDateString();

          return dae; // The formatter function overrides format property
        },
      },
    },
  };
  const usageOverFilamentTimeOptions = {
    chart: {
      type: "line",
      width: "100%",
      height: "250px",
      stacked: true,
      animations: {
        enabled: true,
      },
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      background: "#303030",
    },
    dataLabels: {
      enabled: true,
      background: {
        enabled: true,
        foreColor: "#000",
        padding: 1,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: "#fff",
        opacity: 0.9,
      },
      formatter: function (val, opts) {
        if (val !== null) {
          return val.toFixed(0) + "g";
        }
      },
    },
    colors: [
      "#ff0000",
      "#ff8400",
      "#ffd500",
      "#88ff00",
      "#00ff88",
      "#00b7ff",
      "#4400ff",
      "#8000ff",
      "#ff00f2",
    ],
    toolbar: {
      show: false,
    },
    stroke: {
      width: 2,
      curve: "smooth",
    },
    theme: {
      mode: "dark",
    },
    noData: {
      text: "Loading...",
    },
    series: [],
    yaxis: yAxisSeries,
    xaxis: {
      type: "category",
      categories: lastThirtyDaysText,
      tickAmount: 15,
      labels: {
        formatter: function (value, timestamp) {
          let dae = new Date(value).toLocaleDateString();

          return dae; // The formatter function overrides format property
        },
      },
    },
  };
  const historyGraphOptions = {
    chart: {
      type: "line",
      width: "100%",
      height: "250px",
      animations: {
        enabled: true,
      },
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      background: "#303030",
    },
    colors: ["#00bc8c", "#f39c12", "#e74c3c"],
    dataLabels: {
      enabled: true,
      background: {
        enabled: true,
        foreColor: "#000",
        padding: 1,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: "#fff",
        opacity: 0.9,
      },
    },
    // colors: ["#295efc", "#37ff00", "#ff7700", "#ff1800", "#37ff00", "#ff1800"],
    toolbar: {
      show: false,
    },
    stroke: {
      width: 4,
      curve: "smooth",
    },
    theme: {
      mode: "dark",
    },
    noData: {
      text: "Loading...",
    },
    series: [],
    yaxis: [
      {
        title: {
          text: "Count",
        },
        seriesName: "Success",
        labels: {
          formatter: function (val) {
            if (val !== null) {
              return val.toFixed(0);
            }
          },
        },
      },
      {
        title: {
          text: "Count",
        },
        seriesName: "Success",
        labels: {
          formatter: function (val) {
            if (val !== null) {
              return val.toFixed(0);
            }
          },
        },
        show: false,
      },
      {
        title: {
          text: "Count",
        },
        seriesName: "Success",
        labels: {
          formatter: function (val) {
            if (val !== null) {
              return val.toFixed(0);
            }
          },
        },
        show: false,
      },
    ],
    xaxis: {
      type: "datetime",
      tickAmount: 10,
      labels: {
        formatter: function (value, timestamp) {
          let dae = new Date(timestamp);
          return dae.toLocaleDateString(); // The formatter function overrides format property
        },
      },
    },
  };

  if (document.querySelector("#usageOverFilamentTime")) {
    usageOverFilamentTime = new ApexCharts(
      document.querySelector("#usageOverFilamentTime"),
      usageOverFilamentTimeOptions
    );
    usageOverFilamentTime.render();

    usageOverFilamentTime.updateSeries(usageOverTime);
  }
  if (document.querySelector("#usageOverTime")) {
    filamentUsage = new ApexCharts(
      document.querySelector("#usageOverTime"),
      usageOverTimeOptions
    );
    filamentUsage.render();
    filamentUsage.updateSeries(usageByDay);
  }

  if (document.querySelector("#printCompletionByDay")) {
    historyGraph = new ApexCharts(
      document.querySelector("#printCompletionByDay"),
      historyGraphOptions
    );
    historyGraph.render();
    historyGraph.updateSeries(historyGraphData);
  }
};

// Setup charts test
const optionsFarmTemp = {
  chart: {
    type: "line",
    id: "realtime",
    width: "100%",
    height: "90%",
    animations: {
      enabled: false,
    },
    toolbar: {
      show: false,
    },
    zoom: {
      enabled: false,
    },
    background: "#303030",
  },
  colors: ["#fcc329", "#ff1500", "#009cff", "#ff1800", "#37ff00", "#ff1800"],
  stroke: {
    curve: "smooth",
  },
  toolbar: {
    show: false,
  },
  theme: {
    mode: "dark",
  },
  noData: {
    text: "Loading...",
  },
  series: [],
  yaxis: [
    {
      title: {
        text: "Temp",
      },
      seriesName: "Actual Tool",
      labels: {
        formatter(value) {
          return `${value}°C`;
        },
      },
    },
    {
      seriesName: "Actual Tool",
      show: false,
      labels: {
        formatter(value) {
          return `${value}°C`;
        },
      },
    },
    {
      seriesName: "Actual Tool",
      show: false,
      labels: {
        formatter(value) {
          return `${value}°C`;
        },
      },
    },
    {
      seriesName: "Actual Tool",
      show: false,
      labels: {
        formatter(value) {
          return `${value}°C`;
        },
      },
    },
    {
      seriesName: "Actual Tool",
      show: false,
      labels: {
        formatter(value) {
          return `${value}°C`;
        },
      },
    },
    {
      seriesName: "Actual Tool",
      show: false,
      labels: {
        formatter(value) {
          return `${value}°C`;
        },
      },
    },
  ],
  xaxis: {
    type: "datetime",
    labels: {
      formatter(value) {
        const date = new Date(value);
        return date.toLocaleTimeString();
      },
    },
  },
};
const optionsHeatChart = {
  chart: {
    type: "heatmap",
    id: "realtime",
    width: "100%",
    height: "90%",
    animations: {
      enabled: true,
      easing: "linear",
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
    background: "#303030",
  },
  theme: {
    mode: "dark",
  },
  noData: {
    text: "Loading...",
  },
  series: [],
  dataLabels: {
    enabled: true,
    formatter(val) {
      return `${Math.round(val * 10) / 10}%`;
    },
    style: {
      fontSize: "14px",
      fontFamily: "Helvetica, Arial, sans-serif",
      fontWeight: "bold",
      colors: ["#000000"],
    },
  },
  stroke: {
    show: true,
    curve: "smooth",
    lineCap: "butt",
    colors: ["#303030"],
    width: 2,
    dashArray: 0,
  },
  plotOptions: {
    heatmap: {
      shadeIntensity: 0.5,
      radius: 0,
      useFillColorAsStroke: true,
      colorScale: {
        ranges: [
          {
            from: 0,
            to: 1,
            name: "none",
            color: "#848484",
          },
          {
            from: 2,
            to: 25,
            name: "low",
            color: "#375a7f",
          },
          {
            from: 26,
            to: 60,
            name: "medium",
            color: "#f39c12",
          },
          {
            from: 61,
            to: 75,
            name: "high",
            color: "#00bc8c",
          },
          {
            from: 76,
            to: 100,
            name: "extreme",
            color: "#e74c3c",
          },
        ],
      },
    },
  },
  tooltip: {
    y: {
      formatter(val) {
        return `${Math.round(val * 10) / 10}%`;
      },
    },
  },
  xaxis: {
    reversed: true,
  },
};
const optionsRadar = {
  series: [],
  chart: {
    type: "bar",
    width: "100%",
    height: "85%",
    toolbar: {
      show: false,
    },
    animations: {
      enabled: false,
    },
    background: "#303030",
  },
  theme: {
    mode: "dark",
  },
  plotOptions: {
    bar: {
      horizontal: true,
    },
  },
  noData: {
    text: "Loading...",
  },
  dataLabels: {
    enabled: false,
    formatter(val) {
      return val;
    },
  },
  xaxis: {
    categories: ["Active", "Complete", "Idle", "Disconnected", "Offline"],
  },
  tooltip: {
    theme: "dark",
    x: {
      show: false,
    },
    y: {
      title: {
        formatter(val, opt) {
          return `${opt.w.globals.labels[opt.dataPointIndex]}:  `;
        },
      },
    },
  },
};
const optionsUtilisation = {
  chart: {
    type: "donut",
    width: "100%",
    height: "100%",
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
  labels: ["Active", "Idle", "Offline"],
  colors: ["#00bc8c", "#444", "#e74c3c"],
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

if (document.querySelector("#farmTempMap")) {
  systemFarmTemp = new ApexCharts(
    document.querySelector("#farmTempMap"),
    optionsFarmTemp
  );
  systemFarmTemp.render();
}
if (document.querySelector("#daysActivityHeatMap")) {
  activityHeatChart = new ApexCharts(
    document.querySelector("#daysActivityHeatMap"),
    optionsHeatChart
  );
  activityHeatChart.render();
}
if (document.querySelector("#currentActivity")) {
  currentActivityChart = new ApexCharts(
    document.querySelector("#currentActivity"),
    optionsRadar
  );
  currentActivityChart.render();
}
if (document.querySelector("#currentUtilisation")) {
  currentUtilisation = new ApexCharts(
    document.querySelector("#currentUtilisation"),
    optionsUtilisation
  );
  currentUtilisation.render();
}

let worker = null;

function createWebWorker() {
  worker = new Worker("/assets/js/workers/dashboardWorker.min.js");
  worker.onmessage = async function (event) {
    if (event.data != false) {
      const currentOperationsData = event.data.currentOperations;
      const printerInfo = event.data.printerInformation;
      const dashboard = event.data.dashStatistics;
      const dashboardSettings = event.data.dashboardSettings;
      if (dashboardSettings.farmActivity.currentOperations) {
        currentOperations(
          currentOperationsData.operations,
          currentOperationsData.count,
          printerInfo
        );
      }

      dashUpdate.farmInformation(
        dashboard.timeEstimates,
        dashboard.utilisationGraph,
        dashboard.temperatureGraph,
        dashboardSettings
      );
      if (dashboardSettings.farmUtilisation.farmUtilisation) {
        dashUpdate.farmUtilisation(dashboard.farmUtilisation);
      }

      dashUpdate.currentActivity(
        dashboard.currentStatus,
        dashboard.currentUtilisation,
        dashboardSettings.printerStates.currentStatus,
        dashboardSettings.farmUtilisation.currentUtilisation
      );

      if (dashboardSettings.printerStates.printerState) {
        dashUpdate.printerStatus(dashboard.printerHeatMaps.heatStatus);
      }

      if (dashboardSettings.printerStates.printerProgress) {
        dashUpdate.printerProgress(dashboard.printerHeatMaps.heatProgress);
      }
      if (dashboardSettings.printerStates.printerTemps) {
        dashUpdate.printerTemps(dashboard.printerHeatMaps.heatTemps);
      }
      if (dashboardSettings.printerStates.printerUtilisation) {
        dashUpdate.printerUptime(dashboard.printerHeatMaps.heatUtilisation);
      }

      if (dashboardSettings.historical.environmentalHistory) {
        dashUpdate.envriromentalData(dashboard.enviromentalData);
      }
      let historyStatistics = await OctoFarmclient.get(
        "history/statisticsData"
      );
      historyStatistics = await historyStatistics.json();

      let historyGraphData = historyStatistics.history.historyByDay;
      let usageByDay = historyStatistics.history.totalByDay;
      let usageOverTime = historyStatistics.history.usageOverTime;

      if (document.querySelector("#usageOverFilamentTime")) {
        usageOverFilamentTime.updateSeries(usageOverTime);
      }
      if (document.querySelector("#usageOverTime")) {
        filamentUsage.updateSeries(usageByDay);
      }

      if (document.querySelector("#printCompletionByDay")) {
        historyGraph.updateSeries(historyGraphData);
      }
    } else {
      UI.createAlert(
        "warning",
        "Server Events closed unexpectedly... Retying in 10 seconds",
        10000,
        "Clicked"
      );
    }
  };
}
function handleVisibilityChange() {
  if (document.hidden) {
    if (worker !== null) {
      console.log("Screen Abandonded, closing web worker...");
      worker.terminate();
      worker = null;
    }
  } else {
    if (worker === null) {
      console.log("Screen resumed... opening web worker...");
      createWebWorker();
    }
  }
}

document.addEventListener("visibilitychange", handleVisibilityChange, false);

// Setup webWorker
if (window.Worker) {
  // Yes! Web worker support!
  try {
    if (worker === null) {
      createWebWorker();
    }
  } catch (e) {
    console.log(e);
  }
} else {
  // Sorry! No Web Worker support..
  console.log("Web workers not available... sorry!");
}

let envrioExists = false;

class dashUpdate {
  static envriromentalData(data) {
    let enviromentalData;
    let optionsEnviromentalData;
    let availableStats = [];
    if (!envrioExists) {
      for (let i = 0; i < data.length; i++) {
        if (data[i].data.length !== 0) {
          const tempLabel = {
            title: {
              text: "Temp",
            },
            seriesName: "Temperature",
            labels: {
              formatter(value) {
                if (value === null) {
                  return "";
                } else {
                  return `${value}°C`;
                }
              },
            },
            min: 0,
            max: 45,
          };
          const humLabel = {
            title: {
              text: "Humidity",
            },
            opposite: true,
            seriesName: "Humidity",
            show: true,
            labels: {
              formatter(value) {
                if (value === null) {
                  return "";
                } else {
                  return `${value} %`;
                }
              },
            },
            min: 0,
            max: 100,
          };
          const pressLabel = {
            title: {
              text: "Pressure",
            },
            opposite: true,
            seriesName: "Pressure",
            show: true,
            labels: {
              formatter(value) {
                if (value === null) {
                  return "";
                } else {
                  return `${value} Pa`;
                }
              },
            },
            min: 0,
            max: 1100,
          };
          const iaqLabel = {
            title: {
              text: "Indoor Air Quality",
            },
            opposite: false,
            seriesName: "IAQ",
            show: true,
            min: 0,
            max: 500,
            labels: {
              formatter(value) {
                let state = null;
                if (value === null) {
                  return "";
                } else {
                  if (Calc.isBetween(value, 0, 50)) {
                    state = "Excellent";
                  }
                  if (Calc.isBetween(value, 51, 100)) {
                    state = "Good";
                  }
                  if (Calc.isBetween(value, 101, 150)) {
                    state = "Lightly Polluted";
                  }
                  if (Calc.isBetween(value, 151, 200)) {
                    state = "Moderately Polluted";
                  }
                  if (Calc.isBetween(value, 201, 250)) {
                    state = "Heavily Polluted";
                  }
                  if (Calc.isBetween(value, 251, 350)) {
                    state = "Severely Polluted";
                  }
                  if (Calc.isBetween(value, 350, 500)) {
                    state = "Extremely Polluted";
                  }
                }
                return `${value}: ${state}`;
              },
            },
          };

          if (data[i].name === "Temperature") {
            availableStats.push(tempLabel);
          }
          if (data[i].name === "Humidity") {
            availableStats.push(humLabel);
          }
          if (data[i].name === "Pressure") {
            availableStats.push(pressLabel);
          }
          if (data[i].name === "IAQ") {
            availableStats.push(iaqLabel);
          }
        }
      }
      if (availableStats.length !== 0) {
        optionsEnviromentalData = {
          chart: {
            type: "line",
            id: "realtime",
            height: "90%",
            width: "100%",
            animations: {
              enabled: false,
            },
            toolbar: {
              show: false,
            },
            zoom: {
              enabled: false,
            },
            background: "#303030",
          },
          colors: ["#ff1500", "#324bca", "#caa932", "#49ca32"],
          stroke: {
            curve: "smooth",
          },
          toolbar: {
            show: true,
          },
          theme: {
            mode: "dark",
          },
          noData: {
            text: "Loading...",
          },
          series: [],
          yaxis: availableStats,

          xaxis: {
            type: "datetime",
            labels: {
              formatter(value) {
                const date = new Date(value);
                const formatTime = date.toLocaleTimeString();
                return formatTime;
              },
            },
          },
          annotations: {
            position: "front",
            yaxis: [
              {
                y: 0,
                y2: 50,
                yAxisIndex: 3,
                borderColor: "#24571f",
                fillColor: "#133614",
              },
              {
                y: 51,
                y2: 100,
                yAxisIndex: 3,
                borderColor: "#457a24",
                fillColor: "#31561a",
              },
              {
                y: 101,
                y2: 150,
                yAxisIndex: 3,
                borderColor: "#7a6f24",
                fillColor: "#564f1a",
              },
              {
                y: 151,
                y2: 200,
                yAxisIndex: 3,
                borderColor: "#5c3421",
                fillColor: "#3b3015",
              },
              {
                y: 201,
                y2: 250,
                yAxisIndex: 3,
                borderColor: "#5c2121",
                fillColor: "#3b1515",
              },
              {
                y: 251,
                y2: 350,
                yAxisIndex: 3,
                borderColor: "#37215c",
                fillColor: "#23153b",
              },
              {
                y: 350,
                yAxisIndex: 3,
                borderColor: "#280000",
                fillColor: "#000000",
              },
            ],
          },
        };
        if (document.querySelector("#enviromentalHistory")) {
          enviromentalData = new ApexCharts(
            document.querySelector("#enviromentalHistory"),
            optionsEnviromentalData
          );
          enviromentalData.render();
        }
      }

      envrioExists = true;
    }
    if (availableStats.length !== 0) {
      enviromentalData.updateSeries(data);
      let state = null;
      let impact = "";
      let suggestedActions = "";
      const airQualityElement = document.getElementById(
        "indoorAirQualityAlert"
      );
      if (data[3].data.length > 0) {
        const lastValue = data[3].data[data[3].data.length - 1].y;
        if (airQualityElement.classList.contains("d-none")) {
          airQualityElement.classList.remove("d-none");
        }
        if (Calc.isBetween(lastValue, 0, 50)) {
          state = "<i class=\"fas fa-check-circle textComplete\"></i> Excellent";
          impact = "Pure air; best for well-being";
          suggestedActions = "";
        }
        if (Calc.isBetween(lastValue, 51, 100)) {
          state = "<i class=\"fas fa-check-circle\"></i> Good";
          impact = "No irritation or impact on well-being";
          suggestedActions = "";
        }
        if (Calc.isBetween(lastValue, 101, 150)) {
          state =
            "<i class=\"fas fa-exclamation-triangle\"></i>  Lightly Polluted";
          impact = "Reduction of well-being possible";
          suggestedActions = "Ventilation suggested";
        }
        if (Calc.isBetween(lastValue, 151, 200)) {
          state =
            "<i class=\"fas fa-exclamation-triangle\"></i>  Moderately Polluted";
          impact = "More significant irritation possible";
          suggestedActions = "Increase ventilation with clean air";
        }
        if (Calc.isBetween(lastValue, 201, 250)) {
          state =
            "<i class=\"fas fa-exclamation-triangle\"></i>  Heavily Polluted";
          impact =
            "Exposition might lead to effects like headache depending on type of VOCs";
          suggestedActions = "Optimize ventilation";
        }
        if (Calc.isBetween(lastValue, 251, 350)) {
          state =
            "<i class=\"fas fa-exclamation-triangle\"></i>  Severely Polluted";
          impact = "More severe health issue possible if harmful VOC present";
          suggestedActions =
            "Contamination should be identified if level is reached even w/o presence of people; maximize ventilation & reduce attendance";
        }
        if (Calc.isBetween(lastValue, 350, 500)) {
          state =
            "<i class=\"fas fa-exclamation-triangle\"></i>  Extremely Polluted";
          impact = "Headaches, additional neurotoxic effects possible";
          suggestedActions =
            "Contamination needs to be identified; avoid presence in room and maximize ventilation";
        }
        airQualityElement.innerHTML = `Indoor Air Quality: ${lastValue} ${state}`;
        airQualityElement.title = `${impact}: ${suggestedActions}`;
      }
    }
  }
  static printerStatus(data) {
    const currentStatus = document.getElementById("currentStatus");
    currentStatus.innerHTML = "";
    for (let d = 0; d < data.length; d++) {
      currentStatus.insertAdjacentHTML("beforeend", data[d]);
    }
  }

  static printerProgress(data) {
    const currentStatus = document.getElementById("currentProgress");
    currentStatus.innerHTML = "";
    for (let d = 0; d < data.length; d++) {
      currentStatus.insertAdjacentHTML("beforeend", data[d]);
    }
  }

  static printerTemps(data) {
    const currentStatus = document.getElementById("currentTemps");
    currentStatus.innerHTML = "";
    for (let d = 0; d < data.length; d++) {
      currentStatus.insertAdjacentHTML("beforeend", data[d]);
    }
  }

  static printerUptime(data) {
    const currentStatus = document.getElementById("currentUptime");
    currentStatus.innerHTML = "";
    for (let d = 0; d < data.length; d++) {
      currentStatus.insertAdjacentHTML("beforeend", data[d]);
    }
  }

  static farmInformation(
    farmInfo,
    heatMap,
    temperatureGraph,
    dashboardSettings
  ) {
    if (dashboardSettings.farmActivity.averageTimes) {
      document.getElementById("avgEstimatedTime").innerHTML = Calc.generateTime(
        farmInfo.averageEstimated
      );
      document.getElementById("avgRemainingTime").innerHTML = Calc.generateTime(
        farmInfo.averageRemaining
      );
      document.getElementById("avgElapsedTime").innerHTML = Calc.generateTime(
        farmInfo.averageElapsed
      );
      avgRemainingProgress.style.width = `${Calc.toFixed(
        farmInfo.averagePercentRemaining,
        2
      )}%`;
      avgRemainingProgress.innerHTML = `${Calc.toFixed(
        farmInfo.averagePercentRemaining,
        2
      )}%`;
      avgElapsed.style.width = `${Calc.toFixed(farmInfo.averagePercent, 2)}%`;
      avgElapsed.innerHTML = `${Calc.toFixed(farmInfo.averagePercent, 2)}%`;
    }

    if (dashboardSettings.farmActivity.cumulativeTimes) {
      document.getElementById("cumEstimatedTime").innerHTML = Calc.generateTime(
        farmInfo.totalEstimated
      );
      document.getElementById("cumRemainingTime").innerHTML = Calc.generateTime(
        farmInfo.totalRemaining
      );
      document.getElementById("cumElapsedTime").innerHTML = Calc.generateTime(
        farmInfo.totalElapsed
      );

      cumRemainingProgress.style.width = `${Calc.toFixed(
        farmInfo.cumulativePercentRemaining,
        2
      )}%`;
      cumRemainingProgress.innerHTML = `${Calc.toFixed(
        farmInfo.cumulativePercentRemaining,
        2
      )}%`;
      cumElapsed.style.width = `${Calc.toFixed(
        farmInfo.cumulativePercent,
        2
      )}%`;
      cumElapsed.innerHTML = `${Calc.toFixed(farmInfo.cumulativePercent, 2)}%`;
    }

    if (dashboardSettings.historical.hourlyTotalTemperatures) {
      systemFarmTemp.updateSeries(temperatureGraph);
      document.getElementById("globalTemp").innerHTML = `
            <i class="fas fa-temperature-high"></i> Total Temperature: ${Calc.toFixed(
              farmInfo.totalFarmTemp,
              0
            )} °C
             `;
    }
    if (dashboardSettings.historical.weeklyUtilisation) {
      activityHeatChart.updateSeries(heatMap);
    }
  }

  static currentActivity(
    currentStatus,
    currentActivity,
    settingsActivity,
    settingsUtilisation
  ) {
    if (settingsUtilisation) {
      currentUtilisation.updateSeries(currentStatus);
    }

    if (settingsActivity) {
      currentActivityChart.updateSeries(currentActivity);
    }
  }

  static farmUtilisation(stats) {
    const activeHours = document.getElementById("activeHours");
    activeHours.innerHTML = `<i class="fas fa-square text-success"></i> <b>Active: </b> ${Calc.generateTime(
      stats.activeHours / 1000
    )}`;
    const idleHours = document.getElementById("idleHours");
    idleHours.innerHTML = `<i class="fas fa-square text-secondary"></i> <b>Idle Hours: </b> ${Calc.generateTime(
      stats.idleHours / 1000
    )}`;
    const failedHours = document.getElementById("failedHours");
    failedHours.innerHTML = `<i class="fas fa-square text-warning"></i> <b>Failed Hours: </b>${Calc.generateTime(
      stats.failedHours / 1000
    )}`;
    const offlineHours = document.getElementById("offlineHours");
    offlineHours.innerHTML = `<i class="fas fa-square text-danger"></i> <b>Offline Hours: </b>${Calc.generateTime(
      stats.offlineHours / 1000
    )}`;
    const activeProgress = document.getElementById("activeProgress");

    activeProgress.style.width = `${Calc.toFixed(
      stats.activeHoursPercent,
      0
    )}%`;
    activeProgress.innerHTML = `${Calc.toFixed(stats.activeHoursPercent, 0)}%`;
    const idleProgress = document.getElementById("idleProgress");
    idleProgress.style.width = `${Calc.toFixed(stats.idleHoursPercent, 0)}%`;
    idleProgress.innerHTML = `${Calc.toFixed(stats.idleHoursPercent, 0)}%`;
    const failedProgress = document.getElementById("failedProgress");
    failedProgress.style.width = `${Calc.toFixed(
      stats.failedHoursPercent,
      0
    )}%`;
    failedProgress.innerHTML = `${Calc.toFixed(stats.failedHoursPercent, 0)}%`;
    const offlineProgress = document.getElementById("offlineProgress");
    offlineProgress.style.width = `${Calc.toFixed(
      stats.offlineHoursPercent,
      0
    )}%`;
    offlineProgress.innerHTML = `${Calc.toFixed(
      stats.offlineHoursPercent,
      0
    )}%`;
  }
}

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
async function loadGrid() {
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
initNewGraphs();
grid.on("change", async function (event, items) {
  saveGrid();
  let historyStatistics = await OctoFarmclient.get("history/statisticsData");
  historyStatistics = await historyStatistics.json();

  let historyGraphData = historyStatistics.history.historyByDay;
  let usageByDay = historyStatistics.history.totalByDay;
  let usageOverTime = historyStatistics.history.usageOverTime;

  if (document.querySelector("#usageOverFilamentTime")) {
    usageOverFilamentTime.updateSeries(usageOverTime);
  }
  if (document.querySelector("#usageOverTime")) {
    filamentUsage.updateSeries(usageByDay);
  }

  if (document.querySelector("#printCompletionByDay")) {
    historyGraph.updateSeries(historyGraphData);
  }
});
