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

router.get(
  "/:id/:item(*)",
  ensureAuthenticated,
  validateParamsMiddleware(M_VALID.MONGO_ID),
  (req, res) => {
    const id = req.paramString("id");
    const item = req.paramString("item");
    const { printerURL, apikey } = getPrinterStoreCache().getPrinter(id);
    let redirectedRequest;

    const redirectUrl = `${printerURL}/${item}`;
    if (req.headers["content-type"] && req.headers["content-type"].match(/^multipart\/form-data/)) {
      redirectedRequest = request({
        url: redirectUrl,
        method: req.method,
        body: req.readable ? undefined : req.body,
        headers: req.headers,
        json: req.readable ? false : true,
        qs: req.query,
        // Pass redirect back to the browser
        followRedirect: true
      });
    } else {
      redirectedRequest = request({
        url: redirectUrl,
        method: req.method,
        body: req.readable ? undefined : req.body,
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apikey
        },
        json: req.readable ? false : true,
        qs: req.query,
        // Pass redirect back to the browser
        followRedirect: true
      });
    }
    if (req.readable) {
      // Handles all the streamable data (e.g. image uploads)
      req.pipe(redirectedRequest).pipe(res);
    } else {
      // Handles everything else
      redirectedRequest.pipe(res);
    }
    redirectedRequest.on("error", function () {
      logger.error("Error pipe broken for mjpeg stream");
    });
    //client quit normally
    redirectedRequest.on("end", function () {
      logger.info("Pipe ended on octoprint proxy");
      redirectedRequest.end();
    });
    //client quit unexpectedly
    redirectedRequest.on("close", function () {
      logger.warning("Pipe unexpectedly ended on octoprint proxy");
      redirectedRequest.end();
    });
  }
);

module.exports = router;
