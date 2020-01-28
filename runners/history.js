const History = require("../models/History.js");
const _ = require("lodash");
const fetch = require("node-fetch");

class HistoryCollection {
    static async watcher(printer){
        let newPrintHistory = await HistoryCollection.history();
        let historyCollection = await History.find({});
        let today = new Date();
        
 
        newPrintHistory.notes = "";
        //Check last print date. 
        HistoryCollection.get(printer.ip, printer.port, printer.apikey, "files/local/"+printer.job.file.path).then(res => {
            return res.json();
        }).then(res => {
            if(historyCollection.length < 1){
                newPrintHistory.old = false;
                newPrintHistory.id = res.prints.last.date+printer.job.file.name;
                newPrintHistory.printerIndex = printer.index;
                newPrintHistory.printerName = printer.settingsApperance.name;
                newPrintHistory.success = true;
                newPrintHistory.fileName = printer.job.file.display;
                newPrintHistory.filePath = printer.job.file.path;
                newPrintHistory.startDate = res.prints.last.date
                newPrintHistory.endDate = today
                newPrintHistory.printTime = printer.progress.printTime;
                newPrintHistory.spoolUsed = ""; // Awaiting link for spools
                newPrintHistory.filamentLength = printer.job.filament.tool0.length;
                newPrintHistory.filamentVolume = printer.job.filament.tool0.volume;
                let printHistory = newPrintHistory;
                let newHistory = new History({
                    printHistory
                 })
                 newHistory.save();
            }
            //Save if this print is different to last print date. 
            //setup newHistory
            newPrintHistory.old = false;
            newPrintHistory.id = res.prints.last.date+printer.job.file.name;
            newPrintHistory.printerIndex = printer.index;
            newPrintHistory.printerName = printer.settingsApperance.name;
            newPrintHistory.success = true;
            newPrintHistory.fileName = printer.job.file.display;
            newPrintHistory.filePath = printer.job.file.path;
            newPrintHistory.startDate = res.prints.last.date
            newPrintHistory.endDate = today
            newPrintHistory.printTime = printer.progress.printTime;
            newPrintHistory.spoolUsed = ""; // Awaiting link for spools
            newPrintHistory.filamentLength = printer.job.filament.tool0.length;
            newPrintHistory.filamentVolume = printer.job.filament.tool0.volume;
            //Search and see if print exists in db...
            History.findOne({ 'printHistory.id': res.prints.last.date+printer.job.file.name }).then(res => {
                if(res === null){
                    let printHistory = newPrintHistory;
                    let newHistory = new History({
                        printHistory
                     })
                     newHistory.save();
                }
            }).catch(err => console.log(res))
            

        }).catch(err => console.log("ERROR"+err))





        
    }
    static history(){
    let printHistory = {
            old: false,
            id: 0,
            printerIndex: 0,
            printerName: "",
            success: true,
            fileName: "",
            filePath: "",
            startDate: "",
            endDate: "",
            printTime: "",
            spoolUsed: "",
            filamentUsage: "",
            notes: ""
        }
    return printHistory
    }

    static get(ip, port, apikey, item) {
        let url = `http://${ip}:${port}/api/${item}`;
        return fetch(url, {
            method: "GET",
            headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apikey
            }
        });
        }

}

module.exports = {
    HistoryCollection: HistoryCollection
};
