const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const yj = require("yieldable-json");
const ClientSettings = require("../models/ClientSettings.js");

//Global store of dashboard info... wonder if there's a cleaner way of doing all this?!
let clientInfo = null;
let clientInfoString = null;

const farmStatistics = require("../runners/statisticsCollection.js");
const FarmStatistics = farmStatistics.StatisticsCollection;
const systemInfo = require("../runners/systemInfo.js");
const SystemInfo = systemInfo.SystemRunner;
const runner = require("../runners/state.js");
const Runner = runner.Runner;
const Roll = require("../models/Filament.js");

let clientId = 0;
let clients = {}; // <- Keep a map of attached clients

let sysInfo = null;
setInterval(async function() {
  //Only needed for WebSocket Information
  let printers = await Runner.returnFarmPrinters();

  let printerInfo = [];
  let systemInformation = await SystemInfo.returnInfo();
  //There is a circular structure in here somewhere!?
  if (typeof systemInformation !== 'undefined') {
    sysInfo = {
      osInfo: systemInformation.osInfo,
      cpuInfo: systemInformation.cpuInfo,
      cpuLoad: systemInformation.cpuLoad,
      memoryInfo: systemInformation.memoryInfo,
      sysUptime: systemInformation.sysUptime,
      sysProcess: systemInformation.sysProcess
    };
  }

  let filly = await Roll.find({});
  let rolls = [];
  filly.forEach(r => {
    let filament = {
      id: r._id,
      name: r.roll.name,
      type: r.roll.type,
      colour: r.roll.colour,
      manufacturer: r.roll.manufacturer
    };
    rolls.push(filament);
  });
  let clientSettings = await ClientSettings.find({});
  let cSettings = {
    settings: clientSettings[0].settings,
    panelView: clientSettings[0].panelView,
    listView: clientSettings[0].listView,
    cameraView: clientSettings[0].cameraView
  };

  for (let i = 0; i < printers.length; i++) {
    let selectedFilament = null;
    if (typeof printers[i].selectedFilament != "undefined") {
      selectedFilament = printers[i].selectedFilament;
    }
    let printer = {
      _id: printers[i]._id,
      state: printers[i].state,
      ip: printers[i].ip,
      port: printers[i].port,
      camURL: printers[i].camURL,
      apikey: printers[i].apikey,
      currentZ: printers[i].currentZ,
      progress: printers[i].progress,
      job: printers[i].job,
      profile: printers[i].profiles,
      temps: printers[i].temps,
      flowRate: printers[i].flowRate,
      feedRate: printers[i].feedRate,
      stepRate: printers[i].stepRate,
      filesList: printers[i].fileList,
      storage: printers[i].storage,
      logs: printers[i].logs,
      messages: printers[i].messages,
      plugins: printers[i].settingsPlugins,
      gcode: printers[i].settingsScripts,
      settingsAppearance: printers[i].settingsApperance,
      stateColour: printers[i].stateColour,
      current: printers[i].current,
      options: printers[i].options,
      selectedFilament: selectedFilament,
      settingsWebcam: printers[i].settingsWebcam,
      webSocket: printers[i].webSocket,
      octoPrintVersion: printers[i].octoPrintVersion,
      hostState: printers[i].hostState,
      hostStateColour: printers[i].hostStateColour,
      printerURL: printers[i].printerURL,
      group: printers[i].group,
      tempTriggers: printers[i].tempTriggers
    };
    printerInfo.push(printer);
  }
  let statistics = await FarmStatistics.returnStats();
  let currentOperations = null;
  let currentOperationsCount = null;
  let farmInfo = null;
  let heatMap = null;
  let octofarmStatistics = null;
  let printStatistics = null;

  if (typeof statistics != "undefined") {
    currentOperations = statistics.currentOperations;
    currentOperationsCount = statistics.currentOperationsCount;
    farmInfo = statistics.farmInfo;
    heatMap = statistics.heatMap;
    octofarmStatistics = statistics.octofarmStatistics;
    printStatistics = statistics.printStatistics;
  } else {
    currentOperations = 0;
    currentOperationsCount = 0;
    farmInfo = 0;
    heatMap = 0;
    octofarmStatistics = 0;
    printStatistics = 0;
  }
  clientInfo = {
    printerInfo: printerInfo,
    currentOperations: currentOperations,
    currentOperationsCount: currentOperationsCount,
    farmInfo: farmInfo,
    heatMap: heatMap,
    systemInfo: sysInfo,
    filament: rolls,
    clientSettings: cSettings
  };
  yj.stringifyAsync(clientInfo, null, null,32,(err, data) => {
    if (!err) {
      clientInfoString = data;
    } else {
      console.log(err);
    }
  });

}, 500);
// Called once for each new client. Note, this response is left open!
router.get("/dashboardInfo/", ensureAuthenticated, function(req, res) {
  //req.socket.setTimeout(Number.MAX_VALUE);
  res.writeHead(200, {
    "Content-Type": "text/event-stream", // <- Important headers
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });
  res.write("\n");
  (function(clientId) {
    clients[clientId] = res; // <- Add this client to those we consider "attached"
    req.on("close", function() {
      delete clients[clientId];
    }); // <- Remove this client when he disconnects
  })(++clientId);
  //console.log("Client: " + Object.keys(clients));
});
// Called once for each new client. Note, this response is left open!
router.get("/monitoringInfo/", ensureAuthenticated, function(req, res) {
  //req.socket.setTimeout(Number.MAX_VALUE);
  res.writeHead(200, {
    "Content-Type": "text/event-stream", // <- Important headers
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });
  res.write("\n");
  (function(clientId) {
    clients[clientId] = res; // <- Add this client to those we consider "attached"
    req.on("close", function() {
      delete clients[clientId];
    }); // <- Remove this client when he disconnects
  })(++clientId);
  //console.log("Client: " + Object.keys(clients));

});
// Called once for each new client. Note, this response is left open!
router.get("/historyInfo/", ensureAuthenticated, function(req, res) {
  //req.socket.setTimeout(Number.MAX_VALUE);
  res.writeHead(200, {
    "Content-Type": "text/event-stream", // <- Important headers
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });
  res.write("\n");
  (function(clientId) {
    clients[clientId] = res; // <- Add this client to those we consider "attached"
    req.on("close", function() {
      delete clients[clientId];
    }); // <- Remove this client when he disconnects
  })(++clientId);
  //console.log("Client: " + Object.keys(clients));
});
// Called once for each new client. Note, this response is left open!
router.get("/fileManagerInfo/", ensureAuthenticated, function(req, res) {
  //req.socket.setTimeout(Number.MAX_VALUE);
  res.writeHead(200, {
    "Content-Type": "text/event-stream", // <- Important headers
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });
  res.write("\n");
  (function(clientId) {
    clients[clientId] = res; // <- Add this client to those we consider "attached"
    req.on("close", function() {
      delete clients[clientId];
    }); // <- Remove this client when he disconnects
  })(++clientId);
});

setInterval(async function() {
  for (clientId in clients) {
    if(clients[clientId].socket.parser.incoming.url.includes("dashboard")){
      for (clientId in clients) {
        clients[clientId].write("data: " + clientInfoString + "\n\n"); // <- Push a message to a single attached client
      }
    }else if(clients[clientId].socket.parser.incoming.url.includes("monitoring")){
      for (clientId in clients) {
        clients[clientId].write("data: " + clientInfoString + "\n\n"); // <- Push a message to a single attached client
      }
    }else if(clients[clientId].socket.parser.incoming.url.includes("history")){
      for (clientId in clients) {
        clients[clientId].write("data: " + clientInfoString + "\n\n"); // <- Push a message to a single attached client
      }
    }else if(clients[clientId].socket.parser.incoming.url.includes("fileManagerInfo")){
      for (clientId in clients) {
        clients[clientId].write("data: " + clientInfoString  + "\n\n"); // <- Push a message to a single attached client
      }
    }
  }
}, 500);



module.exports = router;