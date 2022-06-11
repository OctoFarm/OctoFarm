const FarmStatisticsService = require("./farm-statistics.service");
const { getDayName } = require("../utils/time.util");
const { getEmptyHeatmap } = require("../constants/cleaner.constants");
const Logger = require("../handlers/logger");
const arrayTotal = [];
let heatMap = getEmptyHeatmap();
let farmStats = null;
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");
const logger = new Logger(LOGGER_ROUTE_KEYS.SERVICE_FARM_INFORMATION);
/**
 *
 * @param complete
 * @param active
 * @param offline
 * @param idle
 * @param disconnected
 * @returns {Promise<void>}
 */
const heatMapping = async (complete, active, offline, idle, disconnected) => {
  try {
    const today = getDayName();
    const CompleteCount = {
      x: today,
      y: 0,
      figure: 0
    };
    const ActiveCount = {
      x: today,
      y: 0,
      figure: 0
    };

    const IdleCount = {
      x: today,
      y: 0,
      figure: 0
    };
    const OfflineCount = {
      x: today,
      y: 0,
      figure: 0
    };
    const DisconnectedCount = {
      x: today,
      y: 0,
      figure: 0
    };

    if (heatMap[0].data.length === 0) {
      // Created initial data set
      heatMap[0].data.push(CompleteCount);
      heatMap[1].data.push(ActiveCount);
      heatMap[2].data.push(IdleCount);
      heatMap[3].data.push(OfflineCount);
      heatMap[4].data.push(DisconnectedCount);
    } else {
      // Cycle through current data and check if day exists...

      const currentTotal = arrayTotal.reduce((a, b) => a + b, 0);
      for (let i = 0; i < heatMap.length; i++) {
        const lastInArray = heatMap[i].data.length - 1;
        // If x = today add that fucker up!
        if (heatMap[i].data[lastInArray].x === today) {
          if (heatMap[i].name === "Completed") {
            heatMap[i].data[lastInArray].y = (
              (heatMap[i].data[lastInArray].figure / currentTotal) *
              100
            ).toFixed(3);

            if (!isFinite(heatMap[i].data[lastInArray].y)) {
              heatMap[i].data[lastInArray].y = 0;
            }
            heatMap[i].data[lastInArray].figure = heatMap[i].data[lastInArray].figure + complete;
            arrayTotal[0] = heatMap[i].data[lastInArray].figure;
          }
          if (heatMap[i].name === "Active") {
            heatMap[i].data[lastInArray].y = (
              (heatMap[i].data[lastInArray].figure / currentTotal) *
              100
            ).toFixed(3);

            if (!isFinite(heatMap[i].data[lastInArray].y)) {
              heatMap[i].data[lastInArray].y = 0;
            }
            heatMap[i].data[lastInArray].figure = heatMap[i].data[lastInArray].figure + active;
            arrayTotal[1] = heatMap[i].data[lastInArray].figure;
          }
          if (heatMap[i].name === "Offline") {
            heatMap[i].data[lastInArray].y = (
              (heatMap[i].data[lastInArray].figure / currentTotal) *
              100
            ).toFixed(3);

            if (!isFinite(heatMap[i].data[lastInArray].y)) {
              heatMap[i].data[lastInArray].y = 0;
            }
            heatMap[i].data[lastInArray].figure = heatMap[i].data[lastInArray].figure + offline;
            arrayTotal[2] = heatMap[i].data[lastInArray].figure;
          }
          if (heatMap[i].name === "Idle") {
            heatMap[i].data[lastInArray].y = (
              (heatMap[i].data[lastInArray].figure / currentTotal) *
              100
            ).toFixed(3);
            if (!isFinite(heatMap[i].data[lastInArray].y)) {
              heatMap[i].data[lastInArray].y = 0;
            }
            heatMap[i].data[lastInArray].figure = heatMap[i].data[lastInArray].figure + idle;
            arrayTotal[3] = heatMap[i].data[lastInArray].figure;
          }
          if (heatMap[i].name === "Disconnected") {
            heatMap[i].data[lastInArray].y = (
              (heatMap[i].data[lastInArray].figure / currentTotal) *
              100
            ).toFixed(3);
            if (!isFinite(heatMap[i].data[lastInArray].y)) {
              heatMap[i].data[lastInArray].y = 0;
            }
            heatMap[i].data[lastInArray].figure =
              heatMap[i].data[lastInArray].figure + disconnected;
            arrayTotal[4] = heatMap[i].data[lastInArray].figure;
          }
        } else {
          // Must be a new day, so shift with new heatMap
          heatMap[0].data.push(CompleteCount);
          heatMap[1].data.push(ActiveCount);
          heatMap[2].data.push(IdleCount);
          heatMap[3].data.push(OfflineCount);
          heatMap[4].data.push(DisconnectedCount);
        }
      }
    }
    // Clean up old days....
    if (heatMap[0].data.length === 8) {
      heatMap[0].data.shift();
      heatMap[1].data.shift();
      heatMap[2].data.shift();
      heatMap[3].data.shift();
      heatMap[4].data.shift();
    }

    farmStats[0].heatMap = heatMap;
    farmStats[0].markModified("heatMap");
    farmStats[0].save().catch((e) => logger.error(e));
  } catch (e) {
    logger.error("HEAT MAP ISSUE", e.message);
  }
};

const initFarmInformation = async () => {
  farmStats = await FarmStatisticsService.list({});
  if (!farmStats || farmStats.length < 1) {
    const farmStart = new Date();
    farmStats[0] = await FarmStatisticsService.create(farmStart, heatMap);
  } else if (typeof farmStats[0].heatMap === "undefined") {
    farmStats[0].heatMap = heatMap;
    farmStats[0].markModified("heatMap");
    await farmStats[0].save();
  } else {
    heatMap = farmStats[0].heatMap;
  }

  return "Farm information inititialised...";
};

const getHeatMap = () => {
  return heatMap;
};

const getFarmStats = () => {
  return farmStats;
};

module.exports = {
  heatMapping,
  initFarmInformation,
  getHeatMap,
  getFarmStats
};
