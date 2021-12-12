const { HistoryClean } = require("../lib/dataFunctions/historyClean");

// TODO what an utterly pointless file... history clean is the cache you absolute melt! I know let's complicate shit and make two cache...
// This is why the history ain't refreshing there's no way to actual refresh the cache!

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
