const runner = require("../../runners/state.js");
const Runner = runner.Runner;
const jobClean = require("../../lib/dataFunctions/jobClean.js");
const JobClean = jobClean.JobClean;
const fileClean = require("../../lib/dataFunctions/fileClean.js");
const FileClean = fileClean.FileClean;
const _ = require("lodash");

let printersInformation = [];
let previousJobInformation = [];
let previousFilamentSelection = [];
let previousFileList = [];
let currentOperations = [];
let printerControlList = [];
let currentLogs = [];
let interval = false;

if(interval === false){
    interval = setInterval(async function() {
        PrinterClean.start();
    }, 500);
}

class PrinterClean{
    static returnPrintersInformation(){
        return printersInformation;
    }
    static returnPrinterControlList(){
        return printerControlList
    }

    static forceJobClean(){
        JobClean.start();
    }
    static forceFileClean(){
        FileClean.start();
    }

    static async start() {
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
                if(typeof previousFileList[p] === 'undefined'){
                    if(typeof farmPrinters[p].fileList !== 'undefined'){
                        previousFileList[p] = JSON.parse(JSON.stringify(farmPrinters[p].fileList.files));
                    }
                }else{
                    if(!_.isEqual(previousFileList[p], JSON.parse(JSON.stringify(farmPrinters[p].fileList.files)))){
                        console.log(p,"File CLEAN")
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
                    systemCheck: farmPrinters[p].systemChecks
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
                sortedPrinter.otherSettings = await PrinterClean.sortOtherSettings(farmPrinters[p].tempTriggers, farmPrinters[p].settingsWebcam)
                sortedPrinter.printerName = await PrinterClean.grabPrinterName(farmPrinters[p]);
                sortedPrinter.storage = farmPrinters[p].storage
                sortedPrinters.push(sortedPrinter);
                sortedPrinterControl.push({printerName: sortedPrinter.printerName, printerID: sortedPrinter._id, state: sortedPrinter.printerState.colour});
                //Update current job for checking next time...
                previousJobInformation[p] = farmPrinters[p].job;
                if(typeof farmPrinters[p].fileList !== 'undefined') {
                    previousFileList[p] = JSON.parse(JSON.stringify(farmPrinters[p].fileList.files));
                }
                previousFilamentSelection[p] = JSON.parse(JSON.stringify(farmPrinters[p].selectedFilament));
            }
            printersInformation = sortedPrinters;
            printerControlList = sortedPrinterControl;
        }catch(e){
            console.log(e)
        }


    }
    static sortOtherSettings(temp, webcam){
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
        return otherSettings;
    }

    static async sortTerminal(i, logs){
        if(typeof logs !== 'undefined'){
            if(typeof currentLogs[i] === 'undefined'){
                currentLogs[i] = [];
            }else{
                logs.forEach(log => {
                    currentLogs[i].push(log);
                    if(currentLogs[i].length >= 1000){
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
}
module.exports = {
    PrinterClean: PrinterClean
};
PrinterClean.start();