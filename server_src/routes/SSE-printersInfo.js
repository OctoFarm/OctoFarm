const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const { stringify } = require("flatted");
//Global store of dashboard info... wonder if there's a cleaner way of doing all this?!
let clientInformation = null;

const printerClean = require("../lib/dataFunctions/printerClean.js");
const PrinterClean = printerClean.PrinterClean;

const printerTicker = require("../runners/printerTicker.js");
const { ensureCurrentUserAndGroup } = require("../config/users.js");

const { PrinterTicker } = printerTicker;

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
    const printersInformation = PrinterClean.listPrintersInformation();
    const printerControlList = PrinterClean.returnPrinterControlList();
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
