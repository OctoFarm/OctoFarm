function getJobAnalysis(job, printTime) {
  return !!job
    ? {
        actualPrintTime: printTime,
        estimatedPrintTime: job.estimatedPrintTime,
        printTimeAccuracy: ((printTime - job.estimatedPrintTime) / printTime) * 10000 // TODO can become NaN (2x)
      }
    : null;
}

module.exports = {
  getJobAnalysis
};
