const promiseTimeout = function (ms, promise) {
  // Create a promise that rejects in <ms> milliseconds
  let timeout = new Promise((_resolve, reject) => {
    let id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error("Timed out in " + ms + "ms."));
    }, ms);
  });
  // Returns a race between our timeout and the passed in promise
  return Promise.race([promise, timeout]);
};

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

module.exports = {
  promiseTimeout,
  sleep
};
