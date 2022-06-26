const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const request = require("request");
const Logger = require("../handlers/logger");
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");

const logger = new Logger(LOGGER_ROUTE_KEYS.MIDDLEWARE_OCTOPRINT_PROXY);

module.exports = {
    async proxyOctoPrintClientRequests(req, res) {
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
};