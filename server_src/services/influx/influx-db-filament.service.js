const MEASUREMENT_NAME = "SpoolInformation";

class InfluxDbFilamentService {
  #influxDbSetupService;

  constructor({ influxDbSetupService }) {
    this.#influxDbSetupService = influxDbSetupService;
  }

  async updateFilamentInfluxDB(selectedFilament, history, previousFilament, printer) {
    for (let i = 0; i < selectedFilament.length; i++) {
      if (selectedFilament[i] !== null) {
        let currentState = " ";
        let group = " ";
        if (printer.group === "") {
          group = " ";
        } else {
          group = printer.group;
        }
        if (history.success) {
          currentState = "Success";
        } else {
          if (history.reason === "cancelled") {
            currentState = "Cancelled";
          } else {
            currentState = "Failure";
          }
        }

        const tags = {
          name: selectedFilament[i].spools.name,
          printer_name: history.printerName,
          group: group,
          url: printer.printerURL,
          history_state: currentState,
          file_name: history.fileName
        };

        let used = 0;
        if (typeof previousFilament !== "undefined" && previousFilament !== null) {
          used = Math.abs(selectedFilament[i].spools.used - previousFilament[i].spools.used);
        }

        let filamentData = {
          name: selectedFilament[i].spools.name,
          price: parseFloat(selectedFilament[i].spools.price),
          weight: parseFloat(selectedFilament[i].spools.weight),
          used_difference: parseFloat(used),
          used_spool: parseFloat(selectedFilament[i].spools.used),
          temp_offset: parseFloat(selectedFilament[i].spools.tempOffset),
          spool_manufacturer: selectedFilament[i].spools.profile.manufacturer,
          spool_material: selectedFilament[i].spools.profile.material,
          spool_density: parseFloat(selectedFilament[i].spools.profile.density),
          spool_diameter: parseFloat(selectedFilament[i].spools.profile.diameter)
        };

        await this.#influxDbSetupService.pushMeasurement(tags, MEASUREMENT_NAME, filamentData);
      }
    }
  }
}

module.exports = InfluxDbFilamentService;
