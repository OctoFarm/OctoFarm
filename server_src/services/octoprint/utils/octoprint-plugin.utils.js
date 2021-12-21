/**
 * One time function run on first scan to get plugin data.
 * @params currentSettings
 * @params plugins
 * @returns {string}
 */
const testAndCollectCostPlugin = (currentSettings, plugins) => {
    if((currentSettings === null)){
        if(plugins["costestimation"]){
            return {
                powerConsumption: plugins["costestimation"].powerConsumption,
                electricityCosts: plugins["costestimation"].costOfElectricity,
                purchasePrice: plugins["costestimation"].priceOfPrinter,
                estimateLifespan: plugins["costestimation"].lifespanOfPrinter,
                maintenanceCosts: plugins["costestimation"].maintenanceCosts
            }
        }else{
            return {
                powerConsumption: 0.5,
                electricityCosts: 0.15,
                purchasePrice: 500,
                estimateLifespan: 43800,
                maintenanceCosts: 0.25
            }
        }
    }else{
       return currentSettings
    }
};
/**
 * One time function run on first scan to get plugin data.
 * @params currentSettings
 * @params plugins
 * @returns {string}
 */
const testAndCollectPSUControlPlugin = (currentSettings, plugins) => {
    if((currentSettings === null)){
        if(plugins["psucontrol"]){
            return {
                powerOnCommand: '{"command":"turnPSUOn"}',
                powerOnURL: "[PrinterURL]/api/plugin/psucontrol",
                powerOffCommand: '{"command":"turnPSUOff"}',
                powerOffURL: "[PrinterURL]/api/plugin/psucontrol",
                powerToggleCommand: '{"command":"togglePSU"}',
                powerToggleURL: "[PrinterURL]/api/plugin/psucontrol",
                powerStatusCommand: '{"command":"getPSUState"}',
                powerStatusURL: "[PrinterURL]/api/plugin/psucontrol",
                wol: {
                    enabled: false,
                    ip: "255.255.255.0",
                    packets: "3",
                    port: "9",
                    interval: "100",
                    MAC: ""
                }
            }
        }else{
            return {
                powerOnCommand: "",
                powerOnURL: "",
                powerOffCommand: "",
                powerOffURL: "",
                powerToggleCommand: "",
                powerToggleURL: "",
                powerStatusCommand: "",
                powerStatusURL: "",
                wol: {
                    enabled: false,
                    ip: "255.255.255.0",
                    packets: "3",
                    port: "9",
                    interval: "100",
                    MAC: ""
                }
            }
        }
    }else{
        return currentSettings
    }
}

module.exports = {
    testAndCollectPSUControlPlugin,
    testAndCollectCostPlugin
}
