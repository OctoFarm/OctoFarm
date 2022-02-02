const { ValidationException, NotFoundException } = require("./runtime.exceptions");
const { AppConstants } = require("../constants/app.constants");

// https://dev.to/rajajaganathan/express-scalable-way-to-handle-errors-1kd6
function exceptionHandler(err, req, res, next) {
  const isTest = process.env.NODE_ENV === AppConstants.defaultTestEnv;
  if (!isTest) {
    console.error("[API Exception Handler]", err.stack);
  }
  if (err instanceof NotFoundException) {
    const code = err.statusCode || 404;
    return res.status(code).send();
  }
  if (err instanceof ValidationException) {
    const code = err.statusCode || 400;
    return res.status(code).send({
      error: "OctoFarm API did not accept this input",
      type: err.name,
      errors: err.errors
    });
  }
  if (!!err) {
    const code = err.statusCode || 500;
    return res.status(code).send({
      error: "OctoFarm server experienced an internal error",
      type: err.name,
      stack: err.stack
    });
  }

  // Will result in not found on API level
  next();
}

module.exports = exceptionHandler;
