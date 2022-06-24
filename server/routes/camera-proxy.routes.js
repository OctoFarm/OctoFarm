const express = require("express");
const router = express.Router();
const request = require("request");
const { ensureAuthenticated } = require("../middleware/auth");
const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const { validateParamsMiddleware } = require("../middleware/validators");
const M_VALID = require("../constants/validate-mongo.constants");

const Logger = require("../handlers/logger");
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");
const logger = new Logger(LOGGER_ROUTE_KEYS.ROUTE_CAMERA_PROXY);

const currentProxies = [];

router.get(
  "/:id",
  ensureAuthenticated,
  validateParamsMiddleware(M_VALID.MONGO_ID),
  async (req, res) => {
    const id = req.paramString("id");
    const { camURL } = getPrinterStoreCache().getPrinter(id);
    const multipart = "--totalmjpeg";
    req.headers["Cache-Control"] = "private, no-cache, no-store, max-age=0";
    req.headers["Content-Type"] = `multipart/x-mixed-replace; boundary="${multipart}"`;
    req.headers.Connection = "close";
    req.headers.Pragma = "no-cache";

    const cameraProxy = await request(camURL);

    cameraProxy.pipe(res);

    cameraProxy.on("error", function () {
      logger.error("Error pipe broken for mjpeg stream");
    });
    //client quit normally
    req.on("end", function () {
      logger.info("Pipe ended for mjpeg stream");
      cameraProxy.end();
    });
    //client quit unexpectedly
    req.on("close", function () {
      logger.warning("Pipe unexpectedly ended for mjpeg stream");
      cameraProxy.end();
    });
  }
);

module.exports = router;
