import { createClientSSEWorker } from "./services/client-worker.service";
import PrinterSelect from "./lib/modules/printerSelect";
import {
  bulkConnectPrinters,
  bulkDisconnectPrinters,
  bulkEnableVirtualPrinter,
  bulkOctoPrintClientUpdate,
  bulkOctoPrintPluginAction,
  bulkOctoPrintPluginUpdate,
  bulkOctoPrintPowerCommand
} from "./pages/printer-manager/functions/bulk-commands-functions";
import {
  addBlankPrinterToTable,
  bulkDeletePrinters,
  bulkEditPrinters,
  deleteAllOnAddPrinterTable,
  exportPrintersToJson,
  importPrintersFromJsonFile,
  loadFarmOverviewInformation,
  loadPrinterHealthChecks,
  reSyncAPI,
  reSyncWebsockets,
  saveAllOnAddPrinterTable,
  scanNetworkForDevices,
  workerEventFunction
} from "./pages/printer-manager/functions/printer-manager.functions";

import { setupSortablePrintersTable } from "./pages/printer-manager/functions/sortable-table";

const workerURL = "/printersInfo/get/";

const multiPrinterSelectModal = document.getElementById("multiPrintersSection");

// Bulk OctoPrint Command Listeners
let bulkPluginUpdateButton = document.getElementById("blkUpdatePluginsBtn");
bulkPluginUpdateButton.addEventListener("click", async () => {
  await bulkOctoPrintPluginUpdate();
});

let bulkOctoPrintUpdateButton = document.getElementById("blkOctoPrintUpdate");
bulkOctoPrintUpdateButton.addEventListener("click", async (e) => {
  await bulkOctoPrintClientUpdate();
});

let scanNetworkBtn = document.getElementById("scanNetworkBtn");
scanNetworkBtn.addEventListener("click", async (e) => {
  await scanNetworkForDevices(e);
});

const blkPluginsBtn = document.getElementById("blkPluginsInstallBtn");
blkPluginsBtn.addEventListener("click", async (e) => {
  await PrinterSelect.create(multiPrinterSelectModal, false, "Install Plugins", function () {
    bulkOctoPrintPluginAction("install");
  });
});

const blkPluginsUninstallBtn = document.getElementById("blkPluginsUnInstallBtn");
blkPluginsUninstallBtn.addEventListener("click", async (e) => {
  await PrinterSelect.create(multiPrinterSelectModal, false, "Uninstall Plugins", function () {
    bulkOctoPrintPluginAction("uninstall");
  });
});

const blkPluginsEnableBtn = document.getElementById("blkPluginsEnableBtn");
blkPluginsEnableBtn.addEventListener("click", async (e) => {
  await PrinterSelect.create(multiPrinterSelectModal, false, "Enable Plugins", function () {
    bulkOctoPrintPluginAction("enable");
  });
});

const blkPluginsDisableBtn = document.getElementById("blkPluginsDisableBtn");
blkPluginsDisableBtn.addEventListener("click", async (e) => {
  await PrinterSelect.create(multiPrinterSelectModal, false, "Disable Plugins", function () {
    bulkOctoPrintPluginAction("disable");
  });
});

const reSyncAPIBtn = document.getElementById("reSyncAPI");
reSyncAPIBtn.addEventListener("click", async (e) => {
  bootbox.dialog({
    title: "Rescan All API endpoints",
    message:
      '<p class="alert alert-warning text-dark" role="alert">ReScan: Will rescan all endpoints, ignoring any that data already exists for.</p>' +
      '<p class="alert alert-danger text-dark" role="alert">Force ReScan: Will rescan all endpoints regardless of existing data.</p>',
    size: "large",
    buttons: {
      normal: {
        label: "ReScan",
        className: "btn-warning text-dark",
        callback: async function () {
          await reSyncAPI();
        }
      },
      force: {
        label: "Force ReScan",
        className: "btn-danger text-dark",
        callback: async function () {
          await reSyncAPI(true);
        }
      },
      cancel: {
        label: "Cancel",
        className: "btn-secondary"
      }
    }
  });
});

const reSyncSockets = document.getElementById("reSyncSockets");
reSyncSockets.addEventListener("click", async (e) => {
  bootbox.dialog({
    title: "Reconnect all sockets",
    message:
      '<p class="alert alert-warning text-dark" role="alert">Will terminate and re-open all currently established connections</p>',
    size: "large",
    buttons: {
      normal: {
        label: "Reconnect",
        className: "btn-warning text-dark",
        callback: function () {
          reSyncWebsockets();
        }
      },
      cancel: {
        label: "Cancel",
        className: "btn-secondary"
      }
    }
  });
});

const editBtn = document.getElementById("editPrinterBtn");
editBtn.addEventListener("click", async (event) => {
  await PrinterSelect.create(multiPrinterSelectModal, true, "Edit Printers", bulkEditPrinters);
});
document.getElementById("deletePrintersBtn").addEventListener("click", async (event) => {
  await PrinterSelect.create(
    multiPrinterSelectModal,
    false,
    "Printer Deletion",
    bulkDeletePrinters
  );
});

document.getElementById("exportPrinterBtn").addEventListener("click", async (event) => {
  await exportPrintersToJson();
});
document.getElementById("importPrinterBtn").addEventListener("change", async function () {
  await importPrintersFromJsonFile(this.files);
});

document.getElementById("addPrinterBtn").addEventListener("click", (event) => {
  addBlankPrinterToTable();
});

const deleteAllBtn = document.getElementById("delAllBtn");
deleteAllBtn.addEventListener("click", async (e) => {
  deleteAllOnAddPrinterTable();
});
const saveAllBtn = document.getElementById("saveAllBtn");
saveAllBtn.addEventListener("click", async (e) => {
  await saveAllOnAddPrinterTable();
});

const printerHealthCheckBtn = document.getElementById("printerHealthCheckBtn");
printerHealthCheckBtn.addEventListener("click", async (e) => {
  await loadPrinterHealthChecks();
});

const farmOverviewInformationBtn = document.getElementById("farmOverviewModalBtn");
farmOverviewInformationBtn.addEventListener("click", async (e) => {
  await loadFarmOverviewInformation();
});

const bulkConnectBtn = document.getElementById("bulkConnectBtn");
bulkConnectBtn.addEventListener("click", async (e) => {
  await PrinterSelect.create(
    multiPrintersSection,
    false,
    "Connect Printers",
    await bulkConnectPrinters
  );
});
const bulkDisconnectBtn = document.getElementById("bulkDisconnectBtn");
bulkDisconnectBtn.addEventListener("click", async (e) => {
  await PrinterSelect.create(
    multiPrintersSection,
    false,
    "Disconnect Printers",
    await bulkDisconnectPrinters
  );
});
const bulkPowerBtn = document.getElementById("bulkPowerBtn");
bulkPowerBtn.addEventListener("click", async (e) => {
  await PrinterSelect.create(
    multiPrintersSection,
    false,
    "Power On/Off Printers",
    await bulkOctoPrintPowerCommand
  );
});

createClientSSEWorker(workerURL, workerEventFunction);

setupSortablePrintersTable();

//Development Actions
const enableVirtualPrinter = document.getElementById("blkEnableVirtualPrinter");
if (enableVirtualPrinter) {
  enableVirtualPrinter.addEventListener("click", async () => {
    await bulkEnableVirtualPrinter();
  });
}
