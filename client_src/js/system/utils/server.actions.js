import OctoFarmClient from "../../services/octofarm-client.service";
import UI from "../../lib/functions/ui";
import { setupOctoPrintForTimelapses } from "../../octoprint/octoprint-settings.actions";
import FileOperations from "../../lib/functions/file";

async function setupOPTimelapseSettings() {
  const printers = await OctoFarmClient.listPrinters();
  const alert = UI.createAlert(
    "warning",
    `${UI.returnSpinnerTemplate()} Setting up your OctoPrint settings, please wait...`
  );
  const { successfulPrinters, failedPrinters } = await setupOctoPrintForTimelapses(printers);
  alert.close();
  bootbox.alert(successfulPrinters + failedPrinters);
}

async function generateLogDumpFile() {
  let logDumpResponse = await OctoFarmClient.generateLogDump();

  if (!logDumpResponse?.status || !logDumpResponse?.msg || !logDumpResponse?.zipDumpPath) {
    UI.createAlert(
      "error",
      "There was an issue with the servers response, please check your logs",
      0,
      "clicked"
    );
    return;
  }

  UI.createAlert(logDumpResponse.status, logDumpResponse.msg, 5000, "clicked");

  // Error detected so no need to create button.
  if (logDumpResponse.status === "error") {
    return;
  }

  const logDumpDownloadBtn = document.getElementById("logDumpDownloadBtn");

  if (logDumpDownloadBtn) {
    logDumpDownloadBtn.classList.remove("d-none");
    logDumpDownloadBtn.addEventListener("click", (e) => {
      setTimeout(() => {
        logDumpDownloadBtn.classList.add("d-none");
      }, 5000);
      window.open(`${OctoFarmClient.serverSettingsRoute}/${logDumpResponse.zipDumpPath}`);
    });
  }
}

async function nukeDatabases(database) {
  let databaseNuke;
  if (!database) {
    databaseNuke = await OctoFarmClient.get("settings/server/delete/database");
  } else {
    databaseNuke = await OctoFarmClient.get("settings/server/delete/database/" + database);
  }
  UI.createAlert("success", databaseNuke.message, 3000);
}

async function exportDatabases(database) {
  const databaseExport = await OctoFarmClient.get("settings/server/get/database/" + database);

  if (databaseExport?.databases[0].length !== 0) {
    FileOperations.download(database + ".json", JSON.stringify(databaseExport.databases));
  } else {
    UI.createAlert("warning", "Database is empty, will not export...", 3000, "clicked");
  }
}

export { setupOPTimelapseSettings, generateLogDumpFile, nukeDatabases, exportDatabases };
