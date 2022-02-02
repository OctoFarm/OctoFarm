const mongoose = require("mongoose");

const Logger = require("../handlers/logger");
const logger = new Logger("OctoFarm-Server");
const { TaskManager } = require("./task-manager.service");
const { getPrinterManagerCache } = require("../cache/printer-manager.cache");

function killMongoDBConnection() {
  if (mongoose.connection.readyState === 1) {
    logger.warning("Killing mongoose connection.");
    return mongoose.disconnect();
  } else {
    return true;
  }
}

function shutdownServer(app) {
  logger.warning("Shutdown detected, started clean up!");
  return Promise.allSettled([
    killMongoDBConnection(),
    getPrinterManagerCache().killAllConnections(),
    TaskManager.stopSchedulerTasks(),
    app.close()
  ]);
}

function onShutdown(app) {
  shutdownServer(app)
    .then(() => {
      logger.warning("Clean shutdown successful!");
      process.exit(0);
      setTimeout(function () {}, 5000);
    })
    .catch((e) => {
      logger.error("Couldn't cleanly shutdown server!", e);
      process.exit(1);
    });
}

module.exports = {
  onShutdown
};
