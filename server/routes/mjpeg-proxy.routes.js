const express = require("express");
const router = express.Router();
const request = require("request");
const { ensureAuthenticated } = require("../middleware/auth");
const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const { validateParamsMiddleware } = require("../middleware/validators");
const M_VALID = require("../constants/validate-mongo.constants");

router.get(
  "/:id",
  ensureAuthenticated,
  validateParamsMiddleware(M_VALID.MONGO_ID),
  (req, res) => {}
);

module.exports = router;
