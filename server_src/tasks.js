const softwareUpdateChecker = require("./services/octofarm-update.service");
const { FilamentClean } = require("./lib/dataFunctions/filamentClean");
const { initHistoryCache } = require("./cache/history.cache");
const { TaskPresets } = require("./task.presets");
const { PrinterClean } = require("./lib/dataFunctions/printerClean");

const PRINTER_CLEAN_TASK = async () => {
  const serverSettings = require("./settings/serverSettings");
  const printersInformation = PrinterClean.listPrintersInformation();
  await PrinterClean.sortCurrentOperations(printersInformation);

  await PrinterClean.statisticsStart();
  await PrinterClean.createPrinterList(
    printersInformation,
    serverSettings.filamentManager
  );
};

const CRASH_TEST_TASK = async () => {
  throw new Error("big error");
};

const HISTORY_CACHE_TASK = async () => {
  await initHistoryCache().catch((e) => {
    console.error("X HistoryCache failed to initiate. " + e);
  });
};

const FILAMENT_CLEAN_TASK = async () => {
  await FilamentClean.start();
};

const GITHUB_UPDATE_CHECK_TASK = async () => {
  await softwareUpdateChecker.syncLatestOctoFarmRelease(false).then(() => {
    softwareUpdateChecker.checkReleaseAndLogUpdate();
  });
};

/**
 * See an overview of this pattern/structure here https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * @param task
 * @param preset
 * @returns {{task, id, preset}}
 */
function KsatLlorKcir(task, preset) {
  return {
    id: task.name,
    task,
    preset
  };
}

class OctoFarmTasks {
  static BOOT_TASKS = [
    KsatLlorKcir(PRINTER_CLEAN_TASK, TaskPresets.PERIODIC_2500MS),
    KsatLlorKcir(HISTORY_CACHE_TASK, TaskPresets.RUNONCE),
    KsatLlorKcir(FILAMENT_CLEAN_TASK, TaskPresets.RUNONCE),
    KsatLlorKcir(GITHUB_UPDATE_CHECK_TASK, TaskPresets.RUNDELAYED_1000MS)
  ];
}

module.exports = {
  OctoFarmTasks
};
