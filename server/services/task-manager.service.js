const Logger = require("../handlers/logger.js");
const { JobValidationException } = require("../exceptions/job.exceptions");
const { ToadScheduler, SimpleIntervalJob, AsyncTask } = require("toad-scheduler");

const logger = new Logger("OctoFarm-TaskManagerService");

/**
 * Manage immediate or delayed tasks and recurring jobs.
 * Note: this class ought NOT TO BE USED FOR SYNCHRONOUS REQUEST MIDDLEWARE
 */
class TaskManagerService {
  static jobScheduler = new ToadScheduler();
  static taskStates = {};

  static validateInput(taskId, workload, schedulerOptions) {
    if (!taskId) {
      throw new JobValidationException(
        "Task ID was not provided. Cant register task or schedule job."
      );
    }
    if (!!this.taskStates[taskId]) {
      throw new JobValidationException(
        `Task ID with taskId '${taskId}' was already registered. Cant register a key twice.`,
        taskId
      );
    }
    if (typeof workload !== "function") {
      throw new JobValidationException(
        `Job '${
          workload.name || "anonymous"
        }' with taskId '${taskId}' is not a callable function and can't be scheduled.`,
        taskId
      );
    }

    if (
      !schedulerOptions?.periodic &&
      !schedulerOptions?.runOnce &&
      !schedulerOptions?.runDelayed
    ) {
      throw new JobValidationException(
        "Provide 'periodic' or 'runOnce' or 'runDelayed' option'",
        taskId
      );
    }
    if (
      schedulerOptions?.runDelayed &&
      !schedulerOptions.milliseconds &&
      !schedulerOptions.seconds
    ) {
      // Require milliseconds, minutes, hours or days
      throw new JobValidationException(
        "Provide a delayed timing parameter (milliseconds|seconds)'",
        taskId
      );
    }
    if (
      schedulerOptions?.periodic &&
      !schedulerOptions.milliseconds &&
      !schedulerOptions.seconds &&
      !schedulerOptions.minutes &&
      !schedulerOptions.hours &&
      !schedulerOptions.days
    ) {
      // Require milliseconds, minutes, hours or days
      throw new JobValidationException(
        "Provide a periodic timing parameter (milliseconds|seconds|minutes|hours|days)'",
        taskId
      );
    }
  }

  /**
   * Create a recurring job
   * Tip: use the options properties `runImmediately` and `seconds/milliseconds/minutes/hours/days`
   */
  static registerJobOrTask({ id: taskID, task: asyncTaskCallback, preset: schedulerOptions }) {
    try {
      this.validateInput(taskID, asyncTaskCallback, schedulerOptions);
    } catch (e) {
      logger.error(e, schedulerOptions);
      return;
    }
    const timedTask = this.getSafeTimedTask(taskID, asyncTaskCallback);

    this.taskStates[taskID] = {
      options: schedulerOptions,
      task: timedTask
    };

    if (schedulerOptions.runOnce) {
      timedTask.execute();
    } else if (schedulerOptions.runDelayed) {
      const delay = (schedulerOptions.milliseconds || 0) + (schedulerOptions.seconds || 0) * 1000;
      this.runTimeoutTaskInstance(taskID, timedTask, delay);
    } else {
      const job = new SimpleIntervalJob(schedulerOptions, timedTask, taskID);
      this.jobScheduler.addSimpleIntervalJob(job);
    }
  }

  static runTimeoutTaskInstance(taskID, task, timeoutMs) {
    logger.info(`Running delayed task ${taskID} in ${timeoutMs}ms`);
    setTimeout(() => task.execute(), timeoutMs, taskID);
  }

  static getSafeTimedTask(taskId, handler) {
    const asyncHandler = async () => {
      await this.timeTask(taskId, handler);
    };
    return new AsyncTask(taskId, asyncHandler, this.getErrorHandler(taskId));
  }

  static async timeTask(taskId, handler) {
    let taskState = this.taskStates[taskId];
    taskState.started = Date.now();

    await handler();
    taskState.duration = Date.now() - taskState.started;

    if (taskState.options?.logFirstCompletion !== false && !taskState?.firstCompletion) {
      logger.info(`Task '${taskId}' first completion. Duration ${taskState.duration}ms`);
      taskState.firstCompletion = Date.now();
    }
    if (taskState.options?.periodic) {
      taskState.nextRun = new Date(Date.now() + taskState.options.milliseconds).getTime();
    }
    // Always log when the task was last executed
    taskState.lastExecuted = Date.now();
  }

  static getTaskState(taskId) {
    if (!taskId) {
      return this.taskStates;
    }
    return this.taskStates[taskId];
  }

  static getErrorHandler(taskId) {
    return (error) => {
      const registration = this.taskStates[taskId];

      if (!registration.lastError)
        registration.erroredlastError = {
          time: Date.now(),
          error
        };

      logger.error(`Task '${taskId}' threw an exception:` + error.stack);
    };
  }

  /**
   * Stops the tasks which were registered
   */
  static stopSchedulerTasks() {
    this.jobScheduler.stop();
    logger.warning("Successfully stopped all scheduled tasks!");
    return true;
  }

  /**
   * Runs the tasks which were registered
   */
  static forceRunTask(taskId) {
    if (!taskId) return;
    this.taskStates[taskId].task.execute();
  }
}

module.exports = {
  TaskManager: TaskManagerService
};
