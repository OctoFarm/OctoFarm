const Profiles = require('../models/Profiles.js');
const historyCollection = require('./history.js');

const { HistoryCollection } = historyCollection;
const serverSettings = require('../settings/serverSettings.js');

const { ServerSettings } = serverSettings;
const fetch = require('node-fetch');
const _ = require('lodash');
const WebSocket = require('ws');
const Printers = require('../models/Printer.js');
const Filament = require('../models/Filament.js');
const Logger = require('../lib/logger.js');

const logger = new Logger('OctoFarm-State');
const script = require('./scriptCheck.js');

const { ScriptRunner } = script;
const EventEmitter = require('events');
const printerClean = require('../lib/dataFunctions/printerClean.js');

const { PrinterClean } = printerClean;
const jobClean = require('../lib/dataFunctions/jobClean.js');

const { JobClean } = jobClean;
const fileClean = require('../lib/dataFunctions/fileClean.js');

const { FileClean } = fileClean;

const filamentClean = require('../lib/dataFunctions/filamentClean.js');

const { FilamentClean } = filamentClean;

let farmPrinters = [];

let systemSettings = {};

const countersInterval = false;
let timeout = null;

if (countersInterval === false) {
    setInterval(async () => {
        Runner.trackCounters();
    }, 30000);
}

function WebSocketClient () {
    this.number = 0; // Message number
    this.autoReconnectInterval = timeout.webSocketRetry; // ms
}

function noop () {}

function heartBeat (index) {
    if (farmPrinters[index].state === 'Disconnected') {
        farmPrinters[index].webSocket = 'warning';
        farmPrinters[index].webSocketDescription =
      'Websocket Connected but in Tentative state until receiving data';
    } else {
        farmPrinters[index].webSocket = 'success';
        farmPrinters[index].webSocketDescription = 'Websocket Connection Online';
    }

    farmPrinters[index].ws.isAlive = true;
}

const heartBeatInterval = setInterval(function ping () {
    farmPrinters.forEach(function each (client) {
        if (
            typeof client.ws !== 'undefined' &&
      typeof client.ws.isAlive !== 'undefined'
        ) {
            if (
                client.ws.instance.readyState !== 0 &&
        client.ws.instance.readyState !== 2 &&
        client.ws.instance.readyState !== 3
            ) {
                if(farmPrinters[client.ws.index].stateColour.category === "Active" || farmPrinters[client.ws.index].stateColour.category === "Idle"){
                    if (client.ws.isAlive === false) return client.ws.instance.terminate();

                    // Retry connecting if failed...
                    farmPrinters[client.ws.index].webSocket = 'info';
                    farmPrinters[client.ws.index].webSocketDescription =
                        'Checking if Websocket is still alive';
                    client.ws.isAlive = false;
                    client.ws.instance.ping(noop);
                };
            }
        }
    });
}, 30000);

WebSocketClient.prototype.open = function (url, index) {
    if (url.includes('http://')) {
        url = url.replace('http://', '');
    }
    if (url.includes('https://')) {
        url = url.replace('https://', '');
    }
    this.url = url;
    this.index = index;
    farmPrinters[this.index].webSocket = 'warning';
    farmPrinters[this.index].webSocketDescription =
    'Websocket Connected but in Tentative state until receiving data';
    this.instance = new WebSocket(this.url);
    this.instance.on('open', () => {
        this.isAlive = true;
        this.onopen(this.index);
    });
    this.instance.on('pong', () => {
        heartBeat(this.index);
    });
    this.instance.on('message', (data, flags) => {
        this.number++;
        this.onmessage(data, flags, this.number, this.index);
    });
    this.instance.on('close', (e) => {
        switch (e) {
        case 1000: // CLOSE_NORMAL
            logger.info(`WebSocket: closed: ${this.index}: ${this.url}`);
            try {
                farmPrinters[this.index].state = 'Offline';
                farmPrinters[this.index].stateColour = Runner.getColour('Offline');
                farmPrinters[this.index].hostState = 'Shutdown';
                farmPrinters[this.index].hostStateColour = Runner.getColour(
                    'Shutdown'
                );
                farmPrinters[this.index].webSocket = 'danger';
                farmPrinters[this.index].stateDescription = 'OctoPrint is Offline';
                farmPrinters[this.index].hostDescription = 'Host is Shutdown';
                farmPrinters[this.index].webSocketDescription =
            'Websocket Closed by OctoFarm';
                this.instance.removeAllListeners();
            } catch (e) {
                logger.info(
                    `Couldn't set state of missing printer, safe to ignore: ${this.index}: ${this.url}`
                );
            }
            break;
        case 1005: // CLOSE_NORMAL
            logger.info(`WebSocket: closed: ${this.index}: ${this.url}`);
            try {
                farmPrinters[this.index].state = 'Offline';
                farmPrinters[this.index].stateColour = Runner.getColour('Offline');
                farmPrinters[this.index].hostState = 'Shutdown';
                farmPrinters[this.index].hostStateColour = Runner.getColour(
                    'Shutdown'
                );
                farmPrinters[this.index].webSocket = 'danger';
                farmPrinters[this.index].stateDescription = 'OctoPrint is Offline';
                farmPrinters[this.index].hostDescription = 'Host is Shutdown';
                farmPrinters[this.index].webSocketDescription =
            'Websocket Closed by OctoFarm';
                this.instance.removeAllListeners();
            } catch (e) {
                logger.info(
                    `Couldn't set state of missing printer, safe to ignore: ${this.index}: ${this.url}`
                );
            }
            break;
        case 1006: // TERMINATE();
            try {
                farmPrinters[this.index].state = 'Offline';
                farmPrinters[this.index].stateColour = Runner.getColour('Offline');
                farmPrinters[this.index].hostState = 'Shutdown';
                farmPrinters[this.index].hostStateColour = Runner.getColour(
                    'Shutdown'
                );
                farmPrinters[this.index].webSocket = 'danger';
                farmPrinters[this.index].stateDescription = 'OctoPrint is Offline';
                farmPrinters[this.index].hostDescription = 'Host is Shutdown';
                farmPrinters[this.index].webSocketDescription =
            'Websocket Terminated by OctoFarm, Ping/Pong check fails';
                this.instance.removeAllListeners();
            } catch (e) {
                logger.info(
                    `Ping/Pong failed to get a response, closing and attempted to reconnect: ${this.index}: ${this.url}`
                );
            }
            this.reconnect(e);
            break;
        default:
        // Abnormal closure
            break;
        }
        this.onclose(e);
        return 'closed';
    });
    this.instance.on('error', (e) => {
        switch (e.code) {
        case 'ECONNREFUSED':
            logger.error(e, `${this.index}: ${this.url}`);
            try {
                farmPrinters[this.index].state = 'Offline';
                farmPrinters[this.index].stateColour = Runner.getColour('Offline');
                farmPrinters[this.index].hostState = 'Online';
                farmPrinters[this.index].hostStateColour = Runner.getColour('Online');
                farmPrinters[this.index].webSocket = 'danger';
                farmPrinters[this.index].stateDescription = 'OctoPrint is Offline';
                farmPrinters[this.index].hostDescription = 'Host is Shutdown';
                farmPrinters[this.index].webSocketDescription =
            'Websocket Connection was refused by host';
            } catch (e) {
                logger.info(
                    `Couldn't set state of missing printer, safe to ignore: ${this.index}: ${this.url}`
                );
            }
            this.reconnect(e);
            break;
        case 'ECONNRESET':
            logger.error(e, `${this.index}: ${this.url}`);
            try {
                farmPrinters[this.index].state = 'Offline';
                farmPrinters[this.index].stateColour = Runner.getColour('Offline');
                farmPrinters[this.index].hostState = 'Shutdown';
                farmPrinters[this.index].hostStateColour = Runner.getColour(
                    'Shutdown'
                );
                farmPrinters[this.index].webSocket = 'danger';
                farmPrinters[this.index].stateDescription = 'OctoPrint is Offline';
                farmPrinters[this.index].hostDescription = 'Host is Offline';
                farmPrinters[this.index].webSocketDescription =
            'Websocket Connection was reset by host';
            } catch (e) {
                logger.info(
                    `Couldn't set state of missing printer, safe to ignore: ${this.index}: ${this.url}`
                );
            }
            this.reconnect(e);
            break;
        case 'EHOSTUNREACH':
            logger.error(e, `${this.index}: ${this.url}`);
            try {
                farmPrinters[this.index].state = 'Offline';
                farmPrinters[this.index].stateColour = Runner.getColour('Offline');
                farmPrinters[this.index].hostState = 'Shutdown';
                farmPrinters[this.index].hostStateColour = Runner.getColour(
                    'Shutdown'
                );
                farmPrinters[this.index].webSocket = 'danger';
                farmPrinters[this.index].stateDescription = 'OctoPrint is Offline';
                farmPrinters[this.index].hostDescription = 'Host is Shutdown';
                farmPrinters[this.index].webSocketDescription =
            'Host is unreachable cannot establish connection';
            } catch (e) {
                logger.info(
                    `Couldn't set state of missing printer, safe to ignore: ${this.index}: ${this.url}`
                );
            }
            this.reconnect(e);
            break;
        default:
            logger.error(e, `${this.index}: ${this.url}`);
            try {
                farmPrinters[this.index].state = 'Re-Sync';
                farmPrinters[this.index].stateColour = Runner.getColour('Offline');
                farmPrinters[this.index].hostState = 'Offline';
                farmPrinters[this.index].hostStateColour = Runner.getColour(
                    'Offline'
                );
                farmPrinters[this.index].webSocket = 'danger';
                farmPrinters[this.index].stateDescription =
            'Hard Failure, please Re-Sync when Online';
                farmPrinters[this.index].hostDescription =
            'Hard Failure, please Re-Sync when Online';
                farmPrinters[this.index].webSocketDescription =
            'Hard Failure, please Re-Sync when Online';
                this.instance.removeAllListeners();
            } catch (e) {
                logger.info(
                    `Couldn't set state of missing printer, safe to ignore: ${this.index}: ${this.url}`
                );
            }
            logger.error(`WebSocket hard failure: ${this.index}: ${this.url}`);
            this.onerror(e);
            break;
        }
    });
    return true;
};
WebSocketClient.prototype.throttle = function (data) {
    try {
        logger.info(
            `Throttling your websocket connection: ${this.index}: ${this.url} `,
            data
        );
        this.instance.send(JSON.stringify(data));
    } catch (e) {
        logger.error(`Failed to Throttle websocket: ${this.index}: ${this.url}`);
        this.instance.emit('error', e);
    }
};
WebSocketClient.prototype.send = function (data, option) {
    try {
        this.instance.send(data, option).then(res => console.log(res));
    } catch (e) {
        this.instance.emit('error', e);
    }
};
WebSocketClient.prototype.reconnect = async function (e) {
    logger.info(
        `WebSocketClient: retry in ${this.autoReconnectInterval}ms`,
        `${e + this.index}: ${this.url}`
    );
    this.instance.removeAllListeners();
    const that = this;
    setTimeout(function () {
        farmPrinters[that.index].hostStateColour = Runner.getColour('Searching...');
        farmPrinters[that.index].hostDescription = 'Searching for Host';
        logger.info(`Re-Opening Websocket: ${that.index}: ${that.url}`);
        that.open(that.url, that.index);
    }, this.autoReconnectInterval);
    return true;
};
WebSocketClient.prototype.onopen = async function (e) {
    // eslint-disable-next-line prefer-rest-params
    logger.info('WebSocketClient: open', arguments, `${this.index}: ${this.url}`);
    const Polling = systemSettings.onlinePolling;
    const data = {};
    const throt = {};
    data.auth = `${farmPrinters[this.index].currentUser}:${
        farmPrinters[this.index].sessionKey
    }`;
    throt.throttle = parseInt((Polling.seconds * 1000) / 500);
    // Send User Auth
    logger.info(`Sending Auth to Websocket: ${this.index}: ${this.url} `, data);
    this.instance.send(JSON.stringify(data));
    this.instance.send(JSON.stringify(throt));
};
WebSocketClient.prototype.onmessage = async function (data, flags, number) {
    try {
    // console.log("WebSocketClient: message",arguments);
    // Listen for print jobs
        farmPrinters[this.index].hostState = 'Online';
        farmPrinters[this.index].hostStateColour = Runner.getColour('Online');
        farmPrinters[this.index].hostDescription = 'Host is Online';
        data = await JSON.parse(data);
        if (typeof data.connected !== 'undefined') {
            farmPrinters[this.index].octoPrintVersion = data.connected.version;
            farmPrinters[this.index].plugin_hash = data.connected.plugin_hash;
            farmPrinters[this.index].config_hash = data.connected.config_hash;

            if(data.connected.version.includes("1.4.2")||data.connected.version.includes("1.4.1")){
                farmPrinters[this.index].webSocket = 'danger';
                farmPrinters[this.index].webSocketDescription =
                    'OctoPrint Version 1.4.1+ requires the use of an Application/User API key to connect, please update your instance with that';
            }


        }
        if(data.history){
            farmPrinters[this.index].webSocket = 'warning';
            farmPrinters[this.index].webSocketDescription =
                'Websocket Connected but in Tentative state until receiving data';
            farmPrinters[this.index].state = "Disconnected";
            farmPrinters[this.index].stateColour = Runner.getColour("Disconnected");
        }
        // Listen for printer status
        if (typeof data.current !== 'undefined') {

            farmPrinters[this.index].webSocket = 'success';
            farmPrinters[this.index].webSocketDescription =
        'Websocket Alive and Receiving Data';
            if (data.current.state.text === 'Offline') {
                data.current.state.text = 'Disconnected';
                farmPrinters[this.index].stateDescription =
          'Your printer is disconnected';
            } else if (data.current.state.text.includes('Error:')) {
                farmPrinters[this.index].stateDescription = data.current.state.text;
                data.current.state.text = 'Error!';
            } else if (data.current.state.text === 'Closed') {
                res.current.state.text = 'Disconnected';
                farmPrinters[this.index].stateDescription =
          'Your printer is disconnected';
            } else {
                farmPrinters[this.index].stateDescription =
          'Current Status from OctoPrint';
            }
            farmPrinters[this.index].state = data.current.state.text;
            farmPrinters[this.index].stateColour = Runner.getColour(
                data.current.state.text
            );

            if (typeof data.current.progress !== 'undefined') {
                farmPrinters[this.index].progress = data.current.progress;
            }
            if (
                typeof data.current.currentZ !== 'undefined' &&
        data.currentZ !== null
            ) {
                farmPrinters[this.index].currentZ = data.current.currentZ;
            }
            if (
                typeof data.current.job !== 'undefined' &&
        data.current.job.user !== null
            ) {
                farmPrinters[this.index].job = data.current.job;
                const currentFileIndex = _.findIndex(
                    farmPrinters[this.index].fileList.files,
                    function (o) {
                        return o.name == data.current.job.file.name;
                    }
                );
                if (currentFileIndex > -1) {
                    if (
                        typeof farmPrinters[this.index].fileList.files[currentFileIndex] !==
              'undefined' &&
            farmPrinters[this.index].fileList.files[currentFileIndex]
                .thumbnail != null
                    ) {
                        farmPrinters[this.index].job.file.thumbnail =
              farmPrinters[this.index].fileList.files[
                  currentFileIndex
              ].thumbnail;
                    }
                    if (
                        typeof farmPrinters[this.index].fileList.files[currentFileIndex] !==
            'undefined'
                    ) {
                        farmPrinters[this.index].job.file.length =
              farmPrinters[this.index].fileList.files[currentFileIndex].length;
                    }
                }
                const currentFilament = JSON.parse(
                    JSON.stringify(farmPrinters[this.index].selectedFilament)
                );
                for (
                    let s = 0;
                    s < farmPrinters[this.index].selectedFilament.length;
                    s++
                ) {
                    if (farmPrinters[this.index].selectedFilament[s] !== null) {
                        let profile = null;
                        if (systemSettings.filamentManager) {
                            profile = await Profiles.findOne({
                                'profile.index':
                  parseInt(farmPrinters[this.index].selectedFilament[s].spools.profile)
                            });
                        } else {
                            profile = await Profiles.findById(
                                farmPrinters[this.index].selectedFilament[s].spools.profile
                            );
                        }
                        currentFilament[s].spools.profile = profile.profile;
                    }
                }
                JobClean.generate(farmPrinters[this.index], currentFilament);
            }

            if (typeof data.current.logs !== undefined) {
                farmPrinters[this.index].logs = data.current.logs;
            }
            if (
                typeof data.current.temps !== 'undefined' &&
        data.current.temps.length !== 0
            ) {
                if (typeof data.current.temps[0].tool0 !== 'undefined') {
                    farmPrinters[this.index].temps = data.current.temps;
                }
            }
            if (
                data.current.progress.completion != null &&
        data.current.progress.completion === 100
            ) {
                farmPrinters[this.index].stateColour = Runner.getColour('Complete');
                farmPrinters[this.index].stateDescription =
          'Your current print is Completed!';
            } else {
                farmPrinters[this.index].stateColour = Runner.getColour(
                    data.current.state.text
                );
            }
        }
        if (typeof data.event !== 'undefined') {
            if (data.event.type === 'PrintPaused') {
                const that = this;
                ScriptRunner.check(farmPrinters[that.index], 'paused');
            }
            if (data.event.type === 'PrintFailed') {
                const that = this;
                setTimeout(async function () {
                    logger.info(`${data.event.type + that.index}: ${that.url}`);
                    let sendPrinter = {};
                    sendPrinter = JSON.parse(JSON.stringify(farmPrinters[that.index]));
                    let job = {};
                    job = JSON.parse(JSON.stringify(farmPrinters[that.index].job));
                    let files = {};
                    files = JSON.parse(
                        JSON.stringify(farmPrinters[that.index].fileList.files)
                    );
                    // Register cancelled print...
                    await HistoryCollection.failed(
                        data.event.payload,
                        sendPrinter,
                        job,
                        files
                    );
                    await Runner.updateFilament();
                    setTimeout(async function() {
                        await Runner.reSyncFile(farmPrinters[that.index]._id, farmPrinters[that.index].job.file.path);
                    }, 5000);

                }, 10000);
                ScriptRunner.check(farmPrinters[that.index], 'failed');
            }
            if (data.event.type === 'PrintDone') {
                const that = this;
                setTimeout(async function () {
                    logger.info(`${data.event.type + that.index}: ${that.url}`);
                    let sendPrinter = {};
                    sendPrinter = JSON.parse(JSON.stringify(farmPrinters[that.index]));
                    let job = {};
                    job = JSON.parse(JSON.stringify(farmPrinters[that.index].job));
                    let files = {};
                    files = JSON.parse(
                        JSON.stringify(farmPrinters[that.index].fileList.files)
                    );
                    // Register cancelled print...
                    await HistoryCollection.complete(
                        data.event.payload,
                        sendPrinter,
                        job,
                        files
                    );
                    await Runner.updateFilament();
                    setTimeout(async function() {
                        await Runner.reSyncFile(farmPrinters[that.index]._id, farmPrinters[that.index].job.file.path);
                    }, 500);
                }, 10000);
                ScriptRunner.check(farmPrinters[that.index], 'done');
            }
            if (data.event.type === 'Error') {
                const that = this;
                setTimeout(async function () {
                    logger.info(`${data.event.type + that.index}: ${that.url}`);
                    let sendPrinter = {};
                    sendPrinter = JSON.parse(JSON.stringify(farmPrinters[that.index]));
                    let job = {};
                    let files = {};
                    files = JSON.parse(
                        JSON.stringify(farmPrinters[that.index].fileList.files)
                    );
                    if (farmPrinters[that.index].job) {
                        job = JSON.parse(JSON.stringify(farmPrinters[that.index].job));
                    }
                    // Register cancelled print...
                    await HistoryCollection.errorLog(
                        data.event.payload,
                        sendPrinter,
                        job,
                        files
                    );
                    await Runner.updateFilament();
                    setTimeout(async function() {
                        await Runner.reSyncFile(farmPrinters[that.index]._id, job.file.path);
                    }, 500);
                }, 10000);
                ScriptRunner.check(farmPrinters[that.index], 'error');
            }
        }
        if(data.plugin){
            console.log(data.plugin);
            if(data.plugin.plugin === "klipper"){
                console.log(data.plugin.data.payload);
                if(data.plugin.data.payload.includes("Firmware version:")){
                    farmPrinters[this.index].klipperFirmwareVersion = data.plugin.data.payload.replace("Firmware version: ", "");
                }
            }
        }
        // Event Listeners for state changes
        if (typeof farmPrinters[this.index].temps !== 'undefined') {
            // When object changes to active, add event listener awaiting cool down.
            if (farmPrinters[this.index].stateColour.category === 'Active') {
                // Check for existing events object...
                if (typeof farmPrinters[this.index].events === 'undefined') {
                    farmPrinters[this.index].events = new EventEmitter();
                }
                if (
                    typeof farmPrinters[this.index].events._events.cooldown ===
          'undefined'
                ) {
                    const that = this;
                    farmPrinters[this.index].events.once('cooldown', (stream) => {
                        ScriptRunner.check(farmPrinters[that.index], 'cooldown');
                    });
                }
            }
            if (farmPrinters[this.index].stateColour.category === 'Complete') {
                if (typeof farmPrinters[this.index].events !== 'undefined') {
                    if (typeof farmPrinters[this.index].temps !== 'undefined') {
                        if (
                            parseFloat(farmPrinters[this.index].temps[0].tool0.actual) <
                parseFloat(farmPrinters[this.index].tempTriggers.coolDown) &&
              parseFloat(farmPrinters[this.index].temps[0].bed.actual) <
                parseFloat(farmPrinters[this.index].tempTriggers.coolDown)
                        ) {
                            farmPrinters[this.index].events.emit('cooldown');
                        }
                    }
                }
            }
        }
        // Information cleaning of farmPrinters
        if (typeof farmPrinters[this.index] !== 'undefined') {
            PrinterClean.generate(
                farmPrinters[this.index],
                serverSettings.filamentManager
            );
        }
    } catch (e) {
        console.log(e);
    }
};
WebSocketClient.prototype.onerror = function (e) {

    logger.error(
        'WebSocketClient: Error',
        // eslint-disable-next-line prefer-rest-params
        arguments,
        `${+this.index}: ${this.url} - ${e}`
    );
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;
    this.instance.removeAllListeners();
    if (typeof farmPrinters[this.index] !== 'undefined') {
        PrinterClean.generate(
            farmPrinters[this.index],
            systemSettings.filamentManager
        );
    }
};
WebSocketClient.prototype.onclose = function (e) {
    logger.info(
        'WebSocketClient: Closed',
        // eslint-disable-next-line prefer-rest-params
        arguments,
        `${this.index}: ${this.url} - ${e}`
    );
    this.instance.removeAllListeners();
    if (typeof farmPrinters[this.index] !== 'undefined') {
        PrinterClean.generate(
            farmPrinters[this.index],
            systemSettings.filamentManager
        );
    }
};

class ClientAPI {
    static async getRetry (printerURL, apikey, item) {
        try {
            logger.info(
                `Attempting to connect to API: ${item} | ${printerURL} | timeout: ${timeout.apiTimeout}`
            );
            const apiConnect = await ClientAPI.get(printerURL, apikey, item);
            return apiConnect;
        } catch (err) {
            logger.error(err);
            // If timeout exceeds max cut off then give up... Printer is considered offline.
            if (timeout.apiTimeout >= timeout.apiRetryCutoff) {
                logger.info(`Timeout Exceeded: ${item} | ${printerURL}`);
                // Reset timeout for next printer...
                timeout.apiTimeout = Number(timeout.apiTimeout) - 9000;
                throw err;
            }
            timeout.apiTimeout += 9000;
            logger.info(
                `Attempting to re-connect to API: ${item} | ${printerURL} | timeout: ${timeout.apiTimeout}`
            );
            return await ClientAPI.getRetry(printerURL, apikey, item);
        }
    }

    static files (printerURL, apikey, item) {
        const url = `${printerURL}/api/${item}`;
        fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': apikey
            }
        });
    }
    static post (printerURL, apikey, item, data) {
        const url = `${printerURL}/api/${item}`;
        return Promise.race([
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': apikey
                },
                body: JSON.stringify(data)
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), timeout.apiTimeout)
            )
        ]);
    }
    static get (printerURL, apikey, item) {
        const url = `${printerURL}/api/${item}`;
        return Promise.race([
            fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': apikey
                }
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), timeout.apiTimeout)
            )
        ]);
    }
}

class Runner {
    static async init () {
        farmPrinters = [];
        const server = await ServerSettings.check();
        systemSettings = server[0];
        timeout = systemSettings.timeout;
        // Grab printers from database....
        try {
            farmPrinters = await Printers.find({}, null, {
                sort: { sortIndex: 1 }
            });
            logger.info(`Grabbed ${farmPrinters.length} for checking`);

            for (let i = 0; i < farmPrinters.length; i++) {
                // Make sure runners are created ready for each printer to pass between...
                await Runner.setDefaults(farmPrinters[i]._id);
            }
        } catch (err) {
            const error = {
                err: err.message,
                action: 'Database connection failed... No action taken',
                userAction:
          "Please make sure the database URL is inputted and can be reached... 'file located at: config/db.js'"
            };
            logger.error(err);
            console.log(err);
        }

        // cycle through printers and move them to correct checking location...
        setTimeout(async function () {
            for (let i = 0; i < farmPrinters.length; i++) {
                // Make sure runners are created ready for each printer to pass between...
                await Runner.setupWebSocket(farmPrinters[i]._id);
                await PrinterClean.generate(farmPrinters[i]);
            }
            FilamentClean.start(systemSettings.filamentManager);
        }, 5000);
        return `System Runner has checked over ${farmPrinters.length} printers...`;
    }

    static async setupWebSocket (id, skipAPICheck) {
        const i = _.findIndex(farmPrinters, function (o) {
            return o._id == id;
        });
        farmPrinters[i].systemChecks.scanning.api.status = 'warning';
        try {
            if (i === -1) {
                const error = {
                    message: 'Could not find printer...:',
                    type: 'system',
                    errno: 'DELETED',
                    code: 'DELETED'
                };
                throw error;
            }
            const ws = new WebSocketClient();
            farmPrinters[i].state = 'Searching...';
            farmPrinters[i].stateColour = Runner.getColour('Searching...');
            farmPrinters[i].hostState = 'Searching...';
            farmPrinters[i].hostStateColour = Runner.getColour('Searching...');
            farmPrinters[i].webSocket = 'danger';
            farmPrinters[i].stateDescription = 'Attempting to connect to OctoPrint';
            farmPrinters[i].hostDescription = 'Attempting to connect to OctoPrint';
            farmPrinters[i].webSocketDescription = 'Websocket Offline';
            farmPrinters[i].ws = ws;
            // Make a connection attempt, and grab current user.
            let users = null;
            users = await ClientAPI.getRetry(
                farmPrinters[i].printerURL,
                farmPrinters[i].apikey,
                'users',
            );
            if (users.status === 200) {
                farmPrinters[i].systemChecks.scanning.api.status = 'success';
                farmPrinters[i].systemChecks.scanning.api.date = new Date();
                users = await users.json();
                logger.info("users: ", users);
                if (_.isEmpty(users)) {
                    farmPrinters[i].currentUser = 'admin';
                    farmPrinters[i].markModified('currentUser');
                    farmPrinters[i].updateOne();
                } else {
                    users.users.forEach((user) => {
                        if (user.admin) {
                            farmPrinters[i].currentUser = user.name;
                            farmPrinters[i].markModified('currentUser');
                            farmPrinters[i].updateOne();
                        }
                    });
                }
                logger.info("Chosen user:", farmPrinters[i].currentUser);
                const sessionKey = await ClientAPI.post(
                    farmPrinters[i].printerURL,
                    farmPrinters[i].apikey,
                    'login',
                    {passive: true}
                );
                logger.info("Session Response", sessionKey);
                if(sessionKey.status === 200){
                    const sessionJson = await sessionKey.json();
                    logger.info("sessionKey JSON:", sessionJson);
                    farmPrinters[i].sessionKey = sessionJson.session;
                    // Update info via API
                    farmPrinters[i].hostState = 'Online';
                    farmPrinters[i].hostStateColour = Runner.getColour('Online');
                    farmPrinters[i].hostDescription = 'Host is Online';
                    await Runner.getSystem(id);
                    await Runner.getSettings(id);
                    await Runner.getProfile(id);
                    await Runner.getState(id);
                    if(typeof farmPrinters[i].fileList === 'undefined'){
                        await Runner.getFiles(id, 'files?recursive=true');
                    }else{
                        const currentFilament = await Runner.compileSelectedFilament(
                            farmPrinters[i].selectedFilament,
                            i
                        );
                        FileClean.generate(farmPrinters[i], currentFilament);
                        farmPrinters[i].systemChecks.scanning.files.status = 'success';
                        farmPrinters[i].systemChecks.scanning.files.date = new Date();
                        FileClean.statistics(farmPrinters);
                    }


                    // Connection to API successful, gather initial data and setup websocket.
                    await farmPrinters[i].ws.open(
                        `ws://${farmPrinters[i].printerURL}/sockjs/websocket`,
                        i
                    );
                }else{
                    const error = {
                        message: `Could not Establish connection to OctoPrint Returned: ${users.status}: ${farmPrinters[i].printerURL}`,
                        type: 'system',
                        errno: '503',
                        code: '503'
                    };
                    throw error;
                }
            } else if (users.status === 503 || users.status === 404) {
                const error = {
                    message: `Could not Establish connection to OctoPrint Returned: ${users.status}: ${farmPrinters[i].printerURL}`,
                    type: 'system',
                    errno: '503',
                    code: '503'
                };
                throw error;
            } else {
                const error = {
                    message: `Could not Establish API Connection: ${users.status}${farmPrinters[i].printerURL}`,
                    type: 'system',
                    errno: 'NO-API',
                    code: 'NO-API'
                };
                throw error;
            }
        } catch (e) {
            switch (e.code) {
            case 'NO-API':
                try {
                    logger.error(
                        e.message,
                        `Couldn't grab initial connection for Printer: ${farmPrinters[i].printerURL}`
                    );
                    farmPrinters[i].state = 'No-API';
                    farmPrinters[i].stateColour = Runner.getColour('No-API');
                    farmPrinters[i].hostState = 'Online';
                    farmPrinters[i].hostStateColour = Runner.getColour('Online');
                    farmPrinters[i].webSocket = 'danger';
                    farmPrinters[i].stateDescription =
              'Could not connect to OctoPrints API please correct and manually refresh your printer';
                    farmPrinters[i].hostDescription = 'Host is Online';
                    farmPrinters[i].webSocketDescription = 'Websocket Offline';
                } catch (e) {
                    logger.error(
                        `Couldn't set state of missing printer, safe to ignore: ${farmPrinters[i].index}: ${farmPrinters[i].printerURL}`
                    );
                }
                break;
            case 'ECONNREFUSED':
                try {
                    logger.error(
                        e.message,
                        `Couldn't grab initial connection for Printer: ${farmPrinters[i].printerURL}`
                    );
                    farmPrinters[i].state = 'Offline';
                    farmPrinters[i].stateColour = Runner.getColour('Offline');
                    farmPrinters[i].hostState = 'Online';
                    farmPrinters[i].hostStateColour = Runner.getColour('Online');
                    farmPrinters[i].webSocket = 'danger';
                    farmPrinters[i].stateDescription = 'OctoPrint is Offline';
                    farmPrinters[i].hostDescription = 'Host is Online';
                    farmPrinters[i].webSocketDescription = 'Websocket Offline';
                } catch (e) {
                    logger.error(
                        `Couldn't set state of missing printer, safe to ignore: ${farmPrinters[i].index}: ${farmPrinters[i].printerURL}`
                    );
                }
                timeout = systemSettings.timeout;
                setTimeout(function () {
                    Runner.setupWebSocket(id);
                }, timeout.apiRetry);
                break;
            case 'DELETED':
                logger.error(e.message, 'Printer Deleted... Do not retry to connect');
                break;
            default:
                try {
                    logger.error(
                        e.message,
                        `Couldn't grab initial connection for Printer: ${farmPrinters[i].printerURL}`
                    );
                    farmPrinters[i].state = 'Offline';
                    farmPrinters[i].stateColour = Runner.getColour('Offline');
                    farmPrinters[i].hostState = 'Shutdown';
                    farmPrinters[i].hostStateColour = Runner.getColour('Shutdown');
                    farmPrinters[i].webSocket = 'danger';
                    farmPrinters[i].stateDescription = 'OctoPrint is Offline';
                    farmPrinters[i].hostDescription = 'Host is Shutdown';
                    farmPrinters[i].webSocketDescription = 'Websocket Offline';
                } catch (e) {
                    logger.error(
                        `Couldn't set state of missing printer, safe to ignore: ${farmPrinters[i].index}: ${farmPrinters[i].printerURL}`
                    );
                }
                if (typeof farmPrinters[this.index] !== 'undefined') {
                    PrinterClean.generate(
                        farmPrinters[this.index],
                        systemSettings.filamentManager
                    );
                }
                timeout = systemSettings.timeout;
                setTimeout(function () {
                    Runner.setupWebSocket(id);
                }, timeout.apiRetry);
                break;
            }
        }
        if (typeof farmPrinters[i] !== 'undefined') {
            PrinterClean.generate(farmPrinters[i]);
        }

        return true;
    }

    static async setDefaults (id) {
        const i = _.findIndex(farmPrinters, function (o) {
            return o._id == id;
        });
        const printer = await Printers.findById(id);
        logger.info(`Setting up defaults for Printer: ${printer.printerURL}`);
        farmPrinters[i].state = 'Setting Up';
        farmPrinters[i].stateColour = Runner.getColour('Offline');
        farmPrinters[i].hostState = 'Setting Up';
        farmPrinters[i].hostStateColour = Runner.getColour('Offline');
        farmPrinters[i].webSocket = 'danger';
        farmPrinters[i].stateDescription = 'Setting up your Printer';
        farmPrinters[i].hostDescription = 'Setting up your Printer';
        farmPrinters[i].webSocketDescription = 'Websocket is Offline';
        farmPrinters[i].stepRate = 10;

        farmPrinters[i].systemChecks = {
            scanning: {
                api: {
                    status: 'danger',
                    date: null
                },
                files: {
                    status: 'danger',
                    date: null
                },
                state: {
                    status: 'danger',
                    date: null
                },
                profile: {
                    status: 'danger',
                    date: null
                },
                settings: {
                    status: 'danger',
                    date: null
                },
                system: {
                    status: 'danger',
                    date: null
                }
            },
            cleaning: {
                information: {
                    status: 'danger',
                    date: null
                },
                file: {
                    status: 'danger',
                    date: null
                },
                job: {
                    status: 'danger',
                    date: null
                }
            }
        };

        if (typeof farmPrinters[i].dateAdded === 'undefined') {
            let currentTime = new Date();
            currentTime = currentTime.getTime();
            farmPrinters[i].dateAdded = currentTime;
        }
        if (typeof farmPrinters[i].settingsApperance !== 'undefined') {
            farmPrinters[i].settingsAppearance = farmPrinters[i].settingsApperance;
        }
        if (typeof farmPrinters[i].alerts === 'undefined') {
            farmPrinters[i].alerts = null;
        }
        if (typeof farmPrinters[i].powerSettings === 'undefined') {
            farmPrinters[i].powerSettings = null;
        }
        if (typeof farmPrinters[i].currentIdle === 'undefined') {
            farmPrinters[i].currentIdle = 0;
        }
        if (typeof farmPrinters[i].currentActive === 'undefined') {
            farmPrinters[i].currentActive = 0;
        }
        if (typeof farmPrinters[i].currentOffline === 'undefined') {
            farmPrinters[i].currentOffline = 0;
        }
        if (
            typeof farmPrinters[i].selectedFilament === 'undefined' &&
      !Array.isArray(farmPrinters[i].selectedFilament)
        ) {
            farmPrinters[i].selectedFilament = [];
        }
        if (typeof farmPrinters[i].octoPrintVersion === 'undefined') {
            farmPrinters[i].octoPrintVersion = '';
        }
        if (typeof farmPrinters[i].tempTriggers === 'undefined') {
            farmPrinters[i].tempTriggers = {
                heatingVariation: 1,
                coolDown: 30
            };
        }
        if (typeof farmPrinters[i].feedRate === 'undefined') {
            farmPrinters[i].feedRate = 100;
        }
        if (typeof farmPrinters[i].flowRate === 'undefined') {
            farmPrinters[i].flowRate = 100;
        }
        if (typeof farmPrinters[i].sortIndex === 'undefined') {
            if (farmPrinters.length === 0) {
                farmPrinters[i].sortIndex = 0;
            } else if (farmPrinters.length > 0) {
                farmPrinters[i].sortIndex = farmPrinters.length - 1;
            }
        }
        if (typeof farmPrinters[i].group === 'undefined') {
            farmPrinters[i].group = '';
        }
        if (typeof farmPrinters[i].printerURL === 'undefined') {
            farmPrinters[
                i
            ].printerURL = `http://${farmPrinters[i].ip}:${farmPrinters[i].port}`;
        }
        if (
            typeof farmPrinters[i].printerURL !== 'undefined' &&
      !farmPrinters[i].printerURL.includes('https://') &&
      !farmPrinters[i].printerURL.includes('http://')
        ) {
            farmPrinters[i].printerURL = `http://${farmPrinters[i].printerURL}`;
        }
        if (
            typeof farmPrinters[i].camURL !== 'undefined' &&
      farmPrinters[i].camURL !== '' &&
      !farmPrinters[i].camURL.includes('http')
        ) {
            if (
                (typeof farmPrinters[i].camURL !== 'undefined' &&
          farmPrinters[i].camURL.includes('{Set')) ||
        farmPrinters[i].camURL === 'none'
            ) {
                farmPrinters[i].camURL = 'none';
            } else {
                farmPrinters[i].camURL = `http://${farmPrinters[i].camURL}`;
            }
        }
        if (
            typeof farmPrinters[i].costSettings === 'undefined' ||
      _.isEmpty(farmPrinters[i].costSettings)
        ) {
            farmPrinters[i].costSettings = {
                powerConsumption: 0.5,
                electricityCosts: 0.15,
                purchasePrice: 500,
                estimateLifespan: 43800,
                maintenanceCosts: 0.25
            };
        }
        printer.octoPrintVersion = farmPrinters[i].octoPrintVersion;
        printer.printerName = farmPrinters[i].printerName;
        printer.camURL = farmPrinters[i].camURL;
        printer.printerURL = farmPrinters[i].printerURL;
        printer.feedRate = farmPrinters[i].feedRate;
        printer.flowRate = farmPrinters[i].flowRate;
        printer.sortIndex = farmPrinters[i].sortIndex;
        printer.tempTriggers = farmPrinters[i].tempTriggers;
        printer.dateAdded = farmPrinters[i].dateAdded;
        printer.currentIdle = farmPrinters[i].currentIdle;
        printer.currentActive = farmPrinters[i].currentActive;
        printer.currentOffline = farmPrinters[i].currentOffline;
        printer.selectedFilament = farmPrinters[i].selectedFilament;
        printer.powerSettings = farmPrinters[i].powerSettings;
        printer.alerts = farmPrinters[i].alerts;
        printer.costSettings = farmPrinters[i].costSettings;
        await printer.save();
        return true;
    }

    static async addPrinters (printers) {
        logger.info('Adding single printer to farm');
        // Shim for name change
        printers[0].settingsApperance = printers[0].settingsAppearance;
        // Only adding a single printer
        const newPrinter = await new Printers(printers[0]);
        await newPrinter.save();
        logger.info(`Saved new Printer: ${newPrinter.printerURL}`);
        farmPrinters.push(newPrinter);
        await this.setDefaults(newPrinter._id);
        await this.setupWebSocket(newPrinter._id);
        return [newPrinter];
    }

    static async updatePrinters (printers) {
    // Updating printer's information
        logger.info('Pausing runners to update printers...');
        const edited = [];
        for (let i = 0; i < printers.length; i++) {
            const index = _.findIndex(farmPrinters, function (o) {
                return o._id == printers[i]._id;
            });
            farmPrinters[index].state = 'Searching...';
            farmPrinters[index].stateColour = Runner.getColour('Searching...');
            farmPrinters[index].hostState = 'Searching...';
            farmPrinters[index].hostStateColour = Runner.getColour('Searching...');
            farmPrinters[index].webSocket = 'danger';
            farmPrinters[index].stateDescription =
        'Re-Scanning your OctoPrint Instance';
            farmPrinters[index].hostDescription = 'Re-Scanning for OctoPrint Host';
            farmPrinters[index].webSocketDescription = 'Websocket is Offline';
            farmPrinters[index].settingsApperance.name =
        printers[i].settingsAppearance.name;
            farmPrinters[index].markModified('settingsApperance');
            logger.info(`Modified Current Name  for: ${farmPrinters[i].printerURL}`);
            farmPrinters[index].printerURL = printers[i].printerURL;
            farmPrinters[index].markModified('printerURL');
            logger.info(
                `Modified current printer URL  for: ${farmPrinters[i].printerURL}`
            );
            farmPrinters[index].camURL = printers[i].camURL;
            farmPrinters[index].markModified('camURL');
            logger.info(
                `Modified current camera URL for: ${farmPrinters[i].printerURL}`
            );
            farmPrinters[index].apikey = printers[i].apikey;
            farmPrinters[index].markModified('apikey');
            logger.info(`Modified current APIKEY for: ${farmPrinters[i].printerURL}`);
            farmPrinters[index].group = printers[i].group;
            farmPrinters[index].markModified('group');
            logger.info(`Modified current group for: ${farmPrinters[i].printerURL}`);
            await farmPrinters[index].save();
            edited.push({ printerURL: farmPrinters[index].printerURL });
            await this.reScanOcto(farmPrinters[index]._id, true);
            if (typeof farmPrinters[index] !== 'undefined') {
                PrinterClean.generate(farmPrinters[index]);
            }
        }
        logger.info('Re-Scanning printers farm');
        return edited;
    }

    static async trackCounters () {
        for (let p = 0; p < farmPrinters.length; p++) {
            if (typeof farmPrinters[p].stateColour !== 'undefined') {
                if (farmPrinters[p].stateColour.category === 'Active') {
                    farmPrinters[p].currentActive = farmPrinters[p].currentActive + 30000;
                }
                if (
                    farmPrinters[p].stateColour.category === 'Idle' ||
          farmPrinters[p].stateColour.category === 'Disconnected' ||
          farmPrinters[p].stateColour.category === 'Complete'
                ) {
                    farmPrinters[p].currentIdle = farmPrinters[p].currentIdle + 30000;
                }
                if (farmPrinters[p].stateColour.category === 'Offline') {
                    farmPrinters[p].currentOffline =
            farmPrinters[p].currentOffline + 30000;
                }
                farmPrinters[p]
                    .save()
                    .catch((e) =>
                        logger.info('Error Saving Counters, Safe to ignore...', e)
                    );
            }
        }
    }

    static async removePrinter (indexs) {
        logger.info('Pausing runners to remove printer...');
        await this.pause();
        let removed = [];
        if(indexs.length !== farmPrinters.length){
            for (let i = 0; i < indexs.length; i++) {
                const index = _.findIndex(farmPrinters, function (o) {
                    return o._id == indexs[i];
                });
                console.log(index);
                if(index > -1){
                    logger.info(`Removing printer from database: ${farmPrinters[index]._id}`);
                    removed.push({
                        printerURL: farmPrinters[index].printerURL,
                        printerId: indexs[i]
                    });
                    await PrinterClean.removePrintersInformation(farmPrinters[index].sortIndex);
                    farmPrinters.splice(index, 1);

                    // Splice printer out of farm Array...
                    const remove = await Printers.findOneAndDelete({ _id: indexs[i] });
                }
            }
            // Regenerate Indexs
            for (let p = 0; p < farmPrinters.length; p++) {
                await logger.info(
                    `Regenerating existing indexes: ${farmPrinters[p].printerURL}`
                );
                farmPrinters[p].sortIndex = p;
                farmPrinters[p].markModified('sortIndex');
                await farmPrinters[p].save().catch(e => console.log("NONONONONO"));
            }
            logger.info('Re-Scanning printers farm');
            this.init();
        }else{
            removed = indexs;
            farmPrinters = [];
            await PrinterClean.removePrintersInformation();
            await Printers.deleteMany({});
            this.init();

        }
        return removed;
    }

    static async reScanOcto (id, skipAPI) {
        const index = _.findIndex(farmPrinters, function (o) {
            return o._id == id;
        });
        const result = {
            status: null,
            msg: null
        };
        farmPrinters[index].systemChecks.scanning.api.status = 'danger';
        farmPrinters[index].systemChecks.scanning.files.status = 'danger';
        farmPrinters[index].systemChecks.scanning.state.status = 'danger';
        farmPrinters[index].systemChecks.scanning.profile.status = 'danger';
        farmPrinters[index].systemChecks.scanning.settings.status = 'danger';
        farmPrinters[index].systemChecks.scanning.system.status = 'danger';

        farmPrinters[index].state = 'Searching...';
        farmPrinters[index].stateColour = Runner.getColour('Searching...');
        farmPrinters[index].hostState = 'Searching...';
        farmPrinters[index].hostStateColour = Runner.getColour('Searching...');
        farmPrinters[index].webSocket = 'danger';
        farmPrinters[index].stateDescription =
      'Re-Scanning your OctoPrint Instance';
        farmPrinters[index].hostDescription = 'Re-Scanning for OctoPrint Host';
        farmPrinters[index].webSocketDescription = 'Websocket is Offline';
        if (
            typeof farmPrinters[index].ws !== 'undefined' &&
      typeof farmPrinters[index].ws.instance !== 'undefined'
        ) {
            await farmPrinters[index].ws.instance.close();
            logger.info(
                `Closed websocket connection for: ${farmPrinters[index].printerURL}`
            );
        }
        const { _id } = farmPrinters[index];
        await this.setupWebSocket(_id, skipAPI);
        (result.status = 'sucess'),
        (result.msg = 'Your client has been re-synced!');
        return result;
    }

    static async updatePoll () {
        for (let i = 0; i < farmPrinters.length; i++) {
            // Update the server
            const server = await ServerSettings.check();
            systemSettings = server[0];
            const Polling = systemSettings.onlinePolling;
            const throt = {};
            logger.info(
                `Updating websock poll time: ${(Polling.seconds * 1000) / 500}`
            );
            throt.throttle = parseInt((Polling.seconds * 1000) / 500);
            if (
                typeof farmPrinters[i].ws !== 'undefined' &&
        typeof farmPrinters[i].ws.instance !== 'undefined'
            ) {
                await farmPrinters[i].ws.instance.terminate();
            }
        }
        return 'updated';
    }

    static async pause () {
        for (let i = 0; i < farmPrinters.length; i++) {
            if (
                typeof farmPrinters[i].ws !== 'undefined' &&
        typeof farmPrinters[i].ws.instance !== 'undefined'
            ) {
                await farmPrinters[i].ws.instance.close();
                logger.info(
                    `Closed websocket connection for: ${farmPrinters[i].printerURL}`
                );
            }
        }
        return true;
    }
    static async getFile(id, location) {
        const index = _.findIndex(farmPrinters, function(o) {
            return o._id == id;
        });

        const url = `${farmPrinters[index].printerURL}/api/${location}`;
        const getFileInformation = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': farmPrinters[index].apikey
            }
        });

        const getJson = await getFileInformation.json();

        let timeStat = null;
        let filament = [];
        const entry = getJson;
        if (typeof entry.gcodeAnalysis !== 'undefined') {
            if (
                typeof entry.gcodeAnalysis.estimatedPrintTime !==
                    'undefined'
            ) {
                timeStat = entry.gcodeAnalysis.estimatedPrintTime;
                // Start collecting multiple tool lengths and information from files....
                Object.keys(entry.gcodeAnalysis.filament).forEach(function(
                    item,
                    i
                ) {

                    filament[i] = entry.gcodeAnalysis.filament[item].length;
                });
            } else {
                timeStat = 'No Time Estimate';
                filament = null;
            }
        } else {
            timeStat = 'No Time Estimate';
            filament = null;
        }
        let path = null;
        if (entry.path.indexOf('/') > -1) {
            path = entry.path.substr(0, entry.path.lastIndexOf('/'));
        } else {
            path = 'local';
        }
        let thumbnail = null;

        if (typeof entry.thumbnail !== 'undefined') {
            thumbnail = entry.thumbnail;
        }

        let success = 0;
        let failed = 0;
        let last = null;

        if(typeof entry.prints !== 'undefined'){
            success = entry.prints.success;
            failed = entry.prints.failure;
            last = entry.prints.last.success;
        }

        return {
            path,
            fullPath: entry.path,
            display: entry.display,
            length: filament,
            name: entry.name,
            size: entry.size,
            time: timeStat,
            date: entry.date,
            thumbnail,
            success: success,
            failed: failed,
            last: last
        };
        // }catch(err){
        //     logger.error(
        //         `Error grabbing file for: ${farmPrinters[index].printerURL}: Reason: `,
        //         err
        //     );
        //     return false;
        // }
    }
    static async getFiles (id, location) {
        const index = _.findIndex(farmPrinters, function (o) {
            return o._id == id;
        });
        farmPrinters[index].systemChecks.scanning.files.status = 'warning';
        // Shim to fix undefined on upload files/folders
        farmPrinters[index].fileList = {
            files: [],
            fileCount: 0,
            folders: [],
            folderCount: 0
        };
        const url = `${farmPrinters[index].printerURL}/api/${location}`;
        return fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': farmPrinters[index].apikey
            }
        })
            .then((res) => {
                return res.json();
            })
            .then(async (res) => {
                // Setup the files json storage object
                farmPrinters[index].storage = {
                    free: res.free,
                    total: res.total
                };
                farmPrinters[index].markModified("storage");
                // Setup the files location object to place files...
                const printerFiles = [];
                const printerLocations = [];
                const recursivelyPrintNames = async function (entry, depth) {
                    // eslint-disable-next-line no-param-reassign
                    depth = depth || 0;
                    let timeStat = '';
                    let filament = [];
                    const isFolder = entry.type === 'folder';
                    if (!isFolder) {
                        if (typeof entry.gcodeAnalysis !== 'undefined') {
                            if (
                                typeof entry.gcodeAnalysis.estimatedPrintTime !== 'undefined'
                            ) {
                                timeStat = entry.gcodeAnalysis.estimatedPrintTime;
                                // Start collecting multiple tool lengths and information from files....
                                Object.keys(entry.gcodeAnalysis.filament).forEach(function (
                                    item,
                                    i
                                ) {
                                    filament[i] = entry.gcodeAnalysis.filament[item].length;
                                });
                            } else {
                                timeStat = 'No Time Estimate';
                                filament = null;
                            }
                        } else {
                            timeStat = 'No Time Estimate';
                            filament = null;
                        }

                        let path = null;
                        if (entry.path.indexOf('/') > -1) {
                            path = entry.path.substr(0, entry.path.lastIndexOf('/'));
                        } else {
                            path = 'local';
                        }
                        let thumbnail = null;

                        if (typeof entry.thumbnail !== 'undefined') {
                            thumbnail = entry.thumbnail;
                        }

                        let success = 0;
                        let failed = 0;
                        let last = null;

                        if(typeof entry.prints !== 'undefined'){
                            success = entry.prints.success;
                            failed = entry.prints.failure;
                            last = entry.prints.last.success;
                        }

                        const file = {
                            path,
                            fullPath: entry.path,
                            display: entry.display,
                            length: filament,
                            name: entry.name,
                            size: entry.size,
                            time: timeStat,
                            date: entry.date,
                            thumbnail,
                            success: success,
                            failed: failed,
                            last: last
                        };
                        printerFiles.push(file);
                    }

                    const folderPaths = {
                        name: '',
                        path: ''
                    };
                    if (isFolder) {
                        if (entry.path.indexOf('/') > -1) {
                            folderPaths.path = entry.path.substr(
                                0,
                                entry.path.lastIndexOf('/')
                            );
                        } else {
                            folderPaths.path = 'local';
                        }

                        if (entry.path.indexOf('/')) {
                            folderPaths.name = entry.path;
                        } else {
                            folderPaths.name = entry.path.substr(
                                0,
                                entry.path.lastIndexOf('/')
                            );
                        }
                        folderPaths.display = folderPaths.name.replace('/_/g', ' ');
                        printerLocations.push(folderPaths);
                    }

                    if (isFolder) {
                        _.each(entry.children, function (child) {
                            recursivelyPrintNames(child, depth + 1);
                        });
                    }
                };

                _.each(res.files, function (entry) {
                    recursivelyPrintNames(entry);
                });
                farmPrinters[index].fileList = {
                    files: printerFiles,
                    fileCount: printerFiles.length,
                    folders: printerLocations,
                    folderCount: printerLocations.length
                };
                farmPrinters[index].markModified("fileList");
                const currentFilament = await Runner.compileSelectedFilament(
                    farmPrinters[index].selectedFilament,
                    index
                );
                FileClean.generate(farmPrinters[index], currentFilament);
                farmPrinters[index].systemChecks.scanning.files.status = 'success';
                farmPrinters[index].systemChecks.scanning.files.date = new Date();
                FileClean.statistics(farmPrinters);
                logger.info(
                    `Successfully grabbed Files for...: ${farmPrinters[index].printerURL}`
                );
                return true;
            })
            .catch((err) => {
                logger.error(
                    `Error grabbing files for: ${farmPrinters[index].printerURL}: Reason: `,
                    err
                );
                return false;
            });
    }

    static getState (id) {
        const index = _.findIndex(farmPrinters, function (o) {
            return o._id == id;
        });
        farmPrinters[index].systemChecks.scanning.state.status = 'warning';
        return ClientAPI.getRetry(
            farmPrinters[index].printerURL,
            farmPrinters[index].apikey,
            'connection'
        )
            .then((res) => {
                return res.json();
            })
            .then(async (res) => {
                // Update info to DB
                if (res.current.state === 'Offline') {
                    res.current.state = 'Disconnected';
                    farmPrinters[index].stateDescription = 'Your printer is disconnected';
                } else if (res.current.state.includes('Error:')) {
                    farmPrinters[index].stateDescription = res.current.state;
                    res.current.state = 'Error!';
                } else if (res.current.state === 'Closed') {
                    res.current.state = 'Disconnected';
                    farmPrinters[index].stateDescription = 'Your printer is disconnected';
                } else {
                    farmPrinters[index].stateDescription =
            'Current Status from OctoPrint';
                }
                farmPrinters[index].state = "Awaiting WebSocket";
                farmPrinters[index].stateColour = Runner.getColour("Offline");
                farmPrinters[index].current = res.current;
                farmPrinters[index].options = res.options;
                farmPrinters[index].systemChecks.scanning.state.status = 'success';
                farmPrinters[index].systemChecks.scanning.state.date = new Date();
                const currentFilament = JSON.parse(
                    JSON.stringify(farmPrinters[index].selectedFilament)
                );
                for (let s = 0; s < farmPrinters[index].selectedFilament.length; s++) {
                    if (farmPrinters[index].selectedFilament[s] !== null) {
                        const profile = null;
                        // if (systemSettings.filamentManager) {
                        //   profile = await Profiles.findOne({
                        //     "profile.index":
                        //       farmPrinters[index].selectedFilament[s].spools.profile,
                        //   });
                        // } else {
                        //   profile = await Profiles.findById(
                        //     farmPrinters[index].selectedFilament[s].spools.profile
                        //   );
                        // }
                        // currentFilament[s].spools.profile = profile.profile;
                    }
                }
                JobClean.generate(farmPrinters[index], currentFilament);
                logger.info(
                    `Successfully grabbed Current State for...: ${farmPrinters[index].printerURL}`
                );
            })
            .catch((err) => {
                logger.error(
                    `Error grabbing state for: ${farmPrinters[index].printerURL}Reason: `,
                    err
                );
                return false;
            });
    }

    static getProfile (id) {
        const index = _.findIndex(farmPrinters, function (o) {
            return o._id == id;
        });
        farmPrinters[index].systemChecks.scanning.profile.status = 'warning';

        return ClientAPI.getRetry(
            farmPrinters[index].printerURL,
            farmPrinters[index].apikey,
            'printerprofiles'
        )
            .then((res) => {
                return res.json();
            })
            .then((res) => {
                // Update info to DB
                farmPrinters[index].profiles = res.profiles;
                farmPrinters[index].systemChecks.scanning.profile.status = 'success';
                farmPrinters[index].systemChecks.scanning.profile.date = new Date();
                logger.info(
                    `Successfully grabbed Profiles.js for...: ${farmPrinters[index].printerURL}`
                );
            })
            .catch((err) => {
                logger.error(
                    `Error grabbing profile for: ${farmPrinters[index].printerURL}: Reason: `,
                    err
                );
                return false;
            });
    }

    static getSettings (id) {
        const index = _.findIndex(farmPrinters, function (o) {
            return o._id == id;
        });
        farmPrinters[index].systemChecks.scanning.settings.status = 'warning';
        return ClientAPI.getRetry(
            farmPrinters[index].printerURL,
            farmPrinters[index].apikey,
            'settings'
        )
            .then((res) => {
                return res.json();
            })
            .then(async (res) => {
                // Update info to DB
                farmPrinters[index].corsCheck = res.api.allowCrossOrigin;
                farmPrinters[index].settingsApi = res.api;
                if(farmPrinters[index].settingsAppearance === 'undefined'){
                    farmPrinters[index].settingsAppearance = res.appearance;
                }else if(farmPrinters[index].settingsAppearance.name.includes("{Leave to Grab")){
                    farmPrinters[index].settingsAppearance.name = res.appearance.name;
                }

                farmPrinters[index].settingsFeature = res.feature;
                farmPrinters[index].settingsFolder = res.folder;
                farmPrinters[index].settingsPlugins = res.plugins;
                farmPrinters[index].settingsScripts = res.scripts;
                farmPrinters[index].settingsSerial = res.serial;
                farmPrinters[index].settingsServer = res.server;
                farmPrinters[index].settingsSystem = res.system;
                farmPrinters[index].settingsWebcam = res.webcam;
                if (
                    farmPrinters[index].camURL === '' ||
          (farmPrinters[index].camURL === null &&
            farmPrinters[index].camURL !== 'none')
                ) {
                    if (
                        typeof res.webcam !== 'undefined' &&
            typeof res.webcam.streamUrl !== 'undefined' &&
            res.webcam.streamUrl != null
                    ) {
                        if (res.webcam.streamUrl.includes('http')) {
                            farmPrinters[index].camURL = res.webcam.streamUrl;
                            farmPrinters[index].camURL = farmPrinters[index].camURL.replace(
                                'http://',
                                ''
                            );
                        } else {
                            farmPrinters[index].camURL =
                farmPrinters[index].printerURL + res.webcam.streamUrl;
                        }
                        const printer = await Printers.findOne({ index });
                        printer.camURL = farmPrinters[index].camURL;
                        printer.save();
                    }
                }
                farmPrinters[index].systemChecks.scanning.settings.status = 'success';
                farmPrinters[index].systemChecks.scanning.settings.date = new Date();
                logger.info(
                    `Successfully grabbed Settings for...: ${farmPrinters[index].printerURL}`
                );
            })
            .catch((err) => {
                logger.error(
                    `Error grabbing settings for: ${farmPrinters[index].printerURL}: Reason: `,
                    err
                );
                return false;
            });
    }

    static getSystem (id) {
        const index = _.findIndex(farmPrinters, function (o) {
            return o._id == id;
        });
        farmPrinters[index].systemChecks.scanning.system.status = 'warning';
        return ClientAPI.getRetry(
            farmPrinters[index].printerURL,
            farmPrinters[index].apikey,
            'system/commands'
        )
            .then((res) => {
                return res.json();
            })
            .then((res) => {
                // Update info to DB
                farmPrinters[index].core = res.core;
                farmPrinters[index].systemChecks.scanning.system.status = 'success';
                farmPrinters[index].systemChecks.scanning.system.date = new Date();
                logger.info(
                    `Successfully grabbed System Information for...: ${farmPrinters[index].printerURL}`
                );
            })
            .catch((err) => {
                logger.error(
                    `Error grabbing system for: ${farmPrinters[index].printerURL}: Reason: `,
                    err
                );
                return false;
            });
    }

    static getColour (state) {
        if (state === 'Operational') {
            return { name: 'secondary', hex: '#262626', category: 'Idle' };
        }
        if (state === 'Paused') {
            return { name: 'warning', hex: '#583c0e', category: 'Idle' };
        }
        if (state === 'Printing') {
            return { name: 'warning', hex: '#583c0e', category: 'Active' };
        }
        if (state === 'Pausing') {
            return { name: 'warning', hex: '#583c0e', category: 'Active' };
        }
        if (state === 'Cancelling') {
            return { name: 'warning', hex: '#583c0e', category: 'Active' };
        }
        if (state === 'Starting') {
            return { name: 'warning', hex: '#583c0e', category: 'Active' };
        }
        if (state === 'Error!') {
            return { name: 'danger', hex: '#2e0905', category: 'Disconnected' };
        }
        if (state === 'Offline') {
            return { name: 'danger', hex: '#2e0905', category: 'Offline' };
        }
        if (state === 'Searching...') {
            return { name: 'danger', hex: '#2e0905', category: 'Offline' };
        }
        if (state === 'Disconnected') {
            return { name: 'danger', hex: '#2e0905', category: 'Disconnected' };
        }
        if (state === 'No-API') {
            return { name: 'danger', hex: '#2e0905', category: 'Offline' };
        }
        if (state === 'Complete') {
            return { name: 'success', hex: '#00330e', category: 'Complete' };
        }
        if (state === 'Shutdown') {
            return { name: 'danger', hex: '#2e0905', category: 'Offline' };
        }
        if (state === 'Online') {
            return { name: 'success', hex: '#00330e', category: 'Idle' };
        }
        return { name: 'warning', hex: '#583c0e', category: 'Active' };
    }

    static returnFarmPrinters (index) {
        if (typeof index === 'undefined') {
            return farmPrinters;
        }
        const i = _.findIndex(farmPrinters, function (o) {
            return o._id == index;
        });
        return farmPrinters[i];
    }

    static async removeFile (printer, fullPath) {
        const i = _.findIndex(farmPrinters, function (o) {
            return o._id == printer._id;
        });
        const index = await _.findIndex(farmPrinters[i].fileList.files, function (
            o
        ) {
            return o.fullPath === fullPath;
        });
        farmPrinters[i].fileList.files.splice(index, 1);
        farmPrinters[i].fileList.fileCount = farmPrinters[i].fileList.files.length;
        farmPrinters[i].markModified("fileList");
        farmPrinters[i].save();
        const currentFilament = await Runner.compileSelectedFilament(
            farmPrinters[i].selectedFilament,
            i
        );
        FileClean.generate(farmPrinters[i], currentFilament);
        FileClean.statistics(farmPrinters);
    }

    static async compileSelectedFilament (selectedFilament, i) {
        const currentFilament = JSON.parse(JSON.stringify(selectedFilament));
        for (let s = 0; s < selectedFilament.length; s++) {
            if (selectedFilament[s] !== null) {
                let profile = null;
                try {
                    if (systemSettings.filamentManager) {
                        profile = await Profiles.findOne({
                            'profile.index': selectedFilament[s].spools.profile
                        });
                    } else {
                        profile = await Profiles.findById(selectedFilament[s].spools.profile);
                    }
                    currentFilament[s].spools.profile = profile.profile;
                    farmPrinters[i].selectedFilament[s].spools.material =
              profile.profile.material;
                } catch (e) {
                    logger.error("Couldn't find profile", e);
                }
            }
        }
        return currentFilament;
    }

    static async reSyncFile (id, fullPath) {
        const i = _.findIndex(farmPrinters, function (o) {
            return o._id == id;
        });
        const fileID = _.findIndex(farmPrinters[i].fileList.files, function (o) {
            return o.fullPath == fullPath;
        });
        // Doesn't actually resync just the file... shhh
        farmPrinters[i].fileList.files[fileID] = await Runner.getFile(id, 'files/local/'+fullPath);
        farmPrinters[i].markModified("fileList");
        farmPrinters[i].save();
        const currentFilament = await Runner.compileSelectedFilament(
            farmPrinters[i].selectedFilament,
            i
        );
        FileClean.generate(farmPrinters[i], currentFilament);
        FileClean.statistics(farmPrinters);

        return true;
    }

    static async flowRate (id, newRate) {
        const i = _.findIndex(farmPrinters, function (o) {
            return o._id == id;
        });
        farmPrinters[i].flowRate = newRate;
        const printer = await Printers.findById(id);
        printer.flowRate = farmPrinters[i].flowRate;
        printer.save();
        PrinterClean.generate(farmPrinters[i], systemSettings.filamentManager);
    }

    static async feedRate (id, newRate) {
        const i = _.findIndex(farmPrinters, function (o) {
            return o._id == id;
        });
        farmPrinters[i].feedRate = newRate;
        const printer = await Printers.findById(id);
        printer.feedRate = farmPrinters[i].feedRate;
        printer.save();
        PrinterClean.generate(farmPrinters[i], systemSettings.filamentManager);
    }

    static async updateSortIndex (list) {
    // Update the live information
        for (let i = 0; i < farmPrinters.length; i++) {
            const id = _.findIndex(farmPrinters, function (o) {
                return JSON.stringify(o._id) === JSON.stringify(list[i]);
            });

            farmPrinters[id].sortIndex = i;
            PrinterClean.generate(farmPrinters[id], systemSettings.filamentManager);
            const printer = await Printers.findById(list[i]);
            printer.sortIndex = i;
            printer.save();
            PrinterClean.generate(farmPrinters[i], systemSettings.filamentManager);
        }
    }

    static stepRate (id, newRate) {
        const i = _.findIndex(farmPrinters, function (o) {
            return o._id == id;
        });
        farmPrinters[i].stepRate = newRate;
        PrinterClean.generate(farmPrinters[i], systemSettings.filamentManager);
    }

    static async updateSettings (settings) {
        const printer = await Printers.findById(settings.printer.index);
        const index = _.findIndex(farmPrinters, function (o) {
            return o._id == settings.printer.index;
        });

        // Preferred Only update on live
        farmPrinters[index].options.baudratePreference =
      settings.connection.preferredBaud;
        farmPrinters[index].options.portPreference =
      settings.connection.preferredPort;
        farmPrinters[index].options.printerProfilePreference =
      settings.connection.preferredProfile;

        // Gocde update printer and Live
        farmPrinters[index].settingsScripts.gcode = settings.gcode;

        if (settings.other.coolDown != '') {
            farmPrinters[index].tempTriggers.coolDown = parseInt(
                settings.other.coolDown
            );
            printer.tempTriggers.coolDown = parseInt(settings.other.coolDown);
            printer.markModified('tempTriggers');
        }
        if (settings.other.heatingVariation != '') {
            farmPrinters[index].tempTriggers.heatingVariation = parseFloat(
                settings.other.heatingVariation
            );
            printer.tempTriggers.heatingVariation = parseFloat(
                settings.other.heatingVariation
            );
            printer.markModified('tempTriggers');
        }
        farmPrinters[index].costSettings = settings.costSettings;
        printer.costSettings = settings.costSettings;
        printer.markModified('costSettings');
        farmPrinters[index].settingsAppearance.name = settings.profile.name;
        printer.settingsApperance.name = settings.profile.name;
        printer.markModified('settingsAppearance');
        farmPrinters[index].powerSettings = settings.powerCommands;

        printer.powerSettings = settings.powerCommands;
        printer.markModified('powerSettings');

        printer.save();

        const opts = {
            scripts: {
                gcode: settings.gcode
            },
            server: {
                commands: {
                    systemShutdownCommand: settings.systemCommands.systemShutdown,
                    systemRestartCommand: settings.systemCommands.systemRestart,
                    serverRestartCommand: settings.systemCommands.serverRestart
                }
            },
            webcam: {
                webcamEnabled: settings.other.enableCamera,
                timelapseEnabled: settings.other.enableTimeLapse,
                rotate90: settings.other.rotateCamera,
                flipH: settings.other.flipHCamera,
                flipV: settings.other.flipVCamera
            }
        };

        const profile = await fetch(
            `${farmPrinters[index].printerURL}/api/printerprofiles/${settings.profileID}`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': farmPrinters[index].apikey
                },
                body: JSON.stringify({ profile: settings.profile })
            }
        );

        // Update octoprint profile...
        const sett = await fetch(`${farmPrinters[index].printerURL}/api/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': farmPrinters[index].apikey
            },
            body: JSON.stringify(opts)
        });
        await Runner.getProfile(settings.printer.index);
        await Runner.getSettings(settings.printer.index);
        PrinterClean.generate(farmPrinters[index], systemSettings.filamentManager);
        // let i = _.findIndex(farmPrinters, function(o) { return o._id == id; });
        //
        // console.log()
        //
        // farmPrinters[i].settingsScripts.gcode = opts.scripts.gcode;
        // farmPrinters[i].settingsAppearance.name = opts.appearance.name;
        // farmPrinters[i].settingsWebcam = opts.webcam;
        // farmPrinters[i].camURL = opts.camURL;
        // let printer = await Printers.findOne({ index: i });
        // printer.settingsWebcam = farmPrinters[i].settingsWebcam;
        // printer.camURL = farmPrinters[i].camURL;
        // printer.settingsApperarance.name = farmPrinters[i].settingsAppearance.name;
        // printer.save();
        return {
            status: { profile: profile.status, settings: sett.status },
            printer
        };
    }

    static async moveFile (id, newPath, fullPath, filename) {
        const i = _.findIndex(farmPrinters, function (o) {
            return o._id == id;
        });
        const file = _.findIndex(farmPrinters[i].fileList.files, function (o) {
            return o.name === filename;
        });
        // farmPrinters[i].fileList.files[file].path = newPath;
        farmPrinters[i].fileList.files[file].path = newPath;
        farmPrinters[i].fileList.files[file].fullPath = fullPath;
        farmPrinters[i].markModified("fileList");
        farmPrinters[i].save();
        const currentFilament = await Runner.compileSelectedFilament(
            farmPrinters[i].selectedFilament,
            i
        );
        FileClean.generate(farmPrinters[i], currentFilament);
        FileClean.statistics(farmPrinters);
    }

    static async moveFolder (id, oldFolder, fullPath, folderName) {
        const i = _.findIndex(farmPrinters, function (o) {
            return o._id == id;
        });
        const file = _.findIndex(farmPrinters[i].fileList.folders, function (o) {
            return o.name === oldFolder;
        });
        farmPrinters[i].fileList.files.forEach((file, index) => {
            if (file.path === oldFolder) {
                const fileName = farmPrinters[i].fileList.files[
                    index
                ].fullPath.substring(
                    farmPrinters[i].fileList.files[index].fullPath.lastIndexOf('/') + 1
                );
                farmPrinters[i].fileList.files[
                    index
                ].fullPath = `${folderName}/${fileName}`;
                farmPrinters[i].fileList.files[index].path = folderName;
            }
        });
        farmPrinters[i].fileList.folders[file].name = folderName;
        farmPrinters[i].fileList.folders[file].path = fullPath;
        farmPrinters[i].markModified("fileList");
        farmPrinters[i].save();
        const currentFilament = await Runner.compileSelectedFilament(
            farmPrinters[i].selectedFilament,
            i
        );
        FileClean.generate(farmPrinters[i], currentFilament);
        FileClean.statistics(farmPrinters);
    }

    static async deleteFolder (id, fullPath) {
        const i = _.findIndex(farmPrinters, function (o) {
            return o._id == id;
        });
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
        const folder = _.findIndex(farmPrinters[i].fileList.folders, function (o) {
            return o.name === fullPath;
        });
        farmPrinters[i].fileList.folders.splice(folder, 1);
        farmPrinters[i].fileList.fileCount = farmPrinters[i].fileList.files.length;
        farmPrinters[i].fileList.folderCount =
      farmPrinters[i].fileList.folders.length;
        farmPrinters[i].markModified("fileList");
        farmPrinters[i].save();
        const currentFilament = await Runner.compileSelectedFilament(
            farmPrinters[i].selectedFilament,
            i
        );
        FileClean.generate(farmPrinters[i], currentFilament);
        FileClean.statistics(farmPrinters);
    }

    static async newFolder (folder) {
        const index = folder.i;
        const i = _.findIndex(farmPrinters, function (o) {
            return o._id == index;
        });
        let path = 'local';
        let name = folder.foldername;
        if (folder.path !== '') {
            path = folder.path;
            name = `${path}/${name}`;
        }
        const display = JSON.parse(JSON.stringify(name));
        name = name.replace(/ /g, '_');
        const newFolder = {
            name,
            path,
            display
        };

        farmPrinters[i].fileList.folders.push(newFolder);
        farmPrinters[i].fileList.folderCount =
      farmPrinters[i].fileList.folders.length;
        farmPrinters[i].markModified("fileList");
        farmPrinters[i].save();
        const currentFilament = await Runner.compileSelectedFilament(
            farmPrinters[i].selectedFilament,
            i
        );
        FileClean.generate(farmPrinters[i], currentFilament);
        FileClean.statistics(farmPrinters);
    }

    static async updateFilament () {
        for (let i = 0; i < farmPrinters.length; i++) {
            if (Array.isArray(farmPrinters[i].selectedFilament)) {
                for (let f = 0; f < farmPrinters[i].selectedFilament.length; f++) {
                    if (farmPrinters[i].selectedFilament[f] !== null) {
                        const newInfo = await Filament.findById(
                            farmPrinters[i].selectedFilament[f]._id
                        );
                        const printer = await Printers.findById(farmPrinters[i]._id);
                        farmPrinters[i].selectedFilament[f] = newInfo;
                        printer.selectedFilament[f] = newInfo;
                        printer.save();
                        const currentFilament = await Runner.compileSelectedFilament(
                            farmPrinters[i].selectedFilament,
                            i
                        );
                        FileClean.generate(farmPrinters[i], currentFilament);
                    }
                }
            } else if (farmPrinters[i].selectedFilament != null) {
                const newInfo = await Filament.findById(
                    farmPrinters[i].selectedFilament._id
                );
                const printer = await Printers.findById(farmPrinters[i]._id);
                farmPrinters[i].selectedFilament = newInfo;
                printer.selectedFilament = newInfo;
                printer.save();
                const currentFilament = await Runner.compileSelectedFilament(
                    farmPrinters[i].selectedFilament,
                    i
                );
                FileClean.generate(farmPrinters[i], currentFilament);
            }
        }
    }

    static async selectedFilament (printerId, filamentId, tool) {
        const i = _.findIndex(farmPrinters, function (o) {
            return o._id == printerId;
        });
        const printer = await Printers.findById(printerId);
        // Check if filament already attached...
        // New selectedFilament array, so not array... none selected setup new.

        if (filamentId == 0) {
            printer.selectedFilament[tool] = null;
            farmPrinters[i].selectedFilament[tool] = null;
            // Find in selected filament list and remove
            const selected = _.findIndex(farmPrinters[i].selectedFilament, function (
                o
            ) {
                return o == filamentId;
            });
        } else if (!Array.isArray(farmPrinters[i].selectedFilament)) {
            // Setup new spool...
            // Make sure selectedFilament is an array
            farmPrinters[i].selectedFilament = [];
            printer.selectedFilament = [];
            // Find the spool in the database...
            const spool = await Filament.findById(filamentId);
            // Save the spool to correct tool slot in filament array
            printer.selectedFilament[tool] = spool;
            farmPrinters[i].selectedFilament[tool] = spool;
        } else {
            // Already and array... check if spool already selected
            const spool = await Filament.findById(filamentId);
            printer.selectedFilament[tool] = spool;
            farmPrinters[i].selectedFilament[tool] = spool;
        }
        printer.markModified('selectedFilament');
        printer.save().then(async () => {
            const currentFilament = await Runner.compileSelectedFilament(
                farmPrinters[i].selectedFilament,
                i
            );
            FileClean.generate(farmPrinters[i], currentFilament);
        });
    // FileClean.generate(farmPrinters[i], systemSettings.filamentManager);
    // if (printerId == 0) {
    //     //Deselecting a spool
    //     //Find the printer spool is attached too
    //     let i = _.findIndex(farmPrinters, function(o) {
    //             if(o.selectedFilament !== null && o.selectedFilament._id == filamentId){
    //                 return o.selectedFilament._id;
    //             }
    //     });
    //     if(i > -1){
    //         let printer = await Printers.findById(farmPrinters[i]._id);
    //         printer.selectedFilament = null;
    //         farmPrinters[i].selectedFilament = null;
    //         printer.save();
    //         //remove from selected filament list
    //         let selectedFilamentId = _.findIndex(selectedFilament, function(o) {
    //             return o == filamentId;
    //         });
    //         if(selectedFilamentId > -1){
    //             selectedFilament.splice(selectedFilamentId, 1)
    //         }
    //     }
    // } else {
    //     //Selecting a spool
    //     let printer = await Printers.findById(printerId);
    //     let i = _.findIndex(farmPrinters, function(o) { return o._id == printerId; });
    //
    //     if(farmPrinters[i].selectedFilament != null){
    //         if(filamentId == 0){
    //             let selectedFilamentId = _.findIndex(selectedFilament, function(o) {
    //                 return o._id == farmPrinters[i].selectedFilament._id;
    //             });
    //             if(selectedFilamentId > -1){
    //                 selectedFilament.splice(selectedFilamentId, 1)
    //             }
    //             printer.selectedFilament = null;
    //             farmPrinters[i].selectedFilament = null;
    //         }else{
    //             //farm printer already has filament, remove before updating...
    //             let selectedFilamentId = _.findIndex(selectedFilament, function(o) {
    //                 return o._id == farmPrinters[i].selectedFilament._id;
    //             });
    //             if(selectedFilamentId > -1){
    //                 selectedFilament.splice(selectedFilamentId, 1)
    //             }
    //             let spool = await Filament.findById(filamentId);
    //             printer.selectedFilament = spool;
    //             farmPrinters[i].selectedFilament = spool;
    //             selectedFilament.push(spool._id);
    //         }
    //
    //     }else{
    //         let spool = await Filament.findById(filamentId);
    //         printer.selectedFilament = spool;
    //         farmPrinters[i].selectedFilament = spool;
    //         selectedFilament.push(spool._id);
    //     }
    //     printer.markModified("selectedFilament")
    //     printer.save();
    // }
    }

    static async newFile (file) {
        const i = _.findIndex(farmPrinters, function (o) {
            return o._id == file.index;
        });
        const date = new Date();

        file = file.files.local;

        let path = '';
        if (file.path.indexOf('/') > -1) {
            path = file.path.substr(0, file.path.lastIndexOf('/'));
        } else {
            path = 'local';
        }
        const fileDisplay = file.name.replace(/_/g, ' ');
        const data = {
            path: path,
            fullPath: file.path,
            display: fileDisplay,
            length: null,
            name: file.name,
            size: null,
            time: null,
            date: date.getTime() / 1000,
            thumbnail: null,
            success: 0,
            failed: 0,
            last: null
        };
        farmPrinters[i].fileList.files.push(data);
        farmPrinters[i].markModified("fileList");
        farmPrinters[i].save();
        const currentFilament = await Runner.compileSelectedFilament(
            farmPrinters[i].selectedFilament,
            i
        );
        FileClean.generate(farmPrinters[i], currentFilament);
        FileClean.statistics(farmPrinters);
        await this.updateFile(farmPrinters[i].fileList.files[farmPrinters[i].fileList.files.length-1], i);
    }
    static async updateFile(file, i){
        if(fileTimeout <= 20000){
            logger.info(`Updating new file ${farmPrinters[i].fileList.files[farmPrinters[i].fileList.files.length-1].name} for Printer:${farmPrinters[i].printerURL}`);
            setTimeout(async function () {
                let path = file.fullPath;
                if(path.includes("local")){
                    path = JSON.parse(JSON.stringify(file.fullPath.replace('local',"")));
                }
                const fileInformation = await Runner.getFile(farmPrinters[i]._id, `files/local/${path}`);
                fileTimeout = fileTimeout + 5000;
                if(fileInformation){
                    logger.info(`New File Information:`,fileInformation);
                    farmPrinters[i].fileList.files[farmPrinters[i].fileList.files.length-1] = fileInformation;
                    farmPrinters[i].markModified("fileList");
                    farmPrinters[i].save();
                    if(fileInformation.time === null || fileInformation.time === "No Time Estimate"){
                        logger.info(`File Information Still Missing Retrying...`);
                        Runner.updateFile(farmPrinters[i].fileList.files[farmPrinters[i].fileList.files.length-1] ,i);
                        const currentFilament = await Runner.compileSelectedFilament(
                            farmPrinters[i].selectedFilament,
                            i
                        );
                        FileClean.generate(farmPrinters[i], currentFilament);
                        FileClean.statistics(farmPrinters);
                        return null;
                    }else{
                        const currentFilament = await Runner.compileSelectedFilament(
                            farmPrinters[i].selectedFilament,
                            i
                        );
                        FileClean.generate(farmPrinters[i], currentFilament);
                        FileClean.statistics(farmPrinters);
                        return null;
                    }
                }
            }, 5000);
        }else{
            logger.info(`File information took too long to generate, awaiting manual scan...`);
        }
    }
    static sortedIndex () {
        const sorted = [];
        for (let p = 0; p < farmPrinters.length; p++) {
            const sort = {
                sortIndex: farmPrinters[p].sortIndex,
                actualIndex: p
            };
            sorted.push(sort);
        }
        sorted.sort((a, b) => (a.sortIndex > b.sortIndex ? 1 : -1));
        return sorted;
    }
}

let fileTimeout = 0;

module.exports = {
    Runner
};
