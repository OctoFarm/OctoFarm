const Logger = require("../lib/logger.js");

const Profiles = require("../models/Profiles.js");
const Printers = require("../models/Printer.js");
const Filament = require("../models/Filament.js");
const softwareUpdateChecker = require("../services/octofarm-update.service");
const PrinterService = require("../services/printer.service");
const {
  getPowerSettingsDefault,
  mapStateToColor,
  getWolPowerSubSettingsDefault
} = require("./state.constants");
const { PrintersStore } = require("./printers.store");

const { OctoprintApiClientService } = require("../services/octoprint/octoprint-api-client.service");
const { HistoryCollection } = require("../runners/history.runner.js");
const { ServerSettings, filamentManager } = require("../settings/serverSettings.js");
const { PrinterClean } = require("../lib/dataFunctions/printerClean.js");
const { JobClean } = require("../lib/dataFunctions/jobClean.js");
const { FileClean } = require("../lib/dataFunctions/fileClean.js");
const { FilamentClean } = require("../lib/dataFunctions/filamentClean.js");
const { PrinterTicker } = require("../runners/printerTicker.js");

const logger = new Logger("OctoFarm-State");
let serverSettings = {};

let timeout = null;

class Runner {
  static octoPrintService = undefined;

  static getPrinter(id) {
    const i = _.findIndex(farmPrinters, function (o) {
      return o._id == id;
    });
    return farmPrinters[i];
  }

  static async init() {
    const server = await ServerSettings.check();
    serverSettings = server[0];
    timeout = serverSettings.timeout;

    this.octoPrintService = new OctoprintApiClientService(timeout);
    HistoryCollection.inject(this.octoPrintService);
    PrintersStore.inject(serverSettings);

    await PrintersStore.loadPrintersStore();
  }

  static async setupWebSocket(id, skipAPICheck) {
    const pState = this.getPrinter(id);

    const ws = new WebSocketClient();
    pState.attachWebsocketClient(ws);

    try {
      if (!!pState) {
        PrinterClean.generate(pState, serverSettings.filamentManager);
      }

      // TODO add internal catch in case of bad connection
      let isGlobalApiKey = await this.octoPrintService.checkApiKeyIsGlobal(printer, false);
      if (isGlobalApiKey) {
        throw new Error(
          "This printer was setup with a global API Key. This is a bad configuration state."
        );
      }

      // Make a connection attempt, and grab current user.
      let adminUsername = await this.octoPrintService.getAdminUserOrDefault(pState, false);
      await PrinterService.savePrinterAdminUsername(pState.id, adminUsername);

      pState.setApiSuccessState();

      PrinterTicker.addIssue(
        pState,
        `Attempting passive login for ${pState.currentUser}`,
        "Active"
      );

      const loginResponse = await this.octoPrintService.login(pState, false).then((r) => r.json());
      if (!!loginResponse?.session) {
        pState.setApiLoginSuccessState(loginResponse.session);
        PrinterTicker.addIssue(
          pState,
          `Passive Login with user: ${pState.currentUser}`,
          "Complete"
        );

        await Runner.getSystem(id);
        await Runner.getSettings(id);
        await Runner.getProfile(id);
        await Runner.getState(id);
        await Runner.getOctoPrintSystemInfo(id);
        await Runner.getPluginList(id);
        await Runner.getUpdates(id);
        if (typeof dbPrinter.fileList === "undefined" || typeof dbPrinter.storage === "undefined") {
          await Runner.getFiles(id, true);
        } else {
          const currentFilament = await Runner.compileSelectedFilament(
            dbPrinter.selectedFilament,
            i
          );
          FileClean.generate(dbPrinter, currentFilament);
          FileClean.statistics(farmPrinters);
        }

        // Connection to API successful, gather initial data and setup websocket.
        PrinterTicker.addIssue(dbPrinter, "API checks successful", "Complete");
        await pState.ws.open(`${dbPrinter.webSocketURL}/sockjs/websocket`, i);
      } else {
        throw new Error("OctoPrint login didnt return a sessionKey.");
      }

      // } else if (usersResponse.status === 503 || usersResponse.status === 404)
      // else 503/404 => No Connection "503" (WTF why is not found here...)
      // else 502 => booting "ECONNREFUSED"
      // else disconnected "NO-API" (We gave up, no internet?)
    } catch (e) {
      switch (e.code) {
        case "NO-API":
          try {
            logger.error(
              e.message,
              `Couldn't grab initial connection for Printer: ${pState.printerURL}`
            );
            PrinterTicker.addIssue(pState, `${e.message}: API issues... halting!`, "Disconnected");
            pState.state = "No-API";
            pState.stateColour = Runner.getColour("No-API");
            pState.hostState = "Online";
            pState.hostStateColour = Runner.getColour("Online");
            pState.webSocket = "danger";
            pState.stateDescription =
              "Could not connect to OctoPrints API please correct and manually refresh your printer";
            pState.hostDescription = "Host is Online";
            pState.webSocketDescription = "Websocket Offline";
            if (typeof pState !== "undefined") {
              PrinterClean.generate(pState, serverSettings.filamentManager);
            }
          } catch (e) {
            logger.error(
              `Couldn't set state of missing printer, safe to ignore: ${pState.index}: ${pState.printerURL}`
            );
          }
          break;
        case "999":
          try {
            logger.error(
              e.message,
              `Please generate an Application or User API Key to connect: ${pState.printerURL}`
            );
            PrinterTicker.addIssue(
              pState,
              `${e.message}: Please generate an Application or User API Key to connect...`,
              "Disconnected"
            );
            pState.state = "Incorrect API Key";
            pState.stateColour = Runner.getColour("Offline");
            pState.hostState = "Online";
            pState.hostStateColour = Runner.getColour("Online");
            pState.webSocket = "danger";
            pState.stateDescription = "OctoPrint is Offline";
            pState.hostDescription = "Host is Online";
            pState.webSocketDescription = "Websocket Offline";
            if (typeof pState !== "undefined") {
              PrinterClean.generate(pState, serverSettings.filamentManager);
            }
          } catch (e) {
            logger.error("Couldn't set state of missing printer, safe to ignore");
          }
          break;
        case "ECONNREFUSED":
          try {
            logger.error(
              e.message,
              `Couldn't grab initial connection for Printer: ${pState.printerURL}`
            );
            PrinterTicker.addIssue(
              pState,
              `${e.message}: Connection refused, trying again in: ${
                serverSettings.timeout.apiRetry / 1000
              } seconds`,
              "Disconnected"
            );
            pState.state = "Offline";
            pState.stateColour = Runner.getColour("Offline");
            pState.hostState = "Online";
            pState.hostStateColour = Runner.getColour("Online");
            pState.webSocket = "danger";
            pState.stateDescription = "OctoPrint is Offline";
            pState.hostDescription = "Host is Online";
            pState.webSocketDescription = "Websocket Offline";
            if (typeof pState !== "undefined") {
              PrinterClean.generate(pState, serverSettings.filamentManager);
            }
          } catch (e) {
            logger.error("Couldn't set state of missing printer, safe to ignore");
          }
          timeout = serverSettings.timeout;
          setTimeout(function () {
            Runner.setupWebSocket(id);
          }, timeout.apiRetry);
          break;
        case "ENOTFOUND":
          try {
            logger.error(
              e.message,
              `Couldn't grab initial connection for Printer: ${pState.printerURL}`
            );
            PrinterTicker.addIssue(
              pState,
              `${e.message}: Host not found, halting...`,
              "Disconnected"
            );
            pState.state = "Offline";
            pState.stateColour = Runner.getColour("Offline");
            pState.hostState = "Online";
            pState.hostStateColour = Runner.getColour("Online");
            pState.webSocket = "danger";
            pState.stateDescription = "OctoPrint is Offline";
            pState.hostDescription = "Host is Online";
            pState.webSocketDescription = "Websocket Offline";
            if (typeof pState !== "undefined") {
              PrinterClean.generate(pState, serverSettings.filamentManager);
            }
          } catch (e) {
            logger.error("Couldn't set state of missing printer, safe to ignore");
          }
          break;
        case "DELETED":
          logger.error(e.message, "Printer Deleted... Do not retry to connect");
          break;
        default:
          try {
            logger.error(
              e.message,
              `Couldn't grab initial connection for Printer: ${pState.printerURL}`
            );
            PrinterTicker.addIssue(
              pState,
              `${e.message} retrying in ${timeout.apiRetry / 1000} seconds`,
              "Disconnected"
            );
            pState.state = "Offline";
            pState.stateColour = Runner.getColour("Offline");
            pState.hostState = "Shutdown";
            pState.hostStateColour = Runner.getColour("Shutdown");
            pState.webSocket = "danger";
            pState.stateDescription = "OctoPrint is Offline";
            pState.hostDescription = "Host is Shutdown";
            pState.webSocketDescription = "Websocket Offline";
          } catch (e) {
            logger.error(
              `Couldn't set state of missing printer, safe to ignore: ${pState.index}: ${pState.printerURL}`
            );
          }
          if (typeof pState !== "undefined") {
            PrinterClean.generate(pState, serverSettings.filamentManager);
          }
          timeout = serverSettings.timeout;
          setTimeout(function () {
            Runner.setupWebSocket(id);
          }, timeout.apiRetry);
          break;
      }
    }
    if (typeof pState !== "undefined") {
      PrinterClean.generate(pState, serverSettings.filamentManager);
    }

    return true;
  }

  static async updatePrinters(printers) {
    // Updating printer's information
    logger.info("Pausing runners to update printers...");
    return [];
    // TODO we are not gonna edit only slight changes followed up with HUGE downtime delay.

    // PrintersStore.generatePrinterGroups();

    // for (let x = 0; x < changes.length; x++) {
    //   const printer = this.getPrinter(changes[x]);
    //   printer.state = "Searching...";
    //   printer.stateColour = Runner.getColour("Searching...");
    //   printer.hostState = "Searching...";
    //   printer.hostStateColour = Runner.getColour("Searching...");
    //   printer.webSocket = "danger";
    //   printer.stateDescription = "Re-Scanning your OctoPrint Instance";
    //   printer.hostDescription = "Re-Scanning for OctoPrint Host";
    //   printer.webSocketDescription = "Websocket is Offline";
    //   PrinterTicker.addIssue(printer, "Updating Printer information...", "Active");
    //   await this.reScanOcto(changes[x], true);
    //   if (changeIndex > -1) {
    //     const filter = { _id: printer._id };
    //     const update = printer;
    //     await Printers.findOneAndUpdate(filter, update, {
    //       returnOriginal: false
    //     });
    //     if (typeof printer !== "undefined") {
    //       PrinterClean.generate(printer);
    //     }
    //     PrinterTicker.addIssue(printer, "Printer information updated successfully...", "Complete");
    //   }
    // }
    // logger.info("Re-Scanning printers farm");
    // Regenerate sort index on printer update...

    // await this.reGenerateSortIndex();
  }

  static async trackCounters() {
    const deltaInterval = 30000;

    for (let p = 0; p < farmPrinters.length; p++) {
      const printer = farmPrinters[p];
      const stateCategory = printer.stateColour?.category;
      if (!stateCategory) {
        if (stateCategory === "Active") {
          printer.currentActive += deltaInterval;
        }
        if (
          stateCategory === "Idle" ||
          stateCategory === "Disconnected" ||
          stateCategory === "Complete"
        ) {
          printer.currentIdle += deltaInterval;
        }
        if (stateCategory === "Offline") {
          printer.currentOffline += deltaInterval;
        }
        printer.save().catch((e) => logger.info("Error Saving Counters, Safe to ignore...", e));
      }
    }
  }

  static async removePrinter(indexes) {
    // logger.info("Pausing runners to remove printer...");
    // await this.pause();
    let removed = [];
    if (indexes.length !== farmPrinters.length) {
      for (let i = 0; i < indexes.length; i++) {
        const printer = this.getPrinter(indexes[i]);

        if (index > -1) {
          logger.info(`Removing printer from database: ${printer._id}`);
          PrinterTicker.addIssue(printer, "Removing printer from database...", "Active");
          removed.push({
            printerURL: removedURL,
            printerId: removedIP
          });
          await Printers.findOneAndDelete({
            _id: printer._id
          });
          farmPrinters.splice(index, 1);
          PrinterTicker.addIssue(printer, "Successfully removed from database...", "Complete");
        }
      }

      // Regenerate Indexs
      for (let p = 0; p < farmPrinters.length; p++) {
        printer.state = "Resetting...";
        printer.stateColour = Runner.getColour("Searching...");
        printer.hostState = "Resetting...";
        printer.hostStateColour = Runner.getColour("Searching...");
        printer.webSocket = "danger";
        printer.stateDescription = "Attempting to connect to OctoPrint";
        printer.hostDescription = "Attempting to connect to OctoPrint";
        printer.webSocketDescription = "Websocket Offline";
        PrinterClean.generate(printer, serverSettings.filamentManager);
        await logger.info(`Regenerating existing indexes: ${printer.printerURL}`);
        PrinterTicker.addIssue(printer, `Regenerating Printer Index: ${p}`, "Active");
        printer.sortIndex = p;
        const filter = { _id: printer._id };
        const update = { sortIndex: p };
        await Printers.findOneAndUpdate(filter, update, {
          returnOriginal: false
        });
      }

      //Reset PrintersInformation for reload
      farmPrinters = [];
      await PrinterClean.removePrintersInformation();
      logger.info("Re-Scanning printers farm");
      this.init();
    } else {
      for (let i = 0; i < indexes.length; i++) {
        removed.push({
          printerURL: "",
          printerId: indexes[i]
        });
      }
      farmPrinters = [];
      await PrinterClean.removePrintersInformation();
      await Printers.deleteMany({});
      logger.info("Re-Scanning printers farm");
      PrinterTicker.addIssue(
        { printerURL: "All Printers" },
        "Successfully removed from the database...",
        "Complete"
      );
      this.init();
    }
    return removed;
  }

  static async reScanOcto(id, skipAPI) {
    const pState = this.getPrinter(id);
    const result = {
      status: null,
      msg: null
    };
    PrinterTicker.addIssue(pState, "ReScan Requested... checking socket state", "Active");
    pState.resetConnectionState();
    pState.resetSystemChecksState();
    PrinterClean.generate(pState, serverSettings.filamentManager);

    if (typeof pState.ws !== "undefined" && typeof pState.ws.instance !== "undefined") {
      PrinterTicker.addIssue(pState, `Websocket state ${pState.ws.instance.readyState}`, "Active");
      if (pState.ws.instance.readyState === 1) {
        PrinterTicker.addIssue(
          pState,
          "Socket currently active, closing and re-setting back up...",
          "Active"
        );
        await pState.ws.instance.close();
        logger.info(`Closed websocket connection for: ${pState.printerURL}`);
        const { _id } = pState;
        await this.setupWebSocket(_id, skipAPI);
      } else if (pState.ws.instance.readyState === 2) {
        PrinterTicker.addIssue(
          pState,
          "Socket in tentative state, awaiting for connection attempt to finish... retry in 2000ms",
          "Active"
        );
        pState.setWebsocketTentativeState();

        PrinterClean.generate(pState, serverSettings.filamentManager);

        // TODO call scheduler or emit event instead
        // setTimeout(function () {
        //   PrinterTicker.addIssue(pState, "Retrying socket...", "Active");
        //   Runner.reScanOcto(pState.id, skipAPI);
        // }, 2000);
      } else {
        PrinterTicker.addIssue(pState, "Socket currently closed... Re-opening...", "Active");
        const { _id } = pState;
        await pState.ws.instance.close();
        await this.setupWebSocket(_id, skipAPI);
      }
    } else {
      PrinterTicker.addIssue(pState, "Socket currently closed... Re-opening...", "Active");
      const { _id } = pState;
      await this.setupWebSocket(_id, skipAPI);
    }
    result.status = "success";
    result.msg = "Your client has been re-synced!";
    return result;
  }

  static async updatePoll() {
    for (let i = 0; i < farmPrinters.length; i++) {
      // Update the server
      const server = await ServerSettings.check();
      serverSettings = server[0];
      const Polling = serverSettings.onlinePolling;
      const throt = {};
      logger.info(`Updating websock poll time: ${(Polling.seconds * 1000) / 500}`);
      throt.throttle = parseInt((Polling.seconds * 1000) / 500);
      if (
        typeof farmPrinters[i].ws !== "undefined" &&
        typeof farmPrinters[i].ws.instance !== "undefined"
      ) {
        await farmPrinters[i].ws.instance.terminate();
      }
    }
    return "updated";
  }

  static async pause() {
    for (let i = 0; i < farmPrinters.length; i++) {
      if (
        typeof farmPrinters[i].ws !== "undefined" &&
        typeof farmPrinters[i].ws.instance !== "undefined"
      ) {
        await farmPrinters[i].ws.instance.close();
        logger.info(`Closed websocket connection for: ${farmPrinters[i].printerURL}`);
      }
    }
    return true;
  }

  static async getFile(id, fullPath) {
    const printer = this.getPrinter(id);
    const getFileInformation = await this.octoPrintService.getFile(printer, fullPath);
    const getJson = await getFileInformation.json();

    let timeStat = null;
    let filament = [];
    const entry = getJson;
    if (typeof entry.gcodeAnalysis !== "undefined") {
      if (typeof entry.gcodeAnalysis.estimatedPrintTime !== "undefined") {
        timeStat = entry.gcodeAnalysis.estimatedPrintTime;
        // Start collecting multiple tool lengths and information from files....
        Object.keys(entry.gcodeAnalysis.filament).forEach(function (item, i) {
          filament[i] = entry.gcodeAnalysis.filament[item].length;
        });
      } else {
        timeStat = "No Time Estimate";
        filament = null;
      }
    } else {
      timeStat = "No Time Estimate";
      filament = null;
    }
    let path = null;
    if (entry.path.indexOf("/") > -1) {
      path = entry.path.substr(0, entry.path.lastIndexOf("/"));
    } else {
      path = "local";
    }
    let thumbnail = null;

    if (typeof entry.thumbnail !== "undefined") {
      thumbnail = entry.thumbnail;
    }

    let success = 0;
    let failed = 0;
    let last = null;

    if (typeof entry.prints !== "undefined") {
      success = entry.prints.success;
      failed = entry.prints.failure;
      last = entry.prints.last.success;
    }

    return {
      path,
      fullPath: entry.path,
      display: entry.display,
      length: filament,
      name: entry.name,
      size: entry.size,
      time: timeStat,
      date: entry.date,
      thumbnail,
      success: success,
      failed: failed,
      last: last
    };
  }

  static async getFiles(id, recursive) {
    const printer = this.getPrinter(id);
    printer.systemChecks.scanning.files.status = "warning";
    // Shim to fix undefined on upload files/folders
    printer.fileList = {
      files: [],
      fileCount: 0,
      folders: [],
      folderCount: 0
    };
    PrinterTicker.addIssue(printer, "Grabbing file information...", "Active");

    return await this.octoPrintService
      .getFiles(printer, recursive)
      .then((res) => {
        return res.json();
      })
      .then(async (res) => {
        // Setup the files json storage object
        printer.storage = {
          free: res.free,
          total: res.total
        };
        printer.markModified("storage");
        // Setup the files location object to place files...
        const printerFiles = [];
        const printerLocations = [];
        const recursivelyPrintNames = async function (entry, depth) {
          // eslint-disable-next-line no-param-reassign
          depth = depth || 0;
          let timeStat = "";
          let filament = [];
          const isFolder = entry.type === "folder";
          if (!isFolder) {
            if (typeof entry.gcodeAnalysis !== "undefined") {
              if (typeof entry.gcodeAnalysis.estimatedPrintTime !== "undefined") {
                timeStat = entry.gcodeAnalysis.estimatedPrintTime;
                // Start collecting multiple tool lengths and information from files....
                Object.keys(entry.gcodeAnalysis.filament).forEach(function (item, i) {
                  filament[i] = entry.gcodeAnalysis.filament[item].length;
                });
              } else {
                timeStat = "No Time Estimate";
                filament = null;
              }
            } else {
              timeStat = "No Time Estimate";
              filament = null;
            }

            let path = null;
            if (entry.path.indexOf("/") > -1) {
              path = entry.path.substr(0, entry.path.lastIndexOf("/"));
            } else {
              path = "local";
            }
            let thumbnail = null;

            if (typeof entry.thumbnail !== "undefined") {
              thumbnail = entry.thumbnail;
            }

            let success = 0;
            let failed = 0;
            let last = null;

            if (typeof entry.prints !== "undefined") {
              success = entry.prints.success;
              failed = entry.prints.failure;
              last = entry.prints.last.success;
            }

            const file = {
              path,
              fullPath: entry.path,
              display: entry.display,
              length: filament,
              name: entry.name,
              size: entry.size,
              time: timeStat,
              date: entry.date,
              thumbnail,
              success: success,
              failed: failed,
              last: last
            };
            printerFiles.push(file);
          }

          const folderPaths = {
            name: "",
            path: ""
          };
          if (isFolder) {
            if (entry.path.indexOf("/") > -1) {
              folderPaths.path = entry.path.substr(0, entry.path.lastIndexOf("/"));
            } else {
              folderPaths.path = "local";
            }

            if (entry.path.indexOf("/")) {
              folderPaths.name = entry.path;
            } else {
              folderPaths.name = entry.path.substr(0, entry.path.lastIndexOf("/"));
            }
            folderPaths.display = folderPaths.name.replace("/_/g", " ");
            printerLocations.push(folderPaths);
          }

          if (isFolder) {
            _.each(entry.children, function (child) {
              recursivelyPrintNames(child, depth + 1);
            });
          }
        };

        _.each(res.files, function (entry) {
          recursivelyPrintNames(entry);
        });
        printer.fileList = {
          files: printerFiles,
          fileCount: printerFiles.length,
          folders: printerLocations,
          folderCount: printerLocations.length
        };
        printer.markModified("fileList");
        const currentFilament = await Runner.compileSelectedFilament(
          printer.selectedFilament,
          index
        );
        FileClean.generate(printer, currentFilament);
        printer.systemChecks.scanning.files.status = "success";
        printer.systemChecks.scanning.files.date = new Date();
        PrinterTicker.addIssue(printer, "Grabbed file information...", "Complete");
        FileClean.statistics(farmPrinters);
        logger.info(`Successfully grabbed Files for...: ${printer.printerURL}`);
        return true;
      })
      .catch((err) => {
        printer.systemChecks.scanning.files.status = "danger";
        printer.systemChecks.scanning.files.date = new Date();
        PrinterTicker.addIssue(printer, `Error grabbing file information: ${err}`, "Disconnected");
        logger.error(`Error grabbing files for: ${printer.printerURL}: Reason: `, err);
        return false;
      });
  }

  static getState(id) {
    const printer = this.getPrinter(id);
    printer.systemChecks.scanning.state.status = "warning";
    PrinterTicker.addIssue(printer, "Grabbing state information...", "Active");
    return this.octoPrintService
      .getConnection(printer, true)
      .then((res) => {
        return res.json();
      })
      .then(async (res) => {
        // Update info to DB
        if (res.current.state === "Offline") {
          res.current.state = "Disconnected";
          printer.stateDescription = "Your printer is disconnected";
        } else if (res.current.state.includes("Error:")) {
          printer.stateDescription = res.current.state;
          res.current.state = "Error!";
        } else if (res.current.state === "Closed") {
          res.current.state = "Disconnected";
          printer.stateDescription = "Your printer is disconnected";
        } else {
          printer.stateDescription = "Current Status from OctoPrint";
        }
        printer.current = res.current;
        printer.options = res.options;
        printer.job = null;
        printer.systemChecks.scanning.state.status = "success";
        printer.systemChecks.scanning.state.date = new Date();
        const currentFilament = JSON.parse(JSON.stringify(printer.selectedFilament));

        JobClean.generate(printer, currentFilament);
        PrinterTicker.addIssue(printer, "Grabbed state information...", "Complete");
        logger.info(`Successfully grabbed Current State for...: ${printer.printerURL}`);
      })
      .catch((err) => {
        printer.systemChecks.scanning.state.status = "danger";
        printer.systemChecks.scanning.state.date = new Date();
        PrinterTicker.addIssue(printer, `Error grabbing state information: ${err}`, "Disconnected");
        logger.error(`Error grabbing state for: ${printer.printerURL} Reason: `, err);
        return false;
      });
  }

  static getProfile(id) {
    const printer = this.getPrinter(id);
    printer.systemChecks.scanning.profile.status = "warning";
    PrinterTicker.addIssue(printer, "Grabbing profile information...", "Active");
    return this.octoPrintService
      .getPrinterProfiles(printer, true)
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        // Update info to DB
        printer.profiles = res.profiles;
        printer.systemChecks.scanning.profile.status = "success";
        printer.systemChecks.scanning.profile.date = new Date();
        PrinterTicker.addIssue(printer, "Grabbed profile information...", "Complete");
        logger.info(`Successfully grabbed Profiles.js for...: ${printer.printerURL}`);
      })
      .catch((err) => {
        PrinterTicker.addIssue(
          printer,
          `Error grabbing profile information: ${err}`,
          "Disconnected"
        );
        printer.systemChecks.scanning.profile.status = "danger";
        printer.systemChecks.scanning.profile.date = new Date();
        logger.error(`Error grabbing profile for: ${printer.printerURL}: Reason: `, err);
        return false;
      });
  }

  static getPluginList(id) {
    const printer = this.getPrinter(id);
    if (softwareUpdateChecker.getUpdateNotificationIfAny().air_gapped) {
      PrinterTicker.addIssue(
        printer,
        `Farm is air gapped, skipping OctoPrint plugin list request`,
        "Active"
      );
      return false;
    }

    printer.pluginsList = [];
    PrinterTicker.addIssue(printer, "Grabbing plugin list", "Active");

    return this.octoPrintService
      .getPluginManager(printer, true)
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        printer.pluginsList = res.repository.plugins;
        PrinterTicker.addIssue(
          printer,
          `Grabbed plugin list (OctoPrint compatibility: ${printer.octoPrintVersion})`,
          "Complete"
        );
      })
      .catch((err) => {
        PrinterTicker.addIssue(
          printer,
          `Error grabbing plugin list information: ${err}`,
          "Disconnected"
        );
        logger.error(`Error grabbing plugin list for: ${printer.printerURL}: Reason: `, err);
        return false;
      });
  }

  static getOctoPrintSystemInfo(id) {
    const printer = this.getPrinter(id);
    printer.octoPrintSystemInfo = {};
    PrinterTicker.addIssue(printer, "Grabbing OctoPrint's System Information", "Active");
    return this.octoPrintService
      .getSystemInfo(printer, true)
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        printer.octoPrintSystemInfo = res.systeminfo;
        PrinterTicker.addIssue(printer, "Grabbed OctoPrints System Info", "Complete");
      })
      .catch((err) => {
        PrinterTicker.addIssue(
          printer,
          `Error grabbing system information: ${err}`,
          "Disconnected"
        );
        printer.systemChecks.scanning.profile.status = "danger";
        printer.systemChecks.scanning.profile.date = new Date();
        logger.error(`Error grabbing system for: ${printer.printerURL}: Reason: `, err);
        return false;
      });
  }

  static getUpdates(id, force = false) {
    const printer = this.getPrinter(id);
    if (softwareUpdateChecker.getUpdateNotificationIfAny().air_gapped) {
      PrinterTicker.addIssue(
        printer,
        `Farm is air gapped, skipping OctoPrint updates request`,
        "Active"
      );
      return false;
    }
    printer.octoPrintUpdate = [];
    printer.octoPrintPluginUpdates = [];

    PrinterTicker.addIssue(printer, "Checking OctoPrint for updates...", "Active");

    return this.octoPrintService
      .getSoftwareUpdateCheck(printer, force, true)
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        let octoPrintUpdate = false;
        let pluginUpdates = [];
        for (var key in res.information) {
          if (res.information.hasOwnProperty(key)) {
            if (res.information[key].updateAvailable) {
              if (key === "octoprint") {
                octoPrintUpdate = {
                  id: key,
                  displayName: res.information[key].displayName,
                  displayVersion: res.information[key].displayVersion,
                  updateAvailable: res.information[key].updateAvailable,
                  releaseNotesURL: res.information[key].releaseNotes
                };
              } else {
                pluginUpdates.push({
                  id: key,
                  displayName: res.information[key].displayName,
                  displayVersion: res.information[key].displayVersion,
                  updateAvailable: res.information[key].updateAvailable,
                  releaseNotesURL: res.information[key].releaseNotes
                });
              }
            }
          }
        }
        printer.octoPrintUpdate = octoPrintUpdate;
        printer.octoPrintPluginUpdates = pluginUpdates;

        PrinterTicker.addIssue(printer, "Octoprints checked for updates...", "Complete");
      })
      .catch((err) => {
        PrinterTicker.addIssue(
          printer,
          `Error grabbing octoprint updates information: ${err}`,
          "Disconnected"
        );
        logger.error(`Error grabbing octoprint updates for: ${printer.printerURL}: Reason: `, err);
        return false;
      });
  }

  static async killPowerSettings(printerID) {
    try {
      const fprinter = this.getPrinter(id);
      fprinter.powerSettings = getPowerSettingsDefault();
      fprinter.powerSettings.wol = {
        enabled: fprinter.powerSettings.wol.enabled,
        ip: fprinter.powerSettings.wol.ip,
        packets: fprinter.powerSettings.wol.packets,
        port: fprinter.powerSettings.wol.port,
        interval: fprinter.powerSettings.wol.interval,
        MAC: fprinter.powerSettings.wol.MAC
      };
      const printer = await Printers.findById(fprinter._id);
      printer.powerSettings = printer.powerSettings;
      printer.save();
      return true;
    } catch (e) {
      return false;
    }
  }

  static async getSettings(id) {
    const printer = this.getPrinter(id);
    printer.systemChecks.scanning.settings.status = "warning";
    PrinterTicker.addIssue(printer, "Grabbing settings information...", "Active");
    return this.octoPrintService
      .getSettings(printer, true)
      .then((res) => {
        return res.json();
      })
      .then(async (res) => {
        // Update info to DB
        printer.corsCheck = res.api.allowCrossOrigin;
        printer.settingsApi = res.api;
        if (!printer.settingsAppearance) {
          printer.settingsAppearance = res.appearance;
        } else if (printer.settingsAppearance.name === "") {
          printer.settingsAppearance.name = res.appearance.name;
        }
        if (res.plugins["pi_support"]) {
          PrinterTicker.addIssue(
            printer,
            "Pi Plugin detected... scanning for version information...",
            "Active"
          );

          let piSupport = await this.octoPrintService.getPluginPiSupport(printer);
          piSupport = await piSupport.json();

          printer.octoPi = {
            model: piSupport.model,
            version: piSupport.octopi_version
          };

          PrinterTicker.addIssue(printer, "Sucessfully grabbed OctoPi information...", "Complete");
        }
        if (res.plugins.costestimation) {
          if (_.isEmpty(printer.costSettings) || printer.costSettings.powerConsumption === 0.5) {
            PrinterTicker.addIssue(
              printer,
              "Cost Plugin detected... Updating OctoFarms Cost settings",
              "Active"
            );
            printer.costSettings = {
              powerConsumption: res.plugins.costestimation.powerConsumption,
              electricityCosts: res.plugins.costestimation.costOfElectricity,
              purchasePrice: res.plugins.costestimation.priceOfPrinter,
              estimateLifespan: res.plugins.costestimation.lifespanOfPrinter,
              maintenanceCosts: res.plugins.costestimation.maintenanceCosts
            };
            const printer = await Printers.findById(id);

            await printer.save();
            PrinterTicker.addIssue(printer, "Saved Cost Estimation settings", "Complete");
          }
        }

        if (res.plugins["psucontrol"]) {
          if (_.isEmpty(printer.powerSettings) && printer.powerSettings.powerOffCommand === "") {
            PrinterTicker.addIssue(
              new Date(),
              printer,
              "PSU Control plugin detected... Updating OctoFarm power settings...",
              "Active"
            );
            printer.powerSettings = {
              powerOnCommand: '{"command":"turnPSUOn"}',
              powerOnURL: "[PrinterURL]/api/plugin/psucontrol",
              powerOffCommand: '{"command":"turnPSUOff"}',
              powerOffURL: "[PrinterURL]/api/plugin/psucontrol",
              powerToggleCommand: '{"command":"togglePSU"}',
              powerToggleURL: "[PrinterURL]/api/plugin/psucontrol",
              powerStatusCommand: '{"command":"getPSUState"}',
              powerStatusURL: "[PrinterURL]/api/plugin/psucontrol",
              wol: getWolPowerSubSettingsDefault()
            };
            const printer = await Printers.findById(id);

            await printer.save();
            PrinterTicker.addIssue(
              new Date(),
              printer.printerURL,
              "Successfully saved PSU control settings...",
              "Complete",
              printer._id
            );
          }
        }
        printer.settingsFeature = res.feature;
        printer.settingsFolder = res.folder;
        printer.settingsPlugins = res.plugins;
        printer.settingsScripts = res.scripts;
        printer.settingsSerial = res.serial;
        printer.settingsServer = res.server;
        printer.settingsSystem = res.system;
        printer.settingsWebcam = res.webcam;
        if (printer.camURL === "") {
          if (
            typeof res.webcam !== "undefined" &&
            typeof res.webcam.streamUrl !== "undefined" &&
            res.webcam.streamUrl != null
          ) {
            if (res.webcam.streamUrl.includes("http")) {
              printer.camURL = res.webcam.streamUrl;
            } else {
              printer.camURL = printer.printerURL + res.webcam.streamUrl;
            }
            const printer = await Printers.findById(id);
            printer.camURL = printer.camURL;
            await printer.save();
          }
        }

        PrinterTicker.addIssue(
          new Date(),
          printer.printerURL,
          "Grabbed settings information...",
          "Complete",
          printer._id
        );

        printer.systemChecks.scanning.settings.status = "success";
        printer.systemChecks.scanning.settings.date = new Date();
        logger.info(`Successfully grabbed Settings for...: ${printer.printerURL}`);
      })
      .catch((err) => {
        PrinterTicker.addIssue(
          new Date(),
          printer.printerURL,
          `Error grabbing settings information: ${err}`,
          "Offline",
          printer._id
        );
        printer.systemChecks.scanning.settings.status = "danger";
        printer.systemChecks.scanning.settings.date = new Date();
        logger.error(`Error grabbing settings for: ${printer.printerURL}: Reason: `, err);
        return false;
      });
  }

  static getSystem(id) {
    const printer = this.getPrinter(id);
    printer.systemChecks.scanning.system.status = "warning";
    PrinterTicker.addIssue(printer, "Grabbing system information...", "Active");
    return this.octoPrintService
      .getSystemCommands(printer, true)
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        // Update info to DB
        // TODO WHAT THE IS CORE???
        // printer.core = res.core;

        printer.setSystemSuccessState();
        PrinterTicker.addIssue(new Date(), printer, "Grabbed system information...", "Complete");

        logger.info(`Successfully grabbed System Information for...: ${printer.printerURL}`);
      })
      .catch((err) => {
        PrinterTicker.addIssue(printer, `Error grabbing system information: ${err}`, "Offline");
        printer.setSystemSuccessState(true);
        logger.error(`Error grabbing system for: ${printer.printerURL}: Reason: `, err);
        return false;
      });
  }

  // Patch for updating OctoPrint's settings for now until re-work of printer cache with state.js.
  static async getLatestOctoPrintSettingsValues(id) {
    const printer = this.getPrinter(id);
    // This was causing slowdown of settings pages when loading, we should only be running this command when printer is considered online.
    if (printer.state !== "Offline") {
      // This is why the settings we're not updating! Forgot that connection options and preferences come in state, not settings/system.
      await Runner.getState(id);
      // Update the printers cached settings from OctoPrint
      await Runner.getSettings(id);
      // Update the printers cached system settings from OctoPrint
      await Runner.getSystem(id);
      // Re-generate the printer clean information - This is just cautionary, my tests showed it wasn't needed.
    }

    await PrinterClean.generate(printer, serverSettings.filamentManager);
  }

  static async removeFile(printer, fullPath) {
    const fprinter = this.getPrinter(printer._id);

    const index = await _.findIndex(fprinter.fileList.files, function (o) {
      return o.fullPath === fullPath;
    });
    fprinter.fileList.files.splice(index, 1);
    fprinter.fileList.fileCount = fprinter.fileList.files.length;
    fprinter.markModified("fileList");
    fprinter.save();
    const currentFilament = await Runner.compileSelectedFilament(fprinter.selectedFilament, i);
    FileClean.generate(fprinter, currentFilament);
    FileClean.statistics(farmPrinters);
  }

  static async compileSelectedFilament(selectedFilament, i) {
    const currentFilament = JSON.parse(JSON.stringify(selectedFilament));
    for (let s = 0; s < selectedFilament.length; s++) {
      if (selectedFilament[s] !== null) {
        let profile = null;
        try {
          if (serverSettings.filamentManager) {
            profile = await Profiles.findOne({
              "profile.index": selectedFilament[s].spools.profile
            });
          } else {
            profile = await Profiles.findById(selectedFilament[s].spools.profile);
          }
          currentFilament[s].spools.profile = profile.profile;
          farmPrinters[i].selectedFilament[s].spools.material = profile.profile.material;
        } catch (e) {
          logger.error("Couldn't find profile", e);
        }
      }
    }
    return currentFilament;
  }

  static async reSyncFile(id, fullPath) {
    const printer = this.getPrinter(id);
    const fileID = _.findIndex(printer.fileList.files, function (o) {
      return o.fullPath == fullPath;
    });
    // Doesn't actually resync just the file... shhh
    printer.fileList.files[fileID] = await Runner.getFile(id, fullPath);
    printer.markModified("fileList");
    printer.save();
    const currentFilament = await Runner.compileSelectedFilament(printer.selectedFilament, i);
    FileClean.generate(printer, currentFilament);
    FileClean.statistics(farmPrinters);

    return true;
  }

  static async flowRate(id, newRate) {
    const fprinter = this.getPrinter(id);
    fprinter.flowRate = newRate;
    const printer = await Printers.findById(id);
    printer.flowRate = fprinter.flowRate;
    printer.save();
    PrinterClean.generate(fprinter, serverSettings.filamentManager);
  }

  static async feedRate(id, newRate) {
    const fprinter = this.getPrinter(id);
    fprinter.feedRate = newRate;
    const printer = await Printers.findById(id);
    printer.feedRate = fprinter.feedRate;
    printer.save();
    PrinterClean.generate(fprinter, serverSettings.filamentManager);
  }

  static async updateSortIndex(list) {
    // Update the live information
    for (let i = 0; i < farmPrinters.length; i++) {
      const fprinter = this.getPrinter(list[i]);
      fprinter.sortIndex = i;
      PrinterClean.generate(fprinter, serverSettings.filamentManager);
      const printer = await Printers.findById(list[i]);
      printer.sortIndex = i;
      printer.save();
      PrinterClean.generate(fprinter, serverSettings.filamentManager);
    }
  }

  static stepRate(id, newRate) {
    const printer = this.getPrinter(id);
    printer.stepRate = newRate;
    PrinterClean.generate(printer, serverSettings.filamentManager);
  }

  static async updateSettings(settings) {
    function difference(object, base) {
      function changes(object, base) {
        try {
          return _.transform(object, function (result, value, key) {
            if (!_.isEqual(value, base[key])) {
              result[key] =
                _.isObject(value) && _.isObject(base[key]) ? changes(value, base[key]) : value;
            }
          });
        } catch (e) {
          logger.error("Error detecting changes", e);
        }
      }

      try {
        return changes(object, base);
      } catch (e) {
        logger.error("Error detecting changes", e);
      }
    }

    try {
      const printer = await Printers.findById(settings.printer.index);
      const fprinter = this.getPrinter(id);
      let updatePrinter = false;
      if (
        settings.printer.printerName !== "" &&
        settings.printer.printerName !== fprinter.settingsAppearance.name
      ) {
        fprinter.settingsAppearance.name = settings.printer.printerName;
        printer.settingsAppearance.name = settings.printer.printerName;
        printer.markModified("settingsApperance");
        updatePrinter = true;
      }
      let profile = {};
      let sett = {};
      profile.status = 900;
      sett.status = 900;
      if (
        settings.printer.printerURL !== "" &&
        settings.printer.printerURL !== fprinter.printerURL
      ) {
        fprinter.printerURL = settings.printer.printerURL;
        printer.printerURL = settings.printer.printerURL;
        printer.markModified("printerURL");
        updatePrinter = true;
      }

      const currentWebSocketURL = new URL(fprinter.webSocketURL);
      if (settings.printer.webSocketProtocol !== currentWebSocketURL.protocol + "//") {
        // If we detect q difference then rebuild the websocket URL and mark for scan.
        printer.webSocketURL = settings.printer.webSocketProtocol + currentWebSocketURL.host;
        fprinter.webSocketURL = settings.printer.webSocketProtocol + currentWebSocketURL.host;
        printer.markModified("webSocketURL");
        updatePrinter = true;
      }
      if (settings.printer.cameraURL !== "" && settings.printer.cameraURL !== fprinter.camURL) {
        fprinter.camURL = settings.printer.cameraURL;
        printer.camURL = settings.printer.cameraURL;
        printer.markModified("camURL");
      }
      // Moved the update printer before the API print calls as it was causing errors to be caught in the api calls when offline... This was why it wasn't updating I believe as it was never firing the rescan code due to the catch.
      if (settings.printer.apikey !== "" && settings.printer.apikey !== fprinter.apikey) {
        fprinter.apikey = settings.printer.apikey;
        printer.apikey = settings.printer.apikey;
        printer.markModified("apikey");
        updatePrinter = true;
      }

      // Make sure OctoPrint status is updated before continuing on with settings...
      if (updatePrinter) {
        await Runner.reScanOcto(fprinter._id, false);
      }

      // Update the baudrate preferences.
      // This would also currently need silly blank checking in place due to the client. Will sort in the refactor.
      // TODO: Update this mechanism in the refactor... and the rest XD
      fprinter.options = {
        baudratePreference: settings.connection.preferredBaud,
        portPreference: settings.connection.preferredPort,
        printerProfilePreference: settings.connection.preferredProfile
      };

      if (typeof settings.other !== "undefined" && settings.other.coolDown != "") {
        fprinter.tempTriggers.coolDown = parseInt(settings.other.coolDown);
        printer.tempTriggers.coolDown = parseInt(settings.other.coolDown);
        printer.markModified("tempTriggers");
      }
      if (typeof settings.other !== "undefined" && settings.other.heatingVariation != "") {
        fprinter.tempTriggers.heatingVariation = parseFloat(settings.other.heatingVariation);
        printer.tempTriggers.heatingVariation = parseFloat(settings.other.heatingVariation);
        printer.markModified("tempTriggers");
      }
      for (const key in settings.costSettings) {
        if (!_.isNull(settings.costSettings[key])) {
          fprinter.costSettings[key] = settings.costSettings[key];
          printer.costSettings[key] = settings.costSettings[key];
        }
      }

      printer.markModified("costSettings");
      let differences = difference(settings.costSettings, fprinter.costSettings);

      for (const key in differences) {
        if (differences[key] !== null && differences[key] !== "") {
          fprinter.costSettings[key] = differences[key];
          printer.costSettings[key] = differences[key];
        }
      }

      if (
        settings.powerCommands.powerOnCommand !== "" &&
        settings.powerCommands.powerOnCommand !== fprinter.powerSettings.powerOnCommand
      ) {
        fprinter.powerSettings.powerOnCommand = settings.powerCommands.powerOnCommand;
        printer.powerSettings.powerOnCommand = settings.powerCommands.powerOnCommand;
      }
      if (
        settings.powerCommands.powerOnURL !== "" &&
        settings.powerCommands.powerOnURL !== fprinter.powerSettings.powerOnURL
      ) {
        fprinter.powerSettings.powerOnURL = settings.powerCommands.powerOnURL;
        printer.powerSettings.powerOnURL = settings.powerCommands.powerOnURL;
      }
      if (
        settings.powerCommands.powerOffCommand !== "" &&
        settings.powerCommands.powerOffCommand !== fprinter.powerSettings.powerOffCommand
      ) {
        fprinter.powerSettings.powerOffCommand = settings.powerCommands.powerOffCommand;
        printer.powerSettings.powerOffCommand = settings.powerCommands.powerOffCommand;
      }
      if (
        settings.powerCommands.powerOffURL !== "" &&
        settings.powerCommands.powerOffURL !== fprinter.powerSettings.powerOffURL
      ) {
        printer.powerSettings.powerOffURL = settings.powerCommands.powerOffURL;
        fprinter.powerSettings.powerOffURL = settings.powerCommands.powerOffURL;
      }
      if (
        settings.powerCommands.powerToggleCommand !== "" &&
        settings.powerCommands.powerToggleCommand !== fprinter.powerSettings.powerToggleCommand
      ) {
        printer.powerSettings.powerToggleCommand = settings.powerCommands.powerToggleCommand;
        fprinter.powerSettings.powerToggleCommand = settings.powerCommands.powerToggleCommand;
      }
      if (
        settings.powerCommands.powerToggleURL !== "" &&
        settings.powerCommands.powerToggleURL !== fprinter.powerSettings.powerToggleURL
      ) {
        printer.powerSettings.powerToggleURL = settings.powerCommands.powerToggleURL;
        fprinter.powerSettings.powerToggleURL = settings.powerCommands.powerToggleURL;
      }
      if (
        settings.powerCommands.powerStatusCommand !== "" &&
        settings.powerCommands.powerStatusCommand !== fprinter.powerSettings.powerStatusCommand
      ) {
        fprinter.powerSettings.powerStatusCommand = settings.powerCommands.powerStatusCommand;
        printer.powerSettings.powerStatusCommand = settings.powerCommands.powerStatusCommand;
      }
      if (
        settings.powerCommands.powerStatusURL !== "" &&
        settings.powerCommands.powerStatusURL !== fprinter.powerSettings.powerStatusURL
      ) {
        fprinter.powerSettings.powerStatusURL = settings.powerCommands.powerStatusURL;
        printer.powerSettings.powerStatusURL = settings.powerCommands.powerStatusURL;
      }
      if (settings.powerCommands.wol.enabled) {
        fprinter.powerSettings.wol = settings.powerCommands.wol;
      }

      printer.markModified("powerSettings");

      if (settings.systemCommands.serverRestart !== "") {
        fprinter.settingsServer.commands.serverRestartCommand =
          settings.systemCommands.serverRestart;
      }
      if (settings.systemCommands.systemRestart !== "") {
        fprinter.settingsServer.commands.systemRestartCommand =
          settings.systemCommands.systemRestart;
      }
      if (settings.systemCommands.systemShutdown !== "") {
        fprinter.settingsServer.commands.systemShutdownCommand =
          settings.systemCommands.systemShutdown;
      }

      printer.save().catch((e) => {
        logger.error(JSON.stringify(e), "ERROR savin power settings.");
      });
      // Made the state check from the server, not the client...
      if (fprinter.state !== "Offline") {
        // Gocde update printer and Live
        let updateOctoPrintGcode = {};
        for (const key in settings.gcode) {
          if (settings.gcode[key].length !== 0) {
            updateOctoPrintGcode[key] = settings.gcode[key];
            fprinter.settingsScripts.gcode[key] = settings.gcode[key];
          }
        }
        const opts = {
          settingsAppearance: {
            name: fprinter.settingsAppearance.name
          },
          scripts: {
            gcode: updateOctoPrintGcode
          },
          serial: {
            port: settings.connection.preferredPort,
            baudrate: settings.connection.preferredBaud
          },
          server: {
            commands: {
              systemShutdownCommand: settings.systemCommands.systemShutdown,
              systemRestartCommand: settings.systemCommands.systemRestart,
              serverRestartCommand: settings.systemCommands.serverRestart
            }
          },
          // Due to now grabbing the updated state, the client won't have actually sent the "Other" settings tab so these would be undefined.
          webcam: {
            webcamEnabled: settings.other?.enableCamera,
            timelapseEnabled: settings.other?.enableTimeLapse,
            rotate90: settings.other?.rotateCamera,
            flipH: settings.other?.flipHCamera,
            flipV: settings.other?.flipVCamera
          }
        };

        const removeObjectsWithNull = (obj) => {
          return _(obj)
            .pickBy(_.isObject) // get only objects
            .mapValues(removeObjectsWithNull) // call only for values as objects
            .assign(_.omitBy(obj, _.isObject)) // save back result that is not object
            .omitBy(_.isNil) // remove null and undefined from object
            .value(); // get value
        };

        let cleanProfile = removeObjectsWithNull(opts);

        const printerUrl = fprinter.printerURL;
        const printerApiKey = fprinter.apikey;
        const patchApiResource = `/api/printerprofiles/${settings.profileID}`;
        const profilePatch = { profile: cleanProfile };
        profile = await this.octoPrintService.patch(
          printerUrl,
          printerApiKey,
          patchApiResource,
          profilePatch,
          false
        );

        // Update octoprint settings
        const settingsApiRoute = `/api/settings`;
        sett = await this.octoPrintService.post(
          printerUrl,
          printerApiKey,
          settingsApiRoute,
          opts,
          false
        );
      }

      PrinterClean.generate(fprinter, filamentManager);

      return {
        status: {
          octofarm: 200,
          profile: profile.status,
          settings: sett.status
        },
        printer
      };
    } catch (e) {
      logger.error("ERROR updating printer ", JSON.stringify(e.message));
      return {
        status: { octofarm: 400, profile: 900, settings: 900 }
      };
    }
  }

  static async moveFile(id, newPath, fullPath, filename) {
    const printer = this.getPrinter(id);
    const file = _.findIndex(printer.fileList.files, function (o) {
      return o.name === filename;
    });
    printer.fileList.files[file].path = newPath;
    printer.fileList.files[file].fullPath = fullPath;
    printer.markModified("fileList");
    printer.save();
    const currentFilament = await Runner.compileSelectedFilament(printer.selectedFilament, i);
    FileClean.generate(printer, currentFilament);
    FileClean.statistics(farmPrinters);
  }

  static async moveFolder(id, oldFolder, fullPath, folderName) {
    const printer = this.getPrinter(id);
    const file = _.findIndex(printer.fileList.folders, function (o) {
      return o.name === oldFolder;
    });
    printer.fileList.files.forEach((file, index) => {
      if (file.path === oldFolder) {
        const fileName = printer.fileList.files[index].fullPath.substring(
          printer.fileList.files[index].fullPath.lastIndexOf("/") + 1
        );
        printer.fileList.files[index].fullPath = `${folderName}/${fileName}`;
        printer.fileList.files[index].path = folderName;
      }
    });
    printer.fileList.folders[file].name = folderName;
    printer.fileList.folders[file].path = fullPath;
    printer.markModified("fileList");
    printer.save();
    const currentFilament = await Runner.compileSelectedFilament(printer.selectedFilament, i);
    FileClean.generate(printer, currentFilament);
    FileClean.statistics(farmPrinters);
  }

  static async deleteFolder(id, fullPath) {
    const printer = this.getPrinter(id);
    printer.fileList.files.forEach((file, index) => {
      if (file.path === fullPath) {
        printer.fileList.files.splice(index, 1);
      }
    });
    printer.fileList.folders.forEach((folder, index) => {
      if (folder.path === fullPath) {
        printer.fileList.folders.splice(index, 1);
      }
    });
    const folder = _.findIndex(printer.fileList.folders, function (o) {
      return o.name === fullPath;
    });
    printer.fileList.folders.splice(folder, 1);
    printer.fileList.fileCount = printer.fileList.files.length;
    printer.fileList.folderCount = printer.fileList.folders.length;
    printer.markModified("fileList");
    printer.save();
    const currentFilament = await Runner.compileSelectedFilament(printer.selectedFilament, i);
    FileClean.generate(printer, currentFilament);
    FileClean.statistics(farmPrinters);
  }

  static async newFolder(folder) {
    const index = folder.i;
    const printer = this.getPrinter(index);
    let path = "local";
    let name = folder.foldername;
    if (folder.path !== "") {
      path = folder.path;
      name = `${path}/${name}`;
    }
    const display = JSON.parse(JSON.stringify(name));
    name = name.replace(/ /g, "_");
    const newFolder = {
      name,
      path,
      display
    };

    printer.fileList.folders.push(newFolder);
    printer.fileList.folderCount = printer.fileList.folders.length;
    printer.markModified("fileList");
    printer.save();
    const currentFilament = await Runner.compileSelectedFilament(printer.selectedFilament, i);
    FileClean.generate(printer, currentFilament);
    FileClean.statistics(farmPrinters);
  }

  static async updateFilament() {
    for (let i = 0; i < farmPrinters.length; i++) {
      const printer = this.getPrinter(index);
      if (Array.isArray(printer.selectedFilament)) {
        for (let f = 0; f < printer.selectedFilament.length; f++) {
          if (printer.selectedFilament[f] !== null) {
            const newInfo = await Filament.findById(printer.selectedFilament[f]._id);
            const printer = await Printers.findById(printer._id);
            printer.selectedFilament[f] = newInfo;
            printer.selectedFilament[f] = newInfo;
            printer.save();
            const currentFilament = await Runner.compileSelectedFilament(
              printer.selectedFilament,
              i
            );
            FileClean.generate(printer, currentFilament);
          }
        }
      } else if (printer.selectedFilament != null) {
        const newInfo = await Filament.findById(printer.selectedFilament._id);
        const printer = await Printers.findById(printer._id);
        printer.selectedFilament = newInfo;
        printer.selectedFilament = newInfo;
        printer.save();
        const currentFilament = await Runner.compileSelectedFilament(printer.selectedFilament, i);
        FileClean.generate(printer, currentFilament);
      }
    }
  }

  static async selectedFilament(printerId, filamentId, tool) {
    const fprinter = this.getPrinter(index);
    const printer = await Printers.findById(printerId);
    // Check if filament already attached...
    // New selectedFilament array, so not array... none selected setup new.

    if (filamentId == 0) {
      printer.selectedFilament[tool] = null;
      fprinter.selectedFilament[tool] = null;
      // Find in selected filament list and remove
      const selected = _.findIndex(fprinter.selectedFilament, function (o) {
        return o == filamentId;
      });
    } else if (!Array.isArray(fprinter.selectedFilament)) {
      // Setup new spool...
      // Make sure selectedFilament is an array
      fprinter.selectedFilament = [];
      printer.selectedFilament = [];
      // Find the spool in the database...
      const spool = await Filament.findById(filamentId);
      // Save the spool to correct tool slot in filament array
      printer.selectedFilament[tool] = spool;
      fprinter.selectedFilament[tool] = spool;
    } else {
      // Already and array... check if spool already selected
      const spool = await Filament.findById(filamentId);
      printer.selectedFilament[tool] = spool;
      fprinter.selectedFilament[tool] = spool;
    }
    printer.markModified("selectedFilament");
    printer.save().then(async () => {
      const currentFilament = await Runner.compileSelectedFilament(fprinter.selectedFilament, i);
      FileClean.generate(fprinter, currentFilament);
    });
  }

  static async newFile(file) {
    const date = new Date();

    file = file.files.local;

    let path = "";
    if (file.path.indexOf("/") > -1) {
      path = file.path.substr(0, file.path.lastIndexOf("/"));
    } else {
      path = "local";
    }
    const fileDisplay = file.name.replace(/_/g, " ");
    const data = {
      path: path,
      fullPath: file.path,
      display: fileDisplay,
      length: null,
      name: file.name,
      size: null,
      time: null,
      date: date.getTime() / 1000,
      thumbnail: null,
      success: 0,
      failed: 0,
      last: null
    };

    const printer = this.getPrinter(file.index);
    printer.fileList.files.push(data);
    printer.markModified("fileList");
    printer.save();

    const currentFilament = await Runner.compileSelectedFilament(printer.selectedFilament, i);
    FileClean.generate(printer, currentFilament);
    FileClean.statistics(farmPrinters);
    await this.updateFile(printer.fileList.files[printer.fileList.files.length - 1], i);
  }

  static async updateFile(file, i) {
    const printer = farmPrinters[i];
    if (fileTimeout <= 20000) {
      logger.info(
        `Updating new file ${
          printer.fileList.files[printer.fileList.files.length - 1].name
        } for Printer:${printer.printerURL}`
      );
      setTimeout(async function () {
        let path = file.fullPath;
        if (path.includes("local")) {
          path = JSON.parse(JSON.stringify(file.fullPath.replace("local", "")));
        }
        const fileInformation = await Runner.getFile(printer._id, path);
        fileTimeout += 5000;
        if (fileInformation) {
          logger.info("New File Information:", fileInformation);
          printer.fileList.files[printer.fileList.files.length - 1] = fileInformation;
          printer.markModified("fileList");
          printer.save();
          if (fileInformation.time === null || fileInformation.time === "No Time Estimate") {
            logger.info("File Information Still Missing Retrying...");
            Runner.updateFile(printer.fileList.files[printer.fileList.files.length - 1], i);
            const currentFilament = await Runner.compileSelectedFilament(
              printer.selectedFilament,
              i
            );
            FileClean.generate(printer, currentFilament);
            FileClean.statistics(farmPrinters);
            return null;
          } else {
            const currentFilament = await Runner.compileSelectedFilament(
              printer.selectedFilament,
              i
            );
            FileClean.generate(printer, currentFilament);
            FileClean.statistics(farmPrinters);
            return null;
          }
        }
      }, 5000);
    } else {
      logger.info("File information took too long to generate, awaiting manual scan...");
    }
  }

  static sortedIndex() {
    const sorted = [];
    for (let p = 0; p < farmPrinters.length; p++) {
      const sort = {
        sortIndex: farmPrinters[p].sortIndex,
        actualIndex: p
      };
      sorted.push(sort);
    }
    sorted.sort((a, b) => (a.sortIndex > b.sortIndex ? 1 : -1));
    return sorted;
  }

  static async returnPrinterLogs(printerId) {
    const i = _.findIndex(farmPrinters, function (o) {
      return o._id == printerId;
    });
    const printer = farmPrinters[i];

    return await PrinterClean.generateConnectionLogs(printer);
  }

  static async returnPluginList(printerId) {
    function isCompat(is_compat) {
      if (is_compat.octoprint || is_compat.os || is_compat.python) {
        return true;
      } else {
        return false;
      }
    }

    function onlyUnique(value, index, self) {
      return self.indexOf(value) === index;
    }

    if (printerId) {
      const i = _.findIndex(farmPrinters, function (o) {
        return o._id == printerId;
      });
      let compatiblePluginList = [];
      farmPrinters[i].pluginsList.forEach((plugin) => {
        if (typeof plugin.is_compatible !== "undefined") {
          if (isCompat(plugin.is_compatible)) {
            compatiblePluginList.push(plugin);
          }
        } else {
          compatiblePluginList = farmPrinters[i].pluginsList;
        }
      });

      return compatiblePluginList;
    } else {
      let compatiblePluginList = [];
      farmPrinters.forEach((printer) => {
        for (var key in printer.settingsPlugins) {
          if (printer.settingsPlugins.hasOwnProperty(key)) {
            let installedPlugin = _.findIndex(printer.pluginsList, function (o) {
              return o.id == key;
            });
            if (installedPlugin > -1) {
              compatiblePluginList.push(printer.pluginsList[installedPlugin]);
            }
          }
        }
      });

      return compatiblePluginList;
    }
  }
}

let fileTimeout = 0;

module.exports = {
  Runner
};
