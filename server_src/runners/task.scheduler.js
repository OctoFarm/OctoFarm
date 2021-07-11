const {
  ToadScheduler,
  SimpleIntervalJob,
  AsyncTask
} = require("toad-scheduler");

class TaskScheduler {
  scheduler;

  constructor() {
    this.scheduler = new ToadScheduler();
  }

  /**
   * Create a recurring task
   * @param {string} taskId
   * @param {SimpleIntervalSchedule} intervalSpec
   * @param {() => Promise<void>} asyncHandler
   * @param {(err: Error) => void} asyncErrorHandler
   */
  createTask(
    taskId,
    intervalSpec = { milliseconds: 30000 },
    asyncHandler,
    asyncErrorHandler
  ) {
    const task = new AsyncTask(taskId, asyncHandler, asyncErrorHandler);
    const job = new SimpleIntervalJob(intervalSpec, task);

    this.scheduler.addSimpleIntervalJob(job);
  }

  stopTasks() {
    this.scheduler.stop();
  }
}

module.exports = TaskScheduler;
