const FarmStatistics = require("../models/FarmStatistics.js");
const History = require("../models/History.js");
const _ = require("lodash");
const filamentType = require("../config/filaments.js");
const returnFilamentTypes = filamentType.returnFilamentTypes;

let farmStats = [];
let currentHistoryTemp = [{
    name: 'Actual Tool',
    data: []
}, {
    name: 'Target Tool',
    data: []
}, {
    name: 'Actual Bed',
    data: []
}, {
    name: 'Target Bed',
    data: []
}];

let heatMap = [{
    name: 'Completed',
    data: []
}, {
    name: 'Active',
    data: []
}, {
    name: 'Idle',
    data: []
}, {
    name: 'Offline',
    data: []
}, {
    name: 'Disconnected',
    data: []
}]

let heatMapCounter = 17280;
let arrayTotal = [];

class StatisticsCollection {
    static returnStats() {
        return farmStats[0];
    }
    static async init() {
        farmStats = await FarmStatistics.find({});
        let farmInfo = await this.blankFarmInfo();
        let currentOperations = [];
        let octofarmStatistics = await this.blankFarmStatistics();
        let printStatistics = await this.blankPrintStatistics();
        let currentOperationsCount = await this.blankCurrentCount();
        if (typeof farmStats === undefined || farmStats.length < 1) {
            let newfarmStats = new FarmStatistics({
                farmInfo,
                octofarmStatistics,
                printStatistics,
                currentOperations,
                currentOperationsCount,
                heatMap
            });
            farmStats[0] = newfarmStats;
            newfarmStats.save();
        } else {
            //Shim for old database structure coming to new
            if(typeof farmStats[0].heatMap === 'undefined'){
                farmStats[0].heatMap = heatMap;
                farmStats[0].markModified("heatMap")
                farmStats[0].save();
            }else{
                heatMap = farmStats[0].heatMap;
                //Make sure array total is updated...
                let today = StatisticsCollection.getDay(new Date())
                for (let i = 0; i < heatMap.length; i++) {
                    //If x = today add that fucker up!
                    let lastInArray = heatMap[i].data.length - 1;
                    if (heatMap[i].data[lastInArray].x === today) {
                        if (heatMap[i].name === "Completed") {
                            arrayTotal[0] = heatMap[i].data[lastInArray].figure;
                        }
                        if (heatMap[i].name === "Active") {
                            arrayTotal[1] = heatMap[i].data[lastInArray].figure;
                        }
                        if (heatMap[i].name === "Offline") {
                            arrayTotal[2] = heatMap[i].data[lastInArray].figure;
                        }
                        if (heatMap[i].name === "Idle") {
                            arrayTotal[3] = heatMap[i].data[lastInArray].figure;
                        }
                        if (heatMap[i].name === "Disconnected") {
                            arrayTotal[4] = heatMap[i].data[lastInArray].figure;
                        }
                    }
                }
            }
        }
        //Saving is pointless now, it keeps crashing anyway due to some concurrent error even though it's the only thing hitting this database...
        // setInterval(async () => {
        //   farmStats[0].save().catch(err => {
        //     console.log(err, "Error saving farm statistics...");
        //   });
        // }, 5000);
        return "Statistics collection has started...";
    }
    static grabName(printer) {
        let name = "";
        if (typeof printer.settingsApperance != "undefined") {
            if (printer.settingsApperance.name === "" || printer.settingsApperance.name === null) {
                name = printer.printerURL;
            } else {
                name = printer.settingsApperance.name;
            }
        } else {
            name = printer.printerURL;
        }
        return name;
    }
    static async currentOperations(farmPrinters) {
        let currentOperations = [];
        let currentOperationsCount = await this.blankCurrentCount();
        let complete = [];
        let active = [];
        let idle = [];
        let offline = [];
        let disconnected = [];
        let progress = [];
        try {
            farmPrinters.forEach(printer => {
                let name = StatisticsCollection.grabName(printer);
                if (typeof printer.stateColour != "undefined") {
                    if (printer.stateColour.category === "Idle") {
                        idle.push(printer._id);
                    }
                    if (
                        printer.stateColour.category === "Offline"
                    ) {
                        offline.push(printer._id);
                    }
                    if (
                        printer.stateColour.category === "Disconnected"
                    ) {
                        disconnected.push(printer._id);
                    }

                }
                if (
                    typeof printer.stateColour != "undefined" &&
                    typeof printer.progress != "undefined"
                ) {
                    let id = printer._id
                    id = id.toString();
                    if (printer.stateColour.category === "Complete") {
                        complete.push(printer._id);
                        progress.push(printer.progress.completion);

                        currentOperations.push({
                            index: id,
                            name: name,
                            progress: Math.floor(printer.progress.completion),
                            progressColour: "success",
                            timeRemaining: printer.progress.printTimeLeft
                        });
                    }
                    if (
                        printer.stateColour.category === "Active" &&
                        typeof printer.progress != "undefined"
                    ) {
                        active.push(printer._id);
                        progress.push(printer.progress.completion);
                        currentOperations.push({
                            index: id,
                            name: name,
                            progress: Math.floor(printer.progress.completion),
                            progressColour: "warning",
                            timeRemaining: printer.progress.printTimeLeft
                        });
                    }

                }
            });
            let actProg = progress.reduce((a, b) => a + b, 0);
            currentOperationsCount.farmProgress = Math.floor(
                actProg / progress.length
            );
            if (isNaN(currentOperationsCount.farmProgress)) {
                currentOperationsCount.farmProgress = 0;
            }
            if (currentOperationsCount.farmProgress === 100) {
                currentOperationsCount.farmProgressColour = "success";
            } else {
                currentOperationsCount.farmProgressColour = "warning";
            }
            currentOperationsCount.printerCount = farmPrinters.length;
            currentOperationsCount.complete = complete.length;
            currentOperationsCount.active = active.length;
            currentOperationsCount.offline = offline.length;
            currentOperationsCount.idle = idle.length;
            currentOperationsCount.disconnected = disconnected.length;
            //17280
            if (heatMapCounter >= 17280) {
                StatisticsCollection.heatMapping(currentOperationsCount.complete,
                    currentOperationsCount.active,
                    currentOperationsCount.offline,
                    currentOperationsCount.idle,
                    currentOperationsCount.disconnected
                )
                heatMapCounter = 0;
            } else {
                heatMapCounter = heatMapCounter + 1728;
            }

            currentOperations = _.orderBy(currentOperations, ["progress"], ["desc"]);
            farmStats[0].currentOperations = currentOperations;
            farmStats[0].currentOperationsCount = currentOperationsCount;
        } catch (err) {
            console.log("Current Operations issue: " + err);
        }
    }
    static getDay(value) {
        value = value.getDay();
        if (value === 1) {
            return "Monday";
        }
        if (value === 2) {
            return "Tuesday";
        }
        if (value === 3) {
            return "Wednesday";
        }
        if (value === 4) {
            return "Thursday";
        }
        if (value === 5) {
            return "Friday";
        }
        if (value === 6) {
            return "Saturday";
        }
        if (value === 0) {
            return "Sunday";
        }

    }
    static heatMapping(complete, active, offline, idle, disconnected) {
        let today = StatisticsCollection.getDay(new Date())
        let CompleteCount = {
            x: today,
            y: 0,
            figure: 0
        }
        let ActiveCount = {
            x: today,
            y: 0,
            figure: 0
        }

        let IdleCount = {
            x: today,
            y: 0,
            figure: 0
        }
        let OfflineCount = {
            x: today,
            y: 0,
            figure: 0
        }
        let DisconnectedCount = {
            x: today,
            y: 0,
            figure: 0
        }
        if (heatMap[0].data.length === 0) {
            //Created initial data set
            heatMap[0].data.push(CompleteCount)
            heatMap[1].data.push(ActiveCount)
            heatMap[2].data.push(IdleCount)
            heatMap[3].data.push(OfflineCount)
            heatMap[4].data.push(DisconnectedCount)
        } else {
            //Cycle through current data and check if day exists...

            let currentTotal = arrayTotal.reduce((a, b) => a + b, 0);
            for (let i = 0; i < heatMap.length; i++) {
                let lastInArray = heatMap[i].data.length - 1;
                //If x = today add that fucker up!
                if (heatMap[i].data[lastInArray].x === today) {

                    if (heatMap[i].name === "Completed") {
                        heatMap[i].data[lastInArray].y = ((heatMap[i].data[lastInArray].figure / currentTotal) * 100).toFixed(3)

                        if (!isFinite(heatMap[i].data[lastInArray].y)) {
                            heatMap[i].data[lastInArray].y = 0;
                        }
                        heatMap[i].data[lastInArray].figure = heatMap[i].data[lastInArray].figure + complete;
                        arrayTotal[0] = heatMap[i].data[lastInArray].figure;
                    }
                    if (heatMap[i].name === "Active") {
                        heatMap[i].data[lastInArray].y = ((heatMap[i].data[lastInArray].figure / currentTotal) * 100).toFixed(3)

                        if (!isFinite(heatMap[i].data[lastInArray].y)) {
                            heatMap[i].data[lastInArray].y = 0;
                        }
                        heatMap[i].data[lastInArray].figure = heatMap[i].data[lastInArray].figure + active;
                        arrayTotal[1] = heatMap[i].data[lastInArray].figure;


                    }
                    if (heatMap[i].name === "Offline") {
                        heatMap[i].data[lastInArray].y = ((heatMap[i].data[lastInArray].figure / currentTotal) * 100).toFixed(3)

                        if (!isFinite(heatMap[i].data[lastInArray].y)) {
                            heatMap[i].data[lastInArray].y = 0;
                        }
                        heatMap[i].data[lastInArray].figure = heatMap[i].data[lastInArray].figure + offline;
                        arrayTotal[2] = heatMap[i].data[lastInArray].figure;

                    }
                    if (heatMap[i].name === "Idle") {
                        heatMap[i].data[lastInArray].y = ((heatMap[i].data[lastInArray].figure / currentTotal) * 100).toFixed(3)
                        if (!isFinite(heatMap[i].data[lastInArray].y)) {
                            heatMap[i].data[lastInArray].y = 0;
                        }
                        heatMap[i].data[lastInArray].figure = heatMap[i].data[lastInArray].figure + idle;
                        arrayTotal[3] = heatMap[i].data[lastInArray].figure;

                    }
                    if (heatMap[i].name === "Disconnected") {
                        heatMap[i].data[lastInArray].y = ((heatMap[i].data[lastInArray].figure / currentTotal) * 100).toFixed(3)
                        if (!isFinite(heatMap[i].data[lastInArray].y)) {
                            heatMap[i].data[lastInArray].y = 0;
                        }
                        heatMap[i].data[lastInArray].figure = heatMap[i].data[lastInArray].figure + disconnected;
                        arrayTotal[4] = heatMap[i].data[lastInArray].figure;

                    }
                } else {
                    //Must be a new day, so shift with new heatMap
                    heatMap[0].data.push(CompleteCount)
                    heatMap[1].data.push(ActiveCount)
                    heatMap[2].data.push(IdleCount)
                    heatMap[3].data.push(OfflineCount)
                    heatMap[4].data.push(DisconnectedCount)
                }
            }


        }
        //Clean up old days....
        if (heatMap[0].data.length === 8) {
            heatMap[0].data.shift()
            heatMap[1].data.shift()
            heatMap[2].data.shift()
            heatMap[3].data.shift()
            heatMap[4].data.shift()
        }
        farmStats[0].heatMap = heatMap;
        farmStats[0].markModified('heatMap');
        farmStats[0].save();

    }
    static async farmInformation(farmPrinters) {
        let farmInfo = await this.blankFarmInfo();
        let printTimeEstimate = [];
        let printTimeRemaining = [];
        let printTimeElapsed = [];
        let toolA = [];
        let toolT = [];
        let bedA = [];
        let bedT = [];
        farmPrinters.forEach(printer => {
            if (typeof printer.stateColour != "undefined") {
                if (printer.stateColour.category === "Active") {
                    if (typeof printer.job != "undefined") {
                        printTimeEstimate.push(printer.job.estimatedPrintTime);
                    }
                    if (typeof printer.progress != "undefined") {
                        printTimeRemaining.push(printer.progress.printTimeLeft);
                        printTimeElapsed.push(printer.progress.printTime);
                    }
                    if (typeof printer.temps != "undefined") {
                        toolA.push(printer.temps[0].tool0.actual);
                        toolT.push(printer.temps[0].tool0.target);
                        bedA.push(printer.temps[0].bed.actual);
                        bedT.push(printer.temps[0].bed.target);
                    }
                }
            }
        });

        let activeToolA =
            Math.round(toolA.reduce((a, b) => a + b, 0) * 10) / 10;
        let activeToolT =
            Math.round(toolT.reduce((a, b) => a + b, 0) * 10) / 10;
        let activeBedA = Math.round(bedA.reduce((a, b) => a + b, 0) * 10) / 10;
        let activeBedT = Math.round(bedT.reduce((a, b) => a + b, 0) * 10) / 10;

        farmInfo.totalElapsedTime = printTimeElapsed.reduce((a, b) => a + b, 0);
        farmInfo.totalRemainingTime = printTimeRemaining.reduce((a, b) => a + b, 0);
        farmInfo.totalEstimateTime = printTimeEstimate.reduce((a, b) => a + b, 0);
        farmInfo.avgElapsedTime =
            farmInfo.totalElapsedTime / printTimeElapsed.length;
        farmInfo.avgRemainingTime =
            farmInfo.totalRemainingTime / printTimeRemaining.length;
        farmInfo.avgEstimateTime =
            farmInfo.totalEstimateTime / printTimeEstimate.length;
        farmInfo.totalActualTemperature = activeBedA + activeToolA;

        let timeStamp = new Date();
        timeStamp = timeStamp.getTime();
        currentHistoryTemp[0].data.push({ x: timeStamp, y: activeToolA })
        currentHistoryTemp[1].data.push({ x: timeStamp, y: activeToolT })
        currentHistoryTemp[2].data.push({ x: timeStamp, y: activeBedA })
        currentHistoryTemp[3].data.push({ x: timeStamp, y: activeBedT })
        if (currentHistoryTemp[0].data.length > 720) {
            currentHistoryTemp[0].data.shift();
            currentHistoryTemp[1].data.shift();
            currentHistoryTemp[2].data.shift();
            currentHistoryTemp[3].data.shift();
        }
        farmInfo.temp = currentHistoryTemp;
        farmStats[0].farmInfo = farmInfo
    }

    static async octofarmStatistics(farmPrinters) {
        let octofarmStatistics = await this.blankFarmStatistics();
        let dateNow = new Date();
        dateNow = dateNow.getTime();
        let activeTimeTotle = [];
        farmPrinters.forEach(printer => {
            activeTimeTotle.push(printer.currentUptime);
        })

        let activeTime = activeTimeTotle.reduce((a, b) => a + b, 0);
        let timeSpan =  dateNow - farmStats[0].farmStart.getTime();
        let idleTime = timeSpan - activeTime;

        octofarmStatistics.activeHours = activeTime;
        octofarmStatistics.idleHours = idleTime;
        let activePercent = activeTime / timeSpan * 100;
        let idlePercent = idleTime / timeSpan * 100;
        activePercent = activePercent.toFixed(2);
        idlePercent = idlePercent.toFixed(2);

        octofarmStatistics.activePercent = activePercent;
        octofarmStatistics.idlePercent = idlePercent;

        // let timeSpan = dateNow - printer.dateAdded;
        // let percentUp = printer.currentUptime / timeSpan * 100;
        // percentUp = percentUp.toFixed(2)+"%"


        let storageFree = [];
        let storageTotal = [];
        let devices = [];
        let fileSizes = [];
        //Collect unique devices - Total for farm storage should not duplicate storage on instances running on same devices.
        farmPrinters.forEach((printer, index) => {
            if (typeof printer.storage != "undefined") {
                let device = {
                    ip: printer.printerURL,
                    index: printer.index,
                    storage: printer.storage
                };
                devices.push(device);
            }
            if (typeof printer.fileList != "undefined") {
                printer.fileList.files.forEach(file => {
                    fileSizes.push(file.size);
                });
            }
        });

        let uniqueDevices = _.uniqBy(devices, "printerURL");

        uniqueDevices.forEach(device => {
            storageFree.push(device.storage.free);
            storageTotal.push(device.storage.total);
        });

        let storageFreeTotal = storageFree.reduce((a, b) => a + b, 0);
        let storageTotalTotal = storageTotal.reduce((a, b) => a + b, 0);

        octofarmStatistics.storageUsed = storageTotalTotal - storageFreeTotal;
        octofarmStatistics.storageRemain = storageFreeTotal;
        octofarmStatistics.storagePercent = Math.floor(
            (octofarmStatistics.storageUsed / storageTotalTotal) * 100
        );

        farmStats[0].octofarmStatistics = octofarmStatistics;
    }
    static async printStatistics() {
        let printStatistics = await this.blankPrintStatistics();
        let history = await History.find({});
        let completed = [];
        let cancelled = [];
        let failed = [];
        let printTimes = [];
        let filamentLengths = [];
        let filamentWeights = [];
        history.forEach(print => {
            if (print.printHistory.filamentLength != "-") {
                filamentLengths.push(print.printHistory.filamentLength);
            }

            if (print.printHistory.success) {
                let filamentTypes = returnFilamentTypes();
                let calcWeight = null;
                if (
                    typeof print.printHistory.filamentSelection != "undefined" &&
                    print.printHistory.filamentSelection != "None chosen..."
                ) {
                    let currentType = null;
                    let filamentKeys = Object.entries(filamentTypes);

                    filamentKeys.forEach(entry => {
                        if (
                            entry[0] === print.printHistory.filamentSelection.roll.type[0]
                        ) {
                            currentType = entry[1].density;
                        }
                    });
                    calcWeight =
                        (3.14 * (1.75 / 2)) ^
                        ((2 * parseFloat(currentType) * print.printHistory.filamentLength) /
                            1000);
                } else {
                    calcWeight =
                        (3.14 * (1.75 / 2)) ^
                        ((2 * 1.24 * print.printHistory.filamentLength) / 1000);
                }

                completed.push(print.printHistory.success);
                printTimes.push(print.printHistory.printTime);
                filamentLengths.push(print.printHistory.filamentLength);
                filamentWeights.push(calcWeight);
            } else {
                if (print.printHistory.reason === "cancelled") {
                    cancelled.push(print.printHistory.success);
                } else {
                    failed.push(print.printHistory.success);
                }
            }
        });

        printStatistics.completed = completed.length;
        printStatistics.cancelled = cancelled.length;
        printStatistics.failed = failed.length;

        printStatistics.completedPercent =
            (completed.length /
                (completed.length + cancelled.length + failed.length)) *
            100;
        if (isNaN(printStatistics.completedPercent)) {
            printStatistics.completedPercent = 100;
        }
        if (printStatistics.completedPercent === Infinity) {
            printStatistics.completedPercent = 0;
        }
        printStatistics.cancelledPercent =
            (cancelled.length /
                (cancelled.length + completed.length + failed.length)) *
            100;
        if (isNaN(printStatistics.cancelledPercent)) {
            printStatistics.cancelledPercent = 100;
        }
        if (printStatistics.cancelledPercent === Infinity) {
            printStatistics.cancelledPercent = 0;
        }
        printStatistics.failedPercent =
            (failed.length / (failed.length + completed.length + cancelled.length)) *
            100;
        if (isNaN(printStatistics.failedPercent)) {
            printStatistics.failedPercent = 100;
        }
        if (printStatistics.failedPercent === Infinity) {
            printStatistics.failedPercent = 0;
        }
        printStatistics.completedPercent = printStatistics.completedPercent;
        printStatistics.cancelledPercent = printStatistics.cancelledPercent;
        printStatistics.failedPercent = printStatistics.failedPercent;

        printStatistics.longestPrint = Math.max(...printTimes);
        if (printStatistics.longestPrint === -Infinity) {
            printStatistics.longestPrint = 0;
        }
        printStatistics.shortestPrint = Math.min(...printTimes);
        if (printStatistics.shortestPrint === Infinity) {
            printStatistics.shortestPrint = 0;
        }
        printStatistics.averagePrintTime = printTimes.reduce((a, b) => a + b, 0);

        printStatistics.averagePrintTime =
            printStatistics.averagePrintTime / printTimes.length;
        if (isNaN(printStatistics.averagePrintTime)) {
            printStatistics.averagePrintTime = 0;
        }

        let totalFilamentLength = filamentLengths.reduce((a, b) => a + b, 0);
        if (isNaN(totalFilamentLength)) {
            totalFilamentLength = 0;
        }

        totalFilamentLength = totalFilamentLength / 1000;
        totalFilamentLength = Math.round(totalFilamentLength * 100) / 100;

        let totalFilamentWeight = filamentWeights.reduce((a, b) => a + b, 0);
        if (isNaN(totalFilamentWeight)) {
            totalFilamentWeight = 0;
        }

        printStatistics.filamentUsage =
            totalFilamentLength + "m / " + totalFilamentWeight + "g";

        farmStats[0].printStatistics = printStatistics;
    }
    static blankCurrentCount() {
        let currentOperationsCount = {
            printerCount: 0,
            complete: 0,
            offline: 0,
            active: 0,
            idle: 0,
            disconnected: 0,
            farmProgress: 0,
            farmProgressColour: "danger"
        };
        return currentOperationsCount;
    }
    static blankFarmInfo() {
        let farmInfo = {
            activeToolT: 0,
            activeBedT: 0,
            activeToolA: 0,
            activeBedA: 0,
            avgEstimateTime: 0,
            avgRemainingTime: 0,
            avgElapsedTime: 0,
            totalEstimateTime: 0,
            totalRemainingTime: 0,
            totalElapsedTime: 0
        };
        return farmInfo;
    }
    static blankFarmStatistics() {
        let octofarmStatistics = {
            activeHours: 0,
            activePercent: 0,
            idleHours: 0,
            idlePercent: 0,
            totalHours: 0,
            storageUsed: 0,
            storagePercent: 0,
            storageRemain: 0,
        };
        return octofarmStatistics;
    }
    static blankPrintStatistics() {
        let printStatistics = {
            completed: 0,
            completedPercent: 33.3,
            cancelled: 0,
            cancelledPercent: 33.3,
            failed: 0,
            failedPercent: 33.3,
            longestPrint: 0,
            shortestPrint: 0,
            averagePrintTime: 0,
            filamentUsage: 0
        };
        return printStatistics;
    }
}

module.exports = {
    StatisticsCollection: StatisticsCollection
};