const TaskScheduler = require("./task.scheduler");
const Logger = require("../lib/logger.js");

const logger = new Logger("OctoFarm-TaskManager");

// Test or example task
// TaskManager.registerAsyncTask("unique_test_task1", 10000, async () => {
//   await new Promise((resolve) => {
//     setTimeout(() => resolve(), 9000);
//   });
// });

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

    const wrappedTask = this.wrapTaskWithTimer(
      uniqueTaskID,
      milliseconds,
      asyncTaskCallback
    );
    this.taskScheduler.createTask(
      uniqueTaskID,
      { milliseconds: milliseconds },
      wrappedTask,
      this.getTaskErrorHandler(uniqueTaskID)
    );
  }

  static wrapTaskWithTimer(identifier, milliseconds, handler) {
    return async () => {
      let metricContainer = TaskManager.taskMetrics[identifier];
      metricContainer = { started: Date.now() };
      await handler();
      metricContainer.finished = Date.now();
      metricContainer.duration =
        metricContainer.finished - metricContainer.started;

      // No logging of extremely repeatable logs
      const report = `Task ${identifier} with period ${milliseconds} finished. [Duration ${metricContainer.duration} ms]`;
      if (milliseconds < 20000) {
        console.log(report);
      } else {
        logger.info(report);
      }
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
