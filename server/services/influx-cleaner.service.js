const { writePoints } = require("./influx-export.service");
const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const Logger = require("../handlers/logger");
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");
const logger = new Logger(LOGGER_ROUTE_KEYS.SERVICE_INFLUX_CLEANER);
const { getHistoryCache } = require("../cache/history.cache");
const { SettingsClean } = require("./settings-cleaner.service.js");

class InfluxCleanerService {
  #printersInformationTimer;
  #livePrinterDataMeasurementKey = "LivePrinterData";
  #finishedPrintDataMeasurementKey = "FinishedPrintData";
  #materialsInformationMeasurementKey = "MaterialsData";

  constructor() {
    this.#printersInformationTimer = 0;
  }

  checkKlipperState = () => {
    let serverSettings = SettingsClean.returnSystemSettings();
    return serverSettings?.influxExport.active;
  }

  cleanAndWritePrintersInformationForInflux = () => {
    if (this.#printersInformationTimer < 5000) {
      this.#printersInformationTimer = this.#printersInformationTimer + 1000; // data rate of sse socket
      return;
    }

    if(!this.checkKlipperState()){
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
          for (const [index, spool] of printer.selectedFilament.entries()) {
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
  cleanAndWriteFinishedPrintInformationForInflux = (currentHistory, printerInformation) => {

    if(!this.checkKlipperState()){
      return;
    }

    const historyRecord = getHistoryCache().generateDataSummary([currentHistory])[0];
    let currentState = " ";
    if (historyRecord.state.includes("Success")) {
      currentState = "Success";
    } else if (historyRecord.state.includes("Cancelled")) {
      currentState = "Cancelled";
    } else if (historyRecord.state.includes("Failure")) {
      currentState = "Failure";
    }
    const tags = {
      printer_name: printerInformation?.printerName ? printerInformation?.printerName : " ",
      group: printerInformation?.printerGroup ? printerInformation?.printerGroup : " ",
      history_state: currentState,
      file_name: historyRecord?.file?.name ? historyRecord.file.name : " "
    };

    let printerData = {
      id: historyRecord._id.toString(),
      state: currentState,
      printer_name: printerInformation?.printerName ? printerInformation?.printerName : " ",
      start_date: historyRecord?.startDate ? new Date(historyRecord.startDate).getTime() : 0,
      end_date: historyRecord?.endDate ? new Date(historyRecord.endDate).getTime() : 0,
      print_time: historyRecord?.printTime ? parseInt(historyRecord.printTime) : 0,
      file_name: historyRecord?.file?.name ? historyRecord.file.name : " ",
      file_upload_date: historyRecord?.file?.uploadDate
        ? parseFloat(historyRecord.file.uploadDate)
        : 0,
      file_path: historyRecord?.file?.path ? historyRecord.file.path : " ",
      file_size: historyRecord?.file?.size ? parseFloat(historyRecord.file.size) : 0,
      job_estimated_print_time: historyRecord?.job?.estimatedPrintTime
        ? parseFloat(historyRecord.job.estimatedPrintTime)
        : 0,
      job_actual_print_time: historyRecord?.job?.actualPrintTime
        ? parseFloat(historyRecord.job.actualPrintTime)
        : 0,
      cost_printer: historyRecord?.printerCost ? parseFloat(historyRecord.printerCost) : 0,
      cost_spool: historyRecord?.spoolCost ? parseFloat(historyRecord.spoolCost) : 0,
      cost_total: historyRecord?.totalCost ? parseFloat(historyRecord.totalCost) : 0,
      cost_maintenance: historyRecord?.maintenanceCosts
        ? parseFloat(historyRecord?.maintenanceCosts)
        : 0,
      cost_electricity: historyRecord?.electricityCosts
        ? parseFloat(historyRecord.electricityCosts)
        : 0,
      total_volume: historyRecord?.totalVolume ? parseFloat(historyRecord.totalVolume) : 0,
      total_length: historyRecord?.totalLength ? parseFloat(historyRecord.totalLength) : 0,
      total_weight: historyRecord?.totalWeight ? parseFloat(historyRecord.totalWeight) : 0
    };
    let averagePrintTime = parseFloat(historyRecord?.file?.averagePrintTime);
    if (!isNaN(averagePrintTime)) {
      printerData["file_average_print_time"] = averagePrintTime;
    }
    let lastPrintTime = parseFloat(historyRecord.file.lastPrintTime);
    if (!isNaN(averagePrintTime)) {
      printerData["file_last_print_time"] = lastPrintTime;
    }
    if (!!historyRecord?.resends) {
      printerData["job_resends_transmitted"] = parseFloat(historyRecord.resends.transmitted);
      printerData["job_resends_count"] = parseFloat(historyRecord.resends.count);
      printerData["job_resends_ratio"] = parseFloat(historyRecord.resends.ratio);
    }
    writePoints(tags, this.#finishedPrintDataMeasurementKey, printerData);
    logger.debug("Logged data to influx database", printerData, tags);
  };
  cleanAndWriteMaterialsInformationForInflux = (
    filament,
    printerInformation,
    historyRecord,
    used
  ) => {

    if(!this.checkKlipperState()){
      return;
    }

    if (!!filament) {
      let currentState = " ";
      if (historyRecord.success) {
        currentState = "Success";
      } else {
        if (historyRecord.reason === "cancelled") {
          currentState = "Cancelled";
        } else {
          currentState = "Failure";
        }
      }
      const tags = {
        spool_name: filament.spools.name,
        printer_name: printerInformation?.printerName ? printerInformation?.printerName : " ",
        group: printerInformation?.printerGroup ? printerInformation?.printerGroup : " ",
        file_name: historyRecord?.fileName ? historyRecord.fileName : "",
        print_state: currentState
      };
      let filamentData = {
        name: filament.spools.name,
        price: parseFloat(filament.spools.price),
        weight: parseFloat(filament.spools.weight),
        removed: used ? parseFloat(used) : 0,
        used_spool: parseFloat(filament.spools.used),
        temp_offset: parseFloat(filament.spools.tempOffset),
        spool_manufacturer: filament.spools.profile.manufacturer,
        spool_material: filament.spools.profile.material,
        spool_density: parseFloat(filament.spools.profile.density),
        spool_diameter: parseFloat(filament.spools.profile.diameter)
      };
      writePoints(tags, this.#materialsInformationMeasurementKey, filamentData);

      logger.debug("Logged data to influx database", filamentData, tags);
    }
  };
}

module.exports = InfluxCleanerService;
