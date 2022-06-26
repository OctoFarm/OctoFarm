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
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");
const Logger = require("../handlers/logger.js");
const logger = new Logger(LOGGER_ROUTE_KEYS.ROUTE_SYSTEM_SETTINGS);
const clientLogger = new Logger(LOGGER_ROUTE_KEYS.SERVER_CLIENT);
const multer = require("multer");
const { isEqual } = require("lodash");
const { SettingsClean } = require("../services/settings-cleaner.service.js");
const { Logs } = require("../services/server-logs.service.js");
const { SystemCommands } = require("../services/server-commands.service.js");
const { fetchUsers } = require("../api/users.api.js");
const {
  checkReleaseAndLogUpdate,
  getUpdateNotificationIfAny,
  syncLatestOctoFarmRelease
} = require("../services/octofarm-update.service.js");
const { getPrinterManagerCache } = require("../cache/printer-manager.cache");
const { getImagesPath, getLogsPath } = require("../utils/system-paths.utils");
const S_VALID = require("../constants/validate-settings.constants");
const { validateParamsMiddleware } = require("../middleware/validators");
const M_VALID = require("../constants/validate-mongo.constants");
const { sanitizeString } = require("../utils/sanitize-utils");
const { databaseNamesList } = require("../constants/database.constants");
const { TaskManager } = require("../services/task-manager.service");
const { SystemRunner } = require("../services/system-information.service");
const { listActiveClients } = require("../services/server-side-events.service");
const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const { FilamentClean } = require("../services/filament-cleaner.service");

module.exports = router;

//REFACTOR needs to be in middleware folder, 3 functions below.
const Storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, getImagesPath());
  },
  filename: function (req, file, callback) {
    callback(null, "bg.jpg");
  }
});

const upload = multer({
  storage: Storage,
  limits: {
    fileSize: 8000000 // Sensitive: 10MB is more than the recommended limit of 8MB
  }
});

const fileSizeLimitErrorHandler = (err, req, res, next) => {
  if (err) {
    res.send(413);
  } else {
    next();
  }
};

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
      const deletedLogs = Logs.clearLogsOlderThan(5);
      res.send(deletedLogs);
    } catch (e) {
      logger.error("Failed to clear logs!", e);
      res.sendStatus(500);
    }
  }
);
router.delete("/server/logs/:name", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  const fileName = req.paramString("name");
  try {
    Logs.deleteLogByName(fileName);
    res.sendStatus(201);
  } catch (e) {
    logger.error("Couldn't delete log path!", e);
    res.sendStatus(500);
  }
});

router.get("/server/logs/:name", ensureAuthenticated, ensureAdministrator, (req, res) => {
  const download = req.paramString("name");
  const file = `${getLogsPath()}/${download}`;
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
    const zipDumpResponse = {
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
    const force = req.body;
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
  await syncLatestOctoFarmRelease(false);
  checkReleaseAndLogUpdate();
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
  for (const user of currentUserList) {
    if (!user.clientSettings) {
      user.clientSettings = new ClientSettingsDB();
      user.clientSettings.save();
      user.save();
    }
  }

  ClientSettingsDB.findByIdAndUpdate(req.user.clientSettings._id, req.body)
    .then(async () => {
      await SettingsClean.start();
      await fetchUsers(true);
      res.send({ msg: "Settings Saved" });
    })
    .catch((e) => {
      res.send({ msg: "Settings Not Saved: " + e });
    });
});
router.post(
  "/backgroundUpload",
  ensureAuthenticated,
  ensureAdministrator,
  upload.single("myFile"),
  fileSizeLimitErrorHandler,
  (req, res) => {
    const file = req.file;
    if (!file) {
      res.redirect("/administration");
    }
    res.redirect("/administration");
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

    const serverChanges = isEqual(actualOnline.server, sentOnline.server);
    console.log(serverChanges);
    const timeoutChanges = isEqual(actualOnline.timeout, sentOnline.timeout);
    console.log(actualOnline.filament);
    console.log(sentOnline.filament);
    const filamentChanges = isEqual(actualOnline.filament, sentOnline.filament);
    const hideEmptyChanges = actualOnline.filament.hideEmpty !== sentOnline.filament.hideEmpty;

    checked[0].server = sentOnline.server;
    checked[0].timeout = sentOnline.timeout;
    checked[0].filament = sentOnline.filament;
    checked[0].history = sentOnline.history;
    checked[0].influxExport = sentOnline.influxExport;
    checked[0].monitoringViews = sentOnline.monitoringViews;

    if ([serverChanges, timeoutChanges].includes(false)) {
      restartRequired = true;
    }

    if (hideEmptyChanges) {
      TaskManager.forceRunTask("FILAMENT_CLEAN_TASK");
    }

    if (!filamentChanges && checked[0].filament.allowMultiSelect === false) {
      const spoolList = FilamentClean.getSpools();
      spoolList.forEach((spool) => {
        getPrinterStoreCache().deattachSpoolFromAllPrinters(`${spool._id}`);
      });
      TaskManager.forceRunTask("FILAMENT_CLEAN_TASK");
    }

    //Check the influx export to see if all information exists... disable if not...
    let shouldDisableInflux = false;
    let returnMsg = "";
    const influx = sentOnline.influxExport;
    if (influx.active) {
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

router.get(
  "/customGcode/delete/:id",
  ensureAuthenticated,
  validateParamsMiddleware(M_VALID.MONGO_ID),
  async (req, res) => {
    const scriptId = req.paramString("id");
    GcodeDB.findByIdAndDelete(scriptId, function (err) {
      if (err) {
        res.send(err);
      } else {
        res.send(scriptId);
      }
    });
  }
);
router.post("/customGcode/edit", ensureAuthenticated, async (req, res) => {
  const script = await GcodeDB.findById(req.bodyString("id"));
  script.gcode = req.body.gcode;
  script.name = req.bodyString("name");
  script.description = req.bodyString("description");
  const printerIDList = [];
  if (Array.isArray(req.body.printerIds)) {
    req.body.printerIds.forEach((id) => {
      printerIDList.push(sanitizeString(id));
    });
  }
  script.printerIds = printerIDList;
  script.buttonColour = req.bodyString("buttonColour");
  script.save();
  res.send(script);
});

router.post("/customGcode", ensureAuthenticated, async (req, res) => {
  const newScript = req.body;
  const saveScript = new GcodeDB(newScript);
  saveScript
    .save()
    .then(res.send(saveScript))
    .catch((e) => res.send(e));
});

router.get("/customGcode", ensureAuthenticated, async (req, res) => {
  res.send(await GcodeDB.find());
});
router.get(
  "/customGcode/:id",
  ensureAuthenticated,
  validateParamsMiddleware(M_VALID.MONGO_ID),
  async (req, res) => {
    const printerId = req.paramString("id");
    const all = await GcodeDB.find();
    const returnCode = [];
    all.forEach((script) => {
      if (
        script.printerIds.includes(printerId) ||
        script.printerIds.includes("99aa99aaa9999a99999999aa")
      ) {
        returnCode.push(script);
      }
    });
    res.send(returnCode);
  }
);

/**
 * Acquire system information from system info runner
 */
router.get("/system/info", ensureAuthenticated, (req, res) => {
  TaskManager.forceRunTask("SYSTEM_INFO_CHECK_TASK");
  const systemInformation = SystemRunner.returnInfo(true);
  res.send(systemInformation);
});

router.get("/system/activeUsers", ensureAuthenticated, ensureAdministrator, listActiveClients);

router.post("/client/logs", ensureAuthenticated, async (req, res) => {
  const { code, message, name, statusCode, type, color, developerMessage } = req.body;
  const loggingMessage = `${code ? code : "No Code"}: ${message ? message : "No Message"}`;
  const errorObject = {
    name,
    statusCode,
    type
  };
  if (color !== "danger") {
    clientLogger.warning(loggingMessage, errorObject);
  } else {
    clientLogger.error(loggingMessage, errorObject);
    clientLogger.info("Developer Message: ", developerMessage);
  }
});

module.exports = router;
