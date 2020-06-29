const ServerSettings = require("../../models/ServerSettings.js");
const Spools = require("../../models/Filament.js");
const Profiles = require("../../models/Profiles.js");
const runner = require("../../runners/state.js");
const Runner = runner.Runner;
const printerClean = require("./printerClean.js");
const PrinterClean = printerClean.PrinterClean;
const _ = require("lodash");



let spoolsClean = [];
let profilesClean = [];
let statisticsClean = [];
let selectedFilament = [];
let printerList = [];
let interval = false;

if(interval === false){
    interval = setInterval(async function() {
        FilamentClean.start();
    }, 10000);
}

class FilamentClean{
    static getSpools(){
        return spoolsClean;
    }
    static getProfiles(){
        return profilesClean;
    }
    static getStatistics(){
        return statisticsClean;
    }
    static getSelected(){
        return selectedFilament;
    }
    static getPrinterList(){
        return printerList;
    }
    static async start() {
        let serverSettings = await ServerSettings.find({});
        let profiles = await Profiles.find({});
        let spools = await Spools.find({});
        let spoolsArray = [];
        let profilesArray = [];
        for(let pr = 0; pr < profiles.length; pr++){
            let profile = {
                _id: null,
                manufacturer: profiles[pr].profile.manufacturer,
                material: profiles[pr].profile.material,
                density: profiles[pr].profile.density,
                diameter: profiles[pr].profile.diameter,
            }
            if(serverSettings[0].filamentManager){
                profile._id = profiles[pr].profile.index
            }else{
                profile._id = profiles[pr]._id
            }
            profilesArray.push(profile)
        }
        for (let sp = 0; sp < spools.length; sp++) {
            let spool = {
                _id: spools[sp]._id,
                name: spools[sp].spools.name,
                profile: spools[sp].spools.profile,
                price: spools[sp].spools.price,
                weight: spools[sp].spools.weight,
                used: spools[sp].spools.used,
                remaining: spools[sp].spools.weight - spools[sp].spools.used,
                percent: (100 - spools[sp].spools.used / spools[sp].spools.weight * 100),
                tempOffset: spools[sp].spools.tempOffset,
                printerAssignment: await FilamentClean.getPrinterAssignment(spools[sp]._id),
                fmID: spools[sp].spools.fmID,
            }
            spoolsArray.push(spool);
        }
        spoolsClean = spoolsArray;
        profilesClean = profilesArray;
        let farmPrinters = Runner.returnFarmPrinters();
        // printerList = await FilamentClean.createPrinterList(farmPrinters);
        selectedFilament = await FilamentClean.selectedFilament(farmPrinters);
        let statistics = await FilamentClean.createStatistics(spoolsArray, profilesArray, selectedFilament);
        statisticsClean = statistics;

    }
    static async selectedFilament(printers){
        let selectedArray = [];
            for(let s = 0; s < printers.length; s++){
                if(Array.isArray(printers[s].selectedFilament)){
                    for(let f = 0; f < printers[s].selectedFilament.length; f++){
                        if(printers[s].selectedFilament[f] !== null){
                            selectedArray.push(printers[s].selectedFilament[f]._id);
                        }
                    }
                }
            }
        return selectedArray;
    }
    static async createStatistics(spools, profiles, selectedFilament){
        let materials = [];
        let materialBreak = [];
        for(let p = 0; p < profiles.length; p++){
            materials.push(profiles[p].material.replace(/ /g, "_"));
            let material = {
                name: profiles[p].material.replace(/ /g, "_"),
                weight: [],
                used: [],
                price: [],
            }
            materialBreak.push(material)
        }
        materialBreak = _.uniqWith(materialBreak, _.isEqual)

        let used = [];
        let total = [];
        let price = [];
        for(let s = 0; s < spools.length; s++){
            used.push(parseFloat(spools[s].used))
            total.push(parseFloat(spools[s].weight))
            price.push(parseFloat(spools[s].price))
            let profInd = _.findIndex(profiles, function(o) { return o._id == spools[s].profile; });
            let index = _.findIndex(materialBreak, function(o) { return o.name == profiles[profInd].material.replace(/ /g, "_"); });

            materialBreak[index].weight.push(parseFloat(spools[s].weight));
            materialBreak[index].used.push(parseFloat(spools[s].used));
            materialBreak[index].price.push(parseFloat(spools[s].price));
        }

        let materialBreakDown = []
        for(let m=0;m<materialBreak.length;m++){
            let mat = {
                name: materialBreak[m].name,
                used: materialBreak[m].used.reduce((a, b) => a + b, 0),
                total: materialBreak[m].weight.reduce((a, b) => a + b, 0),
                price: materialBreak[m].price.reduce((a, b) => a + b, 0),
            }
            materialBreakDown.push(mat)
        }
        return {
            materialList: materials.filter(function (item, i, ar) {
                return ar.indexOf(item) === i;
            }),
            used: used.reduce((a, b) => a + b, 0),
            total: total.reduce((a, b) => a + b, 0),
            price: price.reduce((a,b) => a + b, 0),
            profileCount: profiles.length,
            spoolCount: spools.length,
            activeSpools: selectedFilament,
            activeSpoolCount: selectedFilament.length,
            materialBreakDown: materialBreakDown,

        };


    }
    static async getPrinterAssignment(spoolID){
        let farmPrinters = Runner.returnFarmPrinters();
        let assignments = [];
            for(let p = 0; p < farmPrinters.length; p++) {
                if (Array.isArray(farmPrinters[p].selectedFilament)) {
                    for (let s = 0; s < farmPrinters[p].selectedFilament.length; s++) {
                        if(farmPrinters[p].selectedFilament[s] !== null){
                            if (farmPrinters[p].selectedFilament[s]._id.toString() === spoolID.toString()) {

                                let printer = {
                                    id: farmPrinters[p]._id,
                                    tool: s
                                }
                                assignments.push(printer)
                            }
                        }

                    }
                }
            }
            return assignments
    }

    // static async createPrinterList(farmPrinters){
    //     let printerList = [];
    //     farmPrinters.forEach(printer => {
    //         if(typeof printer.current !== 'undefined' ){
    //             const selectedProfile = printer.current.printerProfile;
    //             if(typeof printer.profiles !== 'undefined' && typeof printer.profiles[selectedProfile] !== 'undefined')
    //                 console.log(printer.profile[selectedProfile])
    //             for (let i = 0; i < printer.profile[selectedProfile]["extruder"].count; i++) {
    //                 console.log(i)
    //             }
    //         }
    //     })
    // }
}
module.exports = {
    FilamentClean: FilamentClean
};
FilamentClean.start();