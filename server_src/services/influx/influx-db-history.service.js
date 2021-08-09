const MEASUREMENT_NAME = "HistoryInformation";

class InfluxDbHistoryService {
  #influxDbSetupService;
  constructor({ influxDbSetupService }) {
    this.#influxDbSetupService = influxDbSetupService;
  }

  async updateInfluxDB(historyID, measurement, printer) {
    let historyArchive = getHistoryCache().historyClean;
    let currentArchive = _.findIndex(historyArchive, function (o) {
      return JSON.stringify(o._id) === JSON.stringify(historyID);
    });
    if (currentArchive > -1) {
      let workingHistory = historyArchive[currentArchive];
      let startDateSplit = workingHistory.startDate.split(" ");
      let endDateSplit = workingHistory.endDate.split(" ");
      const trueStartDate = Date.parse(
        `${startDateSplit[2]} ${startDateSplit[1]} ${startDateSplit[3]} ${startDateSplit[5]}`
      );
      const trueEndDate = Date.parse(
        `${endDateSplit[2]} ${endDateSplit[1]} ${endDateSplit[3]} ${endDateSplit[5]}`
      );
      let currentState = " ";
      if (workingHistory.state.includes("Success")) {
        currentState = "Success";
      } else if (workingHistory.state.includes("Cancelled")) {
        currentState = "Cancelled";
      } else if (workingHistory.state.includes("Failure")) {
        currentState = "Failure";
      }
      let group = " ";
      if (printer.group === "") {
        group = " ";
      } else {
        group = printer.group;
      }
      const tags = {
        printer_name: workingHistory.printer,
        group: group,
        url: printer.printerURL,
        history_state: currentState,
        file_name: workingHistory.file.name
      };
      let printerData = {
        id: String(workingHistory._id),
        index: parseInt(workingHistory.index),
        state: currentState,
        printer_name: workingHistory.printer,
        start_date: trueStartDate,
        end_date: trueEndDate,
        print_time: parseInt(workingHistory.printTime),
        file_name: workingHistory.file.name,
        file_upload_date: parseFloat(workingHistory.file.uploadDate),
        file_path: workingHistory.file.path,
        file_size: parseInt(workingHistory.file.size),

        notes: workingHistory.notes,
        job_estimated_print_time: parseFloat(workingHistory.job.estimatedPrintTime),
        job_actual_print_time: parseFloat(workingHistory.job.actualPrintTime),

        cost_printer: parseFloat(workingHistory.printerCost),
        cost_spool: parseFloat(workingHistory.spoolCost),
        cost_total: parseFloat(workingHistory.totalCost),
        cost_per_hour: parseFloat(workingHistory.costPerHour),
        total_volume: parseFloat(workingHistory.totalVolume),
        total_length: parseFloat(workingHistory.totalLength),
        total_weight: parseFloat(workingHistory.totalWeight)
      };
      let averagePrintTime = parseFloat(workingHistory.file.averagePrintTime);
      if (!isNaN(averagePrintTime)) {
        printerData["file_average_print_time"] = averagePrintTime;
      }
      let lastPrintTime = parseFloat(workingHistory.file.lastPrintTime);
      if (!isNaN(averagePrintTime)) {
        printerData["file_last_print_time"] = lastPrintTime;
      }

      if (typeof workingHistory.resend !== "undefined") {
        printerData["job_resends"] = `${workingHistory.resend.count} / ${
          workingHistory.resend.transmitted / 1000
        }K (${workingHistory.resend.ratio.toFixed(0)})`;
      }

      await this.#influxDbSetupService.pushMeasurement(tags, MEASUREMENT_NAME, printerData);
    }
  }
}

module.exports = InfluxDbHistoryService;
