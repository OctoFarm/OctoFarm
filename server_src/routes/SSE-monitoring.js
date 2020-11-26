const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const { parse, stringify } = require("flatted/cjs");
const _ = require("lodash");
const Logger = require("../lib/logger.js");

const logger = new Logger("OctoFarm-API");
//Global store of dashboard info... wonder if there's a cleaner way of doing all this?!
let clientInformation = null;

const printerClean = require("../lib/dataFunctions/printerClean.js");
const PrinterClean = printerClean.PrinterClean;
const settingsClean = require("../lib/dataFunctions/settingsClean.js");
const SettingsClean = settingsClean.SettingsClean;
const { getSorting, getFilter } = require("../lib/sorting.js");

// User Modal
const runner = require("../runners/state.js");
const Runner = runner.Runner;

let clients = [];
let interval = false;

const sortMe = function (printers) {
  let sortBy = getSorting();
  if (sortBy === "index") {
    return printers;
  } else if (sortBy === "percent") {
    let sortedPrinters = printers.sort(function (a, b) {
      if (typeof a.currentJob === "undefined") return -1;
      if (typeof b.currentJob === "undefined") return -1;
      return (
        parseFloat(a.currentJob.percent) - parseFloat(b.currentJob.percent)
      );
    });
    let i = 0,
      len = sortedPrinters.length;
    while (i + 1 < len + 1) {
      sortedPrinters[i].order = i;
      i++;
    }
    return sortedPrinters;
  } else if (sortBy === "time") {
    let sortedPrinters = printers.sort(function (a, b) {
      if (typeof a.currentJob === "undefined") return -1;
      if (typeof b.currentJob === "undefined") return -1;
      return (
        parseFloat(a.currentJob.printTimeRemaining) -
        parseFloat(b.currentJob.printTimeRemaining)
      );
    });
    let i = 0,
      len = sortedPrinters.length;
    while (i + 1 < len + 1) {
      sortedPrinters[i].order = i;
      i++;
    }
    return sortedPrinters;
  } else {
    return printers;
  }
};
const filterMe = function (printers) {
  let filterBy = getFilter();
  let currentGroups = Runner.returnGroupList();
  if (filterBy === "All Printers") {
    return printers;
  } else if (filterBy === "State: Active") {
    let i = 0,
      len = printers.length;
    while (i < len) {
      printers[i].display =
        printers[i].printerState.colour.category === "Active";
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
      printers[i].display =
        printers[i].printerState.colour.category === "Disconnected";
      i++;
    }
    return printers;
  } else if (filterBy === "State: Complete") {
    let i = 0,
      len = printers.length;
    while (i < len) {
      printers[i].display =
        printers[i].printerState.colour.category === "Complete";
      i++;
    }
    return printers;
  } else {
    //Check groups...
    let current = null;
    for (let i = 0; i < currentGroups.length; i++) {
      if (filterBy === currentGroups[i]) {
        current = currentGroups[i];
      }
    }
    if (current !== null) {
      let i = 0,
        len = printers.length;
      while (i < len) {
        printers[i].display =
          printers[i].group === current.replace("Group: ", "");
        i++;
      }
      return printers;
    } else {
      //Fall back...
      return printers;
    }
  }
};
if (interval === false) {
  interval = setInterval(async function () {
    const currentOperations = await PrinterClean.returnCurrentOperations();

    let printersInformation = await PrinterClean.returnPrintersInformation();

    printersInformation = await filterMe(printersInformation);
    printersInformation = await sortMe(printersInformation);
    const printerControlList = await PrinterClean.returnPrinterControlList();
    let clientSettings = await SettingsClean.returnClientSettings();
    if (typeof clientSettings === "undefined") {
      await SettingsClean.start();
      clientSettings = await SettingsClean.returnClientSettings();
    }
    const infoDrop = {
      printersInformation: printersInformation,
      currentOperations: currentOperations,
      printerControlList: printerControlList,
      clientSettings: clientSettings,
    };
    clientInformation = await stringify(infoDrop);
    clients.forEach((c, index) => {
      c.res.write("data: " + clientInformation + "\n\n");
    });
  }, 500);
}

// Called once for each new client. Note, this response is left open!
router.get("/get/", ensureAuthenticated, function (req, res) {
  // Mandatory headers and http status to keep connection open
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: 0,
    Connection: "keep-alive",
  };
  res.writeHead(200, headers);
  // After client opens connection send all nests as string
  const data = "data: " + clientInformation + "\n\n";
  res.write(data);
  // Generate an id based on timestamp and save res
  // object of client connection on clients list
  // Later we'll iterate it and send updates to each client
  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res,
  };
  clients.push(newClient);
  logger.info(`${clientId} Connection opened`);
  // When client closes connection we update the clients list
  // avoiding the disconnected one
  req.on("close", () => {
    logger.info(`${clientId} Connection closed`);
    clients = clients.filter((c) => c.id !== clientId);
  });
});

module.exports = router;
