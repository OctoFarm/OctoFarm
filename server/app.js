// Start up the server management process on boot..
const { getServerChildProcess } = require("./cache/server-process.cache");
const { getUpdaterChildProcess } = require("./cache/updater-process.cache");

const handleUpdaterMessage = (message) => {
    console.log("UPDATER: ", message)
    if(typeof message === "object" && !!message?.command){
        // Server sent a command, action it here
        if(message.command === "done"){
            getUpdaterChildProcess().end();
            getServerChildProcess().start(handleServerMessage)
        }

    }
}

const handleServerMessage = (message) => {
    // PM2 to signify process is ready... should wait for database connection...
    if (typeof process.send === "function" && message === "ready") {
        process.send("ready");
    }

    if(typeof message === "object" && !!message?.command){
        // Server sent a command, action it here
        if(message.command === "upgrade"){
            getServerChildProcess().end();
            getUpdaterChildProcess().start(handleUpdaterMessage);
        }
    }
}

(async () => {
    getServerChildProcess()
    getServerChildProcess().start(handleServerMessage);
})();


