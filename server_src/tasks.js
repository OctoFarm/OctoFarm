const softwareUpdateChecker = require("./services/octofarm-update.service");
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
    ksat(PRINTER_CLEAN_TASK, TaskPresets.PERIODIC_2500MS),
    ksat(GITHUB_UPDATE_CHECK_TASK, TaskPresets.RUNONCE),
    ksat(CRASH_TEST_TASK, TaskPresets.RUNDELAYED_1000MS)
  ];
}

module.exports = {
  OctoFarmTasks
};
