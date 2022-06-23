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
const { fetchClientVersion } = require("./app-env");
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

const INITIALISE_SYSTEM_CACHE = async () => {
  await getPrinterManagerCache();
  await getPrinterStoreCache();
  await getEventEmitterCache();
  await initHistoryCache();
  await getInfluxCleanerCache();
  fetchClientVersion();
};

const INITIALISE_PRINTERS = async () => {
  await getPrinterManagerCache().initialisePrinters();
};

const START_PRINTER_ADD_QUEUE = async () => {
  await getPrinterManagerCache().startPrinterEnableQueue();
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

const FARMPI_DETECTION_TASK = async () => {
  await detectFarmPi();
};

const FILAMENT_CLEAN_TASK = async () => {
  await FilamentClean.start();
};

const GITHUB_UPDATE_CHECK_TASK = async () => {
  await softwareUpdateChecker.syncLatestOctoFarmRelease(false).then(() => {
    softwareUpdateChecker.checkReleaseAndLogUpdate();
  });
};

const SYSTEM_INFO_CHECK_TASK = async () => {
  await SystemRunner.initialiseSystemInformation();
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
  const stats = FileClean.statistics(pList);
  logger.debug("File Statistics Run", stats);
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

const INIT_FARM_INFORMATION = async () => {
  await initFarmInformation();
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
}

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
    TaskStart(INITIALISE_SYSTEM_CACHE, TaskPresets.RUNONCE),
    TaskStart(SYSTEM_INFO_CHECK_TASK, TaskPresets.RUNONCE),
    TaskStart(GITHUB_UPDATE_CHECK_TASK, TaskPresets.PERIODIC_IMMEDIATE_DAY),
    TaskStart(UPDATE_OCTOPRINT_PLUGINS_LIST, TaskPresets.PERIODIC_IMMEDIATE_DAY),
    TaskStart(GRAB_LATEST_PATREON_DATA, TaskPresets.PERIODIC_IMMEDIATE_WEEK),
    TaskStart(CPU_PROFILING_TASK, TaskPresets.PERIODIC_10000MS),
    TaskStart(MEMORY_PROFILING_TASK, TaskPresets.PERIODIC_10000MS),
    TaskStart(FARMPI_DETECTION_TASK, TaskPresets.RUNONCE),
    TaskStart(INIT_FARM_INFORMATION, TaskPresets.RUNONCE),
    TaskStart(INITIALISE_PRINTERS, TaskPresets.RUNONCE),
    TaskStart(SORT_CURRENT_OPERATIONS, TaskPresets.PERIODIC_1000MS),
    TaskStart(GENERATE_PRINTER_HEAT_MAP, TaskPresets.PERIODIC_1000MS),
    TaskStart(GENERATE_PRINTER_CONTROL_LIST, TaskPresets.PERIODIC_5000MS),
    TaskStart(STATE_TRACK_COUNTERS, TaskPresets.PERIODIC, 30000),
    TaskStart(CHECK_PRINTERS_POWER_STATES, TaskPresets.PERIODIC, 30000),
    TaskStart(FILAMENT_CLEAN_TASK, TaskPresets.RUNDELAYED, 1000),
    TaskStart(GENERATE_MONTHLY_HISTORY_STATS, TaskPresets.PERIODIC_IMMEDIATE_DAY),
    TaskStart(RUN_PRINTER_HEALTH_CHECKS, TaskPresets.PERIODIC_600000MS),
    TaskStart(GENERATE_FILE_STATISTICS, TaskPresets.RUNONCE),
    TaskStart(CHECK_FOR_OCTOPRINT_UPDATES, TaskPresets.PERIODIC_DAY),
    TaskStart(GENERATE_PRINTER_SPECIFIC_STATISTICS, TaskPresets.PERIODIC_600000MS),
    TaskStart(START_PRINTER_ADD_QUEUE, TaskPresets.RUNONCE),
    TaskStart(I_AM_ALIVE, TaskPresets.PERIODIC_IMMEDIATE_5000_MS),
    TaskStart(PING_PONG_CHECK, TaskPresets.PERIODIC_10000MS)
    // TaskStart(INIT_FILE_UPLOAD_QUEUE, TaskPresets.PERIODIC_2500MS)
  ];
}

module.exports = {
  OctoFarmTasks
};
