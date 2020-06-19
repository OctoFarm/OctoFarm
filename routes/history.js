const express = require("express");
const router = express.Router();
const History = require("../models/History.js");
const { ensureAuthenticated } = require("../config/auth");
const Printers = require("../models/Printer.js");
const Spools = require("../models/Filament.js");
const Profiles = require("../models/Profiles.js");
const ServerSettings = require("../models/ServerSettings.js");
const _ = require("lodash");
const historyClean = require("../lib/dataFunctions/historyClean.js");
const HistoryClean = historyClean.HistoryClean;

router.post("/update", ensureAuthenticated, async (req, res) => {
  //Check required fields
  const latest = req.body;
  let note = latest.note;
  let filamentId = latest.filamentId;
  let history = await History.findOne({ _id: latest.id });
  if(history.printHistory.notes != note){
    history.printHistory.notes = note;
  }
  for(let f = 0; f < filamentId.length; f++){
      if (Array.isArray(history.printHistory.filamentSelection)) {
        if (history.printHistory.filamentSelection[f] !== null && history.printHistory.filamentSelection[f]._id == filamentId) {
          //Skip da save
        } else {
          if(filamentId[f] != 0){
            let serverSettings = await ServerSettings.find({});
            let spool = await Spools.findById(filamentId[f]);

            if (serverSettings[0].filamentManager) {
              let profiles = await Profiles.find({})
              let profileIndex = _.findIndex(profiles, function (o) {
                return o.profile.index == spool.spools.profile;
              });
              spool.spools.profile = profiles[profileIndex].profile;
              history.printHistory.filamentSelection[f] = spool;
            } else {
              let profile = await Profiles.findById(spool.spools.profile)
              spool.spools.profile = profile.profile;
              history.printHistory.filamentSelection[f] = spool;
            }
          }else{
            filamentId.forEach((id,index) => {
              history.printHistory.filamentSelection[index] = null;
            })
          }

        }
      } else {
        if (history.printHistory.filamentSelection !== null && history.printHistory.filamentSelection._id == filamentId) {
          //Skip da save
        } else {
          history.printHistory.filamentSelection = [];
          if(filamentId[f] != 0) {
            let serverSettings = await ServerSettings.find({});
            let spool = await Spools.findById(filamentId[f]);

            if (serverSettings[0].filamentManager) {
              let profiles = await Profiles.find({})
              let profileIndex = _.findIndex(profiles, function (o) {
                return o.profile.index == spool.spools.profile;
              });
              spool.spools.profile = profiles[profileIndex].profile;
              history.printHistory.filamentSelection[f] = spool;
            } else {
              let profile = await Profiles.findById(spool.spools.profile)
              spool.spools.profile = profile.profile;
              history.printHistory.filamentSelection[f] = spool;
            }
          }else{
            filamentId.forEach((id,index) => {
              history.printHistory.filamentSelection[index] = null;
            })

          }
        }
      }
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
router.get("/get", ensureAuthenticated, async (req, res) => {
  let sorted = await HistoryClean.returnHistory();

  res.send({ history: sorted});
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
// router.get("/info/", ensureAuthenticated, function(req, res) {
//   //req.socket.setTimeout(Number.MAX_VALUE);
//   res.writeHead(200, {
//     "Content-Type": "text/event-stream", // <- Important headers
//     "Cache-Control": "no-cache",
//     Connection: "keep-alive"
//   });
//   res.write("\n");
//   (function(clientId) {
//     clients[clientId] = res; // <- Add this client to those we consider "attached"
//     req.on("close", function() {
//       delete clients[clientId];
//     }); // <- Remove this client when he disconnects
//   })(++clientId);
//   //console.log("Client: " + Object.keys(clients));
// });
// setInterval(async function() {
//   for (clientId in clients) {
//     for (clientId in clients) {
//       clients[clientId].write("data: " + historyTable + "\n\n"); // <- Push a message to a single attached client
//     }
//   }
// }, 10000);
module.exports = router;
