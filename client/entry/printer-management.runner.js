import { createClientSSEWorker } from '../js/services/client-worker.service';
import PrinterSelectionService from '../js/pages/printer-manager/services/printer-selection.service';
import {
  bulkConnectPrinters,
  bulkDisablePrinters,
  bulkDisconnectPrinters,
  bulkEnablePrinters,
  bulkEnableVirtualPrinter,
  bulkOctoPrintClientUpdate,
  bulkOctoPrintPluginAction,
  bulkOctoPrintPluginUpdate,
  bulkOctoPrintPowerCommand,
  bulkUpdateOctoPrintSettings,
} from '../js/pages/printer-manager/functions/bulk-commands-functions';
import {
  addBlankPrinterToTable,
  bulkDeletePrinters,
  bulkEditPrinters,
  deleteAllOnAddPrinterTable,
  exportPrintersToJson,
  importPrintersFromJsonFile,
  loadConnectionOverViewInformation,
  loadFarmOverviewInformation,
  loadPrinterHealthChecks,
  reSyncAPI,
  reSyncWebsockets,
  saveAllOnAddPrinterTable,
  scanNetworkForDevices,
  workerEventFunction,
} from '../js/pages/printer-manager/functions/printer-manager.functions';

import { setupSortablePrintersTable } from '../js/pages/printer-manager/functions/sortable-table';

const workerURL = '/printersInfo/get/';

const multiPrinterSelectModal = document.getElementById('multiPrintersSection');

// Bulk OctoPrint Command Listeners
const bulkPluginUpdateButton = document.getElementById('blkUpdatePluginsBtn');
// bulkPluginUpdateButton.addEventListener('click', async () => {
//   await bulkOctoPrintPluginUpdate();
// });

const bulkOctoPrintUpdateButton = document.getElementById('blkOctoPrintUpdate');
// bulkOctoPrintUpdateButton.addEventListener('click', async () => {
//   await bulkOctoPrintClientUpdate();
// });

const bulkDisablePrintersButton = document.getElementById('disablePrintersBtn');
// bulkDisablePrintersButton.addEventListener('click', async () => {
//   await PrinterSelectionService.create(
//     multiPrinterSelectModal,
//     false,
//     'Disable Printers',
//     function () {
//       bulkDisablePrinters();
//     }
//   );
// });
// const bulkEnablePrintersButton = document.getElementById('enablePrintersBtn');
// bulkEnablePrintersButton.addEventListener('click', async () => {
//   await PrinterSelectionService.create(
//     multiPrinterSelectModal,
//     false,
//     'Enable Printers',
//     function () {
//       bulkEnablePrinters(true);
//     }
//   );
// });
//
// const scanNetworkBtn = document.getElementById('scanNetworkBtn');
// scanNetworkBtn.addEventListener('click', async (e) => {
//   await scanNetworkForDevices(e);
// });
//
// const blkPluginsBtn = document.getElementById('blkPluginsInstallBtn');
// blkPluginsBtn.addEventListener('click', async () => {
//   await PrinterSelectionService.create(
//     multiPrinterSelectModal,
//     false,
//     'Install Plugins',
//     function () {
//       bulkOctoPrintPluginAction('install');
//     }
//   );
// });
//
// const blkPluginsUninstallBtn = document.getElementById('blkPluginsUnInstallBtn');
// blkPluginsUninstallBtn.addEventListener('click', async () => {
//   await PrinterSelectionService.create(
//     multiPrinterSelectModal,
//     false,
//     'Uninstall Plugins',
//     function () {
//       bulkOctoPrintPluginAction('uninstall');
//     }
//   );
// });
//
// const blkPluginsEnableBtn = document.getElementById('blkPluginsEnableBtn');
// blkPluginsEnableBtn.addEventListener('click', async () => {
//   await PrinterSelectionService.create(
//     multiPrinterSelectModal,
//     false,
//     'Enable Plugins',
//     function () {
//       bulkOctoPrintPluginAction('enable');
//     }
//   );
// });
//
// const blkPluginsDisableBtn = document.getElementById('blkPluginsDisableBtn');
// blkPluginsDisableBtn.addEventListener('click', async () => {
//   await PrinterSelectionService.create(
//     multiPrinterSelectModal,
//     false,
//     'Disable Plugins',
//     function () {
//       bulkOctoPrintPluginAction('disable');
//     }
//   );
// });

// const blkOctoPrintSettingsUpdateBtn = document.getElementById('blkOctoPrintSettingsUpdateBtn');
// blkOctoPrintSettingsUpdateBtn.addEventListener('click', async () => {
//   await PrinterSelectionService.create(
//     multiPrinterSelectModal,
//     false,
//     'Bulk Edit OctoPrint Settings',
//     function () {
//       bulkUpdateOctoPrintSettings();
//     }
//   );
// });

// const reSyncSockets = document.getElementById('reSyncSockets');
// reSyncSockets.addEventListener('click', async () => {
//   bootbox.dialog({
//     title: 'Reconnect all sockets',
//     message:
//       '<p class="alert alert-warning text-dark" role="alert">Will terminate and re-open all currently established connections</p>',
//     size: 'large',
//     buttons: {
//       normal: {
//         label: 'Reconnect',
//         className: 'btn-warning text-dark',
//         callback: function () {
//           reSyncWebsockets();
//         },
//       },
//       cancel: {
//         label: 'Cancel',
//         className: 'btn-secondary',
//       },
//     },
//   });
// });
//
// const editBtn = document.getElementById('editPrinterBtn');
// editBtn.addEventListener('click', async () => {
//   await PrinterSelectionService.create(
//     multiPrinterSelectModal,
//     true,
//     'Edit Printers',
//     bulkEditPrinters
//   );
// });
// document.getElementById('deletePrintersBtn').addEventListener('click', async () => {
//   await PrinterSelectionService.create(
//     multiPrinterSelectModal,
//     false,
//     'Printer Deletion',
//     bulkDeletePrinters
//   );
// });
//
// document.getElementById('exportPrinterBtn').addEventListener('click', async () => {
//   await exportPrintersToJson();
// });
// document.getElementById('importPrinterBtn').addEventListener('change', async function () {
//   await importPrintersFromJsonFile(this.files);
// });
//
// document.getElementById('addPrinterBtn').addEventListener('click', () => {
//   addBlankPrinterToTable();
// });
//
// const deleteAllBtn = document.getElementById('delAllBtn');
// deleteAllBtn.addEventListener('click', async () => {
//   deleteAllOnAddPrinterTable();
// });
// const saveAllBtn = document.getElementById('saveAllBtn');
// saveAllBtn.addEventListener('click', async () => {
//   await saveAllOnAddPrinterTable();
// });

// const printerHealthCheckBtn = document.getElementById('printerHealthCheckBtn');
// printerHealthCheckBtn.addEventListener('click', async () => {
//   await loadPrinterHealthChecks();
// });
//
// const farmOverviewInformationBtn = document.getElementById('farmOverviewModalBtn');
// farmOverviewInformationBtn.addEventListener('click', async () => {
//   await loadFarmOverviewInformation();
// });

// const connectionOverviewInformationBtn = document.getElementById('connectionsOverviewModalBtn');
// connectionOverviewInformationBtn.addEventListener('click', async () => {
//   await loadConnectionOverViewInformation();
// });

// const bulkConnectBtn = document.getElementById('bulkConnectBtn');
// bulkConnectBtn.addEventListener('click', async () => {
//   await PrinterSelectionService.create(
//     multiPrinterSelectModal,
//     false,
//     'Connect Printers',
//     await bulkConnectPrinters
//   );
// });
// const bulkDisconnectBtn = document.getElementById('bulkDisconnectBtn');
// bulkDisconnectBtn.addEventListener('click', async () => {
//   await PrinterSelectionService.create(
//     multiPrinterSelectModal,
//     false,
//     'Disconnect Printers',
//     await bulkDisconnectPrinters
//   );
// });
// const bulkPowerBtn = document.getElementById('bulkPowerBtn');
// bulkPowerBtn.addEventListener('click', async () => {
//   await PrinterSelectionService.create(
//     multiPrinterSelectModal,
//     false,
//     'Power On/Off Printers',
//     await bulkOctoPrintPowerCommand
//   );
// });

// createClientSSEWorker(workerURL, workerEventFunction);
//
// setupSortablePrintersTable();

//Development Actions
// const enableVirtualPrinter = document.getElementById('blkEnableVirtualPrinter');
// if (enableVirtualPrinter) {
//   enableVirtualPrinter.addEventListener('click', async () => {
//     await bulkEnableVirtualPrinter();
//   });
// }

(async function(){
  const listItems = [
    {
      id: "pm-printer-manager",
      name: "Printer Manager",
      notification: "pm-printer-manager-notification",
    },
    {
      id: "pm-octoprint-manager",
      name: "OctoPrint Manager",
      notification: "pm-octoprint-manager-notification",
    },
    {
      id: "pm-connection-overview",
      name: "Connections Overview",
      notification: "pm-connection-overview-notification",
      loadAction: async () => {
        await loadConnectionOverViewInformation();
      }
    },
    {
      id: "pm-printer-overview",
      name: "Printer Overview",
      notification: "pm-printer-overview-notification",
      loadAction: async () => {
        await loadFarmOverviewInformation();
      }
    },
    {
      id: "pm-health-overview",
      name: "Health Checks",
      notification: "pm-health-overview-notification",
      loadAction: async () => {
        await loadPrinterHealthChecks();
      }
    },
    {
      id: "pm-developers-menu",
      name: "Developers Menu",
      notification: "pm-developers-menu-notification",
    }
  ]
  for( const item of listItems){
    if(!!item?.loadAction){
      document.getElementById(item.id+"-list").addEventListener("click", async () => {
        return item.loadAction();
      })

    }

  }
})();



// Setup connection log

// Setup Action log

// Add menu listeners

// Printer Manager

// OctoPrint Manager

// Connections Overview

// Printer Overview

// Health Checks

// Developers Menu
