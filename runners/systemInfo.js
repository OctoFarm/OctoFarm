const si = require("systeminformation");
const process = require("process");

let systemInfo = {};

class SystemRunner {
  static returnInfo() {
    return systemInfo;
  }

  static async init() {
    await this.getSystemInfo();
    setInterval(async () => {
      this.getSystemInfo();
    }, 15000);

    return "Started system information collection...";
  }

  static async getSystemInfo() {
    try {
      //Collect some system information
      const cpu = await si.cpu().catch((error) => console.error(error));

      const cpuCurrentSpeed = await si
        .cpuCurrentspeed()
        .catch((error) => console.error(error));
      const cpuLoad = await si
        .currentLoad()
        .catch((error) => console.error(error));
      const cpuInfo = {
        cpu,
        speed: cpuCurrentSpeed,
      };

      const memoryInfo = await si.mem().catch((error) => console.error(error));
      const uptime = si.time();
      const osInfo = await si.osInfo().catch((error) => console.error(error));
      const currentProcess = await si
        .processes()
        .catch((error) => console.error(error));
      let sysProcess = {};
      currentProcess.list.forEach((current) => {
        if (current.pid === process.pid) {
          sysProcess = current;
        }
      });
      systemInfo = {
        osInfo,
        cpuInfo,
        cpuLoad,
        memoryInfo,
        sysUptime: uptime,
        processUptime: process.uptime(),
        sysProcess,
      };
      return systemInfo;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
}
module.exports = {
  SystemRunner,
};
