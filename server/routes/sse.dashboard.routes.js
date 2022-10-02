const express = require("express");
const router = express.Router();
const { stringify } = require("flatted");
const { ensureAuthenticated } = require("../middleware/auth");
const { SettingsClean } = require("../services/settings-cleaner.service.js");
const { getDefaultDashboardSettings } = require("../constants/settings.constants");
const { ensureCurrentUserAndGroup } = require("../middleware/users.js");
const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const {
  getDashboardStatistics,
  generateDashboardStatistics
} = require("../services/printer-statistics.service");

// Global store of dashboard info... wonder if there's a cleaner way of doing all this?!
let clientInformation = null;
let clientId = 0;
const clients = {}; // <- Keep a map of attached clients
let interval = false;

// Called once for each new client. Note, this response is left open!
router.get("/get/", ensureAuthenticated, ensureCurrentUserAndGroup, async function (req, res) {
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
    clients[clientId] = { res, req }; // <- Add this client to those we consider "attached"
    req.on("close", function () {
      delete clients[clientId];
    }); // <- Remove this client when he disconnects
    req.on("error", function () {
      delete clients[clientId];
    }); // <- Remove this client when he errors out
  })(++clientId);
  await sendData();
});

async function sendData() {
  await generateDashboardStatistics();

  const dashStatistics = getDashboardStatistics();
  const printerInformation = getPrinterStoreCache().listPrintersInformation();

  const cameraList = [];

  printerInformation.forEach(p => {
    if(!!p?.camURL && p.camURL.length > 0){
      cameraList.push(p.camURL)
    }
  })
  for (clientId in clients) {
    let clientsSettingsCache = await SettingsClean.returnClientSettings(
      clients[clientId]?.req?.user?.clientSettings?._id || null
    );
    if (!clientsSettingsCache) {
      await SettingsClean.start();
      clientsSettingsCache = await SettingsClean.returnClientSettings(
        clients[clientId]?.req?.user?.clientSettings?._id || null
      );
    }

    let dashboardSettings = clientsSettingsCache.dashboard;
    if (!dashboardSettings) {
      dashboardSettings = getDefaultDashboardSettings();
    }

    const infoDrop = {
      printerInformation,
      dashStatistics,
      dashboardSettings,
      cameraList
    };

    clientInformation = stringify(infoDrop);

    clients[clientId].res.write("retry:" + 10000 + "\n");
    clients[clientId].res.write("data: " + clientInformation + "\n\n"); // <- Push a message to a single attached client
  }
}

if (interval === false) {
  interval = setInterval(async function () {
    await sendData();
  }, 5000);
}

module.exports = router;
