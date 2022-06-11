const winston = require("winston");
const { AppConstants } = require("../constants/app.constants");
const { logRouteToFileMap } = require("../constants/logger.constants")

const dtFormat = new Intl.DateTimeFormat("en-GB", {
  timeStyle: "medium",
  dateStyle: "short",
  timeZone: "UTC"
});

const COLOURS = {
  RED: "\033[0;31m",
  YELLOW: "\033[1;33m",
  ORANGE: "\033[0;33m",
  BLUE: "\033[0;34m",
  PURPLE: "\033[0;35m",
  WHITE: "\033[1;37m",
  CYAN: "\033[0;32m"
};

const COLOUR_MAP = {
  info: COLOURS.BLUE,
  warn: COLOURS.ORANGE,
  debug: COLOURS.ORANGE,
  error: COLOURS.RED,
  http: COLOURS.PURPLE,
  silly: COLOURS.CYAN
};

const LEVELS = {
  error: 0,
  warn: 1,
  http: 2,
  info: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

dateFormat = () => {
  return dtFormat.format(new Date());
};

class LoggerService {
  constructor(route, enableFileLogs = true, logFilterLevel = undefined) {
    if (!logFilterLevel) {
      logFilterLevel = process.env[AppConstants.LOG_LEVEL];
    }

    this.log_data = null;
    this.route = route;

    let alignColorsAndTime = winston.format.combine(
      winston.format.printf((info) => {
        const level = info.level.toUpperCase();
        const date = dateFormat();
        let metaData = undefined;
        if (!!info?.meta) {
          if (typeof info.meta === "string" || typeof info.meta === "number") {
            metaData = info.meta;
          } else {
            metaData = Object.assign({}, info.meta);
            metaData = JSON.stringify(metaData);
          }
        }
        let message = `${COLOUR_MAP[info.level]}${date} ${COLOURS.WHITE}| ${
          COLOUR_MAP[info.level]
        }${level} ${COLOURS.WHITE}| ${COLOUR_MAP[info.level]}${route} ${COLOURS.WHITE} \n ${
          COLOUR_MAP[info.level]
        }${level} MESSAGE: ${COLOURS.WHITE}${info.message} `;
        message = metaData ? message + `| ${COLOURS.WHITE}${metaData}` : message;
        return message;
      })
    );

    let prettyPrintMyLogs = winston.format.combine(
      winston.format.printf((info) => {
        const level = info.level.toUpperCase();
        const date = dateFormat();
        let metaData = undefined;
        if (!!info?.meta) {
          if (typeof info.meta === "string" || typeof info.meta === "number") {
            metaData = info.meta;
          } else {
            metaData = Object.assign({}, info.meta);
            metaData = JSON.stringify(metaData);
          }
        }
        let message = `${date} | ${level} | ${route} \n ${level} MESSAGE: ${info.message} `;
        message = metaData ? message + `: ${metaData} ` : message;
        return message;
      })
    );

    this.logger = winston.createLogger({
      levels: LEVELS,
      transports: [
        new winston.transports.Console({
          level: logFilterLevel,
          format: alignColorsAndTime
        }),
        ...(enableFileLogs
          ? [
              new winston.transports.File({
                level: logFilterLevel,
                format: prettyPrintMyLogs,
                filename: `../logs/${logRouteToFileMap[this.route]}.log`,
                maxsize: 5242880,
                maxFiles: 3
              })
            ]
          : [])
      ]
    });
  }

  info(message, meta) {
    this.logger.log("info", message, {
      meta
    });
  }

  warning(message, meta) {
    this.logger.log("warn", message, {
      meta
    });
  }

  http(message, meta) {
    this.logger.log("http", message, {
      meta
    });
  }

  debug(message, meta) {
    this.logger.log("debug", message, {
      meta
    });
  }

  error(message, meta) {
    this.logger.log("error", message, { meta });
  }

  silly(message, meta) {
    this.logger.log("silly", message, { meta });
  }
}

module.exports = LoggerService;
