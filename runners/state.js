const Printers = require("../models/Printer.js");
const serverSettings = require("../settings/serverSettings.js");
const ServerSettings = serverSettings.ServerSettings;
const statisticsCollection = require("../runners/statisticsCollection.js");
const StatisticsCollection = statisticsCollection.StatisticsCollection;
const historyCollection = require("./history.js");
const HistoryCollection = historyCollection.HistoryCollection;
const fetch = require("node-fetch");
const _ = require("lodash");
const WebSocket = require("ws");
const Filament = require("../models/Filament.js");
let timeout = null;
const Logger = require('../lib/logger.js');
const logger = new Logger('OctoFarm-State');
const script = require("../runners/scriptCheck.js");
const ScriptRunner = script.ScriptRunner;
const EventEmitter = require('events');

let farmPrinters = [];
let selectedFilament = [];
let statRunner = null;
let farmStatRunner = null;

//Checking interval for information...
// setInterval(() => {
//   console.log(farmPrinters[0])
// }, 10000);


function WebSocketClient() {
    this.number = 0; // Message number
    this.autoReconnectInterval = timeout.webSocketRetry; // ms
}

function noop() {}

function heartBeat(index) {
    if(farmPrinters[index].state === "Disconnected"){
        farmPrinters[index].webSocket = "warning";
        farmPrinters[index].webSocketDescription = "Websocket Connected but in Tentative state until receiving data";
    }else{
        farmPrinters[index].webSocket = "success";
        farmPrinters[index].webSocketDescription = "Websocket Connection Online";
    }


    farmPrinters[index].ws.isAlive = true;

}

const heartBeatInterval = setInterval(function ping() {
    farmPrinters.forEach(function each(client) {
        if (typeof client.ws !== 'undefined' && typeof client.ws.isAlive !== 'undefined') {
            if(client.ws.instance.readyState !== 0 && client.ws.instance.readyState !== 2 && client.ws.instance.readyState !== 3){
                if (client.ws.isAlive === false) return client.ws.instance.terminate();
                farmPrinters[client.ws.index].webSocket = "info";
                farmPrinters[client.ws.index].webSocketDescription = "Checking if Websocket is still alive";
                client.ws.isAlive = false;
                client.ws.instance.ping(noop);
            }
        }
    });
}, 10000);

WebSocketClient.prototype.open = function(url, index) {
    if (url.includes("http://")) {
        url = url.replace("http://", "")
    }
    if (url.includes("https://")) {
        url = url.replace("https://", "")
    }
    this.url = url;
    this.index = index;
    farmPrinters[this.index].webSocket = "warning";
    farmPrinters[this.index].webSocketDescription = "Websocket Connected but in Tentative state until receiving data";
    this.instance = new WebSocket(this.url);
    this.instance.on('open', () => {
        this.isAlive = true;
        this.onopen(this.index);
    });
    this.instance.on('pong', () => {
        heartBeat(this.index)
    });
    this.instance.on('message', (data, flags) => {
        this.number++;
        this.onmessage(data, flags, this.number, this.index);
    });
    this.instance.on('close', (e) => {
        switch (e) {
            case 1000: // CLOSE_NORMAL
                logger.info("WebSocket: closed: " + this.index + ": " + this.url);
                try {
                    farmPrinters[this.index].state = "Offline";
                    farmPrinters[this.index].stateColour = Runner.getColour("Offline");
                    farmPrinters[this.index].hostState = "Shutdown";
                    farmPrinters[this.index].hostStateColour = Runner.getColour("Shutdown");
                    farmPrinters[this.index].webSocket = "danger";
                    farmPrinters[this.index].stateDescription = "OctoPrint is Offline";
                    farmPrinters[this.index].hostDescription = "Host is Shutdown";
                    farmPrinters[this.index].webSocketDescription = "Websocket Closed by OctoFarm";

                } catch (e) {
                    logger.info("Couldn't set state of missing printer, safe to ignore: " + this.index + ": " + this.url)
                }
                break;
            case 1005: // CLOSE_NORMAL
                logger.info("WebSocket: closed: " + this.index + ": " + this.url);
                try {
                    farmPrinters[this.index].state = "Offline";
                    farmPrinters[this.index].stateColour = Runner.getColour("Offline");
                    farmPrinters[this.index].hostState = "Shutdown";
                    farmPrinters[this.index].hostStateColour = Runner.getColour("Shutdown");
                    farmPrinters[this.index].webSocket = "danger";
                    farmPrinters[this.index].stateDescription = "OctoPrint is Offline";
                    farmPrinters[this.index].hostDescription = "Host is Shutdown";
                    farmPrinters[this.index].webSocketDescription = "Websocket Closed by OctoFarm";

                } catch (e) {
                    logger.info("Couldn't set state of missing printer, safe to ignore: " + this.index + ": " + this.url)
                }
                this.reconnect(e);
                break;
            case 1006: // TERMINATE();
                try {
                    farmPrinters[this.index].state = "Offline";
                    farmPrinters[this.index].stateColour = Runner.getColour("Offline");
                    farmPrinters[this.index].hostState = "Shutdown";
                    farmPrinters[this.index].hostStateColour = Runner.getColour("Shutdown");
                    farmPrinters[this.index].webSocket = "danger";
                    farmPrinters[this.index].stateDescription = "OctoPrint is Offline";
                    farmPrinters[this.index].hostDescription = "Host is Shutdown";
                    farmPrinters[this.index].webSocketDescription = "Websocket Terminated by OctoFarm, Ping/Pong check fails";

                } catch (e) {
                    logger.info("Ping/Pong failed to get a response, closing and attempted to reconnect: " + this.index + ": " + this.url)
                }
                break;
            default: // Abnormal closure
                break;
        }
        this.onclose(e);
        return "closed";
    });
    this.instance.on('error', (e) => {
        switch (e.code) {
            case 'ECONNREFUSED':
                logger.error(e, this.index + ": " + this.url);
                try {
                    farmPrinters[this.index].state = "Offline";
                    farmPrinters[this.index].stateColour = Runner.getColour("Offline");
                    farmPrinters[this.index].hostState = "Online";
                    farmPrinters[this.index].hostStateColour = Runner.getColour("Online");
                    farmPrinters[this.index].webSocket = "danger";
                    farmPrinters[this.index].stateDescription = "OctoPrint is Offline";
                    farmPrinters[this.index].hostDescription = "Host is Shutdown";
                    farmPrinters[this.index].webSocketDescription = "Websocket Connection was refused by host";
                } catch (e) {
                    logger.info("Couldn't set state of missing printer, safe to ignore: " + this.index + ": " + this.url)
                }
                this.reconnect(e);
                break;
            case 'ECONNRESET':
                logger.error(e, this.index + ": " + this.url);
                try {
                    farmPrinters[this.index].state = "Offline";
                    farmPrinters[this.index].stateColour = Runner.getColour("Offline");
                    farmPrinters[this.index].hostState = "Shutdown";
                    farmPrinters[this.index].hostStateColour = Runner.getColour("Shutdown");
                    farmPrinters[this.index].webSocket = "danger";
                    farmPrinters[this.index].stateDescription = "OctoPrint is Offline";
                    farmPrinters[this.index].hostDescription = "Host is Offline";
                    farmPrinters[this.index].webSocketDescription = "Websocket Connection was reset by host";
                } catch (e) {
                    logger.info("Couldn't set state of missing printer, safe to ignore: " + this.index + ": " + this.url)
                }
                this.reconnect(e);
                break;
            case 'EHOSTUNREACH':
                logger.error(e, this.index + ": " + this.url);
                try {
                    farmPrinters[this.index].state = "Offline";
                    farmPrinters[this.index].stateColour = Runner.getColour("Offline");
                    farmPrinters[this.index].hostState = "Shutdown";
                    farmPrinters[this.index].hostStateColour = Runner.getColour("Shutdown");
                    farmPrinters[this.index].webSocket = "danger";
                    farmPrinters[this.index].stateDescription = "OctoPrint is Offline";
                    farmPrinters[this.index].hostDescription = "Host is Shutdown";
                    farmPrinters[this.index].webSocketDescription = "Host is unreachable cannot establish connection";
                } catch (e) {
                    logger.info("Couldn't set state of missing printer, safe to ignore: " + this.index + ": " + this.url)
                }
                this.reconnect(e);
                break;
            default:
                logger.error(e, this.index + ": " + this.url);
                try {
                    farmPrinters[this.index].state = "Re-Sync";
                    farmPrinters[this.index].stateColour = Runner.getColour("Offline");
                    farmPrinters[this.index].hostState = "Error";
                    farmPrinters[this.index].hostStateColour = Runner.getColour("Error");
                    farmPrinters[this.index].webSocket = "danger";
                    farmPrinters[this.index].stateDescription = "Hard Failure, please Re-Sync when Online";
                    farmPrinters[this.index].hostDescription = "Hard Failure, please Re-Sync when Online";
                    farmPrinters[this.index].webSocketDescription = "Hard Failure, please Re-Sync when Online";
                } catch (e) {
                    logger.info("Couldn't set state of missing printer, safe to ignore: " + this.index + ": " + this.url)
                }
                logger.error("WebSocket hard failure: " + this.index + ": " + this.url);
                break;
        }
    });
    return true;
};
WebSocketClient.prototype.throttle = function(data) {
    try {
        logger.info("Throttling your websocket connection: " + this.index + ": " + this.url + " ", data);
        farmPrinters[this.index].ws.send(JSON.stringify(data));
    } catch (e) {
        logger.error("Failed to Throttle websocket: " + this.index + ": " + this.url);
        this.instance.emit('error', e);
    }
};
WebSocketClient.prototype.send = function(data, option) {
    try {
        this.instance.send(data, option);
    } catch (e) {
        this.instance.emit('error', e);
    }
};
WebSocketClient.prototype.reconnect = async function(e) {
    logger.info(`WebSocketClient: retry in ${this.autoReconnectInterval}ms`, e + this.index + ": " + this.url);
    this.instance.removeAllListeners();
    let that = this;
    setTimeout(function() {
        farmPrinters[that.index].hostStateColour = Runner.getColour("Searching...");
        farmPrinters[that.index].hostDescription = "Searching for Host";
        logger.info("Re-Opening Websocket: " + that.index + ": " + that.url);
        that.open(that.url, that.index);
    }, this.autoReconnectInterval);
    return true;
};
WebSocketClient.prototype.onopen = async function(e) {
    logger.info("WebSocketClient: open", arguments, this.index + ": " + this.url);
    let Polling = await ServerSettings.check();
    let data = {};
    let throt = {};
    data["auth"] = farmPrinters[this.index].currentUser + ":" + farmPrinters[this.index].apikey;
    throt["throttle"] = parseInt(
        (Polling[0].onlinePolling.seconds * 1000) / 500
    );
    //Send User Auth
    logger.info("Sending Auth to Websocket: " + this.index + ": " + this.url + " ", data);
    this.instance.send(JSON.stringify(data));
    this.instance.send(JSON.stringify(throt));
};
WebSocketClient.prototype.onmessage = async function(data, flags, number) {
    //console.log("WebSocketClient: message",arguments);
    //Listen for print jobs
    farmPrinters[this.index].hostState = "Online";
    farmPrinters[this.index].hostStateColour = Runner.getColour("Online");
    farmPrinters[this.index].hostDescription = "Host is Online";
    data = await JSON.parse(data);
    if (typeof data.connected != "undefined") {
        farmPrinters[this.index].octoPrintVersion = data.connected.version;
    }
    //Listen for printer status
    if (typeof data.current != "undefined") {
        farmPrinters[this.index].webSocket = "success";
        farmPrinters[this.index].webSocketDescription = "Websocket Alive and Receiving Data";
        if (data.current.state.text === "Offline") {
            data.current.state.text = "Disconnected";
            farmPrinters[this.index].stateDescription = "Your printer is disconnected";
        } else if (data.current.state.text.includes("Error:")) {
            farmPrinters[this.index].stateDescription = data.current.state.text;
            data.current.state.text = "Error!"
        } else if (data.current.state.text === "Closed") {
            res.current.state.text = "Disconnected";
            farmPrinters[this.index].stateDescription = "Your printer is disconnected";
        }else{
            farmPrinters[this.index].stateDescription = "Current Status from OctoPrint";
        }
        farmPrinters[this.index].state = data.current.state.text;
        farmPrinters[this.index].stateColour = Runner.getColour(data.current.state.text);
        if(farmPrinters[this.index].stateColour.category === "Active"){
            Runner.uptimeCount(this.index)
        }
        if(farmPrinters[this.index].stateColour.category === "Idle" ||farmPrinters[this.index].stateColour.category === "Complete"){
            Runner.idleCount(this.index)
        }

        if (typeof data.current.progress !== 'undefined') {
            farmPrinters[this.index].progress = data.current.progress;
        }
        if (typeof data.current.currentZ !== 'undefined' && data.currentZ !== null) {
            farmPrinters[this.index].currentZ = data.current.currentZ;
        }
        if (typeof data.current.job !== 'undefined' && data.current.job.user !== null) {
            //console.log(data.current.job)
            farmPrinters[this.index].job = data.current.job;
        }

        if (typeof data.current.logs != undefined) {
            farmPrinters[this.index].logs = data.current.logs;
        }
        if (typeof data.current.temps !== 'undefined' && data.current.temps.length !== 0) {
            if(typeof data.current.temps[0].tool0 !== 'undefined'){
                farmPrinters[this.index].temps = data.current.temps;
            }
        }
        if (
            data.current.progress.completion != null &&
            data.current.progress.completion === 100
        ) {
            farmPrinters[this.index].stateColour = Runner.getColour("Complete");
            farmPrinters[this.index].stateDescription = "Your current print is Completed!";
        } else {
            farmPrinters[this.index].stateColour = Runner.getColour(
                data.current.state.text
            );
        }
    }
    if (typeof data.event != "undefined") {
        if (data.event.type === "PrintPaused") {
            let that = this;
            ScriptRunner.check(farmPrinters[that.index], "paused")
        }
        if (data.event.type === "PrintFailed") {
            let that = this;
            setTimeout(async function(){
                logger.info(data.event.type + that.index + ": " + that.url);
                let sendPrinter = {};
                sendPrinter = JSON.parse(JSON.stringify(farmPrinters[that.index]));
                let job = {}
                job = JSON.parse(JSON.stringify(farmPrinters[that.index].job));
                //Register cancelled print...
                await HistoryCollection.failed(data.event.payload, sendPrinter, job);
                await Runner.updateFilament();
            }, 10000);
            ScriptRunner.check(farmPrinters[that.index], "failed")
        }
        if (data.event.type === "PrintDone") {
            let that = this;
            setTimeout(async function(){
                logger.info(data.event.type + that.index + ": " + that.url);
                let sendPrinter = {};
                sendPrinter = JSON.parse(JSON.stringify(farmPrinters[that.index]));
                let job = {}
                job = JSON.parse(JSON.stringify(farmPrinters[that.index].job));
                //Register cancelled print...
                await HistoryCollection.complete(data.event.payload, sendPrinter, job);
                await Runner.updateFilament();
            }, 10000);
            ScriptRunner.check(farmPrinters[that.index], "done")
        }
        if(data.event.type === "Error"){
            let that = this;
            setTimeout(async function(){
                logger.info(data.event.type + that.index + ": " + that.url);
                let sendPrinter = {};
                sendPrinter = JSON.parse(JSON.stringify(farmPrinters[that.index]));
                let job = {}
                if(farmPrinters[that.index].job){
                    job = JSON.parse(JSON.stringify(farmPrinters[that.index].job));
                }
                //Register cancelled print...
                await HistoryCollection.errorLog(data.event.payload, sendPrinter, job);
                await Runner.updateFilament();
            }, 10000);
            ScriptRunner.check(farmPrinters[that.index], "error");
        }
    }
    //Event Listeners for state changes
    if(typeof farmPrinters[this.index].temps !== 'undefined'){
        //When object changes to active, add event listener awaiting cool down.
            if (farmPrinters[this.index].stateColour.category === "Active") {
                //Check for existing events object...
                if (typeof farmPrinters[this.index].events === 'undefined') {
                    farmPrinters[this.index].events = new EventEmitter();
                }
                if (typeof farmPrinters[this.index].events._events.cooldown === 'undefined') {
                    let that = this;
                    farmPrinters[this.index].events.once('cooldown', (stream) => {
                        ScriptRunner.check(farmPrinters[that.index], "cooldown");
                    })
                }
            }
            if (farmPrinters[this.index].stateColour.category === "Complete") {
                if (typeof farmPrinters[this.index].events != 'undefined') {
                    if (typeof farmPrinters[this.index].temps != 'undefined') {
                        if (parseFloat(farmPrinters[this.index].temps[0].tool0.actual) < parseFloat(farmPrinters[this.index].tempTriggers.coolDown) && parseFloat(farmPrinters[this.index].temps[0].bed.actual) < parseFloat(farmPrinters[this.index].tempTriggers.coolDown)) {
                            farmPrinters[this.index].events.emit('cooldown');
                        }
                    }
                }
            }
    }
};
WebSocketClient.prototype.onerror = function(e) {
    logger.error("WebSocketClient: Error", arguments, +this.index + ": " + this.url);
    this.instance.removeAllListeners();
};
WebSocketClient.prototype.onclose = function(e) {
    logger.info("WebSocketClient: Closed", arguments, this.index + ": " + this.url);
    this.instance.removeAllListeners();
};

class ClientAPI {
    static async get_retry(printerURL, apikey, item) {
        try {
            logger.info("Attempting to connect to API: " + item + " | " + printerURL + " | timeout: " + timeout.apiTimeout);
            let apiConnect = await ClientAPI.get(printerURL, apikey, item);
            return apiConnect;
        } catch (err) {
            logger.error(err)
                //If timeout exceeds max cut off then give up... Printer is considered offline.
            if (timeout.apiTimeout >= timeout.apiRetryCutoff) {
                logger.info("Timeout Exceeded: " + item + " | " + printerURL);
                //Reset timeout for next printer...
                timeout.apiTimeout = Number(timeout.apiTimeout) - 9000;
                throw err;
            }
            timeout.apiTimeout = timeout.apiTimeout + 9000;
            logger.info("Attempting to re-connect to API: " + item + " | " + printerURL + " | timeout: " + timeout.apiTimeout);
            return await ClientAPI.get_retry(printerURL, apikey, item);
        }
    }
    static files(printerURL, apikey, item) {
        let url = `${printerURL}/api/${item}`;
        fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-Api-Key": apikey
            }
        });
    }
    static get(printerURL, apikey, item) {
        let url = `${printerURL}/api/${item}`;
        return Promise.race([
            fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-Api-Key": apikey
                }
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("timeout")), timeout.apiTimeout)
            )
        ]);
    }

}

class Runner {
    static async init() {
        let timeoutSettings = await ServerSettings.check();
        timeout = timeoutSettings[0].timeout
        farmPrinters = [];
        statRunner = setInterval(function() {
            //Update Current Operations
            StatisticsCollection.currentOperations(farmPrinters);
        }, 500);
        farmStatRunner = setInterval(function() {
            //Update farm statistics
            StatisticsCollection.octofarmStatistics(farmPrinters);
            //Update farm information when we have temps
            StatisticsCollection.farmInformation(farmPrinters);
            //Update print statistics
            StatisticsCollection.printStatistics();
        }, 5000);

        //Grab printers from database....
        try {
            farmPrinters = await Printers.find({}, null, { sort: { sortIndex: 1 } });
            logger.info("Grabbed " + farmPrinters.length + " for checking");
            for (let i = 0; i < farmPrinters.length; i++) {
                //Make sure runners are created ready for each printer to pass between...
                await Runner.setDefaults(farmPrinters[i]._id);
            }
        } catch (err) {
            let error = {
                err: err.message,
                action: "Database connection failed... No action taken",
                userAction: "Please make sure the database URL is inputted and can be reached... 'file located at: config/db.js'"
            };
            logger.error(err);
        }


        //cycle through printers and move them to correct checking location...

        for (let i = 0; i < farmPrinters.length; i++) {
            //Make sure runners are created ready for each printer to pass between...
            await Runner.setupWebSocket(farmPrinters[i]._id);
        }

        return (
            "System Runner has checked over " + farmPrinters.length + " printers..."
        );
    }

    static async setupWebSocket(id, skipAPICheck) {
        let i = _.findIndex(farmPrinters, function(o) { return o._id == id; });
        try {
            if (i === -1) {
                let error = { message: 'Could not find printer...:', type: 'system', errno: 'DELETED', code: 'DELETED' };
                throw error;
            }
            const ws = new WebSocketClient();
            farmPrinters[i].state = "Searching...";
            farmPrinters[i].stateColour = Runner.getColour("Searching...");
            farmPrinters[i].hostState = "Searching...";
            farmPrinters[i].hostStateColour = Runner.getColour("Searching...");
            farmPrinters[i].webSocket = "danger";
            farmPrinters[i].stateDescription = "Attempting to connect to OctoPrint";
            farmPrinters[i].hostDescription = "Attempting to connect to OctoPrint";
            farmPrinters[i].webSocketDescription = "Websocket Offline";
            farmPrinters[i].ws = ws;
            //Make a connection attempt, and grab current user.
            let users = null;
            users = await ClientAPI.get_retry(farmPrinters[i].printerURL, farmPrinters[i].apikey, "users");
            if (users.status === 200) {
                users = await users.json();
                if (_.isEmpty(users)) {
                    farmPrinters[i].currentUser = "admin";
                    farmPrinters[i].markModified("currentUser");
                    farmPrinters[i].save();
                } else {
                    users.users.forEach(user => {
                        if (user.admin) {
                            farmPrinters[i].currentUser = user.name;
                            farmPrinters[i].markModified("currentUser");
                            farmPrinters[i].save();
                        }
                    });
                }
                //Update info via API
                farmPrinters[i].hostState = "Online";
                farmPrinters[i].hostStateColour = Runner.getColour("Online");
                farmPrinters[i].hostDescription = "Host is Online";
                if(typeof skipAPICheck === "undefined"){
                    await Runner.getSystem(id);
                    await Runner.getSettings(id);
                }
                await Runner.getProfile(id);
                await Runner.getState(id);
                await Runner.getFiles(id, "files?recursive=true");
                //Connection to API successful, gather initial data and setup websocket.
                await farmPrinters[i].ws.open(
                    `ws://${farmPrinters[i].printerURL}/sockjs/websocket`,
                    i
                );
            } else if (users.status === 503 || users.status === 404) {
                let error = { message: 'Could not Establish connection to OctoPrint Returned: ' + users.status + ': ' + farmPrinters[i].printerURL, type: 'system', errno: '503', code: '503' };
                throw error;
            } else {
                let error = { message: 'Could not Establish API Connection: ' + users.status + farmPrinters[i].printerURL, type: 'system', errno: 'NO-API', code: 'NO-API' };
                throw error;
            }
        } catch (e) {
            switch (e.code) {
                case 'NO-API':
                    logger.error(e.message, "Couldn't grab initial connection for Printer: " + farmPrinters[i].printerURL);
                    try {
                        farmPrinters[i].state = "No-API";
                        farmPrinters[i].stateColour = Runner.getColour("No-API");
                        farmPrinters[i].hostState = "Online";
                        farmPrinters[i].hostStateColour = Runner.getColour("Online");
                        farmPrinters[i].webSocket = "danger";
                        farmPrinters[i].stateDescription = "Could not connect to OctoPrints API";
                        farmPrinters[i].hostDescription = "Host is Online";
                        farmPrinters[i].webSocketDescription = "Websocket Offline";
                    } catch (e) {
                        logger.error("Couldn't set state of missing printer, safe to ignore: " + farmPrinters[i].index + ": " + farmPrinters[i].printerURL)
                    }
                    setTimeout(function() { Runner.setupWebSocket(id); }, timeout.apiRetry);
                    break;
                case 'ECONNREFUSED':
                    logger.error(e.message, "Couldn't grab initial connection for Printer: " + farmPrinters[i].printerURL);
                    try {
                        farmPrinters[i].state = "Offline";
                        farmPrinters[i].stateColour = Runner.getColour("Offline");
                        farmPrinters[i].hostState = "Online";
                        farmPrinters[i].hostStateColour = Runner.getColour("Online");
                        farmPrinters[i].webSocket = "danger";
                        farmPrinters[i].stateDescription = "OctoPrint is Offline";
                        farmPrinters[i].hostDescription = "Host is Online";
                        farmPrinters[i].webSocketDescription = "Websocket Offline";
                    } catch (e) {
                        logger.error("Couldn't set state of missing printer, safe to ignore: " + farmPrinters[i].index + ": " + farmPrinters[i].printerURL)
                    }
                    setTimeout(function() { Runner.setupWebSocket(id); }, timeout.apiRetry);
                    break;
                case 'DELETED':
                    logger.error(e.message, "Printer Deleted... Do not retry to connect");
                    break;
                default:
                    logger.error(e.message, "Couldn't grab initial connection for Printer: " + farmPrinters[i].printerURL);
                    try {
                        farmPrinters[i].state = "Offline";
                        farmPrinters[i].stateColour = Runner.getColour("Offline");
                        farmPrinters[i].hostState = "Shutdown";
                        farmPrinters[i].hostStateColour = Runner.getColour("Shutdown");
                        farmPrinters[i].webSocket = "danger";
                        farmPrinters[i].stateDescription = "OctoPrint is Offline";
                        farmPrinters[i].hostDescription = "Host is Shutdown";
                        farmPrinters[i].webSocketDescription = "Websocket Offline";
                    } catch (e) {
                        logger.error("Couldn't set state of missing printer, safe to ignore: " + farmPrinters[i].index + ": " + farmPrinters[i].printerURL)
                    }
                    setTimeout(function() { Runner.setupWebSocket(id); }, timeout.apiRetry);
                    break;
            }
        }
        return true;
    }

    static async setDefaults(id) {
        let i = _.findIndex(farmPrinters, function(o) { return o._id == id; });
        let printer = await Printers.findById(id);
        logger.info("Setting up defaults for Printer: " + printer.printerURL);
        farmPrinters[i].state = "Setting Up";
        farmPrinters[i].stateColour = Runner.getColour("Offline");
        farmPrinters[i].hostState = "Setting Up";
        farmPrinters[i].hostStateColour = Runner.getColour("Offline");
        farmPrinters[i].webSocket = "danger";
        farmPrinters[i].stateDescription = "Setting up your Printer";
        farmPrinters[i].hostDescription = "Setting up your Printer";
        farmPrinters[i].webSocketDescription = "Websocket is Offline";
        farmPrinters[i].stepRate = 10;
        if(typeof farmPrinters[i].dateAdded === "undefined"){
            let currentTime = new Date();
            currentTime = currentTime.getTime();
            farmPrinters[i].dateAdded = currentTime;
        }
        if(typeof farmPrinters[i].currentUptime === "undefined"){
            farmPrinters[i].currentUptime = 0;
        }

        if(typeof farmPrinters[i].alerts === "undefined"){
            farmPrinters[i].alerts = null;
        }
        if(typeof farmPrinters[i].powerSettings === "undefined"){
            farmPrinters[i].powerSettings = null;
        }
        if(typeof farmPrinters[i].currentIdle === "undefined"){
            farmPrinters[i].currentIdle = 0;
        }
        if(typeof farmPrinters[i].selectedFilament === "undefined"){
            farmPrinters[i].selectedFilament = null;
        }else{
            if(farmPrinters[i].selectedFilament != null){
                selectedFilament.push(farmPrinters[i].selectedFilament._id)
            }
        }
        if (typeof farmPrinters[i].octoPrintVersion === "undefined") {
            farmPrinters[i].octoPrintVersion = "";
        }
        if (typeof farmPrinters[i].tempTriggers === "undefined") {
            farmPrinters[i].tempTriggers = {
                heatingVariation: 1,
                coolDown: 30,
            }
        }
        if (typeof farmPrinters[i].feedRate === "undefined") {
            farmPrinters[i].feedRate = 100;
        }
        if (typeof farmPrinters[i].flowRate === "undefined") {
            farmPrinters[i].flowRate = 100;
        }
        if (typeof farmPrinters[i].sortIndex === "undefined") {
            if (farmPrinters.length === 0) {
                farmPrinters[i].sortIndex = 0;
            } else if (farmPrinters.length > 0) {
                farmPrinters[i].sortIndex = farmPrinters.length - 1;
            }
        }
        if (typeof farmPrinters[i].group === "undefined") {
            farmPrinters[i].group = "";
        }
        if (typeof farmPrinters[i].printerURL === "undefined") {
            farmPrinters[i].printerURL = "http://" + farmPrinters[i].ip + ":" + farmPrinters[i].port;
        }
        if (typeof farmPrinters[i].printerURL !== "undefined" && !farmPrinters[i].printerURL.includes("https://") && !farmPrinters[i].printerURL.includes("http://")) {
            farmPrinters[i].printerURL = "http://" + farmPrinters[i].printerURL;
        }
        if (typeof farmPrinters[i].camURL !== "undefined" && farmPrinters[i].camURL !== "" && !farmPrinters[i].camURL.includes("http")) {
            if (typeof farmPrinters[i].camURL !== "undefined" && farmPrinters[i].camURL.includes("{Set") || farmPrinters[i].camURL === "none") {
                farmPrinters[i].camURL = "none"
            } else {
                farmPrinters[i].camURL = "http://" + farmPrinters[i].camURL;
            }
        }
        if (typeof farmPrinters[i].costSettings === "undefined" || _.isEmpty(farmPrinters[i].costSettings)) {
            farmPrinters[i].costSettings = {
                powerConsumption: 0.5,
                electricityCosts: 0.15,
                purchasePrice: 500,
                estimateLifespan: 43800,
                maintenanceCosts: 0.25,
            };
        }
        printer.octoPrintVersion = farmPrinters[i].octoPrintVersion;
        printer.camURL = farmPrinters[i].camURL;
        printer.printerURL = farmPrinters[i].printerURL;
        printer.feedRate = farmPrinters[i].feedRate;
        printer.flowRate = farmPrinters[i].flowRate;
        printer.sortIndex = farmPrinters[i].sortIndex;
        printer.tempTriggers = farmPrinters[i].tempTriggers;
        printer.dateAdded = farmPrinters[i].dateAdded;
        printer.currentUptime = farmPrinters[i].currentUptime;
        printer.selectedFilament = farmPrinters[i].selectedFilament;
        printer.powerSettings = farmPrinters[i].powerSettings;
        printer.alerts = farmPrinters[i].alerts;
        printer.costSettings = farmPrinters[i].costSettings;
        await printer.save();
        return true;
    }
    static async addPrinters(printers) {
        logger.info("Adding single printer to farm");
        //Only adding a single printer
        let newPrinter = await new Printers(printers[0]);
        await newPrinter.save();
        logger.info("Saved new Printer: " + newPrinter.printerURL);
        farmPrinters.push(newPrinter)
        await this.setDefaults(newPrinter._id);
        await this.setupWebSocket(newPrinter._id);
        return [newPrinter];
    }
    static async updatePrinters(printers) {
        //Updating printer's information
        logger.info("Pausing runners to update printers...");
        let edited = []
        for (let i = 0; i < printers.length; i++) {
            let index = _.findIndex(farmPrinters, function(o) { return o._id == printers[i]._id; });
            farmPrinters[index].state = "Searching...";
            farmPrinters[index].stateColour = Runner.getColour("Searching...");
            farmPrinters[index].hostState = "Searching...";
            farmPrinters[index].hostStateColour = Runner.getColour("Searching...");
            farmPrinters[index].webSocket = "danger"
            farmPrinters[index].stateDescription = "Re-Scanning your OctoPrint Instance";
            farmPrinters[index].hostDescription = "Re-Scanning for OctoPrint Host";
            farmPrinters[index].webSocketDescription = "Websocket is Offline";
            farmPrinters[index].settingsApperance.name = printers[i].settingsApperance.name;
            farmPrinters[index].markModified("settingsApperance");
            logger.info("Modified Current Name  for: " + farmPrinters[i].printerURL);
            farmPrinters[index].printerURL = printers[i].printerURL;
            farmPrinters[index].markModified("printerURL");
            logger.info("Modified current printer URL  for: " + farmPrinters[i].printerURL);
            farmPrinters[index].camURL = printers[i].camURL
            farmPrinters[index].markModified("camURL");
            logger.info("Modified current camera URL for: " + farmPrinters[i].printerURL);
            farmPrinters[index].apikey = printers[i].apikey;
            farmPrinters[index].markModified("apikey");
            logger.info("Modified current APIKEY for: " + farmPrinters[i].printerURL);
            farmPrinters[index].group = printers[i].group;
            farmPrinters[index].markModified("group");
            logger.info("Modified current group for: " + farmPrinters[i].printerURL);
            await farmPrinters[index].save();
            edited.push({ printerURL: farmPrinters[index].printerURL });
            await this.reScanOcto(farmPrinters[index]._id, true);
        }

        logger.info("Re-Scanning printers farm");
        return edited;
    }
    static async uptimeCount(index){
        let printer = await Printers.findById(farmPrinters[index]._id);
        farmPrinters[index].currentUptime = farmPrinters[index].currentUptime + 500;
        printer.currentUptime = farmPrinters[index].currentUptime;
        printer.markModified("currentUptime");
        printer.save();
    }
    static async idleCount(index){
        let printer = await Printers.findById(farmPrinters[index]._id);
        farmPrinters[index].currentIdle = farmPrinters[index].currentIdle + 500;
        printer.currentIdle = farmPrinters[index].currentIdle;
        printer.markModified("currentIdle");
        printer.save();
    }
    static async removePrinter(indexs) {
        logger.info("Pausing runners to remove printer...");
        await this.pause();
        let removed = []
        for (let i = 0; i < indexs.length; i++) {
            let index = _.findIndex(farmPrinters, function(o) { return o._id == indexs[i]; });
            logger.info("Removing printer from database: " + farmPrinters[index].printerURL);
            removed.push({ printerURL: farmPrinters[index].printerURL, printerId: indexs[i] });
            await farmPrinters.splice(index, 1);
            //Splice printer out of farm Array...
            let remove = await Printers.findOneAndDelete({ _id: indexs[i] });
        }
        //Regenerate Indexs
        for (let p = 0; p < farmPrinters.length; p++) {
            await logger.info("Regenerating existing indexes: " + farmPrinters[p].printerURL);
            farmPrinters[p].sortIndex = p;
            await farmPrinters[p].save();
        }
        logger.info("Re-Scanning printers farm");
        this.init();
        return removed;
    }

    static async reScanOcto(id, skipAPI) {
        let index = _.findIndex(farmPrinters, function(o) { return o._id == id; });
        let result = {
            status: null,
            msg: null
        };
        farmPrinters[index].state = "Searching...";
        farmPrinters[index].stateColour = Runner.getColour("Searching...");
        farmPrinters[index].hostState = "Searching...";
        farmPrinters[index].hostStateColour = Runner.getColour("Searching...");
        farmPrinters[index].webSocket = "danger"
        farmPrinters[index].stateDescription = "Re-Scanning your OctoPrint Instance";
        farmPrinters[index].hostDescription = "Re-Scanning for OctoPrint Host";
        farmPrinters[index].webSocketDescription = "Websocket is Offline";
        if (typeof farmPrinters[index].ws !== 'undefined' && typeof farmPrinters[index].ws.instance !== 'undefined') {
            await farmPrinters[index].ws.instance.terminate();
            logger.info("Closed websocket connection for: " + farmPrinters[index].printerURL);

        }
        await this.setupWebSocket(farmPrinters[index]._id, skipAPI);
        result.status = "sucess",
            result.msg = "Your client has been re-synced!"
        return result;
    }
    static async updatePoll() {
        for (let i = 0; i < farmPrinters.length; i++) {
            let Polling = await ServerSettings.check();
            let throt = {};
            logger.info("Updating websock poll time: " + Polling[0].onlinePolling.seconds * 1000 / 500);
            throt["throttle"] = parseInt(
                (Polling[0].onlinePolling.seconds * 1000) / 500
            );
            if (typeof farmPrinters[i].ws != 'undefined' && typeof farmPrinters[i].ws.instance != 'undefined') {
                await farmPrinters[i].ws.throttle(JSON.stringify(throt));
                logger.info("ReScanning Octoprint instance");
                await this.reScanOcto(farmPrinters[i]._id);
            }
        }
        return "updated";
    }
    static async pause() {
        logger.info("Stopping farm statistics runner...");
        clearInterval(farmStatRunner);
        logger.info("Stopping farm Information runner...");
        clearInterval(statRunner);

        for (let i = 0; i < farmPrinters.length; i++) {
            if (typeof farmPrinters[i].ws !== 'undefined' && typeof farmPrinters[i].ws.instance !== 'undefined') {
                await farmPrinters[i].ws.instance.terminate();
                logger.info("Closed websocket connection for: " + farmPrinters[i].printerURL);
            }
        }
        return true;
    }




    static getFiles(id, location) {
        let index = _.findIndex(farmPrinters, function(o) { return o._id == id; });
        //Shim to fix undefined on upload files/folders
        farmPrinters[index].fileList = {
            files: [],
            fileCount: 0,
            folders: [],
            folderCount: 0
        };
        let url = `${farmPrinters[index].printerURL}/api/${location}`;
        return fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-Api-Key": farmPrinters[index].apikey
            }
        }).then(res => {
                return res.json();
            })
            .then(res => {

                //Setup the files json storage object
                farmPrinters[index].storage = {
                    free: res.free,
                    total: res.total
                };
                //Setup the files location object to place files...
                let printerFiles = [];
                let printerLocations = [];
                let recursivelyPrintNames = function(entry, depth) {
                    depth = depth || 0;
                    let timeStat = "";
                    let filament = "";
                    let isFolder = entry.type === "folder";
                    if (!isFolder) {
                        if (typeof entry.gcodeAnalysis !== 'undefined') {
                            if (typeof entry.gcodeAnalysis.estimatedPrintTime !== 'undefined') {
                                timeStat = entry.gcodeAnalysis.estimatedPrintTime;

                                filament = entry.gcodeAnalysis.filament.tool0.length;
                            } else {
                                timeStat = "No Time Estimate";
                                filament = null;
                            }
                        } else {
                            timeStat = "No Time Estimate";
                            filament = null;
                        }

                        let path = null;
                        if (entry.path.indexOf("/") > -1) {
                            path = entry.path.substr(0, entry.path.lastIndexOf("/"));
                        } else {
                            path = "local";
                        }
                        let thumbnail = null;

                        if(typeof entry.thumbnail !== 'undefined'){
                            thumbnail = entry.thumbnail
                        }
                        let file = {
                            path: path,
                            fullPath: entry.path,
                            display: entry.display,
                            length: filament,
                            name: entry.name,
                            size: entry.size,
                            time: timeStat,
                            date: entry.date,
                            thumbnail: thumbnail
                        };
                        printerFiles.push(file);
                    }
                    let folderPaths = {
                        name: "",
                        path: ""
                    };
                    if (isFolder) {
                        if (entry.path.indexOf("/") > -1) {
                            folderPaths.path = entry.path.substr(
                                0,
                                entry.path.lastIndexOf("/")
                            );
                        } else {
                            folderPaths.path = "local";
                        }

                        if (entry.path.indexOf("/")) {
                            folderPaths.name = entry.path;
                        } else {
                            folderPaths.name = entry.path.substr(
                                0,
                                entry.path.lastIndexOf("/")
                            );
                        }
                        printerLocations.push(folderPaths);
                    }
                    farmPrinters[index].fileList = {
                        files: printerFiles,
                        fileCount: printerFiles.length,
                        folders: printerLocations,
                        folderCount: printerLocations.length
                    };

                    if (isFolder) {
                        _.each(entry.children, function(child) {
                            recursivelyPrintNames(child, depth + 1);
                        });
                    }
                };
                _.each(res.files, function(entry) {
                    recursivelyPrintNames(entry);
                });
                logger.info("Successfully grabbed Files for...: " + farmPrinters[index].printerURL);
            })
            .catch(err => {
                logger.error("Error grabbing files for: " + farmPrinters[index].printerURL + ": Reason: ", err);
                return false;
            });
    }
    static getState(id) {
        let index = _.findIndex(farmPrinters, function(o) { return o._id == id; });
        return ClientAPI.get_retry(
                farmPrinters[index].printerURL,
                farmPrinters[index].apikey,
                "connection"
            )
            .then(res => {
                return res.json();
            })
            .then(res => {
                //Update info to DB
                if (res.current.state === "Offline") {
                    res.current.state = "Disconnected";
                    farmPrinters[index].stateDescription = "Your printer is disconnected";
                } else if (res.current.state.includes("Error:")) {
                    farmPrinters[index].stateDescription = res.current.state;
                    res.current.state = "Error!"
                } else if (res.current.state === "Closed") {
                    res.current.state = "Disconnected";
                    farmPrinters[index].stateDescription = "Your printer is disconnected";
                }else{
                    farmPrinters[index].stateDescription = "Current Status from OctoPrint";
                }
                farmPrinters[index].state = res.current.state;
                farmPrinters[index].stateColour = Runner.getColour(res.current.state);
                farmPrinters[index].current = res.current;
                farmPrinters[index].options = res.options;
                logger.info("Successfully grabbed Current State for...: " + farmPrinters[index].printerURL);
            })
            .catch(err => {
                logger.error("Error grabbing state for: " + farmPrinters[index].printerURL + "Reason: ", err);
                return false;
            });
    }
    static getProfile(id) {
        let index = _.findIndex(farmPrinters, function(o) { return o._id == id; });
        return ClientAPI.get_retry(
                farmPrinters[index].printerURL,
                farmPrinters[index].apikey,
                "printerprofiles"
            )
            .then(res => {
                return res.json();
            })
            .then(res => {
                //Update info to DB
                farmPrinters[index].profiles = res.profiles;
                logger.info("Successfully grabbed Profiles.js for...: " + farmPrinters[index].printerURL);
            })
            .catch(err => {
                logger.error("Error grabbing profile for: " + farmPrinters[index].printerURL + ": Reason: ", err);
                return false;
            });
    }
    static getSettings(id) {
        let index = _.findIndex(farmPrinters, function(o) { return o._id == id; });
        return ClientAPI.get_retry(
                farmPrinters[index].printerURL,
                farmPrinters[index].apikey,
                "settings"
            )
            .then(res => {
                return res.json();
            })
            .then(async res => {
                //Update info to DB
                farmPrinters[index].settingsApi = res.api;
                let appearance = null;
                if (farmPrinters[index].settingsApperance.name === "" || farmPrinters[index].settingsApperance.name.includes("{Leave")) {
                    //If new name is supplied then update the name...
                    appearance = res.appearance;
                    appearance.name = res.appearance.name;
                    farmPrinters[index].settingsApperance = appearance;
                }
                let printer = await Printers.findById(id);
                printer.settingsApperance = farmPrinters[index].settingsApperance;
                farmPrinters[index].settingsApperance
                printer.save();
                farmPrinters[index].settingsFeature = res.feature;
                farmPrinters[index].settingsFolder = res.folder;
                farmPrinters[index].settingsPlugins = res.plugins;
                farmPrinters[index].settingsScripts = res.scripts;
                farmPrinters[index].settingsSerial = res.serial;
                farmPrinters[index].settingsServer = res.server;
                farmPrinters[index].settingsSystem = res.system;
                farmPrinters[index].settingsWebcam = res.webcam;

                if (
                    farmPrinters[index].camURL === "" ||
                    farmPrinters[index].camURL === null && farmPrinters[index].camURL !== "none"
                ) {
                    if (
                        typeof res.webcam != "undefined" &&
                        typeof res.webcam.streamUrl != "undefined" &&
                        res.webcam.streamUrl != null
                    ) {
                        if (res.webcam.streamUrl.includes("http")) {
                            farmPrinters[index].camURL = res.webcam.streamUrl;
                            farmPrinters[index].camURL = farmPrinters[index].camURL.replace(
                                "http://",
                                ""
                            );
                        } else {
                            farmPrinters[index].camURL =
                                farmPrinters[index].printerURL +
                                res.webcam.streamUrl;
                        }
                        let printer = await Printers.findOne({ index: index });
                        printer.camURL = farmPrinters[index].camURL;
                        printer.save();

                    }
                }
                logger.info("Successfully grabbed Settings for...: " + farmPrinters[index].printerURL);
            })
            .catch(err => {
                logger.error("Error grabbing settings for: " + farmPrinters[index].printerURL + ": Reason: ", err);
                return false;
            });
    }
    static getSystem(id) {
        let index = _.findIndex(farmPrinters, function(o) { return o._id == id; });
        return ClientAPI.get_retry(
                farmPrinters[index].printerURL,
                farmPrinters[index].apikey,
                "system/commands"
            )
            .then(res => {
                return res.json();
            })
            .then(res => {
                //Update info to DB
                farmPrinters[index].core = res.core;
                logger.info("Successfully grabbed System Information for...: " + farmPrinters[index].printerURL);
            })
            .catch(err => {
                logger.error("Error grabbing system for: " + farmPrinters[index].printerURL + ": Reason: ", err);
                return false;
            });
    }
    static getColour(state) {
        if (state === "Operational") {
            return { name: "secondary", hex: "#262626", category: "Idle" };
        } else if (state === "Paused") {
            return { name: "warning", hex: "#583c0e", category: "Idle" };
        } else if (state === "Printing") {
            return { name: "warning", hex: "#583c0e", category: "Active" };
        } else if (state === "Pausing") {
            return { name: "warning", hex: "#583c0e", category: "Active" };
        } else if (state === "Cancelling") {
            return { name: "warning", hex: "#583c0e", category: "Active" };
        } else if (state === "Starting") {
            return { name: "warning", hex: "#583c0e", category: "Active" };
        } else if (state === "Error!") {
            return { name: "danger", hex: "#2e0905", category: "Disconnected" };
        } else if (state === "Offline") {
            return { name: "danger", hex: "#2e0905", category: "Offline" };
        } else if (state === "Searching...") {
            return { name: "danger", hex: "#2e0905", category: "Offline" };
        } else if (state === "Disconnected") {
            return { name: "danger", hex: "#2e0905", category: "Disconnected" };
        } else if (state === "No-API") {
            return { name: "danger", hex: "#2e0905", category: "Offline" };
        } else if (state === "Complete") {
            return { name: "success", hex: "#00330e", category: "Complete" };
        } else if (state === "Shutdown") {
            return { name: "danger", hex: "#2e0905", category: "Offline" };
        } else if (state === "Online") {
            return { name: "success", hex: "#00330e", category: "Idle" };
        } else {
            return { name: "warning", hex: "#583c0e", category: "Active" };
        }
    }
    static returnFarmPrinters(index) {
        if (typeof index === 'undefined') {
            return farmPrinters;
        } else {
            let i = _.findIndex(farmPrinters, function(o) { return o._id == index; });
            return farmPrinters[i];
        }

    }
    static async removeFile(printer, fullPath) {
        let i = _.findIndex(farmPrinters, function(o) { return o._id == printer._id; });
        let index = await _.findIndex(farmPrinters[i].fileList.files, function(o) {
            return o.fullPath === fullPath;
        });
        farmPrinters[i].fileList.files.splice(index, 1);
        farmPrinters[i].fileList.fileCount = farmPrinters[i].fileList.files.length;
    }

    static async reSyncFile(id) {
        let i = _.findIndex(farmPrinters, function(o) { return o._id == id; });
        //Doesn't actually resync just the file... shhh
        let success = await Runner.getFiles(id, "files?recursive=true");
        if (success) {
            return success;
        } else {
            return false;
        }
    }
    static async flowRate(id, newRate) {
        let i = _.findIndex(farmPrinters, function(o) { return o._id == id; });
        farmPrinters[i].flowRate = newRate;
        let printer = await Printers.findById(id);
        printer.flowRate = farmPrinters[i].flowRate;
        printer.save();
    }
    static async feedRate(id, newRate) {
        let i = _.findIndex(farmPrinters, function(o) { return o._id == id; });
        farmPrinters[i].feedRate = newRate;
        let printer = await Printers.findById(id);
        printer.feedRate = farmPrinters[i].feedRate;
        printer.save();
    }
    static async updateSortIndex(list) {
        //Update the live information
        for (let i = 0; i < farmPrinters.length; i++) {
            let id = _.findIndex(farmPrinters, function(o) { return o._id == list[i]; });
            farmPrinters[id].sortIndex = i;
            let printer = await Printers.findById(list[i]);
            printer.sortIndex = i;
            printer.save();
        }
    }
    static stepRate(id, newRate) {
        let i = _.findIndex(farmPrinters, function(o) { return o._id == id; });
        farmPrinters[i].stepRate = newRate;
    }
    static async updateSettings(settings) {
        let printer = await Printers.findById(settings.printer.index);
        let index = _.findIndex(farmPrinters, function(o) { return o._id == settings.printer.index; });

        //Preferred Only update on live
        farmPrinters[index].options.baudratePreference = settings.connection.preferredBaud;
        farmPrinters[index].options.portPreference = settings.connection.preferredPort;
        farmPrinters[index].options.printerProfilePreference = settings.connection.preferredProfile;

        //Gocde update printer and Live
        farmPrinters[index].settingsScripts.gcode = settings.gcode;

        if(settings.other.coolDown != ""){
            farmPrinters[index].tempTriggers.coolDown = parseInt(settings.other.coolDown);
            printer.tempTriggers.coolDown = parseInt(settings.other.coolDown);
            printer.markModified("tempTriggers");
        }
        if(settings.other.heatingVariation != ""){
            farmPrinters[index].tempTriggers.heatingVariation = parseFloat(settings.other.heatingVariation);
            printer.tempTriggers.heatingVariation = parseFloat(settings.other.heatingVariation);
            printer.markModified("tempTriggers");
        }
        farmPrinters[index].costSettings = settings.costSettings;
        printer.costSettings = settings.costSettings;
        printer.markModified("costSettings")
        farmPrinters[index].settingsApperance.name = settings.profile.name;
        printer.settingsApperance.name = settings.profile.name;
        printer.markModified("settingsApperance")
        farmPrinters[index].powerSettings = settings.powerCommands;
        printer.powerSettings = settings.powerCommands;
        printer.markModified("powerSettings")

        printer.save();

        let opts = {
            scripts: {
                gcode: settings.gcode
            },
            server: {
                commands: {
                    systemShutdownCommand: settings.systemCommands.systemShutdown,
                    systemRestartCommand: settings.systemCommands.systemRestart,
                    serverRestartCommand: settings.systemCommands.serverRestart,
                }
            },
            webcam: {
                webcamEnabled: settings.other.enableCamera,
                timelapseEnabled: settings.other.enableTimeLapse,
                rotate90: settings.other.rotateCamera,
                flipH: settings.other.flipHCamera,
                flipV: settings.other.flipVCamera
            }
        }

        let profile = await fetch(farmPrinters[index].printerURL + "/api/printerprofiles/" + settings.profileID, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "X-Api-Key": farmPrinters[index].apikey
            },
            body: JSON.stringify({profile: settings.profile})
        });

        //Update octoprint profile...
        let sett = await fetch(farmPrinters[index].printerURL + "/api/settings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Api-Key": farmPrinters[index].apikey
            },
            body: JSON.stringify(opts)
        });
        await Runner.getProfile(settings.printer.index);
        await Runner.getSettings(settings.printer.index);

            // let i = _.findIndex(farmPrinters, function(o) { return o._id == id; });
            //
            // console.log()
            //
            // farmPrinters[i].settingsScripts.gcode = opts.scripts.gcode;
            // farmPrinters[i].settingsApperance.name = opts.appearance.name;
            // farmPrinters[i].settingsWebcam = opts.webcam;
            // farmPrinters[i].camURL = opts.camURL;
            // let printer = await Printers.findOne({ index: i });
            // printer.settingsWebcam = farmPrinters[i].settingsWebcam;
            // printer.camURL = farmPrinters[i].camURL;
            // printer.settingsApperance.name = farmPrinters[i].settingsApperance.name;
            // printer.save();
        return {status: {profile: profile.status, settings:sett.status}, printer: printer}
        }
    static moveFile(id, newPath, fullPath, filename) {
        let i = _.findIndex(farmPrinters, function(o) { return o._id == id; });
        let file = _.findIndex(farmPrinters[i].fileList.files, function(o) {
            return o.name === filename;
        });
        //farmPrinters[i].fileList.files[file].path = newPath;
        farmPrinters[i].fileList.files[file].path = newPath;
        farmPrinters[i].fileList.files[file].fullPath = fullPath;
        //console.log(farmPrinters[i].fileList.files)
    }
    static moveFolder(id, oldFolder, fullPath, folderName) {
        let i = _.findIndex(farmPrinters, function(o) { return o._id == id; });
        let file = _.findIndex(farmPrinters[i].fileList.folders, function(o) {
            return o.name === oldFolder;
        });
        farmPrinters[i].fileList.files.forEach((file, index) => {
            if (file.path === oldFolder) {
                let fileName = farmPrinters[i].fileList.files[index].fullPath.substring(
                    farmPrinters[i].fileList.files[index].fullPath.lastIndexOf("/") + 1
                );
                farmPrinters[i].fileList.files[index].fullPath =
                    folderName + "/" + fileName;
                farmPrinters[i].fileList.files[index].path = folderName;
            }
        });
        farmPrinters[i].fileList.folders[file].name = folderName;
        farmPrinters[i].fileList.folders[file].path = fullPath;
    }
    static deleteFolder(id, fullPath) {
        let i = _.findIndex(farmPrinters, function(o) { return o._id == id; });
        farmPrinters[i].fileList.files.forEach((file, index) => {
            if (file.path === fullPath) {
                farmPrinters[i].fileList.files.splice(index, 1);
            }
        });
        farmPrinters[i].fileList.folders.forEach((folder, index) => {
            if (folder.path === fullPath) {
                farmPrinters[i].fileList.folders.splice(index, 1);
            }
        });
        let folder = _.findIndex(farmPrinters[i].fileList.folders, function(o) {
            return o.name === fullPath;
        });
        farmPrinters[i].fileList.folders.splice(folder, 1);
        farmPrinters[i].fileList.fileCount = farmPrinters[i].fileList.files.length;
        farmPrinters[i].fileList.folderCount =
            farmPrinters[i].fileList.folders.length;
    }
    static newFolder(folder) {
        let index = folder.i;
        let i = _.findIndex(farmPrinters, function(o) { return o._id == index; });
        let path = "local";
        let name = folder.foldername;
        if (folder.path !== "") {
            path = folder.path;
            name = path + "/" + name;
        }
        name = name.replace(/ /g, "_");
        let newFolder = {
            name: name,
            path: path
        };

        farmPrinters[i].fileList.folders.push(newFolder);
        farmPrinters[i].fileList.folderCount =
            farmPrinters[i].fileList.folders.length;
    }
    static getSelected(){
        return selectedFilament;
    }
    static async updateFilament(){
        for(let i = 0; i < farmPrinters.length; i++){
            if(farmPrinters[i].selectedFilament != null){
                let newInfo = await Filament.findById(farmPrinters[i].selectedFilament._id)
                let printer = await Printers.findById(farmPrinters[i]._id)
                farmPrinters[i].selectedFilament = newInfo;
                printer.selectedFilament = newInfo;
                printer.save();
            }
        }
    }
    static async selectedFilament(printerId, filamentId) {
        if (printerId == 0) {
            //Deselecting a spool
            //Find the printer spool is attached too
            let i = _.findIndex(farmPrinters, function(o) {
                    if(o.selectedFilament !== null && o.selectedFilament._id == filamentId){
                        return o.selectedFilament._id;
                    }
            });
            if(i > -1){
                let printer = await Printers.findById(farmPrinters[i]._id);
                printer.selectedFilament = null;
                farmPrinters[i].selectedFilament = null;
                printer.save();
                //remove from selected filament list
                let selectedFilamentId = _.findIndex(selectedFilament, function(o) {
                    return o == filamentId;
                });
                if(selectedFilamentId > -1){
                    selectedFilament.splice(selectedFilamentId, 1)
                }
            }
        } else {
            //Selecting a spool
            let printer = await Printers.findById(printerId);
            let i = _.findIndex(farmPrinters, function(o) { return o._id == printerId; });

            if(farmPrinters[i].selectedFilament != null){
                if(filamentId == 0){
                    let selectedFilamentId = _.findIndex(selectedFilament, function(o) {
                        return o._id == farmPrinters[i].selectedFilament._id;
                    });
                    if(selectedFilamentId > -1){
                        selectedFilament.splice(selectedFilamentId, 1)
                    }
                    printer.selectedFilament = null;
                    farmPrinters[i].selectedFilament = null;
                }else{
                    //farm printer already has filament, remove before updating...
                    let selectedFilamentId = _.findIndex(selectedFilament, function(o) {
                        return o._id == farmPrinters[i].selectedFilament._id;
                    });
                    if(selectedFilamentId > -1){
                        selectedFilament.splice(selectedFilamentId, 1)
                    }
                    let spool = await Filament.findById(filamentId);
                    printer.selectedFilament = spool;
                    farmPrinters[i].selectedFilament = spool;
                    selectedFilament.push(spool._id);
                }

            }else{
                let spool = await Filament.findById(filamentId);
                printer.selectedFilament = spool;
                farmPrinters[i].selectedFilament = spool;
                selectedFilament.push(spool._id);
            }
            printer.markModified("selectedFilament")
            printer.save();
        }
    }
    static newFile(file) {
        let i = _.findIndex(farmPrinters, function(o) { return o._id == file.index; });
        let date = file.date;
        file = file.files.local;

        let path = "";
        if (file.path.indexOf("/") > -1) {
            path = file.path.substr(0, file.path.lastIndexOf("/"));
        } else {
            path = "local";
        }
        let fileDisplay = file.name.replace(/_/g, ' ');
        let data = {
            path: path,
            fullPath: file.path,
            display: fileDisplay,
            length: null,
            name: file.name,
            size: null,
            time: null,
            date: date
        };
        farmPrinters[i].fileList.files.push(data);
    }
    static sortedIndex() {
        let sorted = [];
        for (let p = 0; p < farmPrinters.length; p++) {
            let sort = {
                sortIndex: farmPrinters[p].sortIndex,
                actualIndex: p
            }
            sorted.push(sort);
        }
        sorted.sort((a, b) => (a.sortIndex > b.sortIndex ? 1 : -1));
        return sorted;
    }
}

module.exports = {
    Runner: Runner
};