const { getCompletionDate } = require("../../../server_src/utils/time.util");
const { configureContainer } = require("../../../server_src/container");
const DITokens = require("../../../server_src/container.tokens");
const { getJobCacheDefault } = require("../../../server_src/constants/cache.constants");

// Before luxon
function legacyUUTGetCompletionDate(printTimeLeft, completion) {
  let currentDate = new Date();
  let dateComplete = "";
  if (completion === 100) {
    dateComplete = "No Active Job";
  } else {
    currentDate = currentDate.getTime();
    const futureDateString = new Date(currentDate + printTimeLeft * 1000).toDateString();
    let futureTimeString = new Date(currentDate + printTimeLeft * 1000).toTimeString();
    futureTimeString = futureTimeString.substring(0, 5);
    dateComplete = `${futureDateString}: ${futureTimeString}`;
  }
  return dateComplete;
}

describe("getCompletionDate", () => {
  it("should calculate formatted completion date", async function () {
    const completionDate = getCompletionDate(10, 99);
    expect(completionDate).toBeTruthy();
    const cutoffDate = completionDate.substring(0, completionDate.length - 1 - 4);
    const refCutoffDate = legacyUUTGetCompletionDate(10, 99).substring(
      0,
      completionDate.length - 1 - 4
    );
    expect(cutoffDate).toEqual(refCutoffDate);
  });
});

const printerId1 = "asd";
const copiedFileName = "bla.geezcode";
const websocketCurrentMsg = {
  currentZ: 1.0,
  progress: {},
  job: {
    file: {
      name: copiedFileName // Crucial?
    }
  }
};

const websocketCurrentMsgNoProgress = {
  currentZ: 1.0,
  job: {
    file: {
      name: copiedFileName // Crucial?
    }
  }
};

let container;
let jobsCache;
beforeAll(async () => {
  container = configureContainer();
  jobsCache = container.resolve(DITokens.jobsCache);
});

describe("JobsCache", () => {
  it("should generate printer job report", async function () {
    const printerId2 = "asd2";

    jobsCache.savePrinterJob(printerId1, websocketCurrentMsg);
    const printerJob = jobsCache.getPrinterJob(printerId1);
    expect(printerJob.job.file.name).toEqual(copiedFileName);
    expect(printerJob).toEqual(websocketCurrentMsg);

    const printerJobDefault = jobsCache.getPrinterJob(printerId2);
    expect(printerJobDefault).toEqual(getJobCacheDefault());
  });

  it("should not tolerate saving without id", () => {
    expect(() => jobsCache.getPrinterJob()).toThrow(
      "Job Cache cant get a null/undefined printer id"
    );
  });

  it("should not tolerate updating with wrong id", () => {
    expect(() => jobsCache.updatePrinterJob()).toThrow(
      `this printer ID undefined is not known. Cant update printer job cache.`
    );
  });

  it("should be able to get serializable job progress", () => {
    jobsCache.savePrinterJob(printerId1, websocketCurrentMsg);

    expect(jobsCache.jobExists(printerId1)).toBeTruthy();

    const flatJob = jobsCache.getPrinterJobFlat(printerId1);
    expect(flatJob).toHaveProperty("fileName");

    // jobsCache.postProcessJob is work-in-progress due to the costSettings input
  });

  it("should be able to get serializable job without progress", () => {
    jobsCache.savePrinterJob(printerId1, websocketCurrentMsgNoProgress);

    const noProgressJob = jobsCache.getPrinterJobFlat(printerId1);
    expect(noProgressJob.progress).toEqual(0);
  });

  it("should throw for serializing unknown printer job id", () => {
    jobsCache.getPrinterJobFlat("nonexistingid");
  });
});
