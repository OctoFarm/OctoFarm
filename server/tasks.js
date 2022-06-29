const softwareUpdateChecker = require("./services/octofarm-update.service");
const { FilamentClean } = require("./services/filament-cleaner.service");
const { initHistoryCache, getHistoryCache } = require("./cache/history.cache");
const { TaskPresets } = require("./constants/task.constants");
const { SystemRunner } = require("./services/system-information.service");
const { grabLatestPatreonData } = require("./services/patreon.service");
const { detectFarmPi } = require("./services/farmpi-detection.service");
const { getPrinterManagerCache } = require("./cache/printer-manager.cache");
const { getPrinterStoreCache } = require("./cache/printer-store.cache");
const { getEventEmitterCache } = require("./cache/event-emitter.cache");
const { updatePrinterHealthChecks } = require("./store/printer-health-checks.store");
const {
  updatePluginNoticesStore,
  updatePluginStore
} = require("./store/octoprint-plugin-list.store");
const { getInfluxCleanerCache } = require("./cache/influx-export.cache");
const { FileClean } = require("./services/file-cleaner.service");
const { sortCurrentOperations } = require("./services/current-operations.service");
const { generatePrinterHeatMap } = require("./services/printer-statistics.service");
const { initFarmInformation } = require("./services/farm-information.service");
const { notifySubscribers } = require("./services/server-side-events.service");
const { MESSAGE_TYPES } = require("./constants/sse.constants");
const { LOGGER_ROUTE_KEYS } = require("./constants/logger.constants");

const Logger = require("./handlers/logger");
const { SettingsClean } = require("./services/settings-cleaner.service");
const logger = new Logger(LOGGER_ROUTE_KEYS.SERVER_TASKS);

const I_AM_ALIVE = () => {
  notifySubscribers("iAmAlive", MESSAGE_TYPES.AM_I_ALIVE, {
    ok: true,
    loginRequired: SettingsClean.isLogonRequired()
  });
};

const INITIALISE_PRINTERS_TASK = async () => {
  await getPrinterManagerCache();
  await getPrinterManagerCache().initialisePrinters();
  await getPrinterManagerCache().updateStateCounters();
  await Promise.allSettled([
    await getPrinterStoreCache(),
    await getEventEmitterCache(),
    await initHistoryCache(),
    await getInfluxCleanerCache()
  ]);
  const pList = getPrinterStoreCache().listPrintersInformation();
  await Promise.allSettled([
    await initFarmInformation(),
    await generatePrinterHeatMap(),
    await FilamentClean.start(),
    await getHistoryCache().generateMonthlyStats(),
    await getPrinterManagerCache().generatePrintersStatisticsCache(),
    await getPrinterManagerCache().generatePrintersControlDropList(),
    FileClean.statistics(pList),
    await sortCurrentOperations(pList),
    await getPrinterManagerCache().startPrinterEnableQueue()
  ]);

  setTimeout(async () => {
    await updatePrinterHealthChecks(true);
  }, 5000);
};

const SERVER_BOOT_TASK = async () => {
  await Promise.allSettled([
    await SystemRunner.initialiseSystemInformation(),
    await detectFarmPi(),
    await SystemRunner.profileCPUUsagePercent(),
    SystemRunner.profileMemoryUsagePercent(),
    await grabLatestPatreonData(),
    await updatePluginNoticesStore(),
    await updatePluginStore(),
    await softwareUpdateChecker.syncLatestOctoFarmRelease(false).then(() => {
      softwareUpdateChecker.checkReleaseAndLogUpdate();
    })
  ]);
};

const SORT_CURRENT_OPERATIONS = async () => {
  const printerList = getPrinterStoreCache().listPrintersInformation();
  await sortCurrentOperations(printerList);
};

const GENERATE_PRINTER_HEAT_MAP = async () => {
  await generatePrinterHeatMap();
};

const CRASH_TEST_TASK = async () => {
  throw new Error("big error");
};

const GITHUB_UPDATE_CHECK_TASK = async () => {
  await softwareUpdateChecker.syncLatestOctoFarmRelease(false).then(() => {
    softwareUpdateChecker.checkReleaseAndLogUpdate();
  });
};

const CPU_PROFILING_TASK = async () => {
  await SystemRunner.profileCPUUsagePercent();
};

const MEMORY_PROFILING_TASK = () => {
  SystemRunner.profileMemoryUsagePercent();
};

const GENERATE_MONTHLY_HISTORY_STATS = async () => {
  await getHistoryCache().generateMonthlyStats();
};

const RUN_PRINTER_HEALTH_CHECKS = async () => {
  await updatePrinterHealthChecks(true);
};

const GENERATE_FILE_STATISTICS = async () => {
  const pList = getPrinterStoreCache().listPrintersInformation();
  FileClean.statistics(pList);
};

const STATE_TRACK_COUNTERS = async () => {
  await getPrinterManagerCache().updateStateCounters();
};

const GRAB_LATEST_PATREON_DATA = async () => {
  await grabLatestPatreonData();
};

const GENERATE_PRINTER_CONTROL_LIST = async () => {
  await getPrinterManagerCache().generatePrintersControlDropList();
};

const UPDATE_OCTOPRINT_PLUGINS_LIST = async () => {
  await updatePluginNoticesStore();
  await updatePluginStore();
};

const CHECK_FOR_OCTOPRINT_UPDATES = async () => {
  await getPrinterManagerCache().checkForOctoPrintUpdates();
};

const GENERATE_PRINTER_SPECIFIC_STATISTICS = async () => {
  await getPrinterManagerCache().generatePrintersStatisticsCache();
};

const PING_PONG_CHECK = async () => {
  await getPrinterManagerCache().websocketKeepAlive();
};

const CHECK_PRINTERS_POWER_STATES = async () => {
  await getPrinterManagerCache().checkPrinterPowerStates();
};

const FILAMENT_CLEAN_TASK = async () => {
  await FilamentClean.start();
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
  static SYSTEM_STARTUP_TASKS = TaskStart(SERVER_BOOT_TASK, TaskPresets.RUNONCE);

  static PRINTER_INITIALISE_TASK = TaskStart(INITIALISE_PRINTERS_TASK, TaskPresets.RUNONCE);

  static RECURRING_BOOT_TASKS = [
    TaskStart(GITHUB_UPDATE_CHECK_TASK, TaskPresets.PERIODIC_DAY),
    TaskStart(UPDATE_OCTOPRINT_PLUGINS_LIST, TaskPresets.PERIODIC_DAY),
    TaskStart(GRAB_LATEST_PATREON_DATA, TaskPresets.PERIODIC_DAY),
    TaskStart(CPU_PROFILING_TASK, TaskPresets.PERIODIC_10000MS),
    TaskStart(MEMORY_PROFILING_TASK, TaskPresets.PERIODIC_10000MS),
    TaskStart(SORT_CURRENT_OPERATIONS, TaskPresets.PERIODIC_1000MS),
    TaskStart(GENERATE_PRINTER_HEAT_MAP, TaskPresets.PERIODIC_1000MS),
    TaskStart(GENERATE_PRINTER_CONTROL_LIST, TaskPresets.PERIODIC_5000MS),
    TaskStart(STATE_TRACK_COUNTERS, TaskPresets.PERIODIC, 30000),
    TaskStart(CHECK_PRINTERS_POWER_STATES, TaskPresets.PERIODIC, 30000),
    TaskStart(GENERATE_MONTHLY_HISTORY_STATS, TaskPresets.PERIODIC_600000MS),
    TaskStart(FILAMENT_CLEAN_TASK, TaskPresets.PERIODIC_600000MS),
    TaskStart(RUN_PRINTER_HEALTH_CHECKS, TaskPresets.PERIODIC_600000MS),
    TaskStart(GENERATE_FILE_STATISTICS, TaskPresets.PERIODIC, 30000),
    TaskStart(CHECK_FOR_OCTOPRINT_UPDATES, TaskPresets.PERIODIC_DAY),
    TaskStart(GENERATE_PRINTER_SPECIFIC_STATISTICS, TaskPresets.PERIODIC_600000MS),
    TaskStart(I_AM_ALIVE, TaskPresets.PERIODIC_IMMEDIATE_5000_MS),
    TaskStart(PING_PONG_CHECK, TaskPresets.PERIODIC_10000MS)
    // TaskStart(INIT_FILE_UPLOAD_QUEUE, TaskPresets.PERIODIC_2500MS)
  ];
}

module.exports = {
  OctoFarmTasks
};
