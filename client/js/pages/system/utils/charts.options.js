import Calc from "../../../utils/calc";

const title = {
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
    color: "#fff",
  },
};

const chart = {
  type: "donut",
  height: "300px",
  animations: {
    enabled: false,
  },
  background: '0'
};

const theme = {
  mode: "dark",
};

const plotOptions = {
  pie: {
    expandOnClick: true,
    dataLabels: {
      offset: 10,
      minAngleToShowLabel: 15,
    },
  },
};

const stroke = {
  show: false,
};

const noData = {
  text: "Loading...",
};

const legend = {
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
};

const memoryChartOptions = {
  title: title,
  chart: chart,
  theme: theme,
  plotOptions: plotOptions,
  stroke: stroke,
  tooltip: {
    y: {
      formatter(val) {
        return Calc.bytes(val);
      },
    },
  },
  noData: noData,
  series: [],
  labels: ["Other", "OctoFarm", "Free"],
  colors: ["#f39c12", "#3498db", "#00bc8c"],
  legend: legend,
};
const cpuChartOptions = {
  title: title,
  chart: chart,
  theme: theme,
  plotOptions: plotOptions,
  stroke: stroke,
  tooltip: {
    y: {
      formatter(val) {
        return `${Math.round(val * 10) / 10}%`;
      },
    },
  },
  noData: noData,
  series: [],
  labels: ["System", "OctoFarm", "User", "Free"],
  colors: ["#f39c12", "#3498db", "#375a7f", "#00bc8c"],
  legend: legend,
};

export { cpuChartOptions, memoryChartOptions };
