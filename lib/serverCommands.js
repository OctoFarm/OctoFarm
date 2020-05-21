
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const Logger = require('../lib/logger.js');
const logger = new Logger('OctoFarm-Server');


class SystemCommands{
    static async rebootOctoFarm(){
        try {
            const { stdout, stderr } = await exec('pm2 restart OctoFarm');
            logger.info('Restart OctoFarm server requests');
            logger.info('stdout:', stdout);
            logger.info('stderr:', stderr);
        }catch (err){
            logger.error(err)
        };
    }
}

class apiCommands{
    static async powerCommand(){

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