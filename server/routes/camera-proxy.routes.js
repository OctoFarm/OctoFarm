const express = require("express");
const router = express.Router();
const request = require("request");
const { ensureAuthenticated } = require("../middleware/auth");
const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const { validateParamsMiddleware } = require("../middleware/validators");
const M_VALID = require("../constants/validate-mongo.constants");

const Logger = require("../handlers/logger");
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");
const { MjpegDecoderService } = require("../services/printers/mjpeg-decoder.service");

const logger = new Logger(LOGGER_ROUTE_KEYS.ROUTE_CAMERA_PROXY);

const { listActiveClients } = require("../services/server-side-events.service");

let decoder;

if (!decoder) {
  decoder = new MjpegDecoderService();
}

router.get(
  "/:id",
  ensureAuthenticated,
  validateParamsMiddleware(M_VALID.MONGO_ID),
  async (req, res) => {
    // Request, check if camera is already streaming, create if not...
    const id = req.paramString("id");
    const { camURL } = getPrinterStoreCache().getPrinter(id);
    await decoder.setupNewCamera(id, camURL);

    res.send(decoder.getNewestFrame(id));
  }
);

module.exports = router;
