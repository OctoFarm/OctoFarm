const softwareUpdateChecker = require("./services/octofarm-update.service");
const { FilamentClean } = require("./lib/dataFunctions/filamentClean");
const { initHistoryCache, getHistoryCache } = require("./cache/history.cache");
const { TaskPresets } = require("./task.presets");
const { SystemRunner } = require("./runners/systemInfo");
const { grabLatestPatreonData } = require("./services/patreon.service");
const { SettingsClean } = require("./lib/dataFunctions/settingsClean");
const { detectFarmPi } = require("./services/farmpi-detection.service");
const { getPrinterManagerCache } = require("./cache/printer-manager.cache");
const { getPrinterStoreCache } = require("./cache/printer-store.cache");
const { updatePrinterHealthChecks } = require("./store/printer-health-checks.store");
const { PrinterClean } = require("./lib/dataFunctions/printerClean");

const INITIALISE_PRINTERS = async () => {
  await getPrinterManagerCache().initialisePrinters();
};

const INITIALIST_PRINTERS_STORE = async () => {
  await getPrinterStoreCache();
};

const SORT_CURRENT_OPERATIONS = async () => {
  const printerList = getPrinterStoreCache().listPrintersInformation();
  await PrinterClean.sortCurrentOperations(printerList);
};

const CRASH_TEST_TASK = async () => {
  throw new Error("big error");
};

const FARMPI_DETECTION_TASK = async () => {
  await detectFarmPi();
};

const HISTORY_CACHE_TASK = async () => {
  await initHistoryCache().catch((e) => {
    console.error("X HistoryCache failed to initiate. " + e);
  });
};

const FILAMENT_CLEAN_TASK = async () => {
  const serverSettings = SettingsClean.returnSystemSettings();
  await FilamentClean.start(serverSettings.filamentManager);
};

const GITHUB_UPDATE_CHECK_TASK = async () => {
  await softwareUpdateChecker.syncLatestOctoFarmRelease(false).then(() => {
    softwareUpdateChecker.checkReleaseAndLogUpdate();
  });
};

const SYSTEM_INFO_CHECK_TASK = async () => {
  await SystemRunner.querySystemInfo();
};

const GENERATE_MONTHLY_HISTORY_STATS = async () => {
  await getHistoryCache().generateMonthlyStats();
};

const RUN_PRINTER_HEALTH_CHECKS = async () => {
  await updatePrinterHealthChecks();
};

const SSE_TASK = () => {
  //     const currentOperations = await PrinterClean.returnCurrentOperations();
  //     let printersInformation = await PrinterClean.listPrintersInformation();
  //     printersInformation = await filterMe(printersInformation);
  //     printersInformation = await sortMe(printersInformation);
  //     const printerControlList = await PrinterClean.returnPrinterControlList();
  //
  //     if (!!serverSettings.influxExport?.active) {
  //       if (influxCounter >= 2000) {
  //         sendToInflux(printersInformation);
  //         influxCounter = 0;
  //       } else {
  //         influxCounter = influxCounter + 500;
  //       }
  //       // eslint-disable-next-line no-use-before-define
  //     }
  //     const infoDrop = {
  //       printersInformation: printersInformation,
  //       currentOperations: currentOperations,
  //       printerControlList: printerControlList,
  //       clientSettings: clientSettings
  //     };
  //     clientInformation = await stringify(infoDrop);
  //     clients.forEach((c, index) => {
  //       c.res.write("data: " + clientInformation + "\n\n");
  //     });
};

const SSE_DASHBOARD = () => {
  // if (interval === false) {
  //   interval = setInterval(async function () {
  //     let clientsSettingsCache = await SettingsClean.returnClientSettings();
  //     if (!clientsSettingsCache) {
  //       await SettingsClean.start();
  //       clientsSettingsCache = await SettingsClean.returnClientSettings();
  //     }
  //
  //     let dashboardSettings = clientsSettingsCache.dashboard;
  //     if (!dashboardSettings) {
  //       dashboardSettings = getDefaultDashboardSettings();
  //     }
  //
  //     const currentOperations = await PrinterClean.returnCurrentOperations();
  //     const dashStatistics = await PrinterClean.returnDashboardStatistics();
  //     const printerInformation = await PrinterClean.listPrintersInformation();
  //     const infoDrop = {
  //       printerInformation,
  //       currentOperations,
  //       dashStatistics,
  //       dashboardSettings
  //     };
  //
  //     clientInformation = await stringify(infoDrop);
  //     for (clientId in clients) {
  //       clients[clientId].write("retry:" + 10000 + "\n");
  //       clients[clientId].write("data: " + clientInformation + "\n\n"); // <- Push a message to a single attached client
  //     }
  //   }, 5000);
  // }
};

const STATE_TRACK_COUNTERS = async () => {
  await getPrinterManagerCache().updateStateCounters();
};

const GRAB_LATEST_PATREON_DATA = async () => {
  await grabLatestPatreonData();
};

const DATABASE_MIGRATIONS_TASK = async () => {
  const migrations = require("./migrations");
  console.log(migrations);
};

const INIT_FARM_INFORMATION = async () => {
  await PrinterClean.initFarmInformation();
};

/**
 * @param task
 * @param preset
 * @param milliseconds optional parameter to quickly set milliseconds timing
 * @returns {{task, id, preset}}
 */
function TaskStart(task, preset, milliseconds = 0) {
  preset.milliseconds = preset.milliseconds || milliseconds;

  return {
    id: task.name,
    task,
    preset
  };
}

class OctoFarmTasks {
  static RECURRING_BOOT_TASKS = [
    TaskStart(SYSTEM_INFO_CHECK_TASK, TaskPresets.RUNONCE),
    TaskStart(FARMPI_DETECTION_TASK, TaskPresets.RUNONCE),
    TaskStart(INIT_FARM_INFORMATION, TaskPresets.RUNONCE),
    TaskStart(GITHUB_UPDATE_CHECK_TASK, TaskPresets.PERIODIC_IMMEDIATE_DAY),
    TaskStart(GRAB_LATEST_PATREON_DATA, TaskPresets.PERIODIC_IMMEDIATE_WEEK),
    TaskStart(INITIALIST_PRINTERS_STORE, TaskPresets.RUNONCE),
    TaskStart(INITIALISE_PRINTERS, TaskPresets.RUNONCE),
    TaskStart(SORT_CURRENT_OPERATIONS, TaskPresets.PERIODIC_1000MS),
    TaskStart(STATE_TRACK_COUNTERS, TaskPresets.PERIODIC, 30000),
    TaskStart(FILAMENT_CLEAN_TASK, TaskPresets.RUNDELAYED, 1000),
    TaskStart(HISTORY_CACHE_TASK, TaskPresets.RUNONCE),
    TaskStart(GENERATE_MONTHLY_HISTORY_STATS, TaskPresets.PERIODIC_IMMEDIATE_DAY),
    TaskStart(RUN_PRINTER_HEALTH_CHECKS, TaskPresets.PERIODIC_120000MS)
  ];
}

module.exports = {
  OctoFarmTasks
};
