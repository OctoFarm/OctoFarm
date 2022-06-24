const express = require("express");
const router = express.Router();
const request = require("request");
const { ensureAuthenticated } = require("../middleware/auth");
const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const { validateParamsMiddleware } = require("../middleware/validators");
const M_VALID = require("../constants/validate-mongo.constants");

const Logger = require("../handlers/logger");
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");
const MjpegDecoder = require("mjpeg-decoder");
const logger = new Logger(LOGGER_ROUTE_KEYS.ROUTE_CAMERA_PROXY);

const currentProxies = [];

router.get(
  "/:id",
  ensureAuthenticated,
  validateParamsMiddleware(M_VALID.MONGO_ID),
  async (req, res) => {
    const id = req.paramString("id");
    const { camURL } = getPrinterStoreCache().getPrinter(id);
    const decoder = MjpegDecoder.decoderForSnapshot(camURL);
    const frame = await decoder.takeSnapshot();
    console.log(frame)
    res.send(frame);
  }
);

module.exports = router;
