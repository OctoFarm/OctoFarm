
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

let farmPrinters = [];

let statRunner = null;
let farmStatRunner = null;

//Checking interval for information...
// setInterval(() => {
//   console.log(farmPrinters[0])
// }, 10000);

function WebSocketClient(){
  this.number = 0;	// Message number
  this.autoReconnectInterval = 5*1000;	// ms
}
WebSocketClient.prototype.open = async function(url, index){
  this.url = url;
  this.index = index;
  farmPrinters[this.index].webSocket = "trying";
  this.instance = new WebSocket(this.url);
  this.instance.on('open',()=>{
    this.onopen(this.index);
  });
  this.instance.on('message',(data,flags)=>{
    this.number ++;
    this.onmessage(data,flags,this.number, this.index);
  });
  this.instance.on('close',(e)=>{
    switch (e.code){
      case 1000:	// CLOSE_NORMAL
        console.log("WebSocket: closed");
        break;
      default:	// Abnormal closure
        this.reconnect(e);
        break;
    }
    this.onclose(e);
  });
  this.instance.on('error',(e)=>{
    switch (e.code){
      case 'ECONNREFUSED':
        console.error(e);
        try {
          farmPrinters[this.index].state = "Offline";
          farmPrinters[this.index].stateColour = Runner.getColour("Offline");
          farmPrinters[this.index].webSocket = "offline";
        }catch(e){
          console.log("Couldn't set state of missing printer, safe to ignore...")
        }
        this.reconnect(e);
        break;
      case 'ECONNRESET':
        console.error(e);
        try {
          farmPrinters[this.index].state = "Offline";
          farmPrinters[this.index].stateColour = Runner.getColour("Offline");
          farmPrinters[this.index].webSocket = "offline";
        }catch(e){
          console.log("Couldn't set state of missing printer, safe to ignore...")
        }
        this.reconnect(e);
        break;
      case 'EHOSTUNREACH':
        console.error(e);
        try {
          farmPrinters[this.index].state = "Shutdown";
          farmPrinters[this.index].stateColour = Runner.getColour("Shutdown");
          farmPrinters[this.index].webSocket = "offline";
        }catch(e){
          console.log("Couldn't set state of missing printer, safe to ignore...")
        }
        this.reconnect(e);
        break;
      default:
        console.error("Last error" + e);
        try {
          farmPrinters[this.index].state = "Shutdown";
          farmPrinters[this.index].stateColour = Runner.getColour("Shutdown");
          farmPrinters[this.index].webSocket = "offline";
        }catch(e){
          console.log("Couldn't set state of missing printer, safe to ignore...")
        }

        break;
    }
  });

  farmPrinters[this.index].state = "Searching...";
  farmPrinters[this.index].stateColour = Runner.getColour("Searching...");
  await Runner.getProfile(index);
  await Runner.getState(index);
  await Runner.getFiles(index, "files?recursive=true");
  await Runner.getSystem(index);
  await Runner.getSettings(index);
  let Polling = await ServerSettings.check();
  let data = {};
  let throt = {};
  data["auth"] = farmPrinters[this.index].currentUser + ":" + farmPrinters[this.index].apikey;
  throt["throttle"] = parseInt(
      (Polling[0].onlinePolling.seconds * 1000) / 500
  );
  setTimeout( async function(){
    await Runner.getProfile(that.index);
    await Runner.getState(that.index);
    await Runner.getFiles(that.index, "files?recursive=true");
    await Runner.getSystem(that.index);
    await Runner.getSettings(that.index);
  }, 15*1000);
  //Send User Auth
  try{
    this.instance.send(JSON.stringify(data));
    this.instance.send(JSON.stringify(throt));

  }catch (e){
    console.log("THIS FAILE")
    this.instance.emit('error',e);
  }
  let that = this;

  return true;
};
WebSocketClient.prototype.throttle = function(data){
  try{
    farmPrinters[this.index].ws.send(JSON.stringify(data));
  }catch (e){
    this.instance.emit('error',e);
  }
};
WebSocketClient.prototype.send = function(data,option){
  try{
    this.instance.send(data,option);
  }catch (e){
    this.instance.emit('error',e);
  }
};
WebSocketClient.prototype.reconnect = async function(e){
  console.log(`WebSocketClient: retry in ${this.autoReconnectInterval}ms`,e);
  this.instance.removeAllListeners();
  let that = this;
  setTimeout(function(){
    console.log("WebSocketClient: reconnecting...");
    that.open(that.url, that.index);
  },this.autoReconnectInterval);
  return true;
};
WebSocketClient.prototype.onopen = function(e){
  console.log("WebSocketClient: open",arguments);
  farmPrinters[this.index].webSocket = "online";
  farmPrinters[this.index].state = "Awaiting API..";
  farmPrinters[this.index].stateColour = Runner.getColour("Offline");
};
WebSocketClient.prototype.onmessage = async function(data,flags,number){

  //console.log("WebSocketClient: message",arguments);
  //Listen for print jobs
  data = await JSON.parse(data);
  if (typeof data.event != "undefined") {
    if (data.event.type === "PrintFailed") {
      console.log(data.event.type);
      //Register cancelled print...
      await HistoryCollection.failed(data.event.payload, farmPrinters[this.index]);
    }
    if (data.event.type === "PrintDone") {
      console.log(data.event.type);
      //Register cancelled print...
      await HistoryCollection.complete(data.event.payload, farmPrinters[this.index]);
    }
  }
  //Listen for printer status
  if (typeof data.current != "undefined") {
    if (data.current.state.text === "Offline") {
      data.current.state.text = "Closed";
    }else if(data.current.state.text.includes("Error:")){
      data.current.state.text = "Error!"
    }
    farmPrinters[this.index].state = data.current.state.text;
    farmPrinters[this.index].stateColour = Runner.getColour(data.current.state.text);
    farmPrinters[this.index].currentZ = data.current.currentZ;
    farmPrinters[this.index].progress = data.current.progress;
    farmPrinters[this.index].job = data.current.job;
    farmPrinters[this.index].logs = data.current.logs;
    //console.log(data.current.temps.length != 0);
    //console.log(data.current.temps);
    if (data.current.temps.length !== 0) {
      farmPrinters[this.index].temps = data.current.temps;
      //console.log(farmPrinters[1].temps);
    }
    if (
        data.current.progress.completion != null &&
        data.current.progress.completion === 100
    ) {
      farmPrinters[this.index].stateColour = Runner.getColour("Complete");
    } else {
      farmPrinters[this.index].stateColour = Runner.getColour(
          data.current.state.text
      );
    }
  }
};
WebSocketClient.prototype.onerror = function(e){
  console.log("WebSocketClient: error",arguments);
  this.instance.removeAllListeners();
};
WebSocketClient.prototype.onclose = function(e){
  console.log("WebSocketClient: closed",arguments);
  this.instance.removeAllListeners();
  return "closed";
};


class ClientAPI {
  static get(ip, port, apikey, item) {
    let url = `http://${ip}:${port}/api/${item}`;
      return Promise.race([
        fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apikey
          }
        }),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 1000)
        )
      ]);
  }

}

class Runner {
  static async init() {
    farmPrinters = [];
    statRunner = setInterval(function() {
      //Update Current Operations
      StatisticsCollection.currentOperations(farmPrinters);
      //Update farm information when we have temps
      StatisticsCollection.farmInformation(farmPrinters);
      //Update print statistics
      StatisticsCollection.printStatistics();
    }, 500);
    farmStatRunner = setInterval(function() {
      //Update farm statistics
      StatisticsCollection.octofarmStatistics(farmPrinters);
    }, 5000);

    //Grab printers from database....
    try {
      farmPrinters = await Printers.find({}, null, { sort: { index: 1 } });
      console.log("Grabbed " + farmPrinters.length + " for checking");
      for (let i = 0; i < farmPrinters.length; i++) {
        //Make sure runners are created ready for each printer to pass between...
        farmPrinters[i].state = "Searching...";
        farmPrinters[i].stateColour = Runner.getColour("Searching...");
        farmPrinters[i].webSocket = "offline";
      }
    } catch (err) {
      let error = {
        err: err.message,
        action: "Database connection failed... No action taken",
        userAction:
            "Please make sure the database URL is inputted and can be reached... 'file located at: config/db.js'"
      };
      console.log(error);
    }
    let stat = await StatisticsCollection.init();
    console.log(stat);

    //cycle through printers and move them to correct checking location...
    for (let i = 0; i < farmPrinters.length; i++) {
      //Make sure runners are created ready for each printer to pass between...
      farmPrinters[i].stepRate = 10;
      if (typeof farmPrinters[i].feedRate === "undefined") {
        farmPrinters[i].feedRate = 100;
      }
      if (typeof farmPrinters[i].flowRate === "undefined") {
        farmPrinters[i].flowRate = 100;
      }
      if (typeof farmPrinters[i].sortIndex === "undefined") {
        farmPrinters[i].sortIndex = i;
        farmPrinters[i].save();
      }
      //Setup websocket Client
      const ws = new WebSocketClient();
      farmPrinters[i].ws = ws;
      //Make a connection attempt, and grab current user.
      let users = null;
      try{
        users = await ClientAPI.get(farmPrinters[i].ip, farmPrinters[i].port, farmPrinters[i].apikey, "users");
      }catch(e){
        console.error("Couldn't grab initial connection for Printer: " + i, e)
        farmPrinters[i].state = "Shutdown";
        farmPrinters[i].stateColour = Runner.getColour("Shutdown");
        farmPrinters[i].webSocket = "offline";
        continue;
      }
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
        //Connection to API successful, gather initial data and setup websocket.
        await farmPrinters[i].ws.open(
            `ws://${farmPrinters[i].ip}:${farmPrinters[i].port}/sockjs/websocket`,
            i
        );
      } else {
        //hardfail, do not connect websockets...
        console.error("Couldn't grab initial connection for Printer: " + i)
        farmPrinters[i].state = "No-API";
        farmPrinters[i].stateColour = Runner.getColour("Shutdown");
        farmPrinters[i].webSocket = "offline";
      }
    }
    return (
        "System Runner has checked over " + farmPrinters.length + " printers..."
    );
  }
  static async reScanOcto(index) {
    let result = {
      status: null,
      msg: null
    };
    console.log(farmPrinters[index].webSocket)
    if(farmPrinters[index].webSocket === "offline"){
      farmPrinters[index].state = "Searching...";
      farmPrinters[index].stateColour = Runner.getColour("Searching...");
      farmPrinters[index].webSocket = "trying";
      //Make a connection attempt, and grab current user.
      let users = null;
      try{
        users = await ClientAPI.get(farmPrinters[index].ip, farmPrinters[index].port, farmPrinters[index].apikey, "users");
      }catch(e){
        console.error("Couldn't grab initial connection for Printer: " + index, e)
        farmPrinters[index].state = "Shutdown";
        farmPrinters[index].stateColour = Runner.getColour("Shutdown");
        farmPrinters[index].webSocket = "offline";
        result.status = "error";
        result.msg =
            "Printer: " +
            index +
            " has failed, is your octoprint online?";
        return result;
      }
      if (users.status === 200) {
        users = await users.json();
        if (_.isEmpty(users)) {
          farmPrinters[index].currentUser = "admin";
          farmPrinters[index].markModified("currentUser");
          farmPrinters[index].save();
        } else {
          users.users.forEach(user => {
            if (user.admin) {
              farmPrinters[index].currentUser = user.name;
              farmPrinters[index].markModified("currentUser");
              farmPrinters[index].save();
            }
          });
        }
        //Connection to API successful, gather initial data and setup websocket.
        await farmPrinters[index].ws.open(
            `ws://${farmPrinters[index].ip}:${farmPrinters[index].port}/sockjs/websocket`,
            index
        );
        result.status = "success";
        result.msg =
            "Printer: " +
            index +
            " has been re-synced with OctoPrint";
      } else {
        //hardfail, do not connect websockets...
        console.error("Couldn't grab initial connection for Printer: " + index)
        farmPrinters[index].state = "No-API Connection...";
        farmPrinters[index].stateColour = Runner.getColour("Shutdown");
        farmPrinters[index].webSocket = "offline";
        result.status = "error";
        result.msg =
            "Printer: " +
            index +
            " has failed, are your connection settings correct and CORS activated?";
      }

    }else if(farmPrinters[index].webSocket === "online"){
      await Runner.getProfile(index);
      await Runner.getFiles(index, "files?recursive=true");
      await Runner.getSystem(index);
      await Runner.getSettings(index);
      await Runner.getState(index);
      result.status = "success";
      result.msg =
          "Printer: " +
          index +
          " has been successfully re-synced with OctoPrint.";
    }else{
      result.status = "warning";
      result.msg =
          "Printer: " +
          index +
          " we are already attempting a connection!";
    }

    return result;
  }
  static async updatePoll() {
    for (let i = 0; i < farmPrinters.length; i++) {
      let Polling = await ServerSettings.check();
      let throt = {};
      throt["throttle"] = parseInt(
        (Polling[0].onlinePolling.seconds * 1000) / 500
      );
      await farmPrinters[i].ws.throttle(JSON.stringify(throt));
    }
    return "updated";
  }
  static async reset() {
    clearInterval(farmStatRunner);
    clearInterval(statRunner);
    for (let i = 0; i < farmPrinters.length; i++) {
      await farmPrinters[i].ws.instance.close();
    }

    return "update";
  }




  static getFiles(index, location) {
    //Shim to fix undefined on upload files/folders
    farmPrinters[index].fileList = {
      files: [],
      fileCount: 0,
      folders: [],
      folderCount: 0
    };
    return ClientAPI.get(
      farmPrinters[index].ip,
      farmPrinters[index].port,
      farmPrinters[index].apikey,
      location
    )
      .then(res => {
        return res.json();
      })
      .then(res => {
        console.log("Grabbed files for Printer: " + index);
        //Setup storage object
        farmPrinters[index].storage = {
          free: res.free,
          total: res.total
        };

        //Setup logcations object
        let printerFiles = [];
        let printerLocations = [];
        let recursivelyPrintNames = function(entry, depth) {
          depth = depth || 0;
          let timeStat = "";
          let isFolder = entry.type === "folder";
          if (!isFolder) {
            if (entry.gcodeAnalysis !== undefined) {
              if (entry.gcodeAnalysis.estimatedPrintTime !== undefined) {
                timeStat = entry.gcodeAnalysis.estimatedPrintTime;
              } else {
                timeStat = "No Time Estimate";
              }
            } else {
              timeStat = "No Time Estimate";
            }
            let path = null;
            if (entry.path.indexOf("/") > -1) {
              path = entry.path.substr(0, entry.path.lastIndexOf("/"));
            } else {
              path = "local";
            }
            let file = {
              path: path,
              fullPath: entry.path,
              display: entry.display,
              name: entry.name,
              size: entry.size,
              time: timeStat
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
        if (typeof res.files !== undefined) {
          _.each(res.files, function(entry) {
            recursivelyPrintNames(entry);
          });
        } else {
          let timeStat = null;
          if (res.gcodeAnalysis !== undefined) {
            if (res.gcodeAnalysis.estimatedPrintTime !== undefined) {
              timeStat = res.gcodeAnalysis.estimatedPrintTime;
            } else {
              timeStat = "No Time Estimate";
            }
          } else {
            timeStat = "No Time Estimate";
          }
          let path = null;
          if (res.path.indexOf("/") > -1) {
            path = res.path.substr(0, res.path.lastIndexOf("/"));
          } else {
            path = "local";
          }

          let file = {
            path: path,
            fullPath: res.path,
            display: res.display,
            name: res.name,
            size: res.size,
            time: timeStat
          };
          let replace = _.findIndex(
            farmPrinters[index].fileList.files,
            function(o) {
              return o.fullPath === file.fullPath;
            }
          );
          farmPrinters[index].fileList.files.splice(replace, 1, file);
        }
      })
      .catch(err => {
        //console.log("Error grabbing Printer: "+ index + "files - " + err);
        return false;
      });
  }
  static getState(index) {
    return ClientAPI.get(
      farmPrinters[index].ip,
      farmPrinters[index].port,
      farmPrinters[index].apikey,
      "connection"
    )
      .then(res => {
        return res.json();
      })
      .then(res => {
        //Update info to DB
        if (res.current.state === "Offline") {
          res.current.state = "Closed";
        }else if(res.current.state.includes("Error:")){
          res.current.state = "Error!"
        }
        farmPrinters[index].state = res.current.state;
        farmPrinters[index].stateColour = Runner.getColour(res.current.state);
        farmPrinters[index].current = res.current;
        farmPrinters[index].options = res.options;
        console.log("Grabbed state for Printer: " + index);
      })
      .catch(err => {
        //console.log("Error grabbing Printer: "+ index + "state - " + err);
        return false;
      });
  }
  static getProfile(index) {

    return ClientAPI.get(
      farmPrinters[index].ip,
      farmPrinters[index].port,
      farmPrinters[index].apikey,
      "printerprofiles"
    )
      .then(res => {
        return res.json();
      })
      .then(res => {
        //Update info to DB
        farmPrinters[index].profiles = res.profiles;
        console.log("Grabbed profiles for Printer:" + index);
      })
      .catch(err => {
        //console.log("Error grabbing Printer: "+ index + "profiles - " + err);
        return false;
      });
  }
  static getSettings(index) {
    return ClientAPI.get(
      farmPrinters[index].ip,
      farmPrinters[index].port,
      farmPrinters[index].apikey,
      "settings"
    )
      .then(res => {
        return res.json();
      })
      .then(async res => {
        //Update info to DB
        farmPrinters[index].settingsApi = res.api;
        farmPrinters[index].settingsApperance = res.appearance;
        let printer = await Printers.findOne({ index: index });
        printer.settingsApperance = farmPrinters[index].settingsApperance;
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
          farmPrinters[index].camURL === null
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
                farmPrinters[index].ip +
                ":" +
                farmPrinters[index].port +
                res.webcam.streamUrl;
            }
            let printer = await Printers.findOne({ index: index });
            printer.camURL = farmPrinters[index].camURL;
            printer.save();

          }
          console.log("Grabbed settings for Printer:" + index);
        }
      })
      .catch(err => {
        //console.log("Error grabbing Printer: "+ index + "settings - " + err);
        return false;
      });
  }
  static getSystem(index) {
    return ClientAPI.get(
      farmPrinters[index].ip,
      farmPrinters[index].port,
      farmPrinters[index].apikey,
      "system/commands"
    )
      .then(res => {
        return res.json();
      })
      .then(res => {
        //Update info to DB
        farmPrinters[index].core = res.core;
        console.log("Grabbed system for Printer: " + index);
      })
      .catch(err => {
        //console.log("Error grabbing Printer: "+ index + "system - " + err);
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
    } else if (state === "Error") {
      return { name: "danger", hex: "#2e0905", category: "Idle" };
    } else if (state === "Offline") {
      return { name: "danger", hex: "#2e0905", category: "Offline" };
    } else if (state === "Searching...") {
      return { name: "danger", hex: "#2e0905", category: "Offline" };
    } else if (state === "Closed") {
      return { name: "danger", hex: "#2e0905", category: "Closed" };
    } else if (state === "Complete") {
      return { name: "success", hex: "#00330e", category: "Complete" };
    } else if (state === "Shutdown") {
      return { name: "danger", hex: "#00330e", category: "Offline" };
    }else if (state === "Please Re-Sync") {
      return { name: "danger", hex: "#00330e", category: "Offline" };
    }else{
      return { name: "danger", hex: "#00330e", category: "Searching..." };
    }
  }
  static returnFarmPrinters() {
    return farmPrinters;
  }
  static async removeFile(i, fullPath) {
    let index = await _.findIndex(farmPrinters[i].fileList.files, function(o) {
      return o.fullPath === fullPath;
    });
    farmPrinters[i].fileList.files.splice(index, 1);
    farmPrinters[i].fileList.fileCount = farmPrinters[i].fileList.files.length;
  }
  static returnFileList(i) {
    return farmPrinters[i].fileList;
  }
  static returnStorage(i) {
    return farmPrinters[i].storage;
  }
  static async reSyncFile(i) {
    //Doesn't actually resync just the file... shhh
    let success = await Runner.getFiles(i, "files?recursive=true");
    if (success) {
      return success;
    } else {
      return false;
    }
  }
  static async flowRate(i, newRate) {
    farmPrinters[i].flowRate = newRate;
    let printer = await Printers.findOne({ index: i });
    printer.flowRate = farmPrinters[i].flowRate;
    printer.save();
  }
  static async feedRate(i, newRate) {
    farmPrinters[i].feedRate = newRate;
    let printer = await Printers.findOne({ index: i });
    printer.feedRate = farmPrinters[i].feedRate;
    printer.save();
  }
  static async updateSortIndex(list) {
    //Update the live information
    for (let i = 0; i < farmPrinters.length; i++) {
      farmPrinters[list[i]].sortIndex = i;
      let printer = await Printers.findOne({ index: list[i] });
      printer.sortIndex = i;
      printer.save();
    }
    //Update database...
  }
  static stepRate(i, newRate) {
    farmPrinters[i].stepRate = newRate;
  }
  static async updateSettings(i, opts) {
    farmPrinters[i].settingsScripts.gcode = opts.scripts.gcode;
    farmPrinters[i].settingsApperance.name = opts.appearance.name;
    farmPrinters[i].settingsWebcam = opts.webcam;
    farmPrinters[i].camURL = opts.camURL;
    let printer = await Printers.findOne({ index: i });
    printer.settingsWebcam = farmPrinters[i].settingsWebcam;
    printer.camURL = farmPrinters[i].camURL;
    printer.settingsApperance.name = farmPrinters[i].settingsApperance.name;
    printer.save();
  }
  //Keeping just in case but shouldn't be required...
  // static async selectFilament(i, filament) {
  //   farmPrinters[i].selectedFilament = filament;
  //   let printer = await Printers.findOne({ index: i });
  //   printer.selectedFilament = farmPrinters[i].selectedFilament;
  //   printer.save();
  // }
  static moveFile(i, newPath, fullPath, filename) {
    let file = _.findIndex(farmPrinters[i].fileList.files, function(o) {
      return o.name === filename;
    });
    //farmPrinters[i].fileList.files[file].path = newPath;
    farmPrinters[i].fileList.files[file].path = newPath;
    farmPrinters[i].fileList.files[file].fullPath = fullPath;
  }
  static moveFolder(i, oldFolder, fullPath, folderName) {
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
  static deleteFolder(i, fullPath) {
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
    let i = folder.i;
    let path = "local";
    if (folder.path !== "") {
      path = folder.path;
    }
    let newFolder = {
      name: folder.foldername,
      path: path
    };
    farmPrinters[i].fileList.folders.push(newFolder);
    farmPrinters[i].fileList.folderCount =
      farmPrinters[i].fileList.folders.length;
  }
  static async selectedFilament(filament) {
    if (filament.id === "") {
      farmPrinters[filament.index].selectedFilament = {
        id: null,
        name: null,
        type: null,
        colour: null,
        manufacturer: null
      };
    } else {
      let rolls = await Filament.findOne({ _id: filament.id });
      farmPrinters[filament.index].selectedFilament = {
        id: filament.id,
        name: rolls.roll.name,
        type: rolls.roll.type,
        colour: rolls.roll.colour,
        manufacturer: rolls.roll.manufacturer
      };
    }
    let printer = await Printers.findOne({ index: filament.index });
    printer.selectedFilament = farmPrinters[filament.index].selectedFilament;
    printer.save();
    return farmPrinters[filament.index].selectedFilament;
  }
  static newFile(file) {
    let i = file.index;

    file = file.files.local;
    let path = "";
    if (file.path.indexOf("/") > -1) {
      path = file.path.substr(0, file.path.lastIndexOf("/"));
    } else {
      path = "local";
    }
    let data = {
      path: path,
      fullPath: file.path,
      display: file.name,
      name: file.name,
      size: null,
      time: null
    };
    farmPrinters[i].fileList.files.push(data);
  }
  static sortedIndex() {
    let sorted = [];
    farmPrinters.forEach(p => {
      let sort = {
        sortIndex: p.sortIndex,
        actualIndex: p.index
      };
      sorted.push(sort);
    });
    sorted.sort((a, b) => (a.sortIndex > b.sortIndex ? 1 : -1));
    return sorted;
  }
}

module.exports = {
  Runner: Runner
};
