const { findIndex, cloneDeep } = require("lodash");
const { ScriptRunner } = require("../runners/scriptCheck");
const { PrinterTicker } = require("../runners/printerTicker");
const { convertHttpUrlToWebsocket } = require("../utils/url.utils");

const Logger = require("../handlers/logger");
const { PrinterClean } = require("../services/printer-cleaner.service");
const Filament = require("../models/Filament");
const { SettingsClean } = require("../services/settings-cleaner.service");
const PrinterService = require("../services/printer.service");
const { attachProfileToSpool } = require("../utils/spool.utils");
const { TaskManager } = require("../runners/task.manager");
const { FileClean } = require("../services/file-cleaner.service");
const { getEventEmitterCache } = require("../cache/event-emitter.cache");
const logger = new Logger("OctoFarm-State");

class PrinterStore {
  #printersList = undefined;

  constructor() {
    this.#printersList = [];
  }

  #findMePrinter = (id) => {
    if (typeof id !== "string") {
      id = id.toString();
    }

    return this.#printersList[
      findIndex(this.#printersList, function (o) {
        return o._id === id;
      })
    ];
  };

  #removeFromStore = (id) => {
    if (typeof id !== "string") {
      id = id.toString();
    }
    const index = findIndex(this.#printersList, function (o) {
      return o._id === id;
    });
    if (index > -1) {
      logger.warning("Found printer index, deleting from database...", index);
      this.#printersList.splice(index, 1);
    }
  };

  getPrinterCount() {
    return this.#printersList.length;
  }

  listPrintersInformation(disabled = false) {
    const returnList = [];

    this.#printersList.forEach((printer) => {
      if (disabled) {
        returnList.push(Object.assign({}, printer));
      } else {
        if (!printer.disabled) {
          returnList.push(Object.assign({}, printer));
        }
      }
    });

    return returnList.sort((a, b) => a.sortIndex - b.sortIndex);
  }

  listPrinters() {
    return this.#printersList;
  }

  addPrinter(printer) {
    return this.#printersList.push(printer);
  }

  async updateLatestOctoPrintSettings(id, force = false) {
    const printer = this.#findMePrinter(id);
    if (printer.printerState.state !== "Offline") {
      await printer.acquireOctoPrintLatestSettings(force);
    }
  }

  async deletePrinter(id) {
    const printer = this.#findMePrinter(id);
    //Kill all printer connections
    await printer.killAllConnections();
    //Remove from database
    await printer.deleteFromDataBase();
    //Remove from printer store
    this.#removeFromStore(id);
  }

  updatePrinterState(id, data) {
    const printer = this.#findMePrinter(id);
    printer.setPrinterState(data);
  }

  updateWebsocketState(id, data) {
    const printer = this.#findMePrinter(id);
    printer.setWebsocketState(data);
  }

  updatePrinterLiveValue(id, data) {
    const printer = this.#findMePrinter(id);
    printer.updatePrinterLiveValue(data);
  }

  updatePrinterDatabase(id, data) {
    const printer = this.#findMePrinter(id);
    printer.updatePrinterLiveValue(data);
    printer.updatePrinterData(data);
  }

  getSelectedFilament(id) {
    const printer = this.#findMePrinter(id);
    return printer.selectedFilament;
  }

  getFileList(id) {
    const printer = this.#findMePrinter(id);
    return printer.fileList;
  }

  getCurrentZ(id) {
    const printer = this.#findMePrinter(id);
    return printer.currentZ;
  }

  getCurrentUser(id) {
    const printer = this.#findMePrinter(id);
    return printer.currentUser;
  }

  getCostSettings(id) {
    const printer = this.#findMePrinter(id);
    return printer.costSettings;
  }

  pushTerminalData(id, line) {
    const printer = this.#findMePrinter(id);
    printer.terminal.push(line);
  }

  shiftTerminalData(id) {
    const printer = this.#findMePrinter(id);
    printer.terminal.shift();
  }

  getTerminalDataLength(id) {
    const printer = this.#findMePrinter(id);
    return printer.terminal.length;
  }

  getOctoPrintVersion(id) {
    const printer = this.#findMePrinter(id);
    return printer.octoPrintVersion;
  }

  getOctoPrintUserList(id) {
    const printer = this.#findMePrinter(id);
    return printer.userList;
  }

  getMultiUserIssueState(id) {
    const printer = this.#findMePrinter(id);
    return printer.multiUserIssue;
  }

  getPrinterProgress(id) {
    const printer = this.#findMePrinter(id);
    return printer.progress;
  }

  getPrinterURL(id) {
    const printer = this.#findMePrinter(id);
    return printer.printerURL;
  }

  getPrinterInformation(id) {
    const printer = this.#findMePrinter(id);
    return JSON.parse(JSON.stringify(printer));
  }

  getPrinter(id) {
    return this.#findMePrinter(id);
  }

  addPrinterEvent(id, event) {
    getEventEmitterCache().once(`${id}-${event}`, function (...args) {
      return ScriptRunner.check(...args);
    });
  }

  emitPrinterEvent(id, event) {
    const printer = this.#findMePrinter(id);
    getEventEmitterCache().emit(`${id}-${event}`, printer, event.toLowerCase(), undefined);
  }

  getPrinterState(id) {
    const printer = this.#findMePrinter(id);
    return {
      printerState: printer.printerState,
      hostState: printer.hostState,
      webSocketState: printer.webSocketState
    };
  }

  getTempTriggers(id) {
    const printer = this.#findMePrinter(id);
    return printer.tempTriggers;
  }

  getDisabledPluginsList(id) {
    const printer = this.#findMePrinter(id);
    return printer.pluginsListDisabled;
  }

  getEnabledPluginsList(id) {
    const printer = this.#findMePrinter(id);
    return printer.pluginsListEnabled;
  }

  getAllPluginsList(id) {
    const printer = this.#findMePrinter(id);
    return printer.pluginsListEnabled.concat(printer.pluginsListDisabled);
  }

  updateAllPrintersSocketThrottle(seconds) {
    const printerList = this.listPrinters();
    printerList.forEach((printer) => {
      printer.sendThrottle(seconds);
    });
  }

  updatePrintersBasicInformation(newPrintersInformation = []) {
    // Updating printer's information
    logger.info("Bulk update to printers information requested");
    let updateGroupListing = false;
    const changesList = [];
    const socketsNeedTerminating = [];

    // Cycle through the printers and update their state...
    for (let i = 0; i < newPrintersInformation.length; i++) {
      const oldPrinter = this.#findMePrinter(newPrintersInformation[i]._id);
      const newPrinterInfo = newPrintersInformation[i];

      //Check for a printer name change...
      if (
        !!newPrinterInfo?.settingsAppearance?.name &&
        oldPrinter.settingsAppearance.name !== newPrinterInfo.settingsAppearance.name
      ) {
        const loggerMessage = `Changed printer name from ${oldPrinter.settingsAppearance.name} to ${newPrinterInfo.settingsAppearance.name}`;
        logger.warning(loggerMessage);
        PrinterTicker.addIssue(
          new Date(),
          oldPrinter.printerURL,
          loggerMessage,
          "Active",
          oldPrinter._id
        );
        this.updatePrinterDatabase(newPrinterInfo._id, {
          settingsAppearance: {
            name: newPrinterInfo.settingsAppearance.name
          }
        });

        if (
          findIndex(this.#printersList, function (o) {
            return o._id === newPrinterInfo._id;
          }) !== -1
        ) {
          changesList.push({
            _id: newPrinterInfo._id,
            printerURL: newPrinterInfo.printerURL
          });
        }
      }

      //Check for a printer url change...
      if (!!newPrinterInfo?.printerURL && oldPrinter.printerURL !== newPrinterInfo.printerURL) {
        const loggerMessage = `Changed printer url from ${oldPrinter.printerURL} to ${newPrinterInfo.printerURL}`;
        logger.warning(loggerMessage);
        PrinterTicker.addIssue(
          new Date(),
          oldPrinter.printerURL,
          loggerMessage,
          "Active",
          oldPrinter._id
        );
        if (newPrinterInfo.printerURL[newPrinterInfo.printerURL.length - 1] === "/") {
          newPrinterInfo.printerURL = newPrinterInfo.printerURL.replace(/\/?$/, "");
        }
        if (
          !newPrinterInfo.printerURL.includes("https://") &&
          !newPrinterInfo.printerURL.includes("http://")
        ) {
          newPrinterInfo.printerURL = `http://${newPrinterInfo.printerURL}`;
        }
        this.updatePrinterDatabase(newPrinterInfo._id, {
          printerURL: newPrinterInfo.printerURL,
          webSocketURL: convertHttpUrlToWebsocket(newPrinterInfo.printerURL)
        });
        if (
          findIndex(this.#printersList, function (o) {
            return o._id === newPrinterInfo._id;
          }) !== -1
        ) {
          changesList.push({
            _id: newPrinterInfo._id,
            printerURL: newPrinterInfo.printerURL
          });
        }

        if (!socketsNeedTerminating.includes(oldPrinter._id)) {
          socketsNeedTerminating.push(oldPrinter._id);
        }
      }

      // Check for apikey change...
      if (!!newPrinterInfo?.apikey && oldPrinter.apikey !== newPrinterInfo.apikey) {
        const loggerMessage = `Changed apiKey from ${oldPrinter.apikey} to ${newPrinterInfo.apikey}`;
        logger.info(loggerMessage);
        PrinterTicker.addIssue(
          new Date(),
          oldPrinter.printerURL,
          loggerMessage,
          "Active",
          oldPrinter._id
        );
        this.updatePrinterDatabase(newPrinterInfo._id, {
          apikey: newPrinterInfo.apikey
        });

        if (
          findIndex(this.#printersList, function (o) {
            return o._id === newPrinterInfo._id;
          }) !== -1
        ) {
          changesList.push({
            _id: newPrinterInfo._id,
            printerURL: newPrinterInfo.printerURL
          });
        }
        if (!socketsNeedTerminating.includes(oldPrinter._id)) {
          socketsNeedTerminating.push(oldPrinter._id);
        }
      }

      // Check for group change...
      if (!!newPrinterInfo?.group && oldPrinter.group !== newPrinterInfo.group) {
        const loggerMessage = `Changed group from ${oldPrinter.group} to ${newPrinterInfo.group}`;
        logger.info(loggerMessage);
        PrinterTicker.addIssue(
          new Date(),
          oldPrinter.printerURL,
          loggerMessage,
          "Active",
          oldPrinter._id
        );
        this.updatePrinterDatabase(newPrinterInfo._id, {
          group: newPrinterInfo.group
        });
        if (
          findIndex(this.#printersList, function (o) {
            return o._id === newPrinterInfo._id;
          }) !== -1
        ) {
          changesList.push({
            _id: newPrinterInfo._id,
            printerURL: newPrinterInfo.printerURL
          });
        }
        updateGroupListing = true;
      }
      // Check for camURL change...
      if (!!newPrinterInfo.camURL && oldPrinter.camURL !== newPrinterInfo.camURL) {
        const loggerMessage = `Changed camera url from ${oldPrinter.camURL} to ${newPrinterInfo.camURL}`;
        logger.info(loggerMessage);
        PrinterTicker.addIssue(
          new Date(),
          oldPrinter.printerURL,
          loggerMessage,
          "Active",
          oldPrinter._id
        );
        this.updatePrinterDatabase(newPrinterInfo._id, {
          camURL: newPrinterInfo.camURL
        });

        if (
          findIndex(this.#printersList, function (o) {
            return o._id === newPrinterInfo._id;
          }) !== -1
        ) {
          changesList.push({
            _id: newPrinterInfo._id,
            printerURL: newPrinterInfo.printerURL
          });
        }
      }
    }

    if (socketsNeedTerminating.length > 0) {
      this.resetConnectionInformation(socketsNeedTerminating);
    }

    return {
      updateGroupListing,
      changesList,
      socketsNeedTerminating
    };
  }

  resetConnectionInformation(idList) {
    if (!!idList) {
      idList.forEach((id) => {
        const printer = this.#findMePrinter(id);
        printer.resetConnectionInformation();
      });
    }
  }

  async updatePrinterSettings(settings) {
    const reConnectRequired = [];
    const newOctoPrintSettings = {};

    const { printer, connection, systemCommands, powerCommands, costSettings } = settings;
    const { printerName, printerURL, cameraURL, apikey, currentUser, index } = printer;

    // Deal with OctoFarm connection information updates
    const octoFarmConnectionSettings = {
      _id: index,
      settingsAppearance: {
        name: printerName
      },
      printerURL: printerURL,
      camURL: cameraURL,
      apikey: apikey
    };

    // Update OctoFarms data
    this.updatePrintersBasicInformation([octoFarmConnectionSettings]);

    const originalPrinter = this.#findMePrinter(index);
    if (!!currentUser && currentUser !== originalPrinter.currentUser) {
      this.updatePrinterDatabase(index, {
        currentUser: currentUser
      });
      this.resetConnectionInformation([index]);
      reConnectRequired.push(index);
    }

    const { preferredPort, preferredBaud, preferredProfile } = connection;
    // Connection is always sent so can just update.
    if (!!preferredPort || !!preferredBaud || !!preferredProfile) {
      this.updatePrinterDatabase(index, {
        options: {
          baudrates: originalPrinter.options.baudrates,
          baudratePreference: preferredBaud,
          ports: originalPrinter.options.ports,
          portPreference: preferredPort,
          printerProfiles: originalPrinter.options.printerProfiles,
          printerProfilePreference: preferredProfile
        }
      });
      newOctoPrintSettings.serial = {
        port: preferredPort,
        baudrate: preferredBaud
      };
    }

    const {
      powerConsumption,
      electricityCosts,
      purchasePrice,
      estimatedLifeSpan,
      maintenanceCosts
    } = costSettings;

    if (
      !!powerConsumption ||
      !!electricityCosts ||
      !!purchasePrice ||
      !!estimatedLifeSpan ||
      !!maintenanceCosts
    ) {
      const costSettings = {
        ...(!!powerConsumption
          ? { powerConsumption }
          : { powerConsumption: originalPrinter.costSettings.powerConsumption }),
        ...(!!electricityCosts
          ? { electricityCosts }
          : { electricityCosts: originalPrinter.costSettings.electricityCosts }),
        ...(!!purchasePrice
          ? { purchasePrice }
          : { purchasePrice: originalPrinter.costSettings.purchasePrice }),
        ...(!!estimatedLifeSpan
          ? { estimateLifespan: estimatedLifeSpan }
          : { estimateLifespan: originalPrinter.costSettings.estimateLifespan }),
        ...(!!maintenanceCosts
          ? { maintenanceCosts }
          : { maintenanceCosts: originalPrinter.costSettings.maintenanceCosts })
      };
      this.updatePrinterDatabase(index, { costSettings });
    }

    // Deal with OctoPrint Updates

    // Refresh OctoPrint Updates

    // logger.info("Attempting to save: ", settings);
    //
    // function difference(object, base) {
    //   function changes(object, base) {
    //     try {
    //       return _.transform(object, function (result, value, key) {
    //         if (!_.isEqual(value, base[key])) {
    //           result[key] =
    //               _.isObject(value) && _.isObject(base[key])
    //                   ? changes(value, base[key])
    //                   : value;
    //         }
    //       });
    //     } catch (e) {
    //       logger.error("Error detecting changes", e);
    //     }
    //   }
    //
    //   try {
    //     return changes(object, base);
    //   } catch (e) {
    //     logger.error("Error detecting changes", e);
    //   }
    // }
    //
    // try {
    //   const printer = await Printers.findById(settings.printer.index);
    //   const index = _.findIndex(farmPrinters, function (o) {
    //     return o._id == settings.printer.index;
    //   });
    //   let updatePrinter = false;
    //   if (
    //       settings.printer.printerName !== "" &&
    //       settings.printer.printerName !==
    //       farmPrinters[index].settingsAppearance.name
    //   ) {
    //     farmPrinters[index].settingsAppearance.name =
    //         settings.printer.printerName;
    //     printer.settingsAppearance.name = settings.printer.printerName;
    //     printer.markModified("settingsApperance");
    //     updatePrinter = true;
    //   } else {
    //   }
    //   let profile = {};
    //   let sett = {};
    //   profile.status = 900;
    //   sett.status = 900;
    //   if (
    //       settings.printer.printerURL !== "" &&
    //       settings.printer.printerURL !== farmPrinters[index].printerURL
    //   ) {
    //     farmPrinters[index].printerURL = settings.printer.printerURL;
    //     printer.printerURL = settings.printer.printerURL;
    //     printer.markModified("printerURL");
    //     updatePrinter = true;
    //   }
    //   if (
    //       settings.printer.cameraURL !== "" &&
    //       settings.printer.cameraURL !== farmPrinters[index].camURL
    //   ) {
    //     farmPrinters[index].camURL = settings.printer.cameraURL;
    //     printer.camURL = settings.printer.cameraURL;
    //     printer.markModified("camURL");
    //   }
    //   if (
    //       settings.printer.apikey !== "" &&
    //       settings.printer.apikey !== farmPrinters[index].apikey
    //   ) {
    //     farmPrinters[index].apikey = settings.printer.apikey;
    //     printer.apikey = settings.printer.apikey;
    //     printer.markModified("apikey");
    //     updatePrinter = true;
    //   }
    //   // Preferred Only update on live
    //   farmPrinters[index].options.baudratePreference =
    //       settings.connection.preferredBaud;
    //   farmPrinters[index].options.portPreference =
    //       settings.connection.preferredPort;
    //   farmPrinters[index].options.printerProfilePreference =
    //       settings.connection.preferredProfile;
    //
    //   if (
    //       typeof settings.other !== "undefined" &&
    //       settings.other.coolDown != ""
    //   ) {
    //     farmPrinters[index].tempTriggers.coolDown = parseInt(
    //         settings.other.coolDown
    //     );
    //     printer.tempTriggers.coolDown = parseInt(settings.other.coolDown);
    //     printer.markModified("tempTriggers");
    //   }
    //   if (
    //       typeof settings.other !== "undefined" &&
    //       settings.other.heatingVariation != ""
    //   ) {
    //     farmPrinters[index].tempTriggers.heatingVariation = parseFloat(
    //         settings.other.heatingVariation
    //     );
    //     printer.tempTriggers.heatingVariation = parseFloat(
    //         settings.other.heatingVariation
    //     );
    //     printer.markModified("tempTriggers");
    //   }
    //   for (const key in settings.costSettings) {
    //     if (!_.isNull(settings.costSettings[key])) {
    //       farmPrinters[index].costSettings[key] = settings.costSettings[key];
    //       printer.costSettings[key] = settings.costSettings[key];
    //     }
    //   }
    //
    //   printer.markModified("costSettings");
    //   let differences = difference(
    //       settings.costSettings,
    //       farmPrinters[index].costSettings
    //   );
    //
    //   for (const key in differences) {
    //     if (differences[key] !== null && differences[key] !== "") {
    //       farmPrinters[index].costSettings[key] = differences[key];
    //       printer.costSettings[key] = differences[key];
    //     }
    //   }
    //
    //   if (
    //       settings.powerCommands.powerOnCommand !== "" &&
    //       settings.powerCommands.powerOnCommand !==
    //       farmPrinters[index].powerSettings.powerOnCommand
    //   ) {
    //     farmPrinters[index].powerSettings.powerOnCommand =
    //         settings.powerCommands.powerOnCommand;
    //     printer.powerSettings.powerOnCommand =
    //         settings.powerCommands.powerOnCommand;
    //   }
    //   if (
    //       settings.powerCommands.powerOnURL !== "" &&
    //       settings.powerCommands.powerOnURL !==
    //       farmPrinters[index].powerSettings.powerOnURL
    //   ) {
    //     farmPrinters[index].powerSettings.powerOnURL =
    //         settings.powerCommands.powerOnURL;
    //     printer.powerSettings.powerOnURL = settings.powerCommands.powerOnURL;
    //   }
    //   if (
    //       settings.powerCommands.powerOffCommand !== "" &&
    //       settings.powerCommands.powerOffCommand !==
    //       farmPrinters[index].powerSettings.powerOffCommand
    //   ) {
    //     farmPrinters[index].powerSettings.powerOffCommand =
    //         settings.powerCommands.powerOffCommand;
    //     printer.powerSettings.powerOffCommand =
    //         settings.powerCommands.powerOffCommand;
    //   }
    //   if (
    //       settings.powerCommands.powerOffURL !== "" &&
    //       settings.powerCommands.powerOffURL !==
    //       farmPrinters[index].powerSettings.powerOffURL
    //   ) {
    //     printer.powerSettings.powerOffURL = settings.powerCommands.powerOffURL;
    //     farmPrinters[index].powerSettings.powerOffURL =
    //         settings.powerCommands.powerOffURL;
    //   }
    //   if (
    //       settings.powerCommands.powerToggleCommand !== "" &&
    //       settings.powerCommands.powerToggleCommand !==
    //       farmPrinters[index].powerSettings.powerToggleCommand
    //   ) {
    //     printer.powerSettings.powerToggleCommand =
    //         settings.powerCommands.powerToggleCommand;
    //     farmPrinters[index].powerSettings.powerToggleCommand =
    //         settings.powerCommands.powerToggleCommand;
    //   }
    //   if (
    //       settings.powerCommands.powerToggleURL !== "" &&
    //       settings.powerCommands.powerToggleURL !==
    //       farmPrinters[index].powerSettings.powerToggleURL
    //   ) {
    //     printer.powerSettings.powerToggleURL =
    //         settings.powerCommands.powerToggleURL;
    //     farmPrinters[index].powerSettings.powerToggleURL =
    //         settings.powerCommands.powerToggleURL;
    //   }
    //   if (
    //       settings.powerCommands.powerStatusCommand !== "" &&
    //       settings.powerCommands.powerStatusCommand !==
    //       farmPrinters[index].powerSettings.powerStatusCommand
    //   ) {
    //     farmPrinters[index].powerSettings.powerStatusCommand =
    //         settings.powerCommands.powerStatusCommand;
    //     printer.powerSettings.powerStatusCommand =
    //         settings.powerCommands.powerStatusCommand;
    //   }
    //   if (
    //       settings.powerCommands.powerStatusURL !== "" &&
    //       settings.powerCommands.powerStatusURL !==
    //       farmPrinters[index].powerSettings.powerStatusURL
    //   ) {
    //     farmPrinters[index].powerSettings.powerStatusURL =
    //         settings.powerCommands.powerStatusURL;
    //     printer.powerSettings.powerStatusURL =
    //         settings.powerCommands.powerStatusURL;
    //   }
    //   if (settings.powerCommands.wol.enabled) {
    //     farmPrinters[index].powerSettings.wol = settings.powerCommands.wol;
    //   }
    //
    //   logger.info("Live power settings", farmPrinters[index].powerSettings);
    //   logger.info("Database power settings", printer.powerSettings);
    //
    //   printer.markModified("powerSettings");
    //
    //   if (settings.systemCommands.serverRestart !== "") {
    //     farmPrinters[index].settingsServer.commands.serverRestartCommand =
    //         settings.systemCommands.serverRestart;
    //   } else {
    //     settings.systemCommands.serverRestart =
    //         farmPrinters[index].settingsServer.commands.serverRestartCommand;
    //   }
    //   if (settings.systemCommands.systemRestart !== "") {
    //     farmPrinters[index].settingsServer.commands.systemRestartCommand =
    //         settings.systemCommands.systemRestart;
    //   } else {
    //     settings.systemCommands.systemRestart =
    //         farmPrinters[index].settingsServer.commands.systemRestartCommand;
    //   }
    //   if (settings.systemCommands.systemShutdown !== "") {
    //     farmPrinters[index].settingsServer.commands.systemShutdownCommand =
    //         settings.systemCommands.systemShutdown;
    //   } else {
    //     settings.systemCommands.systemShutdown =
    //         farmPrinters[index].settingsServer.commands.systemShutdownCommand;
    //   }
    //   logger.info(
    //       "OctoPrint power settings: ",
    //       farmPrinters[index].systemCommands
    //   );
    //
    //   printer.save().catch((e) => {
    //     logger.error(JSON.stringify(e), "ERROR savin power settings.");
    //   });
    //   if (settings.state !== "Offline") {
    //     // Gocde update printer and Live
    //     let updateOctoPrintGcode = {};
    //     for (const key in settings.gcode) {
    //       if (settings.gcode[key].length !== 0) {
    //         updateOctoPrintGcode[key] = settings.gcode[key];
    //         farmPrinters[index].settingsScripts.gcode[key] =
    //             settings.gcode[key];
    //       }
    //     }
    //     const opts = {
    //       settingsAppearance: {
    //         name: farmPrinters[index].settingsAppearance.name,
    //       },
    //       scripts: {
    //         gcode: updateOctoPrintGcode,
    //       },
    //       serial: {
    //         port: settings.connection.preferredPort,
    //         baudrate: settings.connection.preferredBaud,
    //       },
    //       server: {
    //         commands: {
    //           systemShutdownCommand: settings.systemCommands.systemShutdown,
    //           systemRestartCommand: settings.systemCommands.systemRestart,
    //           serverRestartCommand: settings.systemCommands.serverRestart,
    //         },
    //       },
    //       webcam: {
    //         webcamEnabled: settings.other.enableCamera,
    //         timelapseEnabled: settings.other.enableTimeLapse,
    //         rotate90: settings.other.rotateCamera,
    //         flipH: settings.other.flipHCamera,
    //         flipV: settings.other.flipVCamera,
    //       },
    //     };
    //
    //     const removeObjectsWithNull = (obj) => {
    //       return _(obj)
    //           .pickBy(_.isObject) // get only objects
    //           .mapValues(removeObjectsWithNull) // call only for values as objects
    //           .assign(_.omitBy(obj, _.isObject)) // save back result that is not object
    //           .omitBy(_.isNil) // remove null and undefined from object
    //           .value(); // get value
    //     };
    //
    //     let cleanProfile = removeObjectsWithNull(opts);
    //
    //     profile = await fetch(
    //         `${farmPrinters[index].printerURL}/api/printerprofiles/${settings.profileID}`,
    //         {
    //           method: "PATCH",
    //           headers: {
    //             "Content-Type": "application/json",
    //             "X-Api-Key": farmPrinters[index].apikey,
    //           },
    //           body: JSON.stringify({ profile: cleanProfile }),
    //         }
    //     );
    //
    //     // Update octoprint profile...
    //     sett = await fetch(`${farmPrinters[index].printerURL}/api/settings`, {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //         "X-Api-Key": farmPrinters[index].apikey,
    //       },
    //       body: JSON.stringify(opts),
    //     });
    //   }
    //
    //   await Runner.getProfile(settings.printer.index);
    //   await Runner.getSettings(settings.printer.index);
    //   await Runner.getOctoPrintSystenInfo(settings.printer.index);
    //   Runner.getOctoPrintSystenInfo(settings.printer.index);
    //   Runner.getUpdates(settings.printer.index);
    //   Runner.getPluginList(settings.printer.index);
    //   PrinterClean.generate(
    //       farmPrinters[index],
    //       systemSettings.filamentManager
    //   );
    //   // let i = _.findIndex(farmPrinters, function(o) { return o._id == id; });
    //   //
    //   // console.log()
    //   //
    //   // farmPrinters[i].settingsScripts.gcode = opts.scripts.gcode;
    //   // farmPrinters[i].settingsAppearance.name = opts.appearance.name;
    //   // farmPrinters[i].settingsWebcam = opts.webcam;
    //   // farmPrinters[i].camURL = opts.camURL;
    //   // let printer = await Printers.findOne({ index: i });
    //   // printer.settingsWebcam = farmPrinters[i].settingsWebcam;
    //   // printer.camURL = farmPrinters[i].camURL;
    //   // printer.settingsApperarance.name = farmPrinters[i].settingsAppearance.name;
    //   // printer.save();
    //   if (updatePrinter) {
    //     Runner.reScanOcto(farmPrinters[index]._id, false);
    //   }
    //   return {
    //     status: {
    //       octofarm: 200,
    //       profile: profile.status,
    //       settings: sett.status,
    //     },
    //     printer,
    //   };
    // } catch (e) {
    //   logger.error("ERROR updating printer ", JSON.stringify(e.message));
    //   return {
    //     status: { octofarm: 400, profile: 900, settings: 900 },
    //   };
    // }
  }

  resetPrintersSocketConnections(idList) {
    idList.forEach((id) => {
      const printer = this.#findMePrinter(id);
      printer.resetSocketConnection();
    });
  }

  async generatePrinterConnectionLogs(id) {
    const printer = this.#findMePrinter(id);
    return await PrinterClean.generateConnectionLogs(printer);
  }

  listAllOctoPrintVersions() {
    const printers = this.listPrintersInformation();

    const versionArray = [];

    printers.forEach((printer) => {
      if (!!printer?.octoPrintVersion && !versionArray.includes(printer.octoPrintVersion))
        versionArray.push(printer.octoPrintVersion);
    });
    return versionArray;
  }

  listUniqueFiles() {
    const printers = this.listPrintersInformation();

    const filePathsArray = [];

    for (let f = 0; f < printers.length; f++) {
      const fileList = printers[f]?.fileList?.fileList;
      if (fileList) {
        for (let p = 0; p < fileList.length; p++) {
          const index = findIndex(filePathsArray, function (o) {
            return o.display == fileList[p].display;
          });
          if (index === -1) {
            filePathsArray.push({
              name: fileList[p].name,
              display: fileList[p].display
            });
          }
        }
      }
    }
    return filePathsArray;
  }

  listUniqueFolderPaths() {
    const printers = this.listPrintersInformation();

    const filePathsArray = [""];

    for (let f = 0; f < printers.length; f++) {
      const folderList = printers[f]?.fileList?.folderList;
      if (folderList) {
        for (let p = 0; p < folderList.length; p++) {
          if (!filePathsArray.includes(folderList[p].name)) {
            filePathsArray.push(folderList[p].name);
          }
        }
      }
    }
    return filePathsArray;
  }

  listCommonFilesOnAllPrinters(ids) {
    const uniqueFilesListFromAllPrinters = [];
    // Create unique list of files
    ids.forEach((id) => {
      const currentPrinter = this.#findMePrinter(id);
      const fileList = currentPrinter?.fileList?.fileList;
      if (fileList) {
        for (let p = 0; p < fileList.length; p++) {
          const index = findIndex(uniqueFilesListFromAllPrinters, function (o) {
            return o.name == fileList[p].name;
          });
          if (index === -1) {
            uniqueFilesListFromAllPrinters.push(fileList[p]);
          }
        }
      }
    });
    const filesThatExistOnAllPrinters = [];
    // Check if that file exists on all of the printers...
    for (let f = 0; f < uniqueFilesListFromAllPrinters.length; f++) {
      const fileToCheck = uniqueFilesListFromAllPrinters[f];
      const fileChecks = [];
      for (let p = 0; p < ids.length; p++) {
        const currentPrinter = this.#findMePrinter(ids[p]);
        const fileList = currentPrinter?.fileList?.fileList;
        if (!!fileList) {
          fileChecks.push(fileList.some((el) => el.name === fileToCheck.name));
        }
      }
      if (
        fileChecks.every(function (e) {
          return e === true;
        })
      ) {
        filesThatExistOnAllPrinters.push(fileToCheck);
      }
    }
    return filesThatExistOnAllPrinters;
  }

  disablePrinter(id) {
    const printer = this.#findMePrinter(id);
    return printer.disablePrinter();
  }

  async enablePrinter(id) {
    const printer = this.#findMePrinter(id);
    return await printer.enablePrinter();
  }

  async getNewSessionKey(id) {
    const printer = this.#findMePrinter(id);
    return await printer.getSessionkey();
  }

  async resyncFilesList(id) {
    const printer = this.#findMePrinter(id);
    return await printer.acquireOctoPrintFilesData(true, true);
  }

  async resyncFile(id, fullPath) {
    const printer = this.#findMePrinter(id);
    return await printer.acquireOctoPrintFileData(fullPath, true);
  }

  triggerOctoPrintFileScan(id, file) {
    const printer = this.#findMePrinter(id);
    return printer.triggerFileInformationScan(file);
  }

  addNewFile(file) {
    const { index, files } = file;
    const printer = this.#findMePrinter(index);

    const date = new Date();

    const { name, path } = files.local;

    let filePath = "";

    if (path.indexOf("/") > -1) {
      filePath = path.substr(0, path.lastIndexOf("/"));
    } else {
      filePath = "local";
    }

    const fileDisplay = name.replace(/_/g, " ");
    const data = {
      path: filePath,
      fullPath: path,
      display: fileDisplay,
      length: null,
      name: name,
      size: null,
      time: null,
      date: date.getTime() / 1000,
      thumbnail: null,
      success: 0,
      failed: 0,
      last: null
    };
    PrinterService.findOneAndPush(index, "fileList.files", data);
    printer.fileList.fileList.push(
      FileClean.generateSingle(data, printer.selectedFilament, printer.costSettings)
    );
    // TODO move statistics to run after generate
    // Trigger file update check service
    this.triggerOctoPrintFileScan(index, data);

    return printer;
  }

  addNewFolder(folder) {
    const { i, foldername } = folder;
    const printer = this.#findMePrinter(i);

    let path = "local";
    let name = foldername;
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
    printer.fileList.folderList.push(newFolder);
    PrinterService.findOneAndPush(i, "fileList.folders", newFolder);

    return printer;
  }

  moveFolder(id, oldFolder, newFullPath, folderName) {
    const printer = this.#findMePrinter(id);
    const folderIndex = findIndex(printer.fileList.folderList, function (o) {
      return o.name === oldFolder;
    });
    printer.fileList.fileList.forEach((file, index) => {
      if (file.path === oldFolder) {
        const fileName = printer.fileList.fileList[index].fullPath.substring(
          printer.fileList.fileList[index].fullPath.lastIndexOf("/") + 1
        );
        printer.fileList.fileList[index].fullPath = `${folderName}/${fileName}`;
        printer.fileList.fileList[index].path = folderName;
      }
    });
    printer.fileList.folderList[folderIndex].name = folderName;
    printer.fileList.folderList[folderIndex].path = newFullPath;

    return printer;
  }

  moveFile(id, newPath, fullPath, filename) {
    const printer = this.#findMePrinter(id);
    const file = findIndex(printer.fileList.fileList, function (o) {
      return o.name === filename;
    });
    // farmPrinters[i].fileList.files[file].path = newPath;
    printer.fileList.fileList[file].path = newPath;
    printer.fileList.fileList[file].fullPath = fullPath;
    return printer;
  }

  deleteFile(id, fullPath) {
    const printer = this.#findMePrinter(id);
    const index = findIndex(printer.fileList.fileList, function (o) {
      return o.fullPath === fullPath;
    });
    printer.fileList.fileList.splice(index, 1);
    return printer;
  }

  deleteFolder(id, fullPath) {
    const printer = this.#findMePrinter(id);
    printer.fileList.fileList.forEach((file, index) => {
      if (file.path === fullPath) {
        printer.fileList.fileList.splice(index, 1);
      }
    });
    printer.fileList.folderList.forEach((folder, index) => {
      if (folder.path === fullPath) {
        printer.fileList.folderList.splice(index, 1);
      }
    });
    const folder = findIndex(printer.fileList.folderList, function (o) {
      return o.name === fullPath;
    });
    printer.fileList.folderList.splice(folder, 1);
    return printer;
  }

  async assignSpoolToPrinters(printerIDs, spoolID) {
    const farmPrinters = this.listPrintersInformation(true);

    if (SettingsClean.returnFilamentManagerSettings()) {
      this.deattachSpoolFromAllPrinters(spoolID);
    }

    // Asign new printer id's;
    for (let i = 0; i < printerIDs.length; i++) {
      const id = printerIDs[i];
      const tool = id.tool;
      const split = id.printer.split("-");
      const printerID = split[0];
      const printerIndex = findIndex(farmPrinters, function (o) {
        return o._id === printerID;
      });
      if (spoolID !== "0") {
        const spool = await Filament.findById(spoolID);
        farmPrinters[printerIndex].selectedFilament[tool] = await attachProfileToSpool(spool);
      } else {
        farmPrinters[printerIndex].selectedFilament[tool] = null;
      }
      PrinterService.findOneAndUpdate(printerID, {
        selectedFilament: farmPrinters[printerIndex].selectedFilament
      }).then();
    }
    TaskManager.forceRunTask("FILAMENT_CLEAN_TASK");
    return "Attached all spools";
  }

  deattachSpoolFromAllPrinters(filamentID) {
    const farmPrinters = this.listPrintersInformation(true);
    // Unassign existing printers
    const farmPrintersAssigned = farmPrinters.filter(
      (printer) =>
        findIndex(printer.selectedFilament, function (o) {
          if (!!o) {
            return o._id === filamentID;
          }
        }) > -1
    );

    farmPrintersAssigned.forEach((printer) => {
      printer.selectedFilament.forEach((spool) => {
        spool = null;
      });
      PrinterService.findOneAndUpdate(printer._id, {
        selectedFilament: printer.selectedFilament
      }).then();
    });
  }

  updateStepRate(id, stepRate) {
    const printer = this.#findMePrinter(id);
    printer.stepRate = stepRate;
  }

  updateFeedRate(id, feedRate) {
    this.updatePrinterDatabase(id, { feedRate: feedRate });
  }

  updateFlowRate(id, flowRate) {
    this.updatePrinterDatabase(id, { flowRate: flowRate });
  }

  updatePrinterStatistics(id, statistics) {
    const printer = this.#findMePrinter(id);
    printer.updatePrinterStatistics(statistics);
  }

  getPrinterStatistics(id) {
    const printer = this.#findMePrinter(id);
    return printer.getPrinterStatistics();
  }
}

module.exports = PrinterStore;
