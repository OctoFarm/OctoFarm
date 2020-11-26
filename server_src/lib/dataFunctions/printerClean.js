const _ = require("lodash");

const jobClean = require("./jobClean.js");

const { JobClean } = jobClean;
const fileClean = require("./fileClean.js");

const { FileClean } = fileClean;
const historyClean = require("./historyClean.js");

const { HistoryClean } = historyClean;

const FarmStatistics = require("../../models/FarmStatistics.js");

const RoomData = require("../../models/roomData.js");

const ErrorLogs = require("../../models/ErrorLog.js");

const TempHistory = require("../../models/TempHistory.js");

const printerTicker = require("../../runners/printerTicker.js");

const { PrinterTicker } = printerTicker;

const currentOperations = {
  operations: [],
  count: {
    printerCount: 0,
    complete: 0,
    offline: 0,
    active: 0,
    idle: 0,
    disconnected: 0,
    farmProgress: 0,
    farmProgressColour: "danger",
  },
};
const dashboardStatistics = {
  currentUtilisation: {},
  currentStatus: {},
  timeEstimates: {},
  farmUtilisation: {},
  printerHeatMaps: {},
  utilisationGraph: {},
  temperatureGraph: {},
};
let printersInformation = [];

const currentLogs = [];
const previousLogs = [];

let farmStats = null;
let heatMap = [
  {
    name: "Completed",
    data: [],
  },
  {
    name: "Active",
    data: [],
  },
  {
    name: "Idle",
    data: [],
  },
  {
    name: "Offline",
    data: [],
  },
  {
    name: "Disconnected",
    data: [],
  },
];
const currentHistoryTemp = [
  {
    name: "Actual Tool",
    data: [],
  },
  {
    name: "Target Tool",
    data: [],
  },
  {
    name: "Actual Bed",
    data: [],
  },
  {
    name: "Target Bed",
    data: [],
  },
  {
    name: "Actual Chamber",
    data: [],
  },
  {
    name: "Target Chamber",
    data: [],
  },
];

let heatMapCounter = 17280;
const arrayTotal = [];
const printerControlList = [];
let printerFilamentList = [];

let interval = false;

let printerConnectionLogs = [];

let fmToggle = false;

class PrinterClean {
  static removePrintersInformation(index) {
    if (typeof index !== "undefined") {
      printersInformation = printersInformation.filter((el) => {
        return el.sortIndex === index;
      });
    } else {
      printersInformation = [];
    }
  }
  static returnPrinterLogs(sortIndex) {
    if (typeof sortIndex !== "undefined") {
      return printerConnectionLogs[sortIndex];
    } else {
      return printerConnectionLogs;
    }
  }
  static returnPrintersInformation() {
    return printersInformation;
  }

  static returnPrinterControlList() {
    return printerControlList;
  }

  static returnFilamentList() {
    return printerFilamentList;
  }

  static returnCurrentOperations() {
    return currentOperations;
  }

  static returnDashboardStatistics() {
    return dashboardStatistics;
  }

  static async generate(farmPrinter, filamentManager) {
    fmToggle = filamentManager;
    try {
      if (typeof farmPrinter.systemChecks !== "undefined") {
        farmPrinter.systemChecks.cleaning.information.status = "warning";
      }
      const sortedPrinter = {
        // eslint-disable-next-line no-underscore-dangle
        _id: farmPrinter._id,
        sortIndex: farmPrinter.sortIndex,
        hostState: {
          state: farmPrinter.hostState,
          colour: farmPrinter.hostStateColour,
          desc: farmPrinter.hostDescription,
        },
        printerState: {
          state: farmPrinter.state,
          colour: farmPrinter.stateColour,
          desc: farmPrinter.stateDescription,
        },
        webSocketState: {
          colour: farmPrinter.webSocket,
          desc: farmPrinter.webSocketDescription,
        },
        group: farmPrinter.group,
        printerURL: farmPrinter.printerURL,
        cameraURL: farmPrinter.camURL,
        apikey: farmPrinter.apikey,
        octoPrintVersion: farmPrinter.octoPrintVersion,
        flowRate: farmPrinter.flowRate,
        feedRate: farmPrinter.feedRate,
        stepRate: farmPrinter.stepRate,
        systemChecks: farmPrinter.systemChecks,
        currentIdle: farmPrinter.currentIdle,
        currentActive: farmPrinter.currentActive,
        currentOffline: farmPrinter.currentOffline,
        dateAdded: farmPrinter.dateAdded,
        corsCheck: farmPrinter.corsCheck,
        currentUser: farmPrinter.currentUser,
        updateAvailable: farmPrinter.updateAvailable,
        display: true,
        order: farmPrinter.sortIndex,
      };

      if (typeof farmPrinter.resends !== "undefined") {
        sortedPrinter.resends = farmPrinter.resends;
      }

      sortedPrinter.tools = await PrinterClean.sortTemps(farmPrinter.temps);
      sortedPrinter.currentJob = await JobClean.returnJob(
        farmPrinter.sortIndex
      );
      sortedPrinter.selectedFilament = farmPrinter.selectedFilament;

      sortedPrinter.fileList = await FileClean.returnFiles(
        farmPrinter.sortIndex
      );

      sortedPrinter.currentProfile = await PrinterClean.sortProfile(
        farmPrinter.profiles,
        farmPrinter.current
      );
      sortedPrinter.currentConnection = await PrinterClean.sortConnection(
        farmPrinter.current
      );
      sortedPrinter.connectionOptions = farmPrinter.options;
      if (
        typeof sortedPrinter.connectionOptions !== "undefined" &&
        !sortedPrinter.connectionOptions.ports.includes("AUTO")
      ) {
        sortedPrinter.connectionOptions.ports.unshift("AUTO");
      }
      sortedPrinter.terminal = await PrinterClean.sortTerminal(
        farmPrinter.sortIndex,
        farmPrinter.logs
      );
      sortedPrinter.costSettings = farmPrinter.costSettings;
      sortedPrinter.powerSettings = farmPrinter.powerSettings;
      sortedPrinter.gcodeScripts = await PrinterClean.sortGCODE(
        farmPrinter.settingsScripts
      );
      sortedPrinter.otherSettings = await PrinterClean.sortOtherSettings(
        farmPrinter.tempTriggers,
        farmPrinter.settingsWebcam,
        farmPrinter.settingsServer
      );
      sortedPrinter.printerName = await PrinterClean.grabPrinterName(
        farmPrinter
      );
      sortedPrinter.storage = farmPrinter.storage;
      sortedPrinter.tempHistory = farmPrinter.tempHistory;

      if (typeof farmPrinter.octoPi !== "undefined") {
        sortedPrinter.octoPi = farmPrinter.octoPi;
      }

      sortedPrinter.connectionLog =
        printerConnectionLogs[farmPrinter.sortIndex];
      if (typeof farmPrinter.klipperFirmwareVersion !== "undefined") {
        sortedPrinter.klipperFirmwareVersion = farmPrinter.klipperFirmwareVersion.substring(
          0,
          6
        );
      }

      const printerIndex = _.findIndex(printerControlList, function (o) {
        return o.printerName == sortedPrinter.printerName;
      });
      if (printerIndex !== -1) {
        printerControlList[printerIndex] = {
          printerName: sortedPrinter.printerName,
          printerID: sortedPrinter._id,
          state: sortedPrinter.printerState.colour,
        };
      } else {
        printerControlList.push({
          printerName: sortedPrinter.printerName,
          printerID: sortedPrinter._id,
          state: sortedPrinter.printerState.colour,
        });
      }
      if (typeof farmPrinter.systemChecks !== "undefined") {
        farmPrinter.systemChecks.cleaning.information.status = "success";
        farmPrinter.systemChecks.cleaning.information.date = new Date();
      }

      printersInformation[farmPrinter.sortIndex] = sortedPrinter;
    } catch (e) {
      console.log(e);
    }
  }

  static async generateConnectionLogs(farmPrinter) {
    let printerErrorLogs = await ErrorLogs.find({});

    let currentOctoFarmLogs = [];
    let currentErrorLogs = [];
    let currentTempLogs = [];
    let currentOctoPrintLogs = [];
    for (let e = 0; e < printerErrorLogs.length; e++) {
      if (
        typeof printerErrorLogs[e].errorLog.printerID !== "undefined" &&
        JSON.stringify(printerErrorLogs[e].errorLog.printerID) ===
          JSON.stringify(farmPrinter._id)
      ) {
        let errorFormat = {
          date: printerErrorLogs[e].errorLog.endDate,
          message: printerErrorLogs[e].errorLog.reason,
          printer: farmPrinter.printerURL,
          state: "Offline",
        };
        currentErrorLogs.push(errorFormat);
      }
    }
    let currentIssues = await PrinterTicker.returnIssue();
    for (let i = 0; i < currentIssues.length; i++) {
      if (
        JSON.stringify(currentIssues[i].printerID) ===
        JSON.stringify(farmPrinter._id)
      ) {
        let errorFormat = {
          date: currentIssues[i].date,
          message: currentIssues[i].message,
          printer: currentIssues[i].printer,
          state: currentIssues[i].state,
        };
        currentOctoFarmLogs.push(errorFormat);
      }
    }

    let octoprintLogs = await PrinterTicker.returnOctoPrintLogs();
    for (let i = 0; i < octoprintLogs.length; i++) {
      if (
        JSON.stringify(octoprintLogs[i].printerID) ===
        JSON.stringify(farmPrinter._id)
      ) {
        let octoFormat = {
          date: octoprintLogs[i].date,
          message: octoprintLogs[i].message,
          printer: octoprintLogs[i].printer,
          pluginDisplay: octoprintLogs[i].pluginDisplay,
          state: octoprintLogs[i].state,
        };
        currentOctoPrintLogs.push(octoFormat);
      }
    }

    let tempHistory = await TempHistory.find({
      printer_id: farmPrinter._id,
    })
      .sort({ _id: -1 })
      .limit(500);
    if (typeof tempHistory !== "undefined") {
      for (let h = 0; h < tempHistory.length; h++) {
        let hist = tempHistory[h].currentTemp;
        const reFormatTempHistory = async function (tempHistory) {
          // create a new object to store full name.
          let keys = Object.keys(tempHistory);
          let array = [];

          for (let k = 0; k < keys.length; k++) {
            if (keys[k] !== "time") {
              let target = {};
              let actual = {};
              target = {
                name: keys[k] + "-target",
                data: [],
              };
              actual = {
                name: keys[k] + "-actual",
                data: [],
              };
              array.push(target);
              array.push(actual);
            }
          }

          // return our new object.
          return array;
        };
        currentTempLogs = await reFormatTempHistory(hist);
      }
      if (currentTempLogs.length > 0) {
        for (let h = 0; h < tempHistory.length; h++) {
          let hist = tempHistory[h].currentTemp;
          let keys = Object.keys(hist);
          for (let k = 0; k < keys.length; k++) {
            if (keys[k] !== "time") {
              let actual = {
                x: hist["time"],
                y: hist[keys[k]].actual,
              };
              let target = {
                x: hist["time"],
                y: hist[keys[k]].target,
              };

              //get array position...
              let arrayTarget = currentTempLogs
                .map(function (e) {
                  return e.name;
                })
                .indexOf(keys[k] + "-target");
              let arrayActual = currentTempLogs
                .map(function (e) {
                  return e.name;
                })
                .indexOf(keys[k] + "-actual");
              if (
                currentTempLogs[arrayTarget].data.length <= tempHistory.length
              ) {
                currentTempLogs[arrayTarget].data.push(target);
              }
              if (
                currentTempLogs[arrayActual].data.length <= tempHistory.length
              ) {
                currentTempLogs[arrayActual].data.push(actual);
              }
            }
          }
        }
      }
    }

    currentErrorLogs = _.orderBy(currentErrorLogs, ["date"], ["desc"]);
    currentOctoFarmLogs = _.orderBy(currentOctoFarmLogs, ["date"], ["desc"]);
    currentTempLogs = _.orderBy(currentTempLogs, ["date"], ["desc"]);
    currentOctoPrintLogs = _.orderBy(currentOctoPrintLogs, ["date"], ["desc"]);

    return {
      currentErrorLogs,
      currentOctoFarmLogs,
      currentTempLogs,
      currentOctoPrintLogs,
    };
  }
  static async createPrinterList(farmPrinters, filamentManager) {
    const printerList = ['<option value="0">Not Assigned</option>'];
    farmPrinters.forEach((printer) => {
      if (
        typeof printer.currentProfile !== "undefined" &&
        printer.currentProfile !== null
      ) {
        for (let i = 0; i < printer.currentProfile.extruder.count; i++) {
          let listing = null;
          if (filamentManager) {
            if (
              printer.printerState.colour.category === "Offline" ||
              printer.printerState.colour.category === "Active"
            ) {
              listing = `<option value="${printer._id}-${i}" disabled>${printer.printerName}: Tool ${i}</option>`;
            } else {
              listing = `<option value="${printer._id}-${i}">${printer.printerName}: Tool ${i}</option>`;
            }
          } else {
            listing = `<option value="${printer._id}-${i}">${printer.printerName}: Tool ${i}</option>`;
          }

          printerList.push(listing);
        }
      }
    });

    printerFilamentList = printerList;
  }

  static sortOtherSettings(temp, webcam, system) {
    const otherSettings = {
      temperatureTriggers: null,
      webCamSettings: null,
    };
    if (typeof temp !== "undefined") {
      otherSettings.temperatureTriggers = temp;
    }
    if (typeof webcam !== "undefined") {
      otherSettings.webCamSettings = webcam;
    }
    if (typeof system !== "undefined") {
      otherSettings.system = system;
    }

    return otherSettings;
  }

  static async sortTerminal(i, logs) {
    if (typeof logs !== "undefined") {
      if (typeof currentLogs[i] === "undefined") {
        currentLogs[i] = [];
      } else {
        if (logs.length === 1) {
          if (currentLogs[i][currentLogs[i].length - 1] !== logs[0]) {
            currentLogs[i].push(logs[0]);
          }
          if (currentLogs[i].length >= 100) {
            currentLogs[i].shift();
          }
        } else {
          for (let l = 0; l < logs.length; l++) {
            if (currentLogs[i][currentLogs[i].length - 1] !== logs[l]) {
              currentLogs[i].push(logs[l]);
            }
            if (currentLogs[i].length >= 100) {
              currentLogs[i].shift();
            }
          }
          previousLogs[i] = currentLogs[i];
        }
      }
    } else {
      currentLogs[i] = [];
    }
    return currentLogs[i];
  }

  static async sortGCODE(settings) {
    if (typeof settings !== "undefined") {
      return settings.gcode;
    }
    return null;
  }

  static async sortConnection(current) {
    if (typeof current !== "undefined") {
      return {
        baudrate: current.baudrate,
        port: current.port,
        printerProfile: current.printerProfile,
      };
    }
    return null;
  }

  static async sortProfile(profile, current) {
    if (typeof profile !== "undefined") {
      if (typeof current !== "undefined") {
        return profile[current.printerProfile];
      }
    } else {
      return null;
    }
  }

  static async sortTemps(temps) {
    if (typeof temps !== "undefined") {
      return temps;
    }
    return null;
  }

  static grabPrinterName(printer) {
    let name = null;
    if (typeof printer.settingsAppearance !== "undefined") {
      if (
        printer.settingsAppearance.name === "" ||
        printer.settingsAppearance.name === null
      ) {
        name = printer.printerURL;
      } else {
        name = printer.settingsAppearance.name;
      }
    } else {
      name = printer.printerURL;
    }
    return name;
  }

  static async sortCurrentOperations(farmPrinters) {
    const complete = [];
    const active = [];
    const idle = [];
    const offline = [];
    const disconnected = [];
    const progress = [];
    const operations = [];
    try {
      for (let o = 0; o < farmPrinters.length; o++) {
        const printer = farmPrinters[o];
        if (typeof printer !== "undefined") {
          const name = printer.printerName;

          if (typeof printer.printerState !== "undefined") {
            if (printer.printerState.colour.category === "Idle") {
              idle.push(printer._id);
            }
            if (printer.printerState.colour.category === "Offline") {
              offline.push(printer._id);
            }
            if (printer.printerState.colour.category === "Disconnected") {
              disconnected.push(printer._id);
            }
          }

          if (
            typeof printer.printerState !== "undefined" &&
            printer.currentJob != null
          ) {
            let id = printer._id;
            id = id.toString();
            if (printer.printerState.colour.category === "Complete") {
              complete.push(printer._id);
              progress.push(printer.currentJob.progress);
              operations.push({
                index: id,
                name,
                progress: Math.floor(printer.currentJob.progress),
                progressColour: "success",
                timeRemaining: printer.currentJob.printTimeRemaining,
                fileName: printer.currentJob.fileDisplay,
              });
            }

            if (
              printer.printerState.colour.category === "Active" &&
              typeof printer.currentJob !== "undefined"
            ) {
              active.push(printer._id);
              progress.push(printer.currentJob.progress);
              operations.push({
                index: id,
                name,
                progress: Math.floor(printer.currentJob.progress),
                progressColour: "warning",
                timeRemaining: printer.currentJob.printTimeRemaining,
                fileName: printer.currentJob.fileDisplay,
              });
            }
          }
        }
      }

      const actProg = progress.reduce((a, b) => a + b, 0);

      currentOperations.count.farmProgress = Math.floor(
        actProg / progress.length
      );

      if (isNaN(currentOperations.count.farmProgress)) {
        currentOperations.count.farmProgress = 0;
      }
      if (currentOperations.count.farmProgress === 100) {
        currentOperations.count.farmProgressColour = "success";
      } else {
        currentOperations.count.farmProgressColour = "warning";
      }
      // 17280

      if (heatMapCounter >= 17280) {
        PrinterClean.heatMapping(
          currentOperations.count.complete,
          currentOperations.count.active,
          currentOperations.count.offline,
          currentOperations.count.idle,
          currentOperations.count.disconnected
        );

        heatMapCounter = 0;
      } else {
        heatMapCounter += 1728;
      }

      currentOperations.count.printerCount = farmPrinters.length;
      currentOperations.count.complete = complete.length;
      currentOperations.count.active = active.length;
      currentOperations.count.offline = offline.length;
      currentOperations.count.idle = idle.length;
      currentOperations.count.disconnected = disconnected.length;

      currentOperations.operations = _.orderBy(
        operations,
        ["progress"],
        ["desc"]
      );
    } catch (err) {
      console.log(`Current Operations issue: ${err}`);
    }
  }

  static async statisticsStart() {
    const history = HistoryClean.returnStatistics();
    dashboardStatistics.currentUtilisation = [
      {
        data: [
          currentOperations.count.active,
          currentOperations.count.complete,
          currentOperations.count.idle,
          currentOperations.count.disconnected,
          currentOperations.count.offline,
        ],
      },
    ];

    const farmTotal =
      currentOperations.count.active +
      currentOperations.count.complete +
      currentOperations.count.idle +
      currentOperations.count.disconnected +
      currentOperations.count.offline;
    const activeTotal = currentOperations.count.active;
    const offlineTotal = currentOperations.count.offline;
    const idleTotal =
      currentOperations.count.complete +
      currentOperations.count.idle +
      currentOperations.count.disconnected;
    const activePer = (activeTotal / farmTotal) * 100;
    const idlePer = (idleTotal / farmTotal) * 100;
    const offlinePer = (offlineTotal / farmTotal) * 100;
    dashboardStatistics.currentStatus = [activePer, idlePer, offlinePer];

    const arrayEstimated = [];
    const arrayRemaining = [];
    const arrayElapsed = [];

    const arrayIdle = [];
    const arrayActive = [];
    const arrayOffline = [];
    const heatStatus = [];
    const heatProgress = [];
    const heatTemps = [];
    const heatUtilisation = [];

    const arrayGlobalToolTempActual = [];
    const arrayGlobalToolTempTarget = [];
    const arrayGlobalBedTempActual = [];
    const arrayGlobalBedTempTarget = [];
    const arrayGlobalChamberTempActual = [];
    const arrayGlobalChamberTempTarget = [];
    for (let p = 0; p < printersInformation.length; p++) {
      const printer = printersInformation[p];
      if (typeof printer !== "undefined") {
        if (typeof printer.currentJob !== "undefined") {
          if (printer.currentJob.expectedPrintTime !== null) {
            arrayEstimated.push(printer.currentJob.expectedPrintTime);
          }
          if (printer.currentJob.expectedPrintTime !== null) {
            arrayRemaining.push(printer.currentJob.printTimeRemaining);
          }
          if (printer.currentJob.expectedPrintTime !== null) {
            arrayElapsed.push(printer.currentJob.printTimeElapsed);
          }
        }
        arrayIdle.push(printer.currentIdle);
        arrayActive.push(printer.currentActive);
        arrayOffline.push(printer.currentOffline);
        if (typeof printer.printerState !== "undefined") {
          const status = printer.printerState.colour.category;
          let colour = printer.printerState.colour.name;
          if (printer.printerState.colour.category === "Offline") {
            colour = "offline";
          }
          heatStatus.push(
            `<div title="${printer.printerName}: ${status}" class="bg-${colour} heatMap"></div>`
          );
          let tools = null;
          if (
            printer.printerState.colour.category === "Active" ||
            printer.printerState.colour.category === "Complete"
          ) {
            tools = printer.tools;
          } else {
            tools = [];
            tools.push({
              bed: {
                actual: 0,
                target: 0,
              },
              tool0: {
                actual: 0,
                target: 0,
              },
            });
          }
          if (typeof tools !== "undefined" && tools !== null) {
            const rightString = [`${printer.printerName}: `];
            const leftString = [`${printer.printerName}: `];
            const arrayToolActual = [];
            const arrayToolTarget = [];
            const arrayOtherActual = [];
            const arrayOtherTarget = [];
            const keys = Object.keys(tools[0]);
            for (let k = 0; k < keys.length; k++) {
              if (
                typeof printer.currentProfile !== "undefined" &&
                printer.currentProfile !== null
              ) {
                if (
                  printer.currentProfile.heatedChamber &&
                  keys[k] === "chamber"
                ) {
                  let actual = "";
                  let target = "";
                  if (
                    printer.tools !== null &&
                    printer.tools[0][keys[k]].actual !== null
                  ) {
                    actual = `Chamber A: ${
                      printer.tools[0][keys[k]].actual
                    }°C `;
                    arrayOtherActual.push(printer.tools[0][keys[k]].actual);
                    arrayGlobalChamberTempActual.push(
                      printer.tools[0][keys[k]].actual
                    );
                  } else {
                    actual = `Chamber A: ${0}°C`;
                  }
                  if (
                    printer.tools !== null &&
                    printer.tools[0][keys[k]].target !== null
                  ) {
                    target = `Chamber T: ${
                      printer.tools[0][keys[k]].target
                    }°C `;
                    arrayOtherTarget.push(printer.tools[0][keys[k]].target);
                    arrayGlobalChamberTempTarget.push(
                      printer.tools[0][keys[k]].target
                    );
                  } else {
                    target = `Chamber T: ${0}°C`;
                  }
                  rightString[2] = `${actual}, ${target}`;
                }
                if (
                  printer.tools !== null &&
                  printer.currentProfile.heatedBed &&
                  keys[k] === "bed"
                ) {
                  let actual = "";
                  let target = "";
                  if (
                    printer.tools !== null &&
                    printer.tools[0][keys[k]].actual !== null
                  ) {
                    actual = `Bed A: ${printer.tools[0][keys[k]].actual}°C `;
                    arrayOtherActual.push(printer.tools[0][keys[k]].actual);
                    arrayGlobalBedTempActual.push(
                      printer.tools[0][keys[k]].actual
                    );
                  } else {
                    actual = `Bed A: ${0}°C`;
                  }
                  if (
                    printer.tools !== null &&
                    printer.tools[0][keys[k]].target !== null
                  ) {
                    target = `Bed T: ${printer.tools[0][keys[k]].target}°C `;
                    arrayOtherTarget.push(printer.tools[0][keys[k]].target);
                    arrayGlobalBedTempTarget.push(
                      printer.tools[0][keys[k]].target
                    );
                  } else {
                    target = `Bed T: ${0}°C`;
                  }
                  rightString[1] = `${actual}, ${target}`;
                }
                if (keys[k].includes("tool")) {
                  const toolNumber = keys[k].replace("tool", "");
                  let actual = "";
                  let target = "";
                  if (
                    printer.tools !== null &&
                    printer.tools[0][keys[k]].actual !== null
                  ) {
                    actual = `Tool ${toolNumber} A: ${
                      printer.tools[0][keys[k]].actual
                    }°C `;
                    arrayToolActual.push(printer.tools[0][keys[k]].actual);
                    arrayGlobalToolTempActual.push(
                      printer.tools[0][keys[k]].actual
                    );
                  } else {
                    actual = `Tool ${toolNumber} A: 0°C`;
                  }
                  if (
                    printer.tools !== null &&
                    printer.tools[0][keys[k]].target !== null
                  ) {
                    target = `Tool ${toolNumber} T: ${
                      printer.tools[0][keys[k]].target
                    }°C `;
                    arrayToolTarget.push(printer.tools[0][keys[k]].target);
                    arrayGlobalToolTempTarget.push(
                      printer.tools[0][keys[k]].target
                    );
                  } else {
                    target = `Tool ${toolNumber} T: 0°C`;
                  }
                  leftString[parseInt(toolNumber) + 1] = `${actual}, ${target}`;
                }
              } else {
                leftString[1] = "Offline";
                rightString[1] = "Offline";
              }
            }
            const totalToolActual = arrayToolActual.reduce((a, b) => a + b, 0);
            const totalToolTarget = arrayToolTarget.reduce((a, b) => a + b, 0);
            const totalOtherActual = arrayOtherActual.reduce(
              (a, b) => a + b,
              0
            );
            const totalOtherTarget = arrayToolActual.reduce((a, b) => a + b, 0);
            let actualString = '<div class="d-flex flex-wrap"><div title="';
            for (let l = 0; l < leftString.length; l++) {
              actualString += `${leftString[l]}`;
            }
            actualString += `" class="${PrinterClean.checkTempRange(
              printer.printerState.colour.category,
              totalToolTarget,
              totalToolActual,
              printer.otherSettings.temperatureTriggers.heatingVariation,
              printer.otherSettings.temperatureTriggers.coolDownf
            )} heatMapLeft"></div>`;
            actualString += '<div title="';
            for (let r = 0; r < rightString.length; r++) {
              actualString += `${rightString[r]}`;
            }
            actualString += `" class="${PrinterClean.checkTempRange(
              printer.printerState.colour.category,
              totalOtherTarget,
              totalOtherActual,
              printer.otherSettings.temperatureTriggers.heatingVariation,
              printer.otherSettings.temperatureTriggers.coolDown
            )} heatMapLeft"></div></div>`;
            heatTemps.push(actualString);
          }
          let progress = 0;
          if (
            typeof printer.currentJob !== "undefined" &&
            printer.currentJob.progress !== null
          ) {
            progress = printer.currentJob.progress.toFixed(0);
          }
          heatProgress.push(
            `<div title="${
              printer.printerName
            }: ${progress}%" class="bg-${PrinterClean.getProgressColour(
              progress
            )} heatMap"></div>`
          );
        }
        const printerUptime =
          printer.currentActive + printer.currentIdle + printer.currentOffline;
        const percentUp = (printer.currentActive / printerUptime) * 100;
        heatUtilisation.push(
          `<div title="${printer.printerName}: ${percentUp.toFixed(
            0
          )}" class="bg-${PrinterClean.getProgressColour(
            percentUp
          )} heatMap"></div>`
        );
      }
    }
    let timeStamp = new Date();
    timeStamp = timeStamp.getTime();
    const totalGlobalToolTempActual = arrayGlobalToolTempActual.reduce(
      (a, b) => a + b,
      0
    );
    const totalGlobalToolTempTarget = arrayGlobalToolTempTarget.reduce(
      (a, b) => a + b,
      0
    );
    const totalGlobalBedTempActual = arrayGlobalBedTempActual.reduce(
      (a, b) => a + b,
      0
    );
    const totalGlobalBedTempTarget = arrayGlobalBedTempTarget.reduce(
      (a, b) => a + b,
      0
    );
    const totalGlobalChamberTempActual = arrayGlobalChamberTempActual.reduce(
      (a, b) => a + b,
      0
    );
    const totalGlobalChamberTempTarget = arrayGlobalChamberTempTarget.reduce(
      (a, b) => a + b,
      0
    );
    const totalGlobalTemp =
      totalGlobalToolTempActual +
      totalGlobalBedTempActual +
      totalGlobalChamberTempActual;
    currentHistoryTemp[0].data.push({
      x: timeStamp,
      y: totalGlobalToolTempActual,
    });
    currentHistoryTemp[1].data.push({
      x: timeStamp,
      y: totalGlobalToolTempTarget,
    });
    currentHistoryTemp[2].data.push({
      x: timeStamp,
      y: totalGlobalBedTempActual,
    });
    currentHistoryTemp[3].data.push({
      x: timeStamp,
      y: totalGlobalBedTempTarget,
    });
    currentHistoryTemp[4].data.push({
      x: timeStamp,
      y: totalGlobalChamberTempActual,
    });
    currentHistoryTemp[5].data.push({
      x: timeStamp,
      y: totalGlobalChamberTempTarget,
    });
    if (currentHistoryTemp[0].data.length > 720) {
      currentHistoryTemp[0].data.shift();
      currentHistoryTemp[1].data.shift();
      currentHistoryTemp[2].data.shift();
      currentHistoryTemp[3].data.shift();
      currentHistoryTemp[4].data.shift();
      currentHistoryTemp[5].data.shift();
    }
    dashboardStatistics.temperatureGraph = currentHistoryTemp;
    const totalEstimated = arrayEstimated.reduce((a, b) => a + b, 0);
    const totalRemaining = arrayRemaining.reduce((a, b) => a + b, 0);
    const totalElapsed = arrayElapsed.reduce((a, b) => a + b, 0);
    const averageEstimated = totalEstimated / arrayEstimated.length;
    const averageRemaining = totalRemaining / arrayRemaining.length;
    const averageElapsed = totalElapsed / arrayElapsed.length;
    const cumulativePercent = (totalElapsed / totalEstimated) * 100;
    const cumulativePercentRemaining = 100 - cumulativePercent;
    const averagePercent = (averageElapsed / averageEstimated) * 100;
    const averagePercentRemaining = 100 - averagePercent;
    dashboardStatistics.timeEstimates = {
      totalElapsed,
      totalRemaining,
      totalEstimated,
      averageElapsed,
      averageRemaining,
      averageEstimated,
      cumulativePercent,
      cumulativePercentRemaining,
      averagePercent,
      averagePercentRemaining,
      totalFarmTemp: totalGlobalTemp,
    };

    const activeHours = arrayActive.reduce((a, b) => a + b, 0);
    const idleHours = arrayIdle.reduce((a, b) => a + b, 0);
    const offlineHours = arrayOffline.reduce((a, b) => a + b, 0);
    const failedHours = history.currentFailed;
    const totalHours =
      history.currentFailed + activeHours + idleHours + offlineHours;
    const activePercent = (activeHours / totalHours) * 100;
    const offlinePercent = (offlineHours / totalHours) * 100;
    const idlePercent = (idleHours / totalHours) * 100;
    const failedPercent = (failedHours / totalHours) * 100;

    dashboardStatistics.farmUtilisation = {
      activeHours,
      failedHours,
      idleHours,
      offlineHours,
      activeHoursPercent: activePercent,
      failedHoursPercent: failedPercent,
      idleHoursPercent: idlePercent,
      offlineHoursPercent: offlinePercent,
    };
    dashboardStatistics.printerHeatMaps = {
      heatStatus,
      heatProgress,
      heatTemps,
      heatUtilisation,
    };
    //Find min / max values for gas_resistance to tweak calulation...
    RoomData.find({})
      .sort({ _id: -1 })
      .limit(500)
      .exec(function (err, posts) {
        const currentEnviromentalData = [
          {
            name: "Temperature",
            data: [],
          },
          {
            name: "Humidity",
            data: [],
          },
          {
            name: "Pressure",
            data: [],
          },
          {
            name: "IAQ",
            data: [],
          },
        ];
        const currentIAQ = [];
        const enviromentalData = posts;
        for (let i = 0; i < enviromentalData.length; i++) {
          if (
            typeof enviromentalData[i].temperature !== "undefined" &&
            enviromentalData[i].temperature !== null
          ) {
            currentEnviromentalData[0].data.push({
              x: enviromentalData[i].date,
              y: enviromentalData[i].temperature.toFixed(2),
            });
          } else {
            currentEnviromentalData[0].data.push({
              x: enviromentalData[i].date,
              y: null,
            });
          }
          if (
            typeof enviromentalData[i].humidity !== "undefined" &&
            enviromentalData[i].humidity !== null
          ) {
            currentEnviromentalData[1].data.push({
              x: enviromentalData[i].date,
              y: enviromentalData[i].humidity.toFixed(0),
            });
          } else {
            currentEnviromentalData[1].data.push({
              x: enviromentalData[i].date,
              y: null,
            });
          }
          if (
            typeof enviromentalData[i].pressure !== "undefined" &&
            enviromentalData[i].pressure !== null
          ) {
            currentEnviromentalData[2].data.push({
              x: enviromentalData[i].date,
              y: enviromentalData[i].pressure.toFixed(0),
            });
          } else {
            currentEnviromentalData[2].data.push({
              x: enviromentalData[i].date,
              y: null,
            });
          }
          if (
            typeof enviromentalData[i].iaq !== "undefined" &&
            enviromentalData[i].iaq !== null
          ) {
            currentEnviromentalData[3].data.push({
              x: enviromentalData[i].date,
              y: enviromentalData[i].iaq.toFixed(0),
            });
          } else {
            currentEnviromentalData[3].data.push({
              x: enviromentalData[i].date,
              y: null,
            });
          }
        }
        dashboardStatistics.enviromentalData = currentEnviromentalData;
        //dashboardStatistics.currentIAQ = currentIAQ;
      });
  }

  static getDay(value) {
    value = value.getDay();
    let actualDay = null;
    if (value === 1) {
      actualDay = "Monday";
    }
    if (value === 2) {
      actualDay = "Tuesday";
    }
    if (value === 3) {
      actualDay = "Wednesday";
    }
    if (value === 4) {
      actualDay = "Thursday";
    }
    if (value === 5) {
      actualDay = "Friday";
    }
    if (value === 6) {
      actualDay = "Saturday";
    }
    if (value === 0) {
      actualDay = "Sunday";
    }
    return actualDay;
  }

  // eslint-disable-next-line require-jsdoc
  static async heatMapping(complete, active, offline, idle, disconnected) {
    try {
      const today = PrinterClean.getDay(new Date());
      const CompleteCount = {
        x: today,
        y: 0,
        figure: 0,
      };
      const ActiveCount = {
        x: today,
        y: 0,
        figure: 0,
      };

      const IdleCount = {
        x: today,
        y: 0,
        figure: 0,
      };
      const OfflineCount = {
        x: today,
        y: 0,
        figure: 0,
      };
      const DisconnectedCount = {
        x: today,
        y: 0,
        figure: 0,
      };
      if (heatMap[0].data.length === 0) {
        // Created initial data set
        heatMap[0].data.push(CompleteCount);
        heatMap[1].data.push(ActiveCount);
        heatMap[2].data.push(IdleCount);
        heatMap[3].data.push(OfflineCount);
        heatMap[4].data.push(DisconnectedCount);
      } else {
        // Cycle through current data and check if day exists...

        const currentTotal = arrayTotal.reduce((a, b) => a + b, 0);
        for (let i = 0; i < heatMap.length; i++) {
          const lastInArray = heatMap[i].data.length - 1;
          // If x = today add that fucker up!
          if (heatMap[i].data[lastInArray].x === today) {
            if (heatMap[i].name === "Completed") {
              heatMap[i].data[lastInArray].y = (
                (heatMap[i].data[lastInArray].figure / currentTotal) *
                100
              ).toFixed(3);

              if (!isFinite(heatMap[i].data[lastInArray].y)) {
                heatMap[i].data[lastInArray].y = 0;
              }
              heatMap[i].data[lastInArray].figure =
                heatMap[i].data[lastInArray].figure + complete;
              arrayTotal[0] = heatMap[i].data[lastInArray].figure;
            }
            if (heatMap[i].name === "Active") {
              heatMap[i].data[lastInArray].y = (
                (heatMap[i].data[lastInArray].figure / currentTotal) *
                100
              ).toFixed(3);

              if (!isFinite(heatMap[i].data[lastInArray].y)) {
                heatMap[i].data[lastInArray].y = 0;
              }
              heatMap[i].data[lastInArray].figure =
                heatMap[i].data[lastInArray].figure + active;
              arrayTotal[1] = heatMap[i].data[lastInArray].figure;
            }
            if (heatMap[i].name === "Offline") {
              heatMap[i].data[lastInArray].y = (
                (heatMap[i].data[lastInArray].figure / currentTotal) *
                100
              ).toFixed(3);

              if (!isFinite(heatMap[i].data[lastInArray].y)) {
                heatMap[i].data[lastInArray].y = 0;
              }
              heatMap[i].data[lastInArray].figure =
                heatMap[i].data[lastInArray].figure + offline;
              arrayTotal[2] = heatMap[i].data[lastInArray].figure;
            }
            if (heatMap[i].name === "Idle") {
              heatMap[i].data[lastInArray].y = (
                (heatMap[i].data[lastInArray].figure / currentTotal) *
                100
              ).toFixed(3);
              if (!isFinite(heatMap[i].data[lastInArray].y)) {
                heatMap[i].data[lastInArray].y = 0;
              }
              heatMap[i].data[lastInArray].figure =
                heatMap[i].data[lastInArray].figure + idle;
              arrayTotal[3] = heatMap[i].data[lastInArray].figure;
            }
            if (heatMap[i].name === "Disconnected") {
              heatMap[i].data[lastInArray].y = (
                (heatMap[i].data[lastInArray].figure / currentTotal) *
                100
              ).toFixed(3);
              if (!isFinite(heatMap[i].data[lastInArray].y)) {
                heatMap[i].data[lastInArray].y = 0;
              }
              heatMap[i].data[lastInArray].figure =
                heatMap[i].data[lastInArray].figure + disconnected;
              arrayTotal[4] = heatMap[i].data[lastInArray].figure;
            }
          } else {
            // Must be a new day, so shift with new heatMap
            heatMap[0].data.push(CompleteCount);
            heatMap[1].data.push(ActiveCount);
            heatMap[2].data.push(IdleCount);
            heatMap[3].data.push(OfflineCount);
            heatMap[4].data.push(DisconnectedCount);
          }
        }
      }
      // Clean up old days....
      if (heatMap[0].data.length === 8) {
        heatMap[0].data.shift();
        heatMap[1].data.shift();
        heatMap[2].data.shift();
        heatMap[3].data.shift();
        heatMap[4].data.shift();
      }
      farmStats[0].heatMap = heatMap;
      dashboardStatistics.utilisationGraph = heatMap;
      farmStats[0].markModified("heatMap");
      farmStats[0].save().catch((e) => console.log(e));
    } catch (e) {
      console.log("HEAT MAP ISSUE", e);
    }
  }

  static getProgressColour(progress) {
    progress = parseInt(progress);
    if (progress === 0) {
      return "dark";
    }
    if (progress < 25) {
      return "secondary";
    }
    if (progress >= 25 && progress <= 50) {
      return "primary";
    }
    if (progress >= 50 && progress <= 75) {
      return "info";
    }
    if (progress >= 75 && progress < 100) {
      return "warning";
    }
    if (progress === 100) {
      return "success";
    }
  }

  static checkTempRange(state, target, actual, heatingVariation, coolDown) {
    if (state === "Active" || state === "Idle") {
      if (
        actual > target - parseInt(heatingVariation) &&
        actual < target + parseInt(heatingVariation)
      ) {
        return "tempSuccess";
      }
      return "tempActive";
    }
    if (state === "Complete") {
      if (actual > parseInt(coolDown)) {
        return "tempCooling";
      }
      return "tempCool";
    }
    // Offline
    return "tempOffline";
  }

  static async initFarmInformation() {
    farmStats = await FarmStatistics.find({});
    if (typeof farmStats === undefined || farmStats.length < 1) {
      const farmStart = new Date();
      const newfarmStats = new FarmStatistics({
        farmStart,
        heatMap,
      });
      farmStats[0] = newfarmStats;
      newfarmStats.save();
    } else if (typeof farmStats[0].heatMap === "undefined") {
      farmStats[0].heatMap = heatMap;
      dashboardStatistics.utilisationGraph = heatMap;
      farmStats[0].markModified("heatMap");
      farmStats[0].save();
    } else {
      heatMap = farmStats[0].heatMap;
      // Make sure array total is updated...
      const today = PrinterClean.getDay(new Date());
      for (let i = 0; i < heatMap.length; i++) {
        // If x = today add that fucker up!
        const lastInArray = heatMap[i].data.length - 1;
        if (heatMap[i].data[lastInArray].x === today) {
          if (heatMap[i].name === "Completed") {
            arrayTotal[0] = heatMap[i].data[lastInArray].figure;
          }
          if (heatMap[i].name === "Active") {
            arrayTotal[1] = heatMap[i].data[lastInArray].figure;
          }
          if (heatMap[i].name === "Offline") {
            arrayTotal[2] = heatMap[i].data[lastInArray].figure;
          }
          if (heatMap[i].name === "Idle") {
            arrayTotal[3] = heatMap[i].data[lastInArray].figure;
          }
          if (heatMap[i].name === "Disconnected") {
            arrayTotal[4] = heatMap[i].data[lastInArray].figure;
          }
        }
      }
    }
    return "Farm information inititialised...";
  }
}
module.exports = {
  PrinterClean,
};

//Hacky database check due to shoddy layout of code...
const mongoose = require("mongoose");

if (interval === false) {
  interval = setInterval(() => {
    if (mongoose.connection.readyState === 1) {
      PrinterClean.sortCurrentOperations(printersInformation);
      PrinterClean.statisticsStart();
      PrinterClean.createPrinterList(printersInformation, fmToggle);
    }
  }, 2500);
}
// PrinterClean.statisticsStart();
// PrinterClean.createPrinterList(printersInformation, fmToggle);
