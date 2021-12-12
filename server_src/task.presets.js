const HOUR_MS = 3600 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

// Test or example task
// TaskManager.registerPeriodicJob(
//   "unique_test_task1",
//   async () => {
//     await new Promise((resolve) => {
//       setTimeout(() => resolve(), 9000);
//     });
//   },
//   {
//   PERIODIC_TASK_PRESET_2500MS
// );

class TASK_PRESETS {
  static PERIODIC = {
    periodic: true,
    logFirstCompletion: true,
    runImmediately: false // Just like setInterval
  };

  static PERIODIC_IMMEDIATE = {
    periodic: true,
    logFirstCompletion: true,
    runImmediately: true // Just like setInterval
  };

  static PERIODIC_DISABLED = {
    ...this.PERIODIC,
    runImmediately: true,
    logFirstCompletion: true,
    disabled: true // Something else will trigger it
  };

  static PERIODIC_2500MS = {
    ...this.PERIODIC,
    logFirstCompletion: true,
    milliseconds: 2500
  };

  static PERIODIC_IMMEDIATE_DAY = {
    ...this.PERIODIC,
    runImmediately: true,
    logFirstCompletion: true,
    milliseconds: DAY_MS
  };

  static PERIODIC_IMMEDIATE_WEEK = {
    ...this.PERIODIC,
    runImmediately: true,
    logFirstCompletion: true,
    milliseconds: WEEK_MS
  };

  static RUNONCE = {
    runOnce: true, // not optional
    logFirstCompletion: true,
    runImmediately: true
  };

  static RUNDELAYED = {
    runDelayed: true, // not optional
    logFirstCompletion: true,
    runImmediately: false,
    seconds: 0 // other timing units will be ignored (by design)
  };
}

module.exports = {
  TaskPresets: TASK_PRESETS
};
