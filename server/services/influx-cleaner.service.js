const { writePoints } = require("./influx-export.service");
const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const Logger = require("../handlers/logger");
const logger = new Logger("OctoFarm-Influx-Export");

class InfluxCleanerService {
  #printersInformationTimer;
  #livePrinterDataMeasurementKey = "LivePrinterData";

  constructor() {
    this.#printersInformationTimer = 0;
  }

  cleanAndWritePrintersInformationForInflux = () => {
    if (this.#printersInformationTimer < 5000) {
      this.#printersInformationTimer = this.#printersInformationTimer + 1000; // data rate of sse socket
      return;
    }

    const printersInformation = getPrinterStoreCache().listPrintersInformation();

    for (const printer of printersInformation) {
      const date = Date.now();
      if (printer.printerState.colour.category !== "Offline") {
        const tags = {
          name: printer?.printerName ? printer.printerName : " ",
          group: printer?.group ? printer.group : " ",
          url: printer?.printerURL ? printer.printerURL : " ",
          state: printer?.printerState?.state ? printer.printerState.state : " ",
          stateCategory: printer?.printerState?.colour?.category
            ? printer.printerState?.colour?.category
            : " ",
          host_state: printer?.hostState?.state ? printer.hostState?.state : " ",
          websocket_state: printer?.webSocketState?.colour ? printer.webSocketState?.colour : " ",
          octoprint_version: printer?.octoPrintVersion ? printer.octoPrintVersion : " "
        };
        const printerData = {
          name: printer?.printerName ? printer.printerName : " ",
          group: printer?.group ? printer.group : " ",
          url: printer?.printerURL ? printer.printerURL : " ",
          state: printer?.printerState?.state ? printer.printerState.state : " ",
          host_state: printer?.hostState?.state ? printer.hostState.state : " ",
          websocket_state: printer?.webSocketState?.colour ? printer.webSocketState.colour : " ",
          octoprint_version: printer?.octoPrintVersion ? printer.octoPrintVersion : " ",
          state_category: printer?.printerState?.colour?.category
            ? printer.printerState.colour.category
            : " ",
          current_idle_time: printer.currentIdle ? parseFloat(printer.currentIdle) : 0,
          current_active_time: printer.currentActive ? parseFloat(printer.currentActive) : 0,
          current_offline_time: printer.currentOffline ? parseFloat(printer.currentOffline) : 0,
          storage_free: printer?.storage?.free ? parseFloat(printer.storage.free) : 0,
          storage_total: printer?.storage?.total ? parseFloat(printer.storage.total) : 0,
          timestamp: date
        };
        if (!!printer?.resends) {
          printerData["job_resends_transmitted"] = parseFloat(printer.resends.transmitted);
          printerData["job_resends_count"] = parseFloat(printer.resends.count);
          printerData["job_resends_ratio"] = parseFloat(printer.resends.ratio);
        }

        if (!!printer?.currentJob) {
          for (const key in printer.currentJob) {
            if (printer.currentJob.hasOwnProperty(key)) {
              if (key === "progress" && printer.currentJob[key] !== null) {
                printerData["job_progress"] = parseFloat(printer.currentJob[key]);
              }
              if (key === "fileName" && printer.currentJob[key] !== null) {
                printerData["job_file_name"] = printer.currentJob[key];
              }
              if (key === "fileDisplay" && printer.currentJob[key] !== null) {
                printerData["job_file_display"] = printer.currentJob[key].replace(/_/g, " ");
              }
              if (key === "filePath" && printer.currentJob[key] !== null) {
                printerData["job_file_path"] = printer.currentJob[key];
              }
              if (key === "expectedPrintTime" && printer.currentJob[key] !== null) {
                printerData["job_expected_print_time"] = parseFloat(printer.currentJob[key]);
              }
              if (key === "expectedPrinterCosts" && printer.currentJob[key] !== null) {
                printerData["job_expected_print_cost"] = parseFloat(printer.currentJob[key]);
              }
              if (key === "expectedMaintenanceCosts" && printer.currentJob[key] !== null) {
                printerData["job_expected_maintenance_cost"] = parseFloat(printer.currentJob[key]);
              }
              if (key === "expectedElectricityCosts" && printer.currentJob[key] !== null) {
                printerData["job_expected_electricity_cost"] = parseFloat(printer.currentJob[key]);
              }
              if (key === "expectedTotals" && printer.currentJob[key] !== null) {
                printerData["job_expected_total_cost"] = parseFloat(
                  printer.currentJob[key].totalCost
                );
                printerData["job_expected_total_volume"] = parseFloat(
                  printer.currentJob[key].totalVolume
                );
                printerData["job_expected_total_length"] = parseFloat(
                  printer.currentJob[key].totalLength
                );
                printerData["job_expected_total_weight"] = parseFloat(
                  printer.currentJob[key].totalWeight
                );
                printerData["job_expected_total_spool_cost"] = parseFloat(
                  printer.currentJob[key].spoolCost
                );
              }
              if (key === "currentZ" && printer.currentJob[key] !== null) {
                printerData["job_current_z"] = parseFloat(printer.currentJob[key]);
              }
              if (key === "printTimeElapsed" && printer.currentJob[key] !== null) {
                printerData["job_print_time_elapsed"] = parseFloat(printer.currentJob[key]);
              }
              if (key === "printTimeRemaining" && printer.currentJob[key] !== null) {
                printerData["job_print_time_remaining"] = parseFloat(printer.currentJob[key]);
              }
              if (key === "averagePrintTime" && printer.currentJob[key] !== null) {
                printerData["job_average_print_time"] = parseFloat(printer.currentJob[key]);
              }
              if (key === "lastPrintTime" && printer.currentJob[key] !== null) {
                printerData["job_last_print_time"] = parseFloat(printer.currentJob[key]);
              }
              if (key === "thumbnail" && printer.currentJob[key] !== null) {
                printerData["job_thumbnail"] = printer.printerURL + "/" + printer.currentJob[key];
              }
            }
          }
        }

        if (printer.selectedFilament.length >= 1) {
          for (const spool of printer.selectedFilament) {
            if (spool !== null) {
              printerData[`tool_${index}_spool_name`] = spool.spools.name;
              printerData[`tool_${index}_spool_used`] = parseFloat(spool.spools.used);
              printerData[`tool_${index}_spool_weight`] = parseFloat(spool.spools.weight);
              printerData[`tool_${index}_spool_temp_offset`] = parseFloat(spool.spools.tempOffset);
              if (typeof spool.spools.material !== "undefined") {
                printerData[`tool_${index}_spool_material`] = spool.spools.material;
              }
            }
          }
        }

        if (!!printer.tools && printer.tools[0] !== null) {
          for (const key in printer.tools[0]) {
            if (printer.tools[0].hasOwnProperty(key)) {
              if (key !== "time") {
                if (printer.tools[0][key].actual !== null) {
                  printerData[key + "_actual"] = parseFloat(printer.tools[0][key].actual);
                } else {
                  printerData[key + "_actual"] = 0;
                }
                if (printer.tools[0][key].target !== null) {
                  printerData[key + "_target"] = parseFloat(printer.tools[0][key].target);
                } else {
                  printerData[key + "_target"] = 0;
                }
              }
            }
          }
        }
        writePoints(tags, this.#livePrinterDataMeasurementKey, printerData);
        logger.debug("Logged data to influx database", printerData);
      }
    }

    if (this.#printersInformationTimer >= 5000) {
      this.#printersInformationTimer = 0; // Reset timer to 0
    }
  };
}

module.exports = InfluxCleanerService;
