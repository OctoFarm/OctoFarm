const { TaskPresets } = require("./task.presets");

const WEBSOCKET_HEARTBEAT_TASK = () => {
  // farmPrinters.forEach(function each(client) {
  //   if (
  //     typeof client.ws !== "undefined" &&
  //     typeof client.ws.isAlive !== "undefined"
  //   ) {
  //     if (
  //       client.ws.instance.readyState !== 0 &&
  //       client.ws.instance.readyState !== 2 &&
  //       client.ws.instance.readyState !== 3
  //     ) {
  //       PrinterTicker.addIssue(
  //         new Date(),
  //         farmPrinters[client.ws.index].printerURL,
  //         "Sending ping message to websocket...",
  //         "Active",
  //         farmPrinters[client.ws.index]._id
  //       );
  //       if (client.ws.isAlive === false) return client.ws.instance.terminate();
  //
  //       // Retry connecting if failed...
  //       farmPrinters[client.ws.index].webSocket = "info";
  //       farmPrinters[client.ws.index].webSocketDescription =
  //         "Checking if Websocket is still alive";
  //       client.ws.isAlive = false;
  //       client.ws.instance.ping(noop);
  //     }
  //   }
  // });
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

const STATE_TRACK_COUNTERS = async () => {
  // await Runner.trackCounters();
};

const HISTORY_CACHE_TASK = async () => {
  // Will become a cache load from service => cache directly
  // await initHistoryCache().catch((e) => {
  //   console.error("X HistoryCache failed to initiate. " + e);
  // });
};

// const FILAMENT_CLEAN_TASK = async () => {
//   await FilamentClean.start();
// };

const RESYNC_FILAMENT_ONCE = async () => {
  // Resync filament
  // FilamentClean.start(systemSettings.filamentManager);
};

// await PrinterClean.statisticsStart();
// const printerList = ['<option value="0">Not Assigned</option>'];
// farmPrinters.forEach((printer) => {
//   if (typeof printer.currentProfile !== "undefined" && printer.currentProfile !== null) {
//     for (let i = 0; i < printer.currentProfile.extruder.count; i++) {
//       let listing = null;
//       if (filamentManager) {
//         if (
//           printer.printerState.colour.category === "Offline" ||
//           printer.printerState.colour.category === "Active"
//         ) {
//           listing = `<option value="${printer._id}-${i}" disabled>${printer.printerName}: Tool ${i}</option>`;
//         } else {
//           listing = `<option value="${printer._id}-${i}">${printer.printerName}: Tool ${i}</option>`;
//         }
//       } else {
//         listing = `<option value="${printer._id}-${i}">${printer.printerName}: Tool ${i}</option>`;
//       }
//
//       printerList.push(listing);
//     }
//   }
// });

// this.#printerFilamentList = printerList;

/**
 * See an overview of this pattern/structure here https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * @param task
 * @param preset
 * @param milliseconds optional parameter to quickly set milliseconds timing
 * @param runImmediately optional paramter to make function run immediately
 * @returns {{task, id, preset}}
 */
function KsatLlorKcir(task, preset, milliseconds = 0, runImmediately) {
  let timingPreset = { ...preset };
  timingPreset.milliseconds = preset.milliseconds || milliseconds;
  timingPreset.runImmediately = runImmediately | false;
  return {
    id: task.name || task,
    task,
    preset: timingPreset
  };
}

const HOUR_MS = 3600 * 1000;

class OctoFarmTasks {
  static BOOT_TASKS = [
    KsatLlorKcir("softwareUpdateTask", TaskPresets.PERIODIC, 24 * HOUR_MS, true),
    KsatLlorKcir("printerSseTask", TaskPresets.PERIODIC, 500),
    KsatLlorKcir("dashboardSseTask", TaskPresets.PERIODIC, 5000),
    KsatLlorKcir("monitoringSseTask", TaskPresets.PERIODIC, 500),
    KsatLlorKcir("printerSystemTask", TaskPresets.PERIODIC_DISABLED, 6 * HOUR_MS, true),
    KsatLlorKcir("printerWebsocketTask", TaskPresets.PERIODIC, 5000, true),
    KsatLlorKcir("printerFilesTask", TaskPresets.RUNONCE, 15000) // We dont need more than this
    // KsatLlorKcir(DATABASE_MIGRATIONS_TASK, TaskPresets.RUNONCE),
    // KsatLlorKcir(STATE_SETUP_WEBSOCKETS, TaskPresets.RUNDELAYED, 5000),
    // KsatLlorKcir(STATE_PRINTER_GENERATE_TASK, TaskPresets.RUNDELAYED, 10000)
    // KsatLlorKcir(STATE_PRINTER_GENERATE_TASK, TaskPresets.PERIODIC, 20000),
    // KsatLlorKcir(HISTORY_CACHE_TASK, TaskPresets.RUNONCE),
    // KsatLlorKcir(FILAMENT_CLEAN_TASK, TaskPresets.RUNONCE),
    // KsatLlorKcir(GITHUB_UPDATE_CHECK_TASK, TaskPresets.RUNDELAYED, 1000),
    // KsatLlorKcir(STATE_TRACK_COUNTERS, TaskPresets.PERIODIC, 30000)
  ];
}

module.exports = {
  OctoFarmTasks
};
