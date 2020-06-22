const runner = require("../../runners/state.js");
const Runner = runner.Runner;
const historyClean = require("../../lib/dataFunctions/historyClean.js");
const HistoryClean = historyClean.HistoryClean;
const Profiles = require("../../models/Profiles.js");
let printersInformation = [];
let currentOperations = [];

let interval = false;

if(interval === false){
    interval = setInterval(function() {
        PrinterClean.start();
    }, 500);

}

class PrinterClean{
    static async start() {
        let farmPrinters = Runner.returnFarmPrinters();
        let sortedPrinters = [];
        for (let p = 0; p < farmPrinters.length; p++) {
            console.log(farmPrinters[p].settingsAppearance)
            let sortedPrinter = {
                _id: farmPrinters[p]._id,
                sortIndex: farmPrinters[p].sortIndex,
                printerName: PrinterClean.grabPrinterName(farmPrinters),
                hostState: {
                    state: farmPrinters[p].hostState,
                    colour: farmPrinters[p].stateColour,
                    desc: farmPrinters[p].stateDescription
                },
                printerState: {
                    state: farmPrinters[p].state,
                    colour: farmPrinters[p].stateColour,
                    desc: farmPrinters[p].stateDescription
                },
                webSocketState: {
                    state: farmPrinters[p].hostState,
                    colour: farmPrinters[p].stateColour,
                    desc: farmPrinters[p].stateDescription
                },
                group: farmPrinters[p],
                printerURL: farmPrinters[p].printerURL,
                cameraURL: farmPrinters[p].camURL,
                apikey: farmPrinters[p].apikey,
                octoprintVersion: farmPrinters[p].octoprintVersion,
                tools: await PrinterClean.sortTemps(farmPrinters[p].temps),
                currentJob: await PrinterClean.sortJob(farmPrinters[p]),
                selectedFilament: farmPrinters[p].selectedFilament,
                fileList: await PrinterClean.sortFiles(farmPrinters[p].fileList, farmPrinters[p].costSettings, farmPrinters[p].selectedFilament, farmPrinters[p].job),
                currentProfile: await PrinterClean.sortProfile(farmPrinters[p].profiles, farmPrinters[p].current),
                currentConnection: await PrinterClean.sortConnection(farmPrinters[p].current),
                terminal: "",
                costSettings: farmPrinters[p].costSettings,
                powerSettings: farmPrinters[p].powerSettings,
                gcodeScripts: await PrinterClean.sortGCODE(farmPrinters[p].settingsScripts),
                otherSettings: ""
            }
        }
    }
    static async sortGCODE(settings){
        if(typeof settings !== 'undefined'){
            //console.log(settings)
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
    static async sortFiles(fileList, printCost, selectedFilament, job){
        let sortedFileList = [];
        if(typeof fileList !== 'undefined'){
            for(let f = 0; f < fileList.files.length; f++){
                let file = fileList.files[f];
                let sortedFile = {
                    uploadDate: file.date,
                    fileSize: file.size,
                    toolUnits: "",
                    expectedPrintTime: file.time,
                    printCost: HistoryClean.getPrintCost(file.time, printCost),
                }
                let selectedArray = [];
                if(selectedFilament !== null){
                    for(let s = 0; s < selectedFilament.length; s++){
                        if(selectedFilament[s] !== null){
                            let filament = JSON.parse(JSON.stringify(selectedFilament[s]));
                            let profile = await Profiles.findById(filament.spools.profile);
                            filament.spools.profile = profile.profile;
                            selectedArray.push(filament)

                        }
                    }
                }
                sortedFile.toolUnits = await HistoryClean.getSpool(selectedArray, job, true, sortedFile.estimatedPrintTime);
                sortedFileList.push(sortedFile)
            }
        }
        return sortedFileList;
    }
    static async sortJob(printer){
        let currentJob = {
            progress: 0,
            fileName: "No File Selected",
            fileDisplay: "No File Selected",
            filePath: "No File Selected",
            expectedCompletionDate: "No File Selected",
            expectedPrintTime: null,
            expectedFilamentCosts: "No File Selected",
            expectedPrinterCosts: "No File Selected",
            expectedTotals: null,
            currentZ: printer.currentZ,
            printTimeElapsed: null,
            printTimeRemaining: null,
            averagePrintTime: null,
            lastPrintTime: null,
        }
        if(typeof printer.job !== 'undefined'){
            currentJob.fileName = printer.job.file.name;
            currentJob.fileDisplay = printer.job.file.display;
            currentJob.filePath = printer.job.file.path;
            currentJob.expectedPrintTime = printer.job.estimatedPrintTime;
            currentJob.averagePrintTime = printer.job.averagePrintTime;
            currentJob.lastPrintTime = printer.job.lastPrintTime;
            currentJob.expectedPrinterCosts = await HistoryClean.getPrintCost(printer.job.estimatedPrintTime, printer.costSettings);
            let selectedArray = [];
            for(let s = 0; s < printer.selectedFilament.length; s++){
                if(printer.selectedFilament[s] !== null){
                    let selectedFilament =  JSON.parse(JSON.stringify(printer.selectedFilament[s]));
                    let profile = await Profiles.findById(selectedFilament.spools.profile);
                    selectedFilament.spools.profile = profile.profile;
                    selectedArray.push(selectedFilament)
                }
            }
            currentJob.expectedFilamentCosts = await HistoryClean.getSpool(selectedArray, printer.job, true, printer.job.estimatedPrintTime);
            let numOr0 = n => isNaN(n) ? 0 : parseFloat(n)
            let spoolCost = 0;
            let totalVolume = 0;
            let totalLength = 0;
            let totalWeight = 0;
            if(typeof currentJob.expectedFilamentCosts !== 'undefined' && currentJob.expectedFilamentCosts !== null){
                let keys = Object.keys(currentJob.expectedFilamentCosts)
                currentJob.expectedFilamentCosts.forEach((spool,index) => {
                    if(typeof spool["tool"+keys[index]] !== 'undefined'){
                        spoolCost = spoolCost + numOr0(spool["tool"+keys[index]].cost)
                        totalVolume = totalVolume + numOr0(spool["tool"+keys[index]].volume)
                        totalLength = totalLength + numOr0(spool["tool"+keys[index]].length)
                        totalWeight = totalWeight + numOr0(spool["tool"+keys[index]].weight)
                    }
                })
            }
            spoolCost = numOr0(spoolCost)
            currentJob.expectedTotals = {
                totalCost: (parseFloat(currentJob.expectedPrinterCosts) + parseFloat(spoolCost)).toFixed(2),
                totalVolume: parseFloat(totalVolume),
                totalLength: parseFloat(totalLength),
                totalWeight: parseFloat(totalWeight),
                spoolCost: parseFloat(spoolCost)
            }
        }
        if(typeof printer.progress !== 'undefined'){
            currentJob.progress = printer.progress.completion;
            currentJob.printTimeRemaining = printer.progress.printTimeLeft;
            currentJob.printTimeElapsed = printer.progress.printTime;
            currentJob.expectedCompletionDate = await PrinterClean.getCompletionDate(printer.progress.printTimeLeft, printer.progress.completion);
        }

        return currentJob;


    }
    static async getCompletionDate(printTimeLeft, completion){
        let currentDate = new Date();
        let dateComplete = "";
        if(completion === 100){
            dateComplete = "Print Ready for Harvest"
        }else {
            currentDate = currentDate.getTime();
            let futureDateString = new Date(currentDate + printTimeLeft * 1000).toDateString()
            let futureTimeString = new Date(currentDate + printTimeLeft * 1000).toTimeString()
            futureTimeString = futureTimeString.substring(0, 8);
            dateComplete = futureDateString + ": " + futureTimeString;
        }
        return dateComplete;
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
}
module.exports = {
    PrinterClean: PrinterClean
};
PrinterClean.start();