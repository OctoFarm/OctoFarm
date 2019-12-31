const Printers = require("../models/Printer.js");
const fetch = require("node-fetch");

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
          });
      }
    }).catch(err => console.log("DB: ", err));
    //Check for printers already initiated...
    Printers.find({ inited: true }, (err, printers) => {
      console.log("init: " + printers.length);
      for (let i = 0; i < printers.length; i++) {
        Runner.getConnection(printers[i])
          .then(check => {
            if (typeof check.message === "undefined") {
              Runner.getFiles(printers[i]).then(printer => {
                Runner.getJob(printer).then(printer => {
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
          });
      }
    }).catch(err => console.log("DB: ", err));
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
    printer.inited = true;
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
  }
  static checkOnline(printer) {
    console.log("On Check " + printer.index);
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
              Runner.setOnline(printer);
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
    console.log("Off Check " + printer.index);
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
        //Update info to db
        printer.fileList = res.files;
        printer.action = "Grabbing Files...";
        printer.storage = { free: res.free, total: res.total };
        return printer;
      })
      .catch(err => {
        console.log("FILES" + err);
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
        console.log("JOB");
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
        console.log("PRINTER");
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
        console.log("PROFILE");
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
        console.log("SETTINGS");
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
        console.log("SYSTEM");
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
    }).catch(err => {});
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
