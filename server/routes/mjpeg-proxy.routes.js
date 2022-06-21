const express = require("express");
const router = express.Router();
const request = require("request");
const { ensureAuthenticated } = require("../middleware/auth");
const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const { validateParamsMiddleware } = require("../middleware/validators");
const M_VALID = require("../constants/validate-mongo.constants");

router.get("/:id", ensureAuthenticated, validateParamsMiddleware(M_VALID.MONGO_ID), (req, res) => {
  const id = req.paramString("id");
  const { camURL } = getPrinterStoreCache().getPrinter(id);
  const pipe = request(camURL).pipe(res);
  pipe.on("error", function () {
    console.log("error handling is needed because pipe will break once pipe.end() is called");
  });
  //client quit normally
  req.on("end", function () {
    pipe.end();
  });
  //client quit unexpectedly
  req.on("close", function () {
    pipe.end();
  });
});

module.exports = router;
