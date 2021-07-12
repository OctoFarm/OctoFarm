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

const CRASH_TEST = async () => {
  throw new Error("big error");
};

const UPDATE_CHECK_TEST = async () => {
  await softwareUpdateChecker.syncLatestOctoFarmRelease(false).then(() => {
    softwareUpdateChecker.checkReleaseAndLogUpdate();
  });
};

class OctoFarmTasks {
  static printerClean = {
    id: "PRINTER_CLEAN",
    task: PRINTER_CLEAN_TASK,
    preset: TaskPresets.PERIODIC_2500MS
  };
  static crashTest = {
    id: "CRASH_TEST",
    task: CRASH_TEST,
    preset: TaskPresets.RUNDELAYED_1000MS
  };
  static updateCheckTask = {
    id: "GITHUB_UPDATE_CHECK",
    task: UPDATE_CHECK_TEST,
    preset: TaskPresets.RUNONCE
  };
}

module.exports = {
  OctoFarmTasks
};
