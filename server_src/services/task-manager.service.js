const Logger = require("../handlers/logger.js");
const { AwilixResolutionError } = require("awilix");
const { JobValidationException } = require("../exceptions/job.exceptions");
const { ToadScheduler, SimpleIntervalJob, AsyncTask } = require("toad-scheduler");

const logger = new Logger("OctoFarm-TaskManager");

/**
 * Manage immediate or delayed tasks and recurring jobs.
 */
class TaskManagerService {
  jobScheduler = new ToadScheduler();
  taskStates = {};

  #container;

  constructor(container) {
    this.#container = container;
  }

  validateInput(taskId, workload, schedulerOptions) {
    if (!taskId) {
      throw new JobValidationException(
        "Task ID was not provided. Cant register task or schedule job."
      );
    }
    const prefix = `Job '${workload.name || "anonymous"}' with ID '${taskId}'`;
    if (!!this.taskStates[taskId]) {
      throw new JobValidationException(
        `${prefix} was already registered. Cant register a key twice.`,
        taskId
      );
    }

    if (typeof workload !== "function") {
      if (typeof workload !== "string") {
        throw new JobValidationException(
          `${prefix} is not a callable nor a string dependency to lookup. It can't be scheduled.`,
          taskId
        );
      }

      let resolvedService;
      try {
        resolvedService = this.#container[workload];
      } catch (e) {
        if (e instanceof AwilixResolutionError) {
          throw new JobValidationException(
            `${prefix} had an awilix dependency resolution error. It can't be scheduled without fixing this problem. Inner error:\n` +
              e.stack,
            taskId
          );
        } else {
          throw new JobValidationException(
            `${prefix} is not a registered awilix dependency. It can't be scheduled. Error:\n` +
              e.stack,
            taskId
          );
        }
      }

      if (typeof resolvedService?.run !== "function") {
        throw new JobValidationException(
          `${prefix} was resolved but it doesn't have a 'run(..)' method to call.`,
          taskId
        );
      }
    }

    if (
      !schedulerOptions?.periodic &&
      !schedulerOptions?.runOnce &&
      !schedulerOptions?.runDelayed
    ) {
      throw new JobValidationException(
        `Provide 'periodic' or 'runOnce' or 'runDelayed' option'.`,
        taskId
      );
    }
    if (!schedulerOptions?.periodic && !!schedulerOptions.disabled) {
      throw new JobValidationException(
        `Only tasks of type 'periodic' can be disabled at boot.`,
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
        `Provide a delayed timing parameter (milliseconds|seconds)'`,
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
        `Provide a periodic timing parameter (milliseconds|seconds|minutes|hours|days)'`,
        taskId
      );
    }
  }

  /**
   * Create a recurring job
   * Tip: use the options properties `runImmediately` and `seconds/milliseconds/minutes/hours/days`
   */
  registerJobOrTask({ id: taskID, task: asyncTaskCallbackOrToken, preset: schedulerOptions }) {
    try {
      this.validateInput(taskID, asyncTaskCallbackOrToken, schedulerOptions);
    } catch (e) {
      logger.error(e.stack, schedulerOptions);
      return;
    }

    const timedTask = this.getSafeTimedTask(taskID, asyncTaskCallbackOrToken);

    this.taskStates[taskID] = {
      options: schedulerOptions,
      timedTask
    };

    if (schedulerOptions.runOnce) {
      timedTask.execute();
    } else if (schedulerOptions.runDelayed) {
      const delay = (schedulerOptions.milliseconds || 0) + (schedulerOptions.seconds || 0) * 1000;
      this.runTimeoutTaskInstance(taskID, delay);
    } else {
      // This must be 'periodic'
      this.#scheduleEnabledPeriodicJob(taskID);
    }
  }

  /**
   * Enable the job which must be disabled at boot. Handy for conditional, heavy or long-running non-critical tasks
   * @param taskID
   */
  scheduleDisabledJob(taskID) {
    const taskState = this.#getTaskState(taskID);
    const schedulerOptions = taskState?.options;
    if (schedulerOptions?.disabled !== true) {
      throw new JobValidationException(
        `The requested task with ID ${taskID} was not explicitly disabled and must be running already.`
      );
    }
    taskState.options.disabled = false;

    this.#scheduleEnabledPeriodicJob(taskID);
  }

  isTaskDisabled(taskID) {
    return !!this.#getTaskState(taskID).options.disabled;
  }

  #scheduleEnabledPeriodicJob(taskID) {
    const taskState = this.#getTaskState(taskID);
    if (!taskState?.timedTask || !taskState?.options) {
      throw new JobValidationException(
        `The requested task with ID ${taskID} was not registered properly ('timedTask' or 'options' missing).`
      );
    }
    const schedulerOptions = taskState?.options;
    const timedTask = taskState.timedTask;
    if (!schedulerOptions?.periodic) {
      throw new JobValidationException(
        `The requested task with ID ${taskID} is not periodic and cannot be enabled.`
      );
    }
    if (!schedulerOptions.disabled) {
      logger.info(
        `Task '${taskID}' was scheduled (runImmediately: ${!!schedulerOptions.runImmediately}).`
      );
      const job = new SimpleIntervalJob(schedulerOptions, timedTask);
      this.jobScheduler.addSimpleIntervalJob(job);
    } else {
      logger.info(`Task '${taskID}' was marked as disabled (deferred execution).`);
    }
  }

  #getTaskState(taskID) {
    const taskState = this.taskStates[taskID];
    if (!taskState) {
      throw new JobValidationException(`The requested task with ID ${taskID} was not registered`);
    }
    return taskState;
  }

  runTimeoutTaskInstance(taskID, timeoutMs) {
    const taskState = this.#getTaskState(taskID);
    logger.info(`Running delayed task ${taskID} in ${timeoutMs}ms`);
    setTimeout(() => taskState.timedTask.execute(), timeoutMs, taskID);
  }

  getSafeTimedTask(taskId, handler) {
    const asyncHandler = async () => {
      await this.timeTask(taskId, handler);
    };

    return new AsyncTask(taskId, asyncHandler, this.getErrorHandler(taskId));
  }

  async timeTask(taskId, handler) {
    let taskState = this.taskStates[taskId];
    taskState.started = Date.now();
    if (typeof handler === "string") {
      const taskService = this.#container[handler];
      await taskService.run();
    } else {
      await handler();
    }
    taskState.duration = Date.now() - taskState.started;

    if (taskState.options?.logFirstCompletion !== false && !taskState?.firstCompletion) {
      logger.info(`Task '${taskId}' first completion. Duration ${taskState.duration}ms`);
      taskState.firstCompletion = Date.now();
    }
  }

  getTaskState(taskId) {
    return this.taskStates[taskId];
  }

  getErrorHandler(taskId) {
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
  stopSchedulerTasks() {
    this.jobScheduler.stop();
  }
}

module.exports = TaskManagerService;
