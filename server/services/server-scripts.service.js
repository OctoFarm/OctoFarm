const Logger = require("../handlers/logger.js");
const logger = new Logger("OctoFarm-Scripts");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const wol = require("wake_on_lan");

class Script {
  static async fire(scriptLocation, message) {
    logger.info("Script: ", scriptLocation);
    logger.info("Message: ", message);
    try {
      console.log();

      const { stdout, stderr } = await exec(Script.escapeShellArg(`${scriptLocation} ${message}`));
      if (!!stdout) logger.info("stdout:", stdout);
      if (!!stderr) logger.error("stderr:", stderr);

      return scriptLocation + ": " + stdout;
    } catch (err) {
      logger.error("Error firing script!", err.message);
      return err;
    }
  }

  static async wol(wolSettings) {
    const opts = {
      address: wolSettings.ip,
      num_packets: wolSettings.count,
      interval: wolSettings.interval,
      port: wolSettings.port
    };
    const mac = wolSettings.MAC;

    wol.wake(mac, function (error) {
      if (error) {
        logger.error("Couldn't fire wake packet", error.message);
      } else {
        logger.info("Successfully fired wake packet: ", mac, opts);
      }
    });
  }

  static escapeShellArg(arg) {
    return `${arg.replace(/'/g, "'\\''")}`;
  }
}

module.exports = { Script };
