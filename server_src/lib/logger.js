const winston = require("winston");

const isProduction = process.env.NODE_ENV === "production";

const dtFormat = new Intl.DateTimeFormat('en-GB', {
  timeStyle: 'medium',
  dateStyle: 'short',
  timeZone: 'UTC'
});

dateFormat = () => {
  return dtFormat.format(new Date());
};

class LoggerService {
  constructor(route, enableFileLogs = true) {
    this.log_data = null;
    this.route = route;
    this.logger = winston.createLogger({
      transports: [
        new winston.transports.Console({
          level: "info",
        }),
        ...(enableFileLogs
          ? [
            new winston.transports.File({
              level: isProduction ? "warn" : "info",
              filename: `./logs/${route}.log`,
              maxsize: "5000000",
              maxFiles: 5,
            }),
          ]
          : []),
      ],
      format: winston.format.printf((info) => {
        let message = `${dateFormat()} | ${info.level.toUpperCase()} | ${route} | ${
          info.message
        }`;
        message = info.obj
          ? message + `data:${JSON.stringify(info.obj)} | `
          : message;
        message = this.log_data
          ? message + `log_data:${JSON.stringify(this.log_data)} | `
          : message;
        return message;
      }),
    });
  }

  setLogData(log_data) {
    this.log_data = log_data;
  }

  info(message, obj) {
    this.logger.log("info", message, {
      obj,
    });
  }

  warning(message, obj) {
    this.logger.log("warning", message, {
      obj,
    });
  }

  debug(message, obj) {
    this.logger.log("debug", message, {
      obj,
    });
  }

  error(message, obj) {
    this.logger.log("error", message, {
      obj,
    });
  }
}

module.exports = LoggerService;
