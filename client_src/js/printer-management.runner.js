import { createClientSSEWorker } from "./services/client-worker.service";
import PrinterSelect from "./lib/modules/printerSelect";
import {
  bulkOctoPrintClientUpdate,
  bulkOctoPrintPluginUpdate,
  bulkOctoPrintPluginAction
} from "./printer-manager/functions/bulk-commands-functions";
import {
  addBlankPrinterToTable,
  bulkDeletePrinters,
  bulkEditPrinters,
  deleteAllOnAddPrinterTable,
  exportPrintersToJson,
  importPrintersFromJsonFile,
  reSyncPrinters,
  saveAllOnAddPrinterTable,
  scanNetworkForDevices,
  workerEventFunction
} from "./printer-manager/functions/printer-manager.functions";

import { setupSortablePrintersTable } from "./printer-manager/functions/sortable-table";

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
  PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    false,
    "Install Plugins",
    function () {
      bulkOctoPrintPluginAction("install");
    }
  );
});

const blkPluginsUninstallBtn = document.getElementById("blkPluginsUnInstallBtn");
blkPluginsUninstallBtn.addEventListener("click", async (e) => {
  PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    false,
    "Uninstall Plugins",
    function () {
      bulkOctoPrintPluginAction("uninstall");
    }
  );
});

const blkPluginsEnableBtn = document.getElementById("blkPluginsEnableBtn");
blkPluginsEnableBtn.addEventListener("click", async (e) => {
  PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    false,
    "Enable Plugins",
    function () {
      bulkOctoPrintPluginAction("enable");
    }
  );
});

const blkPluginsDisableBtn = document.getElementById("blkPluginsDisableBtn");
blkPluginsDisableBtn.addEventListener("click", async (e) => {
  PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    false,
    "Disable Plugins",
    function () {
      bulkOctoPrintPluginAction("disable");
    }
  );
});

const searchOffline = document.getElementById("searchOfflineBtn");
searchOffline.addEventListener("click", async (e) => {
  await reSyncPrinters();
});
const editBtn = document.getElementById("editPrinterBtn");
editBtn.addEventListener("click", (event) => {
  PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    true,
    "Edit Printers",
    bulkEditPrinters
  );
});
document.getElementById("deletePrintersBtn").addEventListener("click", (event) => {
  PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
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

createClientSSEWorker(workerURL, workerEventFunction);

setupSortablePrintersTable();
