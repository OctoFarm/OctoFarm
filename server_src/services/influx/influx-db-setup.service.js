const Influx = require("influx");
const Logger = require("../../handlers/logger.js");

/**
 * Support setup and export to influx v1.X
 */
class InfluxDbSetupService {
  #db = null;
  #settingsStore;

  #logger = new Logger("OctoFarm-Influx");

  constructor({ settingsStore }) {
    this.#settingsStore = settingsStore;
  }

  async optionalInfluxDatabaseSetup() {
    const serverSettings = await this.#settingsStore.getServerSettings();
    const influxSettings = serverSettings.influxExport;

    if (influxSettings?.active) {
      let options = {
        username: influxSettings.username,
        password: influxSettings.password,
        host: influxSettings.host,
        port: influxSettings.port,
        database: influxSettings.database
      };

      this.#db = new Influx.InfluxDB(options);
      await this.checkDatabase(options);

      this.#logger.info("Influx database enabled by settings");
    }
  }

  async checkDatabase(options) {
    const names = await this.#db.getDatabaseNames();
    if (!names.includes(options.database)) {
      this.#logger.info("Cannot find database... creating new database: " + options.database);
      await this.#db.createDatabase(options.database);
      return "database created...: " + options.database;
    } else {
      this.#logger.info("Database found! :" + options.database);
      return "database exists... skipping";
    }
  }

  async pushMeasurement(tags, measurement, dataPoints) {
    if (this.#db !== null) {
      await this.#db
        .writePoints([
          {
            measurement: measurement,
            tags: tags,
            fields: dataPoints
          }
        ])
        .catch((err) => {
          this.#logger.error(`Error saving data to InfluxDB! ${err.stack}`);
        });
    } else {
      this.#logger.error(
        `InfluxDbSetupService isn't setup with 'optionalInfluxDatabaseSetup'. Skipping 'writePoints' call.`
      );
    }
  }
}

module.exports = InfluxDbSetupService;
