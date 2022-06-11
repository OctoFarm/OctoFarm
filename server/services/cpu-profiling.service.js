const os = require("os");
const Logger = require("../handlers/logger");
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");
const logger = new Logger(LOGGER_ROUTE_KEYS.SERVICE_CPU_PROFILE);

//Create function to get CPU information
function cpuAverage() {
  //Initialise sum of idle and time of cores and fetch CPU info
  let totalIdle = 0,
    totalTick = 0;
  let cpus = os.cpus();

  //Loop through CPU cores
  for (let i = 0, len = cpus.length; i < len; i++) {
    //Select CPU core
    let cpu = cpus[i];

    //Total up the time in the cores tick
    for (let type in cpu.times) {
      totalTick += cpu.times[type];
    }

    //Total up the idle time of the core
    totalIdle += cpu.times.idle;
  }

  //Return the average Idle and Tick times
  return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
}

// function to calculate average of array
const arrAvg = function (arr) {
  if (arr && arr.length >= 1) {
    const sumArr = arr.reduce((a, b) => a + b, 0);
    return sumArr / arr.length;
  }
};

// load average for the past 1000 milliseconds calculated every 100
function getCPULoadAVG(avgTime = 1000, delay = 100) {
  return new Promise((resolve, reject) => {
    const n = ~~(avgTime / delay);
    if (n <= 1) {
      reject("Error: interval to small");
    }

    let i = 0;
    let samples = [];
    const avg1 = cpuAverage();

    let interval = setInterval(() => {
      logger.debug("CPU Interval: ", i);

      if (i >= n) {
        clearInterval(interval);
        resolve(~~(arrAvg(samples) * 100));
      }

      const avg2 = cpuAverage();
      const totalDiff = avg2.total - avg1.total;
      const idleDiff = avg2.idle - avg1.idle;

      samples[i] = 1 - idleDiff / totalDiff;

      i++;
    }, delay);
  });
}

module.exports = {
  getCPULoadAVG
};
