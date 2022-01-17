const { join } = require("path");
const { writeFileSync } = require("fs");

const { getLogsPath } = require("../utils/system-paths.utils.js");
const { isPm2, isNodemon, isNode } = require("../utils/env.utils.js");

const isDocker = require("is-docker");
const { getUpdateNotificationIfAny } = require("./octofarm-update.service.js");

const { SystemRunner } = require("../runners/systemInfo.js");
const prettyHelpers = require("../views/partials/functions/pretty.js");
const { AppConstants } = require("../app.constants");
const currentVersion = process?.env[AppConstants.VERSION_KEY];
const { SettingsClean } = require("./settings-cleaner.service");

const { checkIfFileFileExistsAndDeleteIfSo } = require("../utils/file.utils.js");

const { prettyPrintArray } = require("../utils/pretty-print.utils.js");

const { TaskManager } = require("../runners/task.manager");
const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const { generatePrinterStatistics } = require("./printer-statistics.service");

const systemInformationFileName = "system_information.txt";
const NO_DATA = " - ";

/**
 * Generates the contents for the system information files
 * @throws {String} If the SystemInformation object doesn't return
 */
async function generateSystemInformationContents() {
  let systemInformationContents = "--- OctoFarm Setup Information ---\n\n";
  systemInformationContents += `OctoFarm Version\n ${currentVersion} \n`;
  const airGapped = "Are we connected to the internet?\n";
  const pm2 = "Are we running under pm2?\n";
  const nodemon = "Are we running under nodemon?\n";
  const node = "Are we running with node?\n";
  const docker = "Are we in a docker container?\n";
  const loginRequires = "Is login required on the server?\n";
  const registration = "Is registration turned on the server?\n";
  const apiTimeout = "What are the API timeout settings?\n";
  const filamentManagerPlugin = "Is the filament manager plugin enabled?\n";
  const historySnapshot = "What are the history snapshot settings?\n";
  const influxDB = "What are the influxDB database settings? \n";
  const yes = " ✓  \n";
  const no = " ✘ \n";

  const updateNotification = getUpdateNotificationIfAny();

  if (!updateNotification?.air_gapped) {
    systemInformationContents += `${airGapped} ${yes}`;
  } else {
    systemInformationContents += `${airGapped} ${no}`;
  }

  if (isNode()) {
    systemInformationContents += `${node} ${yes}`;
  } else {
    systemInformationContents += `${node} ${no}`;
  }

  if (isPm2()) {
    systemInformationContents += `${pm2} ${yes}`;
  } else {
    systemInformationContents += `${pm2} ${no}`;
  }

  if (isNodemon()) {
    systemInformationContents += `${nodemon} ${yes}`;
  } else {
    systemInformationContents += `${nodemon} ${no}`;
  }

  if (isDocker()) {
    systemInformationContents += `${docker} ${yes}`;
  } else {
    systemInformationContents += `${docker} ${no}\n`;
  }

  const systemInformation = SystemRunner.returnInfo();

  if (!systemInformation) throw "No system information found";

  systemInformationContents += "--- System Information ---\n\n";

  systemInformationContents += `Platform\n ${systemInformation.distro} \n`;
  systemInformationContents += `Processor Arch\n ${systemInformation.architecture} \n`;
  systemInformationContents += `System Uptime\n ${prettyHelpers.generateTime(
    systemInformation.osUptime
  )} \n`;
  systemInformationContents += `OctoFarm Uptime\n ${prettyHelpers.generateTime(
    systemInformation.uptime
  )} \n`;
  systemInformationContents += `Total Memory\n ${prettyHelpers.generateBytes(
    systemInformation.totalMemory
  )} \n`;
  systemInformationContents += `CPU Load History\n ${JSON.stringify(
    systemInformation.cpuLoadHistory
  )} \n`;
  systemInformationContents += `Memory Load History\n ${JSON.stringify(
    systemInformation.memoryLoadHistory
  )} \n`;

  systemInformationContents += `Network IP's\n ${JSON.stringify(
    systemInformation.networkIpAddresses
  )} \n`;

  systemInformationContents += `Disk Use\n ${JSON.stringify(systemInformation.systemDisk.use)}% \n`;

  systemInformationContents += `Network IP's\n ${systemInformation.timezone} (${systemInformation.timezone}) \n\n`;

  const { server, timeout, history, filamentManager } = SettingsClean.returnSystemSettings();
  // System settings section

  systemInformationContents += "--- OctoFarm System Settings ---\n\n";

  if (server.loginRequired) {
    systemInformationContents += `${loginRequires} ${yes}`;
  } else {
    systemInformationContents += `${loginRequires} ${no}`;
  }
  if (server.registration) {
    systemInformationContents += `${registration} ${yes}`;
  } else {
    systemInformationContents += `${registration} ${no}`;
  }
  if (filamentManager) {
    systemInformationContents += `${filamentManagerPlugin} ${yes}\n`;
  } else {
    systemInformationContents += `${filamentManagerPlugin} ${no}\n`;
  }
  systemInformationContents += "-- History Settings --\n\n";
  for (const key in history) {
    if (history.hasOwnProperty(key)) {
      if (history[key].onComplete) {
        systemInformationContents += `History ${key} on complete? \n${yes}`;
      } else {
        systemInformationContents += `History ${key} on complete? \n${no}`;
      }
      if (history[key].onFailure) {
        systemInformationContents += `History ${key} on failure? \n${yes}`;
      } else {
        systemInformationContents += `History ${key} on failure? \n${no}`;
      }
      if (history[key]?.deleteAfter) {
        systemInformationContents += `History ${key} delete after?\n ${yes}`;
      } else {
        systemInformationContents += `History ${key} delete after?\n ${no}`;
      }
    }
  }
  systemInformationContents += "\n-- API Settings --\n\n";
  for (const key in timeout) {
    if (timeout.hasOwnProperty(key)) {
      systemInformationContents += `${key}\n${timeout[key]}\n`;
    }
  }

  // Replace with printer Overviews
  systemInformationContents += "\n --- Printer Overview ---\n\n";
  const printers = getPrinterStoreCache().listPrintersInformation();

  for (let i = 0; i < printers.length; i++) {
    let stats = getPrinterStoreCache().getPrinterStatistics(printers[i]._id);
    if (!stats) {
      stats = await generatePrinterStatistics(printers[i]._id);
      getPrinterStoreCache().updatePrinterStatistics(printers[i]._id, stats);
    }
    const { printerName, octoPrintVersion, printerFirmware } = printers[i];

    const { octoPrintSystemInfo } = stats;

    systemInformationContents += `${printerName} | ${octoPrintVersion} | ${printerFirmware} |  ${
      octoPrintSystemInfo?.["env.python.version"]
        ? octoPrintSystemInfo?.["env.python.version"]
        : NO_DATA
    } | ${
      octoPrintSystemInfo?.["env.python.pip"] ? octoPrintSystemInfo?.["env.python.pip"] : NO_DATA
    } | ${
      octoPrintSystemInfo?.["env.os.platform"] ? octoPrintSystemInfo?.["env.os.platform"] : NO_DATA
    } | ${
      octoPrintSystemInfo?.["env.hardware.cores"]
        ? octoPrintSystemInfo?.["env.hardware.cores"]
        : NO_DATA
    } | ${
      octoPrintSystemInfo?.["env.hardware.ram"]
        ? prettyHelpers.generateBytes(octoPrintSystemInfo?.["env.hardware.ram"])
        : NO_DATA
    } | ${octoPrintSystemInfo?.["octoprint.safe_mode"] ? "false" : "true"} \n`;
  }

  const latestTaskState = TaskManager.getTaskState();

  systemInformationContents += "\n--- OctoFarm Tasks ---\n\n";
  for (let task in latestTaskState) {
    const theTask = latestTaskState[task];
    systemInformationContents += theTask?.duration
      ? `${task}: duration: ${theTask.duration}ms \n`
      : `${task}: duration: Not completed yet.. \n`;
  }

  //Health Checks For printers...

  //Connection overviews

  return systemInformationContents;
}

/**
 * Generates a txt file containing the current system and octofarm information
 * @throws {Object} If the systemInformationContents doesn't return anything
 */
async function generateOctoFarmSystemInformationTxt() {
  let systemInformation = {
    name: systemInformationFileName,
    path: join(getLogsPath(), systemInformationFileName)
  };
  // Make sure existing zip files have been cleared from the system before continuing.
  await checkIfFileFileExistsAndDeleteIfSo(systemInformation?.path);

  let systemInformationContents = await generateSystemInformationContents();

  if (!systemInformationContents)
    throw { status: "error", msg: "Couldn't generate system_information.txt" };
  await writeFileSync(systemInformation?.path, systemInformationContents);

  return systemInformation;
}

module.exports = { generateOctoFarmSystemInformationTxt };
