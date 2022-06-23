const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const request = require("request");

const Logger = require("../handlers/logger");
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");

const logger = new Logger(LOGGER_ROUTE_KEYS.MIDDLWARE_CAMERA_PROXY);

module.exports = {
  async proxyMjpegStreamRequests(req, res) {
    const id = req.paramString("id");
    const { camURL } = getPrinterStoreCache().getPrinter(id);
    const pipe = request(camURL).pipe(res);
    pipe.on("error", function () {
      logger.error("Error pipe broken for mjpeg stream");
    });
    //client quit normally
    req.on("end", function () {
      logger.info("Pipe ended for mjpeg stream");
      pipe.end();
    });
    //client quit unexpectedly
    req.on("close", function () {
      logger.warning("Pipe unexpectedly ended for mjpeg stream");
      pipe.end();
    });
  }
};
