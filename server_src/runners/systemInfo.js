const si = require("systeminformation");
const process = require("process");
const Logger = require("../lib/logger.js");

const logger = new Logger("OctoFarm-Server");

let systemInfo = null;

class SystemRunner {
  static returnInfo() {
    return systemInfo;
  }

  static async init() {
    await this.getSystemInfo();
    setInterval(async () => {
      this.getSystemInfo();
    }, 2500);

    return "Started system information collection...";
  }

  static async getSystemInfo() {
    try {
      //Collect some system information
      const cpu = await si.cpu().catch((error) => logger.error(error));

      const cpuCurrentSpeed = await si
        .cpuCurrentspeed()
        .catch((error) => logger.error(error));
      const cpuLoad = await si
        .currentLoad()
        .catch((error) => logger.error(error));
      // const cpuInfo = {
      //   cpu,
      //   speed: cpuCurrentSpeed,
      // };

      const memoryInfo = await si.mem().catch((error) => logger.error(error));
      const uptime = si.time();
      const osInfo = await si.osInfo().catch((error) => logger.error(error));
      const currentProcess = await si
        .processes()
        .catch((error) => logger.error(error));
      let sysProcess = {};
      currentProcess.list.forEach((current) => {
        if (current.pid === process.pid) {
          sysProcess = current;
        }
      });
      const fileSize = await si.fsSize().catch((error) => logger.error(error));
      const systemDisk = fileSize[0];

      //This maybe related to node 13.12.0 possibly. Issue #341.
      let warnings = {};

      if (typeof systemDisk !== "undefined") {
        if (systemDisk.use >= 99) {
          warnings = {
            status: "danger",
            message:
              "Danger! Your disk is over 99% full... OctoFarms operations could be effected if you don't clean up some space or move to a larger hard drive.",
          };
        } else if (systemDisk.use >= 95) {
          warnings = {
            status: "warning",
            message:
              "Warning your disk is over 95% full... Please clean up some space or move to a larger hard drive.",
          };
        } else if (systemDisk.use >= 90) {
          warnings = {
            status: "warning",
            message:
              "Warning your disk is getting full... Please clean up some space or move to a larger hard drive.",
          };
        }
      }

      systemInfo = {
        osInfo,
        cpuInfo,
        cpuLoad,
        memoryInfo,
        sysUptime: uptime,
        processUptime: process.uptime(),
        sysProcess,
        systemDisk,
        warnings,
      };
      return systemInfo;
    } catch (e) {
      logger.error(
        "Some system information has failed to generate:",
        e.message
      );

      return false;
    }
  }
}
module.exports = {
  SystemRunner,
};
