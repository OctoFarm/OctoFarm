
let viewInformation = [];
let printersInformation = [];
let dashboardInformation = [];

class PrinterClean{
    static returnViewInformation(){

    }
    static returnPrintersInformation(){

    }
    static returnDashboardInformation(){

    }
    static grabPrinterName(printer){
        let name = null;
        if (typeof printer.settingsApperance != "undefined") {
            if (printer.settingsApperance.name === "" || printer.settingsApperance.name === null) {
                name = printer.printerURL;
            } else {
                name = printer.settingsApperance.name;
            }
        } else {
            name = printer.printerURL;
        }
        return name;
    }
}
module.exports = {
    PrinterClean: PrinterClean
};
