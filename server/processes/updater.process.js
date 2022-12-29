const zip = require("yauzl");
const { join, dirname } = require("path");
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");
const Logger = require("../handlers/logger");
const fs = require("fs");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const { UPDATER_PATHS } = require("../constants/path.constants");

const logger = new Logger(LOGGER_ROUTE_KEYS.PROCESS_ONLINE_UPDATER);
// Stop the OctoFarm process

const isZipFileTasty = async () => {
    logger.info("Checking to see if zip file exists and is not corrupt")
    try{
        await zip.open("../temp/octofarm.zip", {lazyEntries: true})
        logger.info("Zip file is tasty, continuing with upgrade!")
    }catch(e){
        logger.error("Unable to confirm zip file tastyness...")
        process.send({ command: "done" })
    }
}

const unzipFileToTemporaryDirectory = (callback) => {
    zip.open(UPDATER_PATHS.REL_UPDATE_ZIP, {lazyEntries: true}, function(err, zipfile) {
        if (err) throw err;
        zipfile.readEntry();
        zipfile.on("entry", function(entry) {
            console.log(entry)
            if (/\/$/.test(entry.fileName)) {
                // Directory file names end with '/'.
                // Note that entries for directories themselves are optional.
                // An entry's fileName implicitly requires its parent directories to exist.
                zipfile.readEntry();
            } else {
                // file entry
                fs.mkdir(
                    join(UPDATER_PATHS.REL_TEMP, dirname(entry.fileName)),
                    { recursive: true },
                    (err) => {
                        if (err) throw err;
                        zipfile.openReadStream(entry, function (err, readStream) {
                            if (err) throw err;
                            readStream.on("end", function () {
                                zipfile.readEntry();
                            });
                            const writer = fs.createWriteStream(
                                join(UPDATER_PATHS.REL_TEMP, entry.fileName)
                            );
                            readStream.pipe(writer);
                        });
                    }
                );
            }
        });
        zipfile.once("end", async function() {
            zipfile.close();
            await callback();
        });
    });
}

const backupOldServerDirectory = (callback) => {
    fs.rename(UPDATER_PATHS.REL_SERVER, UPDATER_PATHS.REL_BACKUP_SERVER, async () => {
        await callback();
    })
}

const moveNewFilesToServerDirectory = (callback) => {
    fs.rename(UPDATER_PATHS.REL_UPDATED_SERVER, UPDATER_PATHS.REL_SERVER, async () => {
        await callback();
    })
}

const updateNodeJSModules = async () => {
    try {
        await exec("npm ci", {
            cwd: UPDATER_PATHS.REL_SERVER
        }, function(error, stdout, stderr) {
            if(error) throw new Error("Error with exec command npm ci! " + error)
            if(stdout) logger.info(stdout)
            if(stderr) throw new Error("STDERR triggered from npm ci! " + stderr)
        });
    } catch (e) {
        logger.error(e)
    }
}

const compareNewAndZipFiles = () => {

}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const runAfterMoveNewFilesToServerDirectory = async () => {
    await updateNodeJSModules;
    process.send({ command: "done" })
}

const runAfterBackup = () => {
    moveNewFilesToServerDirectory(runAfterMoveNewFilesToServerDirectory);
}

const runAfterUnZip = () => {
    backupOldServerDirectory(runAfterBackup);
}

// Sequence
(async function() {
    logger.info("Starting OctoFarm's update server!");
    await isZipFileTasty();
    unzipFileToTemporaryDirectory(runAfterUnZip);
})();