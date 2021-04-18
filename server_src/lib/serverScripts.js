const Logger = require("../lib/logger.js");
const loggerScripts = new Logger("OctoFarm-Scripts");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const wol = require("wake_on_lan");

class Script {
  static async fire(scriptLocation, message) {
    loggerScripts.info("Script: ", scriptLocation);
    loggerScripts.info("Message: ", message);
    try {
      const { stdout, stderr } = await exec(`${scriptLocation} ${message}`);
      loggerScripts.info("stdout:", stdout);
      loggerScripts.info("stderr:", stderr);
      return scriptLocation + ": " + stdout;
    } catch (err) {
      loggerScripts.error(err);
      return err;
    }
  }

  static async wol(wolSettings) {
    const opts = {
      address: wolSettings.ip,
      num_packets: wolSettings.count,
      interval: wolSettings.interval,
      port: wolSettings.port,
    };
    const mac = wolSettings.MAC;

    wol.wake(mac, function (error) {
      if (error) {
        loggerScripts.error("Couldn't fire wake packet", error);
      } else {
        loggerScripts.info("Successfully fired wake packet: ", mac, opts);
      }
    });
  }
}

module.exports = { Script };
