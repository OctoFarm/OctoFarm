const SystemInfo = require("../models/SystemInfo.js");
const si = require("systeminformation");
const process = require("process");

let systemRunner = false;

class SystemRunner {
  static init() {
    if (systemRunner === false) {
      console.log("Starting System Runner");
      systemRunner = setInterval(function() {
        SystemRunner.getSystemInfo()
          .then(res => {
            SystemInfo.find({}).then(info => {
              if (info.length > 1) {
                info[0].osInfo = res.osInfo;
                info[0].cpuInfo = res.cpuInfo;
                info[0].cpuLoad = res.cpuLoad;
                info[0].memoryInfo = res.memoryInfo;
                info[0].networkInfo = res.networkInfo;
                info[0].sysUptime = res.sysUptime;
                info[0].sysProcess = res.sysProcess;
                info[0].save();
              } else {
                const {
                  osInfo,
                  cpuInfo,
                  cpuLoad,
                  memoryInfo,
                  networkStats,
                  sysUptime,
                  sysProcess
                } = res;
                let newSystemInfo = new SystemInfo({
                  osInfo,
                  cpuInfo,
                  cpuLoad,
                  memoryInfo,
                  networkStats,
                  sysUptime,
                  sysProcess
                });
                newSystemInfo.save();
              }
            });
          })
          .catch(err => {
            err => console.log(err);
          });
      }, 4000);
    }
  }
  static async getSystemInfo() {
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
    let systemInfo = {
      osInfo: osInfo,
      cpuInfo: cpuInfo,
      cpuLoad: cpuLoad,
      memoryInfo: memoryInfo,
      sysUptime: uptime,
      sysProcess: sysProcess
    };

    return systemInfo;
  }
}
module.exports = {
  SystemRunner: SystemRunner
};
