const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middleware/auth");
const { stringify } = require("flatted");
const _ = require("lodash");
const Logger = require("../handlers/logger.js");
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");

const logger = new Logger(LOGGER_ROUTE_KEYS.ROUTE_SSE_OLD);
//Global store of dashboard info... wonder if there's a cleaner way of doing all this?!
let clientInformation = null;
let clientId = 0;
const clients = {}; // <- Keep a map of attached clients
let interval = false;

const { SettingsClean } = require("../services/settings-cleaner.service.js");
const { getSorting, getFilter } = require("../services/front-end-sorting.service.js");
const { getInfluxCleanerCache } = require("../cache/influx-export.cache");
// User Modal
const { ensureCurrentUserAndGroup } = require("../middleware/users.js");
const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const { getPrinterManagerCache } = require("../cache/printer-manager.cache");

const sortMe = function (printers) {
  const sortBy = getSorting();
  if (sortBy === "time") {
    return _.orderBy(printers, ["currentJob.printTimeRemaining"], "desc");
  } else if (sortBy === "percent") {
    return _.orderBy(printers, ["currentJob.progress"], "desc");
  } else if (sortBy === "index") {
    return _.orderBy(printers, ["sortIndex"], "asc");
  } else {
    return printers;
  }
};
const filterMe = function (printers) {
  let filterBy = getFilter();
  let currentGroups = getPrinterManagerCache().returnGroupList();
  if (filterBy === "All Printers") {
    return printers;
  } else if (filterBy === "State: Active") {
    let i = 0,
      len = printers.length;
    while (i < len) {
      printers[i].display = printers[i].printerState.colour.category === "Active";
      i++;
    }
    return printers;
  } else if (filterBy === "State: Idle") {
    let i = 0,
      len = printers.length;
    while (i < len) {
      printers[i].display = printers[i].printerState.colour.category === "Idle";
      i++;
    }
    return printers;
  } else if (filterBy === "State: Disconnected") {
    let i = 0,
      len = printers.length;
    while (i < len) {
      printers[i].display = printers[i].printerState.colour.category === "Disconnected";
      i++;
    }
    return printers;
  } else if (filterBy === "State: Complete") {
    let i = 0,
      len = printers.length;
    while (i < len) {
      printers[i].display = printers[i].printerState.colour.category === "Complete";
      i++;
    }
    return printers;
  } else {
    //Check groups...
    let current = null;
    for (const element of currentGroups) {
      if (filterBy === element) {
        current = element;
      }
    }
    if (current !== null) {
      let i = 0,
        len = printers.length;
      while (i < len) {
        printers[i].display = printers[i].group === current.replace("Group: ", "");
        i++;
      }
      return printers;
    } else {
      //Fall back...
      return printers;
    }
  }
};
async function sendData() {
  try {
    getInfluxCleanerCache().cleanAndWritePrintersInformationForInflux();
  } catch (e) {
    logger.error("Unable to clean and write information to influx database!", e.toString());
  }

  let printersInformation = getPrinterStoreCache().listPrintersInformationForMonitoringViews();

  printersInformation = await filterMe(printersInformation);
  printersInformation = sortMe(printersInformation);
  const printerControlList = getPrinterManagerCache().getPrinterControlList();

  for (clientId in clients) {
    let clientSettings = SettingsClean.returnClientSettings(
      clients[clientId]?.req?.user?.clientSettings._id || null
    );
    if (typeof clientSettings === "undefined") {
      await SettingsClean.start();
      clientSettings = SettingsClean.returnClientSettings(
        clients[clientId]?.req?.user?.clientSettings._id || null
      );
    }
    const infoDrop = {
      printersInformation: printersInformation,
      printerControlList: printerControlList,
      clientSettings: clientSettings
    };
    clientInformation = stringify(infoDrop);
    clients[clientId].res.write("data: " + clientInformation + "\n\n");
  }
}

// Called once for each new client. Note, this response is left open!
router.get("/get/", ensureAuthenticated, ensureCurrentUserAndGroup, async function (req, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: 0,
    Connection: "keep-alive"
  });
  res.write("\n");
  (function (clientId) {
    clients[clientId] = { req, res }; // <- Add this client to those we consider "attached"
    req.on("close", function () {
      delete clients[clientId];
    }); // <- Remove this client when he disconnects
    req.on("error", function () {
      delete clients[clientId];
    }); // <- Remove this client when he errors out
  })(++clientId);
  await sendData();
});

if (interval === false) {
  interval = setInterval(async function () {
    await sendData();
  }, 1000);
}

module.exports = router;
