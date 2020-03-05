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

let offlineRunners = [];
let onlineRunners = [];
let farmPrinters = [];

let statRunner = null;

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
      const ws = new WebSocket(`ws://${ip}:${port}/sockjs/websocket`);
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
        ws: {},
        currentUser: "",
        apikey: apikey,
        error: {
          err: err.message,
          action: "Client connection failed",
          userAction:
            "Could not get initial connection to client, pushing client to offline checking..."
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
      offlineRunners[i] = false;
      farmPrinters[i].state = "Offline";
      farmPrinters[i].stateColour = Runner.getColour("Offline");
      farmPrinters[i].stepRate = 10;
      if (typeof farmPrinters[i].feedRate === "undefined") {
        farmPrinters[i].feedRate = 100;
      }
      if (typeof farmPrinters[i].flowRate === "undefined") {
        farmPrinters[i].flowRate = 100;
      }

      let client = await ClientSocket.connect(
        farmPrinters[i].index,
        farmPrinters[i].ip,
        farmPrinters[i].port,
        farmPrinters[i].apikey
      );
      if (typeof client.error === "undefined") {
        Runner.setOnline(client);
      } else {
        Runner.setOffline(client);
      }
    }
    return (
      "System Runner has checked over " + farmPrinters.length + " printers..."
    );
  }
  static async setOnline(client) {
    console.log("Printer: " + client.index + " is online");
    //Make sure offline is clear
    clearInterval(offlineRunners[client.index]);
    offlineRunners[client.index] = false;
    onlineRunners[client.index] = client;
    //Create socket listeners
    let Polling = await ServerSettings.check();

    onlineRunners[client.index].ws.on("open", function open() {
      var data = {};
      data["auth"] =
        onlineRunners[client.index].currentUser +
        ":" +
        onlineRunners[client.index].apikey;
      onlineRunners[client.index].ws.send(JSON.stringify(data));
      var throt = {};
      throt["throttle"] = parseInt(
        (Polling[0].onlinePolling.seconds * 1000) / 500
      );
      onlineRunners[client.index].ws.send(JSON.stringify(throt));
    });
    onlineRunners[client.index].ws.on("message", async function incoming(data) {
      data = await JSON.parse(data);
      if (typeof data.event != "undefined") {
        if (data.event.type === "PrintFailed") {
          //Register cancelled print...
          HistoryCollection.failed(
            data.event.payload,
            farmPrinters[client.index]
          );
          //
        }
        if (data.event.type === "PrintDone") {
          //Register cancelled print...
          HistoryCollection.complete(
            data.event.payload,
            farmPrinters[client.index]
          );
        }
      }
      if (typeof data.current != "undefined") {
        if (data.current.state.text.includes("Offline")) {
          data.current.state.text = "Closed";
        }
        farmPrinters[client.index].state = data.current.state.text;
        farmPrinters[client.index].currentZ = data.current.currentZ;
        farmPrinters[client.index].progress = data.current.progress;
        farmPrinters[client.index].job = data.current.job;
        farmPrinters[client.index].logs = data.current.logs;
        //console.log(data.current.temps.length != 0);
        //console.log(data.current.temps);
        if (data.current.temps.length != 0) {
          farmPrinters[client.index].temps = data.current.temps;
        }

        if (
          data.current.progress.completion != null &&
          data.current.progress.completion === 100
        ) {
          farmPrinters[client.index].stateColour = Runner.getColour("Complete");
        } else {
          farmPrinters[client.index].stateColour = Runner.getColour(
            data.current.state.text
          );
        }
      }
    });
    onlineRunners[client.index].ws.on("error", async function incoming(data) {
      onlineRunners[client.index].ws.close();
      onlineRunners[client.index].ws.terminate();
      onlineRunners[client.index] = false;
      Runner.setOffline(ClipboardEvent);
    });
    onlineRunners[client.index].ws.on("close", async function incoming(data) {
      onlineRunners[client.index].ws.close();
      onlineRunners[client.index].ws.terminate();
      onlineRunners[client.index] = false;
      Runner.setOffline(client);

      //Make connection attempt...
      //Increment how many attempts
      //If over 5 attempts made and failed then class the device offline
    });
  }
  static async setOffline(client) {
    console.log("Printer: " + client.index + " is offline");
    farmPrinters[client.index].state = "Offline";
    farmPrinters[client.index].stateColour = Runner.getColour("Offline");
    //Make sure offline isn't already running
    if (offlineRunners[client.index] === false) {
      let Polling = await ServerSettings.check();
      if (Polling[0].offlinePolling.on) {
        offlineRunners[client.index] = setInterval(async function() {
          let clientNew = await ClientSocket.connect(
            farmPrinters[client.index].index,
            farmPrinters[client.index].ip,
            farmPrinters[client.index].port,
            farmPrinters[client.index].apikey
          );
          if (typeof clientNew.error === "undefined") {
            Runner.setOnline(clientNew);
          }
        }, Polling[0].offlinePolling.seconds);
      }
    } else {
      let clientNew = await ClientSocket.connect(
        farmPrinters[client.index].index,
        farmPrinters[client.index].ip,
        farmPrinters[client.index].port,
        farmPrinters[client.index].apikey
      );
      if (typeof clientNew.error === "undefined") {
        Runner.setOnline(clientNew);
      }
    }
  }

  static async stopAll() {
    console.log("Stopping statistics collection...");
    clearInterval(statRunner);
    await StatisticsCollection.stop();
    console.log("Stopped statistic collection");
    farmPrinters.forEach((run, index) => {
      farmPrinters[index].state = "Searching...";
      farmPrinters[index].stateColour = Runner.getColour("Searching...");
    });
    offlineRunners.forEach((run, index) => {
      console.log("Offline Printer: " + [index] + " stopped");
      clearInterval(run);
      run = false;
    });
    return;
  }
  static getFiles(index, location) {
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
  }
  static returnFileList(i) {
    return farmPrinters[i].fileList;
  }
  static returnStorage(i) {
    return farmPrinters[i].storage;
  }
  static async reSyncFile(i, file) {
    let success = null;
    if (file != undefined) {
      success = await Runner.getFiles(i, "files/local/" + file);
    } else {
      success = await Runner.getFiles(i, "files?recursive=true");
    }
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
}

module.exports = {
  Runner: Runner
};
