// eslint-disable-next-line import/extensions
import Calc from './lib/functions/calc.js';
// eslint-disable-next-line import/extensions
import currentOperations from './lib/modules/currentOperations.js';

// Setup charts
const optionsFarmTemp = {
    chart: {
        type: "line",
        id: "realtime",
        height: "333px",
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
        height: "333px",
        width: "100%",
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
            shadeIntensity: 0.7,
            radius: 0,
            useFillColorAsStroke: false,
            colorScale: {
                ranges: [
                    {
                        from: 0,
                        to: 1,
                        name: "none",
                        color: "#444",
                    },
                    {
                        from: 1.1,
                        to: 25,
                        name: "low",
                        color: "#375a7f",
                    },
                    {
                        from: 25.1,
                        to: 60,
                        name: "medium",
                        color: "#f39c12",
                    },
                    {
                        from: 60.1,
                        to: 75,
                        name: "high",
                        color: "#00bc8c",
                    },
                    {
                        from: 75.1,
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
        height: "180px",
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
const optionsEnviromentalData = {
    chart: {
        type: "line",
        id: "realtime",
        height: "250px",
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
    colors: ["#ff1500", "#324bca", "#49ca32"],
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
    yaxis: [
        {
            title: {
                text: "Temp",
            },
            seriesName: "Temperature",
            labels: {
                formatter(value) {
                    return `${value}°C`;
                },
            },
            min: 0,
            max: 50,
        },
        {
            title: {
                text: "Humidity",
            },
            opposite: true,
            seriesName: "Humidity",
            show: true,
            labels: {
                formatter(value) {
                    return `${value} %`;
                },
            },
            min: 0,
            max: 100,
        },
        {
            title: {
                text: "Indoor Air Quality",
            },
            opposite: true,
            seriesName: "IAQ",
            show: false,
            labels: {
                formatter(value) {
                    let state = null;
                    if(Calc.isBetween(value, 0, 50)){
                        state = "Excellent";
                    }
                    if(Calc.isBetween(value, 51, 100)){
                        state = "Good";
                    }
                    if(Calc.isBetween(value, 101, 150)){
                        state = "Lightly Polluted";
                    }
                    if(Calc.isBetween(value, 151, 200)){
                        state = "Moderately Polluted";
                    }
                    if(Calc.isBetween(value, 201, 250)){
                        state = "Heavily Polluted";
                    }
                    if(Calc.isBetween(value, 251, 350)){
                        state = "Severely Polluted";
                    }
                    if(Calc.isBetween(value, 351, 500)){
                        state = "Extemely Polluted";
                    }
                    return `${value}: ${state}`;
                },
            },
            min: 0,
            max: 500,
        },
    ],

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
        position: 'front' ,
        yaxis: [
            {
                y: 0,
                y2: 50,
                yAxisIndex: 2,
                borderColor: '#24571f',
                fillColor: '#133614',
            },
            {
                y: 51,
                y2: 100,
                yAxisIndex: 2,
                borderColor: '#1f574f',
                fillColor: '#153b35',
            },
            {
                y: 101,
                y2: 150,
                yAxisIndex: 2,
                borderColor: '#213a5c',
                fillColor: '#15253b',
            },
            {
                y: 151,
                y2: 200,
                yAxisIndex: 2,
                borderColor: '#21225c',
                fillColor: '#15153b',
            },
            {
                y: 201,
                y2: 250,
                yAxisIndex: 2,
                borderColor: '#37215c',
                fillColor: '#23153b',
            },
            {
                y: 251,
                y2: 350,
                yAxisIndex: 2,
                borderColor: '#4c215c',
                fillColor: '#2e1438',
            },
            {
                y: 350,
                y2: 1000,
                yAxisIndex: 2,
                borderColor: '#5e2222',
                fillColor: '#381414',
            }
        ]
    }
};
const enviromentalData = new ApexCharts(
    document.querySelector("#enviromentalHistory"),
    optionsEnviromentalData
);
enviromentalData.render();
const systemFarmTemp = new ApexCharts(
    document.querySelector("#farmTempMap"),
    optionsFarmTemp
);
systemFarmTemp.render();
const activityHeatChart = new ApexCharts(
    document.querySelector("#daysActivityHeatMap"),
    optionsHeatChart
);
activityHeatChart.render();
const currentActivityChart = new ApexCharts(
    document.querySelector("#currentActivity"),
    optionsRadar
);
currentActivityChart.render();
const currentUtilisation = new ApexCharts(
    document.querySelector("#currentUtilisation"),
    optionsUtilisation
);
currentUtilisation.render();

let worker = null;

// Setup webWorker
if (window.Worker) {
    // Yes! Web worker support!
    try {
        if (worker === null) {
            worker = new Worker("./js/lib/modules/workers/dashboardWorker.js");
            worker.onmessage = function (event) {
                if (event.data != false) {
                    const currentOperationsData = event.data.currentOperations;
                    const printerInfo = event.data.printerInformation;
                    const dashboard = event.data.dashStatistics;
                    currentOperations(
                        currentOperationsData.operations,
                        currentOperationsData.count,
                        printerInfo
                    );
                    dashUpdate.farmInformation(
                        dashboard.timeEstimates,
                        dashboard.utilisationGraph,
                        dashboard.temperatureGraph
                    );
                    dashUpdate.farmUtilisation(dashboard.farmUtilisation);
                    dashUpdate.currentActivity(
                        dashboard.currentStatus,
                        dashboard.currentUtilisation
                    );
                    dashUpdate.printerStatus(dashboard.printerHeatMaps.heatStatus);
                    dashUpdate.printerProgress(dashboard.printerHeatMaps.heatProgress);
                    dashUpdate.printerTemps(dashboard.printerHeatMaps.heatTemps);
                    dashUpdate.printerUptime(dashboard.printerHeatMaps.heatUtilisation);
                    if(dashboard.enviromentalData){
                        dashUpdate.envriromentalData(dashboard.enviromentalData);
                    }

                }
            };
        }
    } catch (e) {
        console.log(e);
    }
} else {
    // Sorry! No Web Worker support..
    console.log("Web workers not available... sorry!");
}

class dashUpdate {
    static envriromentalData(data, iaq){
        if(data[0].data.length !== 0){
            document.getElementById("envrioData").classList.remove("d-none");
        }
        enviromentalData.updateSeries(data);
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

    static farmInformation(farmInfo, heatMap, temperatureGraph) {
        document.getElementById("globalTemp").innerHTML = `
            <i class="fas fa-temperature-high"></i> Total Temperature: ${Calc.toFixed(
            farmInfo.totalFarmTemp,
            0
        )} °C
    `;
        document.getElementById("avgEstimatedTime").innerHTML = Calc.generateTime(
            farmInfo.averageEstimated
        );
        document.getElementById("avgRemainingTime").innerHTML = Calc.generateTime(
            farmInfo.averageRemaining
        );
        document.getElementById("avgElapsedTime").innerHTML = Calc.generateTime(
            farmInfo.averageElapsed
        );
        document.getElementById("cumEstimatedTime").innerHTML = Calc.generateTime(
            farmInfo.totalEstimated
        );
        document.getElementById("cumRemainingTime").innerHTML = Calc.generateTime(
            farmInfo.totalRemaining
        );
        document.getElementById("cumElapsedTime").innerHTML = Calc.generateTime(
            farmInfo.totalElapsed
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
        cumRemainingProgress.style.width = `${Calc.toFixed(
            farmInfo.cumulativePercentRemaining,
            2
        )}%`;
        cumRemainingProgress.innerHTML = `${Calc.toFixed(
            farmInfo.cumulativePercentRemaining,
            2
        )}%`;
        cumElapsed.style.width = `${Calc.toFixed(farmInfo.cumulativePercent, 2)}%`;
        cumElapsed.innerHTML = `${Calc.toFixed(farmInfo.cumulativePercent, 2)}%`;

        systemFarmTemp.updateSeries(temperatureGraph);
        activityHeatChart.updateSeries(heatMap);
    }

    static currentActivity(currentStatus, currentActivity) {
        currentActivityChart.updateSeries(currentActivity);
        currentUtilisation.updateSeries(currentStatus);
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
    width: 12,
    animate: true,
    disableOneColumnMode: true, // will manually do 1 column
    oneColumnModeDomSort: true,
    cellHeight: 30
});

function saveGrid() {
    const serializedData = [];
    grid.engine.nodes.forEach(function(node) {
        serializedData.push({
            x: node.x,
            y: node.y,
            width: node.width,
            height: node.height,
            id: node.id
        });
    });
    localStorage.setItem('dashboardConfiguration', JSON.stringify(serializedData));
    console.log("test")
    // console.log(JSON.stringify(serializedData, null, '  '))
};
function loadGrid() {
    let dashData = localStorage.getItem('dashboardConfiguration')
    let serializedData = JSON.parse(dashData)
    if(serializedData !== null && serializedData.length !== 0){
        var items = GridStack.Utils.sort(serializedData);
        grid.batchUpdate();

        // else update existing nodes (instead of calling grid.removeAll())
        grid.engine.nodes.forEach(function (node) {
            var item = items.find(function(e) { return e.id === node.id});
            grid.update(node.el, item.x, item.y, item.width, item.height);
        });
        grid.commit();
    }
};
function resizeGrid() {
    var width = document.body.clientWidth;
    if (width < 700) {
        grid.column(1);
    } else if (width < 850) {
        grid.column(3);
    } else if (width < 950) {
        grid.column(6);
    } else if (width < 1100) {
        grid.column(8);
        console.log("8")
    } else {
        grid.column(12);
        console.log("12")
    }
    grid.compact();
};


loadGrid();
resizeGrid();

window.addEventListener('resize', function() {
    resizeGrid()
});

grid.on('change', function(event, items) {
    saveGrid();
});