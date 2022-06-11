const morgan = require("morgan");

const Logger = require("../handlers/logger");
const { AppConstants } = require("../constants/app.constants");
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");

const logger = new Logger(LOGGER_ROUTE_KEYS.MIDDLEWARE_MORGAN);

const morganMiddleware = morgan(
  function (tokens, req, res) {
    return [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, "content-length"),
      "-",
      tokens["response-time"](req, res),
      "ms"
    ].join(" ");
  },
  {
    // specify a function for skipping requests without errors
    skip: (req, res) => {
      if (process.env[AppConstants.LOG_LEVEL] !== "silly") {
        return res.statusCode < 400;
      } else {
        return false;
      }
    },
    stream: {
      write: (msg) => logger.http(msg)
    }
  }
);

module.exports = morganMiddleware;
