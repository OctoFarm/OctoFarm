const { findIndex, cloneDeep } = require("lodash");
const { EventEmitter } = require("events");
const { ScriptRunner } = require("../runners/scriptCheck");
const { PrinterTicker } = require("../runners/printerTicker");
const { convertHttpUrlToWebsocket } = require("../utils/url.utils");

const Logger = require("../handlers/logger");
const { PrinterClean } = require("../lib/dataFunctions/printerClean");
const Filament = require("../models/Filament");
const { SettingsClean } = require("../lib/dataFunctions/settingsClean");
const PrinterService = require("../services/printer.service");
const { attachProfileToSpool } = require("../utils/spool.utils");
const { TaskManager } = require("../runners/task.manager");
const { FileClean } = require("../lib/dataFunctions/fileClean");
const { generate } = require("rxjs");
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

  getPrinterEvent(id, event) {
    const printer = this.#findMePrinter(id);
    return printer[event + "Event"];
  }

  firePrinterEvent(id, event) {
    const printer = this.#findMePrinter(id);
    if (!!printer[event + "Event"]) {
      logger.info("Fired printer event", event);
      printer[event + "Event"].emit(event.toLowerCase());
    }
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

  addPrinterEvent(id, event) {
    const printer = this.#findMePrinter(id);
    if (!printer[event + "Event"]) {
      printer[event + "Event"] = new EventEmitter();
      if (!printer[event + "Event"]._events[event.toLowerCase()]) {
        logger.info("Added new event to printer: ", event);
        printer[event + "Event"].once(event.toLowerCase(), (stream) => {
          ScriptRunner.check(printer, event.toLowerCase(), undefined);
        });
      }
    }
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
      if (oldPrinter.settingsAppearance.name !== newPrinterInfo.settingsAppearance.name) {
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
      if (oldPrinter.printerURL !== newPrinterInfo.printerURL) {
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
      if (oldPrinter.apikey !== newPrinterInfo.apikey) {
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
      if (oldPrinter.group !== newPrinterInfo.group) {
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
      const loggerMessage = `Changed camera url from ${oldPrinter.camURL} to ${newPrinterInfo.camURL}`;
      logger.info(loggerMessage);
      PrinterTicker.addIssue(
        new Date(),
        oldPrinter.printerURL,
        loggerMessage,
        "Active",
        oldPrinter._id
      );
      if (oldPrinter.camURL !== newPrinterInfo.camURL) {
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

    return {
      updateGroupListing,
      changesList,
      socketsNeedTerminating
    };
  }

  async updatePrinterSettings(settings) {
    console.log(settings);
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
      if (!versionArray.includes(printer.octoPrintVersion))
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
}

module.exports = PrinterStore;
