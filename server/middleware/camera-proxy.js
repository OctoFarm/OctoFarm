const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const request = require("request");
module.exports = {
  async proxyMjpegStreamRequests(req, res) {
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
  }
};
