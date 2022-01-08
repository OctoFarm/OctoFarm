const { time, fsSize } = require("systeminformation");
const os = require("os");
const process = require("process");
const Logger = require("../handlers/logger");
const logger = new Logger("OctoFarm-Server");
const { farmPiStatus } = require("../services/farmpi-detection.service");
const { getCPULoadAVG } = require("../services/cpu-profiling.service");

const diskVeryFullWarning =
  "Warning your disk is getting full... Please clean up some space or move to a larger hard drive.";
const diskAlmostFullWarning =
  "Warning your disk is over 95% full... Please clean up some space or move to a larger hard drive.";
const diskRisk =
  "Danger! Your disk is over 99% full... OctoFarms operations could be effected if you don't clean up some space or move to a larger hard drive.";
const memoryUsageHistory = [];
const cpuUsageHistory = [];

let systemInfo = {
  distro: "",
  architecture: "",
  totalMemory: 0,
  uptime: 0,
  osUptime: 0,
  cpuLoadHistory: [],
  memoryLoadHistory: [],
  networkIpAddresses: []
};

class SystemRunner {
  static returnInfo(profile = false) {
    if (profile) {
      SystemRunner.updateSystemInformation().then((res) => {
        logger.debug("System successfully profiled", res);
      });
    }
    return systemInfo;
  }

  static async profileCPUUsagePercent() {
    const CPUPercent = await getCPULoadAVG(1000, 100);
    logger.debug("Current CPU Usage", { CPUPercent });
    cpuUsageHistory.push({
      x: new Date(),
      y: CPUPercent
    });
    if (cpuUsageHistory.length >= 300) {
      cpuUsageHistory.shift();
    }
  }

  static profileMemoryUsagePercent() {
    const used = process.memoryUsage();
    const total = used.heapUsed + used.external;
    const totalUsed = Math.round((total / 1024 / 1024) * 100) / 100;
    if (systemInfo.totalMemory !== 0) {
      const totalSystemMemoryInMB = Math.round((systemInfo.totalMemory / 1024 / 1024) * 100) / 100;
      const memoryPercent = Math.round((100 * totalUsed) / totalSystemMemoryInMB) / 100;
      logger.debug("Current Memory Usage", { memoryPercent });
      memoryUsageHistory.push({
        x: new Date(),
        y: memoryPercent
      });
      if (memoryUsageHistory.length >= 300) {
        memoryUsageHistory.shift();
      }
    }
  }

  static async initialiseSystemInformation() {
    await SystemRunner.profileSystem();
  }

  // Grab updating information
  static async updateSystemInformation() {
    systemInfo.uptime = process.uptime();
    systemInfo.osUptime = os.uptime();
    const fileSize = await fsSize().catch((error) => logger.error(error));
    const systemDisk = fileSize[0];
    systemInfo.systemDisk = systemDisk;

    systemInfo.warnings = SystemRunner.getDiskWarnings(systemDisk);
  }

  // Grab one time information
  static async profileSystem() {
    await SystemRunner.updateSystemInformation();

    systemInfo.architecture = process.arch;

    const siTime = time();
    systemInfo.timezone = siTime.timezone;
    systemInfo.timezoneName = siTime.timezoneName;

    if (farmPiStatus()) {
      systemInfo.distro = `Ubuntu (FarmPi ${farmPiStatus()})`;
    } else {
      systemInfo.distro = `${os.type()} ${os.release()} (${os.platform()})`;
    }

    systemInfo.networkIpAddresses = SystemRunner.getIpAddressList();
    systemInfo.totalMemory = os.totalmem();

    systemInfo.cpuLoadHistory = cpuUsageHistory;
    systemInfo.memoryLoadHistory = memoryUsageHistory;
  }

  static getDiskWarnings(disk) {
    if (!disk) {
      return {};
    }

    if (disk.use >= 99) {
      return {
        status: "danger",
        message: diskRisk
      };
    } else if (disk.use >= 95) {
      return {
        status: "warning",
        message: diskAlmostFullWarning
      };
    } else if (disk.use >= 90) {
      return {
        status: "warning",
        message: diskVeryFullWarning
      };
    }
    return {};
  }

  static getIpAddressList() {
    const nets = os.networkInterfaces();
    const results = [];
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === "IPv4" && !net.internal) {
          results.push(net.address);
        }
      }
    }
    return results;
  }
}

module.exports = {
  SystemRunner
};
