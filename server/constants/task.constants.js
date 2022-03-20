const THIRTY_SECONDS = 30 * 1000;
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

  static PERIODIC_1000MS = {
    ...this.PERIODIC,
    logFirstCompletion: true,
    milliseconds: 1000
  };

  static PERIODIC_10000MS = {
    ...this.PERIODIC,
    logFirstCompletion: true,
    milliseconds: 10000
  };

  static PERIODIC_600000MS = {
    ...this.PERIODIC,
    logFirstCompletion: true,
    runImmediately: true,
    milliseconds: 600000
  };

  static PERIODIC_30000MS = {
    ...this.PERIODIC,
    logFirstCompletion: true,
    runImmediately: true,
    milliseconds: 30000
  };

  static PERIODIC_60000MS = {
    ...this.PERIODIC,
    logFirstCompletion: true,
    runImmediately: true,
    milliseconds: 60000
  };

  static PERIODIC_5000MS = {
    ...this.PERIODIC,
    logFirstCompletion: true,
    milliseconds: 5000
  };

  static PERIODIC_IMMEDIATE_30_SECONDS = {
    ...this.PERIODIC,
    runImmediately: true,
    logFirstCompletion: true,
    milliseconds: THIRTY_SECONDS
  };

  static PERIODIC_IMMEDIATE_500_MS = {
    ...this.PERIODIC,
    runImmediately: true,
    logFirstCompletion: true,
    milliseconds: 500
  };

  static PERIODIC_IMMEDIATE_1000_MS = {
    ...this.PERIODIC,
    runImmediately: true,
    logFirstCompletion: true,
    milliseconds: 1000
  };

  static PERIODIC_IMMEDIATE_5000_MS = {
    ...this.PERIODIC,
    runImmediately: true,
    logFirstCompletion: true,
    milliseconds: 5000
  };

  static PERIODIC_DAY = {
    ...this.PERIODIC,
    logFirstCompletion: true,
    milliseconds: DAY_MS
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
