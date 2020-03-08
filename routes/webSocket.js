const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const serverSettings = require("../settings/serverSettings.js");
const ServerSettings = serverSettings.ServerSettings;
const ClientSettings = require("../models/ClientSettings.js");

//Global store of dashboard info... wonder if there's a cleaner way of doing all this?!
let dashboardInfo = null;

const farmStatistics = require("../runners/statisticsCollection.js");
const FarmStatistics = farmStatistics.StatisticsCollection;
const SystemInfo = require("../models/SystemInfo.js");
const runner = require("../runners/state.js");
const Runner = runner.Runner;
const Roll = require("../models/Filament.js");

setInterval(async function() {
  //Only needed for WebSocket Information
  let printers = await Runner.returnFarmPrinters();
  let statistics = await FarmStatistics.returnStats();
  let printerInfo = [];
  let systemInformation = await SystemInfo.find({});
  let roll = await Roll.find({});
  let clientSettings = await ClientSettings.find({});
  for (let i = 0; i < printers.length; i++) {
    let selectedFilament = null;
    if (typeof printers[i].selectedFilament != "undefined") {
      selectedFilament = printers[i].selectedFilament;
    }
    let printer = {
      state: printers[i].state,
      index: printers[i].index,
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
      logs: printers[i].logs,
      messages: printers[i].messages,
      plugins: printers[i].settingsPlugins,
      gcode: printers[i].settingsScripts,
      url: printers[i].ip + ":" + printers[i].port,
      settingsAppearance: printers[i].settingsApperance,
      stateColour: printers[i].stateColour,
      current: printers[i].current,
      options: printers[i].options,
      selectedFilament: selectedFilament
    };
    printerInfo.push(printer);
  }
  dashboardInfo = {
    printerInfo: printerInfo,
    currentOperations: statistics.currentOperations,
    currentOperationsCount: statistics.currentOperationsCount,
    farmInfo: statistics.farmInfo,
    octofarmStatistics: statistics.octofarmStatistics,
    printStatistics: statistics.printStatistics,
    systemInfo: systemInformation[0],
    filament: roll,
    clientSettings: clientSettings
  };
}, 500);

router.ws("/grab", function(ws, req) {
  ws.on("open", function open() {});
  ws.on("message", async function(msg) {
    if (msg === "hello") {
      try {
        let Polling = await ServerSettings.check();
        ws.interval = setInterval(function() {
          if (ws.readyState === 1) {
            ws.send(JSON.stringify(dashboardInfo));
          } else {
            clearInterval(ws.interval);
            ws.terminate();
          }
        }, parseInt(Polling[0].onlinePolling.seconds * 1000));
      } catch (e) {
        console.log({
          error: e,
          message:
            "Client unexpectedly disconnected... stopping interval, refresh client to reconnect..."
        });
        clearInterval(ws.interval);
        ws.terminate();
      }
    }
  });
  ws.on("close", function() {
    clearInterval(ws.interval);
    ws.terminate();
  });
  ws.on("error", function() {
    console.log("Client error");
    clearInterval(ws.interval);
    ws.terminate();
  });
});
module.exports = router;
