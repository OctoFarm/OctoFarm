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
const { getSorting, getFilter } = require("../routes/sorting.js");

let clients = [];
let interval = false;

const sortMe = function (printers) {
  let sortBy = getSorting();
  return printers;
};

const filterMe = function (printers) {
  let filterBy = getFilter();
  if (filterBy === "none") {
    return printers;
  } else if (filterBy === "Active") {
    return printers.filter(function (printer) {
      return printer.printerState.state === "Active";
    });
  } else if (filterBy === "Idle") {
    return printers.filter(function (printer) {
      return printer.printerState.state === "Idle";
    });
  } else if (filterBy === "Offline") {
    return printers.filter(function (printer) {
      return printer.printerState.state === "Offline";
    });
  }
};
if (interval === false) {
  interval = setInterval(async function () {
    const currentOperations = await PrinterClean.returnCurrentOperations();

    let printersInformation = await PrinterClean.returnPrintersInformation();

    printersInformation = filterMe(printersInformation);
    printersInformation = sortMe(printersInformation);

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
