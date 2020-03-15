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
let webSockets = [];

let statRunner = null;

function WebSocketClient() {
  this.number = 0; // Message number

  this.autoReconnectInterval = 5 * 1000; // ms
}
WebSocketClient.prototype.open = function(url) {
  this.url = url;
  this.instance = new WebSocket(this.url);
  this.instance.on("open", () => {
    this.onopen();
  });
  this.instance.on("message", (data, flags) => {
    this.number++;
    this.onmessage(data, flags, this.number);
  });
  this.instance.on("close", e => {
    switch (e.code) {
      case 1000: // CLOSE_NORMAL
        //console.log("WebSocket: closed");
        break;
      default:
        // Abnormal closure
        this.reconnect(e);
        break;
    }
    this.onclose(e);
  });
  this.instance.on("error", e => {
    switch (e.code) {
      case "ECONNREFUSED":
        this.reconnect(e);
        break;
      default:
        this.onerror(e);
        break;
    }
  });
};
WebSocketClient.prototype.send = function(data, option) {
  try {
    this.instance.send(data, option);
  } catch (e) {
    this.instance.emit("error", e);
  }
};
WebSocketClient.prototype.reconnect = function(e) {
  // console.log(`WebSocketClient: retry in ${this.autoReconnectInterval}ms`,e);
  this.instance.removeAllListeners();
  var that = this;
  setTimeout(function() {
    //console.log("WebSocketClient: reconnecting...");
    that.open(that.url);
  }, this.autoReconnectInterval);
};
WebSocketClient.prototype.terminate = async function(e) {
  if (this.instance.readyState === 1) {
    this.instance.removeAllListeners();
    this.instance.close();
  }
  return;
};
WebSocketClient.prototype.onopen = function(e) {};
WebSocketClient.prototype.onmessage = function(data, flags, number) {};
WebSocketClient.prototype.onerror = function(e) {};
WebSocketClient.prototype.onclose = function(e) {};

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

class ClientSocket {
  static async connect(index, ip, port, apikey) {
    let client = {
      index: index,
      ws: {},
      currentUser: "",
      apikey: apikey
    };
    const ws = new WebSocketClient();
    try {
      let users = await ClientAPI.get(ip, port, apikey, "users");
      if (users.status === 200) {
        users = await users.json();
        console.log(index + ": Grabbing State..");
        await Runner.getState(index);
        console.log(index + ": Grabbing File List...");
        await Runner.getFiles(index, "files?recursive=true");
        console.log(index + ": Grabbing System Information...");
        await Runner.getSystem(index);
        console.log(index + ": Grabbing System Settings...");
        await Runner.getSettings(index);
        console.log(index + ": Grabbing Printer Profiles...");
        await Runner.getProfile(index);
      } else {
        users = {};
      }
      let currentUser = "";
      if (_.isEmpty(users)) {
        currentUser = "admin";
      } else {
        users.users.forEach(user => {
          if (user.admin) {
            currentUser = user.name;
          }
        });
      }
      client = {
        index: index,
        ws: ws,
        currentUser: currentUser,
        apikey: apikey
      };
      return client;
    } catch (err) {
      client = {
        index: index,
        ws: ws,
        currentUser: "",
        apikey: apikey,
        error: {
          err: err.message,
          action: "Client connection failed",
          userAction:
            "Some error with intitial connection, please restart server... Offline / Online printers should pass this..."
        }
      };
      return client;
    }
  }
}

class Runner {
  static async init() {
    statRunner = setInterval(function() {
      //Update Current Operations
      StatisticsCollection.currentOperations(farmPrinters);
      //Update farm information when we have temps
      StatisticsCollection.farmInformation(farmPrinters);
      //Update farm statistics
      StatisticsCollection.octofarmStatistics(farmPrinters);
      //Update print statistics
      StatisticsCollection.printStatistics();
    }, 500);
    //Grab printers from database....
    try {
      farmPrinters = await Printers.find({}, null, { sort: { index: 1 } });
      console.log("Grabbed " + farmPrinters.length + " for checking");
      for (let i = 0; i < farmPrinters.length; i++) {
        //Make sure runners are created ready for each printer to pass between...
        farmPrinters[i].state = "Searching...";
        farmPrinters[i].stateColour = Runner.getColour("Searching...");
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
      console.log("Checking for printer: " + i);
      farmPrinters[i].state = "Offline";
      farmPrinters[i].stateColour = Runner.getColour("Offline");
      farmPrinters[i].stepRate = 10;
      if (typeof farmPrinters[i].feedRate === "undefined") {
        farmPrinters[i].feedRate = 100;
      }
      if (typeof farmPrinters[i].flowRate === "undefined") {
        farmPrinters[i].flowRate = 100;
      }
      webSockets[i] = await ClientSocket.connect(
        farmPrinters[i].index,
        farmPrinters[i].ip,
        farmPrinters[i].port,
        farmPrinters[i].apikey
      );
      Runner.setupClient(i);
    }
    return (
      "System Runner has checked over " + farmPrinters.length + " printers..."
    );
  }
  static async setupClient(i) {
    console.log("Printer: " + webSockets[i].index + " is been setup...");
    await Runner.getState(i);
    webSockets[i].ws.open(
      `ws://${farmPrinters[i].ip}:${farmPrinters[i].port}/sockjs/websocket`
    );
    webSockets[i].ws.onopen = async function(e) {
      //Make sure to get current printer status...
      await Runner.getState(i);
      let Polling = await ServerSettings.check();
      var data = {};
      data["auth"] = webSockets[i].currentUser + ":" + webSockets[i].apikey;
      webSockets[i].ws.send(JSON.stringify(data));
      // var throt = {};
      // throt["throttle"] = parseInt(
      //   (Polling[0].onlinePolling.seconds * 1000) / 500
      // );
      // webSockets[i].ws.send(JSON.stringify(throt));
    };
    webSockets[i].ws.onmessage = async function(data, flags, number) {
      data = await JSON.parse(data);

      if (typeof data.event != "undefined") {
        if (data.event.type === "PrintFailed") {
          console.log(data.event.type);
          //Register cancelled print...
          HistoryCollection.failed(data.event.payload, farmPrinters[i]);
          //
        }
        if (data.event.type === "PrintDone") {
          console.log(data.event.type);
          //Register cancelled print...
          HistoryCollection.complete(data.event.payload, farmPrinters[i]);
        }
      }
      if (typeof data.current != "undefined") {
        try {
          if (data.current.state.text.includes("Offline")) {
            data.current.state.text = "Closed";
          }
          farmPrinters[i].state = data.current.state.text;
          farmPrinters[i].current.state = data.current.state.text;
          farmPrinters[i].currentZ = data.current.currentZ;
          farmPrinters[i].progress = data.current.progress;
          farmPrinters[i].job = data.current.job;
          farmPrinters[i].logs = data.current.logs;
          //console.log(data.current.temps.length != 0);
          //console.log(data.current.temps);
          if (data.current.temps.length != 0) {
            farmPrinters[i].temps = data.current.temps;
            //console.log(farmPrinters[1].temps);
          }

          if (
            data.current.progress.completion != null &&
            data.current.progress.completion === 100
          ) {
            farmPrinters[i].stateColour = Runner.getColour("Complete");
          } else {
            farmPrinters[i].stateColour = Runner.getColour(
              data.current.state.text
            );
          }
        } catch (err) {
          let error = {
            err: err.message,
            action: "Failed to update current printer set...",
            userAction:
              "This should be safe to ignore if you've just updated your printer list from an old one..."
          };
          console.log(error);
        }
      }
    };
    webSockets[i].ws.onerror = async function(data, flags, number) {
      try {
        farmPrinters[i].current = {
          state: "Offline",
          baudrate: 250000,
          port: null,
          printerProfile: "_default"
        };
        farmPrinters[i].state = "Offline";
        farmPrinters[i].stateColour = Runner.getColour("Offline");
      } catch (err) {
        let error = {
          err: err.message,
          action: "Failed to update current printer set...",
          userAction:
            "This should be safe to ignore if you've just updated your printer list from an old one..."
        };
        console.log(error);
      }
    };
    webSockets[i].ws.onclose = async function(data, flags, number) {
      try {
        farmPrinters[i].current = {
          state: "Offline",
          baudrate: 250000,
          port: null,
          printerProfile: "_default"
        };
        farmPrinters[i].state = "Offline";
        farmPrinters[i].stateColour = Runner.getColour("Offline");
      } catch (err) {
        let error = {
          err: err.message,
          action: "Failed to update current printer set...",
          userAction:
            "This should be safe to ignore if you've just updated your printer list from an old one..."
        };
        console.log(error);
      }
    };
  }

  static async reset() {
    for (let i = 0; i < webSockets.length; i++) {
      await webSockets[i].ws.terminate();
    }
    webSockets = [];
    farmPrinters = [];
    return;
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
            let path = "";
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
        if (res.files != undefined) {
          _.each(res.files, function(entry) {
            recursivelyPrintNames(entry);
          });
          return true;
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
          let path = "";
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
              return o.fullPath == file.fullPath;
            }
          );
          farmPrinters[index].fileList.files.splice(replace, 1, file);
          return true;
        }
      })
      .catch(err => {
        console.log("Error grabbing files" + err);
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
        farmPrinters[index].state = res.current.state;
        farmPrinters[index].stateColour = Runner.getColour(res.current.state);
        farmPrinters[index].current = res.current;
        farmPrinters[index].options = res.options;
      })
      .catch(err => console.log("Error grabbing state"));
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
      })
      .catch(err => console.log("Error grabbing profiles"));
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
      .then(res => {
        //Update info to DB
        farmPrinters[index].settingsApi = res.api;
        farmPrinters[index].settingsApperance = res.appearance;
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
            typeof res.webcam.streamURL != "undefined"
          ) {
            if (res.webcam.streamURL.includes("http")) {
              farmPrinters[index].camURL = res.webcam.streamURL;
            } else {
              farmPrinters[index].camURL =
                "http://" +
                farmPrinters[index].ip +
                ":" +
                farmPrinters[index].port +
                streamURL;
            }
          }
        }
      })
      .catch(err => console.log("Error grabbing Settings" + err));
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
      })
      .catch(err => console.log("Error grabbing System"));
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
    } else {
      return { name: "danger", hex: "#00330e", category: "Searching..." };
    }
  }
  static returnFarmPrinters() {
    return farmPrinters;
  }
  static async removeFile(i, fullPath) {
    let index = await _.findIndex(farmPrinters[i].fileList.files, function(o) {
      return o.fullPath == fullPath;
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
  static async reSyncFile(i, file) {
    let success = null;
    //Doesn't actually resync just the file... shhh
    success = await Runner.getFiles(i, "files?recursive=true");
    if (success) {
      return success;
    } else {
      return false;
    }
  }
  static flowRate(i, newRate) {
    farmPrinters[i].flowRate = newRate;
  }
  static feedRate(i, newRate) {
    farmPrinters[i].feedRate = newRate;
  }
  static stepRate(i, newRate) {
    farmPrinters[i].stepRate = newRate;
  }
  static updateSettings(i, opts) {
    farmPrinters[i].settingsScripts.gcode = opts.scripts.gcode;
    farmPrinters[i].settingsApperance.name = opts.appearance.name;
    farmPrinters[i].settingsWebcam = opts.webcam;
    farmPrinters[i].camURL = opts.camURL;
  }
  static selectFilament(i, filament) {
    farmPrinters[i].selectedFilament = filament;
  }
  static moveFile(i, newPath, fullPath, filename) {
    let file = _.findIndex(farmPrinters[i].fileList.files, function(o) {
      return o.name == filename;
    });
    //farmPrinters[i].fileList.files[file].path = newPath;
    farmPrinters[i].fileList.files[file].path = newPath;
    farmPrinters[i].fileList.files[file].fullPath = fullPath;
  }
  static moveFolder(i, oldFolder, fullPath, folderName) {
    let file = _.findIndex(farmPrinters[i].fileList.folders, function(o) {
      return o.name == oldFolder;
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
      return o.name == fullPath;
    });
    farmPrinters[i].fileList.folders.splice(folder, 1);
    farmPrinters[i].fileList.fileCount = farmPrinters[i].fileList.files.length;
    farmPrinters[i].fileList.folderCount =
      farmPrinters[i].fileList.folders.length;
  }
  static newFolder(folder) {
    let i = folder.i;
    let path = "local";
    if (folder.path != "") {
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
  static async selectFilament(filament) {
    let rolls = await Filament.findOne({ _id: filament.id });

    farmPrinters[filament.index].selectedFilament = {
      id: rolls.roll.id,
      name: rolls.roll.name,
      type: rolls.roll.type,
      colour: rolls.roll.colour,
      manufacturer: rolls.roll.manufacturer,
      cost: rolls.roll.cost
    };
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
}

module.exports = {
  Runner: Runner
};
