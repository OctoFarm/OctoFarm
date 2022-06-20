const { time, fsSize } = require("systeminformation");
const os = require("os");
const process = require("process");
const Logger = require("../handlers/logger");
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");
const logger = new Logger(LOGGER_ROUTE_KEYS.SERVICE_SYSTEM_INFORMATION);
const { farmPiStatus } = require("./farmpi-detection.service");
const { getCPULoadAVG } = require("./cpu-profiling.service");

const diskVeryFullWarning =
  "Warning your disk is getting full... Please clean up some space or move to a larger hard drive.";
const diskAlmostFullWarning =
  "Warning your disk is over 95% full... Please clean up some space or move to a larger hard drive.";
const diskRisk =
  "Danger! Your disk is over 99% full... OctoFarms operations could be effected if you don't clean up some space or move to a larger hard drive.";
const memoryUsageHistory = [];
const cpuUsageHistory = [];

let systemInformationService = {
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
    return systemInformationService;
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
    const used = os.freemem();
    const total = os.totalmem();

    if (systemInformationService.totalMemory !== 0) {
      const memoryPercent = Math.round((100 * used) / total) / 100;
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
    systemInformationService.uptime = process.uptime();
    systemInformationService.osUptime = os.uptime();
    const fileSize = await fsSize().catch((error) => logger.error(error));
    const systemDisk = fileSize[0];
    systemInformationService.systemDisk = systemDisk;

    systemInformationService.warnings = SystemRunner.getDiskWarnings(systemDisk);
  }

  // Grab one time information
  static async profileSystem() {
    await SystemRunner.updateSystemInformation();

    systemInformationService.architecture = process.arch;

    const siTime = time();
    systemInformationService.timezone = siTime.timezone;
    systemInformationService.timezoneName = siTime.timezoneName;

    if (farmPiStatus()) {
      systemInformationService.distro = `Ubuntu (FarmPi ${farmPiStatus()})`;
    } else {
      systemInformationService.distro = `${os.type()} ${os.release()} (${os.platform()})`;
    }

    systemInformationService.networkIpAddresses = SystemRunner.getIpAddressList();
    systemInformationService.totalMemory = os.totalmem();

    systemInformationService.cpuLoadHistory = cpuUsageHistory;
    systemInformationService.memoryLoadHistory = memoryUsageHistory;
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
