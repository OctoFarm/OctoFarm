
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);



class SystemCommands{
    static async rebootOctoFarm(){
        try {
            const { stdout, stderr } = await exec('pm2 restart OctoFarm');
            console.log('stdout:', stdout);
            console.log('stderr:', stderr);
        }catch (err){
            console.error(err);
        };
    }
}


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

module.exports = {Logs, SystemCommands};