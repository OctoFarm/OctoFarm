const ping = require("node-http-ping");

const pingTestHost = async (host) => {
    const url = new URL(host);

    if(!url){
        throw new Error("Couldn't generate URL from provided host!")
    }

    return ping(url.hostname, parseInt(url.port)).then(time => time).catch(e => -1)
}

module.exports = {
    pingTestHost
}