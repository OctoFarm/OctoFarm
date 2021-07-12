const Logger = require("../lib/logger.js");
const { JobValidationException } = require("../exceptions/job.exceptions");
const {
  ToadScheduler,
  SimpleIntervalJob,
  AsyncTask
} = require("toad-scheduler");

const logger = new Logger("OctoFarm-TaskManager");

// Test or example task
// TaskManager.registerPeriodicJob(
//   "unique_test_task1",
//   async () => {
//     await new Promise((resolve) => {
//       setTimeout(() => resolve(), 9000);
//     });
//   },
//   {
//     periodic: true,
//     logFirstCompletion: true,
//     runImmediately: false,
//     milliseconds: 10000
//   }
// );

/**
 * Manage recurring server tasks
 */
class TaskManager {
  static taskScheduler = new ToadScheduler();
  static taskStates = {};

  static validateInput(taskId, workload, jobOptions) {
    if (!taskId) {
      throw new JobValidationException(
        "Task ID was not provided. Cant register task or schedule job."
      );
    }
    if (!!this.taskStates[taskId]) {
      throw new JobValidationException(
        "Task ID was already registered. Cant register a key twice."
      );
    }
    if (typeof workload !== "function") {
      throw new JobValidationException(
        `Provided job '${
          workload.name || "anonymous"
        }' for taskId '${taskId}' was not callable and can't be scheduled.`
      );
    }

    if (!jobOptions?.periodic && !jobOptions?.runOnce) {
      throw new JobValidationException("Provide 'periodic' or 'runOnce'");
    }
    if (
      jobOptions?.periodic &&
      (!jobOptions.milliseconds ||
        !jobOptions.seconds ||
        !jobOptions.minutes ||
        !jobOptions.hours ||
        !jobOptions.days)
    ) {
      // Require milliseconds, minutes, hours or days
      throw new JobValidationException(
        "Provide a periodic timing parameter (milliseconds|seconds|minutes|hours|days)"
      );
    }
  }

  /**
   * Create a recurring job
   * Tip: use the options properties `runImmediately` and `seconds/milliseconds/minutes/hours/days`
   */
  static registerJobOrTask(taskID, asyncTaskCallback, schedulerOptions) {
    try {
      this.validateInput(taskID, asyncTaskCallback, schedulerOptions);
    } catch (e) {
      logger.error(e, schedulerOptions);
      return;
    }
    const timedTask = this.getSafeTimedTask(taskID, asyncTaskCallback);

    const job = new SimpleIntervalJob(schedulerOptions, timedTask);

    TaskManager.taskStates[taskID] = {
      options: schedulerOptions
    };
    TaskManager.taskScheduler.addSimpleIntervalJob(job);
  }

  static getSafeTimedTask(taskId, handler) {
    const asyncHandler = async () => {
      await this.timeTask(taskId, handler);
    };

    return new AsyncTask(taskId, asyncHandler, this.getErrorHandler(taskId));
  }

  static async timeTask(taskId, handler) {
    TaskManager.taskStates[taskId] = { started: Date.now() };

    let taskState = TaskManager.taskStates[taskId];
    await handler();
    taskState.duration = Date.now() - taskState.started;

    if (!taskState.options?.logFirstCompletion !== false) {
      logger.info(
        `Task '${taskId}' first run completed with duration ${taskState.duration}ms`
      );
      taskState.firstCompletion = true;
    }
  }

  static getTaskState(taskId) {
    return this.taskStates[taskId];
  }

  static getErrorHandler(taskId) {
    return (error) => {
      const registration = TaskManager.taskStates[taskId];

      if (!registration.lastError)
        registration.erroredlastError = {
          time: Date.now(),
          error
        };

      logger.error(`Task '${taskId}' threw an exception:`, error);
    };
  }

  /**
   * Stops the tasks which were registered
   */
  static stopSchedulerTasks() {
    TaskManager.taskScheduler.stop();
  }
}

module.exports = {
  TaskManager
};
