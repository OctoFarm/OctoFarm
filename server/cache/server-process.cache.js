const ChildProcessService = require("../services/child-process.service");
const {join} = require("path");

let serverChildProcess = undefined;

const PATH = join(`${join(__dirname, "../processes")}`)
const FILE = "server.process.js";

function getServerChildProcess() {
    if (!!serverChildProcess) {
        return serverChildProcess;
    } else {
        serverChildProcess = new ChildProcessService({ filePath: PATH, fileName: FILE });
        return serverChildProcess;
    }
}

module.exports = { getServerChildProcess };
