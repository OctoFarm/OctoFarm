const Printers = require("../models/Printer.js");
const serverSettings = require("../settings/serverSettings.js");
const ServerSettings = serverSettings.ServerSettings;
const historyCollection = require("./history.js");
const HistoryCollection = historyCollection.HistoryCollection;
const fetch = require("node-fetch");
const _ = require("lodash");

let onlineRunners = [];
let offlineRunners = [];

class Runner {
  static async init() {
    console.log("Init Printers");

    //Grab all the printers,
    let farmPrinters = [];
    try {
      farmPrinters = await Printers.find({});
      console.log("Grabbed " + farmPrinters.length + " for checking");
    } catch (err) {
      let error = {
        err: err.message,
        action: "Database connection failed... No action taken",
        userAction:
          "Please make sure the database URL is inputted and can be reached... 'file located at: config/db.js'"
      };
      console.log(error);
    }
    //Loop through the printers
    try {
      for (let i = 0; i < farmPrinters.length; i++) {
        //Do inital connection attempt on printers
        let connectionTest = await Runner.testConnection(farmPrinters[i]);
        farmPrinters[i] = connectionTest.printer;
        //Do a full update of printer if current online...
        if (connectionTest.connect) {
          //Update the farmPrinters variable with updated information... then pass to checkers
          let getFiles = await Runner.getFiles(farmPrinters[i]);
          farmPrinters[i] = getFiles.printer;
          let getProfile = await Runner.getProfile(farmPrinters[i]);
          farmPrinters[i] = getProfile.printer;
          let getSettings = await Runner.getSettings(farmPrinters[i]);
          farmPrinters[i] = getSettings.printer;
          let getSystem = await Runner.getSystem(farmPrinters[i]);
          farmPrinters[i] = getSystem.printer;
        }

        console.log(
          "Printer " + i + " checked, state: " + farmPrinters[i].current.state
        );
        //Base the runners ready to get printers...
        onlineRunners[i] = false;
        offlineRunners[i] = false;
        //Make sure results are saved to db.
        farmPrinters[i].save();
      }
      //Send all printers to monitoring section
      console.log("Starting Monitoring...");
      for (let i = 0; i < farmPrinters.length; i++) {
        if (farmPrinters[i].current.state != "Offline") {
          Runner.setOnline(farmPrinters[i], i);
        } else {
          Runner.setOffline(farmPrinters[i], i);
        }
      }
    } catch (err) {
      let error = {
        err: err.message,
        //printer: printer.index + ". " + printer.ip + ":" + printer.port,
        action: "Failed to update printers state... No action taken",
        userAction:
          "Make sure your printer connection settings are type correctly..."
      };
      console.log(error);
    }
  }
  static async setOffline(printer, i) {
    console.log("Printer " + printer.index + " has gone offline");
    //Make sure only setting offline new offline printers
    if (offlineRunners[i] === false) {
      //Make sure online and offline intervals are not running for the printer.
      clearInterval(onlineRunners[i]);
      onlineRunners[i] = false;

      clearInterval(offlineRunners[i]);
      offlineRunners[i] = false;

      //Set the interval for checking status
      let Polling = await ServerSettings.check();
      if (Polling[0].offlinePolling.on) {
        offlineRunners[i] = setInterval(async function() {
          let connectionTest = await Runner.testConnection(printer);
          if (connectionTest.connect) {
            printer = connectionTest.printer;
            printer.save();
            //Set Online
            Runner.setOnline(printer, i);
          }
          //Else leave it in offline running...
        }, Polling[0].onlinePolling.seconds +
          Polling[0].offlinePolling.seconds);
      }
    }
  }
  static async setOnline(printer, i) {
    console.log("Printer " + printer.index + " has come online");
    //Make sure only setting offline new offline printers
    if (onlineRunners[i] === false) {
      //Make sure online and offline intervals are not running for the printer.
      clearInterval(onlineRunners[i]);
      onlineRunners[i] = false;

      clearInterval(offlineRunners[i]);
      onlineRunners[i] = false;

      //Set the interval for checking status
      let Polling = await ServerSettings.check();
      onlineRunners[i] = setInterval(async function() {
        let connectionTest = await Runner.testConnection(printer);

        if (connectionTest.connect) {
          printer = connectionTest.printer;
          if (printer.current.state === "Closed") {
            printer.save();
          } else {
            let getJob = await Runner.getJob(printer);
            printer = getJob.printer;

            if (printer.progress.completion === 100) {
              HistoryCollection.completed(printer);
            }
            if (
              printer.current.state === "Cancelling" &&
              printer.progress.completion < 100
            ) {
              HistoryCollection.failed(printer);
            }
            let getPrinter = await Runner.getPrinter(printer);
            printer = getPrinter.printer;
            printer.save();
          }
        } else {
          Runner.setOffline(printer, i);
          printer.save();
        }
      }, Polling[0].onlinePolling.seconds);
    }
  }
  static testConnection(printer) {
    return Runner.get(printer.ip, printer.port, printer.apikey, "connection")
      .then(res => {
        return res.json();
      })
      .then(res => {
        printer.current = res.current;
        printer.options = res.options;
        if (
          typeof printer.progress != "undefined" &&
          printer.progress.completion === 100 &&
          printer.current.state != "Closed"
        ) {
          printer.stateColour = this.getColour("Complete");
        } else {
          printer.stateColour = this.getColour(res.current.state);
        }
        let ret = {
          connect: true,
          printer: printer
        };
        return ret;
      })
      .catch(err => {
        let current = {
          state: "Offline",
          port: "",
          baudrate: "",
          printerProfile: ""
        };
        printer.current = current;
        printer.action = "Offline Checking...";
        printer.stateColour = this.getColour(current.state);
        let ret = {
          connect: false,
          printer: printer
        };
        return ret;
      });
  }

  static stopAll() {
    onlineRunners.forEach(run => {
      clearInterval(run);
      run = false;
    });
    offlineRunners.forEach(run => {
      clearInterval(run);
      run = false;
    });
  }

  static getFiles(printer) {
    return Runner.get(
      printer.ip,
      printer.port,
      printer.apikey,
      "files?recursive=true"
    )
      .then(res => {
        return res.json();
      })
      .then(res => {
        //Setup storage object
        printer.storage = {
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
              display: entry.display,
              name: entry.name,
              size: entry.size,
              time: timeStat
            };
            printerFiles.push(file);
          }
          let folderPaths = entry.path;
          if (isFolder) {
            if (entry.path.indexOf("/")) {
              printerLocations.push(folderPaths);
            } else {
              folderPaths = entry.path.substr(0, entry.path.lastIndexOf("/"));
              printerLocations.push(folderPaths);
            }
          }
          printer.fileList = {
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

        printer.action = "Grabbing Files...";

        let ret = {
          connect: true,
          printer: printer
        };
        return ret;
      })
      .catch(err => {
        let ret = {
          connect: false,
          printer: printer
        };
        return ret;
      });
  }
  static getJob(printer) {
    return Runner.get(printer.ip, printer.port, printer.apikey, "job")
      .then(res => {
        return res.json();
      })
      .then(res => {
        //Update info to db
        printer.job = res.job;
        printer.progress = res.progress;

        if (res.progress === 100) {
          printer.stateColour = this.getColour("Complete");
        }
        printer.action = "Grabbing Job...";
        let ret = {
          connect: true,
          printer: printer
        };
        return ret;
      })
      .catch(err => {
        let ret = {
          connect: false,
          printer: printer
        };
        return ret;
      });
  }
  static getPrinter(printer) {
    return Runner.get(
      printer.ip,
      printer.port,
      printer.apikey,
      "printer?exclude=sd,flags"
    )
      .then(res => {
        return res.json();
      })
      .then(res => {
        //Update info to DB
        printer.temperature = res.temperature;
        printer.action = "Grabbing Temperature History...";
        let ret = {
          connect: false,
          printer: printer
        };
        return ret;
      })
      .catch(err => {
        let ret = {
          connect: false,
          printer: printer
        };
        return ret;
      });
  }
  static getProfile(printer) {
    return Runner.get(
      printer.ip,
      printer.port,
      printer.apikey,
      "printerprofiles"
    )
      .then(res => {
        return res.json();
      })
      .then(res => {
        //Update info to DB
        printer.profiles = res.profiles;
        printer.action = "Grabbing Profile...";
        let ret = {
          connect: false,
          printer: printer
        };
        return ret;
      })
      .catch(err => {
        let ret = {
          connect: false,
          printer: printer
        };
        return ret;
      });
  }
  static getSettings(printer) {
    return Runner.get(printer.ip, printer.port, printer.apikey, "settings")
      .then(res => {
        return res.json();
      })
      .then(res => {
        //Update info to DB
        printer.action = "Grabbing Settings...";
        printer.settingsAPI = res.api;
        printer.settingsApperance = res.appearance;
        printer.settingsFeature = res.feature;
        printer.settingsFolder = res.folder;
        printer.settingsPlugins = res.plugins;
        printer.settingsScripts = res.scripts;
        printer.settingsSerial = res.serial;
        printer.settingsServer = res.server;
        printer.settingsSystem = res.system;
        printer.settingsWebcam = res.webcam;
        if (printer.camURL === "" || printer.camURL === null) {
          if (
            typeof res.webcam != "undefined" &&
            typeof res.webcam.streamURL != "undefined"
          ) {
            if (res.webcam.streamURL.includes("http")) {
              printer.camURL = res.webcam.streamURL;
            } else {
              printer.camURL = "http://" + printer.ip + streamURL;
            }
          }
        }
        let ret = {
          connect: false,
          printer: printer
        };
        return ret;
      })
      .catch(err => {
        let ret = {
          connect: false,
          printer: printer
        };
        return ret;
      });
  }
  static getSystem(printer) {
    return Runner.get(
      printer.ip,
      printer.port,
      printer.apikey,
      "system/commands"
    )
      .then(res => {
        return res.json();
      })
      .then(res => {
        //Update info to DB
        printer.core = res.core;
        printer.action = "";
        let ret = {
          connect: false,
          printer: printer
        };
        return ret;
      })
      .catch(err => {
        let ret = {
          connect: false,
          printer: printer
        };
        return ret;
      });
  }

  static get(ip, port, apikey, item) {
    let url = `http://${ip}:${port}/api/${item}`;
    return fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apikey
      }
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
    }
  }
  static timeout(value) {
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        reject(new Error("Printer Offline: Setting to offline search"));
      }, value);
    });
  }
}
module.exports = {
  Runner: Runner
};
