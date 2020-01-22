const ClientSettingsDB = require("../models/ClientSettings.js");

class ClientSettings {
  static init(){
      console.log("Initialising Client Settings")
      ClientSettingsDB.find({}).then(settings => {
        if(settings.length < 1){
          
        }
      })
  }
  static check(){
    return ClientSettingsDB.find({})
  }
  static update(obj){
    ClientSettingsDB.find({}).then(checked => {
 
    })
  }
}

module.exports = {
  ClientSettings: ClientSettings
};
