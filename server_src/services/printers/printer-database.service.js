const printerModel = require("../../models/Printer");

class PrinterDatabaseService{
    #id
    #options = {
        returnOriginal: false
    }
    constructor(id){
        this.#id = id;
    }

    update = (update) => {
        return printerModel.findOneAndUpdate({_id: this.#id}, update, this.#options)
    }
}

module.exports = PrinterDatabaseService;
