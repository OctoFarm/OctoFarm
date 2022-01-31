const { HistoryClean } = require("../services/history-cleaner.service");

let historyCleanState = new HistoryClean();

function getHistoryCache() {
  return historyCleanState;
}

async function initHistoryCache() {
  if (!!historyCleanState) {
    await historyCleanState.initCache();
  } else {
    // Will never occur.
    throw new Error("Cant init unconstructed historyCache.");
  }
}

module.exports = {
  getHistoryCache,
  initHistoryCache
};
