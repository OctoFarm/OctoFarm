// Start up the server management process on boot..
const { getServerChildProcess } = require("./cache/server-process.cache");

(async () => {
    getServerChildProcess();
})()