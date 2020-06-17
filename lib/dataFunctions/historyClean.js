const ServerSettings = require("../../models/ServerSettings.js");
const History = require("../../models/History.js");

let historyClean = [];


const interval = setInterval(function() {
    HistoryClean.start();
}, 10000);

class HistoryClean{
    static get(){
        return historyClean;
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
                printerCost: HistoryClean.getCost(history[h].printHistory.printTime, history[h].printHistory.costSettings),
                spools: await HistoryClean.getSpool(history[h].printHistory.filamentSelection, history[h].printHistory.job),
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
            sorted.totalCost = parseFloat(sorted.printerCost) + parseFloat(spoolCost);
            sorted.totalVolume = parseFloat(totalVolume);
            sorted.totalLength = parseFloat(totalLength);
            sorted.totalWeight = parseFloat(totalWeight);
            sorted.spoolCost = parseFloat(spoolCost)
            historyArray.push(sorted);
        }
        historyClean = historyArray;
    }
    static async getJob(job, printTime) {
        if (typeof job !== 'undefined') {
            let accuracy = printTime - job.estimatedPrintTime;
            accuracy = ((job.estimatedPrintTime / accuracy) * 100).toFixed(2)+"%"
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
    static async getSpool(filamentSelection, metrics){
        let serverSettings = await ServerSettings.find({});
        //Fix for old records
        if(typeof metrics !== 'undefined' && typeof metrics.filament !== 'undefined'){
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
                    length = length / 1000;
                    if (length === 0) {
                        return length;
                    } else {
                        let radius = parseFloat(spool.spools.profile.diameter) / 2
                        let volume = (length * Math.PI * radius * radius)
                        let usage = volume * parseFloat(spool.spools.profile.density)
                        return usage;
                    }
                }else{
                  return 0;
                }
            }else{
                if(typeof length !== 'undefined'){
                    length = length / 1000;
                    if (length === 0) {
                        return length;
                    } else {
                        let radius = 1.75 / 2
                        let volume = (length * Math.PI * radius * radius)
                        let usage = volume * 1.24
                        return usage;
                    }
                }else{
                    return 0;
                }
            }
        }
        function getCost(grams, spool){
            if(typeof spool !== 'undefined' && spool !== null ){
                return ((spool.spools.price / spool.spools.weight) * grams).toFixed(2)
            }else{
                return null;
            }
        }

        let spools = [];
        if(typeof metrics !== 'undefined' && metrics !== null){
            let keys = Object.keys(metrics)
            for(let m = 0; m < keys.length; m++){
                let spool = {
                    [keys[m]]: {
                        toolName: "Tool " + keys[m].substring(4, 5),
                        spoolName: null,
                        spoolId: null,
                        volume: metrics[keys[m]].volume,
                        length: metrics[keys[m]].length,
                        weight: null,
                        cost: null
                    }
                }
                if(Array.isArray(filamentSelection)){
                    spool[keys[m]].spoolName = spoolName(filamentSelection[m]);
                    spool[keys[m]].spoolId = spoolID(filamentSelection[m]);
                    spool[keys[m]].weight = getWeight(metrics[keys[m]].length, filamentSelection[m])
                    spool[keys[m]].cost = getCost(spool[keys[m]].weight, filamentSelection[m])
                }else{
                    spool[keys[m]].spoolName = spoolName(filamentSelection);
                    spool[keys[m]].spoolId = spoolID(filamentSelection);
                    spool[keys[m]].weight = getWeight(metrics[keys[m]].length, filamentSelection)
                    spool[keys[m]].cost = getCost(spool[keys[m]].weight, filamentSelection)
                }
                spools.push(spool)
            }
            return spools;
        }else{
            return null
        }
    }

    static getCost(printTime, costSettings){
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
            return '<b>Status</b><hr><i class="fas fa-thumbs-up text-success fa-3x"></i>';
        }else{
            if (reason === "cancelled") {
                return '<b>Status</b><hr><i class="fas fa-thumbs-down text-warning fa-3x"></i>';
            } else {
                return '<b>Status</b><hr><i class="fas fa-exclamation text-danger fa-3x"></i>';
            }
        }
    }
}
module.exports = {
    HistoryClean: HistoryClean
};
HistoryClean.start();