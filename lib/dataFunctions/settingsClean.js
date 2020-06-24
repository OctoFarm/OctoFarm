const ClientSettings = require("../../models/ClientSettings.js");
const ServerSettings = require("../../models/ServerSettings.js");

let systemClean = [];
let clientClean = [];
let interval = false;

if(interval === false){
    interval = setInterval(async function() {
        SettingsClean.start();
    }, 30000);
}

class SettingsClean{
    static async returnSystemSettings(){
        return systemClean;
    }
    static async returnClientSettings(){
        return clientClean;
    }
    static async start(){
        let clientSettings = await ClientSettings.find({});
        let serverSettings = await ServerSettings.find({});
        systemClean = serverSettings[0];
        clientClean = clientSettings[0];
    }

}
SettingsClean.start();
module.exports = {
    SettingsClean: SettingsClean
};