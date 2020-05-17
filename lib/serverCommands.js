
const fs = require('fs');



//Require files..

//Restart server..

//Update server...

//Grab Logs
class Logs{
    static async grabLogs(){
        let fileArray = [];
        const testFolder = './logs/';
        let folderContents = await fs.readdirSync(testFolder)
        for(let i = 0; i < folderContents.length; i++){
            let stats = await fs.statSync(testFolder+folderContents[i])
            let logFile = {};
            logFile.name = folderContents[i];
            logFile.size = stats.size
            logFile.modified = stats.mtime;
            logFile.created = stats.birthtime;
            fileArray.push(logFile)

        }
        return fileArray;
    }
}

module.exports = {Logs};