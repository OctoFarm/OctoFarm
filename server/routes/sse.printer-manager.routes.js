const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middleware/auth");
const { stringify } = require("flatted");
const { getEventEmitterCache } = require("../cache/event-emitter.cache");
//Global store of dashboard info... wonder if there's a cleaner way of doing all this?!
let clientInformation = null;

const printerTicker = require("../services/printer-connection-log.service.js");
const { ensureCurrentUserAndGroup } = require("../middleware/users.js");

const { PrinterTicker } = printerTicker;

const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const { getPrinterManagerCache } = require("../cache/printer-manager.cache");

let clientId = 0;
const clients = {}; // <- Keep a map of attached clients
let interval = false;

// Called once for each new client. Note, this response is left open!
router.get("/get/", ensureAuthenticated, ensureCurrentUserAndGroup, function (req, res) {
  //req.socket.setTimeout(Number.MAX_VALUE);
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: 0,
    Connection: "keep-alive"
  });
  res.write("\n");
  (function (clientId) {
    clients[clientId] = res; // <- Add this client to those we consider "attached"
    req.on("close", function () {
      delete clients[clientId];
    }); // <- Remove this client when he disconnects
    req.on("error", function () {
      delete clients[clientId];
    }); // <- Remove this client when he disconnects
  })(++clientId);
  //console.log("Client: " + Object.keys(clients));
});

if (interval === false) {
  interval = setInterval(async function () {
    let printersInformation = getPrinterStoreCache().listPrintersInformationForPrinterManager();
    printersInformation = printersInformation.map((p) => {
      p.registeredEvents = getEventEmitterCache().get(p._id);
      return p;
    });
    const printerControlList = getPrinterManagerCache().getPrinterControlList();
    const currentTickerList = PrinterTicker.returnIssue();

    const infoDrop = {
      printersInformation: printersInformation,
      printerControlList: printerControlList,
      currentTickerList: currentTickerList
    };
    clientInformation = stringify(infoDrop);
    for (clientId in clients) {
      clients[clientId].write("retry:" + 10000 + "\n");
      clients[clientId].write("data: " + clientInformation + "\n\n"); // <- Push a message to a single attached client
    }
  }, 500);
}

module.exports = router;
