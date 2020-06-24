const Profiles = require("../../models/Profiles.js");
const runner = require("../../runners/state.js");
const Runner = runner.Runner;
const historyClean = require("../../lib/dataFunctions/historyClean.js");
const HistoryClean = historyClean.HistoryClean;

let cleanFileList = [];

let interval = false;

if(interval === false){
    interval = setInterval(async function() {
        FileClean.start();
    }, 30000);
}

class FileClean{
    static returnFiles(p){
        return cleanFileList[p];
    }
    static async start(){
        let farmPrinters = Runner.returnFarmPrinters();
        for(let p = 0; p < farmPrinters.length; p++){
            let fileList = farmPrinters[p].fileList
            let printCost = farmPrinters[p].costSettings
            let selectedFilament = farmPrinters[p].selectedFilament
            let job = farmPrinters[p].job
            let sortedFileList = [];
            if(typeof fileList !== 'undefined'){
                try{
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
                }catch(e){
                    console.log(e)
                }

            }
            cleanFileList[p] = sortedFileList;
        }

    }
}
module.exports = {
    FileClean: FileClean
};
FileClean.start();