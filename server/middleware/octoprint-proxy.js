const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const request = require("request");
module.exports = {
  async proxyOctoPrintClientRequests(req, res) {
    const id = req.paramString("id");
    const item = req.paramString("item");
    const { printerURL, apikey } = getPrinterStoreCache().getPrinter(id);

    const redirectUrl = `${printerURL}/${item}`;
    const redirectedRequest = request({
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
    if (req.readable) {
      // Handles all the streamable data (e.g. image uploads)
      req.pipe(redirectedRequest).pipe(res);
    } else {
      // Handles everything else
      redirectedRequest.pipe(res);
    }
  }
};
