const InfluxCleanerService = require("../services/influx-cleaner.service");

let influxCache = undefined;

function getInfluxCleanerCache() {
  if (!!influxCache) {
    return influxCache;
  } else {
    influxCache = new InfluxCleanerService();
    return influxCache;
  }
}

module.exports = {
  getInfluxCleanerCache
};
