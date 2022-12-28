const { join } = require('path');
const { writeFileSync } = require('fs');
const table = require('table').table;

const { getLogsPath } = require('../utils/system-paths.utils.js');
const { isPm2, isNodemon, isNode } = require('../utils/env.utils.js');

const isDocker = require('is-docker');
const { onlineChecker } = require('../modules/OnlineChecker/index.js');

const { SystemRunner } = require('./system-information.service.js');
const prettyHelpers = require('../templates/partials/functions/pretty.js');
const { AppConstants } = require('../constants/app.constants');
const currentVersion = process?.env[AppConstants.VERSION_KEY];
const { SettingsClean } = require('./settings-cleaner.service');

const { checkIfFileFileExistsAndDeleteIfSo } = require('../utils/file.utils.js');

const { returnPrinterHealthChecks } = require('../store/printer-health-checks.store');

const { TaskManager } = require('./task-manager.service');
const { getPrinterStoreCache } = require('../cache/printer-store.cache');
const { generatePrinterStatistics } = require('./printer-statistics.service');
const { averageMeanOfArray } = require('../utils/math.utils');

const systemInformationFileName = 'system_information.txt';
const NO_DATA = ' - ';

/**
 * Generates the contents for the system information files
 * @throws {String} If the SystemInformation object doesn't return
 */
async function generateSystemInformationContents() {
  let systemInformationContents = '--- OctoFarm Setup Information ---\n\n';
  systemInformationContents += `OctoFarm Version\n ${currentVersion} \n`;
  const airGapped = 'Connected to the internet?\n';
  const pm2 = 'Running under pm2?\n';
  const nodemon = 'Running under nodemon?\n';
  const node = 'Running with node?\n';
  const docker = 'Docker container?\n';
  const loginRequires = 'Login Required?\n';
  const registration = 'Registration On?\n';

  const yes = ' ✓  \n';
  const no = ' ✘ \n';
  const truth = ' ✓';
  const falsth = ' ✘';

  const updateNotification = getUpdateNotificationIfAny();

  if (!onlineChecker?.airGapped) {
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

  if (!systemInformation) {
    return false;
  }

  systemInformationContents += '--- System Information ---\n\n';

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

  systemInformationContents += `TimeZone \n ${systemInformation.timezoneName} (${systemInformation.timezone}) \n\n`;

  const { server, timeout, history } = SettingsClean.returnSystemSettings();
  // System settings section

  systemInformationContents += '--- OctoFarm System Settings ---\n\n';

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

  systemInformationContents += '-- History Settings --\n\n';
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
  systemInformationContents += '\n-- API Settings --\n\n';
  for (const key in timeout) {
    if (timeout.hasOwnProperty(key)) {
      systemInformationContents += `${key}\n${timeout[key]}\n`;
    }
  }

  // Replace with printer Overviews
  systemInformationContents += '\n --- Printer Overview ---\n\n';
  const printerOverViewTable = [];
  const printers = getPrinterStoreCache().listPrintersInformation();
  printerOverViewTable.push([
    'Printer Name',
    'OctoPrint Version',
    'Printer Firmware',
    'Python Version',
    'Pip Version',
    'OS Platform',
    'Hardware Cores',
    'Hardware Ram',
    'Safe Mode',
  ]);

  for (const printer of printers) {
    let stats = getPrinterStoreCache().getPrinterStatistics(printer._id);
    if (!stats) {
      stats = await generatePrinterStatistics(printer._id);
      getPrinterStoreCache().updatePrinterStatistics(printer._id, stats);
    }
    const { printerName, octoPrintVersion, printerFirmware } = printer;

    const { octoPrintSystemInfo } = stats;
    printerOverViewTable.push([
      printerName,
      octoPrintVersion ? octoPrintVersion : NO_DATA,
      printerFirmware ? printerFirmware : NO_DATA,
      octoPrintSystemInfo?.['env.python.version']
        ? octoPrintSystemInfo?.['env.python.version']
        : NO_DATA,
      octoPrintSystemInfo?.['env.python.pip'] ? octoPrintSystemInfo?.['env.python.pip'] : NO_DATA,
      octoPrintSystemInfo?.['env.os.platform'] ? octoPrintSystemInfo?.['env.os.platform'] : NO_DATA,
      octoPrintSystemInfo?.['env.hardware.cores']
        ? octoPrintSystemInfo?.['env.hardware.cores']
        : NO_DATA,
      octoPrintSystemInfo?.['env.hardware.ram']
        ? prettyHelpers.generateBytes(octoPrintSystemInfo?.['env.hardware.ram'])
        : NO_DATA,
      octoPrintSystemInfo?.['octoprint.safe_mode'] ? truth : falsth,
    ]);
  }

  systemInformationContents += table(printerOverViewTable);

  const latestTaskState = TaskManager.getTaskState();

  systemInformationContents += '\n--- OctoFarm Tasks ---\n\n';
  for (let task in latestTaskState) {
    const theTask = latestTaskState[task];
    systemInformationContents += theTask?.duration
      ? `${task}: duration: ${theTask.duration}ms \n`
      : `${task}: duration: Not completed yet.. \n`;
  }

  //Health Checks For printers...
  const healthChecks = returnPrinterHealthChecks(true);
  const healthCheckTable = [];
  systemInformationContents += '\n--- Printer Health Checks ---\n\n';
  healthCheckTable.push([
    'Date',
    'Printer Name',
    'URL Format',
    'Websocket Format',
    'Camera URL',
    'URL Match',
    'User API Info',
    'State API Info',
    'Profile API Info',
    'Settings API Info',
    'System API Info',
    'WebSocket Avg Response',
    'Saved Baud',
    'Saved Port',
    'Saved Profile',
  ]);
  for (const check of healthChecks) {
    healthCheckTable.push([
      check.dateChecked,
      check.printerName,
      check?.printerChecks.printerURL ? truth : falsth,
      check?.printerChecks.webSocketURL ? truth : falsth,
      check?.printerChecks.cameraURL ? truth : falsth,
      check?.printerChecks.match ? truth : falsth,
      check?.apiChecksRequired.userCheck ? truth : falsth,
      check?.apiChecksRequired.stateCheck ? truth : falsth,
      check?.apiChecksRequired.profileCheck ? truth : falsth,
      check?.apiChecksRequired.settingsCheck ? truth : falsth,
      check?.apiChecksRequired.systemCheck ? truth : falsth,
      check?.websocketChecks.lastResponseTimes
        ? averageMeanOfArray(check?.websocketChecks.lastResponseTimes, 0)
        : falsth,
      check?.connectionChecks.baud ? check?.connectionChecks.baud : falsth,
      check?.connectionChecks.port ? check?.connectionChecks.port : falsth,
      check?.connectionChecks.profile ? check?.connectionChecks.profile : falsth,
    ]);
  }
  systemInformationContents += table(healthCheckTable);

  return systemInformationContents;
}

/**
 * Generates a txt file containing the current system and octofarm information
 * @throws {Object} If the systemInformationContents doesn't return anything
 */
async function generateOctoFarmSystemInformationTxt() {
  let systemInformation = {
    name: systemInformationFileName,
    path: join(getLogsPath(), systemInformationFileName),
  };
  // Make sure existing zip files have been cleared from the system before continuing.
  await checkIfFileFileExistsAndDeleteIfSo(systemInformation?.path);

  let systemInformationContents = await generateSystemInformationContents();

  if (!systemInformationContents) {
    return false;
  }

  await writeFileSync(systemInformation?.path, systemInformationContents);

  return systemInformation;
}

module.exports = { generateOctoFarmSystemInformationTxt };
