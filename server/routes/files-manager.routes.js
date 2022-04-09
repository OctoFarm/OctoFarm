const express = require("express");

const router = express.Router();

const request = require("request");

const { ensureAuthenticated } = require("../middleware/auth");

const { getPrinterStoreCache } = require("../cache/printer-store.cache");

router.post("/uploadFile/:id", ensureAuthenticated, async (req, res) => {
  const printer_id = req.paramString("id");

    console.log(req)

    const url = getPrinterStoreCache().getPrinterFileUploadURL(printer_id);

    console.log(url)

    req.pipe(request(url)).pipe(res)
});


module.exports = router;