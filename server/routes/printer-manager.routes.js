const express = require("express");

const router = express.Router();
const { ensureAuthenticated, ensureAdministrator } = require("../middleware/auth");
const { ensureCurrentUserAndGroup } = require("../middleware/users");
const Logger = require("../handlers/logger.js");
const { LOGGER_ROUTE_KEYS } = require("../constants/logger.constants");

const logger = new Logger(LOGGER_ROUTE_KEYS.ROUTE_PRINTER_MANAGER);

const { getPrinterManagerCache } = require("../cache/printer-manager.cache");

const { Script } = require("../services/server-scripts.service.js");

const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const { returnPrinterHealthChecks } = require("../store/printer-health-checks.store");
const { getPluginList, getPluginNoticesList } = require("../store/octoprint-plugin-list.store");
const { generatePrinterStatistics } = require("../services/printer-statistics.service");
const { validateBodyMiddleware, validateParamsMiddleware } = require("../middleware/validators");
const P_VALID = require("../constants/validate-printers.constants");
const M_VALID = require("../constants/validate-mongo.constants");
const { sortBy } = require("lodash");
const ConnectionMonitorService = require("../services/connection-monitor.service");
const { generateRandomName } = require("../services/printer-name-generator.service");
const { getEventEmitterCache } = require("../cache/event-emitter.cache");
const { updateUserActionLog } = require("../services/user-actions-log.service");

router.post(
  "/add",
  ensureAuthenticated,
  ensureAdministrator,
  validateBodyMiddleware(P_VALID.NEW_PRINTER),
  async (req, res) => {
    // Grab the API body
    const printers = req.body;
    // Send Dashboard to Runner..
    logger.info("Add printers request: ", printers);
    const p = await getPrinterManagerCache().addPrinter(printers);
    //Return printers added...
    res.send({ printersAdded: [p], status: 200 });
  }
);

router.post(
  "/update",
  ensureAuthenticated,
  ensureAdministrator,
  validateBodyMiddleware(P_VALID.UPDATE_PRINTERS),
  (req, res) => {
    // Grab the API body
    const printers = req.body.infoList;
    // Send Dashboard to Runner..
    logger.info("Update printers request: ", printers);
    const p = getPrinterManagerCache().bulkUpdateBasicPrinterInformation(printers);
    // Return printers added...
    res.send({ printersAdded: p, status: 200 });
  }
);
router.post(
  "/remove",
  ensureAuthenticated,
  ensureAdministrator,
  validateBodyMiddleware(P_VALID.PRINTER_ID_LIST),
  async (req, res) => {
    // Grab the API body
    const idList = req.body.idList;
    // Send Dashboard to Runner..
    logger.info("Delete printers request: ", idList);
    const p = await getPrinterManagerCache().bulkDeletePrinters(idList);
    // Return printers added...
    res.send({ printersRemoved: p, status: 200 });
  }
);

// Register Handle for Saving printers
router.post("/removefile", ensureAuthenticated, async (req, res) => {
  // Check required fields
  const file = req.body;
  logger.info("File deletion request: ", file.i);
  getPrinterStoreCache().deleteFile(file.i, file.fullPath);
  res.send("success");
});
router.post("/removefolder", ensureAuthenticated, async (req, res) => {
  // Check required fields
  const folder = req.body;
  logger.info("Folder deletion request: ", folder.fullPath);
  getPrinterStoreCache().deleteFolder(folder.index, folder.fullPath);
  res.send(true);
});
router.post(
  "/resyncFile",
  ensureAuthenticated,
  validateBodyMiddleware(P_VALID.FILE_SYNC),
  async (req, res) => {
    // Check required fields
    const file = req.body;
    let ret;
    if (!!file?.fullPath) {
      logger.info("Printer single file resync request", {
        printer_id: file.id,
        file_path: file.fullPath
      });
      ret = await getPrinterStoreCache().resyncFile(file.id, file.fullPath);
    } else {
      logger.info("Full printer files resync request", {
        printer_id: file.id
      });
      ret = await getPrinterStoreCache().resyncFilesList(file.id);
    }
    res.send(ret);
  }
);
router.post(
  "/nukeFiles",
  ensureAuthenticated,
  validateBodyMiddleware(P_VALID.PRINTER_ID),
  async (req, res) => {
    // Check required fields
    const { id } = req.body;
    logger.info("Nuke all files and folders requested!", id);
    const deletedList = await getPrinterStoreCache().deleteAllFilesAndFolders(id);
    res.send(deletedList);
  }
);
router.post(
  "/getHouseCleanList",
  ensureAuthenticated,
  validateBodyMiddleware(P_VALID.HOUSE_KEEPING),
  async (req, res) => {
    // Check required fields
    const { id, days } = req.body;
    logger.info("File house clean requested!", {
      printerID: id,
      days
    });
    const fileList = getPrinterStoreCache().getHouseCleanFileList(id, days);

    res.send(fileList);
  }
);
router.post(
  "/houseCleanFiles",
  ensureAuthenticated,
  validateBodyMiddleware(P_VALID.BULK_FILE_DELETE),
  async (req, res) => {
    // Check required fields
    const { id, pathList } = req.body;
    logger.info("File house clean requested!", {
      printerID: id,
      pathList
    });
    const deletedList = await getPrinterStoreCache().houseCleanFiles(id, pathList);
    res.send(deletedList);
  }
);
router.post("/stepChange", ensureAuthenticated, async (req, res) => {
  // Check required fields
  const step = req.body;
  getPrinterStoreCache().updateStepRate(step.printer, step.newSteps);
  res.send("success");
});
router.post("/flowChange", ensureAuthenticated, async (req, res) => {
  // Check required fields
  const step = req.body;
  getPrinterStoreCache().updateFlowRate(step.printer, step.newSteps);
  res.send("success");
});
router.post("/feedChange", ensureAuthenticated, async (req, res) => {
  // Check required fields
  const step = req.body;
  getPrinterStoreCache().updateFeedRate(step.printer, step.newSteps);
  res.send("success");
});
router.post("/editPrinter", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  // Check required fields
  const settings = req.body;
  logger.info("Update printers settings request: ", settings);
  try {
    const editPrinter = await getPrinterStoreCache().editPrinterConnectionSettings(settings);
    res.send({ status: editPrinter });
  } catch (e) {
    logger.error("Couldn't update settings...", e.message);
    res.send({ status: 500 });
  }
});
router.post("/updateSettings", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  // Check required fields
  const settings = req.body;
  logger.info("Update printers settings request: ", settings);
  try {
    const updateSets = await getPrinterStoreCache().updatePrinterSettings(settings);
    res.send({ status: updateSets });
  } catch (e) {
    logger.error("Couldn't update settings...", e.message);
    res.send({ octofarm: 500, profile: 500, settings: 500 });
  }
});

router.get("/groups", ensureAuthenticated, async (req, res) => {
  const printers = getPrinterStoreCache().listPrintersInformation();
  const groups = [];
  for (const printer of printers) {
    groups.push({
      _id: printer._id,
      group: printer.group
    });
  }

  res.send(groups);
});

router.post(
  "/printerInfo",
  ensureAuthenticated,
  validateBodyMiddleware(P_VALID.PRINTER_ID),
  async (req, res) => {
    const id = req.body.i;
    let returnedPrinterInformation;
    if (!id) {
      const onlyDisabled = req.query.disabled === "true";
      const showFullList = req.query.fullList === "true";
      returnedPrinterInformation = getPrinterStoreCache().listPrintersInformation(
        showFullList,
        onlyDisabled
      );
    } else {
      returnedPrinterInformation = getPrinterStoreCache().getPrinterInformation(id);
    }
    res.send(returnedPrinterInformation);
  }
);

router.post(
  "/updatePrinterSettings",
  ensureAuthenticated,
  ensureAdministrator,
  validateBodyMiddleware(P_VALID.PRINTER_ID),
  async (req, res) => {
    const id = req.body.i;
    if (!id) {
      logger.error("Printer Settings: No ID key was provided");
      res.statusMessage = "No ID key was provided";
      res.sendStatus(400);
      return;
    }
    try {
      await getPrinterStoreCache().updateLatestOctoPrintSettings(id, true);
      logger.debug("Updating printer settings for: ", id);
      res.send(getPrinterStoreCache().getPrinterInformation(id));
    } catch (e) {
      logger.error(`The server couldn't update your printer settings! ${e}`);
      res.statusMessage = `The server couldn't update your printer settings! ${e}`;
      res.sendStatus(500);
    }
  }
);

router.post("/moveFile", ensureAuthenticated, async (req, res) => {
  const data = req.body;
  if (data.newPath === "/") {
    data.newPath = "local";
    data.newFullPath = data.newFullPath.replace("//", "");
  }
  logger.info("Move file request: ", data);
  getPrinterStoreCache().moveFile(data.index, data.newPath, data.newFullPath, data.fileName);
  res.send({ msg: "success" });
});
router.post("/moveFolder", ensureAuthenticated, async (req, res) => {
  const data = req.body;
  logger.info("Move folder request: ", data);
  getPrinterStoreCache().moveFolder(data.index, data.oldFolder, data.newFullPath, data.folderName);
  res.send({ msg: "success" });
});
router.post("/newFolder", ensureAuthenticated, async (req, res) => {
  const data = req.body;
  logger.info("New folder request: ", data);
  res.send({ msg: "success", files: getPrinterStoreCache().addNewFolder(data) });
});
router.post("/newFiles", ensureAuthenticated, async (req, res) => {
  const data = req.body;
  logger.info("Adding a new file to server: ", data);
  res.send({ msg: "success", files: getPrinterStoreCache().addNewFile(data) });
});
router.post("/reSyncAPI", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  const id = req.body.id;
  const force = req.body.force;
  logger.info(`Rescan ${id ? id : "All"} OctoPrint Requested. Forced: `, { force: force });
  const reScanApi = await getPrinterManagerCache().reScanAPI(id, force);
  logger.info(`Rescan of ${id ? id : "All"} re-scan completed`);
  res.send({ msg: reScanApi });
});

router.post("/forceReconnect", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  const id = req.body.id;
  logger.info(`Force Reconnect ${id ? id : "no id provided..."}`);
  const forceReconnect = await getPrinterStoreCache().forceReconnectPrinter(id);
  res.send({ msg: forceReconnect });
});

router.post("/reSyncSockets", ensureAuthenticated, async (req, res) => {
  const id = req.body.id;
  logger.info("Rescan All OctoPrint Requests: ");
  try {
    await getPrinterManagerCache().reSyncWebsockets(id);
    logger.info("Full re-scan of OctoFarm completed");
    res.send({
      status: "success",
      msg: "Successfully Reconnected Socket! Please await reconnect."
    });
  } catch (e) {
    res.send({ status: "error", msg: `Couldn't Reconnect Socket! : ${e.message}` });
  }
});
router.post("/wakeHost", ensureAuthenticated, async (req, res) => {
  const data = req.body;
  logger.info("Action wake host: ", data);
  await Script.wol(data);
  res.sendStatus(201);
});
router.post(
  "/updateSortIndex",
  ensureAuthenticated,
  ensureAdministrator,
  validateBodyMiddleware(P_VALID.PRINTER_ID_LIST),
  async (req, res) => {
    const data = req.body.idList;
    logger.info("Update printer sort indexes: ", data);
    res.send(await getPrinterManagerCache().updatePrinterSortIndexes(data));
  }
);
router.get(
  "/connectionLogs/:id",
  ensureAuthenticated,
  ensureAdministrator,
  validateParamsMiddleware(M_VALID.MONGO_ID),
  async (req, res) => {
    const id = req.paramString("id");
    logger.info("Grabbing connection logs for: ", id);
    const connectionLogs = await getPrinterStoreCache().generatePrinterConnectionLogs(id);

    res.send(connectionLogs);
  }
);
router.get("/pluginList", ensureAuthenticated, async (req, res) => {
  logger.info("Grabbing global plugin list");
  res.send(getPluginList());
});
router.get("/pluginNoticesList", ensureAuthenticated, async (req, res) => {
  logger.info("Grabbing global plugin notices list");
  res.send(getPluginNoticesList());
});
router.get(
  "/disabledPluginList/:id",
  ensureAuthenticated,
  validateParamsMiddleware(M_VALID.MONGO_ID),
  async (req, res) => {
    const id = req.paramString("id");
    logger.info("Grabbing disabled plugin list");
    res.send(getPrinterStoreCache().getDisabledPluginsList(id));
  }
);
router.get(
  "/enabledPluginList/:id",
  ensureAuthenticated,
  validateParamsMiddleware(M_VALID.MONGO_ID),
  async (req, res) => {
    const id = req.paramString("id");
    logger.info("Grabbing enabled plugin list");
    res.send(getPrinterStoreCache().getEnabledPluginsList(id));
  }
);
router.get(
  "/allPluginsList/:id",
  ensureAuthenticated,
  validateParamsMiddleware(M_VALID.MONGO_ID),
  async (req, res) => {
    const id = req.paramString("id");
    logger.info("Grabbing installed plugin list");
    res.send(getPrinterStoreCache().getAllPluginsList(id));
  }
);

router.get("/scanNetwork", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  const { searchForDevicesOnNetwork } = require("../services/octoprint-auto-discovery.service.js");

  const devices = await searchForDevicesOnNetwork();

  res.json(devices);
});

router.get("/listUniqueFolders", ensureAuthenticated, async (req, res) => {
  const uniqueFolderPaths = getPrinterStoreCache().listUniqueFolderPaths();
  res.json(uniqueFolderPaths);
});

router.get("/listUniqueFiles", ensureAuthenticated, async (req, res) => {
  //DISCOVER Where's this gone!?
  const uniqueFolderPaths = getPrinterStoreCache().listUniqueFiles();
  res.json(uniqueFolderPaths);
});

router.get(
  "/listUnifiedFiles/:idList",
  ensureAuthenticated,
  // validateParamsMiddleware(P_VALID.PRINTER_ID_LIST),
  async (req, res) => {
    const idList = req.paramString("idList");
    const uniqueFolderPaths = getPrinterStoreCache().listCommonFilesOnAllPrinters(
      JSON.parse(idList)
    );
    res.json(uniqueFolderPaths);
  }
);

router.get("/healthChecks", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  res.send(returnPrinterHealthChecks(true));
});

router.get("/farmOverview", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  const returnArray = [];
  const printers = getPrinterStoreCache().listPrintersInformation();

  for (const printer of printers) {
    let stats = getPrinterStoreCache().getPrinterStatistics(printer._id);
    const octoPi = printer?.octoPi;

    if (!stats) {
      stats = await generatePrinterStatistics(printer._id);
      getPrinterStoreCache().updatePrinterStatistics(printer._id, stats);
    }

    returnArray.push({
      octoPrintVersion: printer?.octoPrintVersion,
      printerFirmware: printer?.printerFirmware,
      statistics: stats,
      octoPi
    });
  }

  res.send(returnArray);
});
router.get("/connectionOverview", ensureAuthenticated, ensureAdministrator, (req, res) => {
  const printerConnectionStats = sortBy(ConnectionMonitorService.returnConnectionLogs(), [
    "printerURL"
  ]);
  res.send(printerConnectionStats);
});

router.post(
  "/disable",
  ensureAuthenticated,
  ensureAdministrator,
  validateBodyMiddleware(P_VALID.PRINTER_ID_LIST),
  (req, res) => {
    const idList = req.body.idList;
    res.send(getPrinterManagerCache().disablePrinters(idList));
  }
);

router.post(
  "/enable",
  ensureAuthenticated,
  ensureAdministrator,
  validateBodyMiddleware(P_VALID.PRINTER_ID_LIST),
  async (req, res) => {
    const idList = req.body.idList;
    res.send(await getPrinterManagerCache().enablePrinters(idList));
  }
);

router.get("/generate_printer_name", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  res.send(generateRandomName());
});

router.get(
  "/events/:id",
  ensureAuthenticated,
  ensureAdministrator,
  validateParamsMiddleware(M_VALID.MONGO_ID),
  async (req, res) => {
    const printerID = req.paramString("id");
    res.send(getEventEmitterCache().get(printerID));
  }
);

router.get(
  "/selectedFilament/:id",
  ensureAuthenticated,
  validateParamsMiddleware(M_VALID.MONGO_ID),
  async (req, res) => {
    const printerID = req.paramString("id");
    res.send(getPrinterStoreCache().getSelectedFilament(printerID));
  }
);

router.patch(
  "/updateActiveUser/:id",
  ensureAuthenticated,
  ensureCurrentUserAndGroup,
  validateParamsMiddleware(M_VALID.MONGO_ID),
  async (req, res) => {
    const currentUser = req.user.username;
    const printerID = req.paramString("id");
    getPrinterStoreCache().updateActiveControlUser(printerID, currentUser);
    res.sendStatus(204);
  }
);

router.post(
  "/logUserPrintAction/:id",
  ensureAuthenticated,
  ensureCurrentUserAndGroup,
  validateParamsMiddleware(M_VALID.MONGO_ID),
  async (req, res) => {
    const currentUser = req.user.username;
    const printerID = req.paramString("id");
    const data = req.body.opts;
    const status = req.body.status;
    const action = req.body.action;
    const fullPath = req.body.fullPath;
    updateUserActionLog(printerID, action, data, currentUser, status, fullPath);
    res.sendStatus(204);
  }
);

router.post(
  "/rescanOctoPrintUpdates/:id",
  ensureAuthenticated,
  ensureAdministrator,
  validateParamsMiddleware(M_VALID.MONGO_ID),
  async (req, res) => {
    const printerID = req.paramString("id");
    await getPrinterStoreCache().checkOctoPrintForUpdates(printerID);
    res.sendStatus(204);
  }
);

router.post(
  "/overridepower/:id",
  ensureAuthenticated,
  validateParamsMiddleware(M_VALID.MONGO_ID),
  async (req, res) => {
    const printerID = req.paramString("id");
    const powerState = req.body;
    await getPrinterStoreCache().updatePrinterLiveValue(printerID, powerState);
    res.sendStatus(204);
  }
);

module.exports = router;
