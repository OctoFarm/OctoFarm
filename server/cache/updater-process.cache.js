const ChildProcessService = require("../services/child-process.service");
const {join} = require("path");

let updaterChildProcess = undefined;

const PATH = join(`${join(__dirname, "../processes")}`)
const FILE = "updater.process.js";

function getUpdaterChildProcess() {
    if (!!updaterChildProcess) {
        return updaterChildProcess;
    } else {
        updaterChildProcess = new ChildProcessService({ filePath: PATH, fileName: FILE });
        return updaterChildProcess;
    }
}

module.exports = { getUpdaterChildProcess };
