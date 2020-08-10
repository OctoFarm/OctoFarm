const _ = require('lodash');
const Logger = require('../logger.js');

const logger = new Logger('OctoFarm-InformationCleaning');

const cleanFileList = [];
const fileStatistics = {
    storageUsed: 0,
    storageTotal: 0,
    storageRemain: 0,
    storagePercent: 0,
    fileCount: 0,
    folderCount: 0,
    biggestFile: 0,
    smallestFile: 0,
    biggestLength: 0,
    smallestLength: 0,
    averageFile: 0,
    averageLength: 0
};

class FileClean {
    static returnFiles (p) {
        return cleanFileList[p];
    }

    static returnStatistics () {
        return fileStatistics;
    }

    static async statistics (farmPrinters) {
        const storageFree = [];
        const storageTotal = [];
        const devices = [];
        const fileSizes = [];
        const fileLengths = [];
        const fileCount = [];
        const folderCount = [];

        // Collect unique devices - Total for farm storage should not duplicate storage on instances running on same devices.
        farmPrinters.forEach((printer, index) => {
            if (typeof printer.storage !== 'undefined') {
                const device = {
                    ip: printer.printerURL,
                    index: printer.index,
                    storage: printer.storage
                };
                devices.push(device);
            }
            if (typeof printer.fileList !== 'undefined') {
                printer.fileList.files.forEach((file) => {
                    if (!isNaN(file.size)) {
                        fileSizes.push(file.size);
                    }
                    if (!isNaN(file.length)) {
                        fileLengths.push(file.length / 1000);
                    }

                    fileCount.push(file);
                });
                printer.fileList.folders.forEach((file) => {
                    folderCount.push(file);
                });
            }
        });

        const uniqueDevices = _.uniqBy(devices, 'printerURL');

        uniqueDevices.forEach((device) => {
            storageFree.push(device.storage.free);
            storageTotal.push(device.storage.total);
        });

        const storageFreeTotal = storageFree.reduce((a, b) => a + b, 0);
        const storageTotalTotal = storageTotal.reduce((a, b) => a + b, 0);
        fileStatistics.storageUsed = storageTotalTotal - storageFreeTotal;
        fileStatistics.storageTotal = storageTotalTotal;
        fileStatistics.storageRemain = storageFreeTotal;
        fileStatistics.storagePercent = Math.floor(
            (fileStatistics.storageUsed / storageTotalTotal) * 100
        );
        fileStatistics.fileCount = fileCount.length;
        fileStatistics.folderCount = folderCount.length;
        if (fileSizes.length !== 0) {
            fileStatistics.biggestFile = fileSizes.reduce(function (a, b) {
                return Math.max(a, b);
            });
            fileStatistics.smallestFile = fileSizes.reduce(function (a, b) {
                return Math.max(a, b);
            });
            fileStatistics.averageFile =
          fileSizes.reduce((a, b) => a + b, 0) / fileCount.length;
        }
        if (fileLengths.length !== 0) {
            fileStatistics.biggestLength = fileLengths.reduce(function (a, b) {
                return Math.max(a, b);
            });

            fileStatistics.smallestLength = fileLengths.reduce(function (a, b) {
                return Math.max(a, b);
            });
            fileStatistics.averageLength =
          fileLengths.reduce((a, b) => a + b, 0) / fileCount.length;
        }
    }

    static async generate (farmPrinter, selectedFilament) {
        logger.info('Running File Cleaning');
        try {
            const { fileList } = farmPrinter;
            if (typeof farmPrinter.systemChecks !== 'undefined') {
                farmPrinter.systemChecks.cleaning.file.status = 'warning';
            }
            const printCost = farmPrinter.costSettings;
            const sortedFileList = [];
            if (typeof fileList !== 'undefined') {
                try {
                    for (let f = 0; f < fileList.files.length; f++) {
                        const file = fileList.files[f];
                        const sortedFile = {
                            path: file.path,
                            fullPath: file.fullPath,
                            display: file.display,
                            name: file.name,
                            uploadDate: file.date,
                            fileSize: file.size,
                            thumbnail: file.thumbnail,
                            toolUnits: '',
                            toolCosts: '',
                            success: file.success,
                            failed: file.failed,
                            last: file.last,
                            expectedPrintTime: file.time,
                            printCost: await FileClean.getPrintCost(file.time, printCost)
                        };
                        sortedFile.toolUnits = await FileClean.getUnits(
                            selectedFilament,
                            file.length
                        );
                        sortedFile.toolCosts = await FileClean.getCost(
                            selectedFilament,
                            sortedFile.toolUnits
                        );
                        sortedFileList.push(sortedFile);
                        // console.log(sortedFileList);
                    }
                } catch (e) {
                    console.log(e);
                }
            }
            const newFileList = {
                fileList: sortedFileList,
                filecount: 0,
                folderList: [],
                folderCount: 0
            };
            newFileList.filecount = fileList.fileCount;
            newFileList.folderList = fileList.folders;
            newFileList.folderCount = fileList.folderCount;
            cleanFileList[farmPrinter.sortIndex] = newFileList;
            if (typeof farmPrinter.systemChecks !== 'undefined') {
                farmPrinter.systemChecks.cleaning.file.status = 'success';
                farmPrinter.systemChecks.cleaning.file.date = new Date();
            }
            logger.info('File Information cleaned and ready for consumption...');
            return true;
        } catch (e) {
            console.log('MASSIVE FILE ERROR!!!!', e);
        }
    }

    static async getUnits (filamentSelection, lengths) {
        const strings = [];
        const lengthArray = [];
        const weightArray = [];
        if (lengths !== null) {
            for (let l = 0; l < lengths.length; l++) {
                const length = lengths[l] / 1000;
                if (
                    typeof filamentSelection !== 'undefined' &&
          Array.isArray(filamentSelection)
                ) {
                    if (filamentSelection[l] === null) {
                        const radius = 1.75 / 2;
                        const volume = length * Math.PI * radius * radius;
                        const usage = volume * 1.24;
                        lengthArray.push(length);
                        weightArray.push(usage);
                        strings.push(
                            `<b>Tool ${l}:</b> ${length.toFixed(2)}m / ${usage.toFixed(2)}g`
                        );
                    } else if (typeof filamentSelection[l] !== 'undefined') {
                        const radius =
              parseFloat(filamentSelection[l].spools.profile.diameter) / 2;
                        const volume = length * Math.PI * radius * radius;
                        const usage =
              volume * parseFloat(filamentSelection[l].spools.profile.density);
                        lengthArray.push(length);
                        weightArray.push(usage);
                        strings.push(
                            `<b>Tool ${l}:</b> ${length.toFixed(2)}m / ${usage.toFixed(2)}g`
                        );
                    } else {
                        lengthArray.push(0);
                        weightArray.push(0);
                        strings.push(`<b>Tool ${l}:</b> (No Spool)`);
                    }
                } else {
                    lengthArray.push(0);
                    weightArray.push(0);
                    strings.push(`<b>Tool ${l}:</b> (No Spool)`);
                }
            }

            const totalLength = lengthArray.reduce((a, b) => a + b, 0);
            const totalGrams = weightArray.reduce((a, b) => a + b, 0);
            const total = `<b>Total: </b>${totalLength.toFixed(
                2
            )}m / ${totalGrams.toFixed(2)}g`;
            strings.unshift(total);
            return strings;
        }
        return [];
    }

    static async getPrintCost (printTime, costSettings) {
        if (typeof costSettings === 'undefined') {
            // Attempt to update cost settings in history...
            return 'No cost settings to calculate from';
        }
        // calculating electricity cost
        const powerConsumption = parseFloat(costSettings.powerConsumption);
        const costOfElectricity = parseFloat(costSettings.electricityCosts);
        const costPerHour = powerConsumption * costOfElectricity;
        const estimatedPrintTime = printTime / 3600; // h
        const electricityCost = costPerHour * estimatedPrintTime;
        // calculating printer cost
        const purchasePrice = parseFloat(costSettings.purchasePrice);
        const lifespan = parseFloat(costSettings.estimateLifespan);
        const depreciationPerHour = lifespan > 0 ? purchasePrice / lifespan : 0;
        const maintenancePerHour = parseFloat(costSettings.maintenanceCosts);
        const printerCost =
      (depreciationPerHour + maintenancePerHour) * estimatedPrintTime;
        // assembling string
        const estimatedCost = electricityCost + printerCost;
        return estimatedCost.toFixed(2);
    }

    static async getCost (filamentSelection, units) {
        units = JSON.parse(JSON.stringify(units));
        filamentSelection = JSON.parse(JSON.stringify(filamentSelection));
        filamentSelection.unshift('SKIP');
        const strings = [];
        const costArray = [];
        if (units.length === 0) {
            return [];
        }
        for (let u = 0; u < units.length; u++) {
            if (
                typeof filamentSelection !== 'undefined' &&
        Array.isArray(filamentSelection)
            ) {
                if (filamentSelection[u] === 'SKIP') {
                } else if (typeof filamentSelection[u] !== 'undefined' && filamentSelection[u] !== null) {
                    let newUnit = units[u].split(' / ');
                    newUnit = newUnit[1].replace('g', '');
                    if (!units[u].includes('Total')) {
                        const cost = (
                            (filamentSelection[u].spools.price /
                filamentSelection[u].spools.weight) *
              parseFloat(newUnit)
                        ).toFixed(2);
                        costArray.push(parseFloat(cost));
                        const string = cost;
                        strings.push(string);
                    }
                } else {
                    costArray.push(0);
                    strings.push('(No Spool)');
                }
            } else {
                costArray.push(0);
                strings.push('(No Spool)');
            }
        }
        const totalCost = costArray.reduce((a, b) => a + b, 0);
        strings.unshift(totalCost.toFixed(2));
        return strings;

        // console.log(filamentSelection, lengths, time)

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
    FileClean
};
