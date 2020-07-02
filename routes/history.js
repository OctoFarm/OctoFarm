const express = require("express");
const router = express.Router();
const History = require("../models/History.js");
const { ensureAuthenticated } = require("../config/auth");
const Printers = require("../models/Printer.js");
const Spools = require("../models/Filament.js");
const Profiles = require("../models/Profiles.js");
const ServerSettings = require("../models/ServerSettings.js");
const _ = require("lodash");

router.post("/update", ensureAuthenticated, async (req, res) => {
  //Check required fields
  const latest = req.body;
  let note = latest.note;
  let filamentId = latest.filamentId;
  let history = await History.findOne({ _id: latest.id });
  if(history.printHistory.notes != note){
    history.printHistory.notes = note;
  }


    if(filamentId != 0){
      if(history.printHistory.filamentSelection !== null && history.printHistory.filamentSelection._id == filamentId){
        //Skip da save
      }else{
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
      }
    }else{
      history.printHistory.filamentSelection = null;
    }



  history.markModified("printHistory");
  history.save();
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
router.post("/updateCostMatch", ensureAuthenticated, async (req, res) => {
  //Check required fields
  const latest = req.body;

  //Find history
  let history = await History.findOne({ _id: latest.id });
  //match history name to printer ID
  let printers = await Printers.find({});
  let printer = _.findIndex(printers, function(o) { return o.settingsApperance.name == history.printHistory.printerName; });
  if(printer > -1){
    history.printHistory.costSettings = printers[printer].costSettings;
    history.markModified("printHistory")
    history.save();
    let send = {
      status: 200,
      printTime: history.printHistory.printTime,
      costSettings: printers[printer].costSettings,
    }
    res.send(send)
  }else{
    history.printHistory.costSettings =
    {
      powerConsumption: 0.5,
      electricityCosts: 0.15,
      purchasePrice: 500,
      estimateLifespan: 43800,
      maintenanceCosts: 0.25,
    };
    let send = {
      status: 400,
      printTime: history.printHistory.printTime,
      costSettings: history.printHistory.costSettings,
    }
    history.markModified("printHistory")
    history.save();
    res.send(send)
  }
});


module.exports = router;
