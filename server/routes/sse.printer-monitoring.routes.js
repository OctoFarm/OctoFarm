const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middleware/auth");
const { stringify } = require("flatted");
const _ = require("lodash");
const Logger = require("../handlers/logger.js");
const {
  getCurrentOperations
} = require("../services/printer-statistics.service");

const logger = new Logger("OctoFarm-API");
//Global store of dashboard info... wonder if there's a cleaner way of doing all this?!
let clientInformation = null;
let clientId = 0;
const clients = {}; // <- Keep a map of attached clients
let interval = false;

const { SettingsClean } = require("../services/settings-cleaner.service.js");
const { getSorting, getFilter } = require("../services/front-end-sorting.service.js");
const { writePoints } = require("../services/influx-export.service.js");
// User Modal
const { ensureCurrentUserAndGroup } = require("../middleware/users.js");
const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const { getPrinterManagerCache } = require("../cache/printer-manager.cache");

let influxCounter = 5000;

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
  const currentOperations = getCurrentOperations();

  let printersInformation = getPrinterStoreCache().listPrintersInformationForMonitoringViews();

  printersInformation = await filterMe(printersInformation);
  printersInformation = sortMe(printersInformation);
  const printerControlList = getPrinterManagerCache().getPrinterControlList();

  let serverSettings = SettingsClean.returnSystemSettings();
  if (typeof serverSettings === "undefined") {
    await SettingsClean.start();
    serverSettings = SettingsClean.returnSystemSettings();
  }

  if (!!serverSettings.influxExport?.active) {
    if (influxCounter >= 5000) {
      sendToInflux(printersInformation);
      influxCounter = 0;
    } else {
      influxCounter = influxCounter + 500;
    }
    // eslint-disable-next-line no-use-before-define
  }

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
      currentOperations: currentOperations,
      printerControlList: printerControlList,
      clientSettings: clientSettings
    };
    clientInformation = stringify(infoDrop);
    clients[clientId].res.write("data: " + clientInformation + "\n\n");
  }
}

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

function sendToInflux(printersInformation) {
  //console.log(printersInformation[0]);
  printersInformation.forEach((printer) => {
    if (printer.printerState.colour.category !== "Offline") {
      const date = Date.now();

      const tags = {
        name: printer?.printerName ? printer.printerName : " ",
        group: printer?.group ? printer.group : " ",
        url: printer?.printerURL ? printer.printerURL : " ",
        state: printer?.printerState?.state ? printer.printerState.state : " ",
        stateCategory: printer?.printerState?.colour?.category ? printer.printerState?.colour?.category : " ",
        host_state: printer?.hostState?.state ? printer.hostState?.state : " ",
        websocket_state: printer?.webSocketState?.colour ? printer.webSocketState?.colour : " ",
        octoprint_version: printer?.octoPrintVersion ? printer.octoPrintVersion : " "
      };
      const printerData = {
        name: printer?.printerName ? printer.printerName : " ",
        group: printer?.group ? printer.group : " ",
        url: printer?.printerURL ? printer.printerURL : " ",
        state: printer?.printerState?.state ? printer.printerState.state : " ",
        host_state: printer?.hostState?.state ? printer.hostState.state : " ",
        websocket_state: printer?.webSocketState?.colour ? printer.webSocketState.colour : " ",
        octoprint_version: printer?.octoPrintVersion ? printer.octoPrintVersion : " ",
        state_category: printer?.printerState?.colour?.category ? printer.printerState.colour.category : " ",
        current_idle_time: printer.currentIdle ? parseFloat(printer.currentIdle) : 0,
        current_active_time: printer.currentActive ? parseFloat(printer.currentActive) : 0,
        current_offline_time: printer.currentOffline ? parseFloat(printer.currentOffline) : 0,
        date_added: printer.dateAdded ? parseFloat(printer.dateAdded) : 0,
        storage_free: printer?.storage?.free ? parseFloat(printer.storage.free) : 0,
        storage_total: printer?.storage?.total ? parseFloat(printer.storage.total) : 0,
        timestamp: date
      };
      if (typeof printer.resends !== "undefined") {
        printerData["job_resends"] = `${printer.resends.count} / ${
          printer.resends.transmitted / 1000
        }K (${printer.resends.ratio.toFixed(0)}`;
      }

      if (typeof printer.currentJob !== "undefined" && printer.currentJob !== null) {
        for (const key in printer.currentJob) {
          if (printer.currentJob.hasOwnProperty(key)) {
            if (key === "progress" && printer.currentJob[key] !== null) {
              printerData["job_progress"] = parseFloat(printer.currentJob[key]);
            }
            if (key === "fileName" && printer.currentJob[key] !== null) {
              printerData["job_file_name"] = printer.currentJob[key];
            }
            if (key === "fileDisplay" && printer.currentJob[key] !== null) {
              printerData["job_file_display"] = printer.currentJob[key];
            }
            if (key === "filePath" && printer.currentJob[key] !== null) {
              printerData["job_file_path"] = printer.currentJob[key];
            }
            if (key === "expectedCompletionDate" && printer.currentJob[key] !== null) {
              printerData["job_expected_completion_date"] = printer.currentJob[key];
            }
            if (key === "expectedPrintTime" && printer.currentJob[key] !== null) {
              printerData["job_expected_print_time"] = parseFloat(printer.currentJob[key]);
            }
            if (key === "expectedFilamentCosts" && printer.currentJob[key] !== null) {
            }
            if (key === "expectedPrinterCosts" && printer.currentJob[key] !== null) {
              printerData["job_expected_print_cost"] = parseFloat(printer.currentJob[key]);
            }
            if (key === "expectedTotals" && printer.currentJob[key] !== null) {
            }
            if (key === "currentZ" && printer.currentJob[key] !== null) {
              printerData["job_current_z"] = parseFloat(printer.currentJob[key]);
            }
            if (key === "printTimeElapsed" && printer.currentJob[key] !== null) {
              printerData["job_print_time_elapsed"] = parseFloat(printer.currentJob[key]);
            }
            if (key === "printTimeRemaining" && printer.currentJob[key] !== null) {
              printerData["job_print_time_remaining"] = parseFloat(printer.currentJob[key]);
            }
            if (key === "averagePrintTime" && printer.currentJob[key] !== null) {
              printerData["job_average_print_time"] = parseFloat(printer.currentJob[key]);
            }
            if (key === "lastPrintTime" && printer.currentJob[key] !== null) {
              printerData["job_last_print_time"] = parseFloat(printer.currentJob[key]);
            }
            if (key === "thumbnail" && printer.currentJob[key] !== null) {
              printerData["job_thumbnail"] = printer.currentJob[key];
            }
          }
        }
      }

      if (printer.selectedFilament.length >= 1) {
        printer.selectedFilament.forEach((spool, index) => {
          if (spool !== null) {
            printerData[`tool_${index}_spool_name`] = spool.spools.name;
            printerData[`tool_${index}_spool_used`] = parseFloat(spool.spools.used);
            printerData[`tool_${index}_spool_weight`] = parseFloat(spool.spools.weight);
            printerData[`tool_${index}_spool_temp_offset`] = parseFloat(spool.spools.tempOffset);
            if (typeof spool.spools.material !== "undefined") {
              printerData[`tool_${index}_spool_material`] = spool.spools.material;
            }
          }
        });
      }

      if (
        typeof printer.tools !== "undefined" &&
        printer.tools !== null &&
        printer.tools[0] !== null
      ) {
        for (const key in printer.tools[0]) {
          if (printer.tools[0].hasOwnProperty(key)) {
            if (key !== "time") {
              if (printer.tools[0][key].actual !== null) {
                printerData[key + "_actual"] = parseFloat(printer.tools[0][key].actual);
              } else {
                printerData[key + "_actual"] = 0;
              }
              if (printer.tools[0][key].target !== null) {
                printerData[key + "_target"] = parseFloat(printer.tools[0][key].target);
              } else {
                printerData[key + "_target"] = 0;
              }
            }
          }
        }
      }
      writePoints(tags, "PrintersInformation", printerData);
    }
  });
}

if (interval === false) {
  interval = setInterval(async function () {
    await sendData();
  }, 500);
}

module.exports = router;
