const { findIndex } = require('lodash');
const { ScriptRunner } = require('../services/local-scripts.service');
const { PrinterTicker } = require('../services/printer-connection-log.service');
const { SettingsClean } = require('../services/settings-cleaner.service');
const { convertHttpUrlToWebsocket } = require('../utils/url.utils');

const Logger = require('../handlers/logger');
const { PrinterClean } = require('../services/printer-cleaner.service');
const Filament = require('../models/Filament');
const PrinterService = require('../services/printer.service');
const { attachProfileToSpool } = require('../utils/spool.utils');
const { TaskManager } = require('../services/task-manager.service');
const { FileClean } = require('../services/file-cleaner.service');
const { getEventEmitterCache } = require('../cache/event-emitter.cache');
const {
  generateOctoFarmCameraURL,
} = require('../services/printers/utils/camera-url-generation.utils');
const { JobClean } = require('../services/job-cleaner.service');
const { LOGGER_ROUTE_KEYS } = require('../constants/logger.constants');

const logger = new Logger(LOGGER_ROUTE_KEYS.STORE_PRINTERS);

class PrinterStore {
  #printersList = undefined;

  constructor() {
    this.#printersList = [];
  }

  #findMePrinter = (id) => {
    if (typeof id !== 'string') {
      id = id.toString();
    }

    return this.#printersList[
      findIndex(this.#printersList, function (o) {
        return o._id === id;
      })
    ];
  };

  #removeFromStore = (id) => {
    if (typeof id !== 'string') {
      id = id.toString();
    }
    const index = findIndex(this.#printersList, function (o) {
      return o._id === id;
    });
    if (index > -1) {
      logger.warning('Found printer index, deleting from database...', index);
      this.#printersList.splice(index, 1);
    }
  };

  getPrinterCount() {
    return this.#printersList.length;
  }

  listPrintersInformationForPrinterManager() {
    const returnList = this.#printersList.map((printer) => {
      return {
        _id: printer._id,
        disabled: printer.disabled,
        sortIndex: printer.sortIndex,
        printerName: printer.printerName,
        printerURL: printer.printerURL,
        webSocketURL: printer.webSocketURL,
        apikey: printer.apikey,
        group: printer.group,
        category: printer.category,
        hostState: printer.hostState,
        printerState: printer.printerState,
        webSocketState: printer.webSocketState,
        settingsAppearance: printer.settingsAppearance,
        multiUserIssue: printer.multiUserIssue,
        restartRequired: printer.restartRequired,
        healthChecksPass: printer.healthChecksPass,
        octoPi: printer.octoPi,
        corsCheck: printer.corsCheck,
        octoResourceMonitor: printer.octoResourceMonitor,
        websocket_throttle: printer.websocket_throttle,
        reconnectingIn: printer.reconnectingIn,
        websocketReconnectingIn: printer.websocketReconnectingIn,
        octoPrintUpdate: printer.octoPrintUpdate,
        octoPrintPluginUpdates: printer.octoPrintPluginUpdates,
        systemChecks: printer.systemChecks,
        connectionOptions: printer.connectionOptions,
        powerSettings: printer.powerSettings,
        activeControlUser: printer.activeControlUser,
        currentUser: printer.currentUser,
        fullyScanned: printer?.onboarding?.fullyScanned,
        klipperState: printer?.klipperState,
        printerPowerState: printer?.printerPowerState,
        lastConnectionStatus: printer?.lastConnectionStatus,
        quickConnectSettings: printer.quickConnectSettings,
      };
    });

    return returnList.sort((a, b) => a.sortIndex - b.sortIndex);
  }

  listPrintersInformationForMonitoringViews() {
    const returnList = this.#printersList.map((printer) => {
      return {
        _id: printer._id,
        display: printer.display,
        disabled: printer.disabled,
        sortIndex: printer.sortIndex,
        printerName: printer.printerName,
        printerURL: printer.printerURL,
        webSocketURL: printer.webSocketURL,
        currentUser: printer.currentUser,
        apikey: printer.apikey,
        camURL: generateOctoFarmCameraURL(printer),
        group: printer.group,
        category: printer.category,
        hostState: printer.hostState,
        printerState: printer.printerState,
        webSocketState: printer.webSocketState,
        settingsAppearance: printer.settingsAppearance,
        connectionOptions: printer.connectionOptions,
        currentProfile: printer.currentProfile,
        otherSettings: printer.otherSettings,
        currentJob: printer.currentJob,
        fileList: printer.fileList,
        layerData: printer.layerData,
        tools: printer.tools,
        selectedFilament: printer.selectedFilament,
        currentConnection: printer.currentConnection,
        feedRate: printer.feedRate,
        flowRate: printer.flowRate,
        stepRate: printer.stepRate,
        terminal: printer.terminal,
        powerSettings: printer.powerSettings,
        resends: printer.resends,
        activeControlUser: printer.activeControlUser,
        fullyScanned: printer?.onboarding?.fullyScanned,
        klipperState: printer?.klipperState,
        printerPowerState: printer?.printerPowerState,
        storage: printer?.storage,
        aspectRatio: SettingsClean.returnCameraSettings().aspectRatio,
        quickConnectSettings: printer.quickConnectSettings,
      };
    });

    return returnList.sort((a, b) => a.sortIndex - b.sortIndex);
  }

  listPrintersInformation(disabled = false, onlyDisabled = false) {
    let returnList = [];
    if (onlyDisabled) {
      this.#printersList.forEach((printer) => {
        if (printer?.disabled) {
          returnList.push(JSON.parse(JSON.stringify(printer)));
        }
      });
    } else {
      this.#printersList.forEach((printer) => {
        if (disabled) {
          returnList.push(JSON.parse(JSON.stringify(printer)));
        } else {
          if (!printer.disabled) {
            returnList.push(JSON.parse(JSON.stringify(printer)));
          }
        }
      });
    }
    //CLEAN FILES
    returnList = returnList.map((printer) => {
      return Object.assign(printer, {
        fullyScanned: printer?.onboarding?.fullyScanned,
        fileList: FileClean.generate(
          printer.fileList,
          printer.selectedFilament,
          printer.costSettings
        ),
      });
    });

    return returnList.sort((a, b) => a.sortIndex - b.sortIndex);
  }

  listPrinters() {
    return this.#printersList;
  }

  listPrintersIDs() {
    return this.#printersList.map((item) => item._id);
  }

  addPrinter(printer) {
    return this.#printersList.push(printer);
  }

  async checkOctoPrintForUpdates(id) {
    const printer = this.#findMePrinter(id);
    await printer.acquireOctoPrintUpdatesData(true);
    await printer.acquireOctoPrintPluginsListData(true);

    if (!!printer?.octoPi && Object.keys(printer.octoPi).length !== 0) {
      await printer.acquireOctoPrintPiPluginData(true);
    }
  }

  async updateLatestOctoPrintSettings(id, force = false) {
    const printer = this.#findMePrinter(id);
    if (!printer.disabled && printer.printerState.state !== 'Offline') {
      await printer.acquireOctoPrintLatestSettings(force);
    }
  }

  async deletePrinter(id) {
    const printer = this.#findMePrinter(id);
    //Remove all spools
    await printer.clearSelectedSpools();
    //Kill all printer connections
    await printer.killAllConnections();
    //Remove from database
    await printer.deleteFromDataBase();
    //Remove from printer store
    this.#removeFromStore(id);
  }

  updateHostState(id, data) {
    const printer = this.#findMePrinter(id);
    printer.setHostState(data);
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

  pushUpdatePrinterDatabase(id, key, data) {
    const printer = this.#findMePrinter(id);
    printer.pushUpdatePrinterDatabase(key, data);
  }

  getSelectedFilament(id) {
    const printer = this.#findMePrinter(id);
    return printer?.selectedFilament;
  }

  getFileList(id) {
    const printer = this.#findMePrinter(id);
    const newPrinter = JSON.parse(JSON.stringify(printer));
    return FileClean.generate(
      newPrinter.fileList,
      newPrinter.selectedFilament,
      newPrinter.costSettings
    );
  }

  getOctoPiData(id) {
    const printer = this.#findMePrinter(id);
    return printer.octoPi;
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

  getPrinterName(id) {
    const printer = this.#findMePrinter(id);
    return printer?.printerName ? printer.printerName : 'Unknown Printer';
  }

  getPrinterInformation(id) {
    const printer = this.#findMePrinter(id);
    const newPrinter = JSON.parse(JSON.stringify(printer));
    return Object.assign(newPrinter, {
      fileList: FileClean.generate(
        printer.fileList,
        printer.selectedFilament,
        printer.costSettings
      ),
    });
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
      webSocketState: printer.webSocketState,
    };
  }

  getTempTriggers(id) {
    const printer = this.#findMePrinter(id);
    return printer.tempTriggers;
  }

  isPrinterActive(id) {
    const printer = this.#findMePrinter(id);
    const {
      printerState: {
        colour: { category },
      },
    } = printer;
    return category === 'Active' || category === 'Complete';
  }

  shouldPrinterBeReceivingData(id) {
    const dataStates = ['Idle', 'Active', 'Complete'];
    const printer = this.#findMePrinter(id);
    const {
      printerState: {
        colour: { category },
      },
    } = printer;
    return dataStates.includes(category);
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
    logger.info('Bulk update to printers information requested');
    let updateGroupListing = false;
    const changesList = [];
    const socketsNeedTerminating = [];

    // Cycle through the printers and update their state...
    for (let printer of newPrintersInformation) {
      const oldPrinter = this.#findMePrinter(printer._id);
      const newPrinterInfo = printer;

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
          'Active',
          oldPrinter._id
        );
        this.updatePrinterDatabase(newPrinterInfo._id, {
          printerName: newPrinterInfo.settingsAppearance.name,
        });

        if (
          findIndex(this.#printersList, function (o) {
            return o._id === newPrinterInfo._id;
          }) !== -1
        ) {
          changesList.push({
            _id: newPrinterInfo._id,
            printerURL: newPrinterInfo.printerURL,
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
          'Active',
          oldPrinter._id
        );
        if (newPrinterInfo.printerURL[newPrinterInfo.printerURL.length - 1] === '/') {
          newPrinterInfo.printerURL = newPrinterInfo.printerURL.replace(/\/?$/, '');
        }
        if (
          !newPrinterInfo.printerURL.includes('https://') &&
          !newPrinterInfo.printerURL.includes('http://')
        ) {
          newPrinterInfo.printerURL = `http://${newPrinterInfo.printerURL}`;
        }
        this.updatePrinterDatabase(newPrinterInfo._id, {
          printerURL: newPrinterInfo.printerURL,
          webSocketURL: convertHttpUrlToWebsocket(newPrinterInfo.printerURL),
        });
        if (
          findIndex(this.#printersList, function (o) {
            return o._id === newPrinterInfo._id;
          }) !== -1
        ) {
          changesList.push({
            _id: newPrinterInfo._id,
            printerURL: newPrinterInfo.printerURL,
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
          'Active',
          oldPrinter._id
        );
        this.updatePrinterDatabase(newPrinterInfo._id, {
          apikey: newPrinterInfo.apikey,
        });

        if (
          findIndex(this.#printersList, function (o) {
            return o._id === newPrinterInfo._id;
          }) !== -1
        ) {
          changesList.push({
            _id: newPrinterInfo._id,
            printerURL: newPrinterInfo.printerURL,
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
          'Active',
          oldPrinter._id
        );
        this.updatePrinterDatabase(newPrinterInfo._id, {
          group: newPrinterInfo.group,
        });
        if (
          findIndex(this.#printersList, function (o) {
            return o._id === newPrinterInfo._id;
          }) !== -1
        ) {
          changesList.push({
            _id: newPrinterInfo._id,
            printerURL: newPrinterInfo.printerURL,
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
          'Active',
          oldPrinter._id
        );
        this.updatePrinterDatabase(newPrinterInfo._id, {
          camURL: newPrinterInfo.camURL,
        });

        if (
          findIndex(this.#printersList, function (o) {
            return o._id === newPrinterInfo._id;
          }) !== -1
        ) {
          changesList.push({
            _id: newPrinterInfo._id,
            printerURL: newPrinterInfo.printerURL,
          });
        }
      }

      oldPrinter.cleanPrintersInformation();
    }

    if (socketsNeedTerminating.length > 0) {
      this.resetConnectionInformation(socketsNeedTerminating);
    }

    return {
      updateGroupListing,
      changesList,
      socketsNeedTerminating,
    };
  }

  resetConnectionInformation(idList) {
    if (!!idList) {
      idList.forEach((id) => {
        const printer = this.#findMePrinter(id);
        printer.resetConnectionInformation(true);
      });
    }
  }

  resetThrottleRate(id) {
    const printer = this.#findMePrinter(id);
    return printer.throttleWebSocket(1);
  }

  async forceReconnectPrinter(id) {
    const printer = this.#findMePrinter(id);
    return printer.forceReconnect();
  }

  async editPrinterConnectionSettings(settings) {
    const { printer } = settings;
    const { printerName, printerURL, cameraURL, apikey, currentUser, index, group } = printer;

    const originalPrinter = this.#findMePrinter(index);

    if (!!currentUser && currentUser !== originalPrinter.currentUser && currentUser !== 0) {
      this.updatePrinterDatabase(index, {
        currentUser: currentUser,
      });
      this.resetConnectionInformation([index]);
    }

    const newPrinterName = { name: printerName };

    // Deal with OctoFarm connection information updates
    const octoFarmConnectionSettings = {
      _id: index,
      settingsAppearance: { ...newPrinterName },
      printerURL: printerURL,
      camURL: cameraURL,
      apikey: apikey,
      group: group,
    };

    // Update OctoFarms data
    this.updatePrintersBasicInformation([octoFarmConnectionSettings]);

    return { status: 200 };

    // Refresh OctoPrint Updates
  }

  async updatePrinterSettings(settings) {
    const newOctoPrintSettings = {};
    let octoPrintProfiles = {};

    let octofarmCheck = 200;
    let profileCheck;
    let settingsCheck;

    const {
      printer,
      connection,
      systemCommands,
      powerCommands,
      costSettings,
      profile,
      profileID,
      gcode,
      other,
      quickConnectSettings,
    } = settings;

    const { index } = printer;
    const originalPrinter = this.#findMePrinter(index);

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
          printerProfilePreference: preferredProfile,
        },
        current: {
          baudrate: preferredBaud,
          port: preferredPort,
          printerProfile: preferredProfile,
          state: 'Not Used',
        },
      });
      newOctoPrintSettings.serial = {
        port: preferredPort,
        baudrate: preferredBaud,
      };
    }

    const {
      powerConsumption,
      electricityCosts,
      purchasePrice,
      estimateLifespan,
      maintenanceCosts,
    } = costSettings;

    if (
      !!powerConsumption ||
      !!electricityCosts ||
      !!purchasePrice ||
      !!estimateLifespan ||
      !!maintenanceCosts
    ) {
      const costSettingsNew = {
        ...(!!powerConsumption
          ? { powerConsumption }
          : { powerConsumption: originalPrinter.costSettings.powerConsumption }),
        ...(!!electricityCosts
          ? { electricityCosts }
          : { electricityCosts: originalPrinter.costSettings.electricityCosts }),
        ...(!!purchasePrice
          ? { purchasePrice }
          : { purchasePrice: originalPrinter.costSettings.purchasePrice }),
        ...(!!estimateLifespan
          ? { estimateLifespan: estimateLifespan }
          : { estimateLifespan: originalPrinter.costSettings.estimateLifespan }),
        ...(!!maintenanceCosts
          ? { maintenanceCosts }
          : { maintenanceCosts: originalPrinter.costSettings.maintenanceCosts }),
      };
      this.updatePrinterDatabase(index, { costSettings: costSettingsNew });
    }

    const { name, model, volume, heatedBed, heatedChamber, axes, extruder } = profile;

    if (!!name || !!model || !!volume || !!heatedBed || !!heatedChamber || !!axes || !!extruder) {
      const originalProfile = originalPrinter.profiles[profileID];
      const newAxes = {
        x: {
          ...(!!axes?.x?.speed ? { speed: axes.x.speed } : { speed: originalProfile.axes.x.speed }),
          inverted: axes.x.inverted,
        },
        y: {
          ...(!!axes?.y?.speed ? { speed: axes.y.speed } : { speed: originalProfile.axes.y.speed }),
          inverted: axes.y.inverted,
        },
        z: {
          ...(!!axes?.z?.speed ? { speed: axes.z.speed } : { speed: originalProfile.axes.z.speed }),
          inverted: axes.z.inverted,
        },
        e: {
          ...(!!axes?.e?.speed ? { speed: axes.e.speed } : { speed: originalProfile.axes.e.speed }),
          inverted: axes.e.inverted,
        },
      };
      const newExtruder = {
        count: extruder?.count ? extruder.count : originalProfile.extruder.count,
        nozzleDiameter: extruder?.nozzleDiameter
          ? extruder.nozzleDiameter
          : originalProfile.extruder.nozzleDiameter,
        sharedNozzle: extruder.sharedNozzle,
      };
      const newVolume = {
        formFactor: volume.formFactor,
        width: volume?.width ? volume.width : originalProfile.volume.width,
        depth: volume?.depth ? volume.depth : originalProfile.volume.depth,
        height: volume?.height ? volume.height : originalProfile.volume.height,
        custom_box: originalProfile.volume.custom_box,
        origin: originalProfile.volume.origin,
      };

      originalPrinter.profiles[profileID] = {
        axes: newAxes,
        color: originalProfile.color,
        current: originalProfile.current,
        default: originalProfile.default,
        extruder: newExtruder,
        heatedBed,
        heatedChamber,
        id: originalProfile.id,
        model: !!model ? model : originalProfile.model,
        name: !!name ? name : originalProfile.name,
        resource: originalProfile.resource,
        volume: newVolume,
      };

      this.updatePrinterDatabase(index, {
        profiles: originalPrinter.profiles,
      });

      octoPrintProfiles = originalPrinter.profiles;
    }

    const {
      powerOnCommand,
      powerOnURL,
      powerOffURL,
      powerOffCommand,
      powerToggleCommand,
      powerToggleURL,
      powerStatusCommand,
      powerStatusURL,
      wol,
    } = powerCommands;

    if (
      !!powerOnCommand ||
      !!powerOnURL ||
      !!powerOffURL ||
      !!powerOffCommand ||
      !!powerToggleCommand ||
      !!powerToggleURL ||
      !!powerStatusCommand ||
      !!powerStatusURL ||
      !!wol
    ) {
      const { enabled, ip, port, interval, packet, MAC } = wol;
      const newWOL = {
        enabled,
        ...(!!ip ? { ip } : { ip: originalPrinter.powerSettings.wol.ip }),
        ...(!!port ? { port } : { port: originalPrinter.powerSettings.wol.port }),
        ...(!!interval ? { interval } : { interval: originalPrinter.powerSettings.wol.interval }),
        ...(!!packet ? { packet } : { packet: originalPrinter.powerSettings.wol.packet }),
        ...(!!MAC ? { MAC } : { MAC: originalPrinter.powerSettings.wol.MAC }),
      };

      const newPowerSettings = {
        ...(!!powerOnCommand
          ? { powerOnCommand }
          : { powerOnCommand: originalPrinter.powerSettings.powerOnCommand }),
        ...(!!powerOnURL
          ? { powerOnURL }
          : { powerOnURL: originalPrinter.powerSettings.powerOnURL }),
        ...(!!powerOffURL
          ? { powerOffURL }
          : { powerOffURL: originalPrinter.powerSettings.powerOffURL }),
        ...(!!powerOffCommand
          ? { powerOffCommand }
          : { powerOffCommand: originalPrinter.powerSettings.powerOffCommand }),
        ...(!!powerStatusCommand
          ? { powerStatusCommand }
          : { powerStatusCommand: originalPrinter.powerSettings.powerStatusCommand }),
        ...(!!powerStatusURL
          ? { powerStatusURL }
          : { powerStatusURL: originalPrinter.powerSettings.powerStatusURL }),
        wol: newWOL,
      };

      this.updatePrinterDatabase(index, {
        powerSettings: newPowerSettings,
      });
    }

    const { systemShutdown, systemRestart, serverRestart } = systemCommands;

    if (!!systemShutdown || !!systemRestart || !!serverRestart) {
      newOctoPrintSettings.server = {
        allowFraming: originalPrinter.settingsServer.allowFraming,
        commands: {
          systemShutdownCommand: systemShutdown
            ? systemShutdown
            : originalPrinter.settingsServer.commands.systemShutdownCommand,
          systemRestartCommand: systemRestart
            ? systemRestart
            : originalPrinter.settingsServer.commands.systemRestartCommand,
          serverRestartCommand: serverRestart
            ? serverRestart
            : originalPrinter.settingsServer.commands.serverRestartCommand,
        },
        diskspace: originalPrinter.settingsServer.diskspace,
        onlineCheck: originalPrinter.settingsServer.onlineCheck,
        pluginBlacklist: originalPrinter.settingsServer.pluginBlacklist,
      };

      this.updatePrinterDatabase(index, {
        settingsServer: newOctoPrintSettings.server,
      });
    }

    const {
      afterPrintCancelled,
      afterPrintDone,
      afterPrintPaused,
      afterPrinterConnected,
      afterToolChange,
      beforePrintResumed,
      beforePrintStarted,
      beforePrinterDisconnected,
      beforeToolChange,
    } = gcode;

    if (
      !!afterPrintCancelled ||
      !!afterPrintDone ||
      !!afterPrintPaused ||
      !!afterPrinterConnected ||
      !!afterToolChange ||
      !!beforePrintResumed ||
      !!beforePrintStarted ||
      !!beforePrinterDisconnected ||
      !!beforeToolChange
    ) {
      const newCustomGcode = {
        ...(!!afterPrintCancelled
          ? { afterPrintCancelled }
          : { afterPrintCancelled: originalPrinter?.settingsScripts?.afterPrintCancelled }),
        ...(!!afterPrintDone
          ? { afterPrintDone }
          : { afterPrintDone: originalPrinter?.settingsScripts?.afterPrintDone }),
        ...(!!afterPrintPaused
          ? { afterPrintPaused }
          : { afterPrintPaused: originalPrinter?.settingsScripts?.afterPrintPaused }),
        ...(!!afterPrinterConnected
          ? { afterPrinterConnected }
          : { afterPrinterConnected: originalPrinter?.settingsScripts?.afterPrinterConnected }),
        ...(!!afterToolChange
          ? { afterToolChange }
          : { afterToolChange: originalPrinter?.settingsScripts?.afterToolChange }),
        ...(!!beforePrintResumed
          ? { beforePrintResumed }
          : { beforePrintResumed: originalPrinter?.settingsScripts?.beforePrintResumed }),
        ...(!!beforePrintStarted
          ? { beforePrintStarted }
          : { beforePrintStarted: originalPrinter?.settingsScripts?.beforePrintStarted }),
        ...(!!beforePrinterDisconnected
          ? { beforePrinterDisconnected }
          : {
              beforePrinterDisconnected:
                originalPrinter?.settingsScripts?.beforePrinterDisconnected,
            }),
        ...(!!beforeToolChange
          ? { beforeToolChange }
          : { beforeToolChange: originalPrinter?.settingsScripts?.beforeToolChange }),
      };
      this.updatePrinterDatabase(index, {
        settingsScripts: newCustomGcode,
      });
      newOctoPrintSettings.scripts = {
        gcode: newCustomGcode,
      };
    }

    const {
      enableCamera,
      rotateCamera,
      flipHCamera,
      flipVCamera,
      enableTimeLapse,
      heatingVariation,
      coolDown,
    } = other;

    if (
      !!enableCamera ||
      !!rotateCamera ||
      !!flipHCamera ||
      !!flipVCamera ||
      !!enableTimeLapse ||
      !!heatingVariation ||
      coolDown
    ) {
      const tempTriggers = {
        ...(!!heatingVariation
          ? { heatingVariation: parseInt(heatingVariation) }
          : { heatingVariation: originalPrinter?.tempTriggers?.heatingVariation }),
        ...(!!coolDown
          ? { coolDown: parseInt(coolDown) }
          : { coolDown: originalPrinter?.tempTriggers?.coolDown }),
      };
      const settingsWebcam = {
        bitrate: originalPrinter.settingsWebcam.bitrate,
        ffmpegPath: originalPrinter.settingsWebcam.ffmpegPath,
        ffmpegThreads: originalPrinter.settingsWebcam.ffmpegThreads,
        ffmpegVideoCodec: originalPrinter.settingsWebcam.ffmpegVideoCodec,
        flipH: flipHCamera,
        flipV: flipVCamera,
        rotate90: rotateCamera,
        snapshotSslValidation: originalPrinter.settingsWebcam.snapshotSslValidation,
        snapshotTimeout: originalPrinter.settingsWebcam.snapshotTimeout,
        snapshotUrl: originalPrinter.settingsWebcam.snapshotUrl,
        streamRatio: originalPrinter.settingsWebcam.streamRatio,
        streamTimeout: originalPrinter.settingsWebcam.streamTimeout,
        streamUrl: originalPrinter.settingsWebcam.streamUrl,
        timelapseEnabled: enableTimeLapse,
        watermark: originalPrinter.settingsWebcam.watermark,
        webcamEnabled: enableCamera,
      };

      this.updatePrinterDatabase(index, {
        tempTriggers: tempTriggers,
        settingsWebcam: settingsWebcam,
      });

      newOctoPrintSettings.webcam = settingsWebcam;
    }

    const { connectPrinter, powerPrinter, connectAfterPowerTimeout, powerAfterDisconnectTimeout } =
      quickConnectSettings;

    if (
      !!connectPrinter ||
      !!powerPrinter ||
      !!connectAfterPowerTimeout ||
      !!powerAfterDisconnectTimeout
    ) {
      const quickConnectSettingsNew = {
        ...(typeof connectPrinter === 'boolean'
          ? { connectPrinter }
          : { connectPrinter: originalPrinter.quickConnectSettings.connectPrinter }),
        ...(typeof powerPrinter === 'boolean'
          ? { powerPrinter }
          : { powerPrinter: originalPrinter.quickConnectSettings.powerPrinter }),
        ...(!!connectAfterPowerTimeout
          ? { connectAfterPowerTimeout }
          : {
              connectAfterPowerTimeout:
                originalPrinter.quickConnectSettings.connectAfterPowerTimeout,
            }),
        ...(!!powerAfterDisconnectTimeout
          ? { powerAfterDisconnectTimeout }
          : {
              powerAfterDisconnectTimeout:
                originalPrinter.quickConnectSettings.powerAfterDisconnectTimeout,
            }),
      };
      this.updatePrinterDatabase(index, { quickConnectSettings: quickConnectSettingsNew });
    }

    originalPrinter.cleanPrintersInformation();

    profileCheck = await originalPrinter.updateOctoPrintProfileData(
      { profile: octoPrintProfiles[profileID] },
      profileID
    );
    settingsCheck = await originalPrinter.updateOctoPrintSettingsData(newOctoPrintSettings);

    await Promise.allSettled([
      originalPrinter.acquireOctoPrintProfileData(true),
      originalPrinter.acquireOctoPrintSettingsData(true),
    ]);

    return { octofarm: octofarmCheck, profile: profileCheck, settings: settingsCheck };

    // Refresh OctoPrint Updates
  }

  resetPrintersSocketConnections(idList) {
    idList.forEach((id) => {
      const printer = this.#findMePrinter(id);
      printer.resetSocketConnection();
    });
  }

  listUniqueFolderPaths() {
    const printers = this.listPrintersInformation();

    const filePathsArray = ['/'];

    for (let printer of printers) {
      const folderList = printer?.fileList?.folderList;
      if (folderList) {
        for (let folder of folderList) {
          if (!filePathsArray.includes(folder.name + '/')) {
            filePathsArray.push(folder.name + '/');
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
        for (let file of fileList) {
          const index = findIndex(uniqueFilesListFromAllPrinters, function (o) {
            return o.name === file.name;
          });
          if (index === -1) {
            uniqueFilesListFromAllPrinters.push(file);
          }
        }
      }
    });
    const filesThatExistOnAllPrinters = [];
    // Check if that file exists on all of the printers...
    for (let fileToCheck of uniqueFilesListFromAllPrinters) {
      const fileChecks = [];
      for (let id of ids) {
        const currentPrinter = this.#findMePrinter(id);
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

  async generatePrinterConnectionLogs(id) {
    const printer = this.#findMePrinter(id);
    return PrinterClean.generateConnectionLogs(printer);
  }

  disablePrinter(id) {
    const printer = this.#findMePrinter(id);
    return printer.disablePrinter();
  }

  async enablePrinter(id) {
    const printer = this.#findMePrinter(id);
    return printer.enablePrinter();
  }

  async getNewSessionKey(id) {
    const printer = this.#findMePrinter(id);
    const sessionKey = await printer.getSessionkey();
    if (!!sessionKey) {
      await printer.acquireOctoPrintUpdatesData(true);
    }

    return sessionKey;
  }

  getOctoPrintResourceMonitorValues(id) {
    const printer = this.#findMePrinter(id);
    return printer.octoResourceMonitor;
  }

  async resyncFilesList(id) {
    const printer = this.#findMePrinter(id);

    printer.fileList = await printer.acquireOctoPrintFilesData(true, true);
    const newPrinter = JSON.parse(JSON.stringify(printer));
    return Object.assign(newPrinter, {
      fileList: FileClean.generate(
        printer.fileList,
        printer.selectedFilament,
        printer.costSettings
      ),
    });
  }

  async resyncFile(id, fullPath) {
    const printer = this.#findMePrinter(id);
    const fileInformation = await printer.acquireOctoPrintFileData(fullPath, true);
    const newFile = JSON.parse(JSON.stringify(fileInformation));
    return FileClean.generateSingle(newFile, printer.selectedFilament, printer.costSettings);
  }

  getHouseCleanFileList(id, days) {
    const printer = this.#findMePrinter(id);
    return FileClean.listFilesOlderThanX(printer.fileList.fileList, days);
  }

  async houseCleanFiles(id, pathList) {
    const printer = this.#findMePrinter(id);
    return printer.houseKeepFiles(pathList);
  }

  async deleteAllFilesAndFolders(id) {
    const printer = this.#findMePrinter(id);
    return printer.deleteAllFilesAndFolders();
  }

  addNewFile(file) {
    const { index, files } = file;
    const printer = this.#findMePrinter(index);

    const date = new Date();

    const { name, path } = files.local;

    let filePath;

    if (path.indexOf('/') > -1) {
      filePath = path.substr(0, path.lastIndexOf('/'));
    } else {
      filePath = 'local';
    }

    const data = {
      path: filePath,
      fullPath: path,
      display: name,
      length: null,
      name: name.replace(/ /g, '_'),
      size: null,
      time: null,
      date: date.getTime() / 1000,
      thumbnail: null,
      success: 0,
      failed: 0,
      last: null,
    };

    if (this.doesFileExist(index, data.fullPath).length < 1) {
      PrinterService.findOneAndPush(index, 'fileList.fileList', data)
        .then(() => {
          printer.fileList.fileList.push(data);
        })
        .catch((e) => {
          logger.error('Issue updating file list', e);
        });
    }
    return printer;
  }

  doesFileExist(id, pathName) {
    const printer = this.#findMePrinter(id);

    return printer.fileList.fileList.filter(function (entry) {
      return entry.fullPath === pathName;
    });
  }

  doesFolderExist(id, folderName) {
    const printer = this.#findMePrinter(id);

    return printer.fileList.folderList.filter(function (entry) {
      return entry.name === folderName;
    });
  }

  addNewFolder(folder) {
    const { i, foldername } = folder;
    const printer = this.#findMePrinter(i);

    let path = 'local';
    let name = foldername;
    if (folder.path !== '') {
      path = folder.path;
      name = `${path}/${name}`;
    }
    const display = JSON.parse(JSON.stringify(name));
    const newFolder = {
      name: name,
      path,
      display,
    };

    if (this.doesFolderExist(i, newFolder.name).length < 1) {
      PrinterService.findOneAndPush(i, 'fileList.folderList', newFolder)
        .then(() => {
          printer.fileList.folderList.push(newFolder);
        })
        .catch((e) => {
          logger.error('Issue updating file list', e);
        });
    }

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
          printer.fileList.fileList[index].fullPath.lastIndexOf('/') + 1
        );
        printer.fileList.fileList[index].fullPath = `${folderName}/${fileName}`;
        printer.fileList.fileList[index].path = folderName;
      }
    });
    printer.fileList.folderList[folderIndex].name = folderName;
    printer.fileList.folderList[folderIndex].path = newFullPath;
    printer.updatePrinterData({
      fileList: printer.fileList,
    });
    return printer;
  }

  moveFile(id, newPath, fullPath, filename) {
    const printer = this.#findMePrinter(id);
    const file = findIndex(printer.fileList.fileList, function (o) {
      return o.name === filename;
    });
    printer.fileList.fileList[file].path = newPath;
    printer.fileList.fileList[file].fullPath = fullPath;
    printer.updatePrinterData({
      fileList: printer.fileList,
    });
    return printer;
  }

  deleteFile(id, fullPath) {
    const printer = this.#findMePrinter(id);
    const index = findIndex(printer.fileList.fileList, function (o) {
      return o.fullPath === fullPath;
    });
    printer.fileList.fileList.splice(index, 1);
    printer.updatePrinterData({
      fileList: printer.fileList,
    });
    return printer;
  }

  deleteFolder(id, fullPath) {
    const printer = this.#findMePrinter(id);
    printer.fileList.fileList.forEach((file, index) => {
      if (file.path === fullPath) {
        printer.fileList.fileList.splice(index, 1);
      }
    });
    printer.fileList.folderList.forEach((newFolder, index) => {
      if (newFolder.path === fullPath) {
        printer.fileList.folderList.splice(index, 1);
      }
    });
    const folder = findIndex(printer.fileList.folderList, function (o) {
      return o.name === fullPath;
    });
    printer.fileList.folderList.splice(folder, 1);
    printer.updatePrinterData({
      fileList: printer.fileList,
    });
    return printer;
  }

  async assignSpoolToPrinters(printerIDs, spoolID, multiSelectEnabled) {
    const farmPrinters = this.listPrintersInformation(true);

    // Unassign existing printers
    if (!multiSelectEnabled) {
      this.deattachSpoolFromAllPrinters(spoolID);
    }
    // Asign new printer id's;
    for (let id of printerIDs) {
      // No tool is de-attach request
      if (!id?.tool) {
        this.deattachSpoolFromAllPrinters(spoolID);
        break;
      }
      const tool = id.tool;
      const printerID = id.printer;
      const printerIndex = findIndex(farmPrinters, function (o) {
        return o._id === printerID;
      });

      if (spoolID !== '0') {
        const spool = await Filament.findById(spoolID);
        farmPrinters[printerIndex].selectedFilament[tool] = JSON.parse(JSON.stringify(spool));
        farmPrinters[printerIndex].selectedFilament[tool].spools.profile = await attachProfileToSpool(spool.spools.profile);
      } else {
        farmPrinters[printerIndex].selectedFilament[tool] = null;
      }
      this.updatePrinterDatabase(farmPrinters[printerIndex]._id, {
        selectedFilament: farmPrinters[printerIndex].selectedFilament,
      });
      FileClean.generate(
        farmPrinters[printerIndex].fileList,
        farmPrinters[printerIndex].selectedFilament,
        farmPrinters[printerIndex].costSettings
      );
    }
    TaskManager.forceRunTask('FILAMENT_CLEAN_TASK');
    return 'Attached all spools';
  }

  reRunJobCleaner = (id) => {
    const printer = this.#findMePrinter(id);
    JobClean.generate(
      printer.job,
      printer.selectedFilament,
      printer.fileList,
      printer.currentZ,
      printer.costSettings,
      printer.progress
    );
  };

  resetJob = (id) => {
    const printer = this.#findMePrinter(id);
    printer.resetJobInformation();
  };

  deattachSpoolFromAllPrinters(filamentID) {
    const farmPrinters = this.listPrintersInformation(true);
    const farmPrintersAssigned = farmPrinters.filter(
      (printer) =>
        findIndex(printer.selectedFilament, function (o) {
          if (!!o) {
            return o._id === filamentID;
          }
        }) > -1
    );
    farmPrintersAssigned.forEach((printer) => {
      printer.selectedFilament.forEach((spool, index) => {
        logger.debug('Resetting spool to null', spool);
        printer.selectedFilament[index] = null;
        logger.debug('Spool reset', spool);
      });
      this.updatePrinterDatabase(printer._id, { selectedFilament: printer.selectedFilament });
      FileClean.generate(printer.fileList, printer.selectedFilament, printer.costSettings);
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

  async updateFileInformation(id, data) {
    const printer = this.#findMePrinter(id);
    await printer.updateFileInformation(data);
  }

  getPrinterStatistics(id) {
    const printer = this.#findMePrinter(id);
    return printer.getPrinterStatistics();
  }

  updateActiveControlUser(id, activeControlUser) {
    this.updatePrinterDatabase(id, { activeControlUser });
  }

  resetActiveControlUser(id) {
    this.updatePrinterDatabase(id, { activeControlUser: '' });
  }
}

module.exports = PrinterStore;
