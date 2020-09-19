import OctoFarmClient from "../octofarm.js";

export default class PrinterSelect{
    static async create(element){
        const printersInfo = await OctoFarmClient.post("printers/printerInfo");
        const printers = await printersInfo.json();

        //Create printers table

        //Load printers into table

        //Add filter buttons at top, Group/State

        element.innerHTML = "";

    }
    static addListeners(){

    }

}