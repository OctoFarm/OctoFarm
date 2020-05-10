
import UI from "./lib/functions/ui.js";
import Calc from "./lib/functions/calc.js";
import Validate from "./lib/functions/validate.js";
import {parse} from './vendor/flatted.js';
import currentOperations from "./lib/modules/currentOperations.js";

//Setup charts
// let optionsMemory = {
//     title: {
//         text: "Memory",
//         align: 'center',
//         margin: 1,
//         offsetX: 0,
//         offsetY: 0,
//         floating: false,
//         style: {
//             fontSize: '14px',
//             fontWeight: 'bold',
//             fontFamily: undefined,
//             color: '#fff',
//         },
//     },
//     chart: {
//         type: 'donut',
//         height: '100%',
//         animations: {
//             enabled: false,
//         },
//         background: '#303030'
//     },
//     theme: {
//         mode: 'dark',
//     },
//     plotOptions: {
//         pie: {
//             expandOnClick: true,
//             dataLabels: {
//                 offset: 10,
//                 minAngleToShowLabel: 15
//             },
//         }
//     },
//     stroke: {
//         show: false,
//     },
//     tooltip: {
//         y: {
//             formatter: function(val) {
//                 return Calc.bytes(val)
//             },
//         }
//     },
//     noData: {
//         text: 'Loading...'
//     },
//     dataLabels: {
//         enabled: false,
//     },
//     series: [],
//     labels: ['Other', 'OctoFarm', 'Free'],
//     colors: ['#f39c12', '#3498db', '#00bc8c'],
//     legend: {
//         show: true,
//         showForSingleSeries: false,
//         showForNullSeries: true,
//         showForZeroSeries: true,
//         position: 'bottom',
//         horizontalAlign: 'center',
//         floating: false,
//         fontSize: '11px',
//         fontFamily: 'Helvetica, Arial',
//         fontWeight: 400,
//         formatter: undefined,
//         inverseOrder: false,
//         width: undefined,
//         height: undefined,
//         tooltipHoverFormatter: undefined,
//         offsetX: -25,
//         offsetY: 0,
//         labels: {
//             colors: undefined,
//             useSeriesColors: false
//         },
//         markers: {
//             width: 9,
//             height: 9,
//             strokeWidth: 0,
//             strokeColor: '#fff',
//             fillColors: undefined,
//             radius: 1,
//             customHTML: undefined,
//             onClick: undefined,
//             offsetX: 0,
//             offsetY: 0
//         },
//         itemMargin: {
//             horizontal: 1,
//             vertical: 0
//         },
//         onItemClick: {
//             toggleDataSeries: false
//         },
//         onItemHover: {
//             highlightDataSeries: false
//         },
//     }
// };
// let optionsCPU = {
//     title: {
//         text: "CPU",
//         align: 'center',
//         margin: 1,
//         offsetX: 0,
//         offsetY: 0,
//         floating: false,
//         style: {
//             fontSize: '14px',
//             fontWeight: 'bold',
//             fontFamily: undefined,
//             color: '#fff'
//         },
//     },
//     chart: {
//         type: 'donut',
//         height: '100%',
//         animations: {
//             enabled: true,
//         },
//         background: '#303030'
//     },
//     theme: {
//         mode: 'dark',
//     },
//     plotOptions: {
//         pie: {
//             expandOnClick: false,
//             dataLabels: {
//                 offset: 10,
//                 minAngleToShowLabel: 15
//             },
//         }
//     },
//     stroke: {
//         show: false,
//     },
//     tooltip: {
//         y: {
//             formatter: function(val) {
//                 return Math.round(val * 10) / 10 + "%"
//             },
//         }
//     },
//     noData: {
//         text: 'Loading...'
//     },
//     dataLabels: {
//         enabled: false,
//     },
//     series: [],
//     labels: ['System', 'OctoFarm', 'User', 'Free'],
//     colors: ['#f39c12', '#3498db', '#375a7f', '#00bc8c'],
//     legend: {
//         show: true,
//         showForSingleSeries: false,
//         showForNullSeries: true,
//         showForZeroSeries: true,
//         position: 'bottom',
//         horizontalAlign: 'center',
//         floating: false,
//         fontSize: '11px',
//         fontFamily: 'Helvetica, Arial',
//         fontWeight: 400,
//         formatter: undefined,
//         inverseOrder: false,
//         width: undefined,
//         height: undefined,
//         tooltipHoverFormatter: undefined,
//         offsetX: -25,
//         offsetY: 0,
//         labels: {
//             colors: undefined,
//             useSeriesColors: false
//         },
//         markers: {
//             width: 9,
//             height: 9,
//             strokeWidth: 0,
//             strokeColor: '#fff',
//             fillColors: undefined,
//             radius: 1,
//             customHTML: undefined,
//             onClick: undefined,
//             offsetX: 0,
//             offsetY: 0
//         },
//         itemMargin: {
//             horizontal: 1,
//             vertical: 0
//         },
//         onItemClick: {
//             toggleDataSeries: false
//         },
//         onItemHover: {
//             highlightDataSeries: false
//         },
//     }
// };
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
    colors: ['#fcc329', '#ff1500', '#009cff', '#ff1800'],
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
// let systemChartCPU = new ApexCharts(
//     document.querySelector("#systemChartCPU"),
//     optionsCPU
// );
// systemChartCPU.render();
// let systemChartMemory = new ApexCharts(
//     document.querySelector("#systemChartMemory"),
//     optionsMemory
// );
// systemChartMemory.render();
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
async function asyncParse(str) {
    try {
        let info = parse(str)
        return info;
    } catch (e) {
        return false;
    }
}
let source = new EventSource("/sse/dashboardInfo/");
let statsCounter = 10;
let iHavePrinters = false;
source.onmessage = async function(e) {
        if (e.data != null) {
            let res = await asyncParse(e.data);
            if (res != false) {
                if (res.printerInfo.length > 0) {
                            currentOperations(res.currentOperations, res.currentOperationsCount, res.printerInfo)
                        if (statsCounter === 10) {
                            // dashUpdate.systemInformation(res.systemInfo);
                            dashUpdate.farmInformation(res.farmInfo, res.heatMap);
                            dashUpdate.farmUtilisation(res.octofarmStatistics)
                            dashUpdate.currentActivity(res.currentOperationsCount)
                            dashUpdate.currentTemperature(res.printerInfo);
                            dashUpdate.currentStatus(res.printerInfo);
                            dashUpdate.currentProgress(res.printerInfo);
                            dashUpdate.currentUptime(res.printerInfo);
                            statsCounter = 0;
                        } else {
                            statsCounter = statsCounter + 1;
                        }
                } else {
                    if (iHavePrinters === false) {
                        iHavePrinters = true;
                        bootbox.alert("No printers detected, please add them using the printer manager below.", function() {
                        });
                    }

                }
            }
        }


};
source.onerror = function() {
    UI.createAlert(
        "error",
        "Communication with the server has been suddenly lost, we will automatically refresh in 10 seconds..."
    );
    setTimeout(function() {
        location.reload();
    }, 10000);
};
source.onclose = function() {};

class dashUpdate {
    // static systemInformation(systemInfo) {
    //     if (Object.keys(systemInfo).length === 0 && systemInfo.constructor === Object) {
    //
    //     } else {
    //         document.getElementById("systemUpdate").innerHTML = Calc.generateTime(
    //             systemInfo.sysUptime.uptime
    //         );
    //         //labels: ['System', 'OctoFarm', 'User', 'Free'],
    //         let cpuLoad = systemInfo.cpuLoad.currentload_system;
    //         let octoLoad = systemInfo.sysProcess.pcpu;
    //         let userLoad = systemInfo.cpuLoad.currentload_user;
    //         let remain = cpuLoad + octoLoad + userLoad;
    //         systemChartCPU.updateSeries([cpuLoad, octoLoad, userLoad, 100 - remain])
    //
    //         let otherRAM = systemInfo.memoryInfo.total - systemInfo.memoryInfo.free
    //         let octoRAM = systemInfo.memoryInfo.total / 100 * systemInfo.sysProcess.pmem
    //         let freeRAM = systemInfo.memoryInfo.free
    //
    //         systemChartMemory.updateSeries([otherRAM, octoRAM, freeRAM])
    //
    //     }
    //
    // }

    static farmInformation(farmInfo, heatMap) {

        document.getElementById("globalTemp").innerHTML = `
            <i class="fas fa-temperature-high"></i> Total Temperature: ${Math.round(farmInfo.totalActualTemperature)} °C
    `;
        document.getElementById("avgEstimatedTime").innerHTML = Calc.generateTime(
            farmInfo.avgEstimateTime
        );
        document.getElementById("avgRemainingTime").innerHTML = Calc.generateTime(
            farmInfo.avgRemainingTime
        );
        document.getElementById("avgElapsedTime").innerHTML = Calc.generateTime(
            farmInfo.avgElapsedTime
        );
        document.getElementById("cumEstimatedTime").innerHTML = Calc.generateTime(
            farmInfo.totalEstimateTime
        );
        document.getElementById("cumRemainingTime").innerHTML = Calc.generateTime(
            farmInfo.totalRemainingTime
        );
        document.getElementById("cumElapsedTime").innerHTML = Calc.generateTime(
            farmInfo.totalElapsedTime
        );
        systemFarmTemp.updateSeries(farmInfo.temp);
        activityHeatChart.updateSeries(heatMap);



    }
    static currentActivity(currCount) {
        let data = [{
            data: [currCount.active, currCount.complete, currCount.idle, currCount.disconnected, currCount.offline]
        }]
        let farmTotal = currCount.active + currCount.complete + currCount.idle + currCount.disconnected + currCount.offline
        let activeTotal = currCount.active;
        let offlineTotal = currCount.offline;
        let idleTotal = currCount.complete + currCount.idle + currCount.disconnected;
        let activePer = activeTotal / farmTotal * 100;
        let idlePer = idleTotal / farmTotal * 100;
        let offlinePer = offlineTotal;

        currentActivityChart.updateSeries(data)
        currentUtilisation.updateSeries([activePer, idlePer, offlinePer])
    }

    static currentUptime(printers){
        let currentUptime = document.getElementById("currentUptime");
        printers.forEach(printer => {
            let dateNow = new Date();
            dateNow = dateNow.getTime();
            let timeSpan = dateNow - printer.dateAdded;
            let percentUp = printer.currentUptime / timeSpan * 100;
            percentUp = percentUp.toFixed(2)+"%"
            let progressColour = dashUpdate.getProgressColour(percentUp);

            if(document.getElementById("printerUptime-"+printer._id)){
                //Exists so just update the values
                let eProgress = document.getElementById("printerUptime-"+printer._id)
                eProgress.title = `${Validate.getName(printer)}: ${percentUp}`;
                eProgress.className = `bg-${progressColour} heatMap`;
            }else{
                //Create the elements as doesn't exists
                currentUptime.insertAdjacentHTML('beforeend',`
                     <div title="${Validate.getName(printer)}: ${percentUp}" class="bg-${progressColour} heatMap" id="printerUptime-${printer._id}"></div>
                `)

            }

        })

    }

    static getProgressColour(progress) {
        progress = progress.replace("%","")
        progress = parseInt(progress)
        if (progress === 0) {
            return "dark"
        } else if (progress < 25) {
            return "secondary"
        } else if (progress > 25 && progress <= 50) {
            return "primary"
        } else if (progress >= 50 && progress <= 75) {
            return "info"
        }else if (progress >= 75 && progress < 100) {
            return "warning"
        } else if (progress === 100) {
            return "success"
        }
    }
    static currentProgress(printers){
        let currentProgress = document.getElementById("currentProgress");
        printers.forEach(printer => {
            let progress = 0 + "%";

            if(typeof printer.progress !== 'undefined' && printer.progress.completion !== null){
                progress = printer.progress.completion.toFixed(2)+"%"
            }
            let progressColour = dashUpdate.getProgressColour(progress);
            let status = printer.stateColour.category;
            let colour = printer.stateColour.name;
            if(document.getElementById("printerProgress-"+printer._id)){
                //Exists so just update the values
                let eProgress = document.getElementById("printerProgress-"+printer._id)
                eProgress.title = `${Validate.getName(printer)}: ${progress}`;
                eProgress.className = `bg-${progressColour} heatMap`;
            }else{
                //Create the elements as doesn't exists
                currentProgress.insertAdjacentHTML('beforeend',`
                     <div title="${Validate.getName(printer)}: ${progress}" class="bg-${progressColour} heatMap" id="printerProgress-${printer._id}"></div>
                `)

            }

        })
    }
    static currentStatus(printers){
        let currentStatus = document.getElementById("currentStatus");
        printers.forEach(printer => {
            let status = printer.stateColour.category;
            let colour = printer.stateColour.name;
            if(document.getElementById("printerStatus-"+printer._id)){
                //Exists so just update the values
                let eStatus = document.getElementById("printerStatus-"+printer._id)
                eStatus.title = `${Validate.getName(printer)}: ${status}`;
                eStatus.className = `bg-${colour} heatMap`;
            }else{
                //Create the elements as doesn't exists
                currentStatus.insertAdjacentHTML('beforeend',`
                     <div title="${Validate.getName(printer)}: ${status}" class="bg-${colour} heatMap"} heatMap" id="printerStatus-${printer._id}"></div>
                `)

            }

        })
    }
    static currentTemperature(printers){
        let currentTemps = document.getElementById("currentTemps");
        printers.forEach(printer => {
            let toolTarget = 0;
            let toolActual = 0;
            let bedTarget = 0;
            let bedActual = 0;
            if(typeof printer.temps !== 'undefined' && printer.temps[0].tool0.actual !== null){
                toolTarget = printer.temps[0].tool0.target;
                toolActual = printer.temps[0].tool0.actual;
            }

            if(typeof printer.temps !== 'undefined' && printer.temps[0].bed.actual !== null){
                bedTarget = printer.temps[0].bed.target;
                bedActual = printer.temps[0].bed.actual;
            }
            if(document.getElementById("printerTemps-"+printer._id)){
                //Exists so just update the values
                let tool = document.getElementById("printerTempsTool-" + printer._id)
                let bed = document.getElementById("printerTempsBed-" + printer._id)
                tool.title = `${Validate.getName(printer)}: Tool A: ${toolActual}, Tool T: ${toolTarget}`;
                bed.title = `${Validate.getName(printer)}: Bed A: ${bedActual}, Bed T: ${bedTarget}`;
                tool.className = `${dashUpdate.checkTempRange(printer.stateColour.category,toolTarget, toolActual, printer.tempTriggers.heatingVariation, printer.tempTriggers.coolDown)} heatMapLeft`
                bed.className = `${dashUpdate.checkTempRange(printer.stateColour.category, bedTarget, bedActual, printer.tempTriggers.heatingVariation, printer.tempTriggers.coolDown)} heatMapRight`
            }else{
                //Create the elements as doesn't exists
                currentTemps.insertAdjacentHTML("beforeend", `
                    <div class="d-flex flex-wrap" id="printerTemps-${printer._id}">
                    </div>
                `)

                document.getElementById("printerTemps-"+printer._id).insertAdjacentHTML('beforeend',`
                     <div title="${Validate.getName(printer)}: Tool A: ${toolActual}, Tool T: ${toolTarget}" class="${dashUpdate.checkTempRange(printer.stateColour.category,toolTarget, toolActual, printer.tempTriggers.heatingVariation, printer.tempTriggers.coolDown)} heatMapLeft" id="printerTempsTool-${printer._id}"></div>
                `)
                document.getElementById("printerTemps-"+printer._id).insertAdjacentHTML('beforeend',`
                     <div title="${Validate.getName(printer)}: Bed A: ${bedActual}, Bed T: ${bedTarget}" class="${dashUpdate.checkTempRange(printer.stateColour.category, bedTarget, bedActual, printer.tempTriggers.heatingVariation, printer.tempTriggers.coolDown)} heatMapRight" id="printerTempsBed-${printer._id}"></div>
                `)

            }

        })
    }
    static checkTempRange(state, target, actual, heatingVariation, coolDown){
        if(state === "Active"){
            if (actual > target - parseInt(heatingVariation) && actual < target + parseInt(heatingVariation)) {
               return "tempSuccess"
            } else {
                return "tempActive"
            }
        }else if (state === "Complete"){
            if (actual > parseInt(coolDown)) {
                return "tempCooling"
            } else {
                return "tempCool"
            }
        }else{
            //Offline
            return "tempOffline"
        }
    }
    static farmUtilisation(stats){
        console.log(stats)
        let activeHours = document.getElementById("activeHours")
        activeHours.innerHTML = "<i class=\"fas fa-square text-success\"></i> <b>Active: </b> " + Calc.generateTime(stats.activeHours / 1000)
        let idleHours = document.getElementById("idleHours")
        idleHours.innerHTML = '<i class="fas fa-square text-secondary"></i> <b>Idle Hours: </b> ' + Calc.generateTime(stats.idleHours / 1000)
        let failedHours = document.getElementById("failedHours")
        failedHours.innerHTML = '<i class="fas fa-square text-danger"></i> <b>Failed Hours: </b>' +  Calc.generateTime(stats.downHours / 1000)
        let activeProgress = document.getElementById("activeProgress")
        activeProgress.style.width = stats.activePercent+"%";
        activeProgress.innerHTML = stats.activePercent+"%"
        let idleProgress = document.getElementById("idleProgress")
        idleProgress.style.width = stats.idlePercent+"%";
        idleProgress.innerHTML = stats.idlePercent+"%"
        let failedProgress = document.getElementById("failedProgress")
        failedProgress.style.width = stats.downPercent+"%";
        failedProgress.innerHTML = stats.downPercent+"%"


        let usedStorage = document.getElementById("usedStorage")
        let availableStorage = document.getElementById("availableStorage")
        let usedProgress = document.getElementById("usedProgress")
        let availableProgress = document.getElementById("availableProgress")
        usedStorage.innerHTML = '<i class="fas fa-square text-warning"></i> <b>Used: </b>' + Calc.bytes(stats.storageUsed)
        usedProgress.style.width = stats.storagePercent+"%";
        usedProgress.innerHTML = stats.storagePercent+"%"
        availableStorage.innerHTML = '<i class="fas fa-square text-success"></i> <b>Available: </b>' + Calc.bytes(stats.storageRemain)
        availableProgress.style.width = 100 - stats.storagePercent+"%";
        availableProgress.innerHTML =  100 - stats.storagePercent+"%";


    }
}
