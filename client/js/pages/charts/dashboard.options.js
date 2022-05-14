import {
  clippedPercentageFormatter,
  defaultBackground,
  defaultChartDimensions,
  defaultChartWidth,
  defaultDarkColor,
  defaultDataLabelBackground,
  enableAnimations,
  fullChartDimensions,
  getDefaultWeightDataLabelFormat,
  getHiddenToolTempRepeated,
  getToolTempSeries,
  loadingText,
  noopFormatter,
  noZoom,
  showStroke,
  showToolbar,
  theme,
  toFixedWeightGramFormatter,
  tooltipDataPointFormatter,
  valueToLocaleDateStringFormatter,
  valueToLocaleTimeStringFormatter,
} from "./chart.utils";
import {
  defaultEnvironmentalYAxisAnnotations,
  defaultHeatmapColorScaleOptions,
  defaultTheme,
  environmentalDataColors,
  farmTempColors,
  historyColors,
  rainBow,
  succesCountSeries,
  successRateSeries,
  utilisationConnectionColors,
  utilisationConnectionLabels,
  xAxisConnectionCategories,
} from "./chart.options";
import UI from "../../utils/ui";

const optionsHourlyTemperature = {
  chart: {
    type: "line",
    id: "realtime",
    ...defaultChartDimensions(),
    ...enableAnimations(false),
    ...showToolbar(false),
    ...noZoom(),
    ...defaultBackground(),
  },
  colors: farmTempColors,
  stroke: {
    curve: "smooth",
    width: 2,
  },
  ...showToolbar(false),
  ...theme(),
  ...loadingText(),
  series: [],
  yaxis: [getToolTempSeries("Temp"), ...getHiddenToolTempRepeated(5)],
  xaxis: {
    type: "datetime",
    labels: {
      formatter: valueToLocaleTimeStringFormatter,
    },
  },
};
const optionsWeeklyUtilisationPerDayHeatMap = {
  chart: {
    type: "heatmap",
    id: "realtime",
    ...defaultChartDimensions(),
    animations: {
      enabled: true,
      easing: "linear",
      dynamicAnimation: {
        speed: 1000,
      },
    },
    ...showToolbar(false),
    ...noZoom(),
    ...defaultBackground(),
  },
  ...theme(),
  ...loadingText(),
  series: [],
  dataLabels: {
    enabled: true,
    formatter: clippedPercentageFormatter,
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
    colors: [defaultDarkColor()],
    width: 2,
    dashArray: 0,
  },
  plotOptions: {
    heatmap: {
      ...defaultHeatmapColorScaleOptions,
    },
  },
  legend: {
    markers: {
      offsetX: 0,
      offsetY: 0,
    },
  },
  tooltip: {
    y: {
      formatter: clippedPercentageFormatter,
    },
  },
  xaxis: {
    reversed: true,
  },
};
const currentStatusChartOptions = {
  series: [],
  chart: {
    type: "bar",
    ...defaultChartWidth(),
    height: "85%",
    ...showToolbar(false),
    ...enableAnimations(false),
    ...defaultBackground(),
  },
  ...theme(),
  ...loadingText(),
  plotOptions: {
    bar: {
      horizontal: true,
    },
  },
  dataLabels: {
    enabled: false,
    formatter: noopFormatter,
  },
  xaxis: {
    categories: xAxisConnectionCategories,
  },
  tooltip: {
    theme: defaultTheme,
    x: {
      show: false,
    },
    y: {
      title: {
        formatter: tooltipDataPointFormatter,
      },
    },
  },
};

const optionsUtilisation = {
  chart: {
    type: "donut",
    ...fullChartDimensions(),
    ...enableAnimations(true),
    background: defaultBackground(),
  },
  ...theme(),
  plotOptions: {
    pie: {
      expandOnClick: false,
      dataLabels: {
        offset: 10,
        minAngleToShowLabel: 15,
      },
    },
  },
  ...showStroke(false),
  tooltip: {
    y: {
      formatter: clippedPercentageFormatter,
    },
  },
  ...loadingText,
  dataLabels: {
    enabled: false,
  },
  series: [],
  labels: utilisationConnectionLabels,
  colors: utilisationConnectionColors,
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

const filamentUsageOverTimeChartOptions = {
  chart: {
    type: "line",
    ...defaultChartWidth(),
    height: "250px",
    stacked: true,
    ...enableAnimations(true),
    ...showToolbar(false),
    ...noZoom(),
    ...defaultBackground(),
  },
  dataLabels: {
    enabled: true,
    background: defaultDataLabelBackground(),
    formatter: toFixedWeightGramFormatter,
  },
  colors: rainBow(),
  stroke: {
    width: 2,
    curve: "smooth",
  },
  ...showToolbar(false),
  ...theme(),
  ...loadingText(),
  series: [],
  // Set dynamically
  yaxis: [
    {
      title: {
        text: "Weight",
      },
      labels: {
        formatter: toFixedWeightGramFormatter,
      },
    },
  ],
  xaxis: {
    type: "datetime",
    labels: {
      formatter: valueToLocaleDateStringFormatter,
    },
  },
};
const printCompletionByDayChartOptions = {
  chart: {
    type: "line",
    ...defaultChartWidth(),
    height: "250px",
    ...enableAnimations(true),
    ...showToolbar(false),
    ...noZoom(),
    ...defaultBackground(),
  },
  colors: historyColors,
  dataLabels: {
    enabled: true,
    background: defaultDataLabelBackground(),
  },
  stroke: {
    width: 4,
    curve: "smooth",
  },
  ...showToolbar(false),
  ...theme(),
  ...loadingText(),
  series: [],
  yaxis: [
    succesCountSeries(true),
    succesCountSeries(false),
    succesCountSeries(false),
  ],
  xaxis: {
    type: "category",
    labels: {
      formatter: valueToLocaleDateStringFormatter,
    },
  },
};
const printSuccessRatePerDay = {
  chart: {
    type: "bar",
    stacked: true,
    stackType: "100%",
    ...defaultChartWidth(),
    height: "250px",
    ...enableAnimations(true),
    ...showToolbar(false),
    ...noZoom(),
    ...defaultBackground(),
  },
  colors: historyColors,
  dataLabels: {
    enabled: true,
    background: defaultDataLabelBackground(),
  },
  stroke: {
    width: 4,
    curve: "smooth",
  },
  ...showToolbar(false),
  ...theme(),
  ...loadingText(),
  series: [],
  yaxis: [
    successRateSeries(true),
    successRateSeries(false),
    successRateSeries(false),
  ],
  xaxis: {
    type: "category",
    labels: {
      formatter: valueToLocaleDateStringFormatter,
    },
  },
};

const filamentUsageByDayChartOptions = {
  chart: {
    type: "bar",
    ...defaultChartWidth(),
    height: "250px",
    stacked: true,
    stroke: {
      show: true,
      curve: "smooth",
      lineCap: "butt",
      width: 1,
      dashArray: 0,
    },
    ...enableAnimations(true),
    plotOptions: {
      bar: {
        horizontal: false,
      },
    },
    ...showToolbar(false),
    ...noZoom(),
    background: defaultBackground(),
  },
  dataLabels: getDefaultWeightDataLabelFormat(),
  colors: rainBow(),
  ...showToolbar(false),
  ...theme(),
  ...loadingText(),
  series: [],
  yaxis: [
    {
      title: {
        text: "Weight",
      },
      labels: {
        formatter: toFixedWeightGramFormatter,
      },
    },
  ],
  xaxis: {
    type: "category",
    labels: {
      formatter: valueToLocaleDateStringFormatter,
    },
  },
};

const environmentalDataChartOptions = {
  chart: {
    type: "line",
    id: "realtime",
    ...defaultChartDimensions(),
    ...enableAnimations(false),
    ...showToolbar(false),
    ...noZoom(),
    ...defaultBackground(),
  },
  colors: environmentalDataColors,
  stroke: {
    curve: "smooth",
  },
  ...showToolbar(false),
  ...theme(),
  ...loadingText(),
  series: [],
  // set dynamically by code
  // yaxis: availableStats,
  xaxis: {
    type: "datetime",
    labels: {
      formatter: valueToLocaleTimeStringFormatter,
    },
  },
  annotations: {
    position: "front",
    yaxis: defaultEnvironmentalYAxisAnnotations,
  },
};

const historySparkLineOptions = {
  series: [
    {
      data: [],
    },
  ],
  chart: {
    type: "line",
    width: "100%",
    height: 85,
    sparkline: {
      enabled: true,
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
    text: "No Data to Display",
  },
  colors: ["#3498db"],
  tooltip: {
    fixed: {
      enabled: false,
    },
    x: {
      show: true,
      formatter: "",
    },
    y: {
      formatter: function (value) {
        return UI.generateTime(value);
      },
      title: {
        formatter: () => "",
      },
    },
    marker: {
      show: false,
    },
  },
};

export const dashboardOptions = {
  optionsHourlyTemperature,
  optionsWeeklyUtilisationPerDayHeatMap,
  currentStatusChartOptions,
  optionsCurrentUtilisationChart: optionsUtilisation,
  filamentUsageOverTimeChartOptions,
  filamentUsageByDayChartOptions,
  printCompletionByDayChartOptions,
  environmentalDataChartOptions,
  printSuccessRatePerDay,
  historySparkLineOptions,
};
