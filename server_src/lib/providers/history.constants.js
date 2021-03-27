function getHistoryCleanDefault() {
  return {
    completed: 0,
    cancelled: 0,
    failed: 0,
    longestPrintTime: 0,
    shortestPrintTime: 0,
    averagePrintTime: 0,
    mostPrintedFile: 0,
    printerMost: 0,
    printerLoad: 0,
    totalFilamentUsage: 0,
    averageFilamentUsage: 0,
    highestFilamentUsage: 0,
    lowestFilamentUsage: 0,
    totalSpoolCost: 0,
    highestSpoolCost: 0,
    totalPrinterCost: 0,
    highestPrinterCost: 0,
    currentFailed: 0,
  };
}

module.exports = {
  getHistoryCleanDefault
};