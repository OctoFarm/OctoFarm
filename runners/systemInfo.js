const si = require("systeminformation");
const process = require("process");

let systemInfo = {};


class SystemRunner {
  static returnInfo(){
    return systemInfo;
  }
  static async init(){
    await this.getSystemInfo();
    setInterval(async () => {
        this.getSystemInfo();
      }, 5000);

    return "Started system information collection...";
  }
  static async getSystemInfo() {
    try{
      //Collect some system information
      let cpu = await si.cpu().catch(error => console.error(error));

      let cpuCurrentSpeed = await si
          .cpuCurrentspeed()
          .catch(error => console.error(error));
      let cpuLoad = await si.currentLoad().catch(error => console.error(error));
      let cpuInfo = {
        cpu: cpu,
        speed: cpuCurrentSpeed
      };

      let memoryInfo = await si.mem().catch(error => console.error(error));
      let uptime = si.time();
      let osInfo = await si.osInfo().catch(error => console.error(error));
      let currentProcess = await si
          .processes()
          .catch(error => console.error(error));
      let sysProcess = {};
      currentProcess.list.forEach(current => {
        if (current.pid === process.pid) {
          sysProcess = current;
        }
      });
      systemInfo = {
        osInfo: osInfo,
        cpuInfo: cpuInfo,
        cpuLoad: cpuLoad,
        memoryInfo: memoryInfo,
        sysUptime: uptime,
        processUptime: process.uptime(),
        sysProcess: sysProcess
      };
        return systemInfo;
    }
    catch(e){
      console.log(e)
      return false;
    }

  }
}
module.exports = {
  SystemRunner: SystemRunner
};
