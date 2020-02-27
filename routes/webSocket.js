const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
let dashboardInfo = null;

const FarmStatistics = require("../models/FarmStatistics.js");
const SystemInfo = require("../models/SystemInfo.js");
const runner = require("../runners/state.js");
const Runner = runner.Runner;

setInterval(async function() {
  //Only needed for WebSocket Information
  let printers = await Runner.returnFarmPrinters();
  let statistics = await FarmStatistics.find({});
  let printerInfo = [];
  let systemInformation = await SystemInfo.find({});
  for (let i = 0; i < printers.length; i++) {
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
      url: printers[i].ip + ":" + printers[i].port,
      settingsAppearance: printers[i].settingsApperance,
      stateColour: printers[i].stateColour,
      current: printers[i].current,
      options: printers[i].options
    };
    printerInfo.push(printer);
  }
  dashboardInfo = {
    printerInfo: printerInfo,
    currentOperations: statistics[0].currentOperations,
    currentOperationsCount: statistics[0].currentOperationsCount,
    farmInfo: statistics[0].farmInfo,
    octofarmStatistics: statistics[0].octofarmStatistics,
    printStatistics: statistics[0].printStatistics,
    systemInfo: systemInformation[0]
  };
}, 500);

let interval = null;

router.ws("/grab", function(ws, req) {
  ws.on("open", function open() {
    console.log("Client connected");
    ws.send(Date.now());
  });
  ws.on("message", function(msg) {
    if (msg === "hello") {
      try {
        ws.interval = setInterval(function() {
          console.log(ws.readyState);
          if (ws.readyState === 1) {
            ws.send(JSON.stringify(dashboardInfo));
          } else {
            clearInterval(ws.interval);
            ws.terminate();
          }
        }, 500);
      } catch (e) {
        console.log({
          error: e,
          message:
            "Client unexpectedly disconnected... stopping interval, refresh client to reconnect..."
        });
        ws.terminate();
      }
    }
  });
  ws.on("close", function() {
    console.log("Client close");
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
