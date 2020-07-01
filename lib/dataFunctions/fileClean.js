const cleanFileList = [];

class FileClean {
  static returnFiles(p) {
    return cleanFileList[p];
  }

  static async generate(farmPrinter, selectedFilament) {
    const { fileList } = farmPrinter;
    const printCost = farmPrinter.costSettings;
    for (let p = 0; p < fileList.files.length; p++) {
      const sortedFileList = [];
      if (typeof fileList !== "undefined") {
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
              toolUnits: "",
              toolCosts: "",
              expectedPrintTime: file.time,
              printCost: await FileClean.getPrintCost(file.time, printCost),
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
          }
        } catch (e) {
          console.log(e);
        }
      }
      const newFileList = {
        fileList: sortedFileList,
        filecount: 0,
        folderList: [],
        folderCount: 0,
      };
      newFileList.filecount = fileList.fileCount;
      newFileList.folderList = fileList.folders;
      newFileList.folderCount = fileList.folderCount;
      if (typeof farmPrinter.systemChecks !== "undefined") {
        farmPrinter.systemChecks.files = true;
      }
      cleanFileList[farmPrinter.sortIndex] = newFileList;
    }
    return true;
  }

  static async getUnits(filamentSelection, lengths) {
    const strings = [];
    const lengthArray = [];
    const weightArray = [];
    if (lengths !== null) {
      for (let l = 0; l < lengths.length; l++) {
        const length = lengths[l] / 1000;
        if (
          typeof filamentSelection !== "undefined" &&
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
          } else if (typeof filamentSelection[l] !== "undefined") {
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

  static async getPrintCost(printTime, costSettings) {
    if (typeof costSettings === "undefined") {
      // Attempt to update cost settings in history...
      return "No cost settings to calculate from";
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

  static async getCost(filamentSelection, units) {
    units = JSON.parse(JSON.stringify(units));
    filamentSelection = JSON.parse(JSON.stringify(filamentSelection));
    filamentSelection.unshift(null);
    const strings = [];
    const costArray = [];
    if (units.length === 0) {
      return [];
    }
    for (let u = 0; u < units.length; u++) {
      if (
        typeof filamentSelection !== "undefined" &&
        Array.isArray(filamentSelection)
      ) {
        if (filamentSelection[u] === null) {
        } else if (typeof filamentSelection[u] !== "undefined") {
          let newUnit = units[u].split(" / ");
          newUnit = newUnit[1].replace("g", "");
          if (!units[u].includes("Total")) {
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
          strings.push(`(No Spool)`);
        }
      } else {
        costArray.push(0);
        strings.push(`(No Spool)`);
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
  FileClean,
};
