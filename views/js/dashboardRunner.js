
import UI from "./lib/functions/ui.js";
import Calc from "./lib/functions/calc.js";
import Validate from "./lib/functions/validate.js";
import currentOperations from "./lib/modules/currentOperations.js";


//Setup charts
let optionsFarmTemp = {
    chart: {
        type: 'line',
        id: 'realtime',
        height: '333px',
        width: '100%',
        animations: {
            enabled: false,
        },
        toolbar: {
            show: false
        },
        zoom: {
            enabled: false
        },
        background: '#303030'
    },
    colors: [
        '#fcc329',
        '#ff1500',
        '#009cff',
        '#ff1800',
        '#37ff00',
        '#ff1800'
    ],
    stroke: {
        curve: 'smooth'
    },
    toolbar: {
        show: false
    },
    theme: {
        mode: 'dark',
    },
    noData: {
        text: 'Loading...'
    },
    series: [],
    yaxis: [{
            title: {
                text: "Temp"
            },
            seriesName: "Actual Tool",
            labels: {
                formatter: function(value) {
                    return value + "°C";
                }
            },
        },
        {
            seriesName: "Actual Tool",
            show: false,
            labels: {
                formatter: function(value) {
                    return value + "°C";
                }
            },
        },
        {
            seriesName: "Actual Tool",
            show: false,
            labels: {
                formatter: function(value) {
                    return value + "°C";
                }
            },
        },
        {
            seriesName: "Actual Tool",
            show: false,
            labels: {
                formatter: function(value) {
                    return value + "°C";
                }
            },
        },
        {
            seriesName: "Actual Tool",
            show: false,
            labels: {
                formatter: function(value) {
                    return value + "°C";
                }
            },
        },
        {
            seriesName: "Actual Tool",
            show: false,
            labels: {
                formatter: function(value) {
                    return value + "°C";
                }
            },
        },
    ],
    xaxis: {
        type: 'datetime',
        labels: {
            formatter: function(value) {
                let date = new Date(value);
                let formatTime = date.toLocaleTimeString();
                return formatTime;
            }
        },
    },
};
let optionsHeatChart = {
    chart: {
        type: 'heatmap',
        id: 'realtime',
        height: '333px',
        width: '100%',
        animations: {
            enabled: true,
            easing: 'linear',
            dynamicAnimation: {
                speed: 1000
            }
        },
        toolbar: {
            show: false
        },
        zoom: {
            enabled: false
        },
        background: '#303030'
    },
    theme: {
        mode: 'dark',
    },
    noData: {
        text: 'Loading...'
    },
    series: [],
    dataLabels: {
        enabled: true,
        formatter: function(val) {
            return Math.round(val * 10) / 10 + "%"
        },
        style: {
            fontSize: '14px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: 'bold',
            colors: ['#000000']
        },

    },
    stroke: {
        show: true,
        curve: 'smooth',
        lineCap: 'butt',
        colors: ['#303030'],
        width: 2,
        dashArray: 0,
    },
    plotOptions: {
        heatmap: {
            shadeIntensity: 0.7,
            radius: 0,
            useFillColorAsStroke: false,
            colorScale: {
                ranges: [{
                        from: 0,
                        to: 1,
                        name: 'none',
                        color: '#444'
                    },
                    {
                        from: 1.1,
                        to: 25,
                        name: 'low',
                        color: '#375a7f'
                    },
                    {
                        from: 25.1,
                        to: 60,
                        name: 'medium',
                        color: '#f39c12'
                    },
                    {
                        from: 60.1,
                        to: 75,
                        name: 'high',
                        color: '#00bc8c'
                    },
                    {
                        from: 75.1,
                        to: 100,
                        name: 'extreme',
                        color: '#e74c3c'
                    }
                ]
            }
        }
    },
    tooltip: {
        y: {
            formatter: function(val) {
                return Math.round(val * 10) / 10 + "%"
            },
        }
    },
    xaxis: {
        reversed: true
    }
};
let optionsRadar = {
    series: [],
    chart: {
        type: 'bar',
        width: '100%',
        height: '180px',
        toolbar: {
            show: false,
        },
        animations: {
            enabled: false,
        },
        background: '#303030'
    },
    theme: {
        mode: 'dark',
    },
    plotOptions: {
        bar: {
            horizontal: true,
        }
    },
    noData: {
        text: 'Loading...'
    },
    dataLabels: {
        enabled: false,
        formatter: function(val) {
            return val
        },
    },
    xaxis: {

        categories: ['Active', 'Complete', 'Idle', 'Disconnected', 'Offline'],
    },
    tooltip: {
        theme: 'dark',
        x: {
            show: false
        },
        y: {
            title: {
                formatter: function (val, opt) {
                    return opt.w.globals.labels[opt.dataPointIndex] + ":  "
                },
            }
        }
    },
};
let optionsUtilisation = {
    chart: {
        type: 'donut',
        width: '100%',
        animations: {
            enabled: true,
        },
        background: '#303030'
    },
    theme: {
        mode: 'dark',
    },
    plotOptions: {
        pie: {
            expandOnClick: false,
            dataLabels: {
                offset: 10,
                minAngleToShowLabel: 15
            },
        }
    },
    stroke: {
        show: false,
    },
    tooltip: {
        y: {
            formatter: function(val) {
                return Math.round(val * 10) / 10 + "%"
            },
        }
    },
    noData: {
        text: 'Loading...'
    },
    dataLabels: {
        enabled: false,
    },
    series: [],
    labels: ['Active', 'Idle', 'Offline'],
    colors: ['#00bc8c', '#444' ,'#e74c3c'],
    legend: {
        show: true,
        showForSingleSeries: false,
        showForNullSeries: true,
        showForZeroSeries: true,
        position: 'bottom',
        horizontalAlign: 'center',
        floating: false,
        fontSize: '11px',
        fontFamily: 'Helvetica, Arial',
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
            strokeColor: '#fff',
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
        },
    }
};
let systemFarmTemp = new ApexCharts(
    document.querySelector("#farmTempMap"),
    optionsFarmTemp
);
systemFarmTemp.render();
var activityHeatChart = new ApexCharts(document.querySelector("#daysActivityHeatMap"), optionsHeatChart);
activityHeatChart.render();
var currentActivityChart = new ApexCharts(document.querySelector("#currentActivity"), optionsRadar);
currentActivityChart.render();
var currentUtilisation = new ApexCharts(document.querySelector("#currentUtilisation"), optionsUtilisation);
currentUtilisation.render();

let worker = null;

//Setup webWorker
if (window.Worker) {
    // Yes! Web worker support!
    try{
        if (worker === null) {
            worker = new Worker("./js/lib/modules/workers/dashboardWorker.js");
            worker.onmessage = function(event){
                if (event.data != false) {
                        let currentOperationsData = event.data.currentOperations;
                        let printerInfo = event.data.printerInformation;
                        let dashboard = event.data.dashStatistics;
                        currentOperations(currentOperationsData.operations, currentOperationsData.count, printerInfo)
                        dashUpdate.farmInformation(dashboard.timeEstimates, dashboard.utilisationGraph, dashboard.temperatureGraph);
                        dashUpdate.farmUtilisation(dashboard.farmUtilisation)
                        dashUpdate.currentActivity(dashboard.currentStatus, dashboard.currentUtilisation)
                        dashUpdate.printerStatus(dashboard.printerHeatMaps.heatStatus);
                        dashUpdate.printerProgress(dashboard.printerHeatMaps.heatProgress);
                        dashUpdate.printerTemps(dashboard.printerHeatMaps.heatTemps);
                        dashUpdate.printerUptime(dashboard.printerHeatMaps.heatUtilisation);
                }else{
                    UI.createAlert(
                        "error",
                        "Communication with the server has been suddenly lost, trying to re-establish connection...", 10000, "Clicked"

                    );
                }

            }
        }
    }catch(e){
        console.log(e)
    }
} else {
    // Sorry! No Web Worker support..
    console.log("Web workers not available... sorry!")
}





class dashUpdate {
    static printerStatus(data){
        let currentStatus = document.getElementById("currentStatus")
        currentStatus.innerHTML = "";
        for(let d = 0; d<data.length; d++){
            currentStatus.insertAdjacentHTML("beforeend", data[d])
        }

    }
    static printerProgress(data){
        let currentStatus = document.getElementById("currentProgress")
        currentStatus.innerHTML = "";
        for(let d = 0; d<data.length; d++){
            currentStatus.insertAdjacentHTML("beforeend", data[d])
        }
    }
    static printerTemps(data){
        let currentStatus = document.getElementById("currentTemps")
        currentStatus.innerHTML = "";
        for(let d = 0; d<data.length; d++){
            currentStatus.insertAdjacentHTML("beforeend", data[d])
        }
    }
    static printerUptime(data){
        let currentStatus = document.getElementById("currentUptime")
        currentStatus.innerHTML = "";
        for(let d = 0; d<data.length; d++){
            currentStatus.insertAdjacentHTML("beforeend", data[d])
        }
    }
    static farmInformation(farmInfo, heatMap, temperatureGraph) {
        document.getElementById("globalTemp").innerHTML = `
            <i class="fas fa-temperature-high"></i> Total Temperature: ${Math.round(farmInfo.totalFarmTemp.toFixed(2))} °C
    `;
        document.getElementById("avgEstimatedTime").innerHTML = Calc.generateTime(
            farmInfo.averageEstimated.toFixed(2)
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

        avgRemainingProgress.style.width = farmInfo.averagePercentRemaining.toFixed(2)+"%";
        avgRemainingProgress.innerHTML = farmInfo.averagePercentRemaining.toFixed(2)+"%"
        avgElapsed.style.width = farmInfo.averagePercent.toFixed(2)+"%";
        avgElapsed.innerHTML = farmInfo.averagePercent.toFixed(2)+"%"
        cumRemainingProgress.style.width = farmInfo.cumulativePercentRemaining.toFixed(2)+"%";
        cumRemainingProgress.innerHTML = farmInfo.cumulativePercentRemaining.toFixed(2)+"%"
        cumElapsed.style.width = farmInfo.cumulativePercent.toFixed(2)+"%";
        cumElapsed.innerHTML = farmInfo.cumulativePercent.toFixed(2)+"%"

        systemFarmTemp.updateSeries(temperatureGraph);
        activityHeatChart.updateSeries(heatMap);



    }
    static currentActivity(currentStatus, currentActivity) {
        currentActivityChart.updateSeries(currentActivity)
        currentUtilisation.updateSeries(currentStatus)
    }
    static farmUtilisation(stats){
        let activeHours = document.getElementById("activeHours")
        activeHours.innerHTML = "<i class=\"fas fa-square text-success\"></i> <b>Active: </b> " + Calc.generateTime(stats.activeHours / 1000)
        let idleHours = document.getElementById("idleHours")
        idleHours.innerHTML = '<i class="fas fa-square text-secondary"></i> <b>Idle Hours: </b> ' + Calc.generateTime(stats.idleHours / 1000)
        let failedHours = document.getElementById("failedHours")
        failedHours.innerHTML = '<i class="fas fa-square text-warning"></i> <b>Failed Hours: </b>' +  Calc.generateTime(stats.failedHours / 1000)
        let offlineHours = document.getElementById("offlineHours")
        offlineHours.innerHTML = '<i class="fas fa-square text-danger"></i> <b>Offline Hours: </b>' +  Calc.generateTime(stats.offlineHours / 1000)
        let activeProgress = document.getElementById("activeProgress")
        activeProgress.style.width = stats.activeHoursPercent.toFixed(0)+"%";
        activeProgress.innerHTML = stats.activeHoursPercent.toFixed(0)+"%"
        let idleProgress = document.getElementById("idleProgress")
        idleProgress.style.width = stats.idleHoursPercent.toFixed(0)+"%";
        idleProgress.innerHTML = stats.idleHoursPercent.toFixed(0)+"%"
        let failedProgress = document.getElementById("failedProgress")
        failedProgress.style.width = stats.failedHoursPercent.toFixed(0)+"%";
        failedProgress.innerHTML = stats.failedHoursPercent.toFixed(0)+"%"
        let offlineProgress = document.getElementById("offlineProgress")
        offlineProgress.style.width = stats.offlineHoursPercent.toFixed(0)+"%";
        offlineProgress.innerHTML = stats.offlineHoursPercent.toFixed(0)+"%"
    }
}
