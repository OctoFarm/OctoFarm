const mongoose = require("mongoose");

const Logger = require("../handlers/logger");
const logger = new Logger("OctoFarm-Server");
const { Runner } = require("../runners/state");
const { TaskManager } = require("../runners/task.manager");

function shutdownServer(app) {
  logger.debug("Shutdown detected, started clean up!");
  return Promise.all([
    mongoose.disconnect(),
    Runner.killAllConnections(),
    TaskManager.stopSchedulerTasks(),
    app.close()
  ]);
}

function onShutdown(app) {
  shutdownServer(app)
    .then(() => {
      logger.debug("Clean shutdown successful!");
      process.kill(process.pid);
    })
    .catch((e) => {
      logger.error("Couldn't cleanly shutdown server!", e);
      process.kill(process.pid);
    });
}

module.exports = {
  onShutdown
};
