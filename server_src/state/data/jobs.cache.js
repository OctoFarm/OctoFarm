const _ = require("lodash");
const Logger = require("../../handlers/logger.js");
const { getPrintCostNumeric } = require("../../utils/print-cost.util");
const { getCompletionDate } = require("../../utils/time.util");
const { getJobCacheDefault } = require("../../constants/cache.constants");
const { ValidationException } = require("../../exceptions/runtime.exceptions");

/**
 * Stores a delegate job progress state for each printer - making it easier to access the latest job state.
 * No need to initialize as this is done by the printer states in a safe manner.
 */
class JobsCache {
  // associative array per printer ID
  #cachedJobProgress = {};

  #eventEmitter2;

  #logger = new Logger("Jobs-Cache");

  constructor({ eventEmitter2 }) {
    this.#eventEmitter2 = eventEmitter2;
  }

  /**
   * Apply patch to flattened job to provide legacy client with known model
   * @param flatJob
   * @param costSettings
   * @returns {*}
   */
  static postProcessJob(flatJob, costSettings) {
    if (!flatJob) return;

    flatJob.expectedPrinterCosts = getPrintCostNumeric(
      flatJob.estimatedPrintTime,
      costSettings
    )?.toFixed(2);

    // Job should match this shape now
    // return {
    //   progress: 0,
    //   fileName: "No File Selected",
    //   fileDisplay: "No File Selected",
    //   filePath: "No File Selected",
    //   averagePrintTime: null,
    //   lastPrintTime: null,
    //   expectedPrintTime: null,
    //   currentZ: null, // Optional
    //   printTimeRemaining: null,
    //   printTimeElapsed: null, // Progress
    //   expectedCompletionDate: null,
    //   expectedPrinterCosts: null,
    // TODO:
    //   expectedFilamentCosts: null,
    //   expectedTotals: null,
    //   thumbnail: null
    // };
    return flatJob;
  }

  getPrinterJob(printerId) {
    if (!printerId) {
      throw new Error("Job Cache cant get a null/undefined printer id");
    }

    let cachedPrinterJob = this.#cachedJobProgress[printerId];
    if (!cachedPrinterJob) {
      this.#cachedJobProgress[printerId] = getJobCacheDefault();
    }

    return this.#cachedJobProgress[printerId];
  }

  jobExists(id) {
    return !!this.#cachedJobProgress.hasOwnProperty(id);
  }

  purgePrinterId(printerId) {
    if (!printerId) {
      throw new ValidationException("Parameter printerId was not provided.");
    }

    const jobCacheEntry = this.#cachedJobProgress[printerId];

    if (!jobCacheEntry) {
      this.#logger.warning("Did not remove printer Job Progress as it was not found");
      return;
    }

    // console.log(Object.keys(this.#cachedJobProgress), "before");
    delete this.#cachedJobProgress[printerId];
    // console.log(Object.keys(this.#cachedJobProgress), "after");

    this.#logger.info(`Purged printerId '${printerId}' job progress cache`);
  }

  /**
   * By calling the job is supposed to exist, so the requestor must be certain this job exists.
   * This will crash if not the case, so call jobExists(id) to check beforehand.
   * @param id
   * @returns {{fileName, lastPrintTime, fileDisplay, filePath, averagePrintTime, expectedPrintTime: any}}
   */
  getPrinterJobFlat(id) {
    const cachedJob = this.#cachedJobProgress[id];

    if (!cachedJob) {
      // Problematic scenario where websocket is not set-up yet. Requestor should be more wary of that and be tolerant against
      // Empty job
      return;
    }

    // Shape it into client compatible format
    const transformedJob = {
      fileName: cachedJob.job.file.name || "No file selected",
      fileDisplay: cachedJob.job.file.display || "No file selected",
      filePath: cachedJob.job.file.path,
      averagePrintTime: cachedJob.job.averagePrintTime,
      lastPrintTime: cachedJob.job.lastPrintTime,
      expectedPrintTime: cachedJob.job.estimatedPrintTime // Rename?
    };
    if (!!cachedJob.currentZ) {
      transformedJob.currentZ = cachedJob.currentZ;
    }

    const progress = cachedJob.progress;
    if (!!progress) {
      transformedJob.progress = Math.floor(progress.completion); // Rename + floor
      transformedJob.printTimeRemaining = progress.printTimeLeft; // Rename
      transformedJob.printTimeElapsed = progress.printTime; // Rename
      transformedJob.expectedPrintTime =
        Math.round((progress.printTimeLeft + progress.printTime) / 1000) * 1000; // Calc
      transformedJob.expectedCompletionDate = getCompletionDate(
        progress.printTimeLeft,
        progress.completion
      );
    } else {
      transformedJob.progress = 0;
    }

    return transformedJob;
  }

  savePrinterJob(id, data) {
    let cachedPrinterJob = this.#cachedJobProgress[id];
    if (!cachedPrinterJob) {
      this.#cachedJobProgress[id] = getJobCacheDefault();
    }

    this.updatePrinterJob(id, data);
  }

  updatePrinterJob(id, data) {
    let cachedPrinterJob = this.#cachedJobProgress[id];
    if (!cachedPrinterJob) {
      throw new Error(`this printer ID ${id} is not known. Cant update printer job cache.`);
    }

    cachedPrinterJob.job = data.job;
    cachedPrinterJob.progress = data.progress;
    cachedPrinterJob.currentZ = data.currentZ;

    this.#cachedJobProgress[id] = cachedPrinterJob;
  }

  // let spoolCost = 0;
  // let totalVolume = 0;
  // let totalLength = 0;
  // let totalWeight = 0;
  // if (!!currentJob.expectedFilamentCosts) {
  //   const keys = Object.keys(currentJob.expectedFilamentCosts);
  //   for (let s = 0; s < currentJob.expectedFilamentCosts.length; s++) {
  //     const toolFilamentCosts = currentJob.expectedFilamentCosts[s][`tool${keys[s]}`];
  //     if (!!toolFilamentCosts) {
  //       spoolCost += floatOrZero(toolFilamentCosts.cost);
  //       totalVolume += floatOrZero(toolFilamentCosts.volume);
  //       totalLength += floatOrZero(toolFilamentCosts.length);
  //       totalWeight += floatOrZero(toolFilamentCosts.weight);
  //     }
  //   }
  // }
  //
  // spoolCost = floatOrZero(spoolCost);
  // currentJob.expectedTotals = {
  //   // TODO String a good idea?
  //   totalCost: (parseFloat(currentJob.expectedPrinterCosts) + spoolCost).toFixed(2),
  //   totalVolume,
  //   totalLength,
  //   totalWeight,
  //   spoolCost
  // };
  //

  // TODO do a 'set state call' instead
  // if (!!printerState.systemChecks) {
  //   const systemCleaningJob = printerState.systemChecks.cleaning.job;
  //   systemCleaningJob.status = "success";
  //   systemCleaningJob.date = new Date();
  // }
}

module.exports = JobsCache;
