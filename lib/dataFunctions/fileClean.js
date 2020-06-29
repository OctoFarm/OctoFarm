const Profiles = require("../../models/Profiles.js");
const runner = require("../../runners/state.js");
const Runner = runner.Runner;
const settingsClean = require("../../lib/dataFunctions/settingsClean.js");
const SettingsClean = settingsClean.SettingsClean;

let cleanFileList = [];

let serverSettings = null;

class FileClean{
    static returnFiles(p){
        return cleanFileList[p];
    }
    static async start(){
        serverSettings = await SettingsClean.returnSystemSettings();
        let farmPrinters = Runner.returnFarmPrinters();
        for(let p = 0; p < farmPrinters.length; p++){
            let fileList = farmPrinters[p].fileList
            let printCost = farmPrinters[p].costSettings
            let selectedFilament = farmPrinters[p].selectedFilament
            let sortedFileList = [];
            if(typeof fileList !== 'undefined'){
                try{

                    for(let f = 0; f < fileList.files.length; f++){
                        let file = fileList.files[f];
                        let sortedFile = {
                            path: file.path,
                            fullPath: file.fullPath,
                            display: file.display,
                            name: file.name,
                            uploadDate: file.date,
                            fileSize: file.size,
                            thumbnail: file.thumbnail,
                            toolUnits: "",
                            toolCosts: "",
                            expectedPrintTime: file.time,
                            printCost: await FileClean.getPrintCost(file.time, printCost),
                        }
                        let selectedArray = [];
                        if(selectedFilament !== null){
                            for(let s = 0; s < selectedFilament.length; s++){
                                if(selectedFilament[s] !== null){
                                    let filament = JSON.parse(JSON.stringify(selectedFilament[s]));
                                    let profile = null;
                                    if(serverSettings.filamentManager){
                                        profile = await Profiles.findOne({'profile.index': filament.spools.profile})
                                    }else{
                                        profile = await Profiles.findById(filament.spools.profile);
                                    }

                                    filament.spools.profile = profile.profile;
                                    selectedArray.push(filament)

                                }
                            }
                        }
                        sortedFile.toolUnits = await FileClean.getUnits(selectedArray, file.length);
                        sortedFile.toolCosts = await FileClean.getCost(selectedArray, sortedFile.toolUnits);
                        sortedFileList.push(sortedFile)
                    }
                }catch(e){
                    console.log(e)
                }

            }
            let newFileList = {
                fileList: sortedFileList,
                filecount: 0,
                folderList: [],
                folderCount: 0,
            }

            if(typeof farmPrinters[p].fileList !== 'undefined'){
                newFileList.filecount = farmPrinters[p].fileList.fileCount;
                newFileList.folderList = farmPrinters[p].fileList.folders;
                newFileList.folderCount = farmPrinters[p].fileList.folderCount;
                    if(typeof farmPrinters[p].systemChecks !== 'undefined'){
                        farmPrinters[p].systemChecks.files = true;
                    }
            }
            cleanFileList[p] = newFileList;


        }
        return true;
    }
    static async getUnits(filamentSelection, lengths){
        let strings = [];
        let lengthArray = [];
        let weightArray = [];
        if(lengths !== null){
            for(let l = 0; l < lengths.length; l++){
                let length = lengths[l] / 1000;
                if(typeof filamentSelection !== 'undefined' && Array.isArray(filamentSelection)){
                    if(filamentSelection[l] === null){
                        let radius = 1.75 / 2
                        let volume = (length * Math.PI * radius * radius)
                        let usage = volume * 1.24
                        lengthArray.push(length);
                        weightArray.push(usage);
                        strings.push(`<b>Tool ${l}:</b> ${length.toFixed(2)}m / ${usage.toFixed(2)}g`)
                    }else{
                        if(typeof filamentSelection[l] !== 'undefined'){
                            let radius = parseFloat(filamentSelection[l].spools.profile.diameter) / 2
                            let volume = (length * Math.PI * radius * radius)
                            let usage = volume * parseFloat(filamentSelection[l].spools.profile.density)
                            lengthArray.push(length);
                            weightArray.push(usage);
                            strings.push(`<b>Tool ${l}:</b> ${length.toFixed(2)}m / ${usage.toFixed(2)}g`)
                        }else{
                            lengthArray.push(0);
                            weightArray.push(0);
                            strings.push(`<b>Tool ${l}:</b> (No Spool)`)
                        }
                    }
                }else{
                    lengthArray.push(0);
                    weightArray.push(0);
                    strings.push(`<b>Tool ${l}:</b> (No Spool)`)
                }
            }

            let totalLength = lengthArray.reduce((a, b) => a + b, 0);
            let totalGrams = weightArray.reduce((a, b) => a + b, 0);
            let total = "<b>Total: </b>"+ totalLength.toFixed(2)+"m / "+totalGrams.toFixed(2)+"g"
            strings.unshift(total)
            return strings;
        }else{
            return []
        }
    }
    static async getPrintCost(printTime, costSettings){
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
    static async getCost(filamentSelection, units){
        units = JSON.parse(JSON.stringify(units))
        filamentSelection = JSON.parse(JSON.stringify(filamentSelection))
        filamentSelection.unshift(null)
        let strings = [];
        let costArray = [];
        if(units.length === 0){
            return [];
        }else{
            for(let u = 0; u < units.length; u++){
                if(typeof filamentSelection !== 'undefined' && Array.isArray(filamentSelection)){
                    if(filamentSelection[u] === null){
                    }else{
                        if(typeof filamentSelection[u] !== 'undefined'){
                            let newUnit = units[u].split(" / ")
                            newUnit = newUnit[1].replace("g","");
                            if(!units[u].includes("Total")) {
                                let cost = ((filamentSelection[u].spools.price / filamentSelection[u].spools.weight) * parseFloat(newUnit)).toFixed(2)
                                costArray.push(parseFloat(cost))
                                let string = cost;
                                strings.push(string);
                            }
                        }else{
                            costArray.push(0);
                            strings.push(`(No Spool)`)
                        }

                    }
                }else{
                    costArray.push(0);
                    strings.push(`(No Spool)`)
                }

            }
            let totalCost = costArray.reduce((a, b) => a + b, 0);
            strings.unshift(totalCost.toFixed(2))
            return strings;
        }

        //console.log(filamentSelection, lengths, time)

        // let printPercentage = 0;
        // //Fix for old records
        // if(typeof metrics !== 'undefined' && typeof metrics.filament !== 'undefined' && metrics.filament !== null){
        //     if(!success){
        //         printPercentage = (metrics.estimatedPrintTime / time) * 100;
        //     }
        //     metrics = metrics.filament
        // }else{
        //     metrics = null
        // }        //Get spoolname function
        // function spoolName(id){
        //     if(typeof id !== 'undefined' && id !== null ){
        //         if(serverSettings[0].filamentManager){
        //             return `${id.spools.name} (${(id.spools.weight - id.spools.used).toFixed(0)}g) - ${id.spools.profile.material}`;
        //         }else{
        //             return `${id.spools.name} - ${id.spools.profile.material}`;
        //         }
        //     }else{
        //         return null;
        //     }
        // }
        // //Get spoolid function
        // function spoolID(id){
        //     if(typeof id !== 'undefined' && id !== null ){
        //         return id._id
        //     }else{
        //         return null;
        //     }
        // }
        // function getWeight(length, spool){
        //     if(typeof spool !== 'undefined' && spool !== null ){
        //         if(typeof length !== 'undefined'){
        //             if (length === 0) {
        //                 return length;
        //             } else {
        //                 let radius = parseFloat(spool.spools.profile.diameter) / 2
        //                 let volume = (length * Math.PI * radius * radius)
        //                 let usage = "";
        //                 if(success){
        //                     usage = volume * parseFloat(spool.spools.profile.density)
        //                 }else {
        //                     usage = volume * parseFloat(spool.spools.profile.density) / printPercentage;
        //                 }
        //                 return usage;
        //
        //             }
        //         }else{
        //             return 0;
        //         }
        //     }else{
        //         if(typeof length !== 'undefined'){
        //             length = length;
        //             if (length === 0) {
        //                 return length;
        //             } else {
        //                 let radius = 1.75 / 2
        //                 let volume = (length * Math.PI * radius * radius)
        //                 let usage = "";
        //                 if(success){
        //                     usage = volume * 1.24
        //                 }else {
        //                     usage = volume * 1.24 / printPercentage;
        //                 }
        //                 return usage;
        //             }
        //         }else{
        //             return 0;
        //         }
        //     }
        //
        // }
        // function getType(spool){
        //     if(typeof spool !== 'undefined' && spool !== null){
        //         return spool.spools.profile.material;
        //     }else{
        //         return "";
        //     }
        // }
        // function getCost(grams, spool){
        //     if(typeof spool !== 'undefined' && spool !== null ){
        //         if(success){
        //             return ((spool.spools.price / spool.spools.weight) * grams).toFixed(2)
        //         }else{
        //             return (((spool.spools.price / spool.spools.weight) * grams) / printPercentage).toFixed(2);
        //         }
        //
        //     }else{
        //         return null;
        //     }
        // }
        //
        // let spools = [];
        // if(typeof metrics !== 'undefined' && metrics !== null){
        //     let keys = Object.keys(metrics)
        //     for(let m = 0; m < keys.length; m++){
        //         let spool = {};
        //         if(success){
        //             spool = {
        //                 [keys[m]]: {
        //                     toolName: "Tool " + keys[m].substring(4, 5),
        //                     spoolName: null,
        //                     spoolId: null,
        //                     volume: metrics[keys[m]].volume,
        //                     length: metrics[keys[m]].length / 1000,
        //                     weight: null,
        //                     cost: null
        //                 }
        //             }
        //         }else{
        //             spool = {
        //                 [keys[m]]: {
        //                     toolName: "Tool " + keys[m].substring(4, 5),
        //                     spoolName: null,
        //                     spoolId: null,
        //                     volume: metrics[keys[m]].volume / printPercentage,
        //                     length: (metrics[keys[m]].length / 1000) / printPercentage,
        //                     weight: null,
        //                     cost: null
        //                 }
        //             }
        //         }
        //
        //         if(Array.isArray(filamentSelection)){
        //             spool[keys[m]].spoolName = spoolName(filamentSelection[m]);
        //             spool[keys[m]].spoolId = spoolID(filamentSelection[m]);
        //             spool[keys[m]].weight = getWeight(metrics[keys[m]].length / 1000, filamentSelection[m])
        //             spool[keys[m]].cost = getCost(spool[keys[m]].weight, filamentSelection[m])
        //             spool[keys[m]].type = getType(filamentSelection[m])
        //         }else{
        //             spool[keys[m]].spoolName = spoolName(filamentSelection);
        //             spool[keys[m]].spoolId = spoolID(filamentSelection);
        //             spool[keys[m]].weight = getWeight(metrics[keys[m]].length / 1000, filamentSelection)
        //             spool[keys[m]].cost = getCost(spool[keys[m]].weight, filamentSelection)
        //             spool[keys[m]].type = getType(filamentSelection)
        //         }
        //         spools.push(spool)
        //     }
        //     return spools;
        // }else{
        //     return null
        // }
    }
}
module.exports = {
    FileClean: FileClean
};
FileClean.start();