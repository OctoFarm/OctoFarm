const rateLimit = require("express-rate-limit");

//Something seriously wrong if they're requesting 10000 in a minute...
const octofarmGlobalLimits = rateLimit({
  windowMs: 5 * 1000, // 5 seconds in milliseconds
  max: 10000,
  headers: true,
  handler: function (req, res /*next*/) {
    return res.status(429).json({
      error:
        "You have exceeded the 10000 requests in 5 second limit! What in the hell we're you doing?"
    });
  }
});

// Just to protect printer actions further, don't let multiple calls break things.
const printerActionLimits = rateLimit({
  windowMs: 60 * 1000, // 1 minute in milliseconds
  max: 1000,
  headers: true,
  handler: function (req, res /*next*/) {
    return res.status(429).json({
      error: "You have exceeded the 1000 requests in 1 minute limit! Please try again in 1 minute."
    });
  }
});

//TODO rest of the endpoints

module.exports = {
  octofarmGlobalLimits,
  printerActionLimits
};
