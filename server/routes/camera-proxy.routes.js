const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middleware/auth");
const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const { validateParamsMiddleware } = require("../middleware/validators");
const M_VALID = require("../constants/validate-mongo.constants");
const Logger = require("../handlers/logger");
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");
const { getMjpegProxyCache } = require("../cache/mjpeg-proxy.cache");

const logger = new Logger(LOGGER_ROUTE_KEYS.ROUTE_CAMERA_PROXY);

router.get(
  "/:id",
  ensureAuthenticated,
  validateParamsMiddleware(M_VALID.MONGO_ID),
  async (req, res) => {
    const id = req.paramString("id");
    const { camURL } = getPrinterStoreCache().getPrinter(id);

    logger.debug(`Requesting new HTTP Stream for ${id} with ${camURL}`);

    await getMjpegProxyCache().setupNewCamera(id, camURL);
    res.contentType("image/jpeg");
    res.send(await getMjpegProxyCache().getNewestFrame(id));
  }
);

module.exports = router;
