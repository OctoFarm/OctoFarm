const express = require("express");
const router = express.Router();
const History = require("../models/History.js");
const { ensureAuthenticated } = require("../config/auth");
const Spools = require("../models/Filament.js");
const Profiles = require("../models/Profiles.js");
const ServerSettings = require("../models/ServerSettings.js");

router.post("/update", ensureAuthenticated, async (req, res) => {
  //Check required fields
  const latest = req.body;
  let note = latest.note;
  let filamentId = latest.filamentId;
  let history = await History.findOne({ _id: latest.id });
  if(history.printHistory.notes != note){
    history.printHistory.notes = note;
  }
  if(history.printHistory.filamentSelection != filamentId && filamentId != 0){
    let serverSettings = await ServerSettings.find({});
    let spool = await Spools.findById(filamentId);

    if(serverSettings[0].filamentManager){
      let profiles = await Profiles.find({})
      let profileIndex = _.findIndex(profiles, function(o) {
        return o.profile.index == spool.spools.profile;
      });
      spool.spools.profile = profiles[profileIndex].profile;
      history.printHistory.filamentSelection = spool;
    }else{
      let profile = await Profiles.findById(spool.spools.profile)
      spool.spools.profile = profile.profile;
      history.printHistory.filamentSelection = spool;
    }
  }else{
    history.printHistory.filamentSelection = null;
  }

  history.markModified("printHistory");
  history = history.save();
  res.send("success");
});
//Register Handle for Saving printers
router.post("/delete", ensureAuthenticated, async (req, res) => {
  //Check required fields
  const deleteHistory = req.body;
  await History.findOneAndDelete({ _id: deleteHistory.id });
  res.send("success");
});
router.get("/get", ensureAuthenticated, (req, res) => {
  History.find({}, null, { sort: { historyIndex: 1 } }).then(checked => {
    res.send({ history: checked });
  });
});

module.exports = router;
