const { fork } = require('child_process');
const {join} = require("path");


class ChildProcessService{
    #PROCESS = null;
    #PROCESS_FILE_PATH = null;
    #PROCESS_FILE_NAME = null;

    constructor({ filePath, fileName }) {
        this.#PROCESS_FILE_NAME = fileName;
        this.#PROCESS_FILE_PATH = filePath;

        // Spawn the created process
        this.start()
    }

    start(){
        this.#PROCESS = fork(`${join(this.#PROCESS_FILE_PATH, this.#PROCESS_FILE_NAME)}`);
    }

    restart(){
        this.end();
        this.start();
    }

    end(){
        this.#PROCESS.kill();
    }
}

module.exports = ChildProcessService;