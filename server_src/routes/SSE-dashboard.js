const express = require("express");
const router = express.Router();
const { stringify } = require("flatted");
const { ensureAuthenticated } = require("../config/auth");
const { PrinterClean } = require("../lib/dataFunctions/printerClean.js");
const { SettingsClean } = require("../lib/dataFunctions/settingsClean.js");
const { getDefaultDashboardSettings } = require("../lib/providers/settings.constants");

// Global store of dashboard info... wonder if there's a cleaner way of doing all this?!
let clientInformation = null;
let clientId = 0;
const clients = {}; // <- Keep a map of attached clients
let interval = false;

// Called once for each new client. Note, this response is left open!
router.get("/get/", ensureAuthenticated, async function (req, res) {
  //req.socket.setTimeout(Number.MAX_VALUE);
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: 0,
    Connection: "keep-alive"
  });
  // res.write("\n");
  (function (clientId) {
    clients[clientId] = res; // <- Add this client to those we consider "attached"
    req.on("close", function () {
      delete clients[clientId];
    }); // <- Remove this client when he disconnects
    req.on("error", function () {
      delete clients[clientId];
    }); // <- Remove this client when he errors out
  })(++clientId);
  await sendData(req?.user?.clientSettings._id || null, false);
});

async function sendData(clientSettingsID, timeout) {
  await PrinterClean.statisticsStart();
  let clientsSettingsCache = await SettingsClean.returnClientSettings(clientSettingsID);
  if (!clientsSettingsCache) {
    await SettingsClean.start();
    clientsSettingsCache = await SettingsClean.returnClientSettings(clientSettingsID);
  }

  let dashboardSettings = clientsSettingsCache.dashboard;
  if (!dashboardSettings) {
    dashboardSettings = getDefaultDashboardSettings();
  }

  const currentOperations = await PrinterClean.returnCurrentOperations();
  const dashStatistics = await PrinterClean.returnDashboardStatistics();
  const printerInformation = await PrinterClean.listPrintersInformation();
  const infoDrop = {
    printerInformation,
    currentOperations,
    dashStatistics,
    dashboardSettings
  };

  clientInformation = stringify(infoDrop);
  for (clientId in clients) {
    clients[clientId].write("retry:" + 10000 + "\n");
    clients[clientId].write("data: " + clientInformation + "\n\n"); // <- Push a message to a single attached client
  }
  if (timeout) {
    setTimeout(async function () {
      await sendData(clientSettingsID, true);
    }, 5000);
  }
}

// if (interval === false) {
//   interval = setInterval(async function () {
//     await sendData();
//   }, 5000);
// }

module.exports = router;
