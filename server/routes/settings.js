const express = require("express");

const router = express.Router();
const { ensureCurrentUserAndGroup } = require("../middleware/users");
const { ensureAuthenticated, ensureAdministrator } = require("../middleware/auth");
const ServerSettingsDB = require("../models/ServerSettings.js");
const ClientSettingsDB = require("../models/ClientSettings.js");
const HistoryDB = require("../models/History");
const SpoolsDB = require("../models/Filament.js");
const ProfilesDB = require("../models/Profiles.js");
const RoomDataDB = require("../models/RoomData.js");
const UserDB = require("../models/User.js");
const PrintersDB = require("../models/Printer.js");
const AlertsDB = require("../models/Alerts.js");
const GcodeDB = require("../models/CustomGcode.js");
const Logger = require("../handlers/logger.js");
const logger = new Logger("OctoFarm-API");
const multer = require("multer");
const { isEqual } = require("lodash");
const { SettingsClean } = require("../services/settings-cleaner.service.js");
const { Logs } = require("../services/server-logs.service.js");
const { SystemCommands } = require("../services/server-commands.service.js");
const { fetchUsers } = require("../services/user-service");
const {
  checkReleaseAndLogUpdate,
  getUpdateNotificationIfAny
} = require("../services/octofarm-update.service.js");
const { getPrinterManagerCache } = require("../cache/printer-manager.cache");
const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const { getImagesPath, getLogsPath } = require("../utils/system-paths.utils");
const S_VALID = require("../constants/validate-settings.constants");
const { validateParamsMiddleware } = require("../middleware/validators");

module.exports = router;

const Storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, getImagesPath());
  },
  filename: function (req, file, callback) {
    callback(null, "bg.jpg");
  }
});

const upload = multer({ storage: Storage });

router.get("/server/logs", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  const serverLogs = await Logs.grabLogs();
  res.send(serverLogs);
});
router.delete(
  "/server/logs/clear-old",
  ensureAuthenticated,
  ensureAdministrator,
  async (req, res) => {
    try {
      const deletedLogs = Logs.clearLogsOlderThan(1);
      res.send(deletedLogs);
    } catch (e) {
      logger.error("Failed to clear logs!", e);
      res.sendStatus(500);
    }
  }
);
router.delete("/server/logs/:name", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  const fileName = req.params.name;
  try {
    Logs.deleteLogByName(fileName);
    res.sendStatus(201);
  } catch (e) {
    logger.error("Couldn't delete log path!", e);
    res.sendStatus(500);
  }
});

router.get("/server/logs/:name", ensureAuthenticated, ensureAdministrator, (req, res) => {
  const download = req.params.name;
  const file = `${getLogsPath()}/${download}`;
  console.log(file);
  res.download(file, download); // Set disposition and send it.
});
router.post(
  "/server/logs/generateLogDump",
  ensureAuthenticated,
  ensureAdministrator,
  async (req, res) => {
    // Will use in a future update to configure the dump.
    // let settings = req.body;
    // Generate the log package
    let zipDumpResponse = {
      status: "error",
      msg: "Unable to generate zip file, please check 'OctoFarm-API.log' file for more information.",
      zipDumpPath: ""
    };

    try {
      zipDumpResponse.zipDumpPath = await Logs.generateOctoFarmLogDump();
      zipDumpResponse.status = "success";
      zipDumpResponse.msg = "Successfully generated zip file, please click the download button.";
    } catch (e) {
      logger.error("Error Generating Log Dump Zip File | ", e.message);
    }

    res.send(zipDumpResponse);
  }
);

router.get(
  "/server/delete/database/:databaseName",
  ensureAuthenticated,
  ensureAdministrator,
  validateParamsMiddleware(S_VALID.DATABASE_NAME),
  async (req, res) => {
    const databaseName = req.params.databaseName;
    await getPrinterManagerCache().killAllConnections();
    if (databaseName === "EverythingDB") {
      await ServerSettingsDB.deleteMany({});
      await ClientSettingsDB.deleteMany({});
      await HistoryDB.deleteMany({});
      await SpoolsDB.deleteMany({});
      await ProfilesDB.deleteMany({});
      await RoomDataDB.deleteMany({});
      await UserDB.deleteMany({});
      await PrintersDB.deleteMany({});
      await AlertsDB.deleteMany({});
      await GcodeDB.deleteMany({});
      res.send({
        message: "Successfully deleted databases, server will restart..."
      });
      logger.info("Database completely wiped.... Restarting server...");
      await SystemCommands.rebootOctoFarm();
    } else if (databaseName === "FilamentDB") {
      await SpoolsDB.deleteMany({});
      await ProfilesDB.deleteMany({});
      logger.info("Successfully deleted Filament database.... Restarting server...");
      await SystemCommands.rebootOctoFarm();
    } else {
      await eval(databaseName).deleteMany({});
      res.send({
        message: "Successfully deleted " + databaseName + ", server will restart..."
      });
      logger.info(databaseName + " successfully deleted.... Restarting server...");
      await SystemCommands.rebootOctoFarm();
    }
  }
);
router.get(
  "/server/get/database/:databaseName",
  ensureAuthenticated,
  ensureAdministrator,
  validateParamsMiddleware(S_VALID.DATABASE_NAME),
  async (req, res) => {
    const databaseName = req.params.databaseName;
    logger.info("Client requests export of " + databaseName);
    let returnedObjects = [];
    if (databaseName === "FilamentDB") {
      returnedObjects.push(await ProfilesDB.find({}));
      returnedObjects.push(await SpoolsDB.find({}));
    } else {
      returnedObjects.push(await eval(databaseName).find({}));
    }
    logger.info("Returning to client database object: " + databaseName);
    res.send({ databases: returnedObjects });
  }
);
router.post("/server/restart", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  let serviceRestarted = false;
  try {
    serviceRestarted = await SystemCommands.rebootOctoFarm();
  } catch (e) {
    logger.error(e);
  }
  res.send(serviceRestarted);
});

router.post(
  "/server/update/octofarm",
  ensureAuthenticated,
  ensureAdministrator,
  async (req, res) => {
    let clientResponse = {
      haveWeSuccessfullyUpdatedOctoFarm: false,
      statusTypeForUser: "error",
      message: ""
    };
    let force = req?.body;
    if (
      !force ||
      typeof force?.forcePull !== "boolean" ||
      typeof force?.doWeInstallPackages !== "boolean"
    ) {
      res.sendStatus(400);
      throw new Error("forceCheck object not correctly provided or not boolean");
    }

    try {
      clientResponse = await SystemCommands.checkIfOctoFarmNeedsUpdatingAndUpdate(
        clientResponse,
        force
      );
    } catch (e) {
      clientResponse.message = "Issue with updating | " + e?.message.replace(/(<([^>]+)>)/gi, "");
      // Log error with html tags removed if contained in response message
      logger.error("Issue with updating | ", e?.message.replace(/(<([^>]+)>)/gi, ""));
    } finally {
      res.send(clientResponse);
    }
  }
);
router.get("/server/update/check", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  await checkReleaseAndLogUpdate();
  const softwareUpdateNotification = getUpdateNotificationIfAny();
  res.send(softwareUpdateNotification);
});
router.get("/client/get", ensureCurrentUserAndGroup, ensureAuthenticated, (req, res) => {
  ClientSettingsDB.findById(req.user.clientSettings).then((checked) => {
    res.send(checked);
  });
});
router.post("/client/update", ensureCurrentUserAndGroup, ensureAuthenticated, async (req, res) => {
  const currentUserList = await fetchUsers();

  // Patch to fill in user settings if it doesn't exist
  for (let i = 0; i < currentUserList.length; i++) {
    if (!currentUserList[i].clientSettings) {
      currentUserList[i].clientSettings = new ClientSettingsDB();
      currentUserList[i].clientSettings.save();
      currentUserList[i].save();
    }
  }

  ClientSettingsDB.findByIdAndUpdate(req.user.clientSettings._id, req.body)
    .then(async () => {
      await SettingsClean.start();
      await fetchUsers(true);
      res.send({ msg: "Settings Saved" });
    })
    .catch((e) => {
      res.send({ msg: "Settings Not Saved" });
    });
});
router.post(
  "/backgroundUpload",
  ensureAuthenticated,
  ensureAdministrator,
  upload.single("myFile"),
  (req, res) => {
    const file = req.file;
    if (!file) {
      res.redirect("/system");
    }
    res.redirect("/system");
  }
);
router.get("/server/get", ensureAuthenticated, (req, res) => {
  ServerSettingsDB.find({}).then((checked) => {
    res.send(checked[0]);
  });
});
router.post("/server/update", ensureAuthenticated, ensureAdministrator, (req, res) => {
  ServerSettingsDB.find({}).then(async (checked) => {
    let restartRequired = false;

    const sentOnline = JSON.parse(JSON.stringify(req.body));
    const actualOnline = JSON.parse(JSON.stringify(checked[0]));

    const onlineChanges = isEqual(actualOnline.onlinePolling, sentOnline.onlinePolling);
    const serverChanges = isEqual(actualOnline.server, sentOnline.server);
    const timeoutChanges = isEqual(actualOnline.timeout, sentOnline.timeout);
    const filamentChanges = isEqual(actualOnline.filament, sentOnline.filament);
    const historyChanges = isEqual(actualOnline.history, sentOnline.history);
    const influxExport = isEqual(actualOnline.influxExport, sentOnline.influxExport);

    checked[0].onlinePolling = req.body.onlinePolling;
    checked[0].server = req.body.server;
    checked[0].timeout = req.body.timeout;
    checked[0].filament = req.body.filament;
    checked[0].history = req.body.history;
    checked[0].influxExport = req.body.influxExport;
    checked[0].monitoringViews = req.body.monitoringViews;

    if (
      [
        onlineChanges,
        serverChanges,
        timeoutChanges,
        filamentChanges,
        historyChanges,
        influxExport
      ].includes(false)
    ) {
      restartRequired = true;
    }

    if (onlineChanges) {
      await getPrinterStoreCache().updateAllPrintersSocketThrottle(
        checked[0].onlinePolling.seconds
      );
    }

    //Check the influx export to see if all information exists... disable if not...
    let shouldDisableInflux = false;
    let returnMsg = "";
    let influx = req.body.influxExport;
    if (req.body.influxExport.active) {
      if (influx.host.length === 0) {
        shouldDisableInflux = true;
        returnMsg += "Issue: No host information! <br>";
      }
      if (influx.port.length === 0) {
        shouldDisableInflux = true;
        returnMsg += "Issue: No port information! <br>";
      }
      if (influx.database.length === 0 || influx.database.includes(" ")) {
        shouldDisableInflux = true;
        returnMsg += "Issue: No database name or contains spaces! <br>";
      }
      if (shouldDisableInflux) {
        checked[0].influxExport.active = false;
        checked[0].markModified("influxExport");
      }
    }

    await checked[0].save().then(() => {
      SettingsClean.start();
    });
    if (shouldDisableInflux) {
      res.send({
        msg: returnMsg,
        status: "warning"
      });
    } else {
      res.send({ msg: "Settings Saved", status: "success", restartRequired });
    }
  });
});

router.get("/customGcode/delete/:id", ensureAuthenticated, async (req, res) => {
  const scriptId = req.params.id;
  GcodeDB.findByIdAndDelete(scriptId, function (err) {
    if (err) {
      res.send(err);
    } else {
      res.send(scriptId);
    }
  });
});
router.post("/customGcode/edit", ensureAuthenticated, async (req, res) => {
  const newObj = req.body;
  let script = await GcodeDB.findById(newObj.id);
  script.gcode = newObj.gcode;
  script.name = newObj.name;
  script.description = newObj.description;
  script.printerIds = newObj.printerIds;
  script.buttonColour = newObj.buttonColour;
  script.save();
  res.send(script);
});

router.post("/customGcode", ensureAuthenticated, async (req, res) => {
  let newScript = req.body;
  const saveScript = new GcodeDB(newScript);
  saveScript
    .save()
    .then(res.send(saveScript))
    .catch((e) => res.send(e));
});

router.get("/customGcode", ensureAuthenticated, async (req, res) => {
  res.send(await GcodeDB.find());
});
router.get("/customGcode/:id", ensureAuthenticated, async (req, res) => {
  const printerId = req.params.id;
  const all = await GcodeDB.find();
  let returnCode = [];
  all.forEach((script) => {
    if (script.printerIds.includes(printerId) || script.printerIds.length === 0) {
      returnCode.push(script);
    }
  });
  res.send(returnCode);
});
