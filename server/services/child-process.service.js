const { fork } = require('child_process');
const {join} = require("path");


class ChildProcessService{
    #PROCESS = null;
    #PROCESS_FILE_PATH = null;
    #PROCESS_FILE_NAME = null;
    #MESSAGE_CALLBACK = null;

    constructor({ filePath, fileName, callback }) {
        this.#PROCESS_FILE_NAME = fileName;
        this.#PROCESS_FILE_PATH = filePath;
        this.#MESSAGE_CALLBACK = callback;
    }

    start(callback){
        this.#PROCESS = fork(`${join(this.#PROCESS_FILE_PATH, this.#PROCESS_FILE_NAME)}`);
        this.#PROCESS.on('message', (message) => {
            callback(message)
        });

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