const mongoose = require("mongoose");

const Logger = require("../handlers/logger");
const logger = new Logger("OctoFarm-Server");
const { TaskManager } = require("../runners/task.manager");
const { getPrinterManagerCache } = require("../cache/printer-manager.cache");

function shutdownServer(app) {
  logger.debug("Shutdown detected, started clean up!");
  return Promise.all([
    mongoose.disconnect(),
    getPrinterManagerCache().killAllConnections(),
    TaskManager.stopSchedulerTasks(),
    app.close()
  ]);
}

function onShutdown(app) {
  shutdownServer(app)
    .then(() => {
      logger.debug("Clean shutdown successful!");
      setTimeout(function () {
        process.exit(0);
      }, 15000);
    })
    .catch((e) => {
      logger.error("Couldn't cleanly shutdown server!", e);
      setTimeout(function () {
        process.exit(1);
      }, 15000);
    });
}

module.exports = {
  onShutdown
};
