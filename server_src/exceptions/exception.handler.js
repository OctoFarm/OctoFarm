const { NotFoundException } = require("./runtime.exceptions");

// https://dev.to/rajajaganathan/express-scalable-way-to-handle-errors-1kd6
function exceptionHandler(err, req, res, next) {
  if (err instanceof NotFoundException) {
    const code = err.statusCode || 404;
    return res.status(code).send();
  }
  if (!!err) {
    const code = err.statusCode || 500;
    return res.status(code).send({
      error: "OctoFarm server experienced an internal error",
      stack: err.stack
    });
  }

  // Will result in not found on API level
  next();
}

module.exports = exceptionHandler;
