const { ALLOWED_SYSTEM_CHECKS } = require("../../printers/constants/printer-defaults.constants");
const { isEmpty } = require("lodash");
const {
  parseAllOctoPrintUsers,
  findCurrentUserForOctoFarmConnection
} = require("../utils/octoprint-api-helpers.utils");
const {
  acquireWebCamData,
  acquirePrinterFilesAndFolderData
} = require("../utils/printer-data.utils");
const {
  testAndCollectCostPlugin,
  testAndCollectPSUControlPlugin
} = require("../utils/octoprint-plugin.utils");
const { PrinterClean } = require("../../printer-cleaner.service");
const octoPrintBase = "/";
const apiBase = octoPrintBase + "api";

const apiVersion = apiBase + "/version";
const apiUsers = apiBase + "/users";
const apiSettings = apiBase + "/settings";
const apiSystem = apiBase + "/system";
const apiSystemInfo = apiSystem + "/info";
const apiSystemCommands = apiSystem + "/commands";
const apiPrinterProfiles = apiBase + "/printerprofiles";
const apiConnection = apiBase + "/connection";
const apiPluginManager = apiBase + "/plugin/pluginmanager";
const apiSoftwareUpdateCheck = (force = false) =>
  octoPrintBase + "plugin/softwareupdate/check" + (force ? "?force=true" : "");
const apiFiles = (recursive = true) => apiBase + "/files?recursive=" + recursive;
const apiPluginPiSupport = apiBase + "/plugin/pi_support";

const basicDataRetrievalFunction = (data, captureKeys, printer, database) => {
  for (const [key, value] of captureKeys) {
    if (data.hasOwnProperty(key)) {
      printer[value] = data[key];
      database.update({
        [value]: data[key]
      });
    } else {
      return false;
    }
  }
  return true;
};

const settingsRetrievalFunction = (data, captureKeys, printer, database) => {
  const oldAppearance = Object.assign({}, printer.settingsAppearance);

  for (const [key, value] of captureKeys) {
    if (data.hasOwnProperty(key)) {
      printer[value] = data[key];
      database.update({
        [value]: data[key]
      });
    } else {
      return false;
    }
  }
  //These should not run ever again if this endpoint is forcibly updated. They are for initial scan only.
  if (printer.camURL.length === 0) {
    printer.camURL = acquireWebCamData(
      printer.camURL,
      printer.printerURL,
      data["webcam"].streamUrl
    );
  }
  printer.costSettings = testAndCollectCostPlugin(
    printer._id,
    printer.costSettings,
    data["plugins"]
  );
  printer.powerSettings = testAndCollectPSUControlPlugin(
    printer._id,
    printer.powerSettings,
    data["plugins"]
  );

  if (oldAppearance.name === "Grabbing from OctoPrint...") {
    printer.settingsAppearance.name = PrinterClean.grabOctoPrintName(
      data["appearance"],
      printer.printerURL
    );
  } else if (oldAppearance.name.length > 0) {
    printer.settingsAppearance.name = oldAppearance.name;
  } else {
    printer.settingsAppearance.name = data["appearance"].name;
  }

  if (printer.settingsAppearance.color !== data["appearance"].color) {
    printer.settingsAppearance.color = data["appearance"].color;
  }

  database.update({
    camURL: printer.camURL,
    settingsAppearance: printer.settingsAppearance,
    costSettings: printer.costSettings,
    powerSettings: printer.powerSettings
  });

  return true;
};

const userRetrievalFunction = (data, _captureKeys, printer, database) => {
  const userList = data["users"];

  if (!userList) {
    return false;
  }

  //If user list is empty then we can assume that an admin user is only one available.
  //Patch for OctoPrint < 1.4.2.
  if (isEmpty(userList)) {
    printer["currentUser"] = "admin";
    if (!printer["userList"].userList.includes(this.currentUser)) {
      printer["userList"].push(this.currentUser);
    }
    return true;
  }

  //If the userList isn't empty then we need to parse out the users names.
  printer["userList"] = parseAllOctoPrintUsers(userList);
  // If there is no current user then find one from the list...
  // Also check if user list contains current user and update if not...
  if (!printer["currentUser"]) {
    printer["currentUser"] = findCurrentUserForOctoFarmConnection(printer["userList"]);
  }

  database.update({
    currentUser: printer["currentUser"],
    userList: printer["userList"]
  });

  return true;
};

const pluginRetrievalFunction = (data, _captureKeys, printer, database) => {
  const pluginList = data["plugins"];

  if (!pluginList) {
    return false;
  }

  printer.pluginsListEnabled = pluginList.filter(function (plugin) {
    return plugin.enabled;
  });

  printer.pluginsListDisabled = pluginList.filter(function (plugin) {
    return !plugin.enabled;
  });

  database.update({
    pluginsListEnabled: printer.pluginsListEnabled,
    pluginsListDisabled: printer.pluginsListDisabled
  });

  return true;
};

const updatesInformationRetrievalFunction = (data, _captureKeys, printer, database) => {
  const updateInformation = data["information"];
  if (!updateInformation) {
    return false;
  }

  let octoPrintUpdate = false;
  const pluginUpdates = [];

  for (const key in updateInformation) {
    if (updateInformation.hasOwnProperty(key)) {
      if (updateInformation[key].updateAvailable) {
        if (key === "octoprint") {
          octoPrintUpdate = {
            id: key,
            displayName: updateInformation[key].displayName,
            displayVersion: updateInformation[key].displayVersion,
            updateAvailable: updateInformation[key].updateAvailable,
            releaseNotesURL: updateInformation[key].releaseNotes
          };
        } else {
          pluginUpdates.push({
            id: key,
            displayName: updateInformation[key].displayName,
            displayVersion: updateInformation[key].displayVersion,
            updateAvailable: updateInformation[key].updateAvailable,
            releaseNotesURL: updateInformation[key].releaseNotes
          });
        }
      }
    }
  }
  printer.octoPrintUpdate = octoPrintUpdate;
  printer.octoPrintPluginUpdates = pluginUpdates;
  database.update({
    octoPrintUpdate: octoPrintUpdate,
    octoPrintPluginUpdates: pluginUpdates
  });

  return true;
};

const filesRetrievalFunction = (data, _captureKeys, printer, database) => {
  const fileList = data["files"];
  const total = data["total"];
  const free = data["free"];

  if (!fileList || !total || !free) {
    return false;
  }

  printer.storage = {
    free: free,
    total: total
  };
  const { printerFiles, printerLocations } = acquirePrinterFilesAndFolderData(fileList);

  printer.fileList = {
    fileList: printerFiles,
    filecount: printerFiles.length,
    folderList: printerLocations,
    folderCount: printerLocations.length
  };

  database.update({
    storage: printer.storage,
    fileList: {
      fileList: printerFiles,
      filecount: printerFiles.length,
      folderList: printerLocations,
      folderCount: printerLocations.length
    }
  });

  return true;
};

module.exports = {
  requiredApiCheckSequence: [
    {
      api: apiVersion,
      tickerMessage: "OctoPrint's version information",
      captureDataKeys: new Map([["server", "octoPrintVersion"]]),
      apiCheck: ALLOWED_SYSTEM_CHECKS().VERSION,
      dataRetrievalFunction: basicDataRetrievalFunction
    },
    {
      api: apiUsers,
      tickerMessage: "OctoPrint's user information",
      apiCheck: ALLOWED_SYSTEM_CHECKS().USERS,
      captureDataKeys: new Map([["users", ""]]),
      dataRetrievalFunction: userRetrievalFunction
    },
    {
      api: apiSettings,
      tickerMessage: "OctoPrint's settings information",
      apiCheck: ALLOWED_SYSTEM_CHECKS().SETTINGS,
      captureDataKeys: new Map([
        ["api", "settingsApi"],
        ["feature", "settingsFeature"],
        ["folder", "settingsFolder"],
        ["plugins", "settingsPlugins"],
        ["scripts", "settingsScripts"],
        ["serial", "settingsSerial"],
        ["server", "settingsServer"],
        ["system", "settingsSystem"],
        ["webcam", "settingsWebcam"],
        ["appearance", "settingsAppearance"]
      ]),
      dataRetrievalFunction: settingsRetrievalFunction
    },
    {
      api: apiSystemCommands,
      tickerMessage: "OctoPrint's system commands",
      apiCheck: ALLOWED_SYSTEM_CHECKS().SYSTEM,
      captureDataKeys: new Map([["core", "core"]]),
      dataRetrievalFunction: basicDataRetrievalFunction
    },
    {
      api: apiPrinterProfiles,
      tickerMessage: "OctoPrint's printer profile data",
      apiCheck: ALLOWED_SYSTEM_CHECKS().PROFILE,
      captureDataKeys: new Map([["profiles", "profiles"]]),
      dataRetrievalFunction: basicDataRetrievalFunction
    },
    {
      api: apiConnection,
      tickerMessage: "OctoPrint's printer connection data",
      apiCheck: ALLOWED_SYSTEM_CHECKS().STATE,
      captureDataKeys: new Map([
        ["current", "current"],
        ["options", "options"]
      ]),
      dataRetrievalFunction: basicDataRetrievalFunction
    }
  ],
  optionalApiCheckSequence: [
    {
      api: apiSystemInfo,
      tickerMessage: "OctoPrint's system information",
      apiCheck: ALLOWED_SYSTEM_CHECKS().SYSTEM_INFO,
      captureDataKeys: new Map([["systeminfo", "octoPrintSystemInfo"]]),
      dataRetrievalFunction: basicDataRetrievalFunction
    },
    {
      api: apiPluginManager,
      tickerMessage: "OctoPrint's plugin information",
      apiCheck: ALLOWED_SYSTEM_CHECKS().PLUGINS,
      captureDataKeys: new Map([["plugins", ""]]),
      dataRetrievalFunction: pluginRetrievalFunction
    },
    {
      api: apiSoftwareUpdateCheck(),
      tickerMessage: "OctoPrint's update information",
      apiCheck: ALLOWED_SYSTEM_CHECKS().UPDATES,
      captureDataKeys: new Map([["information", ""]]),
      dataRetrievalFunction: updatesInformationRetrievalFunction
    },
    {
      api: apiFiles(),
      tickerMessage: "OctoPrint's file lists",
      apiCheck: ALLOWED_SYSTEM_CHECKS().FILES,
      captureDataKeys: new Map([
        ["free", ""],
        ["total", ""],
        ["files", ""]
      ]),
      dataRetrievalFunction: filesRetrievalFunction
    },
    {
      api: apiPluginPiSupport,
      tickerMessage: "OctoPrint's file lists",
      apiCheck: ALLOWED_SYSTEM_CHECKS().OCTOPI,
      captureDataKeys: new Map([["octoPi", "octoPi"]]),
      dataRetrievalFunction: basicDataRetrievalFunction
    }
  ]
};
