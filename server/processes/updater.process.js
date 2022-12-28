const zip = require("../server/node_modules/yauzl");
const { LOGGER_ROUTE_KEYS } = require("../server/constants/logger.constants");
const Logger = require("../server/handlers/logger");

const logger = new Logger(LOGGER_ROUTE_KEYS.PROCESS_ONLINE_UPDATER);
// Stop the OctoFarm process
let ERROR_TRIGGERED = false;

const stopOctoFarmProcess = () => {
    var exec = require('child_process').exec;
    var cmd = 'pm2 stop OctoFarm --no-treekill';
    logger.info("Stopping the octofarm process...")
    exec(cmd, function(error, stdout, stderr) {
        logger.info(stdout)
        if(stderr) ERROR_TRIGGERED = true;
        logger.error(stderr)
    });
}

const isZipFileTasty = async () => {
    logger.info("Checking to see if zip file exists and is not corrupt")
    try{
        await zip.open("octofarm.zip", {lazyEntries: true})
        logger.info("Zip file is tasty, continuing with upgrade!")
    }catch(e){
        logger.error("Unable to confirm zip file tastyness...")
        ERROR_TRIGGERED = true;
    }


}

const unzipFileToTemporaryDirectory = async () => {
    const zipFile = await zip.open("octofarm.zip", {lazyEntries: true})
    logger.info(zipFile)
}

const backupOldServerDirectory = () => {

}

const clearCurrentServerDirectory = () => {

}

const moveNewFilesToServerDirectory = () => {

}

const updateNodeJSModules = () => {

}

const compareNewAndZipFiles = () => {

}


// Spin up websocket connection to allow monitoring in UI

// UnZip the contents of the release zip into updater

// Remove the old server/ folder

// Move the new server/ folder into the upper directory.

// Restart the OctoFarm process
const startOctoFarmProcess = () => {
    var exec = require('child_process').exec;
    var cmd = 'pm2 start OctoFarm --no-treekill';
    logger.info("Restarting the OctoFarm process");
    exec(cmd, function(error, stdout, stderr) {
        logger.info(stdout)
        if(stderr) ERROR_TRIGGERED = true;
        logger.error(stderr)
    });

    process.exit(0);
}

// Clean up updater folder

// Destroy self
const thousand = 100000

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// Sequence
(async function() {
    logger.info("Starting OctoFarm's update server!")
    //stopOctoFarmProcess();
    //if(ERROR_TRIGGERED) startOctoFarmProcess();
    await isZipFileTasty();
    //if(ERROR_TRIGGERED) startOctoFarmProcess();
    await unzipFileToTemporaryDirectory();
    //startOctoFarmProcess();
    process.exit(0);
})();