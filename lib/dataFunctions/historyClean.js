const ServerSettings = require("../../models/ServerSettings.js");
const History = require("../../models/History.js");

let historyClean = [];
let statisticsClean = {
    completed: 0,
    cancelled: 0,
    failed: 0,
    longestPrintTime: 0,
    shortestPrintTime: 0,
    averagePrintTime: 0,
    mostPrintedFile: 0,
    printerMost: 0,
    printerLoad: 0,
    totalFilamentUsage: 0,
    averageFilamentUsage: 0,
    highestFilamentUsage: 0,
    lowestFilamentUsage:0,
    totalSpoolCost: 0,
    highestSpoolCost: 0,
    totalPrinterCost: 0,
    highestPrinterCost: 0,
};
let interval = false;

if(interval === false){
    interval = setInterval(function() {
        HistoryClean.start();
    }, 10000);

}


class HistoryClean{
    static returnHistory(){
        return historyClean;
    }
    static returnStatistics(){
        return statisticsClean;
    }
    static async start(){
        let history = await History.find({}, null, { sort: { historyIndex: -1 } })
        let historyArray = [];
        for(let h = 0; h < history.length; h++){
            let sorted = {
                _id: history[h]._id,
                index: history[h].printHistory.historyIndex,
                state: HistoryClean.getState(history[h].printHistory.success, history[h].printHistory.reason),
                printer: history[h].printHistory.printerName,
                file: HistoryClean.getFile(history[h].printHistory),
                startDate: history[h].printHistory.startDate,
                endDate: history[h].printHistory.endDate,
                printTime: history[h].printHistory.printTime,
                notes: history[h].printHistory.notes,
                printerCost: HistoryClean.getPrintCost(history[h].printHistory.printTime, history[h].printHistory.costSettings),
                spools: await HistoryClean.getSpool(history[h].printHistory.filamentSelection, history[h].printHistory.job, history[h].printHistory.success, history[h].printHistory.printTime),
                thumbnail: history[h].printHistory.thumbnail,
                job: await HistoryClean.getJob(history[h].printHistory.job, history[h].printHistory.printTime),
            }
            let spoolCost = 0;
            let totalVolume = 0;
            let totalLength = 0;
            let totalWeight = 0;
            let numOr0 = n => isNaN(n) ? 0 : parseFloat(n)
            if(typeof sorted.spools !== 'undefined' && sorted.spools !== null){
                let keys = Object.keys(sorted.spools)
                sorted.spools.forEach((spool,index) => {
                    if(typeof spool["tool"+keys[index]] !== 'undefined'){
                        spoolCost = spoolCost + numOr0(spool["tool"+keys[index]].cost)
                        totalVolume = totalVolume + numOr0(spool["tool"+keys[index]].volume)
                        totalLength = totalLength + numOr0(spool["tool"+keys[index]].length)
                        totalWeight = totalWeight + numOr0(spool["tool"+keys[index]].weight)
                    }
                })
            }
            spoolCost = numOr0(spoolCost)
            sorted.totalCost = (parseFloat(sorted.printerCost) + parseFloat(spoolCost)).toFixed(2);
            sorted.totalVolume = parseFloat(totalVolume);
            sorted.totalLength = parseFloat(totalLength);
            sorted.totalWeight = parseFloat(totalWeight);
            sorted.spoolCost = parseFloat(spoolCost);
            historyArray.push(sorted);
        }
        historyClean = historyArray;
        statisticsClean = await HistoryClean.getStatistics(historyArray);
    }
    static async getStatistics(historyClean){
        function arrayCounts(arr) {
            var a = [], b = [], prev;

            arr.sort();
            for (var i = 0; i < arr.length; i++ ) {
                if ( arr[i] !== prev ) {
                    a.push(arr[i]);
                    b.push(1);
                } else {
                    b[b.length-1]++;
                }
                prev = arr[i];
            }

            return [a, b];
        }
        let completed = [];
        let cancelled = [];
        let failed = [];
        let printTimes = [];
        let fileNames = [];
        let printerNames = [];
        let filamentWeight = [];
        let filamentLength = [];
        let printCost = [];
        let filamentCost = [];

        historyClean.forEach(history => {
            //console.log(history)
            if (history.state.includes("success")) {
                completed.push(true)
            } else if (history.state.includes("warning")) {
                cancelled.push(true)
            } else if (history.state.includes("danger")) {
                failed.push(true)
            }

            printTimes.push(history.printTime);

            fileNames.push(history.file.name);

            printerNames.push(history.printer);

            filamentWeight.push(history.totalWeight);
            filamentLength.push(history.totalLength);

            printCost.push(parseFloat(history.printerCost));
            filamentCost.push(history.spoolCost);
        })
        let totalFilamentWeight = filamentWeight.reduce((a, b) => a + b, 0);
        let totalFilamentLength = filamentLength.reduce((a, b) => a + b, 0);
        let filesArray = arrayCounts(fileNames)
        let mostPrintedFile = "No Files"
        if(filesArray[0].length !== 0){
            let countFilesArray = filesArray[1].indexOf(Math.max(...filesArray[1]));
            mostPrintedFile = filesArray[0][countFilesArray]
            mostPrintedFile = mostPrintedFile.replace(/_/g," ");
        }
        let printerNamesArray = arrayCounts(printerNames);
        let mostUsedPrinter = "No Printers";
        let leastUsedPrinter = "No Printers";
        if(printerNamesArray[0].length != 0){
            let maxIndexPrinterNames = printerNamesArray[1].indexOf(Math.max(...printerNamesArray[1]));
            let minIndexPrinterNames = printerNamesArray[1].indexOf(Math.min(...printerNamesArray[1]));
            mostUsedPrinter = printerNamesArray[0][maxIndexPrinterNames];
            leastUsedPrinter = printerNamesArray[0][minIndexPrinterNames];
        }
        let statTotal = completed.length + cancelled.length + failed.length;
        let statistics = {
            completed: completed.length,
            cancelled: cancelled.length,
            failed: failed.length,
            completedPercent: ((completed.length / statTotal) * 100).toFixed(2),
            cancelledPercent: ((cancelled.length / statTotal) * 100).toFixed(2),
            failedPercent: ((failed.length / statTotal) * 100).toFixed(2),
            longestPrintTime: (Math.max(...printTimes)).toFixed(2),
            shortestPrintTime: (Math.max(...printTimes)).toFixed(2),
            averagePrintTime: ((printTimes.reduce((a, b) => a + b, 0)) / printTimes.length).toFixed(2),
            mostPrintedFile: mostPrintedFile,
            printerMost: mostUsedPrinter,
            printerLoad: leastUsedPrinter,
            totalFilamentUsage: totalFilamentWeight.toFixed(2) + "g / " + totalFilamentLength.toFixed(2) + "m",
            averageFilamentUsage: (totalFilamentWeight / filamentWeight.length).toFixed(2) + "g / " + (totalFilamentLength / filamentLength.length).toFixed(2) + "m",
            highestFilamentUsage: (Math.max(...filamentWeight)).toFixed(2) + "g / " + (Math.max(...filamentLength)).toFixed(2)+ "m",
            lowestFilamentUsage:(Math.min(...filamentWeight)).toFixed(2) + "g / " + (Math.min(...filamentLength)).toFixed(2)+ "m",
            totalSpoolCost: (filamentCost.reduce((a, b) => a + b, 0)).toFixed(2),
            highestSpoolCost: (Math.max(...filamentCost)).toFixed(2),
            totalPrinterCost: (printCost.reduce((a, b) => a + b, 0)).toFixed(2),
            highestPrinterCost: (Math.max(...printCost)).toFixed(2),
        }
        return statistics
    }
    static async getJob(job, printTime) {
        if (typeof job !== 'undefined') {
            let accuracy = (printTime - job.estimatedPrintTime) / printTime * 100;
            let newJob = {
                estimatedPrintTime: job.estimatedPrintTime,
                actualPrintTime: printTime,
                printTimeAccuracy: accuracy,
            }
            return newJob
        } else {
            return null;
        }
    }
    static async getSpool(filamentSelection, metrics, success, time){
        let serverSettings = await ServerSettings.find({});
        let printPercentage = 0;
        //Fix for old records
        if(typeof metrics !== 'undefined' && typeof metrics.filament !== 'undefined'){
            if(!success){
                printPercentage = (metrics.estimatedPrintTime / time) * 100;
            }
            metrics = metrics.filament
        }else{
            metrics = null
        }        //Get spoolname function
        function spoolName(id){
            if(typeof id !== 'undefined' && id !== null ){
                if(serverSettings[0].filamentManager){
                    return `${id.spools.name} (${(id.spools.weight - id.spools.used).toFixed(0)}g) - ${id.spools.profile.material}`;
                }else{
                    return `${id.spools.name} - ${id.spools.profile.material}`;
                }
            }else{
                return null;
            }
        }
        //Get spoolid function
        function spoolID(id){
            if(typeof id !== 'undefined' && id !== null ){
                return id._id
            }else{
                return null;
            }
        }
        function getWeight(length, spool){
                if(typeof spool !== 'undefined' && spool !== null ){
                    if(typeof length !== 'undefined'){
                        length = length;
                        if (length === 0) {
                            return length;
                        } else {
                            let radius = parseFloat(spool.spools.profile.diameter) / 2
                            let volume = (length * Math.PI * radius * radius)
                            let usage = "";
                            if(success){
                                usage = volume * parseFloat(spool.spools.profile.density)
                            }else {
                                usage = volume * parseFloat(spool.spools.profile.density) / printPercentage;
                            }
                            return usage;
                        }
                    }else{
                        return 0;
                    }
                }else{
                    if(typeof length !== 'undefined'){
                        length = length;
                        if (length === 0) {
                            return length;
                        } else {
                            let radius = 1.75 / 2
                            let volume = (length * Math.PI * radius * radius)
                            let usage = "";
                            if(success){
                                usage = volume * 1.24
                            }else {
                                usage = volume * 1.24 / printPercentage;
                            }
                        }
                    }else{
                        return 0;
                    }
                }

        }
        function getType(spool){
            if(typeof spool !== 'undefined' && spool !== null){
                return spool.spools.profile.material;
            }else{
                return "";
            }
        }
        function getCost(grams, spool){
                if(typeof spool !== 'undefined' && spool !== null ){
                    if(success){
                        return ((spool.spools.price / spool.spools.weight) * grams).toFixed(2)
                    }else{
                        return (((spool.spools.price / spool.spools.weight) * grams) / printPercentage).toFixed(2);
                    }

                }else{
                    return null;
                }
        }

        let spools = [];
        if(typeof metrics !== 'undefined' && metrics !== null){
            let keys = Object.keys(metrics)
            for(let m = 0; m < keys.length; m++){
                let spool = {};
                if(success){
                    spool = {
                        [keys[m]]: {
                            toolName: "Tool " + keys[m].substring(4, 5),
                            spoolName: null,
                            spoolId: null,
                            volume: metrics[keys[m]].volume,
                            length: metrics[keys[m]].length / 1000,
                            weight: null,
                            cost: null
                        }
                    }
                }else{
                    spool = {
                        [keys[m]]: {
                            toolName: "Tool " + keys[m].substring(4, 5),
                            spoolName: null,
                            spoolId: null,
                            volume: metrics[keys[m]].volume / printPercentage,
                            length: (metrics[keys[m]].length / 1000) / printPercentage,
                            weight: null,
                            cost: null
                        }
                    }
                }

                if(Array.isArray(filamentSelection)){
                    spool[keys[m]].spoolName = spoolName(filamentSelection[m]);
                    spool[keys[m]].spoolId = spoolID(filamentSelection[m]);
                    spool[keys[m]].weight = getWeight(metrics[keys[m]].length / 1000, filamentSelection[m])
                    spool[keys[m]].cost = getCost(spool[keys[m]].weight, filamentSelection[m])
                    spool[keys[m]].type = getType(filamentSelection[m])
                }else{
                    spool[keys[m]].spoolName = spoolName(filamentSelection);
                    spool[keys[m]].spoolId = spoolID(filamentSelection);
                    spool[keys[m]].weight = getWeight(metrics[keys[m]].length / 1000, filamentSelection)
                    spool[keys[m]].cost = getCost(spool[keys[m]].weight, filamentSelection)
                    spool[keys[m]].type = getType(filamentSelection)
                }
                spools.push(spool)
            }
            return spools;
        }else{
            return null
        }
    }

    static getPrintCost(printTime, costSettings){
        if(typeof costSettings === "undefined"){
            //Attempt to update cost settings in history...
            return "No cost settings to calculate from"
        }else{
            // calculating electricity cost
            let powerConsumption = parseFloat(costSettings.powerConsumption);
            let costOfElectricity = parseFloat(costSettings.electricityCosts);
            let costPerHour = powerConsumption * costOfElectricity;
            let estimatedPrintTime = printTime / 3600;  // h
            let electricityCost = costPerHour * estimatedPrintTime;
            // calculating printer cost
            let purchasePrice = parseFloat(costSettings.purchasePrice);
            let lifespan = parseFloat(costSettings.estimateLifespan);
            let depreciationPerHour = lifespan > 0 ? purchasePrice / lifespan : 0;
            let maintenancePerHour = parseFloat(costSettings.maintenanceCosts);
            let printerCost = (depreciationPerHour + maintenancePerHour) * estimatedPrintTime;
            // assembling string
            let estimatedCost = electricityCost + printerCost;
            return estimatedCost.toFixed(2);
        }
    }
    static getFile(history){
        let file = {
            name: history.fileName,
            uploadDate: null,
            path: null,
            size: null,
            averagePrintTime: null,
            lastPrintTime: null,
        }
        if(typeof history.job !== 'undefined' && typeof history.job.file){
            file.uploadDate = history.job.file.date;
            file.path = history.job.file.path;
            file.size = history.job.file.size;
            file.averagePrintTime = history.job.averagePrintTime;
            file.lastPrintTime = history.job.lastPrintTime;
        }else{
            file.path = history.filePath
        }
        return file;
    }
    static getState(state, reason){
        if(state){
            return '<p class="d-none">Success</p><i class="fas fa-thumbs-up text-success fa-3x"></i>';
        }else{
            if (reason === "cancelled") {
                return '<p class="d-none">Cancelled</p><i class="fas fa-thumbs-down text-warning fa-3x"></i>';
            } else {
                return '<p class="d-none">Failure</p><i class="fas fa-exclamation text-danger fa-3x"></i>';
            }
        }
    }
}
HistoryClean.start();
module.exports = {
    HistoryClean: HistoryClean
};
