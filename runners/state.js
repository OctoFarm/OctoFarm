const Printers = require("../models/Printer.js");
const fetch = require("node-fetch");
const _ = require("lodash");

let onlineRunners = [];
let offlineRunners = [];

class Runner {
  static init() {
    //Check for printers never initiated onto database (Could be offline when adding)
    Printers.find({ inited: false }, (err, printers) => {
      console.log("Not init: " + printers.length);
      for (let i = 0; i < printers.length; i++) {
        Runner.getConnection(printers[i])
          .then(check => {
            if (typeof check.message === "undefined") {
              Runner.getFiles(printers[i]).then(printer => {
                Runner.getJob(printer).then(printer => {
                  Runner.getProfile(printer).then(printer => {
                    Runner.getSettings(printer).then(printer => {
                      Runner.getSystem(printer).then(printer => {
                        printer.inited = true;
                        printer.action = "Online Monitoring...";
                        printer.save();
                        Runner.setOnline(printer);
                      });
                    });
                  });
                });
              });
            }
          })
          .catch(err => {
            //Set printer offline
            Printers.find({ inited: false }, (err, printers) => {
              Runner.setOffline(printers[i]);
            });
            console.error({
              error: "RUNNER INIT: ",
              printer: printers[i].ip + ":" + printers[i].port,
              msg: err
            });
          });
      }
    }).catch(err => {
      console.error({
        error: "DB GRAB: ",
        msg: err
      });
    });
    //Check for printers already initiated...
    Printers.find({ inited: true }, (err, printers) => {
      console.log("init: " + printers.length);
      for (let i = 0; i < printers.length; i++) {
        Runner.getConnection(printers[i])
          .then(check => {
            if (typeof check.message === "undefined") {
              Runner.getFiles(printers[i]).then(printer => {
                Runner.getJob(printer).then(printer => {
                  printer.action = "Online Monitoring...";
                  printer.save();
                  Runner.setOnline(printer);
                });
              });
            }
          })
          .catch(err => {
            //Set printer offline
            Printers.find({ inited: true }, (err, printers) => {
              Runner.setOffline(printers[i]);
            });
            console.error({
              error: "RUNNER RE-INIT: ",
              printer: printers[i].ip + ":" + printers[i].port,
              msg: err
            });
          });
      }
    }).catch(err => {
      console.error({
        error: "DB GRAB: ",
        msg: err
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
  static setOnline(printer) {
    console.log("Setting Online Check");
    //Make sure printer not offline
    clearInterval(offlineRunners[printer.index]);
    offlineRunners[printer.index] = false;
    //Make sure printer not online
    clearInterval(onlineRunners[printer.index]);
    onlineRunners[printer.index] = false;
    //Set Online
    onlineRunners[printer.index] = setInterval(function() {
      Runner.checkOnline(printer);
    }, 4000);
    console.log("Set online check with: " + printer.ip + ":" + printer.port);
  }
  static setOffline(printer) {
    console.log("Setting Offline Check");
    let current = {
      state: "Offline",
      port: "",
      baudrate: "",
      printerProfile: ""
    };
    printer.current = current;
    printer.action = "Offline Checking...";
    printer.stateColour = this.getColour(current.state);
    printer.save();
    //Make sure printer not online
    clearInterval(onlineRunners[printer.index]);
    onlineRunners[printer.index] = false;
    //Make sure printer not offline
    clearInterval(offlineRunners[printer.index]);
    offlineRunners[printer.index] = false;
    //Set offline
    offlineRunners[printer.index] = setInterval(function() {
      Runner.checkOffline(printer);
    }, 300000);
    console.log("Set offline check with: " + printer.ip + ":" + printer.port);
  }
  static checkOnline(printer) {
    Runner.getConnection(printer)
      .then(check => {
        if (
          typeof check.message === "undefined" &&
          printer.stateColour.category !== "Offline" &&
          printer.stateColour.category !== "Closed"
        ) {
          Runner.getJob(printer).then(printer => {
            Runner.getPrinter(printer).then(printer => {
              printer.save();
            });
          });
        }
      })
      .catch(err => {
        //Set printer offline
        Printers.find({ inited: true }, (err, printers) => {
          Runner.setOffline(printer);
        });
      });
  }
  static async checkOffline(printer) {
    await Runner.getConnection(printer)
      .then(printer => {
        printer.save();
        this.setOnline(printer);
      })
      .catch(err => console.log("Printer Offline: Keeping Offline"));
  }

  static getConnection(printer) {
    return Promise.race([
      Runner.timeout(1000),
      Runner.get(printer.ip, printer.port, printer.apikey, "connection")
        .then(res => {
          return res.json();
        })
        .then(res => {
          printer.current = res.current;
          printer.options = res.options;
          printer.stateColour = this.getColour(res.current.state);
          return printer;
        })
    ]);
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
              path: entry.path,
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
    }).catch(err => {
      console.error({
        error: "ACTUAL GET: ",
        printer: printer.ip + ":" + printer.port,
        msg: err
      });
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
