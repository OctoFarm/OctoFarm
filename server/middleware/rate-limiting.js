const rateLimit = require("express-rate-limit");

// This will at least catch something, may remove if it becomes a problem.
const octofarmGlobalLimits = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hrs in milliseconds
  max: 20000,
  message: "You have exceeded the 20000 requests in 1 hr limit!",
  headers: true
});

const printerActionLimits = rateLimit({
  windowMs: 60 * 1000, // 1 minute in milliseconds
  max: 100,
  message: "You have exceeded the 5 requests in 1 minute limit!",
  headers: true
});

module.exports = {
  octofarmGlobalLimits,
  printerActionLimits
};
