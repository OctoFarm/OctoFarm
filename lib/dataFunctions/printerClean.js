const runner = require("../../runners/state.js");
const Runner = runner.Runner;
const jobClean = require("../../lib/dataFunctions/jobClean.js");
const JobClean = jobClean.JobClean;
const fileClean = require("../../lib/dataFunctions/fileClean.js");
const FileClean = fileClean.FileClean;
const historyClean = require("../../lib/dataFunctions/historyClean.js");
const HistoryClean = historyClean.HistoryClean;
const _ = require("lodash");
const FarmStatistics = require("../../models/FarmStatistics.js");

let printersInformation = [];
let previousJobInformation = [];
let previousFilamentSelection = [];
let currentOperations = {
    operations: [],
    count:{
        printerCount: 0,
        complete: 0,
        offline: 0,
        active: 0,
        idle: 0,
        disconnected: 0,
        farmProgress: 0,
        farmProgressColour: "danger"
    }
};
let dashboardStatistics = {
    currentUtilisation: {},
    currentStatus: {},
    timeEstimates: {},
    farmUtilisation: {},
    printerHeatMaps: {},
    utilisationGraph: {},
    temperatureGraph: {},
};
let printerControlList = [];
let currentLogs = [];
let printerInterval = false;
let statisticsInterval = false;
let farmStats = null;
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
}, {
    name: 'Actual Chamber',
    data: []
}, {
    name: 'Target Chamber',
    data: []
}];
let heatMapCounter = 69120;
let arrayTotal = [];
if(printerInterval === false){
    printerInterval = setInterval(async function() {
        PrinterClean.printerStart();
    }, 500);
}
if(statisticsInterval === false){
    statisticsInterval = setInterval(async function() {
        PrinterClean.statisticsStart();
    }, 5000);
}
class PrinterClean{
    static returnPrintersInformation(){
        return printersInformation;
    }
    static returnPrinterControlList(){
        return printerControlList;
    }
    static returnCurrentOperations(){
        return currentOperations;
    }
    static returnDashboardStatistics(){
        return dashboardStatistics;
    }

    static forceJobClean(){
        JobClean.start();
    }
    static forceFileClean(){
        FileClean.start();
    }

    static async printerStart() {
        try{
            let farmPrinters = Runner.returnFarmPrinters();
            let sortedPrinters = [];
            let sortedPrinterControl = [];
            for (let p = 0; p < farmPrinters.length; p++) {
                if(typeof previousJobInformation[p] === 'undefined'){
                    previousJobInformation[p] = farmPrinters[p].job;
                }else{
                    if(!_.isEqual(previousJobInformation[p], farmPrinters[p].job)){
                        console.log(p,"JOB CLEAN")
                        PrinterClean.forceJobClean();
                    }
                }
                if(typeof previousFilamentSelection[p] === 'undefined'){
                    previousFilamentSelection[p] = JSON.parse(JSON.stringify(farmPrinters[p].selectedFilament));
                }else{
                    if(!_.isEqual(previousFilamentSelection[p], JSON.parse(JSON.stringify(farmPrinters[p].selectedFilament)))){
                        console.log(p,"File CLEAN")
                        PrinterClean.forceFileClean();
                        console.log(p,"Job CLEAN")
                        PrinterClean.forceJobClean();
                    }
                }
                if(typeof farmPrinters[p].fileList !== 'undefined'){
                    if(farmPrinters[p].fileList.clean){
                        farmPrinters[p].fileList.clean = false;
                        console.log(p, "File CLEAN")
                        PrinterClean.forceFileClean();
                    }

                }

                let sortedPrinter = {
                    _id: farmPrinters[p]._id,
                    sortIndex: farmPrinters[p].sortIndex,
                    hostState: {
                        state: farmPrinters[p].hostState,
                        colour: farmPrinters[p].hostStateColour,
                        desc: farmPrinters[p].hostDescription,
                    },
                    printerState: {
                        state: farmPrinters[p].state,
                        colour: farmPrinters[p].stateColour,
                        desc: farmPrinters[p].stateDescription,
                    },
                    webSocketState: {
                        colour: farmPrinters[p].webSocket,
                        desc: farmPrinters[p].webSocketDescription,
                    },
                    group: farmPrinters[p].group,
                    printerURL: farmPrinters[p].printerURL,
                    cameraURL: farmPrinters[p].camURL,
                    apikey: farmPrinters[p].apikey,
                    octoPrintVersion: farmPrinters[p].octoPrintVersion,
                    flowRate: farmPrinters[p].flowRate,
                    feedRate: farmPrinters[p].feedRate,
                    stepRate: farmPrinters[p].stepRate,
                    systemChecks: farmPrinters[p].systemChecks,
                    currentIdle: farmPrinters[p].currentIdle,
                    currentActive: farmPrinters[p].currentActive,
                    currentOffline: farmPrinters[p].currentOffline,
                    dateAdded: farmPrinters[p].dateAdded
                }
                sortedPrinter.tools = await PrinterClean.sortTemps(farmPrinters[p].temps)
                sortedPrinter.currentJob = await JobClean.returnJob(p)
                sortedPrinter.selectedFilament = farmPrinters[p].selectedFilament
                sortedPrinter.fileList = await FileClean.returnFiles(p)

                sortedPrinter.currentProfile = await PrinterClean.sortProfile(farmPrinters[p].profiles, farmPrinters[p].current)
                sortedPrinter.currentConnection = await PrinterClean.sortConnection(farmPrinters[p].current)
                sortedPrinter.connectionOptions = farmPrinters[p].options
                sortedPrinter.terminal = await PrinterClean.sortTerminal(p, farmPrinters[p].logs)
                sortedPrinter.costSettings = farmPrinters[p].costSettings
                sortedPrinter.powerSettings = farmPrinters[p].powerSettings
                sortedPrinter.gcodeScripts = await PrinterClean.sortGCODE(farmPrinters[p].settingsScripts)
                sortedPrinter.otherSettings = await PrinterClean.sortOtherSettings(farmPrinters[p].tempTriggers, farmPrinters[p].settingsWebcam, farmPrinters[p].settingsServer)
                sortedPrinter.printerName = await PrinterClean.grabPrinterName(farmPrinters[p]);
                sortedPrinter.storage = farmPrinters[p].storage
                sortedPrinters.push(sortedPrinter);
                sortedPrinterControl.push({printerName: sortedPrinter.printerName, printerID: sortedPrinter._id, state: sortedPrinter.printerState.colour});
                //Check information is here and set status
                if(typeof sortedPrinter.currentProfile !== 'undefined'  && sortedPrinter.currentProfile !== null){
                    if(typeof farmPrinters[p].systemChecks !== 'undefined'){
                        farmPrinters[p].systemChecks.profile = true;
                    }
                }
                //Update current job for checking next time...
                previousJobInformation[p] = farmPrinters[p].job;
                previousFilamentSelection[p] = JSON.parse(JSON.stringify(farmPrinters[p].selectedFilament));
            }
            PrinterClean.sortCurrentOperations(sortedPrinters);
            printersInformation = sortedPrinters;
            printerControlList = sortedPrinterControl;
        }catch(e){
            console.log(e)
        }


    }
    static sortOtherSettings(temp, webcam, system){
        let otherSettings = {
            temperatureTriggers: null,
            webCamSettings: null,
        }
        if(typeof temp !== 'undefined'){
            otherSettings.temperatureTriggers = temp;
        }
        if(typeof webcam !== 'undefined'){
            otherSettings.webCamSettings = webcam;
        }
        if(typeof system !== 'undefined'){
            otherSettings.system = system;
        }

        return otherSettings;
    }

    static async sortTerminal(i, logs){
        if(typeof logs !== 'undefined'){
            if(typeof currentLogs[i] === 'undefined'){
                currentLogs[i] = [];
            }else{
                logs.forEach(log => {
                    currentLogs[i].push(log);
                    if(currentLogs[i].length >= 300){
                        currentLogs[i].shift();
                    }
                })
            }
        }else{
            currentLogs[i] = [];
        }
        return currentLogs[i];
    }
    static async sortGCODE(settings){
        if(typeof settings !== 'undefined'){
            return settings.gcode
        }else{
            return null
        }
    }
    static async sortConnection(current){
        if(typeof current !== 'undefined'){
            return {baudrate: current.baudrate, port: current.port, printerProfile: current.printerProfile}
        }else{
            return null;
        }

    }
    static async sortProfile(profile, current){
        if(typeof profile !== 'undefined'){
            if(typeof current !== 'undefined'){
                return profile[current.printerProfile];
            }
        }else{
            return null;
        }
    }



    static async sortTemps(temps){
        if(typeof temps !== 'undefined'){
            return temps;
        }else{
            return null;
        }
    }
    static grabPrinterName(printer){
        let name = null;
        if (typeof printer.settingsAppearance != "undefined") {
            if (printer.settingsAppearance.name === "" || printer.settingsAppearance.name === null) {
                name = printer.printerURL;
            } else {
                name = printer.settingsAppearance.name;
            }
        } else {
            name = printer.printerURL;
        }
        return name;
    }
    static async sortCurrentOperations(farmPrinters){
        let complete = [];
        let active = [];
        let idle = [];
        let offline = [];
        let disconnected = [];
        let progress = [];
        try {
            for(let o = 0; o < farmPrinters.length; o++){
                let printer = farmPrinters[o];
                let name = printer.printerName;
                if (typeof printer.printerState != "undefined") {
                    if (printer.printerState.colour.category === "Idle") {
                        idle.push(printer._id);
                    }
                    if (
                        printer.printerState.colour.category === "Offline"
                    ) {
                        offline.push(printer._id);
                    }
                    if (
                        printer.printerState.colour.category === "Disconnected"
                    ) {
                        disconnected.push(printer._id);
                    }

                }
                if (
                    typeof printer.printerState != "undefined" &&
                    printer.currentJob != null
                ) {
                    let id = printer._id
                    id = id.toString();
                    if (printer.printerState.colour.category === "Complete") {
                        complete.push(printer._id);
                        progress.push(printer.currentJob.progress);

                        currentOperations.operations.push({
                            index: id,
                            name: name,
                            progress: Math.floor(printer.currentJob.progress),
                            progressColour: "success",
                            timeRemaining: printer.currentJob.printTimeRemaining
                        });
                    }
                    if (
                        printer.printerState.colour.category === "Active" &&
                        typeof printer.currentJob != "undefined"
                    ) {
                        active.push(printer._id);
                        progress.push(printer.currentJob.progress);
                        currentOperations.operations.push({
                            index: id,
                            name: name,
                            progress: Math.floor(printer.currentJob.progress),
                            progressColour: "warning",
                            timeRemaining: printer.currentJob.printTimeRemaining
                        });
                    }

                }
            };
            let actProg = progress.reduce((a, b) => a + b, 0);

            currentOperations.count.farmProgress = Math.floor(
                actProg / progress.length
            );
            if (isNaN(currentOperations.count.farmProgress)) {
                currentOperations.count.farmProgress = 0;
            }
            if (currentOperations.count.farmProgress === 100) {
                currentOperations.count.farmProgressColour = "success";
            } else {
                currentOperations.count.farmProgressColour = "warning";
            }
            //17280
            if (heatMapCounter >= 69120) {
                PrinterClean.heatMapping(currentOperations.count.complete,
                    currentOperations.count.active,
                    currentOperations.count.offline,
                    currentOperations.count.idle,
                    currentOperations.count.disconnected
                )
                heatMapCounter = 0;
            } else {
                heatMapCounter = heatMapCounter + 1728;
            }
            currentOperations.count.printerCount = farmPrinters.length;
            currentOperations.count.complete = complete.length;
            currentOperations.count.active = active.length;
            currentOperations.count.offline = offline.length;
            currentOperations.count.idle = idle.length;
            currentOperations.count.disconnected = disconnected.length;
            currentOperations.operations = _.orderBy(currentOperations, ["progress"], ["desc"]);
        } catch (err) {
            console.log("Current Operations issue: " + err);
        }
    }

    static async statisticsStart(){
        let history = HistoryClean.returnStatistics();
        dashboardStatistics.currentUtilisation = [{
            data: [currentOperations.count.active, currentOperations.count.complete, currentOperations.count.idle, currentOperations.count.disconnected, currentOperations.count.offline]
        }]


        let farmTotal = currentOperations.count.active + currentOperations.count.complete + currentOperations.count.idle + currentOperations.count.disconnected + currentOperations.count.offline
        let activeTotal = currentOperations.count.active;
        let offlineTotal = currentOperations.count.offline;
        let idleTotal = currentOperations.count.complete + currentOperations.count.idle + currentOperations.count.disconnected;
        let activePer = activeTotal / farmTotal * 100;
        let idlePer = idleTotal / farmTotal * 100;
        let offlinePer = offlineTotal / farmTotal * 100;
        dashboardStatistics.currentStatus = [activePer, idlePer, offlinePer];

        let arrayEstimated = [];
        let arrayRemaining = [];
        let arrayElapsed = [];

        let arrayIdle = [];
        let arrayActive = [];
        let arrayOffline = [];
        let heatStatus = [];
        let heatProgress = [];
        let heatTemps = [];
        let heatUtilisation = [];

        let arrayGlobalToolTempActual = [];
        let arrayGlobalToolTempTarget = [];
        let arrayGlobalBedTempActual = [];
        let arrayGlobalBedTempTarget = [];
        let arrayGlobalChamberTempActual = [];
        let arrayGlobalChamberTempTarget = [];


        for(let p = 0; p < printersInformation.length; p++){
            let printer = printersInformation[p];
            if(typeof printer.currentJob !== 'undefined'){
                if(printer.currentJob.expectedPrintTime !== null){
                    arrayEstimated.push(printer.currentJob.expectedPrintTime)
                }
                if(printer.currentJob.expectedPrintTime !== null){
                    arrayRemaining.push(printer.currentJob.printTimeRemaining)
                }
                if(printer.currentJob.expectedPrintTime !== null){
                    arrayElapsed.push(printer.currentJob.printTimeElapsed)
                }
            }
            arrayIdle.push(printer.currentIdle);
            arrayActive.push(printer.currentActive);
            arrayOffline.push(printer.currentOffline);
            if(typeof printer.printerState !== 'undefined'){
                let status = printer.printerState.colour.category;
                let colour = printer.printerState.colour.name;
                if(printer.printerState.colour.category === "Offline"){
                    colour = "offline"
                }
                heatStatus.push(`<div title="${printer.printerName}: ${status}" class="bg-${colour} heatMap"></div>`)
                let tools = null;
                if(printer.printerState.colour.category === "Active" || printer.printerState.colour.category === "Idle" || printer.printerState.colour.category === "Complete") {
                    tools = printer.tools;
                }else{
                    tools = []
                    tools.push({
                        bed: {
                            actual: 0,
                            target: 0
                        },
                        tool0: {
                            actual: 0,
                            target: 0
                        }
                    })
                }
                    if (typeof tools !== 'undefined' && tools !== null) {
                        let rightString = [printer.printerName + ": "];
                        let leftString = [printer.printerName + ": "];
                        let arrayToolActual = [];
                        let arrayToolTarget = [];
                        let arrayOtherActual = [];
                        let arrayOtherTarget = [];
                        const keys = Object.keys(tools[0]);
                        for (let k = 0; k < keys.length; k++) {
                            if (typeof printer.currentProfile !== 'undefined' && printer.currentProfile !== null) {
                                if (printer.currentProfile.heatedChamber && keys[k] === "chamber") {
                                    let actual = "";
                                    let target = "";
                                    if (printer.tools[0][keys[k]].actual !== null) {
                                        actual = "Chamber A: " + printer.tools[0][keys[k]].actual + "°C ";
                                        arrayOtherActual.push(printer.tools[0][keys[k]].actual)
                                        arrayGlobalChamberTempActual.push(printer.tools[0][keys[k]].actual)

                                    } else {
                                        actual = "Chamber A: " + 0 + "°C";
                                    }
                                    if (printer.tools[0][keys[k]].target !== null) {
                                        target = "Chamber T: " + printer.tools[0][keys[k]].target + "°C ";
                                        arrayOtherTarget.push(printer.tools[0][keys[k]].target)
                                        arrayGlobalChamberTempTarget.push(printer.tools[0][keys[k]].target);
                                    } else {
                                        target = "Chamber T: " + 0 + "°C";
                                    }
                                    rightString[2] = actual + ", " + target;
                                }
                                if (printer.currentProfile.heatedBed && keys[k] === "bed") {
                                    let actual = "";
                                    let target = "";
                                    if (printer.tools[0][keys[k]].actual !== null) {
                                        actual = "Bed A: " + printer.tools[0][keys[k]].actual + "°C ";
                                        arrayOtherActual.push(printer.tools[0][keys[k]].actual)
                                        arrayGlobalBedTempActual.push(printer.tools[0][keys[k]].actual);
                                    } else {
                                        actual = "Bed A: " + 0 + "°C";
                                    }
                                    if (printer.tools[0][keys[k]].target !== null) {
                                        target = "Bed T: " + printer.tools[0][keys[k]].target + "°C ";
                                        arrayOtherTarget.push(printer.tools[0][keys[k]].target)
                                        arrayGlobalBedTempTarget.push(printer.tools[0][keys[k]].target);
                                    } else {
                                        target = "Bed T: " + 0 + "°C";
                                    }
                                    rightString[1] = actual + ", " + target;
                                }
                                if (keys[k].includes("tool")) {
                                    let toolNumber = keys[k].replace("tool", "");
                                    let actual = "";
                                    let target = "";
                                    if (printer.tools[0][keys[k]].actual !== null) {
                                        actual = `Tool ${toolNumber} A: ${printer.tools[0][keys[k]].actual}°C `;
                                        arrayToolActual.push(printer.tools[0][keys[k]].actual)
                                        arrayGlobalToolTempActual.push(printer.tools[0][keys[k]].actual);
                                    } else {
                                        actual = `Tool ${toolNumber} A: 0°C`;
                                    }
                                    if (printer.tools[0][keys[k]].target !== null) {
                                        target = `Tool ${toolNumber} T: ${printer.tools[0][keys[k]].target}°C `;
                                        arrayToolTarget.push(printer.tools[0][keys[k]].target)
                                        arrayGlobalToolTempTarget.push(printer.tools[0][keys[k]].target);
                                    } else {
                                        target = `Tool ${toolNumber} T: 0°C`;
                                    }
                                    leftString[parseInt(toolNumber) + 1] = actual + ", " + target;
                                }
                            }else{
                                leftString[1] = "Offline";
                                rightString[1] = "Offline";
                            }
                        }
                        let totalToolActual = arrayToolActual.reduce((a, b) => a + b, 0);
                        let totalToolTarget = arrayToolTarget.reduce((a, b) => a + b, 0);
                        let totalOtherActual = arrayOtherActual.reduce((a, b) => a + b, 0);
                        let totalOtherTarget = arrayToolActual.reduce((a, b) => a + b, 0);
                        let actualString = `<div class="d-flex flex-wrap"><div title="`;
                        for (let l = 0; l < leftString.length; l++) {
                            actualString += `${leftString[l]}`
                        }
                        actualString += `" class="${PrinterClean.checkTempRange(printer.printerState.colour.category, totalToolTarget, totalToolActual, printer.otherSettings.temperatureTriggers.heatingVariation, printer.otherSettings.temperatureTriggers.coolDown)} heatMapLeft></div>`;
                        actualString += `<div title="`
                        for(let r = 0; r < rightString.length; r++){
                            actualString += `${rightString[r]}`
                        }
                        actualString += `" class="${PrinterClean.checkTempRange(printer.printerState.colour.category, totalOtherTarget, totalOtherActual, printer.otherSettings.temperatureTriggers.heatingVariation, printer.otherSettings.temperatureTriggers.coolDown)} heatMapLeft></div></div>`;
                        heatTemps.push(actualString);
                    }
                let progress = 0;
                if(printer.currentJob.progress !== null){
                    progress = printer.currentJob.progress.toFixed(0);
                }
                heatProgress.push(`<div title="${printer.printerName}: ${progress}%" class="bg-${PrinterClean.getProgressColour(progress)} heatMap"></div>`)
            }
            let printerUptime = printer.currentActive + printer.currentIdle + printer.currentOffline;
            let percentUp = (printer.currentActive / printerUptime) * 100;
            heatUtilisation.push(`<div title="${printer.printerName}: ${percentUp.toFixed(0)}" class="bg-${PrinterClean.getProgressColour(percentUp)} heatMap"></div>`)
        }
        let timeStamp = new Date();
        timeStamp = timeStamp.getTime();
        let totalGlobalToolTempActual = arrayGlobalToolTempActual.reduce((a, b) => a + b, 0);
        let totalGlobalToolTempTarget = arrayGlobalToolTempTarget.reduce((a, b) => a + b, 0);
        let totalGlobalBedTempActual = arrayGlobalBedTempActual.reduce((a, b) => a + b, 0);
        let totalGlobalBedTempTarget = arrayGlobalBedTempTarget.reduce((a, b) => a + b, 0);
        let totalGlobalChamberTempActual = arrayGlobalChamberTempActual.reduce((a, b) => a + b, 0);
        let totalGlobalChamberTempTarget = arrayGlobalChamberTempTarget.reduce((a, b) => a + b, 0);
        let totalGlobalTemp = totalGlobalToolTempActual + totalGlobalBedTempActual + totalGlobalChamberTempActual;
        currentHistoryTemp[0].data.push({ x: timeStamp, y: totalGlobalToolTempActual })
        currentHistoryTemp[1].data.push({ x: timeStamp, y: totalGlobalToolTempTarget })
        currentHistoryTemp[2].data.push({ x: timeStamp, y: totalGlobalBedTempActual  })
        currentHistoryTemp[3].data.push({ x: timeStamp, y: totalGlobalBedTempTarget })
        currentHistoryTemp[4].data.push({ x: timeStamp, y: totalGlobalChamberTempActual })
        currentHistoryTemp[5].data.push({ x: timeStamp, y: totalGlobalChamberTempTarget })
        if (currentHistoryTemp[0].data.length > 720) {
            currentHistoryTemp[0].data.shift();
            currentHistoryTemp[1].data.shift();
            currentHistoryTemp[2].data.shift();
            currentHistoryTemp[3].data.shift();
        }
        dashboardStatistics.temperatureGraph = currentHistoryTemp;
        let totalEstimated = arrayEstimated.reduce((a, b) => a + b, 0);
        let totalRemaining = arrayRemaining.reduce((a, b) => a + b, 0);
        let totalElapsed = arrayElapsed.reduce((a, b) => a + b, 0);
        let averageEstimated = totalEstimated / arrayEstimated.length;
        let averageRemaining = totalRemaining / arrayRemaining.length;
        let averageElapsed = totalElapsed / arrayElapsed.length;
        let cumulativePercent = totalElapsed / totalEstimated  * 100;
        let cumulativePercentRemaining = 100 - cumulativePercent;
        let averagePercent = averageElapsed / averageEstimated * 100;
        let averagePercentRemaining = 100 - averagePercent;
        dashboardStatistics.timeEstimates = {
            totalElapsed: totalElapsed,
            totalRemaining: totalRemaining,
            totalEstimated: totalEstimated,
            averageElapsed: averageElapsed,
            averageRemaining: averageRemaining,
            averageEstimated: averageEstimated,
            cumulativePercent: cumulativePercent,
            cumulativePercentRemaining: cumulativePercentRemaining,
            averagePercent: averagePercent,
            averagePercentRemaining: averagePercentRemaining,
            totalFarmTemp: totalGlobalTemp
        };

        let activeHours = arrayActive.reduce((a, b) => a + b, 0);
        let idleHours = arrayIdle.reduce((a, b) => a + b, 0);
        let offlineHours = arrayOffline.reduce((a, b) => a + b, 0);
        let failedHours = history.currentFailed;
        let totalHours = history.currentFailed + activeHours + idleHours + offlineHours;
        let activePercent = (activeHours / totalHours) * 100;
        let offlinePercent = (offlineHours / totalHours) * 100;
        let idlePercent = (idleHours / totalHours) * 100;
        let failedPercent = (failedHours / totalHours) * 100;

        dashboardStatistics.farmUtilisation = {
            activeHours: activeHours,
            failedHours: failedHours,
            idleHours: idleHours,
            offlineHours: offlineHours,
            activeHoursPercent: activePercent,
            failedHoursPercent: failedPercent,
            idleHoursPercent: idlePercent,
            offlineHoursPercent: offlinePercent,
        }
        dashboardStatistics.printerHeatMaps = {
            heatStatus: heatStatus,
            heatProgress: heatProgress,
            heatTemps: heatTemps,
            heatUtilisation: heatUtilisation,
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
        let today = PrinterClean.getDay(new Date())
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
        dashboardStatistics.utilisationGraph = heatMap;
        farmStats[0].markModified('heatMap');
        farmStats[0].updateOne().catch(e => console.log(e));
    }
    static getProgressColour(progress) {
        progress = parseInt(progress)
        if (progress === 0) {
            return "dark"
        } else if (progress < 25) {
            return "secondary"
        } else if (progress >= 25 && progress <= 50) {
            return "primary"
        } else if (progress >= 50 && progress <= 75) {
            return "info"
        }else if (progress >= 75 && progress < 100) {
            return "warning"
        } else if (progress === 100) {
            return "success"
        }
    }
    static checkTempRange(state, target, actual, heatingVariation, coolDown){
        if(state === "Active" || state === "Idle"){
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
    static async initHeatMap(){
        if(farmStats === null){
            farmStats = await FarmStatistics.find({});
        }
        if(typeof farmStats[0].heatMap === 'undefined'){
            farmStats[0].heatMap = heatMap;
            dashboardStatistics.utilisationGraph = heatMap;
            farmStats[0].markModified("heatMap")
            farmStats[0].save();
        }else{
            heatMap = farmStats[0].heatMap;
            //Make sure array total is updated...
            let today = PrinterClean.getDay(new Date())
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
}
module.exports = {
    PrinterClean: PrinterClean
};
PrinterClean.printerStart();
PrinterClean.initHeatMap();
PrinterClean.statisticsStart();