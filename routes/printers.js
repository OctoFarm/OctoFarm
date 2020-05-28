const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
// User Modal
const runner = require("../runners/state.js");
const Runner = runner.Runner;
const Logger = require('../lib/logger.js');
const logger = new Logger('OctoFarm-API')

/* //Login Page
router.get("/login", (req, res) => res.render("login"));
//Register Page
router.get("/register", (req, res) => res.render("register")); */
router.post("/add", ensureAuthenticated, async (req, res) => {
  //Grab the API body
  const printers = req.body;
  //Send Dashboard to Runner..
  logger.info("Update printers request: ", printers);
  let p = await Runner.addPrinters(printers);
  //Return printers added...
  res.send({printersAdded: p, status:200});
});
router.post("/update", ensureAuthenticated, async (req, res) => {
  //Grab the API body
  const printers = req.body;
  //Send Dashboard to Runner..
  logger.info("Update printers request: ", printers);
  let p = await Runner.updatePrinters(printers);
  //Return printers added...
  res.send({printersAdded: p, status:200});
});
router.post("/remove", ensureAuthenticated, async (req, res) => {
  //Grab the API body
  const printers = req.body;
  //Send Dashboard to Runner..
  logger.info("Delete printers request: ", printers);
  let p = await Runner.removePrinter(printers);
  //Return printers added...
  res.send({printersRemoved: p, status:200});
});

//Register Handle for Saving printers
router.post("/removefile", ensureAuthenticated, async (req, res) => {
  //Check required fields
  const file = req.body;
  logger.info("File deletion request: ", file.i);
  Runner.removeFile(file.i, file.fullPath);
  res.send("success");
});
router.post("/removefolder", ensureAuthenticated, async (req, res) => {
  //Check required fields
  const folder = req.body;
  logger.info("Folder deletion request: ", folder.fullPath);
  Runner.deleteFolder(folder.index, folder.fullPath);
  res.send(true);
});
router.post("/resyncFile", ensureAuthenticated, async (req, res) => {
  //Check required fields
  const file = req.body;
  logger.info("File Re-sync request for: ", file);
  let ret = null;
  if (file.fullPath != undefined) {
    ret = await Runner.reSyncFile(file.i, file.fullPath);
  } else {
    ret = await Runner.reSyncFile(file.i);
  }
  res.send(ret);
});
router.post("/stepChange", ensureAuthenticated, async (req, res) => {
  //Check required fields
  const step = req.body;
  Runner.stepRate(step.printer, step.newSteps);
  res.send("success");
});
router.post("/flowChange", ensureAuthenticated, async (req, res) => {
  //Check required fields
  const step = req.body;
  Runner.flowRate(step.printer, step.newSteps);
  res.send("success");
});
router.post("/feedChange", ensureAuthenticated, async (req, res) => {
  //Check required fields
  const step = req.body;
  Runner.feedRate(step.printer, step.newSteps);
  res.send("success");
});
router.post("/updateSettings", ensureAuthenticated, async (req, res) => {
  //Check required fields

  const settings = req.body;
  logger.info("Update printers request: ", settings);
  let updateSettings = await Runner.updateSettings(settings);
  res.send({status: updateSettings.status, printer:updateSettings.printer});
});
router.get("/groups", ensureAuthenticated, async (req, res) => {
    let printers = await Runner.returnFarmPrinters();
    let groups = [];
    for(let i = 0; i < printers.length; i++){
        await groups.push({
        _id: printers[i]._id,
        group: printers[i].group
      });
    }

    res.send(groups);
});
router.post("/printerInfo", ensureAuthenticated, async (req, res) => {
  let index = req.body.i;
  if(typeof index === 'undefined' || index === null){
    let printers = await Runner.returnFarmPrinters();
    let printerInfo = [];
    for (let i = 0; i < printers.length; i++) {
      let selectedFilament = null;
      if (typeof printers[i].selectedFilament != "undefined") {
        selectedFilament = printers[i].selectedFilament;
      }
      let printer = {
        state: printers[i].state,
        index: printers[i].index,
        camURL: printers[i].camURL,
        _id: printers[i]._id,
        apikey: printers[i].apikey,
        currentZ: printers[i].currentZ,
        progress: printers[i].progress,
        job: printers[i].job,
        profile: printers[i].profiles,
        temps: printers[i].temps,
        flowRate: printers[i].flowRate,
        feedRate: printers[i].feedRate,
        stepRate: printers[i].stepRate,
        filesList: printers[i].fileList,
        storage: printers[i].storage,
        logs: printers[i].logs,
        messages: printers[i].messages,
        plugins: printers[i].settingsPlugins,
        gcode: printers[i].settingsScripts,
        settingsAppearance: printers[i].settingsApperance,
        stateColour: printers[i].stateColour,
        current: printers[i].current,
        options: printers[i].options,
        selectedFilament: selectedFilament,
        settingsWebcam: printers[i].settingsWebcam,
        webSocket: printers[i].webSocket,
        octoPrintVersion: printers[i].octoPrintVersion,
        hostState: printers[i].hostState,
        hostStateColour: printers[i].hostStateColour,
        printerURL: printers[i].printerURL,
        group: printers[i].group,
        costSettings: printers[i].costSettings,
      };
      printerInfo.push(printer);
    }
    res.send(printerInfo);
  }else{
    let printers = await Runner.returnFarmPrinters(index);
    let selectedFilament = null;
    if (typeof printers.selectedFilament != "undefined") {
      selectedFilament = printers.selectedFilament;
    }
    returnPrinter = {
      state: printers.state,
      index: printers.index,
      _id: printers._id,
      camURL: printers.camURL,
      apikey: printers.apikey,
      currentZ: printers.currentZ,
      progress: printers.progress,
      job: printers.job,
      profile: printers.profiles,
      temps: printers.temps,
      flowRate: printers.flowRate,
      feedRate: printers.feedRate,
      stepRate: printers.stepRate,
      filesList: printers.fileList,
      storage: printers.storage,
      logs: printers.logs,
      messages: printers.messages,
      plugins: printers.settingsPlugins,
      gcode: printers.settingsScripts,
      settingsAppearance: printers.settingsApperance,
      stateColour: printers.stateColour,
      current: printers.current,
      options: printers.options,
      selectedFilament: selectedFilament,
      settingsWebcam: printers.settingsWebcam,
      webSocket: printers.webSocket,
      octoPrintVersion: printers.octoPrintVersion,
      hostState: printers.hostState,
      hostStateColour: printers.hostStateColour,
      printerURL: printers.printerURL,
      group: printers.group,
      costSettings: printers.costSettings,
    };
    res.send(returnPrinter);
  }
});

//Register handle for checking for offline printers - Depricated due to websocket full implementation
router.post("/runner/checkOffline", ensureAuthenticated, async (req, res) => {
  let printers = await Runner.returnFarmPrinters();
  for(let i=0; i<printers.length; i++){
    const reset = await Runner.reScanOcto(i);
  }
  res.send({
    printers: "All",
    msg: " Were successfully rescanned..."
  });
});

router.post("/moveFile", ensureAuthenticated, async (req, res) => {
  let data = req.body;
  if (data.newPath === "/") {
    data.newPath = "local";
    data.newFullPath = data.newFullPath.replace("//", "");
  }
  logger.info("Move file request: ", data);
  Runner.moveFile(data.index, data.newPath, data.newFullPath, data.fileName);
  res.send({ msg: "success" });
});
router.post("/moveFolder", ensureAuthenticated, async (req, res) => {
  let data = req.body;
  logger.info("Move folder request: ", data);
  Runner.moveFolder(
    data.index,
    data.oldFolder,
    data.newFullPath,
    data.folderName
  );
  res.send({ msg: "success" });
});
router.post("/newFolder", ensureAuthenticated, async (req, res) => {
  let data = req.body;
  logger.info("New folder request: ", data);
  Runner.newFolder(data);
  res.send({ msg: "success" });
});
router.post("/newFiles", ensureAuthenticated, async (req, res) => {
  let data = req.body;
  logger.info("Adding a new file to server: ", data);
  Runner.newFile(data);
  res.send({ msg: "success" });
});
router.post("/selectFilament", ensureAuthenticated, async (req, res) => {
  let data = req.body;
  logger.info("Change filament request: ", data);
  let roll = await Runner.selectedFilament(data);
  res.send({ msg: roll });
});
router.post("/reScanOcto", ensureAuthenticated, async (req, res) => {
  let data = req.body;
  if(data.id === null){
    logger.info("Rescan All OctoPrint Requests: ", data);
    let printers = await Runner.returnFarmPrinters()
    for(let i=0;i<printers.length;i++){
      await Runner.reScanOcto(printers[i]._id);
    }
    logger.info("Full re-scan of OctoFarm completed");
    res.send({ msg: "Started a full farm rescan." });
  }else{
    logger.info("Rescan OctoPrint Requests: ", data);
    let reScan = await Runner.reScanOcto(data.id);
    logger.info("Rescan OctoPrint complete: ", reScan);
    res.send({ msg: reScan });
  }

});
router.post("/updateSortIndex", ensureAuthenticated, async (req, res) => {
  let data = req.body;
  logger.info("Update filament sorting request: ", data);
  Runner.updateSortIndex(data);
});
module.exports = router;
