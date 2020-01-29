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
  static init() {
    Printers.find({}, (err, printers) => {
      printers.forEach(printer => {
        Runner.getConnection(printer);
      });
    });
  }
  static stopAll() {
    onlineRunners.forEach(run => {
      clearInterval(run);
    });
    offlineRunners.forEach(run => {
      clearInterval(run);
    });
  }
  static setOffline(printer) {
    let current = {
      state: "Offline",
      port: "",
      baudrate: "",
      printerProfile: ""
    };

    printer.current = current;
    printer.action = "Offline Checking...";
    printer.stateColour = this.getColour(current.state);
    printer
      .save()
      .then(res => {
        //Make sure printer not online
        clearInterval(onlineRunners[printer.index]);
        onlineRunners[printer.index] = false;
        //Make sure printer not offline
        clearInterval(offlineRunners[printer.index]);
        offlineRunners[printer.index] = false;
        //Set offline
        ServerSettings.check().then(checked => {
          if (checked[0].offlinePolling.on === true) {
            offlineRunners[printer.index] = setInterval(function() {
              Runner.getConnection(printer);
            }, checked[0].offlinePolling.seconds);
            console.log(
              "Set offline check with: " + printer.ip + ":" + printer.port
            );
          } else {
            console.log(
              "Offline Polling is disabled in settings, enable if required."
            );
          }
        });
      })
      .catch(err => {
        let error = {
          err: err.message,
          printer: printer.index + ". " + printer.ip + ":" + printer.port,
          action: "Database connection failed... No action taken"
        };
        console.log(error);
      });
  }

  static setOnline(printer) {
    //Make sure printer not offline
    clearInterval(offlineRunners[printer.index]);
    offlineRunners[printer.index] = false;
    //Make sure printer not online
    clearInterval(onlineRunners[printer.index]);
    onlineRunners[printer.index] = false;
    //Set Online
    ServerSettings.check().then(checked => {
      onlineRunners[printer.index] = setInterval(function() {
        Runner.checkOnline(printer);
      }, checked[0].onlinePolling.seconds);
      console.log("Set online check with: " + printer.ip + ":" + printer.port);
    });
  }

  static checkOnline(printer) {
    if (printer.current.state === "Closed") {
      Runner.testConnection(printer).then(printer => {
        if(printer.current.state === "Closed"){
          printer.save();
        }
      })
    } else {
      Runner.testConnection(printer).then(printer => {
        Runner.getPrinter(printer).then(printer => {
          Runner.getJob(printer).then(printer => {
            printer.save().catch(err => {
              let error = {
                err: err.message,
                printer: printer.index + ". " + printer.ip + ":" + printer.port,
                action: "Error saving online to database... No action taken"
              };
              console.log(error);
            });
            if (printer.stateColour.category === "Complete"){
              HistoryCollection.watcher(printer)
            }
          });
        });
      });
    }
  }

  static getConnection(printer) {
    Promise.race([
      Runner.timeout(3000),
      Runner.get(printer.ip, printer.port, printer.apikey, "connection")
        .then(res => {
          return res.json();
        })
        .then(res => {
          printer.current = res.current;
          printer.options = res.options;
          printer.stateColour = this.getColour(res.current.state);
          //Check if online printer has information.
          if (printer.inited === false) {
            Runner.getFiles(printer).then(printer => {
              Runner.getProfile(printer).then(printer => {
                Runner.getSettings(printer).then(printer => {
                  Runner.getSystem(printer).then(printer => {
                    printer.inited = true;
                    printer.save().catch(err => {
                      let error = {
                        err: err.message,
                        printer: printer.index + ". " + printer.ip + ":" + printer.port,
                        action: "Error grabbing initial connection to database... No action taken"
                      };
                      console.log(error);
                    });
                    Runner.setOnline(printer);
                  });
                });
              });
            });
          } else {
            Runner.setOnline(printer);
          }
        })
        .catch(err => {
          let error = {
            err: err.message,
            printer: printer.index + ". " + printer.ip + ":" + printer.port,
            action: "Printer moved to Offline Checking"
          };
          Runner.setOffline(printer);
          console.log(error);
        })
    ]);
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
          printer.progress.completion === 100
        ) {
          printer.stateColour = this.getColour("Complete");
        } else {
          printer.stateColour = this.getColour(res.current.state);
        }

        return printer;
      })
      .catch(err => {
        let error = {
          err: err.message,
          printer: printer.index + ". " + printer.ip + ":" + printer.port,
          action: "Printer moved to Offline Checking"
        };
        Runner.setOffline(printer);
        console.log(error);
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

        return printer;
      })
      .catch(err => {
        console.error({
          error: "FILES CHECK: ",
          printer: printer.ip + ":" + printer.port,
          msg: err
        });
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
        return printer;
      })
      .catch(err => {
        console.error({
          error: "JOB CHECK: ",
          printer: printer.ip + ":" + printer.port,
          msg: err
        });
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
        return printer;
      })
      .catch(err => {
        console.error({
          error: "PRINTER CHECK: ",
          printer: printer.ip + ":" + printer.port,
          msg: err
        });
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
        return printer;
      })
      .catch(err => {
        console.error({
          error: "PROFILE CHECK: ",
          printer: printer.ip + ":" + printer.port,
          msg: err
        });
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
        return printer;
      })
      .catch(err => {
        console.error({
          error: "SETTINGS CHECK: ",
          printer: printer.ip + ":" + printer.port,
          msg: err
        });
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
        return printer;
      })
      .catch(err => {
        console.error({
          error: "FILES CHECK: ",
          printer: printer.ip + ":" + printer.port,
          msg: err
        });
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
