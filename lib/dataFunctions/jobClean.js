const historyClean = require("../../lib/dataFunctions/historyClean.js");
const HistoryClean = historyClean.HistoryClean;
const Profiles = require("../../models/Profiles.js");
const runner = require("../../runners/state.js");
const Runner = runner.Runner;

let cleanJobs = [];

let interval = false;

if(interval === false){
    interval = setInterval(function() {
        JobClean.start();
    }, 30000);
}

class JobClean{
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
    static returnJob(p){
        return cleanJobs[p];
    }
    static async start(){
        let farmPrinters = Runner.returnFarmPrinters();
        for(let p=0; p<farmPrinters.length; p++){
            let printer = farmPrinters[p]
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
                currentZ: null,
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
                if(typeof printer.currentZ !== 'undefined'){
                    currentJob.currentZ = printer.currentZ
                }
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
                currentJob.expectedCompletionDate = await JobClean.getCompletionDate(printer.progress.printTimeLeft, printer.progress.completion);
            }

            cleanJobs[p] = currentJob;
        }




    }
}
module.exports = {
    JobClean: JobClean
};
JobClean.start();