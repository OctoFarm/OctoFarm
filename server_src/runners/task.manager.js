const TaskScheduler = require("./task.scheduler");
const Logger = require("../lib/logger.js");

const logger = new Logger("OctoFarm-TaskManager");

/**
 * Manage recurring server tasks
 */
class TaskManager {
  static taskScheduler = new TaskScheduler();
  static taskMetrics = {};

  static registerAsyncTask(uniqueTaskID, milliseconds, asyncTaskCallback) {
    if (!uniqueTaskID) {
      throw "TaskManager requires a unique task ID to be able to track performance";
    }

    const wrappedTask = this.wrapTaskWithTimer(uniqueTaskID, asyncTaskCallback);
    this.taskScheduler.createTask(
      uniqueTaskID,
      { milliseconds: milliseconds },
      wrappedTask,
      this.getTaskErrorHandler(uniqueTaskID)
    );
  }

  static wrapTaskWithTimer(identifier, handler) {
    return async () => {
      let metricContainer = TaskManager.taskMetrics[identifier];
      metricContainer = { started: Date.now() };
      await handler();
      metricContainer.finished = Date.now();
      metricContainer.duration =
        metricContainer.finished - metricContainer.started;
      logger.info(
        `Task with name ${identifier} took ${metricContainer.duration} ms to complete.`
      );
    };
  }

  static getTaskErrorHandler(task) {
    return (error) => {
      console.log("task failed:", error);
    };
  }
}

module.exports = {
  TaskManager
};
