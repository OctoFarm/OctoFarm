const express = require("express");

const router = express.Router();
const { ensureAuthenticated, ensureAdministrator } = require("../config/auth");
// User Modal
const runner = require("../runners/state.js");

const { Runner } = runner;
const Logger = require("../handlers/logger.js");

const logger = new Logger("OctoFarm-API");

const { getPrinterManagerCache } = require("../cache/printer-manager.cache");

const { Script } = require("../lib/serverScripts.js");

const _ = require("lodash");
const { getPrinterStoreCache } = require("../cache/printer-store.cache");
const { returnPrinterHealthChecks } = require("../store/printer-health-checks.store");

router.post("/add", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  // Grab the API body
  const printers = req.body;
  // Send Dashboard to Runner..
  logger.info("Update printers request: ", printers);
  const p = await getPrinterManagerCache().addPrinter(printers);
  // Return printers added...
  res.send({ printersAdded: p, status: 200 });
});

router.post("/update", ensureAuthenticated, ensureAdministrator, (req, res) => {
  // Grab the API body
  const printers = req.body;
  // Send Dashboard to Runner..
  logger.info("Update printers request: ", printers);
  const p = getPrinterManagerCache().bulkUpdateBasicPrinterInformation(printers);
  // Return printers added...
  res.send({ printersAdded: p, status: 200 });
});
router.post("/remove", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  // Grab the API body
  const printers = req.body;
  // Send Dashboard to Runner..
  logger.info("Delete printers request: ", printers);
  const p = await getPrinterManagerCache().bulkDeletePrinters(printers);
  // Return printers added...
  res.send({ printersRemoved: p, status: 200 });
});

// Register Handle for Saving printers
router.post("/removefile", ensureAuthenticated, async (req, res) => {
  // Check required fields
  const file = req.body;
  logger.info("File deletion request: ", file.i);
  await Runner.removeFile(file.i, file.fullPath);
  res.send("success");
});
router.post("/removefolder", ensureAuthenticated, async (req, res) => {
  // Check required fields
  const folder = req.body;
  logger.info("Folder deletion request: ", folder.fullPath);
  await Runner.deleteFolder(folder.index, folder.fullPath);
  res.send(true);
});
router.post("/resyncFile", ensureAuthenticated, async (req, res) => {
  // Check required fields
  const file = req.body;
  logger.info("File Re-sync request for: ", file);
  let ret = null;
  if (typeof file.fullPath !== "undefined") {
    ret = await Runner.reSyncFile(file.i, file.fullPath);
  } else {
    ret = await getPrinterStoreCache().resyncFilesList(file.i);
  }
  res.send(ret);
});
router.post("/stepChange", ensureAuthenticated, async (req, res) => {
  // Check required fields
  const step = req.body;
  Runner.stepRate(step.printer, step.newSteps);
  res.send("success");
});
router.post("/flowChange", ensureAuthenticated, async (req, res) => {
  // Check required fields
  const step = req.body;
  Runner.flowRate(step.printer, step.newSteps);
  res.send("success");
});
router.post("/feedChange", ensureAuthenticated, async (req, res) => {
  // Check required fields
  const step = req.body;
  Runner.feedRate(step.printer, step.newSteps);
  res.send("success");
});
router.post("/updateSettings", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  // Check required fields
  const settings = req.body;
  logger.info("Update printers request: ", settings);
  const updateSettings = await Runner.updateSettings(settings);
  res.send({ status: updateSettings.status, printer: updateSettings.printer });
});
router.post(
  "/killPowerSettings/:id",
  ensureAuthenticated,
  ensureAdministrator,
  async (req, res) => {
    // Check required fields
    const printerID = req.params.id;
    const updateSettings = await Runner.killPowerSettings(printerID);
    res.send({ updateSettings });
  }
);
router.get("/groups", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  const printers = getPrinterStoreCache().listPrintersInformation();
  const groups = [];
  for (let i = 0; i < printers.length; i++) {
    await groups.push({
      _id: printers[i]._id,
      group: printers[i].group
    });
  }

  res.send(groups);
});

router.post("/printerInfo", ensureAuthenticated, async (req, res) => {
  const id = req.body.i;
  let returnedPrinterInformation;
  if (!id) {
    returnedPrinterInformation = getPrinterStoreCache().listPrintersInformation();
  } else {
    returnedPrinterInformation = getPrinterStoreCache().getPrinterInformation(id);
  }
  res.send(returnedPrinterInformation);
});

router.post(
  "/updatePrinterSettings",
  ensureAuthenticated,
  ensureAdministrator,
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
  Runner.moveFile(data.index, data.newPath, data.newFullPath, data.fileName);
  res.send({ msg: "success" });
});
router.post("/moveFolder", ensureAuthenticated, async (req, res) => {
  const data = req.body;
  logger.info("Move folder request: ", data);
  Runner.moveFolder(data.index, data.oldFolder, data.newFullPath, data.folderName);
  res.send({ msg: "success" });
});
router.post("/newFolder", ensureAuthenticated, async (req, res) => {
  const data = req.body;
  logger.info("New folder request: ", data);
  res.send({ msg: "success", files: await Runner.newFolder(data) });
});
router.post("/newFiles", ensureAuthenticated, async (req, res) => {
  const data = req.body;
  logger.info("Adding a new file to server: ", data);
  res.send({ msg: "success", files: getPrinterStoreCache().addNewFile(data) });
});
router.post("/selectFilament", ensureAuthenticated, async (req, res) => {
  const data = req.body;
  logger.info("Change filament request: ", data);
  const roll = await Runner.selectedFilament(data);
  res.send({ msg: roll });
});
router.post("/reSyncAPI", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  const id = req.body.id;
  const force = req.body.force;
  logger.info(`Rescan ${id ? id : "All"} OctoPrint Requested. Forced: `, { force: force });
  await getPrinterManagerCache().reScanAPI(id, force);
  logger.info(`Rescan of ${id ? id : "All"} re-scan completed`);
  res.send({ msg: "Finished API Rescan..." });
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
});
router.post("/updateSortIndex", ensureAuthenticated, ensureAdministrator, (req, res) => {
  const data = req.body;
  logger.info("Update printer sort indexes: ", data);
  res.send(getPrinterManagerCache().updatePrinterSortIndexes(data));
});
router.get("/connectionLogs/:id", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  let id = req.params.id;
  logger.info("Grabbing connection logs for: ", id);
  let connectionLogs = await getPrinterStoreCache().generatePrinterConnectionLogs(id);

  res.send(connectionLogs);
});
router.get("/pluginList/:id", ensureAuthenticated, async (req, res) => {
  let id = req.params.id;

  if (id !== "all") {
    logger.info("Grabbing plugin list for: ", id);
    let pluginList = await Runner.returnPluginList(id);
    res.send(pluginList);
  } else {
    logger.info("Grabbing global plugin list");
    let pluginList = await Runner.returnPluginList();
    res.send(pluginList);
  }
});
router.get("/scanNetwork", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  const { searchForDevicesOnNetwork } = require("../../server_src/runners/autoDiscovery.js");

  let devices = await searchForDevicesOnNetwork();

  res.json(devices);
});

router.get("/listUniqueFolders", ensureAuthenticated, async (req, res) => {
  let uniqueFolderPaths = getPrinterStoreCache.listUniqueFolderPaths();
  res.json(uniqueFolderPaths);
});

router.get("/listUniqueFiles", ensureAuthenticated, async (req, res) => {
  let uniqueFolderPaths = getPrinterStoreCache().listUniqueFiles();
  res.json(uniqueFolderPaths);
});

router.get("/listUnifiedFiles/:ids", ensureAuthenticated, async (req, res) => {
  const idList = JSON.parse(req.params.ids);
  let uniqueFolderPaths = getPrinterStoreCache().listCommonFilesOnAllPrinters(idList);
  res.json(uniqueFolderPaths);
});

router.get("/healthChecks", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  res.send(returnPrinterHealthChecks(true));
});

router.patch("/disable/:id", ensureAuthenticated, ensureAdministrator, (req, res) => {
  const id = req.params.id;
  res.send(getPrinterStoreCache().disablePrinter(id));
});

router.patch("/enable/:id", ensureAuthenticated, ensureAdministrator, async (req, res) => {
  const id = req.params.id;
  res.send(await getPrinterStoreCache().enablePrinter(id));
});

module.exports = router;
